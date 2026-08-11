import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
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
    exportToJson: vi.fn()
}));

vi.mock('@capacitor-community/sqlite', () => {
    return {
        SQLiteConnection: class {
            importFromJson = vi.fn();
            saveToStore = vi.fn();
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

// Mock DOM for jeep-sqlite
global.window = {};
global.document = {
    createElement: vi.fn(() => ({})),
    body: { appendChild: vi.fn() }
};
global.customElements = {
    whenDefined: vi.fn().mockResolvedValue()
};
vi.mock('jeep-sqlite/loader', () => ({
    defineCustomElements: vi.fn()
}));

describe('Database Connection & Restore', () => {
    beforeAll(async () => {
        Capacitor.getPlatform.mockReturnValue('web');
        await initDatabase();
    });

    beforeEach(() => {
        vi.clearAllMocks();
        mockDb.exportToJson.mockReset();
        sqlite.importFromJson.mockReset();
        sqlite.saveToStore.mockReset();
        Capacitor.getPlatform.mockReturnValue('web');
    });

    describe('importDatabaseFromJson with Snapshot/Rollback', () => {
        it('debe restaurar exitosamente y guardar en disco si es web', async () => {
            const validJson = JSON.stringify({ database: "costura_db", mode: "full" });
            const mockSnapshot = { export: { database: "costura_db", mode: "full", old: true } };

            mockDb.exportToJson.mockResolvedValueOnce(mockSnapshot);
            sqlite.importFromJson.mockResolvedValueOnce({});
            sqlite.saveToStore.mockResolvedValueOnce();

            const result = await importDatabaseFromJson(validJson);

            expect(result).toBe(true);
            expect(mockDb.exportToJson).toHaveBeenCalledWith('full');
            expect(sqlite.importFromJson).toHaveBeenCalledWith(validJson);
            expect(sqlite.importFromJson).toHaveBeenCalledTimes(1);
            expect(sqlite.saveToStore).toHaveBeenCalledWith("costura_db");
        });

        it('debe fallar si el JSON es inválido, hacer rollback al snapshot y propagar error', async () => {
            const invalidJson = "{ invalid json }";
            const mockSnapshot = { export: { valid: "snapshot" } };

            mockDb.exportToJson.mockResolvedValueOnce(mockSnapshot);

            await expect(importDatabaseFromJson(invalidJson)).rejects.toThrow("Fallo la restauración del Backup. Se revirtieron los cambios.");

            expect(mockDb.exportToJson).toHaveBeenCalledTimes(1);
            expect(sqlite.importFromJson).toHaveBeenCalledTimes(1);
            expect(sqlite.importFromJson).toHaveBeenCalledWith(JSON.stringify(mockSnapshot.export, null, 2)); // Rollback
            expect(sqlite.saveToStore).toHaveBeenCalledWith("costura_db"); // Guarda el rollback
        });

        it('debe fallar durante importFromJson, hacer rollback y propagar error', async () => {
            const validJson = JSON.stringify({ some: "data" });
            const mockSnapshot = { export: { valid: "snapshot" } };

            mockDb.exportToJson.mockResolvedValueOnce(mockSnapshot);

            const importError = new Error("Sintaxis SQL inválida en JSON");
            sqlite.importFromJson.mockRejectedValueOnce(importError); // Falla importación principal
            sqlite.importFromJson.mockResolvedValueOnce({}); // Éxito en rollback

            await expect(importDatabaseFromJson(validJson)).rejects.toThrow("Fallo la restauración del Backup. Se revirtieron los cambios.");

            expect(sqlite.importFromJson).toHaveBeenCalledTimes(2);
            expect(sqlite.importFromJson).toHaveBeenNthCalledWith(1, validJson);
            expect(sqlite.importFromJson).toHaveBeenNthCalledWith(2, JSON.stringify(mockSnapshot.export, null, 2));
            expect(sqlite.saveToStore).toHaveBeenCalledWith("costura_db");
        });

        it('debe propagar un error crítico si el rollback también falla', async () => {
            const validJson = JSON.stringify({ some: "data" });
            const mockSnapshot = { export: { valid: "snapshot" } };

            mockDb.exportToJson.mockResolvedValueOnce(mockSnapshot);

            sqlite.importFromJson.mockRejectedValueOnce(new Error("Error primario"));
            sqlite.importFromJson.mockRejectedValueOnce(new Error("Error catastrófico en rollback"));

            await expect(importDatabaseFromJson(validJson)).rejects.toThrow("CRÍTICO: Corrupción de base de datos irrecuperable.");

            expect(sqlite.importFromJson).toHaveBeenCalledTimes(2);
        });

        it('debe fallar inmediatamente si no puede crear el snapshot', async () => {
            mockDb.exportToJson.mockRejectedValueOnce(new Error("DB not initialized"));

            await expect(importDatabaseFromJson("{}")).rejects.toThrow("No se pudo crear el snapshot de seguridad antes de restaurar.");

            expect(sqlite.importFromJson).not.toHaveBeenCalled();
        });
    });
});
