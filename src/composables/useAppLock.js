import { App as CapacitorApp } from '@capacitor/app';
import { lockSession, releaseLockAfterShortAbsence, isLocked } from '../services/auth.js';

/**
 * Tiempo que la aplicación puede pasar en segundo plano sin pedir desbloqueo.
 * Salir un momento a mirar WhatsApp no debe costar una autenticación; dejar el
 * teléfono encima del mostrador, sí.
 */
export const BACKGROUND_LOCK_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * ¿Hay que pedir desbloqueo al volver del segundo plano?
 * Se deja como función pura para poder probarla sin simular el ciclo de vida nativo.
 */
export function shouldLockAfterBackground(backgroundedAt, now, threshold = BACKGROUND_LOCK_THRESHOLD_MS) {
    if (backgroundedAt == null) return false;
    return (now - backgroundedAt) >= threshold;
}

let backgroundedAt = null;
let wasLockedBeforeBackground = false;
let listenerHandle = null;

/**
 * Engancha el bloqueo al ciclo de vida de la aplicación. Se llama una sola vez
 * al arrancar. En web, @capacitor/app traduce esto a `visibilitychange`.
 */
export async function initAppLock() {
    if (listenerHandle) return;

    try {
        listenerHandle = await CapacitorApp.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
                wasLockedBeforeBackground = isLocked.value;
                backgroundedAt = Date.now();
                // Se bloquea ya al salir, no al volver, para que la miniatura
                // del selector de aplicaciones no muestre datos de clientes.
                lockSession();
                return;
            }

            // Al volver: una ausencia corta se levanta sola y sin parpadeo, salvo
            // que la sesión ya estuviera bloqueada antes de salir.
            if (!wasLockedBeforeBackground && !shouldLockAfterBackground(backgroundedAt, Date.now())) {
                releaseLockAfterShortAbsence();
            }
            backgroundedAt = null;
            wasLockedBeforeBackground = false;
        });
    } catch (e) {
        console.warn("Bloqueo por segundo plano no disponible en este entorno", e);
    }
}
