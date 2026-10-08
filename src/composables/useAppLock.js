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
// true sólo si fue ESTA salida a segundo plano la que bloqueó la sesión
let bloqueoPorEstaSalida = false;
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
                const yaBloqueada = isLocked.value;
                backgroundedAt = Date.now();
                // Se bloquea ya al salir, no al volver, para que la miniatura
                // del selector de aplicaciones no muestre datos de clientes.
                lockSession();
                bloqueoPorEstaSalida = !yaBloqueada && isLocked.value;
                return;
            }

            // Al volver, una ausencia corta se levanta sola y sin parpadeo, pero
            // sólo si el bloqueo lo puso esta misma salida. Cualquier otro (el del
            // arranque en frío, uno anterior) pide clave o huella. Antes bastaba
            // un regreso sin salida registrada para desbloquear: pasaba con la
            // ventana del permiso de notificaciones al arrancar en frío.
            if (bloqueoPorEstaSalida && !shouldLockAfterBackground(backgroundedAt, Date.now())) {
                releaseLockAfterShortAbsence();
            }
            backgroundedAt = null;
            bloqueoPorEstaSalida = false;
        });
    } catch (e) {
        console.warn("Bloqueo por segundo plano no disponible en este entorno", e);
    }
}
