import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

const router = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('vue-router', () => ({ useRouter: () => router }));
vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: { current: vi.fn() } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('../../services/auth.js', () => ({ logout: vi.fn() }));
vi.mock('../../composables/useUpdates.js', () => ({ useUpdates: () => ({ manualCheck: vi.fn() }) }));

const config = vi.hoisted(() => ({ guardar: null, telegram: { botToken: 'x', chatId: 'y' } }));
vi.mock('../../composables/useConfiguracionNegocio.js', async () => {
    const { ref } = await import('vue');
    const { vi: vitest } = await import('vitest');
    const dias = ref(3);
    config.guardar = vitest.fn(async (n) => { dias.value = n; });
    return {
        useConfiguracionNegocio: () => ({
            diasAnticipacion: dias,
            cargarDiasAnticipacion: vitest.fn(async () => dias.value),
            guardarDiasAnticipacion: config.guardar
        })
    };
});
vi.mock('../../composables/useTelegramBot.js', () => ({
    leerConfigTelegram: vi.fn(async () => config.telegram)
}));

import AjustesView from '../AjustesView.vue';

async function montar() {
    const wrapper = mount(AjustesView, { global: { provide: { toast: vi.fn() } } });
    await flushPromises();
    return wrapper;
}

describe('AjustesView', () => {
    beforeEach(() => {
        config.telegram = { botToken: 'x', chatId: 'y' };
    });

    it('agrupa las opciones por secciones y deja Cerrar sesión aparte', async () => {
        const wrapper = await montar();
        expect(wrapper.findAll('.grupo-t').map(g => g.text())).toEqual(['Tu taller', 'Notificaciones', 'Seguridad', 'Ayuda']);
        expect(wrapper.find('.fila--peligro').text()).toContain('Cerrar sesión');
    });

    it('los días se cambian con + y se guardan solos, con confirmación', async () => {
        const wrapper = await montar();
        expect(wrapper.find('.guardado').exists()).toBe(false);

        await wrapper.findAll('.paso')[1].trigger('click');
        await flushPromises();

        expect(config.guardar).toHaveBeenCalledWith(4);
        expect(wrapper.find('.paso-valor').text()).toBe('4');
        expect(wrapper.find('.guardado').text()).toContain('Guardado · avisa desde 4 días antes');
    });

    it('dice si Telegram está conectado', async () => {
        expect((await montar()).text()).toContain('Conectado · recibos, avisos y respaldos');

        config.telegram = { botToken: '', chatId: '' };
        expect((await montar()).text()).toContain('Sin conectar · toca para configurarlo');
    });
});
