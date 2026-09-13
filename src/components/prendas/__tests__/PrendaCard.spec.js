import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../../../composables/usePrendas.js', () => ({
    usePrendas: () => ({ fetchFotos: vi.fn(), fetchObservaciones: vi.fn(), removeFoto: vi.fn(), editPrenda: vi.fn() })
}));
vi.mock('../../../services/photoStorage.js', () => ({ resolvePhotoSrc: (ruta) => ruta }));

import PrendaCard from '../PrendaCard.vue';

const prenda = (id_estado_prenda) => ({
    id_prenda: 7,
    id_orden: 1,
    id_estado_prenda,
    estado_nombre: 'Pendiente',
    tipo_nombre: 'Pantalón',
    valor: 20000,
    descripcion_arreglo: 'Basta'
});

function montar(estado) {
    const toast = vi.fn();
    const wrapper = mount(PrendaCard, {
        props: { prenda: prenda(estado) },
        global: { provide: { toast }, stubs: { PhotoViewerModal: true } }
    });
    return { wrapper, toast, selector: () => wrapper.find('select.estado-select') };
}

describe('PrendaCard · selector de estado (P1-14)', () => {
    it('muestra el estado que tiene la prenda', () => {
        const { selector } = montar(2);
        expect(selector().element.value).toBe('2');
    });

    it('pide el cambio y sigue mostrando el estado real hasta que la lista se recargue', async () => {
        const { wrapper, selector } = montar(1);

        await selector().setValue('2');

        expect(wrapper.emitted('estado-changed')).toEqual([[7, 2]]);
        expect(selector().element.value).toBe('1');
    });

    it('cuando la lista se recarga con el cambio confirmado, muestra el nuevo estado', async () => {
        const { wrapper, selector } = montar(1);

        await selector().setValue('2');
        await wrapper.setProps({ prenda: prenda(2) });

        expect(selector().element.value).toBe('2');
    });

    it('si el cambio falla, no se queda mostrando el estado que se pidió', async () => {
        const { wrapper, selector } = montar(1);

        await selector().setValue('3');
        // La lista se recarga, pero la prenda sigue igual porque el cambio falló.
        await wrapper.setProps({ prenda: prenda(1) });

        expect(selector().element.value).toBe('1');
    });

    it('CP-18: entregar una prenda sin terminar ni siquiera se pide', async () => {
        const { wrapper, toast, selector } = montar(2);

        await selector().setValue('4');

        expect(wrapper.emitted('estado-changed')).toBeUndefined();
        expect(toast).toHaveBeenCalledWith('No se puede entregar una prenda que no está Terminada', 'error');
        expect(selector().element.value).toBe('2');
    });
});
