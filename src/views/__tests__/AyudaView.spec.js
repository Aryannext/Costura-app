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

describe('AyudaView · cada tarjeta arranca su tutorial una sola vez', () => {
    beforeEach(() => vi.clearAllMocks());

    it('Enter sobre la tarjeta arranca el tutorial', async () => {
        const wrapper = mount(AyudaView, { global: { stubs: { Icon: true } } });
        await wrapper.findAll('.mission-card')[0].trigger('keydown', { key: 'Enter' });
        expect(tours.dashboard).toHaveBeenCalledTimes(1);
    });

    it('Enter sobre el botón Jugar no lo arranca dos veces', async () => {
        const wrapper = mount(AyudaView, { global: { stubs: { Icon: true } } });
        const jugar = wrapper.findAll('.mission-card')[1].find('button');
        // El navegador manda el keydown y después el click del botón; los dos suben a la tarjeta
        await jugar.trigger('keydown', { key: 'Enter' });
        await jugar.trigger('click');
        expect(tours.cliente).toHaveBeenCalledTimes(1);
    });

    it('el botón interno no es una segunda parada del tabulador', () => {
        const wrapper = mount(AyudaView, { global: { stubs: { Icon: true } } });
        for (const boton of wrapper.findAll('.mission-card button')) {
            expect(boton.attributes('tabindex')).toBe('-1');
        }
    });
});
