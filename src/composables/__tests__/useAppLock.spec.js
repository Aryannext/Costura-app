import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { App as CapacitorApp } from '@capacitor/app';
import {
    shouldLockAfterBackground,
    BACKGROUND_LOCK_THRESHOLD_MS,
    initAppLock
} from '../useAppLock.js';
import { isLocked, lockSession, releaseLockAfterShortAbsence } from '../../services/auth.js';

vi.mock('@capacitor/app', () => ({
    App: { addListener: vi.fn().mockResolvedValue({ remove: () => {} }) }
}));

vi.mock('../../services/auth.js', () => {
    const isLocked = { value: false };
    return {
        isLocked,
        lockSession: vi.fn(() => { isLocked.value = true; }),
        releaseLockAfterShortAbsence: vi.fn(() => { isLocked.value = false; })
    };
});

describe('shouldLockAfterBackground', () => {
    const salida = 1_000_000;

    it('Sin registro de salida -> no bloquea', () => {
        expect(shouldLockAfterBackground(null, salida)).toBe(false);
    });

    it('Ausencia corta -> no bloquea', () => {
        expect(shouldLockAfterBackground(salida, salida + 30_000)).toBe(false);
    });

    it('Ausencia justo en el umbral -> bloquea', () => {
        expect(shouldLockAfterBackground(salida, salida + BACKGROUND_LOCK_THRESHOLD_MS)).toBe(true);
    });

    it('Ausencia larga -> bloquea', () => {
        expect(shouldLockAfterBackground(salida, salida + 60 * 60_000)).toBe(true);
    });
});

describe('Ciclo de vida: segundo plano y regreso', () => {
    const INICIO = 1_000_000;
    let notificarCambioDeEstado;

    beforeAll(async () => {
        await initAppLock();
        // initAppLock sólo registra el listener una vez; se captura aquí para
        // reutilizarlo en todas las pruebas.
        notificarCambioDeEstado = CapacitorApp.addListener.mock.calls[0][1];
    });

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(INICIO));
        isLocked.value = false;
        lockSession.mockClear();
        releaseLockAfterShortAbsence.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('Salir a segundo plano bloquea de inmediato', () => {
        notificarCambioDeEstado({ isActive: false });

        expect(lockSession).toHaveBeenCalled();
        expect(isLocked.value).toBe(true);
    });

    it('Volver enseguida levanta el bloqueo solo', () => {
        notificarCambioDeEstado({ isActive: false });
        vi.setSystemTime(new Date(INICIO + 30_000));
        notificarCambioDeEstado({ isActive: true });

        expect(releaseLockAfterShortAbsence).toHaveBeenCalled();
        expect(isLocked.value).toBe(false);
    });

    it('Volver tras el umbral mantiene el bloqueo', () => {
        notificarCambioDeEstado({ isActive: false });
        vi.setSystemTime(new Date(INICIO + BACKGROUND_LOCK_THRESHOLD_MS + 1));
        notificarCambioDeEstado({ isActive: true });

        expect(releaseLockAfterShortAbsence).not.toHaveBeenCalled();
        expect(isLocked.value).toBe(true);
    });

    // Visto en el emulador (8 oct 2026): al arrancar en frío, Android muestra la
    // ventana del permiso de notificaciones antes de que la app registre el
    // listener. La app sólo recibe el regreso, y antes lo tomaba por una salida
    // corta y levantaba el bloqueo del arranque sin pedir clave ni huella.
    it('Un regreso sin salida registrada no levanta el bloqueo del arranque', () => {
        isLocked.value = true;

        notificarCambioDeEstado({ isActive: true });

        expect(releaseLockAfterShortAbsence).not.toHaveBeenCalled();
        expect(isLocked.value).toBe(true);
    });

    it('Si al salir no había sesión que bloquear, el bloqueo que llegue después no se levanta solo', () => {
        lockSession.mockImplementationOnce(() => {}); // sin sesión, lockSession no bloquea

        notificarCambioDeEstado({ isActive: false });
        isLocked.value = true; // la sesión se recupera y la app arranca bloqueada
        vi.setSystemTime(new Date(INICIO + 5_000));
        notificarCambioDeEstado({ isActive: true });

        expect(releaseLockAfterShortAbsence).not.toHaveBeenCalled();
        expect(isLocked.value).toBe(true);
    });

    it('Si ya estaba bloqueada antes de salir, volver enseguida no la desbloquea', () => {
        isLocked.value = true;

        notificarCambioDeEstado({ isActive: false });
        vi.setSystemTime(new Date(INICIO + 5_000));
        notificarCambioDeEstado({ isActive: true });

        expect(releaseLockAfterShortAbsence).not.toHaveBeenCalled();
        expect(isLocked.value).toBe(true);
    });
});
