import { db } from '../connection.js';
import { fechaLocalISO } from '../../services/fechas.js';
import { interpretarDiasSinReclamar } from '../../services/vencimientos.js';
import { condicionOrdenActiva } from './estadoOrden.js';

export async function getDashboardData() {
    if (!db) throw new Error("Database not initialized");
    
    const kpis = {
        ordenesActivas: 0,
        ordenesEnProceso: 0,
        ordenesListas: 0,
        ordenesAtrasadas: 0,
        ordenesSinReclamar: 0,
        diasSinReclamar: 0,
        saldosPendientes: 0,
        ordenesPorCobrar: 0
    };

    // Órdenes activas (RN-04): con prendas y sin cerrar, es decir En Proceso o
    // Lista para Entregar. Una orden sin prendas todavía no cuenta.
    const resActivas = await db.query(
        `SELECT count(*) as total FROM orden_trabajo WHERE ${condicionOrdenActiva()}`
    );
    kpis.ordenesActivas = resActivas.values[0]?.total || 0;

    // Ordenes En Proceso (2=En Proceso)
    const resProceso = await db.query(
        "SELECT count(*) as total FROM orden_trabajo WHERE id_estado_orden = 2"
    );
    kpis.ordenesEnProceso = resProceso.values[0]?.total || 0;

    // Ordenes Listas para Entrega (3=Lista)
    const resListas = await db.query(
        "SELECT count(*) as total FROM orden_trabajo WHERE id_estado_orden = 3"
    );
    kpis.ordenesListas = resListas.values[0]?.total || 0;

    // Ordenes Atrasadas (fecha_entrega_estimada < hoy y no entregada/cancelada)
    // Hora local: la base guarda las fechas con datetime('now','localtime').
    const today = fechaLocalISO();
    const resAtrasadas = await db.query(
        `SELECT count(*) as total FROM orden_trabajo WHERE date(fecha_entrega_estimada) < ? AND ${condicionOrdenActiva()}`,
        [today]
    );
    kpis.ordenesAtrasadas = resAtrasadas.values[0]?.total || 0;

    // Órdenes sin reclamar (RN-37): más de N días desde que quedaron Lista para
    // Entregar. Antes se contaba desde la fecha estimada de entrega, y una orden
    // atrasada que se terminaba hoy ya salía "sin reclamar" (P1-11).
    // Ley 1480 de 2011, art. 18, y Decreto 1413 de 2018: el plazo para requerir
    // al cliente corre desde la fecha prevista de devolución. Si la orden quedó
    // Lista antes de lo prometido, se cuenta desde la fecha prometida: al
    // cliente no se le puede correr el tiempo antes de lo acordado.
    const resDias = await db.query("SELECT valor FROM configuracion WHERE clave = 'dias_sin_reclamar'");
    const diasSinReclamar = interpretarDiasSinReclamar(resDias.values?.[0]?.valor);
    const resSinReclamar = await db.query(
        `SELECT count(*) as total FROM orden_trabajo
         WHERE id_estado_orden = 3
           AND fecha_lista IS NOT NULL
           AND MAX(date(fecha_lista), date(fecha_entrega_estimada)) < date(?, ?)`,
        [today, `-${diasSinReclamar} days`]
    );
    kpis.ordenesSinReclamar = resSinReclamar.values[0]?.total || 0;
    kpis.diasSinReclamar = diasSinReclamar;

    // Saldos Pendientes (not Cancelada)
    const resSaldo = await db.query(
        "SELECT SUM(saldo_pendiente) as total, COUNT(*) as ordenes FROM orden_trabajo WHERE saldo_pendiente > 0 AND id_estado_orden != 5"
    );
    kpis.saldosPendientes = resSaldo.values[0]?.total || 0;
    kpis.ordenesPorCobrar = resSaldo.values[0]?.ordenes || 0;

    // Atrasadas: activas con la fecha de entrega ya pasada, la más vieja primero.
    const resListaAtrasadas = await db.query(`
        SELECT o.*, c.nombre as cliente_nombre, e.nombre as estado_nombre
        FROM orden_trabajo o
        JOIN cliente c ON o.id_cliente = c.id_cliente
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        WHERE ${condicionOrdenActiva('o')} AND date(o.fecha_entrega_estimada) < ?
        ORDER BY o.fecha_entrega_estimada ASC
        LIMIT 5
    `, [today]);

    // Próximas entregas: activas desde hoy en adelante. Las atrasadas van en su
    // propia lista para que no ocupen estos puestos.
    const resProximas = await db.query(`
        SELECT o.*, c.nombre as cliente_nombre, e.nombre as estado_nombre
        FROM orden_trabajo o
        JOIN cliente c ON o.id_cliente = c.id_cliente
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        WHERE ${condicionOrdenActiva('o')} AND date(o.fecha_entrega_estimada) >= ?
        ORDER BY o.fecha_entrega_estimada ASC
        LIMIT 5
    `, [today]);

    // Actividad Reciente
    const resRecientes = await db.query(`
        SELECT o.*, c.nombre as cliente_nombre, e.nombre as estado_nombre 
        FROM orden_trabajo o
        JOIN cliente c ON o.id_cliente = c.id_cliente
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        ORDER BY o.fecha_creacion DESC
        LIMIT 5
    `);

    return {
        kpis,
        atrasadas: resListaAtrasadas.values || [],
        proximasEntregas: resProximas.values || [],
        ordenesRecientes: resRecientes.values || []
    };
}

export async function getReporteFinanciero(startDate, endDate) {
    if (!db) throw new Error("Database not initialized");
    
    const reporte = {
        kpis: {
            ingresosTotales: 0,
            ordenesNuevas: 0,
            prendasProcesadas: 0,
            ticketPromedio: 0
        },
        graficos: {
            ingresosPorDia: { labels: [], data: [] },
            estadoOrdenes: { labels: [], data: [] }
        }
    };

    // 1. Ingresos Totales
    const resPagos = await db.query(
        "SELECT SUM(valor) as total FROM pago WHERE anulado_en IS NULL AND date(fecha_pago) >= ? AND date(fecha_pago) <= ?",
        [startDate, endDate]
    );
    reporte.kpis.ingresosTotales = resPagos.values[0]?.total || 0;

    // 2. Órdenes Nuevas y Ticket Promedio
    // Las canceladas no son trabajo: antes una orden cancelada de $300.000 subía
    // el promedio de dos órdenes de $20.000 y $40.000 a $120.000. Las órdenes sin
    // prendas (valor 0, recién creadas) tampoco cuentan para el promedio.
    const resOrdenes = await db.query(
        `SELECT count(id_orden) as total,
                SUM(CASE WHEN valor_total > 0 THEN 1 ELSE 0 END) as con_valor,
                SUM(valor_total) as valor_sum
         FROM orden_trabajo
         WHERE id_estado_orden <> 5 AND date(fecha_creacion) >= ? AND date(fecha_creacion) <= ?`,
        [startDate, endDate]
    );
    reporte.kpis.ordenesNuevas = resOrdenes.values[0]?.total || 0;
    const conValor = resOrdenes.values[0]?.con_valor || 0;
    const valorSum = resOrdenes.values[0]?.valor_sum || 0;
    // Número redondeado a pesos (antes toFixed devolvía un texto con centavos)
    reporte.kpis.ticketPromedio = conValor > 0 ? Math.round(valorSum / conValor) : 0;

    // 3. Prendas Procesadas (de órdenes recibidas en el rango y no canceladas)
    const resPrendas = await db.query(`
        SELECT count(p.id_prenda) as total 
        FROM prenda p
        JOIN orden_trabajo o ON p.id_orden = o.id_orden
        WHERE o.id_estado_orden <> 5 AND date(o.fecha_creacion) >= ? AND date(o.fecha_creacion) <= ?
    `, [startDate, endDate]);
    reporte.kpis.prendasProcesadas = resPrendas.values[0]?.total || 0;

    // 4. Serie de Tiempo: Ingresos por Día
    const resIngresosDia = await db.query(`
        SELECT date(fecha_pago) as fecha, SUM(valor) as diario
        FROM pago
        WHERE anulado_en IS NULL AND date(fecha_pago) >= ? AND date(fecha_pago) <= ?
        GROUP BY date(fecha_pago)
        ORDER BY fecha ASC
    `, [startDate, endDate]);
    
    if (resIngresosDia.values) {
        for (let row of resIngresosDia.values) {
            reporte.graficos.ingresosPorDia.labels.push(row.fecha);
            reporte.graficos.ingresosPorDia.data.push(row.diario);
        }
    }

    // 5. Dona: Estado de Órdenes en ese período
    const resEstados = await db.query(`
        SELECT e.nombre as estado, count(o.id_orden) as cantidad
        FROM orden_trabajo o
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        WHERE date(o.fecha_creacion) >= ? AND date(o.fecha_creacion) <= ?
        GROUP BY e.id_estado_orden
    `, [startDate, endDate]);

    if (resEstados.values) {
        for (let row of resEstados.values) {
            reporte.graficos.estadoOrdenes.labels.push(row.estado);
            reporte.graficos.estadoOrdenes.data.push(row.cantidad);
        }
    }

    return reporte;
}
