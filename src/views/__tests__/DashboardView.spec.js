import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => router }));

const datos = vi.hoisted(() => ({
    kpis: { ordenesAtrasadas: 1, ordenesListas: 3, ordenesSinReclamar: 2, diasSinReclamar: 30, saldosPendientes: 17000, ordenesPorCobrar: 2 },
    atrasadas: [
        { id_orden: 9, id_estado_orden: 2, estado_nombre: 'En Proceso', cliente_nombre: 'Jorge Díaz', fecha_entrega_estimada: '2026-09-11', saldo_pendiente: 0 }
    ],
    proximas: [
        { id_orden: 12, id_estado_orden: 3, estado_nombre: 'Lista para Entregar', cliente_nombre: 'Marta Rincón', fecha_entrega_estimada: '2026-09-14', saldo_pendiente: 25000 },
        { id_orden: 14, id_estado_orden: 2, estado_nombre: 'En Proceso', cliente_nombre: 'Luis Pardo', fecha_entrega_estimada: '2026-09-16', saldo_pendiente: 0 }
    ],
    triggerRecordatorios: null
}));

vi.mock('../../composables/useReportes.js', async () => {
    const { ref } = await import('vue');
    return {
        useReportes: () => ({
            kpis: ref(datos.kpis),
            atrasadas: ref(datos.atrasadas),
            proximasEntregas: ref(datos.proximas),
            loading: ref(false),
            fetchDashboardData: vi.fn()
        })
    };
});
vi.mock('../../composables/useNotificaciones.js', async () => {
    const { ref } = await import('vue');
    const { vi: vitest } = await import('vitest');
    datos.triggerRecordatorios = vitest.fn().mockResolvedValue(3);
    return { useNotificaciones: () => ({ loading: ref(false), triggerRecordatorios: datos.triggerRecordatorios }) };
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

describe('DashboardView · qué hacer hoy', () => {
    beforeAll(() => {
        // Domingo 13 de septiembre de 2026, para que "Mañana" y las fechas no dependan del día en que corre la prueba.
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 8, 13, 10, 0, 0));
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('abre con la fecha de hoy', async () => {
        const wrapper = await montar();
        expect(wrapper.find('.hoy').text()).toContain('Domingo 13 de septiembre');
    });

    it('ordena por urgencia: atrasadas, para entregar pronto y listas esperando al cliente', async () => {
        const wrapper = await montar();
        const grupos = wrapper.findAll('.grupo-t').map(g => [g.text().replace(/\d+$/, ''), g.find('.cuenta').text()]);
        expect(grupos).toEqual([['Atrasadas', '1'], ['Para entregar pronto', '2'], ['Listas, esperando al cliente', '3']]);
    });

    it('las fechas se leen como "Mañana" o "16 sep", sin correrse por la zona horaria', async () => {
        const wrapper = await montar();
        const texto = wrapper.text();
        expect(texto).toContain('Debía entregarse el 11 sep');
        expect(texto).toContain('Entrega: Mañana · debe $25.000');
        expect(texto).toContain('Entrega: 16 sep');
        expect(texto).not.toContain('15 sep');
    });

    it('P1-13: cada estado se pinta con su propio color', async () => {
        const wrapper = await montar();
        const distintivos = wrapper.findAll('.status-badge').map(b => [b.text(), b.classes()]);
        expect(distintivos).toEqual([
            ['En Proceso', ['status-badge', 'status-proceso']],
            ['Lista para Entregar', ['status-badge', 'status-lista']],
            ['En Proceso', ['status-badge', 'status-proceso']]
        ]);
    });

    it('muestra lo que hay por cobrar con separador de miles', async () => {
        const wrapper = await montar();
        expect(wrapper.find('.kpi-card--enlace .kpi-value').text()).toBe('$17.000');
        expect(wrapper.find('.kpi-card--enlace').text()).toContain('en 2 órdenes');
    });

    it('HU-36: lo que hay por cobrar lleva a la lista de órdenes por cobrar', async () => {
        const wrapper = await montar();
        await wrapper.find('.kpi-card--enlace').trigger('click');
        expect(router.push).toHaveBeenCalledWith({ path: '/ordenes', query: { tab: 'por-cobrar' } });
    });

    it('el recordatorio a clientes está junto a las órdenes listas', async () => {
        const wrapper = await montar();
        expect(wrapper.find('.grupo--listas').text()).toContain('2 llevan más de 30 días sin que la recojan');

        await wrapper.find('.btn-recordar').trigger('click');

        expect(datos.triggerRecordatorios).toHaveBeenCalledTimes(1);
    });
});
