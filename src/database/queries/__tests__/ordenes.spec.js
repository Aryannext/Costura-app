import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrden } from '../ordenes.js';
import { db, saveDb } from '../../connection.js';

// Mock connection
vi.mock('../../connection.js', () => ({
    db: {
        execute: vi.fn(),
        run: vi.fn(),
        query: vi.fn()
    },
    saveDb: vi.fn()
}));

describe('Ordenes Queries Transactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully commit and saveDb on success', async () => {
        // Setup successful run
        db.run.mockResolvedValueOnce({ changes: { lastId: 10 } }); // insert orden
        db.run.mockResolvedValueOnce({}); // insert history

        const resultId = await createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 });

        // Checks
        expect(resultId).toBe(10); // lastId correctly returned
        expect(db.execute).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION", false);
        expect(db.execute).toHaveBeenNthCalledWith(2, "COMMIT", false);
        expect(db.execute).not.toHaveBeenCalledWith("ROLLBACK", false);
        expect(saveDb).toHaveBeenCalledTimes(1);
    });

    it('should rollback and throw on failure, and not commit or saveDb', async () => {
        const fakeError = new Error("DB Error");
        db.run.mockRejectedValueOnce(fakeError); // fails on first insert

        await expect(createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 })).rejects.toThrow("DB Error");

        expect(db.execute).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION", false);
        expect(db.execute).toHaveBeenNthCalledWith(2, "ROLLBACK", false);
        expect(db.execute).not.toHaveBeenCalledWith("COMMIT", false);
        expect(saveDb).not.toHaveBeenCalled();
    });

    it('should rollback on intermediate failure (history insert fails)', async () => {
        const fakeError = new Error("History Insert Error");
        db.run.mockResolvedValueOnce({ changes: { lastId: 15 } }); // insert orden succeeds
        db.run.mockRejectedValueOnce(fakeError); // history insert fails

        await expect(createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 })).rejects.toThrow("History Insert Error");

        expect(db.execute).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION", false);
        expect(db.execute).toHaveBeenNthCalledWith(2, "ROLLBACK", false);
        expect(db.execute).not.toHaveBeenCalledWith("COMMIT", false);
        expect(saveDb).not.toHaveBeenCalled();
    });
});
