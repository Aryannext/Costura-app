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
            db.query.mockResolvedValueOnce({ values: [] }); // prendas de la orden: ninguna
            db.query.mockResolvedValueOnce({ values: [{ id_estado_orden: 1 }] }); // orden Pendiente
            db.executeSet.mockResolvedValueOnce({ changes: { lastId: 42 } });

            const resultId = await createPrenda({ descripcion_arreglo: 'Basta', valor: 15, id_orden: 1, id_tipo_prenda: 1 });

            expect(resultId).toBe(42);
            expect(db.executeSet).toHaveBeenCalledTimes(1);

            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(5);

            // 1-2. RN-17: la orden pasa a En Proceso, antes de cualquier INSERT de la prenda
            expect(calledSet[0].statement).toContain("SET id_estado_orden = 2");
            expect(calledSet[1].statement).toContain("INSERT INTO historial_actividad");
            // 3. INSERT historial de la prenda
            expect(calledSet[2].statement).toContain("INSERT INTO historial_actividad");
            expect(calledSet[2].values[1]).toBe(1); // id_orden = 1
            // 4. INSERT prenda (último INSERT para retornar id_prenda)
            expect(calledSet[3].statement).toContain("INSERT INTO prenda");
            expect(calledSet[3].values).toEqual(['Basta', 15, 1, 1]);
            // 5. Recalcular la orden con la prenda ya dentro (P1-4)
            expect(calledSet[4].statement).toContain("UPDATE orden_trabajo");
            expect(calledSet[4].statement).toContain("SUM(valor)");
            expect(calledSet[4].values).toEqual([1]);

            expect(db.executeSet.mock.calls[0][1]).toBe(true); // transaction = true
        });

        it('should bubble up error and rollback on failure in createPrenda', async () => {
            db.query.mockResolvedValueOnce({ values: [] });
            db.query.mockResolvedValueOnce({ values: [{ id_estado_orden: 1 }] });
            const fakeError = new Error("ExecuteSet Failed");
            db.executeSet.mockRejectedValueOnce(fakeError);

            await expect(createPrenda({ descripcion_arreglo: 'Basta', valor: 15, id_orden: 1, id_tipo_prenda: 1 })).rejects.toThrow("ExecuteSet Failed");

            expect(db.executeSet).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateEstadoPrenda', () => {
        it('should executeSet with 2 statements when the order state does not change', async () => {
            db.query.mockResolvedValueOnce({ values: [{ id_prenda: 10, id_estado_prenda: 1 }] }); // get prendas
            db.query.mockResolvedValueOnce({ values: [{ id_estado_orden: 2 }] }); // ya En Proceso
            db.executeSet.mockResolvedValueOnce({});

            const transicion = await updateEstadoPrenda(10, 2, 5); // id_prenda, id_estado_prenda, id_orden

            expect(transicion).toEqual({ desde: 2, hacia: 2 });
            expect(db.query).toHaveBeenCalledTimes(2);
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(2); // UPDATE prenda, INSERT historial
            expect(calledSet[0].statement).toContain("UPDATE prenda SET id_estado_prenda = ?");
            expect(calledSet[1].statement).toContain("INSERT INTO historial_actividad");
        });

        it('RN-17: una orden Pendiente con trabajo en curso pasa a En Proceso', async () => {
            db.query.mockResolvedValueOnce({ values: [{ id_prenda: 10, id_estado_prenda: 1 }] });
            db.query.mockResolvedValueOnce({ values: [{ id_estado_orden: 1 }] });
            db.executeSet.mockResolvedValueOnce({});

            const transicion = await updateEstadoPrenda(10, 2, 5);

            expect(transicion).toEqual({ desde: 1, hacia: 2 });
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(4);
            expect(calledSet[2].statement).toContain("UPDATE orden_trabajo SET id_estado_orden = 2");
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
        it('recalcula la orden desde sus filas en lugar de sumar una diferencia', async () => {
            db.executeSet.mockResolvedValueOnce({});

            await updatePrenda(10, 'Basta', 25, 5); // id, desc, new_val, id_orden

            expect(db.query).not.toHaveBeenCalled();
            expect(db.executeSet).toHaveBeenCalledTimes(1);
            const calledSet = db.executeSet.mock.calls[0][0];
            expect(calledSet).toHaveLength(3); // UPDATE prenda, recálculo, INSERT historial

            expect(calledSet[0].statement).toContain("UPDATE prenda SET");
            expect(calledSet[0].values).toEqual(['Basta', 25, 10, 5]);
            expect(calledSet[1].statement).toContain("SUM(valor)");
            expect(calledSet[1].statement).not.toContain("valor_total + ?");
            expect(calledSet[1].values).toEqual([5]);
            expect(calledSet[2].statement).toContain("INSERT INTO historial_actividad");
        });

        it('should bubble up error if executeSet fails', async () => {
            db.executeSet.mockRejectedValueOnce(new Error("DB Error"));

            await expect(updatePrenda(10, 'Basta', 25, 5)).rejects.toThrow("DB Error");
            expect(db.executeSet).toHaveBeenCalledTimes(1);
        });
    });
});
