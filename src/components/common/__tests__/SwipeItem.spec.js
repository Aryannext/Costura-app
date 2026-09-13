import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../../../composables/useHaptics.js', () => ({
    useHaptics: () => ({ hapticImpactHeavy: vi.fn() })
}));

import SwipeItem from '../SwipeItem.vue';

const toque = (x, y = 10) => ({ touches: [{ clientX: x, clientY: y }] });

describe('SwipeItem', () => {
    it('en reposo el botón de eliminar no se ve detrás de la tarjeta', () => {
        const wrapper = mount(SwipeItem, { slots: { default: '<div class="tarjeta">Prenda</div>' } });
        expect(wrapper.find('.swipe-actions').isVisible()).toBe(false);
    });

    it('al deslizar a la izquierda aparece y al tocarlo emite delete', async () => {
        const wrapper = mount(SwipeItem, { slots: { default: '<div>Prenda</div>' } });

        await wrapper.trigger('touchstart', toque(200));
        await wrapper.trigger('touchmove', toque(80));
        await wrapper.trigger('touchend');

        expect(wrapper.find('.swipe-actions').isVisible()).toBe(true);
        await wrapper.find('.delete-btn').trigger('click');
        expect(wrapper.emitted('delete')).toHaveLength(1);
    });

    it('deshabilitado no tiene acción', () => {
        const wrapper = mount(SwipeItem, { props: { disabled: true }, slots: { default: '<div>Pago</div>' } });
        expect(wrapper.find('.swipe-actions').exists()).toBe(false);
    });
});
