// @vitest-environment node
/**
 * Pruebas contra un SQLite de verdad (sql.js, el mismo motor que usa jeep-sqlite
 * en la versión web) en lugar de un mock que sólo comprueba el texto del SQL.
 *
 * Los mocks de prendas.spec.js confirmaban que se enviaba "saldo_pendiente + ?"
 * y nunca vieron que el resultado podía ser negativo. Aquí se ejecutan las
 * consultas y las migraciones reales y se mira lo que queda en la tabla.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { prepararMotor, nuevaBase } from '../../__tests__/helpers/sqliteReal.js';

vi.mock('../connection.js', async () =>
    (await import('../../__tests__/helpers/sqliteReal.js')).crearConexionFalsa());

import { db } from '../connection.js';
import { migrations } from '../migrations.js';
import { runMigrations } from '../migrationRunner.js';
import { createOrden, changeEstado, getOrdenById, getEntregasPorDia } from '../queries/ordenes.js';
import {
    createPrenda, updatePrenda, updateEstadoPrenda, getContextoPrenda, eliminarPrenda, addObservacion, saveFotografia
} from '../queries/prendas.js';
import { registrarPago, getPagosByOrden, getPagoById, anularPago, MENSAJE_PAGO_RECHAZADO } from '../queries/pagos.js';
import { getReporteFinanciero, getDashboardData } from '../queries/reportes.js';
import { validators } from '../../services/validators.js';
import { estadoDePago } from '../../services/estadoOrden.js';
import { cargarDiasAnticipacion, guardarDiasAnticipacion } from '../../composables/useConfiguracionNegocio.js';

const EFECTIVO = 1;
const PANTALON = 1;

async function leerOrden(id_orden) {
    const { values } = await db.query(
        'SELECT valor_total, saldo_pendiente FROM orden_trabajo WHERE id_orden = ?',
        [id_orden]
    );
    return values[0];
}

async function crearCliente() {
    const { changes } = await db.run(
        "INSERT INTO cliente (nombre, telefono) VALUES ('Ana', '3001234567')"
    );
    return changes.lastId;
}

async function nuevaOrden() {
    const id_cliente = await crearCliente();
    return createOrden({ id_cliente, fecha_entrega_estimada: '2026-09-20' });
}

function prenda(id_orden, valor, descripcion_arreglo = 'Basta') {
    return createPrenda({ descripcion_arreglo, valor, id_orden, id_tipo_prenda: PANTALON });
}

function pagar(id_orden, valor) {
    return registrarPago({ valor, id_orden, id_metodo_pago: EFECTIVO });
}

// Los tres ayudantes siguientes repiten lo que hacen los composables antes de
// escribir, para probar juntas la regla y la consulta.

async function editarPrecio(id_prenda, id_orden, valorNuevo) {
    const { totalOtrasPrendas, totalPagado } = await getContextoPrenda(id_prenda, id_orden);
    validators.validateValorPrendaContraPagos({ valorNuevo, totalOtrasPrendas, totalPagado });
    await updatePrenda(id_prenda, 'Basta', valorNuevo, id_orden);
}

async function quitarPrenda(id_prenda, id_orden) {
    const contexto = await getContextoPrenda(id_prenda, id_orden);
    validators.validateEliminarPrenda(contexto);
    return eliminarPrenda(id_prenda, id_orden, contexto);
}

async function anular(id_pago, motivo) {
    const pago = await getPagoById(id_pago);
    validators.validateAnularPago(pago, motivo);
    await anularPago(pago, motivo);
}

async function historial(id_orden) {
    const { values } = await db.query(
        'SELECT descripcion, id_tipo_actividad FROM historial_actividad WHERE id_orden = ? ORDER BY id_actividad',
        [id_orden]
    );
    return values;
}

async function contar(tabla, id_prenda) {
    const { values } = await db.query(`SELECT COUNT(*) AS n FROM ${tabla} WHERE id_prenda = ?`, [id_prenda]);
    return values[0].n;
}

beforeAll(async () => {
    await prepararMotor();
});

describe('Saldo de la orden contra SQLite real', () => {
    beforeEach(async () => {
        nuevaBase();
        await runMigrations(db, migrations);
    });

    it('crear prenda y pagar deja total y saldo coherentes, y devuelve los ids correctos', async () => {
        const id_orden = await nuevaOrden();

        const id_prenda = await prenda(id_orden, 100000);
        const id_pago = await pagar(id_orden, 30000);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 100000, saldo_pendiente: 70000 });

        // El recálculo va después del INSERT: el lastId tiene que seguir siendo el suyo.
        const filaPrenda = await db.query('SELECT id_prenda FROM prenda WHERE id_orden = ?', [id_orden]);
        const filaPago = await db.query('SELECT id_pago FROM pago WHERE id_orden = ?', [id_orden]);
        expect(id_prenda).toBe(filaPrenda.values[0].id_prenda);
        expect(id_pago).toBe(filaPago.values[0].id_pago);
    });

    it('RN-29: bajar el precio de una prenda ya pagada se rechaza y el saldo no se mueve', async () => {
        // El caso de la auditoría: $100.000 pagados, precio corregido a $60.000.
        // Antes el saldo quedaba en -$40.000.
        const id_orden = await nuevaOrden();
        const id_prenda = await prenda(id_orden, 100000);
        await pagar(id_orden, 100000);

        await expect(editarPrecio(id_prenda, id_orden, 60000))
            .rejects.toThrow('El saldo no puede quedar negativo.');

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 100000, saldo_pendiente: 0 });
    });

    it('RN-29: bajar el precio hasta exactamente lo pagado sí se permite', async () => {
        const id_orden = await nuevaOrden();
        const id_prenda = await prenda(id_orden, 100000);
        await pagar(id_orden, 60000);

        await editarPrecio(id_prenda, id_orden, 60000);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 60000, saldo_pendiente: 0 });
    });

    it('con varias prendas, el saldo es la suma de prendas menos la suma de pagos', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);
        await prenda(id_orden, 15000, 'Cremallera');
        await pagar(id_orden, 10000);
        await pagar(id_orden, 5000);

        await editarPrecio(basta, id_orden, 25000);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 40000, saldo_pendiente: 25000 });
    });

    it('no toca otras órdenes', async () => {
        const primera = await nuevaOrden();
        const segunda = await nuevaOrden();
        await prenda(primera, 20000);
        await prenda(segunda, 8000, 'Ruedo');
        await pagar(segunda, 8000);

        expect(await leerOrden(primera)).toEqual({ valor_total: 20000, saldo_pendiente: 20000 });
        expect(await leerOrden(segunda)).toEqual({ valor_total: 8000, saldo_pendiente: 0 });
    });

    it('no permite editar una prenda a través de una orden que no es la suya', async () => {
        const primera = await nuevaOrden();
        const segunda = await nuevaOrden();
        const id_prenda = await prenda(primera, 20000);

        await expect(getContextoPrenda(id_prenda, segunda)).rejects.toThrow('Prenda no encontrada');
    });
});

describe('P1-16 · el abono se comprueba en la misma sentencia que lo escribe', () => {
    beforeEach(async () => {
        nuevaBase();
        await runMigrations(db, migrations);
    });

    it('un abono que ya no cabe en el saldo se rechaza sin dejar rastro, ni en el historial', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 20000);
        await pagar(id_orden, 20000);
        const antes = (await historial(id_orden)).length;

        await expect(pagar(id_orden, 20000)).rejects.toThrow(MENSAJE_PAGO_RECHAZADO);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 20000, saldo_pendiente: 0 });
        expect(await getPagosByOrden(id_orden)).toHaveLength(1);
        expect(await historial(id_orden)).toHaveLength(antes);
    });

    it('un pago anulado libera su parte del saldo', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 20000);
        const erroneo = await pagar(id_orden, 20000);
        await anular(erroneo, 'Monto equivocado');

        await pagar(id_orden, 20000);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 20000, saldo_pendiente: 0 });
    });

    it('P1-15: la base tampoco acepta pagos en una orden cancelada', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 20000);
        await db.run('UPDATE orden_trabajo SET id_estado_orden = 5 WHERE id_orden = ?', [id_orden]);

        await expect(pagar(id_orden, 5000)).rejects.toThrow(MENSAJE_PAGO_RECHAZADO);
    });

    it('un abono de cero tampoco pasa por la base', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 20000);

        await expect(pagar(id_orden, 0)).rejects.toThrow(MENSAJE_PAGO_RECHAZADO);
    });
});

describe('P1-9 · anular pagos contra SQLite real', () => {
    beforeEach(async () => {
        nuevaBase();
        await runMigrations(db, migrations);
    });

    it('el pago anulado sigue existiendo, deja de contar en el saldo y queda en el historial', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 100000);
        const id_pago = await pagar(id_orden, 30000);

        await anular(id_pago, 'Se registró dos veces');

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 100000, saldo_pendiente: 100000 });

        const [pago] = await getPagosByOrden(id_orden);
        expect(pago.id_pago).toBe(id_pago);
        expect(pago.anulado_en).toBeTruthy();
        expect(pago.motivo_anulacion).toBe('Se registró dos veces');

        const ultimo = (await historial(id_orden)).at(-1);
        expect(ultimo).toEqual({ descripcion: 'Pago de $30000 anulado: Se registró dos veces', id_tipo_actividad: 8 });
    });

    it('un pago no se anula dos veces', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 50000);
        const id_pago = await pagar(id_orden, 20000);

        await anular(id_pago, 'Error');

        await expect(anular(id_pago, 'Otra vez')).rejects.toThrow('Este pago ya está anulado.');
        expect(await leerOrden(id_orden)).toEqual({ valor_total: 50000, saldo_pendiente: 50000 });
    });

    it('los pagos vigentes se listan antes que los anulados', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 50000);
        const primero = await pagar(id_orden, 10000);
        const segundo = await pagar(id_orden, 5000);

        await anular(primero, 'Error');

        const lista = await getPagosByOrden(id_orden);
        expect(lista.map(p => p.id_pago)).toEqual([segundo, primero]);
    });

    it('los ingresos del reporte financiero no cuentan los pagos anulados', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 50000);
        await pagar(id_orden, 10000);
        const erroneo = await pagar(id_orden, 7000);

        await anular(erroneo, 'Error');

        const reporte = await getReporteFinanciero('2000-01-01', '2999-12-31');
        expect(reporte.kpis.ingresosTotales).toBe(10000);
        expect(reporte.graficos.ingresosPorDia.data).toEqual([10000]);
    });

    it('anular un pago deja volver a eliminar prendas que antes lo impedía', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 20000);
        const sobrante = await prenda(id_orden, 30000, 'Cremallera');
        const id_pago = await pagar(id_orden, 40000);

        await expect(quitarPrenda(sobrante, id_orden)).rejects.toThrow('Anula primero el pago que corresponda.');

        await anular(id_pago, 'Monto equivocado');
        await quitarPrenda(sobrante, id_orden);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 20000, saldo_pendiente: 20000 });
    });
});

describe('P1-9 · eliminar prendas contra SQLite real', () => {
    beforeEach(async () => {
        nuevaBase();
        await runMigrations(db, migrations);
    });

    it('borra la prenda con sus observaciones y fotos, recalcula y lo registra', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 20000);
        const id_prenda = await prenda(id_orden, 15000, 'Cremallera');
        await addObservacion(id_prenda, 'Color azul');
        await saveFotografia(id_prenda, 'prenda_2_1.jpeg');
        await pagar(id_orden, 5000);

        const rutas = await quitarPrenda(id_prenda, id_orden);

        expect(rutas).toEqual(['prenda_2_1.jpeg']);
        expect(await contar('prenda', id_prenda)).toBe(0);
        expect(await contar('observacion', id_prenda)).toBe(0);
        expect(await contar('fotografia', id_prenda)).toBe(0);
        expect(await leerOrden(id_orden)).toEqual({ valor_total: 20000, saldo_pendiente: 15000 });

        const ultimo = (await historial(id_orden)).at(-1);
        expect(ultimo).toEqual({ descripcion: `Prenda #${id_prenda} eliminada: Cremallera ($15000)`, id_tipo_actividad: 9 });
    });

    it('RN-29: no elimina si el cliente ya pagó más de lo que quedaría', async () => {
        const id_orden = await nuevaOrden();
        await prenda(id_orden, 20000);
        const id_prenda = await prenda(id_orden, 15000, 'Cremallera');
        await pagar(id_orden, 30000);

        await expect(quitarPrenda(id_prenda, id_orden)).rejects.toThrow('pero el cliente ya pagó $30000');

        expect(await contar('prenda', id_prenda)).toBe(1);
        expect(await leerOrden(id_orden)).toEqual({ valor_total: 35000, saldo_pendiente: 5000 });
    });

    it('no elimina una prenda ya entregada', async () => {
        const id_orden = await nuevaOrden();
        const id_prenda = await prenda(id_orden, 20000);
        await db.run('UPDATE prenda SET id_estado_prenda = 4 WHERE id_prenda = ?', [id_prenda]);

        await expect(quitarPrenda(id_prenda, id_orden))
            .rejects.toThrow('Una prenda ya entregada al cliente no se puede eliminar.');
    });
});

describe('Estado de la orden derivado de sus prendas contra SQLite real', () => {
    const P = { PENDIENTE: 1, EN_PROCESO: 2, TERMINADA: 3, ENTREGADA: 4 };

    async function estado(id_orden) {
        const { values } = await db.query(
            'SELECT id_estado_orden, fecha_entrega_real FROM orden_trabajo WHERE id_orden = ?',
            [id_orden]
        );
        return values[0];
    }

    /** Lo mismo que hace usePrendas.changeEstado antes de escribir. */
    async function cambiarPrenda(id_prenda, id_orden, nuevo) {
        const { estadoPrenda } = await getContextoPrenda(id_prenda, id_orden);
        validators.validateCambioEstadoPrenda(estadoPrenda, nuevo);
        return updateEstadoPrenda(id_prenda, nuevo, id_orden);
    }

    async function notificaciones(id_orden) {
        const { values } = await db.query('SELECT COUNT(*) AS n FROM notificacion WHERE id_orden = ?', [id_orden]);
        return values[0].n;
    }

    beforeEach(async () => {
        nuevaBase();
        await runMigrations(db, migrations);
    });

    it('RN-04 y RN-17: nace Pendiente y pasa sola a En Proceso con la primera prenda', async () => {
        const id_orden = await nuevaOrden();
        expect((await estado(id_orden)).id_estado_orden).toBe(1);

        await prenda(id_orden, 20000);

        expect((await estado(id_orden)).id_estado_orden).toBe(2);
        const transicion = (await historial(id_orden)).at(-2);
        expect(transicion.descripcion).toBe('Estado cambiado automáticamente a En Proceso porque hay prendas pendientes o en proceso');
    });

    it('RN-06 / CP-46: terminar la última prenda pasa la orden sola a Lista y genera la notificación', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);
        const ruedo = await prenda(id_orden, 10000, 'Ruedo');

        await cambiarPrenda(basta, id_orden, P.TERMINADA);
        expect((await estado(id_orden)).id_estado_orden).toBe(2);

        const transicion = await cambiarPrenda(ruedo, id_orden, P.TERMINADA);

        expect(transicion).toEqual({ desde: 2, hacia: 3 });
        expect((await estado(id_orden)).id_estado_orden).toBe(3);
        expect(await notificaciones(id_orden)).toBe(1);
    });

    it('RN-17 / CP-47: si una prenda vuelve a En Proceso, la orden también', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);
        await cambiarPrenda(basta, id_orden, P.TERMINADA);
        expect((await estado(id_orden)).id_estado_orden).toBe(3);

        await cambiarPrenda(basta, id_orden, P.EN_PROCESO);

        expect((await estado(id_orden)).id_estado_orden).toBe(2);
    });

    it('RN-17: añadir una prenda a una orden Lista la devuelve a En Proceso', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);
        await cambiarPrenda(basta, id_orden, P.TERMINADA);

        await prenda(id_orden, 5000, 'Botón');

        expect((await estado(id_orden)).id_estado_orden).toBe(2);
    });

    it('P1-10: eliminar la única prenda pendiente deja la orden Lista', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);
        const sobrante = await prenda(id_orden, 10000, 'Ruedo');
        await cambiarPrenda(basta, id_orden, P.TERMINADA);

        await quitarPrenda(sobrante, id_orden);

        expect((await estado(id_orden)).id_estado_orden).toBe(3);
        expect(await notificaciones(id_orden)).toBe(1);
    });

    it('RN-04: eliminar la última prenda devuelve la orden a Pendiente', async () => {
        const id_orden = await nuevaOrden();
        const unica = await prenda(id_orden, 20000);

        await quitarPrenda(unica, id_orden);

        expect((await estado(id_orden)).id_estado_orden).toBe(1);
    });

    it('RN-09 / CP-19: entregar todas las prendas entrega la orden con fecha', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);
        await cambiarPrenda(basta, id_orden, P.TERMINADA);

        await cambiarPrenda(basta, id_orden, P.ENTREGADA);

        const orden = await estado(id_orden);
        expect(orden.id_estado_orden).toBe(4);
        expect(orden.fecha_entrega_real).toBeTruthy();
    });

    it('CP-18: no se entrega una prenda sin terminar', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);

        await expect(cambiarPrenda(basta, id_orden, P.ENTREGADA))
            .rejects.toThrow('Sólo se puede entregar una prenda terminada.');

        expect((await getContextoPrenda(basta, id_orden)).estadoPrenda).toBe(1);
        expect((await estado(id_orden)).id_estado_orden).toBe(2);
    });

    it('RN-16 / CP-22: reabrir una orden entregada la deja En Proceso y registra la reapertura', async () => {
        const id_orden = await nuevaOrden();
        const basta = await prenda(id_orden, 20000);
        await cambiarPrenda(basta, id_orden, P.TERMINADA);
        await cambiarPrenda(basta, id_orden, P.ENTREGADA);

        const entregada = { id_estado_orden: 4 };
        validators.validateCambioManualEstado(entregada, 2);
        await changeEstado(id_orden, 2, 'En Proceso', entregada);

        expect((await estado(id_orden)).id_estado_orden).toBe(2);
        expect((await historial(id_orden)).at(-1).id_tipo_actividad).toBe(7);

        // Tras corregir, la orden vuelve a avanzar sola.
        await cambiarPrenda(basta, id_orden, P.TERMINADA);
        expect((await estado(id_orden)).id_estado_orden).toBe(3);
    });
});

describe('RN-04, RN-28 y RN-38 contra SQLite real', () => {
    beforeEach(async () => {
        nuevaBase();
        await runMigrations(db, migrations);
    });

    async function ordenParaFecha(fecha, { conPrenda }) {
        const id_cliente = await crearCliente();
        const id_orden = await createOrden({ id_cliente, fecha_entrega_estimada: fecha });
        if (conPrenda) await prenda(id_orden, 20000);
        return id_orden;
    }

    it('RN-04: una orden sin prendas no cuenta como activa, atrasada ni próxima entrega', async () => {
        const vacia = await ordenParaFecha('2020-01-01', { conPrenda: false });
        const conTrabajo = await ordenParaFecha('2020-01-01', { conPrenda: true });

        const { kpis, proximasEntregas } = await getDashboardData();

        expect(kpis.ordenesActivas).toBe(1);
        expect(kpis.ordenesAtrasadas).toBe(1);
        expect(proximasEntregas.map(o => o.id_orden)).toEqual([conTrabajo]);
        expect(proximasEntregas.map(o => o.id_orden)).not.toContain(vacia);
    });

    it('RN-04: los recordatorios del día no cuentan órdenes sin prendas', async () => {
        await ordenParaFecha('2026-10-01', { conPrenda: false });
        await ordenParaFecha('2026-10-01', { conPrenda: true });

        expect(await getEntregasPorDia('2026-10-01', '2026-10-01')).toEqual([{ dia: '2026-10-01', total: 1 }]);
    });

    it('RN-28 / CP-77 / CP-78: la orden queda Pagada al saldar, y vuelve a Pendiente si se anula un pago', async () => {
        const id_orden = await ordenParaFecha('2026-10-01', { conPrenda: true });

        const abono = await pagar(id_orden, 5000);
        expect(estadoDePago(await getOrdenById(id_orden))).toBe('Pendiente');

        await pagar(id_orden, 15000);
        expect(estadoDePago(await getOrdenById(id_orden))).toBe('Pagada');

        await anular(abono, 'Se registró dos veces');
        expect(estadoDePago(await getOrdenById(id_orden))).toBe('Pendiente');
    });

    it('RN-38: los días de anticipación salen de la configuración del negocio y se pueden cambiar', async () => {
        expect(await cargarDiasAnticipacion()).toBe(3);

        await guardarDiasAnticipacion(7);
        expect(await cargarDiasAnticipacion()).toBe(7);

        await expect(guardarDiasAnticipacion(45))
            .rejects.toThrow('Los días de anticipación deben ser un número entero entre 0 y 30.');
        await expect(guardarDiasAnticipacion(''))
            .rejects.toThrow('Los días de anticipación deben ser un número entero entre 0 y 30.');
        expect(await cargarDiasAnticipacion()).toBe(7);
    });
});

describe('Migraciones contra SQLite real', () => {
    beforeEach(() => {
        nuevaBase();
    });

    it('la v2 recalcula los saldos que la v1 dejó descuadrados', async () => {
        await runMigrations(db, migrations.filter(m => m.toVersion === 1));

        // Una orden con los totales corrompidos, como los dejaba la suma por diferencias.
        const id_cliente = await crearCliente();
        const { changes } = await db.run(
            `INSERT INTO orden_trabajo (fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden)
             VALUES ('2026-09-20', 999, -500, ?, 1)`,
            [id_cliente]
        );
        const id_orden = changes.lastId;
        await db.run("INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES ('Basta', 100, ?, 1, 1)", [id_orden]);
        await db.run('INSERT INTO pago (valor, id_orden, id_metodo_pago) VALUES (40, ?, 1)', [id_orden]);
        // Una orden sin prendas ni pagos también debe quedar en cero.
        const { changes: vacia } = await db.run(
            `INSERT INTO orden_trabajo (fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden)
             VALUES ('2026-09-20', 50, 50, ?, 1)`,
            [id_cliente]
        );

        const aplicadas = await runMigrations(db, migrations);

        expect(aplicadas).toEqual([2, 3, 4, 5]);
        expect(await leerOrden(id_orden)).toEqual({ valor_total: 100, saldo_pendiente: 60 });
        expect(await leerOrden(vacia.lastId)).toEqual({ valor_total: 0, saldo_pendiente: 0 });
    });

    it('la v3 conserva los pagos existentes como vigentes', async () => {
        await runMigrations(db, migrations.filter(m => m.toVersion <= 2));
        const id_orden = await nuevaOrden();
        await db.run("INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES ('Basta', 100, ?, 1, 1)", [id_orden]);
        await db.run('INSERT INTO pago (valor, id_orden, id_metodo_pago) VALUES (40, ?, 1)', [id_orden]);

        await runMigrations(db, migrations);

        const [pago] = await getPagosByOrden(id_orden);
        expect(pago.anulado_en).toBeNull();
        expect(pago.motivo_anulacion).toBeNull();
    });

    it('la v4 ajusta el estado de las órdenes abiertas a sus prendas y lo registra', async () => {
        await runMigrations(db, migrations.filter(m => m.toVersion <= 3));

        // Órdenes como las dejaban los botones manuales de la v3.
        async function ordenCon(estadoOrden, estadosPrendas) {
            const id_orden = await nuevaOrden();
            await db.run('UPDATE orden_trabajo SET id_estado_orden = ? WHERE id_orden = ?', [estadoOrden, id_orden]);
            for (const estadoPrenda of estadosPrendas) {
                await db.run(
                    "INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES ('Basta', 100, ?, 1, ?)",
                    [id_orden, estadoPrenda]
                );
            }
            return id_orden;
        }

        const pendienteConTrabajo = await ordenCon(1, [1]);
        const listaConPendientes = await ordenCon(3, [3, 2]);
        const enProcesoTerminada = await ordenCon(2, [3, 4]);
        const enProcesoVacia = await ordenCon(2, []);
        const yaCorrecta = await ordenCon(2, [1]);
        const entregada = await ordenCon(4, [1]);
        const cancelada = await ordenCon(5, [3]);
        const abiertaTodoEntregado = await ordenCon(2, [4]);

        const aplicadas = await runMigrations(db, migrations);
        expect(aplicadas).toEqual([4, 5]);

        const estadoDe = async (id) =>
            (await db.query('SELECT id_estado_orden FROM orden_trabajo WHERE id_orden = ?', [id])).values[0].id_estado_orden;

        expect(await estadoDe(pendienteConTrabajo)).toBe(2);
        expect(await estadoDe(listaConPendientes)).toBe(2);
        expect(await estadoDe(enProcesoTerminada)).toBe(3);
        expect(await estadoDe(enProcesoVacia)).toBe(1);
        expect(await estadoDe(yaCorrecta)).toBe(2);
        expect(await estadoDe(entregada)).toBe(4);
        expect(await estadoDe(cancelada)).toBe(5);
        expect(await estadoDe(abiertaTodoEntregado)).toBe(2);

        const { values } = await db.query(
            "SELECT COUNT(*) AS n FROM historial_actividad WHERE descripcion LIKE 'Estado ajustado automáticamente%'"
        );
        expect(values[0].n).toBe(4);
        expect((await historial(listaConPendientes)).at(-1).descripcion)
            .toBe('Estado ajustado automáticamente a En Proceso: hay prendas pendientes o en proceso');
    });

    it('la v5 fecha las órdenes que ya estaban Lista con su última entrada en ese estado', async () => {
        await runMigrations(db, migrations.filter(m => m.toVersion <= 4));

        async function ordenEn(estado, fechaEstimada) {
            const id_orden = await createOrden({ id_cliente: await crearCliente(), fecha_entrega_estimada: fechaEstimada });
            await db.run('UPDATE orden_trabajo SET id_estado_orden = ? WHERE id_orden = ?', [estado, id_orden]);
            return id_orden;
        }
        async function registrar(id_orden, descripcion, fecha_hora) {
            await db.run(
                'INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad, fecha_hora) VALUES (?, ?, 3, ?)',
                [descripcion, id_orden, fecha_hora]
            );
        }

        // Pasó por Lista dos veces: cuenta la última.
        const conHistorial = await ordenEn(3, '2026-01-01');
        await registrar(conHistorial, 'Estado cambiado a Lista para Entregar', '2026-01-05 10:00:00');
        await registrar(conHistorial, 'Estado cambiado automáticamente a En Proceso porque hay prendas pendientes o en proceso', '2026-01-06 10:00:00');
        await registrar(conHistorial, 'Estado cambiado automáticamente a Lista para Entregar porque todas las prendas están terminadas', '2026-01-08 10:00:00');
        const ajustadaPorV4 = await ordenEn(3, '2026-01-15');
        await registrar(ajustadaPorV4, 'Estado ajustado automáticamente a Lista para Entregar: todas las prendas están terminadas', '2026-01-20 08:00:00');
        const sinHistorial = await ordenEn(3, '2026-02-01');
        const enProceso = await ordenEn(2, '2026-03-01');

        expect(await runMigrations(db, migrations)).toEqual([5]);

        const fechaLista = async (id) =>
            (await db.query('SELECT fecha_lista FROM orden_trabajo WHERE id_orden = ?', [id])).values[0].fecha_lista;
        expect(await fechaLista(conHistorial)).toBe('2026-01-08 10:00:00');
        expect(await fechaLista(ajustadaPorV4)).toBe('2026-01-20 08:00:00');
        expect(await fechaLista(sinHistorial)).toBe('2026-02-01');
        expect(await fechaLista(enProceso)).toBeNull();
    });

    it('una base nueva queda en la última versión', async () => {
        await runMigrations(db, migrations);
        const { values } = await db.query('SELECT MAX(version) AS version FROM schema_migrations');
        expect(values[0].version).toBe(Math.max(...migrations.map(m => m.toVersion)));
    });
});
