import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

const tours = vi.hoisted(() => ({ dashboard: vi.fn(), cliente: vi.fn(), orden: vi.fn() }));
vi.mock('../../composables/useTutorial.js', () => ({
    useTutorial: () => ({
        startDashboardTour: tours.dashboard,
        startClienteTour: tours.cliente,
        startOrdenTour: tours.orden
    })
}));

import AyudaView from '../AyudaView.vue';

const montar = () => mount(AyudaView, { global: { stubs: { Icon: true } } });

describe('AyudaView · cada tarjeta arranca su tutorial una sola vez', () => {
    beforeEach(() => vi.clearAllMocks());

    it('cada tarjeta es un botón de verdad: el teclado y los lectores de pantalla la entienden', () => {
        const tarjetas = montar().findAll('.mission-card');
        expect(tarjetas).toHaveLength(3);
        for (const tarjeta of tarjetas) {
            expect(tarjeta.element.tagName).toBe('BUTTON');
            expect(tarjeta.attributes('type')).toBe('button');
        }
    });

    // Antes había un botón "Jugar" dentro de la tarjeta: Enter sobre él subía
    // dos eventos a la tarjeta y el tutorial arrancaba dos veces.
    it('no hay un botón dentro de otro', () => {
        expect(montar().findAll('.mission-card button')).toHaveLength(0);
    });

    it('tocar una tarjeta arranca su tutorial una vez', async () => {
        const tarjetas = montar().findAll('.mission-card');
        await tarjetas[1].find('.jugar').trigger('click');
        await tarjetas[2].trigger('click');
        expect(tours.cliente).toHaveBeenCalledTimes(1);
        expect(tours.orden).toHaveBeenCalledTimes(1);
        expect(tours.dashboard).not.toHaveBeenCalled();
    });
});
