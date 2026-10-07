import { getUsuarioByUsername, updateUltimoAcceso } from '../database/queries/auth.js';
import bcrypt from 'bcryptjs';
import { Preferences } from '@capacitor/preferences';
import router from '../router/index.js';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in ms
let inactivityTimer = null;

let currentUser = null;

// La sesión se guarda en Preferences para no pedir la clave cada vez que Android
// cierra la app en segundo plano, pero vence tras 15 minutos sin uso (RNF-09, fallo A10).
// lastActivity se escribe como máximo cada 30 s para no gastar batería.
const PERSIST_EVERY = 30 * 1000;
let lastPersist = 0;

async function guardarSesion() {
    if (!currentUser) return;
    currentUser.lastActivity = Date.now();
    lastPersist = currentUser.lastActivity;
    await Preferences.set({ key: 'auth_user', value: JSON.stringify(currentUser) });
}

export function sesionVigente(sesion, ahora = Date.now()) {
    const ultima = sesion?.lastActivity ?? sesion?.loginTime;
    return typeof ultima === 'number' && ahora - ultima >= 0 && ahora - ultima < INACTIVITY_TIMEOUT;
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
    await guardarSesion();

    startInactivityTimer();
    return true;
}

export async function biometricLogin() {
    const user = await getUsuarioByUsername('admin');
    if (!user) throw new Error("Usuario administrador no encontrado");

    await updateUltimoAcceso(user.id_usuario);
    
    currentUser = {
        id: user.id_usuario,
        username: user.username,
        loginTime: Date.now()
    };
    await guardarSesion();

    startInactivityTimer();
    return true;
}

export async function logout() {
    currentUser = null;
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
                const sesion = JSON.parse(value);
                if (sesionVigente(sesion)) {
                    currentUser = sesion;
                    await guardarSesion();
                    startInactivityTimer();
                } else {
                    await Preferences.remove({ key: 'auth_user' });
                }
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

    if (Date.now() - lastPersist > PERSIST_EVERY) {
        guardarSesion().catch(e => console.error("Error guardando actividad:", e));
    }
    
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
