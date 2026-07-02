import { db } from '../connection.js';

export async function getDashboardData() {
    if (!db) throw new Error("Database not initialized");
    
    const kpis = {
        ordenesActivas: 0,
        ordenesEnProceso: 0,
        ordenesListas: 0,
        ordenesAtrasadas: 0,
        ordenesSinReclamar: 0,
        saldosPendientes: 0
    };

    // Ordenes Activas (1=Pendiente, 2=En Proceso)
    const resActivas = await db.query(
        "SELECT count(*) as total FROM orden_trabajo WHERE id_estado_orden IN (1, 2)"
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
    const today = new Date().toISOString().split('T')[0];
    const resAtrasadas = await db.query(
        "SELECT count(*) as total FROM orden_trabajo WHERE date(fecha_entrega_estimada) < ? AND id_estado_orden NOT IN (4, 5)",
        [today]
    );
    kpis.ordenesAtrasadas = resAtrasadas.values[0]?.total || 0;

    // Ordenes Sin Reclamar (3=Lista para entrega y fecha de entrega estimada < hoy - 30 días)
    const resSinReclamar = await db.query(
        "SELECT count(*) as total FROM orden_trabajo WHERE id_estado_orden = 3 AND date(fecha_entrega_estimada) < date(?, '-30 days')",
        [today]
    );
    kpis.ordenesSinReclamar = resSinReclamar.values[0]?.total || 0;

    // Saldos Pendientes (not Cancelada)
    const resSaldo = await db.query(
        "SELECT SUM(saldo_pendiente) as total FROM orden_trabajo WHERE saldo_pendiente > 0 AND id_estado_orden != 5"
    );
    kpis.saldosPendientes = resSaldo.values[0]?.total || 0;

    // Próximas Entregas (Ordenes activas ordenadas por fecha de entrega asc)
    const resProximas = await db.query(`
        SELECT o.*, c.nombre as cliente_nombre, e.nombre as estado_nombre 
        FROM orden_trabajo o
        JOIN cliente c ON o.id_cliente = c.id_cliente
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        WHERE o.id_estado_orden NOT IN (4, 5)
        ORDER BY o.fecha_entrega_estimada ASC
        LIMIT 5
    `);

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
        "SELECT SUM(valor) as total FROM pago WHERE date(fecha_pago) >= ? AND date(fecha_pago) <= ?",
        [startDate, endDate]
    );
    reporte.kpis.ingresosTotales = resPagos.values[0]?.total || 0;

    // 2. Órdenes Nuevas y Ticket Promedio
    const resOrdenes = await db.query(
        "SELECT count(id_orden) as total, SUM(valor_total) as valor_sum FROM orden_trabajo WHERE date(fecha_creacion) >= ? AND date(fecha_creacion) <= ?",
        [startDate, endDate]
    );
    reporte.kpis.ordenesNuevas = resOrdenes.values[0]?.total || 0;
    const valorSum = resOrdenes.values[0]?.valor_sum || 0;
    reporte.kpis.ticketPromedio = reporte.kpis.ordenesNuevas > 0 ? (valorSum / reporte.kpis.ordenesNuevas).toFixed(2) : 0;

    // 3. Prendas Procesadas (en base a órdenes creadas en el rango)
    const resPrendas = await db.query(`
        SELECT count(p.id_prenda) as total 
        FROM prenda p
        JOIN orden_trabajo o ON p.id_orden = o.id_orden
        WHERE date(o.fecha_creacion) >= ? AND date(o.fecha_creacion) <= ?
    `, [startDate, endDate]);
    reporte.kpis.prendasProcesadas = resPrendas.values[0]?.total || 0;

    // 4. Serie de Tiempo: Ingresos por Día
    const resIngresosDia = await db.query(`
        SELECT date(fecha_pago) as fecha, SUM(valor) as diario
        FROM pago
        WHERE date(fecha_pago) >= ? AND date(fecha_pago) <= ?
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
