import { describe, it, expect, vi } from 'vitest';

vi.mock('../../database/queries/ordenes.js', () => ({}));

import { mensajeConfirmacionEntrega } from '../useOrdenes.js';

describe('mensajeConfirmacionEntrega (P1-4, RN-30)', () => {
    it('orden pagada -> entrega directa, sin confirmación', () => {
        expect(mensajeConfirmacionEntrega({ saldo_pendiente: 0, valor_total: 50000 })).toBeNull();
    });

    it('orden con saldo -> pide confirmar mostrando lo que se debe', () => {
        expect(mensajeConfirmacionEntrega({ saldo_pendiente: 20000, valor_total: 50000 }))
            .toBe('El cliente todavía debe $20000 de un total de $50000. ¿Entregar la orden de todos modos?');
    });

    it('saldo negativo heredado de la v1 -> no se trata como deuda', () => {
        expect(mensajeConfirmacionEntrega({ saldo_pendiente: -40000, valor_total: 60000 })).toBeNull();
    });

    it('sin orden cargada -> null', () => {
        expect(mensajeConfirmacionEntrega(null)).toBeNull();
    });
});
