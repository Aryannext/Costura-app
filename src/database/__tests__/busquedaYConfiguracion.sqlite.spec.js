// @vitest-environment node
/**
 * Búsqueda global (RF-49, RF-70) y valores de Ajustes, contra SQLite real.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { prepararMotor, nuevaBase } from '../../__tests__/helpers/sqliteReal.js';

vi.mock('../connection.js', async () =>
    (await import('../../__tests__/helpers/sqliteReal.js')).crearConexionFalsa());

import { db } from '../connection.js';
import { migrations } from '../migrations.js';
import { runMigrations } from '../migrationRunner.js';
import { globalSearch } from '../queries/search.js';
import { getConfig, updateConfig, getAllConfig } from '../queries/configuracion.js';

async function clienta(nombre, telefono) {
    await db.run(
        "INSERT INTO cliente (nombre, telefono, fecha_autorizacion_datos) VALUES (?, ?, datetime('now','localtime'))",
        [nombre, telefono]
    );
    return (await db.query('SELECT last_insert_rowid() AS id')).values[0].id;
}

async function orden(id_cliente) {
    await db.run(
        "INSERT INTO orden_trabajo (fecha_entrega_estimada, id_cliente, id_estado_orden) VALUES (date('now'), ?, 1)",
        [id_cliente]
    );
    return (await db.query('SELECT last_insert_rowid() AS id')).values[0].id;
}

beforeAll(prepararMotor);
beforeEach(async () => {
    nuevaBase();
    await runMigrations(db, migrations);
});

describe('Búsqueda global', () => {
    it('una búsqueda vacía no consulta nada', async () => {
        expect(await globalSearch('   ')).toEqual({ clientes: [], ordenes: [] });
    });

    it('encuentra a la clienta por nombre y por teléfono, y sus órdenes por su nombre', async () => {
        const ana = await clienta('Ana Ruiz', '3001112233');
        await clienta('Beatriz Gómez', '3109998877');
        const id = await orden(ana);

        const porNombre = await globalSearch('ana');
        expect(porNombre.clientes.map(c => c.nombre)).toEqual(['Ana Ruiz']);
        expect(porNombre.ordenes.map(o => o.id_orden)).toEqual([id]);
        expect(porNombre.ordenes[0].cliente_nombre).toBe('Ana Ruiz');

        const porTelefono = await globalSearch('999');
        expect(porTelefono.clientes.map(c => c.nombre)).toEqual(['Beatriz Gómez']);
    });

    it('un número busca también la orden con ese número', async () => {
        const id = await orden(await clienta('Carla', '3005550000'));
        const resultado = await globalSearch(String(id));
        expect(resultado.ordenes.map(o => o.id_orden)).toContain(id);
    });

    it('sin coincidencias devuelve listas vacías, sin error', async () => {
        await clienta('Ana', '3001112233');
        expect(await globalSearch('Zoila')).toEqual({ clientes: [], ordenes: [] });
    });
});

describe('Configuración de Ajustes', () => {
    it('las migraciones dejan los valores iniciales', async () => {
        const todo = await getAllConfig();
        expect(todo.dias_sin_reclamar).toBe('30');
        expect(todo.garantia_recibo).toMatch(/Seis meses/);
    });

    it('guardar crea una clave que no existía y reemplaza una que sí', async () => {
        await updateConfig('clave_nueva', 'uno');
        await updateConfig('nombre_taller', 'Arreglos Rosa');
        expect(await getConfig('clave_nueva')).toBe('uno');
        expect(await getConfig('nombre_taller')).toBe('Arreglos Rosa');
    });

    it('una clave inexistente se lee como null', async () => {
        expect(await getConfig('no_existe')).toBeNull();
    });
});
