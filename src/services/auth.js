import { getUsuarioByUsername, updateUltimoAcceso } from '../database/queries/auth.js';
import bcrypt from 'bcryptjs';
import { Preferences } from '@capacitor/preferences';
import router from '../router/index.js';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in ms
let inactivityTimer = null;

let currentUser = null;

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

    startInactivityTimer();
    return true;
}

export async function logout() {
    currentUser = null;
    stopInactivityTimer();
    if (router && router.currentRoute.value.path !== '/login') {
        router.push('/login');
    }
}

export async function isAuthenticated() {
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
    return currentUser;
}
