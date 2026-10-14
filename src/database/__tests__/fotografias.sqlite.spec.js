// @vitest-environment node
/**
 * Borrar una fotografía contra SQLite real (RF-32, RN-40, DEF-06): la consulta
 * dice qué archivo quedó sin usar, para que se borre también del teléfono.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { prepararMotor, nuevaBase } from '../../__tests__/helpers/sqliteReal.js';

vi.mock('../connection.js', async () =>
    (await import('../../__tests__/helpers/sqliteReal.js')).crearConexionFalsa());

import { db } from '../connection.js';
import { migrations } from '../migrations.js';
import { runMigrations } from '../migrationRunner.js';
import { createOrden } from '../queries/ordenes.js';
import { createPrenda, saveFotografia, deleteFotografia } from '../queries/prendas.js';

let id_prenda;

beforeAll(prepararMotor);
beforeEach(async () => {
    nuevaBase();
    await runMigrations(db, migrations);
    await db.run(
        "INSERT INTO cliente (nombre, telefono, fecha_autorizacion_datos) VALUES ('Ana', '3001234567', datetime('now','localtime'))"
    );
    const id_orden = await createOrden({ id_cliente: 1, fecha_entrega_estimada: '2099-01-01' });
    id_prenda = await createPrenda({ id_orden, id_tipo_prenda: 1, descripcion_arreglo: 'Basta', valor: 20000 });
});

const cuenta = async (sql) => (await db.query(sql)).values[0].n;

describe('deleteFotografia', () => {
    it('borra la fila, deja rastro en el historial y devuelve la ruta del archivo', async () => {
        const id = await saveFotografia(id_prenda, 'prenda_1_123.jpeg');

        const ruta = await deleteFotografia(id);

        expect(ruta).toBe('prenda_1_123.jpeg');
        expect(await cuenta('SELECT COUNT(*) AS n FROM fotografia')).toBe(0);
        expect(await cuenta("SELECT COUNT(*) AS n FROM historial_actividad WHERE descripcion LIKE 'Fotografía eliminada%'")).toBe(1);
        expect(await cuenta('SELECT COUNT(*) AS n FROM prenda')).toBe(1);
    });

    it('si otra foto usa el mismo archivo, no lo da por libre', async () => {
        const id = await saveFotografia(id_prenda, 'compartida.jpeg');
        await saveFotografia(id_prenda, 'compartida.jpeg');

        expect(await deleteFotografia(id)).toBeNull();
        expect(await cuenta('SELECT COUNT(*) AS n FROM fotografia')).toBe(1);
    });

    it('una foto que ya no existe no devuelve archivo', async () => {
        expect(await deleteFotografia(999)).toBeNull();
    });
});
