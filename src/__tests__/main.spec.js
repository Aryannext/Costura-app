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
vi.mock('vue', () => ({
    createApp: vi.fn(() => ({
        use: vi.fn(),
        mount: vi.fn()
    }))
}));
vi.mock('../router/index.js', () => ({ default: {} }));
vi.mock('../App.vue', () => ({ default: {} }));

describe('main.js bootstrap', () => {
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
});
