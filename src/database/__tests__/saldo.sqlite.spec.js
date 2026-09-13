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
import initSqlJs from 'sql.js';

const motor = vi.hoisted(() => ({ SQL: null, base: null }));

vi.mock('../connection.js', () => {
    const ultimoId = () => motor.base.exec('SELECT last_insert_rowid()')[0].values[0][0];

    // Adaptador con la misma forma que SQLiteDBConnection de
    // @capacitor-community/sqlite, limitado a lo que usa la app.
    const db = {
        async query(sql, params = []) {
            const sentencia = motor.base.prepare(sql);
            sentencia.bind(params);
            const values = [];
            while (sentencia.step()) values.push(sentencia.getAsObject());
            sentencia.free();
            return { values };
        },
        async run(sql, params = []) {
            motor.base.run(sql, params);
            return { changes: { lastId: ultimoId() } };
        },
        async execute(sql) {
            motor.base.exec(sql);
            return { changes: {} };
        },
        async executeSet(set, transaction = true) {
            if (transaction) motor.base.exec('BEGIN');
            try {
                for (const { statement, values } of set) motor.base.run(statement, values ?? []);
                if (transaction) motor.base.exec('COMMIT');
                return { changes: { lastId: ultimoId() } };
            } catch (error) {
                if (transaction) motor.base.exec('ROLLBACK');
                throw error;
            }
        },
        async beginTransaction() { motor.base.exec('BEGIN'); },
        async commitTransaction() { motor.base.exec('COMMIT'); },
        async rollbackTransaction() { motor.base.exec('ROLLBACK'); }
    };

    return { db, saveDb: async () => {} };
});

import { db } from '../connection.js';
import { migrations } from '../migrations.js';
import { runMigrations } from '../migrationRunner.js';
import { createOrden } from '../queries/ordenes.js';
import {
    createPrenda, updatePrenda, getContextoPrenda, eliminarPrenda, addObservacion, saveFotografia
} from '../queries/prendas.js';
import { registrarPago, getPagosByOrden, getPagoById, anularPago } from '../queries/pagos.js';
import { getReporteFinanciero } from '../queries/reportes.js';
import { validators } from '../../services/validators.js';

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
    motor.SQL = await initSqlJs();
});

describe('Saldo de la orden contra SQLite real', () => {
    beforeEach(async () => {
        motor.base = new motor.SQL.Database();
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

describe('P1-9 · anular pagos contra SQLite real', () => {
    beforeEach(async () => {
        motor.base = new motor.SQL.Database();
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
        motor.base = new motor.SQL.Database();
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

describe('Migraciones contra SQLite real', () => {
    beforeEach(() => {
        motor.base = new motor.SQL.Database();
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

        expect(aplicadas).toEqual([2, 3]);
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

    it('una base nueva queda en la última versión', async () => {
        await runMigrations(db, migrations);
        const { values } = await db.query('SELECT MAX(version) AS version FROM schema_migrations');
        expect(values[0].version).toBe(Math.max(...migrations.map(m => m.toVersion)));
    });
});
