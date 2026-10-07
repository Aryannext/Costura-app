import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TimelineProgressBar from '../TimelineProgressBar.vue';

describe('TimelineProgressBar', () => {
    it('usa los mismos nombres que los estados de la orden', () => {
        const wrapper = mount(TimelineProgressBar, { props: { estadoOrden: 2 } });
        expect(wrapper.findAll('.step-label').map(l => l.text())).toEqual(['Pendiente', 'En proceso', 'Lista', 'Entregada']);
    });

    it('marca como activo sólo el paso actual, y como completados los anteriores', () => {
        const wrapper = mount(TimelineProgressBar, { props: { estadoOrden: 3 } });
        const pasos = wrapper.findAll('.step');

        expect(pasos.map(p => p.classes('active'))).toEqual([false, false, true, false]);
        expect(pasos.map(p => p.classes('completed'))).toEqual([true, true, true, false]);
        expect(pasos[2].attributes('aria-current')).toBe('step');
    });

    it('no se muestra en una orden cancelada', () => {
        const wrapper = mount(TimelineProgressBar, { props: { estadoOrden: 5 } });
        expect(wrapper.find('.timeline-progress').exists()).toBe(false);
    });
});
