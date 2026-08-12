import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrden, changeEstado } from '../ordenes.js';
import { db } from '../../connection.js';

// Mock connection
vi.mock('../../connection.js', () => ({
    db: {
        executeSet: vi.fn(),
        query: vi.fn(),
        beginTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        rollbackTransaction: vi.fn(),
        run: vi.fn()
    }
}));

describe('Ordenes Queries Transactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createOrden', () => {
        it('should successfully use explicit transaction and return run lastId', async () => {
            db.beginTransaction.mockResolvedValueOnce();
            db.run.mockResolvedValueOnce({ changes: { lastId: 15 } });
            db.executeSet.mockResolvedValueOnce({});
            db.commitTransaction.mockResolvedValueOnce();

            const resultId = await createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 });

            // Checks
            expect(resultId).toBe(15);
            expect(db.beginTransaction).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.run.mock.calls[0][0]).toContain("INSERT INTO orden_trabajo");
            expect(db.run.mock.calls[0][2]).toBe(false); // transaction: false

            expect(db.executeSet).toHaveBeenCalledTimes(1);
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(1);
            expect(calledSet[0].statement).toContain("INSERT INTO historial_actividad");
            expect(calledSet[0].values[1]).toBe(15); // id_orden

            expect(db.executeSet.mock.calls[0][1]).toBe(false); // transaction: false
            expect(db.commitTransaction).toHaveBeenCalledTimes(1);
            expect(db.rollbackTransaction).not.toHaveBeenCalled();
            expect(db.query).not.toHaveBeenCalled(); // No more SELECT MAX
        });

        it('should rollback and bubble up error if run fails', async () => {
            const fakeError = new Error("DB Error on run");
            db.beginTransaction.mockResolvedValueOnce();
            db.run.mockRejectedValueOnce(fakeError);
            db.rollbackTransaction.mockResolvedValueOnce();

            await expect(createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 })).rejects.toThrow("DB Error on run");

            expect(db.beginTransaction).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.executeSet).not.toHaveBeenCalled();
            expect(db.rollbackTransaction).toHaveBeenCalledTimes(1);
            expect(db.commitTransaction).not.toHaveBeenCalled();
        });

        it('should rollback and bubble up error if executeSet fails', async () => {
            const fakeError = new Error("DB Error on executeSet");
            db.beginTransaction.mockResolvedValueOnce();
            db.run.mockResolvedValueOnce({ changes: { lastId: 20 } });
            db.executeSet.mockRejectedValueOnce(fakeError);
            db.rollbackTransaction.mockResolvedValueOnce();

            await expect(createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 })).rejects.toThrow("DB Error on executeSet");

            expect(db.beginTransaction).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.executeSet).toHaveBeenCalledTimes(1);
            expect(db.rollbackTransaction).toHaveBeenCalledTimes(1);
            expect(db.commitTransaction).not.toHaveBeenCalled();
        });
    });

    describe('changeEstado', () => {
        it('should executeSet with 2 queries for normal state change', async () => {
            db.executeSet.mockResolvedValueOnce({});
            await changeEstado(1, 2, "Procesando", null);

            expect(db.executeSet).toHaveBeenCalledTimes(1);
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(2);
            expect(calledSet[0].statement).toContain("UPDATE orden_trabajo");
            expect(calledSet[1].statement).toContain("INSERT INTO historial_actividad");
        });

        it('should executeSet with 3 queries for Entregada state change (updates prendas)', async () => {
            db.executeSet.mockResolvedValueOnce({});
            await changeEstado(1, 4, "Entregada", null);

            expect(db.executeSet).toHaveBeenCalledTimes(1);
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(3);
            expect(calledSet[0].statement).toContain("UPDATE orden_trabajo");
            expect(calledSet[1].statement).toContain("UPDATE prenda SET id_estado_prenda = 4");
            expect(calledSet[2].statement).toContain("INSERT INTO historial_actividad");
        });

        it('should bubble up error and rollback entirely if executeSet fails', async () => {
            const fakeError = new Error("DB Error");
            db.executeSet.mockRejectedValueOnce(fakeError);

            await expect(changeEstado(1, 2, "Procesando", null)).rejects.toThrow("DB Error");
            expect(db.executeSet).toHaveBeenCalledTimes(1);
        });
    });
});
