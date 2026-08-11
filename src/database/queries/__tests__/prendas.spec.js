import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPrenda, updateEstadoPrenda, updatePrenda } from '../prendas.js';
import { db } from '../../connection.js';

vi.mock('../../connection.js', () => ({
    db: {
        executeSet: vi.fn(),
        query: vi.fn()
    }
}));

describe('Prendas Queries Transactions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createPrenda', () => {
        it('should successfully executeSet and return lastId on createPrenda', async () => {
            db.executeSet.mockResolvedValueOnce({ changes: { lastId: 42 } });

            const resultId = await createPrenda({ descripcion_arreglo: 'Basta', valor: 15, id_orden: 1, id_tipo_prenda: 1 });

            expect(resultId).toBe(42);
            expect(db.executeSet).toHaveBeenCalledTimes(1);

            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(3);

            // 1. UPDATE orden
            expect(calledSet[0].statement).toContain("UPDATE orden_trabajo");
            // 2. INSERT historial
            expect(calledSet[1].statement).toContain("INSERT INTO historial_actividad");
            expect(calledSet[1].values[1]).toBe(1); // id_orden = 1
            // 3. INSERT prenda (última para retornar id_prenda)
            expect(calledSet[2].statement).toContain("INSERT INTO prenda");
            expect(calledSet[2].values).toEqual(['Basta', 15, 1, 1]);

            expect(db.executeSet.mock.calls[0][1]).toBe(true); // transaction = true
        });

        it('should bubble up error and rollback on failure in createPrenda', async () => {
            const fakeError = new Error("ExecuteSet Failed");
            db.executeSet.mockRejectedValueOnce(fakeError);

            await expect(createPrenda({ descripcion_arreglo: 'Basta', valor: 15, id_orden: 1, id_tipo_prenda: 1 })).rejects.toThrow("ExecuteSet Failed");

            expect(db.executeSet).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateEstadoPrenda', () => {
        it('should executeSet with 2 statements for normal transition (no auto-transition)', async () => {
            // Mock queries
            db.query.mockResolvedValueOnce({ values: [{ id_prenda: 10, id_estado_prenda: 1 }] }); // get prendas
            db.query.mockResolvedValueOnce({ values: [{ id_estado_orden: 1 }] }); // get order state
            db.executeSet.mockResolvedValueOnce({});

            await updateEstadoPrenda(10, 2, 5); // id_prenda, id_estado_prenda, id_orden

            expect(db.query).toHaveBeenCalledTimes(2);
            expect(db.executeSet).toHaveBeenCalledTimes(1);

            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(2); // UPDATE prenda, INSERT historial
            expect(calledSet[0].statement).toContain("UPDATE prenda SET id_estado_prenda = ?");
            expect(calledSet[1].statement).toContain("INSERT INTO historial_actividad");
        });

        it('should executeSet with 5 statements if auto-transition to Terminada happens', async () => {
            // Prenda 10 will go to 3, Prenda 11 is already 3. All will be done.
            db.query.mockResolvedValueOnce({ values: [{ id_prenda: 10, id_estado_prenda: 2 }, { id_prenda: 11, id_estado_prenda: 3 }] });
            db.query.mockResolvedValueOnce({ values: [{ id_estado_orden: 2 }] });
            db.executeSet.mockResolvedValueOnce({});

            await updateEstadoPrenda(10, 3, 5);

            expect(db.executeSet).toHaveBeenCalledTimes(1);
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(5); // 2 default + UPDATE order + INSERT order history + INSERT notification
            expect(calledSet[2].statement).toContain("UPDATE orden_trabajo SET id_estado_orden = 3");
            expect(calledSet[3].statement).toContain("INSERT INTO historial_actividad");
            expect(calledSet[4].statement).toContain("INSERT INTO notificacion");
        });

        it('should bubble up error and rollback entirely if executeSet fails', async () => {
            db.query.mockResolvedValueOnce({ values: [{ id_prenda: 10, id_estado_prenda: 1 }] });
            db.query.mockResolvedValueOnce({ values: [{ id_estado_orden: 1 }] });
            db.executeSet.mockRejectedValueOnce(new Error("DB Error"));

            await expect(updateEstadoPrenda(10, 2, 5)).rejects.toThrow("DB Error");
            expect(db.executeSet).toHaveBeenCalledTimes(1);
        });
    });

    describe('updatePrenda', () => {
        it('should executeSet with 2 statements when value does not change', async () => {
            db.query.mockResolvedValueOnce({ values: [{ valor: 15 }] }); // current value
            db.executeSet.mockResolvedValueOnce({});

            await updatePrenda(10, 'Basta', 15, 5); // id, desc, new_val, id_orden

            expect(db.query).toHaveBeenCalledTimes(1);
            expect(db.executeSet).toHaveBeenCalledTimes(1);

            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(2); // UPDATE prenda, INSERT historial
            expect(calledSet[0].statement).toContain("UPDATE prenda SET");
            expect(calledSet[1].statement).toContain("INSERT INTO historial_actividad");
        });

        it('should executeSet with 3 statements when value changes (updates order)', async () => {
            db.query.mockResolvedValueOnce({ values: [{ valor: 10 }] }); // current value: 10
            db.executeSet.mockResolvedValueOnce({});

            await updatePrenda(10, 'Basta', 25, 5); // new value: 25. Diff = 15

            expect(db.executeSet).toHaveBeenCalledTimes(1);
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(3); // UPDATE prenda, UPDATE order, INSERT historial

            expect(calledSet[0].statement).toContain("UPDATE prenda SET");
            expect(calledSet[1].statement).toContain("UPDATE orden_trabajo SET valor_total = valor_total + ?, saldo_pendiente = saldo_pendiente + ?");
            expect(calledSet[1].values).toEqual([15, 15, 5]); // Diff is 15
            expect(calledSet[2].statement).toContain("INSERT INTO historial_actividad");
        });

        it('should bubble up error if executeSet fails', async () => {
            db.query.mockResolvedValueOnce({ values: [{ valor: 10 }] });
            db.executeSet.mockRejectedValueOnce(new Error("DB Error"));

            await expect(updatePrenda(10, 'Basta', 25, 5)).rejects.toThrow("DB Error");
            expect(db.executeSet).toHaveBeenCalledTimes(1);
        });
    });
});
