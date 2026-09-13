import { describe, it, expect } from 'vitest';
import { derivarEstadoOrden, ESTADO_ORDEN as O, ESTADO_PRENDA as P } from '../estadoOrden.js';

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
