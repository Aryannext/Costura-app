import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../StatusBadge.vue';

describe('StatusBadge.vue', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(StatusBadge, {
      props: {
        estado: 'Recibida'
      }
    });
    
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.text()).toContain('Recibida');
  });
});
