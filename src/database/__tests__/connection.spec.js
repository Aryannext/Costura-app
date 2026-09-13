import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { importDatabaseFromJson, sqlite, initDatabase } from '../connection.js';

vi.mock('@capacitor/core', () => ({
    Capacitor: {
        getPlatform: vi.fn(() => 'web')
    }
}));

const mockDb = vi.hoisted(() => ({
    open: vi.fn(),
    execute: vi.fn(),
    close: vi.fn(),
    exportToJson: vi.fn(),
    // initDatabase ejecuta las migraciones de verdad; el ejecutor necesita
    // consultar la tabla de control y envolver cada migración en su transacción.
    query: vi.fn().mockResolvedValue({ values: [] }),
    run: vi.fn().mockResolvedValue({}),
    beginTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    rollbackTransaction: vi.fn()
}));

vi.mock('@capacitor-community/sqlite', () => {
    return {
        SQLiteConnection: class {
            importFromJson = vi.fn();
            saveToStore = vi.fn();
            closeConnection = vi.fn();
            checkConnectionsConsistency = vi.fn().mockResolvedValue({ result: true });
            isConnection = vi.fn().mockResolvedValue({ result: true });
            retrieveConnection = vi.fn().mockResolvedValue(mockDb);
            initWebStore = vi.fn().mockResolvedValue();
        },
        CapacitorSQLite: {}
    }
});

vi.mock('../migrations.js', () => ({
    migrations: [{ statements: ["CREATE TABLE fake;"] }]
}));

vi.mock('jeep-sqlite/loader', () => ({
    defineCustomElements: vi.fn()
}));

// `window` y `document` son los reales de jsdom: sustituirlos por objetos planos
// dejaba a initDatabase sin `document.querySelector` y tumbaba el fichero entero.
// Lo único que hay que fingir es la definición del custom element, porque el
// loader de jeep-sqlite está simulado y `whenDefined` no se resolvería nunca.
vi.stubGlobal('customElements', {
    whenDefined: vi.fn().mockResolvedValue(undefined),
    define: vi.fn(),
    get: vi.fn()
});

describe('Database Connection & Restore', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        Capacitor.getPlatform.mockReturnValue('web');

        mockDb.exportToJson.mockReset();
        mockDb.close.mockReset();
        mockDb.query.mockResolvedValue({ values: [] });
        mockDb.run.mockResolvedValue({});
        sqlite.importFromJson.mockReset();
        sqlite.closeConnection.mockReset();
        sqlite.saveToStore.mockReset();

        // Cada prueba arranca con una conexión viva: importDatabaseFromJson la
        // cierra a propósito y deja `db` en null.
        await initDatabase();

        // El arranque deja rastro en los mocks; se limpia para que las
        // aserciones hablen sólo de la restauración.
        vi.clearAllMocks();
    });

    describe('importDatabaseFromJson con snapshot y rollback', () => {
        const snapshot = { export: { database: "costura_db", mode: "full", old: true } };
        const snapshotSerializado = JSON.stringify(snapshot.export, null, 2);

        it('Restauración correcta -> importa el respaldo y devuelve true', async () => {
            const respaldo = JSON.stringify({ database: "costura_db", mode: "full" });
            mockDb.exportToJson.mockResolvedValueOnce(snapshot);
            sqlite.importFromJson.mockResolvedValueOnce({});

            const resultado = await importDatabaseFromJson(respaldo);

            expect(resultado).toBe(true);
            expect(mockDb.exportToJson).toHaveBeenCalledWith('full');
            expect(sqlite.importFromJson).toHaveBeenCalledTimes(1);
            expect(sqlite.importFromJson).toHaveBeenCalledWith(respaldo);
        });

        // Regresión de P0-7: importFromJson escribe sobre su propio handle. Si la
        // conexión anterior seguía viva, su copia en memoria acababa guardándose
        // encima y la restauración no restauraba nada.
        it('Suelta la conexión ANTES de importar y no la vuelve a guardar encima', async () => {
            const respaldo = JSON.stringify({ database: "costura_db" });
            const orden = [];

            mockDb.exportToJson.mockResolvedValueOnce(snapshot);
            mockDb.close.mockImplementationOnce(async () => { orden.push('cerrar base'); });
            sqlite.closeConnection.mockImplementationOnce(async () => { orden.push('soltar conexión'); });
            sqlite.importFromJson.mockImplementationOnce(async () => { orden.push('importar'); return {}; });

            await importDatabaseFromJson(respaldo);

            expect(orden).toEqual(['cerrar base', 'soltar conexión', 'importar']);
            expect(sqlite.closeConnection).toHaveBeenCalledWith("costura_db", false);
            expect(sqlite.saveToStore).not.toHaveBeenCalled();
        });

        it('JSON inválido -> falla antes de tocar la base de datos', async () => {
            mockDb.exportToJson.mockResolvedValueOnce(snapshot);

            await expect(importDatabaseFromJson("{ json roto }"))
                .rejects.toThrow("El archivo de respaldo no contiene un JSON válido.");

            expect(sqlite.closeConnection).not.toHaveBeenCalled();
            expect(sqlite.importFromJson).not.toHaveBeenCalled();
        });

        it('Falla la importación -> revierte al snapshot y propaga el error', async () => {
            const respaldo = JSON.stringify({ some: "data" });
            mockDb.exportToJson.mockResolvedValueOnce(snapshot);
            sqlite.importFromJson.mockRejectedValueOnce(new Error("Sintaxis SQL inválida en JSON"));
            sqlite.importFromJson.mockResolvedValueOnce({});

            await expect(importDatabaseFromJson(respaldo))
                .rejects.toThrow("Falló la restauración del respaldo. Se revirtieron los cambios.");

            expect(sqlite.importFromJson).toHaveBeenCalledTimes(2);
            expect(sqlite.importFromJson).toHaveBeenNthCalledWith(1, respaldo);
            expect(sqlite.importFromJson).toHaveBeenNthCalledWith(2, snapshotSerializado);
        });

        it('Falla también el rollback -> error crítico', async () => {
            const respaldo = JSON.stringify({ some: "data" });
            mockDb.exportToJson.mockResolvedValueOnce(snapshot);
            sqlite.importFromJson.mockRejectedValueOnce(new Error("Error primario"));
            sqlite.importFromJson.mockRejectedValueOnce(new Error("Error catastrófico en rollback"));

            await expect(importDatabaseFromJson(respaldo))
                .rejects.toThrow("CRÍTICO: Corrupción de base de datos irrecuperable.");

            expect(sqlite.importFromJson).toHaveBeenCalledTimes(2);
        });

        it('No se puede crear el snapshot -> no se intenta importar nada', async () => {
            mockDb.exportToJson.mockRejectedValueOnce(new Error("DB not initialized"));

            await expect(importDatabaseFromJson("{}"))
                .rejects.toThrow("No se pudo crear el snapshot de seguridad antes de restaurar.");

            expect(sqlite.closeConnection).not.toHaveBeenCalled();
            expect(sqlite.importFromJson).not.toHaveBeenCalled();
        });
    });
});
