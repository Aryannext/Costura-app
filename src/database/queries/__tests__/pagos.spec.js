import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrarPago } from '../pagos.js';
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

// We also need to mock registrarHistorialActividad inside pagos.js because it's imported from ordenes.js
vi.mock('../ordenes.js', () => ({
    registrarHistorialActividad: vi.fn().mockResolvedValue({})
}));

import { registrarHistorialActividad } from '../ordenes.js';

describe('Pagos Queries Transactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully commit and saveDb on success', async () => {
        db.run.mockResolvedValueOnce({ changes: { lastId: 99 } }); // insert pago
        db.run.mockResolvedValueOnce({}); // update order balance

        const resultId = await registrarPago({ valor: 100, id_orden: 1, id_metodo_pago: 1 });

        expect(resultId).toBe(99);
        expect(db.execute).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION", false);
        expect(registrarHistorialActividad).toHaveBeenCalled();
        expect(db.execute).toHaveBeenNthCalledWith(2, "COMMIT", false);
        expect(db.execute).not.toHaveBeenCalledWith("ROLLBACK", false);
        expect(saveDb).toHaveBeenCalledTimes(1);
    });

    it('should rollback on intermediate failure (update order fails)', async () => {
        const fakeError = new Error("Update Order Error");
        db.run.mockResolvedValueOnce({ changes: { lastId: 99 } }); // insert pago
        db.run.mockRejectedValueOnce(fakeError); // update fails

        await expect(registrarPago({ valor: 100, id_orden: 1, id_metodo_pago: 1 })).rejects.toThrow("Update Order Error");

        expect(db.execute).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION", false);
        expect(db.execute).toHaveBeenNthCalledWith(2, "ROLLBACK", false);
        expect(db.execute).not.toHaveBeenCalledWith("COMMIT", false);
        expect(saveDb).not.toHaveBeenCalled();
    });
});
