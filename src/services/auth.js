import {
    getUsuarioByUsername,
    updateUltimoAcceso,
    updatePassword,
    isDefaultPassword,
    DEFAULT_USERNAME,
    DEFAULT_PASSWORD
} from '../database/queries/auth.js';
import bcrypt from 'bcryptjs';
import { ref } from 'vue';
import { Preferences } from '@capacitor/preferences';
import router from '../router/index.js';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in ms
let inactivityTimer = null;

let currentUser = null;

/**
 * La sesión activa todavía usa la contraseña de fábrica. Mientras valga `true`
 * la guardia del router encierra al usuario en /cambiar-clave. Es un ref para
 * que App.vue pueda ocultar la navegación de forma reactiva.
 */
export const mustChangePassword = ref(false);

export function requiresPasswordChange() {
    return mustChangePassword.value === true;
}

// Se reexpone desde aquí para que las vistas no tengan que importar nada de la
// capa de datos sólo para conocer la contraseña de fábrica.
export { DEFAULT_PASSWORD };

/**
 * Sesión iniciada pero bloqueada: los datos siguen cargados detrás, y la app
 * pide huella o contraseña para volver a mostrarlos. Es distinto de cerrar
 * sesión, que además borra la sesión y devuelve al login.
 */
export const isLocked = ref(false);

export function lockSession() {
    if (currentUser) {
        isLocked.value = true;
    }
}

/** Levanta el bloqueo sin verificar: sólo para salidas cortas a segundo plano. */
export function releaseLockAfterShortAbsence() {
    isLocked.value = false;
}

export async function unlockWithPassword(password) {
    if (!currentUser) throw new Error("No hay una sesión activa.");

    const user = await getUsuarioByUsername(currentUser.username);
    if (!user) throw new Error("No se encontró el usuario de la sesión.");

    if (!bcrypt.compareSync(password, user.password_hash)) {
        throw new Error("Contraseña incorrecta.");
    }

    isLocked.value = false;
    startInactivityTimer();
    return true;
}

/** Desbloqueo tras una verificación biométrica ya superada por la vista. */
export function unlockAfterBiometrics() {
    if (!currentUser) return false;
    isLocked.value = false;
    startInactivityTimer();
    return true;
}

/**
 * Recalcula la obligación contra la base de datos en lugar de heredarla de la
 * sesión guardada: restaurar un respaldo puede devolver la contraseña de
 * fábrica sin que la sesión se entere.
 */
async function refreshPasswordRequirement(username) {
    try {
        const user = await getUsuarioByUsername(username);
        mustChangePassword.value = user ? isDefaultPassword(user.password_hash) : false;
    } catch (e) {
        // Ante un fallo de lectura no bloqueamos la app; el siguiente inicio de
        // sesión vuelve a comprobarlo.
        console.error("No se pudo verificar el estado de la contraseña:", e);
        mustChangePassword.value = false;
    }
}

export async function login(username, password) {
    const user = await getUsuarioByUsername(username);
    if (!user) {
        throw new Error("Usuario no encontrado");
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
        throw new Error("Contraseña incorrecta");
    }

    await updateUltimoAcceso(user.id_usuario);

    currentUser = {
        id: user.id_usuario,
        username: user.username,
        loginTime: Date.now()
    };
    mustChangePassword.value = isDefaultPassword(user.password_hash);
    await Preferences.set({ key: 'auth_user', value: JSON.stringify(currentUser) });

    startInactivityTimer();
    return true;
}

export async function biometricLogin() {
    const user = await getUsuarioByUsername(DEFAULT_USERNAME);
    if (!user) throw new Error("Usuario administrador no encontrado");

    await updateUltimoAcceso(user.id_usuario);

    currentUser = {
        id: user.id_usuario,
        username: user.username,
        loginTime: Date.now()
    };
    // La huella no exime del cambio obligatorio: la contraseña sigue siendo
    // la de fábrica y cualquiera que la conozca puede entrar sin el lector.
    mustChangePassword.value = isDefaultPassword(user.password_hash);
    await Preferences.set({ key: 'auth_user', value: JSON.stringify(currentUser) });

    startInactivityTimer();
    return true;
}

/**
 * Cambia la contraseña del usuario de la sesión activa previa verificación de
 * la actual, y levanta la obligación de cambio si estaba puesta.
 */
export async function changePassword(currentPassword, newPassword) {
    const session = await getCurrentUser();
    if (!session) throw new Error("No hay una sesión activa.");

    const user = await getUsuarioByUsername(session.username);
    if (!user) throw new Error("No se encontró el usuario de la sesión.");

    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
        throw new Error("La contraseña actual no es correcta.");
    }

    await updatePassword(user.id_usuario, newPassword);
    mustChangePassword.value = false;
    return true;
}

export async function logout() {
    currentUser = null;
    mustChangePassword.value = false;
    isLocked.value = false;
    await Preferences.remove({ key: 'auth_user' });
    stopInactivityTimer();
    if (router && router.currentRoute.value.path !== '/login') {
        router.push('/login');
    }
}

export async function isAuthenticated() {
    if (!currentUser) {
        try {
            const { value } = await Preferences.get({ key: 'auth_user' });
            if (value) {
                currentUser = JSON.parse(value);
                // Arranque en frío sobre una sesión guardada: se entra bloqueado.
                // Quien recoja el teléfono tiene que identificarse aunque la
                // sesión siga viva.
                isLocked.value = true;
                await refreshPasswordRequirement(currentUser.username);
                startInactivityTimer();
            }
        } catch (e) {
            console.error("Error loading session:", e);
        }
    }
    return !!currentUser;
}

export function startInactivityTimer() {
    stopInactivityTimer();
    window.addEventListener('mousemove', resetInactivityTimer);
    window.addEventListener('keypress', resetInactivityTimer);
    window.addEventListener('touchstart', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer);
    
    inactivityTimer = setTimeout(() => {
        logout();
    }, INACTIVITY_TIMEOUT);
}

export function stopInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
        inactivityTimer = null;
    }
    window.removeEventListener('mousemove', resetInactivityTimer);
    window.removeEventListener('keypress', resetInactivityTimer);
    window.removeEventListener('touchstart', resetInactivityTimer);
    window.removeEventListener('scroll', resetInactivityTimer);
}

let resetDebounce = null;
function resetInactivityTimer() {
    if (resetDebounce) return;
    
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }
    inactivityTimer = setTimeout(() => {
        logout();
    }, INACTIVITY_TIMEOUT);
    
    // Throttle the resets slightly to avoid performance issues
    resetDebounce = setTimeout(() => {
        resetDebounce = null;
    }, 1000);
}

export async function getCurrentUser() {
    if (!currentUser) {
        await isAuthenticated();
    }
    return currentUser;
}
