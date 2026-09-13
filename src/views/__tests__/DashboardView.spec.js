import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => router }));

vi.mock('../../composables/useReportes.js', async () => {
    const { ref } = await import('vue');
    return {
        useReportes: () => ({
            kpis: ref({ ordenesActivas: 2, saldosPendientes: 17000 }),
            proximasEntregas: ref([
                { id_orden: 1, id_estado_orden: 2, estado_nombre: 'En Proceso', cliente_nombre: 'Ana', fecha_entrega_estimada: '2026-09-15' },
                { id_orden: 2, id_estado_orden: 3, estado_nombre: 'Lista para Entregar', cliente_nombre: 'Luis', fecha_entrega_estimada: '2026-09-16' }
            ]),
            ordenesRecientes: ref([
                { id_orden: 3, id_estado_orden: 4, estado_nombre: 'Entregada', cliente_nombre: 'Marta', fecha_creacion: '2026-09-10 10:00:00' },
                { id_orden: 4, id_estado_orden: 5, estado_nombre: 'Cancelada', cliente_nombre: 'Pedro', fecha_creacion: '2026-09-11 10:00:00' }
            ]),
            loading: ref(false),
            fetchDashboardData: vi.fn()
        })
    };
});
vi.mock('../../composables/useNotificaciones.js', async () => {
    const { ref } = await import('vue');
    return { useNotificaciones: () => ({ loading: ref(false), triggerRecordatorios: vi.fn() }) };
});
vi.mock('../../composables/useNotificacionesLocales.js', () => ({
    useNotificacionesLocales: () => ({ requestPermissions: vi.fn(), scheduleDailyReminders: vi.fn() })
}));
vi.mock('../../composables/useSearch.js', async () => {
    const { ref } = await import('vue');
    return {
        useSearch: () => ({
            globalQuery: ref(''),
            searchLoading: ref(false),
            searchResults: ref({ clientes: [], ordenes: [] }),
            performSearch: vi.fn()
        })
    };
});

import DashboardView from '../DashboardView.vue';

async function montar() {
    const wrapper = mount(DashboardView, { global: { provide: { toast: vi.fn() } } });
    await flushPromises();
    return wrapper;
}

describe('DashboardView', () => {
    it('P1-13: cada estado se pinta con su propio color', async () => {
        const wrapper = await montar();

        const distintivos = wrapper.findAll('.status-badge').map(b => [b.text(), b.classes()]);

        // Antes un mapa desplazado en uno pintaba Entregada como Lista y Cancelada como Entregada.
        expect(distintivos).toEqual([
            ['En Proceso', ['status-badge', 'status-proceso']],
            ['Lista para Entregar', ['status-badge', 'status-lista']],
            ['Entregada', ['status-badge', 'status-entregada']],
            ['Cancelada', ['status-badge', 'status-cancelada']]
        ]);
    });

    it('HU-36: la tarjeta de pagos pendientes lleva a la lista de órdenes por cobrar', async () => {
        const wrapper = await montar();

        await wrapper.find('.kpi-card--enlace').trigger('click');

        expect(router.push).toHaveBeenCalledWith({ path: '/ordenes', query: { tab: 'por-cobrar' } });
    });
});
