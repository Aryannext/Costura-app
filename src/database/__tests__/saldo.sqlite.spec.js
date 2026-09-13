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
import { createPrenda, updatePrenda, getTotalesParaEditarPrenda } from '../queries/prendas.js';
import { registrarPago } from '../queries/pagos.js';
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

/** Lo mismo que hace usePrendas.editPrenda antes de escribir. */
async function editarPrecio(id_prenda, id_orden, valorNuevo) {
    const { totalOtrasPrendas, totalPagado } = await getTotalesParaEditarPrenda(id_prenda, id_orden);
    validators.validateValorPrendaContraPagos({ valorNuevo, totalOtrasPrendas, totalPagado });
    await updatePrenda(id_prenda, 'Basta', valorNuevo, id_orden);
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

        const id_prenda = await createPrenda({
            descripcion_arreglo: 'Basta', valor: 100000, id_orden, id_tipo_prenda: PANTALON
        });
        const id_pago = await registrarPago({ valor: 30000, id_orden, id_metodo_pago: EFECTIVO });

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 100000, saldo_pendiente: 70000 });

        // El recálculo va después del INSERT: el lastId tiene que seguir siendo el suyo.
        const prenda = await db.query('SELECT id_prenda FROM prenda WHERE id_orden = ?', [id_orden]);
        const pago = await db.query('SELECT id_pago FROM pago WHERE id_orden = ?', [id_orden]);
        expect(id_prenda).toBe(prenda.values[0].id_prenda);
        expect(id_pago).toBe(pago.values[0].id_pago);
    });

    it('RN-29: bajar el precio de una prenda ya pagada se rechaza y el saldo no se mueve', async () => {
        // El caso de la auditoría: $100.000 pagados, precio corregido a $60.000.
        // Antes el saldo quedaba en -$40.000.
        const id_orden = await nuevaOrden();
        const id_prenda = await createPrenda({
            descripcion_arreglo: 'Basta', valor: 100000, id_orden, id_tipo_prenda: PANTALON
        });
        await registrarPago({ valor: 100000, id_orden, id_metodo_pago: EFECTIVO });

        await expect(editarPrecio(id_prenda, id_orden, 60000))
            .rejects.toThrow('El saldo no puede quedar negativo.');

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 100000, saldo_pendiente: 0 });
    });

    it('RN-29: bajar el precio hasta exactamente lo pagado sí se permite', async () => {
        const id_orden = await nuevaOrden();
        const id_prenda = await createPrenda({
            descripcion_arreglo: 'Basta', valor: 100000, id_orden, id_tipo_prenda: PANTALON
        });
        await registrarPago({ valor: 60000, id_orden, id_metodo_pago: EFECTIVO });

        await editarPrecio(id_prenda, id_orden, 60000);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 60000, saldo_pendiente: 0 });
    });

    it('con varias prendas, el saldo es la suma de prendas menos la suma de pagos', async () => {
        const id_orden = await nuevaOrden();
        const basta = await createPrenda({
            descripcion_arreglo: 'Basta', valor: 20000, id_orden, id_tipo_prenda: PANTALON
        });
        await createPrenda({ descripcion_arreglo: 'Cremallera', valor: 15000, id_orden, id_tipo_prenda: PANTALON });
        await registrarPago({ valor: 10000, id_orden, id_metodo_pago: EFECTIVO });
        await registrarPago({ valor: 5000, id_orden, id_metodo_pago: EFECTIVO });

        await editarPrecio(basta, id_orden, 25000);

        expect(await leerOrden(id_orden)).toEqual({ valor_total: 40000, saldo_pendiente: 25000 });
    });

    it('no toca otras órdenes', async () => {
        const primera = await nuevaOrden();
        const segunda = await nuevaOrden();
        await createPrenda({ descripcion_arreglo: 'Basta', valor: 20000, id_orden: primera, id_tipo_prenda: PANTALON });
        await createPrenda({ descripcion_arreglo: 'Ruedo', valor: 8000, id_orden: segunda, id_tipo_prenda: PANTALON });
        await registrarPago({ valor: 8000, id_orden: segunda, id_metodo_pago: EFECTIVO });

        expect(await leerOrden(primera)).toEqual({ valor_total: 20000, saldo_pendiente: 20000 });
        expect(await leerOrden(segunda)).toEqual({ valor_total: 8000, saldo_pendiente: 0 });
    });

    it('no permite editar una prenda a través de una orden que no es la suya', async () => {
        const primera = await nuevaOrden();
        const segunda = await nuevaOrden();
        const id_prenda = await createPrenda({
            descripcion_arreglo: 'Basta', valor: 20000, id_orden: primera, id_tipo_prenda: PANTALON
        });

        await expect(getTotalesParaEditarPrenda(id_prenda, segunda)).rejects.toThrow('Prenda no encontrada');
    });
});

describe('Migración v2 contra SQLite real', () => {
    beforeEach(() => {
        motor.base = new motor.SQL.Database();
    });

    it('recalcula los saldos que la v1 dejó descuadrados', async () => {
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

        expect(aplicadas).toEqual([2]);
        expect(await leerOrden(id_orden)).toEqual({ valor_total: 100, saldo_pendiente: 60 });
        expect(await leerOrden(vacia.lastId)).toEqual({ valor_total: 0, saldo_pendiente: 0 });
    });

    it('una base nueva queda en la última versión', async () => {
        await runMigrations(db, migrations);
        const { values } = await db.query('SELECT MAX(version) AS version FROM schema_migrations');
        expect(values[0].version).toBe(Math.max(...migrations.map(m => m.toVersion)));
    });
});
