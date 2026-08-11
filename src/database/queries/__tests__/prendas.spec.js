import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrenda } from '../prendas.js';
import { db, saveDb } from '../../connection.js';

vi.mock('../../connection.js', () => ({
    db: {
        execute: vi.fn(),
        run: vi.fn(),
        query: vi.fn()
    },
    saveDb: vi.fn()
}));

vi.mock('../ordenes.js', () => ({
    registrarHistorialActividad: vi.fn().mockResolvedValue({})
}));

import { registrarHistorialActividad } from '../ordenes.js';

describe('Prendas Queries Transactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully commit and saveDb on createPrenda success', async () => {
        db.run.mockResolvedValueOnce({ changes: { lastId: 42 } }); // insert prenda
        db.run.mockResolvedValueOnce({}); // update orden total/saldo

        const resultId = await createPrenda({ descripcion_arreglo: 'Basta', valor: 15, id_orden: 1, id_tipo_prenda: 1 });

        expect(resultId).toBe(42);
        expect(db.execute).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION", false);
        expect(registrarHistorialActividad).toHaveBeenCalled();
        expect(db.execute).toHaveBeenNthCalledWith(2, "COMMIT", false);
        expect(db.execute).not.toHaveBeenCalledWith("ROLLBACK", false);
        expect(saveDb).toHaveBeenCalledTimes(1);
    });

    it('should rollback on intermediate failure in createPrenda (update order fails)', async () => {
        const fakeError = new Error("Update Order Error");
        db.run.mockResolvedValueOnce({ changes: { lastId: 42 } }); // insert prenda
        db.run.mockRejectedValueOnce(fakeError); // update fails

        await expect(createPrenda({ descripcion_arreglo: 'Basta', valor: 15, id_orden: 1, id_tipo_prenda: 1 })).rejects.toThrow("Update Order Error");

        expect(db.execute).toHaveBeenNthCalledWith(1, "BEGIN TRANSACTION", false);
        expect(db.execute).toHaveBeenNthCalledWith(2, "ROLLBACK", false);
        expect(db.execute).not.toHaveBeenCalledWith("COMMIT", false);
        expect(saveDb).not.toHaveBeenCalled();
    });
});
