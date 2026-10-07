import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runMigrations, TABLA_MIGRACIONES } from '../migrationRunner.js';

/** Base de datos simulada que recuerda qué versiones se han registrado. */
function crearDbFalsa({ aplicadas = [], fallarEn = null } = {}) {
    const registradas = [...aplicadas];
    const db = {
        sentenciasEjecutadas: [],
        transacciones: [],

        execute: vi.fn(async (sentencia) => {
            if (fallarEn && sentencia.includes(fallarEn)) {
                throw new Error(`no such column: ${fallarEn}`);
            }
            db.sentenciasEjecutadas.push(sentencia);
            return {};
        }),
        query: vi.fn(async () => ({ values: registradas.map(version => ({ version })) })),
        run: vi.fn(async (sentencia, valores) => {
            if (sentencia.includes(TABLA_MIGRACIONES)) registradas.push(valores[0]);
            return {};
        }),
        beginTransaction: vi.fn(async () => { db.transacciones.push('begin'); }),
        commitTransaction: vi.fn(async () => { db.transacciones.push('commit'); }),
        rollbackTransaction: vi.fn(async () => { db.transacciones.push('rollback'); }),

        versionesRegistradas: () => registradas
    };
    return db;
}

const migracionUno = { toVersion: 1, statements: ['CREATE TABLE cliente (id INTEGER);'] };
const migracionDos = { toVersion: 2, statements: ['ALTER TABLE cliente ADD COLUMN correo TEXT;'] };

describe('runMigrations', () => {
    beforeEach(() => vi.clearAllMocks());

    it('Sin base de datos -> error explícito', async () => {
        await expect(runMigrations(null, [migracionUno])).rejects.toThrow('Database not initialized');
    });

    it('Base nueva -> aplica todas las migraciones y las registra', async () => {
        const db = crearDbFalsa();

        const aplicadas = await runMigrations(db, [migracionUno, migracionDos]);

        expect(aplicadas).toEqual([1, 2]);
        expect(db.versionesRegistradas()).toEqual([1, 2]);
        expect(db.transacciones).toEqual(['begin', 'commit', 'begin', 'commit']);
    });

    it('Las migraciones se aplican en orden aunque lleguen desordenadas', async () => {
        const db = crearDbFalsa();

        const aplicadas = await runMigrations(db, [migracionDos, migracionUno]);

        expect(aplicadas).toEqual([1, 2]);
    });

    it('Todo aplicado -> no repite nada', async () => {
        const db = crearDbFalsa({ aplicadas: [1, 2] });

        const aplicadas = await runMigrations(db, [migracionUno, migracionDos]);

        expect(aplicadas).toEqual([]);
        expect(db.beginTransaction).not.toHaveBeenCalled();
    });

    // El fallo original: con el índice fijo `migrations[0]`, una segunda
    // migración no se habría ejecutado jamás.
    it('Base en la versión 1 -> aplica sólo la 2', async () => {
        const db = crearDbFalsa({ aplicadas: [1] });

        const aplicadas = await runMigrations(db, [migracionUno, migracionDos]);

        expect(aplicadas).toEqual([2]);
        expect(db.sentenciasEjecutadas).toContain(migracionDos.statements[0]);
        expect(db.sentenciasEjecutadas).not.toContain(migracionUno.statements[0]);
    });

    // El otro fallo original: los errores se tragaban con un console.error y la
    // ejecución seguía, dejando el esquema a medio aplicar.
    it('Una sentencia falla -> rollback, no registra la versión y propaga el error', async () => {
        const db = crearDbFalsa({ aplicadas: [1], fallarEn: 'correo' });

        await expect(runMigrations(db, [migracionUno, migracionDos]))
            .rejects.toThrow('Falló la migración a la versión 2: no such column: correo');

        expect(db.transacciones).toEqual(['begin', 'rollback']);
        expect(db.versionesRegistradas()).toEqual([1]);
    });

    it('Una migración fallida detiene las siguientes', async () => {
        const migracionTres = { toVersion: 3, statements: ['CREATE TABLE bodega (id INTEGER);'] };
        const db = crearDbFalsa({ fallarEn: 'correo' });

        await expect(runMigrations(db, [migracionUno, migracionDos, migracionTres]))
            .rejects.toThrow('Falló la migración a la versión 2');

        expect(db.versionesRegistradas()).toEqual([1]);
        expect(db.sentenciasEjecutadas).not.toContain(migracionTres.statements[0]);
    });

    // Guardia contra reversiones OTA: Capgo puede devolver el teléfono a un
    // bundle anterior, que no sabe leer un esquema más nuevo.
    it('Base más nueva que la aplicación -> se niega a continuar', async () => {
        const db = crearDbFalsa({ aplicadas: [1, 2, 3] });

        await expect(runMigrations(db, [migracionUno, migracionDos]))
            .rejects.toThrow('La base de datos usa el esquema versión 3 y esta versión de la aplicación sólo entiende hasta la 2. Actualiza la aplicación antes de continuar.');

        expect(db.beginTransaction).not.toHaveBeenCalled();
    });

    it('Crea la tabla de control antes de consultarla', async () => {
        const db = crearDbFalsa();

        await runMigrations(db, [migracionUno]);

        expect(db.execute.mock.calls[0][0]).toContain(`CREATE TABLE IF NOT EXISTS ${TABLA_MIGRACIONES}`);
    });
});
