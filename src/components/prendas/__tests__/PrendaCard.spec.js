import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.mock('../../../composables/usePrendas.js', () => ({
    usePrendas: () => ({ fetchFotos: vi.fn(), fetchObservaciones: vi.fn(), removeFoto: vi.fn(), editPrenda: vi.fn() })
}));
vi.mock('../../../services/photoStorage.js', () => ({ resolvePhotoSrc: (ruta) => ruta }));

import PrendaCard from '../PrendaCard.vue';

const prenda = (id_estado_prenda, extra = {}) => ({
    id_prenda: 7,
    id_orden: 1,
    id_estado_prenda,
    tipo_nombre: 'Pantalón',
    valor: 20000,
    descripcion_arreglo: 'Basta',
    ...extra
});

function montar(estado, { readonly = false, extra = {} } = {}) {
    const toast = vi.fn();
    const wrapper = mount(PrendaCard, {
        props: { prenda: prenda(estado, extra), readonly },
        global: { provide: { toast }, stubs: { PhotoViewerModal: true } }
    });
    const estados = () => wrapper.findAll('.estado-btn');
    const actual = () => estados().filter(b => b.attributes('aria-pressed') === 'true').map(b => b.text());
    return { wrapper, toast, estados, actual };
}

describe('PrendaCard · estados a la vista', () => {
    it('muestra los cuatro estados y marca el actual', () => {
        const { estados, actual } = montar(2);
        expect(estados().map(b => b.text())).toEqual(['Pendiente', 'En proceso', 'Terminada', 'Entregada']);
        expect(actual()).toEqual(['En proceso']);
    });

    it('tocar otro estado lo pide, sin marcarlo hasta que la lista se recargue (P1-14)', async () => {
        const { wrapper, estados, actual } = montar(1);

        await estados()[2].trigger('click');

        expect(wrapper.emitted('estado-changed')).toEqual([[7, 3]]);
        expect(actual()).toEqual(['Pendiente']);

        await wrapper.setProps({ prenda: prenda(3) });
        expect(actual()).toEqual(['Terminada']);
    });

    it('tocar el estado actual no pide nada', async () => {
        const { wrapper, estados } = montar(2);
        await estados()[1].trigger('click');
        expect(wrapper.emitted('estado-changed')).toBeUndefined();
    });

    it('CP-18: Entregada está apagada mientras la prenda no esté terminada', () => {
        expect(montar(2).estados()[3].attributes('disabled')).toBeDefined();
        expect(montar(3).estados()[3].attributes('disabled')).toBeUndefined();
    });

    it('en una orden cerrada no se cambia nada ni se edita', () => {
        const { wrapper, estados, actual } = montar(4, { readonly: true });
        expect(estados().every(b => b.attributes('disabled') !== undefined)).toBe(true);
        expect(actual()).toEqual(['Entregada']);
        expect(wrapper.findAll('.accion').map(b => b.text())).toEqual(['Fotos', 'Notas']);
    });
});

describe('PrendaCard · acciones con nombre', () => {
    it('Fotos y Notas muestran cuántas hay', () => {
        const { wrapper } = montar(2, { extra: { fotografias: [{}, {}], observaciones: [{}] } });
        expect(wrapper.findAll('.accion').map(b => b.text().replace(/\s+/g, ''))).toEqual(['Fotos2', 'Notas1', 'Editar']);
    });

    it('abrir Fotos ofrece tomar una', async () => {
        const { wrapper } = montar(2);
        await wrapper.findAll('.accion')[0].trigger('click');
        await wrapper.find('.foto-nueva').trigger('click');
        expect(wrapper.emitted('take-photo')).toHaveLength(1);
    });

    it('abrir Notas ofrece añadir una', async () => {
        const { wrapper } = montar(2);
        await wrapper.findAll('.accion')[1].trigger('click');
        await wrapper.find('.nota-nueva').trigger('click');
        expect(wrapper.emitted('add-obs')).toHaveLength(1);
    });
});
