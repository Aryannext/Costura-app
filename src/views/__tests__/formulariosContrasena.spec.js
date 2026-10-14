/**
 * DEF-09: los formularios de contraseña dicen de qué cuenta es la clave.
 *
 * Sin un campo de usuario, aunque esté oculto, Chromium lo marca como problema de
 * accesibilidad y los gestores de contraseñas no saben a qué cuenta pertenece.
 * El inicio de sesión ya lo tenía; faltaban el cambio de clave y el bloqueo.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('@aparajita/capacitor-biometric-auth', () => ({
    BiometricAuth: { checkBiometry: vi.fn().mockResolvedValue({ isAvailable: false }) }
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('../../services/auth.js', () => ({
    getCurrentUser: vi.fn().mockResolvedValue({ username: 'admin' }),
    unlockWithPassword: vi.fn(),
    unlockAfterBiometrics: vi.fn(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    requiresPasswordChange: () => true,
    DEFAULT_PASSWORD: 'admin123'
}));

import AppLockScreen from '../../components/layout/AppLockScreen.vue';
import CambiarPasswordView from '../CambiarPasswordView.vue';

async function campoDeUsuario(componente) {
    const wrapper = mount(componente, { global: { provide: { toast: vi.fn() } } });
    await flushPromises();
    const form = wrapper.find('form');
    expect(form.exists()).toBe(true);
    return form.find('input[autocomplete="username"]');
}

describe('Formularios de contraseña con su campo de usuario (DEF-09)', () => {
    it('la pantalla de bloqueo dice de qué cuenta es la clave', async () => {
        const campo = await campoDeUsuario(AppLockScreen);

        expect(campo.exists()).toBe(true);
        expect(campo.element.value).toBe('admin');
    });

    it('el cambio de clave dice de qué cuenta es la clave', async () => {
        const campo = await campoDeUsuario(CambiarPasswordView);

        expect(campo.exists()).toBe(true);
        expect(campo.element.value).toBe('admin');
    });

    it('el campo no estorba: no se ve ni recibe el foco con Tab', async () => {
        const campo = await campoDeUsuario(CambiarPasswordView);

        expect(campo.attributes('hidden')).toBeDefined();
        expect(campo.attributes('tabindex')).toBe('-1');
    });
});
