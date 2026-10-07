import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrarPago, MENSAJE_PAGO_RECHAZADO } from '../pagos.js';
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

        // Historial, INSERT del pago (último INSERT, da el lastId) y recálculo del saldo
        const calledSet = db.executeSet.mock.calls[0][0];
        expect(calledSet).toHaveLength(3);
        expect(calledSet[1].statement).toContain("INSERT INTO pago");
        // P1-16: la comprobación del saldo va dentro del mismo INSERT
        expect(calledSet[1].statement).toContain("CASE WHEN");
        // El último valor es fecha_pago: null = la base pone la fecha y hora actuales
        expect(calledSet[1].values).toEqual([100, 1, 100, 1, 1, 100, 1, 1, null]);
        expect(calledSet[2].statement).toContain("UPDATE orden_trabajo");
        expect(calledSet[2].statement).not.toContain("saldo_pendiente - ?");
        expect(calledSet[2].values).toEqual([1]);

        // Comprobar que transaction = true
        expect(db.executeSet.mock.calls[0][1]).toBe(true);
    });

    it('traduce el rechazo de la base a un mensaje para la dueña', async () => {
        db.executeSet.mockRejectedValueOnce(new Error("ExecuteSet: NOT NULL constraint failed: pago.valor (code 1299)"));

        await expect(registrarPago({ valor: 100, id_orden: 1, id_metodo_pago: 1 })).rejects.toThrow(MENSAJE_PAGO_RECHAZADO);
    });

    it('should bubble up error if executeSet fails', async () => {
        const fakeError = new Error("ExecuteSet Failed");
        db.executeSet.mockRejectedValueOnce(fakeError);

        await expect(registrarPago({ valor: 100, id_orden: 1, id_metodo_pago: 1 })).rejects.toThrow("ExecuteSet Failed");

        expect(db.executeSet).toHaveBeenCalledTimes(1);
    });
});
