import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';

const ruta = vi.hoisted(() => ({ query: {} }));
vi.mock('vue-router', () => ({
    useRoute: () => ruta,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

const datos = vi.hoisted(() => ({ ordenes: null }));
vi.mock('../../composables/useOrdenes.js', async () => {
    const { ref } = await import('vue');
    datos.ordenes = ref([]);
    return {
        useOrdenes: () => ({
            ordenes: datos.ordenes,
            loading: ref(false),
            error: ref(null),
            fetchOrdenes: vi.fn(),
            saveOrden: vi.fn()
        })
    };
});
vi.mock('../../components/ordenes/OrdenForm.vue', () => ({ default: { template: '<div />' } }));

import OrdenesView from '../OrdenesView.vue';

const ORDENES = [
    { id_orden: 1, id_estado_orden: 2, estado_nombre: 'En Proceso', cliente_nombre: 'Ana', fecha_entrega_estimada: '2026-10-01', valor_total: 20000, saldo_pendiente: 5000 },
    { id_orden: 2, id_estado_orden: 4, estado_nombre: 'Entregada', cliente_nombre: 'Luis', fecha_entrega_estimada: '2026-09-01', valor_total: 30000, saldo_pendiente: 12000 },
    { id_orden: 3, id_estado_orden: 3, estado_nombre: 'Lista para Entregar', cliente_nombre: 'Marta', fecha_entrega_estimada: '2026-09-20', valor_total: 10000, saldo_pendiente: 0 },
    { id_orden: 4, id_estado_orden: 5, estado_nombre: 'Cancelada', cliente_nombre: 'Pedro', fecha_entrega_estimada: '2026-09-10', valor_total: 8000, saldo_pendiente: 8000 }
];

function montar(query = {}) {
    ruta.query = query;
    return mount(OrdenesView, { global: { provide: { toast: vi.fn() } } });
}

const numeros = (wrapper) => wrapper.findAll('.orden-id').map(n => n.text());

describe('OrdenesView · órdenes por cobrar (HU-36, P1-12)', () => {
    beforeEach(() => {
        datos.ordenes.value = ORDENES;
    });

    it('CP-75: muestra sólo las que deben, con cliente y saldo, de mayor a menor, y el total', async () => {
        const wrapper = montar();

        await wrapper.findAll('.tab-btn').find(b => b.text() === 'Por cobrar').trigger('click');

        expect(numeros(wrapper)).toEqual(['#2', '#1']);
        expect(wrapper.text()).toContain('Luis');
        expect(wrapper.text()).toContain('Saldo: $12000 / $30000');
        expect(wrapper.find('.total-por-cobrar').text()).toBe('Total por cobrar: $17000');
    });

    it('el panel abre directamente esta pestaña con ?tab=por-cobrar', () => {
        const wrapper = montar({ tab: 'por-cobrar' });
        expect(numeros(wrapper)).toEqual(['#2', '#1']);
    });

    it('CP-76: sin órdenes con deuda lo dice, sin total', () => {
        datos.ordenes.value = [ORDENES[2]];
        const wrapper = montar({ tab: 'por-cobrar' });

        expect(wrapper.text()).toContain('No hay órdenes pendientes de pago.');
        expect(wrapper.find('.total-por-cobrar').exists()).toBe(false);
    });

    it('la pestaña Activas no cambia', () => {
        const wrapper = montar();
        expect(numeros(wrapper)).toEqual(['#1', '#3']);
        expect(wrapper.find('.total-por-cobrar').exists()).toBe(false);
    });
});
