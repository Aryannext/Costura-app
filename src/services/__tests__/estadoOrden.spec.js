import { describe, it, expect } from 'vitest';
import {
    derivarEstadoOrden, esOrdenActiva, estadoDePago, ordenesPorCobrar, totalPorCobrar, progresoPrendas,
    ESTADO_ORDEN as O, ESTADO_PRENDA as P, ESTADO_PAGO
} from '../estadoOrden.js';

describe('derivarEstadoOrden', () => {
    it('RN-04: sin prendas -> Pendiente', () => {
        expect(derivarEstadoOrden(O.PENDIENTE, [])).toBe(O.PENDIENTE);
        expect(derivarEstadoOrden(O.EN_PROCESO, [])).toBe(O.PENDIENTE);
    });

    it('RN-17 / CP-47: alguna prenda Pendiente o En Proceso -> En Proceso', () => {
        expect(derivarEstadoOrden(O.PENDIENTE, [P.PENDIENTE])).toBe(O.EN_PROCESO);
        expect(derivarEstadoOrden(O.LISTA, [P.TERMINADA, P.EN_PROCESO])).toBe(O.EN_PROCESO);
        expect(derivarEstadoOrden(O.LISTA, [P.ENTREGADA, P.PENDIENTE])).toBe(O.EN_PROCESO);
    });

    it('RN-06 / CP-46: todas terminadas -> Lista para Entregar', () => {
        expect(derivarEstadoOrden(O.EN_PROCESO, [P.TERMINADA, P.TERMINADA])).toBe(O.LISTA);
    });

    it('RN-10: entrega parcial de una orden lista -> sigue Lista', () => {
        expect(derivarEstadoOrden(O.LISTA, [P.ENTREGADA, P.TERMINADA])).toBe(O.LISTA);
    });

    it('RN-09 / CP-19: todas entregadas -> Entregada', () => {
        expect(derivarEstadoOrden(O.LISTA, [P.ENTREGADA, P.ENTREGADA])).toBe(O.ENTREGADA);
        // Una orden reabierta vuelve a cerrarse cuando se entregan sus prendas.
        expect(derivarEstadoOrden(O.EN_PROCESO, [P.ENTREGADA])).toBe(O.ENTREGADA);
    });

    it('Cancelada y Entregada no cambian por sus prendas', () => {
        expect(derivarEstadoOrden(O.CANCELADA, [P.PENDIENTE])).toBe(O.CANCELADA);
        expect(derivarEstadoOrden(O.CANCELADA, [])).toBe(O.CANCELADA);
        expect(derivarEstadoOrden(O.ENTREGADA, [P.PENDIENTE])).toBe(O.ENTREGADA);
    });
});

describe('esOrdenActiva (RN-04)', () => {
    it('En Proceso y Lista para Entregar son activas', () => {
        expect(esOrdenActiva({ id_estado_orden: O.EN_PROCESO })).toBe(true);
        expect(esOrdenActiva({ id_estado_orden: O.LISTA })).toBe(true);
    });

    it('sin prendas (Pendiente), Entregada y Cancelada no', () => {
        expect(esOrdenActiva({ id_estado_orden: O.PENDIENTE })).toBe(false);
        expect(esOrdenActiva({ id_estado_orden: O.ENTREGADA })).toBe(false);
        expect(esOrdenActiva({ id_estado_orden: O.CANCELADA })).toBe(false);
        expect(esOrdenActiva(null)).toBe(false);
    });
});

describe('estadoDePago (RN-28, HU-37)', () => {
    it('CP-77: saldo cero -> Pagada', () => {
        expect(estadoDePago({ valor_total: 50000, saldo_pendiente: 0 })).toBe(ESTADO_PAGO.PAGADA);
    });

    it('CP-78: queda saldo -> Pendiente', () => {
        expect(estadoDePago({ valor_total: 50000, saldo_pendiente: 1 })).toBe(ESTADO_PAGO.PENDIENTE);
    });

    it('saldo negativo heredado de la v1 -> Pagada', () => {
        expect(estadoDePago({ valor_total: 60000, saldo_pendiente: -40000 })).toBe(ESTADO_PAGO.PAGADA);
    });

    it('sin nada que cobrar todavía -> sin estado de pago', () => {
        expect(estadoDePago({ valor_total: 0, saldo_pendiente: 0 })).toBeNull();
        expect(estadoDePago(null)).toBeNull();
    });
});

describe('progresoPrendas', () => {
    it('cuenta como terminadas las terminadas y las entregadas', () => {
        const prendas = [P.PENDIENTE, P.EN_PROCESO, P.TERMINADA, P.ENTREGADA].map(id_estado_prenda => ({ id_estado_prenda }));
        expect(progresoPrendas(prendas)).toEqual({ terminadas: 2, total: 4, faltan: 2 });
    });

    it('sin prendas', () => {
        expect(progresoPrendas([])).toEqual({ terminadas: 0, total: 0, faltan: 0 });
    });
});

describe('ordenesPorCobrar y totalPorCobrar (HU-36)', () => {
    const ordenes = [
        { id_orden: 1, id_estado_orden: O.EN_PROCESO, saldo_pendiente: 5000 },
        { id_orden: 2, id_estado_orden: O.ENTREGADA, saldo_pendiente: 12000 }, // RN-30: entregada con deuda
        { id_orden: 3, id_estado_orden: O.LISTA, saldo_pendiente: 0 },
        { id_orden: 4, id_estado_orden: O.CANCELADA, saldo_pendiente: 8000 },
        { id_orden: 5, id_estado_orden: O.EN_PROCESO, saldo_pendiente: -40000 } // heredado de la v1
    ];

    it('CP-75: sólo las que deben, de mayor a menor deuda, incluidas las entregadas', () => {
        expect(ordenesPorCobrar(ordenes).map(o => o.id_orden)).toEqual([2, 1]);
    });

    it('las canceladas no se cobran, igual que en el panel', () => {
        expect(totalPorCobrar(ordenes)).toBe(17000);
    });

    it('CP-76: sin deudas la lista queda vacía', () => {
        expect(ordenesPorCobrar([{ id_orden: 9, id_estado_orden: O.ENTREGADA, saldo_pendiente: 0 }])).toEqual([]);
        expect(totalPorCobrar([])).toBe(0);
    });

    it('no reordena el arreglo original', () => {
        const copia = [...ordenes];
        ordenesPorCobrar(ordenes);
        expect(ordenes).toEqual(copia);
    });
});
