// @vitest-environment node
/**
 * Prueba de volumen (RNF-01, RNF-02, RNF-03 y RNF-27) contra SQLite real.
 *
 * Carga 500 órdenes con prendas y abonos usando las mismas consultas de la app y
 * mide las operaciones que la modista hace a diario. Mide el motor de base de
 * datos (sql.js, el mismo de la versión web) en el equipo donde corre la prueba,
 * no el teléfono: la medición en el teléfono de la dueña sigue pendiente.
 */
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { prepararMotor, nuevaBase } from '../../__tests__/helpers/sqliteReal.js';

vi.mock('../connection.js', async () =>
    (await import('../../__tests__/helpers/sqliteReal.js')).crearConexionFalsa());

import { db } from '../connection.js';
import { migrations } from '../migrations.js';
import { runMigrations } from '../migrationRunner.js';
import { createOrden, getAllOrdenes, getOrdenById, getHistorialByOrden } from '../queries/ordenes.js';
import { createPrenda, getPrendasByOrden } from '../queries/prendas.js';
import { registrarPago, getPagosByOrden } from '../queries/pagos.js';
import { globalSearch } from '../queries/search.js';

const ORDENES = 500;
const CLIENTAS = 150;
const REPETICIONES = 20;

// Límites del SRS, en milisegundos
const LIMITE = { abrirOrden: 2000, registrarOrden: 3000, actualizarSaldo: 1000 };

const resultados = {};

async function medir(nombre, operacion) {
    const tiempos = [];
    for (let i = 0; i < REPETICIONES; i++) {
        const inicio = performance.now();
        await operacion(i);
        tiempos.push(performance.now() - inicio);
    }
    tiempos.sort((a, b) => a - b);
    const r = {
        mediana: Number(tiempos[Math.floor(tiempos.length / 2)].toFixed(2)),
        maximo: Number(tiempos.at(-1).toFixed(2))
    };
    resultados[nombre] = r;
    return r;
}

let idsOrdenes = [];
let idsClientas = [];

beforeAll(async () => {
    await prepararMotor();
    nuevaBase();
    await runMigrations(db, migrations);

    for (let c = 1; c <= CLIENTAS; c++) {
        await db.run(
            "INSERT INTO cliente (nombre, telefono, fecha_autorizacion_datos) VALUES (?, ?, datetime('now','localtime'))",
            [`Clienta de prueba ${c}`, `300${String(c).padStart(7, '0')}`]
        );
        idsClientas.push((await db.query('SELECT last_insert_rowid() AS id')).values[0].id);
    }

    for (let o = 0; o < ORDENES; o++) {
        const id = await createOrden({
            id_cliente: idsClientas[o % CLIENTAS],
            fecha_entrega_estimada: '2026-12-31'
        });
        await createPrenda({ id_orden: id, id_tipo_prenda: 1, descripcion_arreglo: 'Subir ruedo', valor: 15000 });
        await createPrenda({ id_orden: id, id_tipo_prenda: 2, descripcion_arreglo: 'Entallar', valor: 25000 });
        await registrarPago({ id_orden: id, valor: 10000, id_metodo_pago: 1 });
        idsOrdenes.push(id);
    }
}, 120000);

describe(`Volumen: ${ORDENES} órdenes, ${CLIENTAS} clientas`, () => {
    it('la base quedó con el volumen esperado', async () => {
        const cuenta = async (tabla) => (await db.query(`SELECT COUNT(*) AS n FROM ${tabla}`)).values[0].n;
        expect(await cuenta('orden_trabajo')).toBe(ORDENES);
        expect(await cuenta('prenda')).toBe(ORDENES * 2);
        expect(await cuenta('pago')).toBe(ORDENES);
    });

    it('RNF-01: abrir una orden (datos, prendas, pagos e historial) tarda menos de 2 s', async () => {
        const r = await medir('abrirOrden', async (i) => {
            const id = idsOrdenes[(i * 37) % ORDENES];
            const [orden, prendas, pagos, historial] = await Promise.all([
                getOrdenById(id), getPrendasByOrden(id), getPagosByOrden(id), getHistorialByOrden(id)
            ]);
            expect(orden.saldo_pendiente).toBe(30000);
            expect(prendas).toHaveLength(2);
            expect(pagos).toHaveLength(1);
            expect(historial.length).toBeGreaterThan(0);
        });
        expect(r.maximo).toBeLessThan(LIMITE.abrirOrden);
    });

    it('RNF-02: registrar una orden con una prenda tarda menos de 3 s', async () => {
        const r = await medir('registrarOrden', async (i) => {
            const id = await createOrden({ id_cliente: idsClientas[i], fecha_entrega_estimada: '2026-12-31' });
            await createPrenda({ id_orden: id, id_tipo_prenda: 1, descripcion_arreglo: 'Cambiar cremallera', valor: 12000 });
        });
        expect(r.maximo).toBeLessThan(LIMITE.registrarOrden);
    });

    it('RNF-03: registrar un abono y leer el saldo nuevo tarda menos de 1 s', async () => {
        const r = await medir('actualizarSaldo', async (i) => {
            const id = idsOrdenes[i];
            await registrarPago({ id_orden: id, valor: 1000, id_metodo_pago: 2 });
            const orden = await getOrdenById(id);
            expect(orden.saldo_pendiente).toBe(30000 - 1000);
        });
        expect(r.maximo).toBeLessThan(LIMITE.actualizarSaldo);
    });

    it('listar todas las órdenes y buscar por nombre se mantienen por debajo de 2 s', async () => {
        const lista = await medir('listarOrdenes', async () => {
            expect((await getAllOrdenes()).length).toBeGreaterThanOrEqual(ORDENES);
        });
        const busqueda = await medir('buscarClienta', async () => {
            expect((await globalSearch('Clienta de prueba 7')).clientes.length).toBeGreaterThan(0);
        });
        expect(lista.maximo).toBeLessThan(LIMITE.abrirOrden);
        expect(busqueda.maximo).toBeLessThan(LIMITE.abrirOrden);

        // Queda en la salida de la prueba como evidencia de la medición
        console.log(`Volumen ${ORDENES} órdenes · ${REPETICIONES} repeticiones · ms`, JSON.stringify(resultados));
    });
});
