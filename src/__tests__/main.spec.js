import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as conn from '../database/connection.js';

// Mock everything main.js imports
vi.mock('../database/connection.js', () => ({
    initDatabase: vi.fn()
}));
vi.mock('../database/queries/auth.js', () => ({
    setupDefaultUser: vi.fn()
}));
vi.mock('@capacitor/status-bar', () => ({ StatusBar: {}, Style: {} }));
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: {} }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('../composables/useUpdates.js', () => ({
    useUpdates: () => ({ initUpdates: vi.fn() })
}));
vi.mock('../composables/useAppLock.js', () => ({
    initAppLock: vi.fn()
}));
vi.mock('../services/photoStorage.js', () => ({
    initPhotoStorage: vi.fn()
}));
vi.mock('../composables/useTelegramBot.js', () => ({
    migrarConfigTelegramDesdeLocalStorage: vi.fn()
}));
vi.mock('../database/queries/prendas.js', () => ({
    normalizarRutasDeFotos: vi.fn()
}));
vi.mock('vue', () => ({
    createApp: vi.fn(() => ({
        use: vi.fn(),
        mount: vi.fn()
    }))
}));
vi.mock('../router/index.js', () => ({ default: {} }));
vi.mock('../App.vue', () => ({ default: {} }));

// La primera importación de main.js transforma todo su árbol; con la suite completa
// en paralelo (y más con cobertura) pasaba de los 5 s por defecto.
describe('main.js bootstrap', { timeout: 30000 }, () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
        // Reset modules so main.js runs again
        vi.resetModules();
    });

    it('should show a fatal error screen when initDatabase fails and not mount Vue', async () => {
        // Mock initDatabase to throw
        conn.initDatabase.mockRejectedValueOnce(new Error("Disk full"));

        // Import main.js dynamically to execute bootstrap()
        await import('../main.js');

        // Wait for async operations to complete
        await new Promise(process.nextTick);

        // Verify the DOM was manipulated
        const html = document.body.innerHTML;
        expect(html).toContain('Error Crítico');
        expect(html).toContain('No se pudo inicializar la base de datos.');
        expect(html).toContain('Disk full');

        // Verify Vue was NOT mounted
        const { createApp } = await import('vue');
        expect(createApp).not.toHaveBeenCalled();
    });

    it('should mount Vue when initialization succeeds', async () => {
        conn.initDatabase.mockResolvedValueOnce();

        await import('../main.js?success=1');

        await new Promise(process.nextTick);

        const { createApp } = await import('vue');
        expect(createApp).toHaveBeenCalledTimes(1);
    });

    it('should still mount Vue when a startup housekeeping step fails', async () => {
        conn.initDatabase.mockResolvedValueOnce();

        const { normalizarRutasDeFotos } = await import('../database/queries/prendas.js');
        normalizarRutasDeFotos.mockRejectedValueOnce(new Error('Ruta de foto ilegible'));

        await import('../main.js?housekeeping=1');

        await new Promise(process.nextTick);

        // Una puesta al día de arranque que falla no puede impedir abrir la app.
        const { createApp } = await import('vue');
        expect(createApp).toHaveBeenCalledTimes(1);
        expect(document.body.innerHTML).not.toContain('Error Crítico');
    });
});
