import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createOrden, changeEstado } from '../ordenes.js';
import { db } from '../../connection.js';

// Mock connection
vi.mock('../../connection.js', () => ({
    db: {
        executeSet: vi.fn(),
        query: vi.fn()
    }
}));

describe('Ordenes Queries Transactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createOrden', () => {
        it('should successfully executeSet and return max id_orden', async () => {
            db.executeSet.mockResolvedValueOnce({ changes: { lastId: 99 } }); // lastId belongs to historial
            db.query.mockResolvedValueOnce({ values: [{ last_id: 15 }] }); // query returns 15

            const resultId = await createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 });

            // Checks
            expect(resultId).toBe(15);
            expect(db.executeSet).toHaveBeenCalledTimes(1);

            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(2);
            expect(calledSet[0].statement).toContain("INSERT INTO orden_trabajo");
            expect(calledSet[1].statement).toContain("INSERT INTO historial_actividad");
            expect(calledSet[1].statement).toContain("last_insert_rowid()");

            expect(db.executeSet.mock.calls[0][1]).toBe(true);
            expect(db.query).toHaveBeenCalledWith("SELECT MAX(id_orden) as last_id FROM orden_trabajo");
        });

        it('should bubble up error if executeSet fails', async () => {
            const fakeError = new Error("DB Error");
            db.executeSet.mockRejectedValueOnce(fakeError);

            await expect(createOrden({ fecha_entrega_estimada: '2023-12-01', id_cliente: 5 })).rejects.toThrow("DB Error");

            expect(db.executeSet).toHaveBeenCalledTimes(1);
            expect(db.query).not.toHaveBeenCalled();
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
