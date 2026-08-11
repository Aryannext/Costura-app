import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrarPago } from '../pagos.js';
import { db } from '../../connection.js';

// Mock connection
vi.mock('../../connection.js', () => ({
    db: {
        executeSet: vi.fn(),
        query: vi.fn()
    }
}));

describe('Pagos Queries Transactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully executeSet and return lastId', async () => {
        db.executeSet.mockResolvedValueOnce({ changes: { lastId: 99 } });

        const resultId = await registrarPago({ valor: 100, id_orden: 1, id_metodo_pago: 1 });

        expect(resultId).toBe(99);
        expect(db.executeSet).toHaveBeenCalledTimes(1);

        // Comprobar que el set tiene 3 operaciones y la última es el INSERT del pago
        const calledSet = db.executeSet.mock.calls[0][0];
        expect(calledSet).toHaveLength(3);
        expect(calledSet[2].statement).toContain("INSERT INTO pago");
        expect(calledSet[2].values).toEqual([100, 1, 1]);

        // Comprobar que transaction = true
        expect(db.executeSet.mock.calls[0][1]).toBe(true);
    });

    it('should bubble up error if executeSet fails', async () => {
        const fakeError = new Error("ExecuteSet Failed");
        db.executeSet.mockRejectedValueOnce(fakeError);

        await expect(registrarPago({ valor: 100, id_orden: 1, id_metodo_pago: 1 })).rejects.toThrow("ExecuteSet Failed");

        expect(db.executeSet).toHaveBeenCalledTimes(1);
    });
});
