/**
 * Conexión con la Vitrina de Modistas (D-15): la página pública donde la modista
 * publica las prendas que hizo para vender y sus servicios de arreglo.
 *
 * Es lo único de la app que necesita internet y un servidor. Solo viaja lo que
 * la modista publica (perfil del taller y prendas con su foto); las clientas,
 * órdenes, medidas y pagos se quedan en el teléfono (D-06).
 *
 * El código de la vitrina se guarda en la tabla `configuracion`, así viaja en la
 * copia de seguridad y un teléfono nuevo recupera la vitrina al restaurarla.
 */
import { getConfig, updateConfig } from '../database/queries/configuracion.js';

export const URL_VITRINA = (import.meta.env.VITE_VITRINA_URL || 'https://proyectosena.online/vitrina')
    .replace(/\/+$/, '');

export const CLAVE_TOKEN_VITRINA = 'vitrina_token';

export const CATEGORIAS_VITRINA = ['Vestidos', 'Blusas', 'Faldas', 'Pantalones', 'Chaquetas', 'Niños', 'Uniformes', 'Otros'];

export class ErrorVitrina extends Error {
    constructor(mensaje, estado = 0) {
        super(mensaje);
        this.estado = estado;
    }
}

export async function leerTokenVitrina() {
    return (await getConfig(CLAVE_TOKEN_VITRINA)) || '';
}

/** El nombre que la modista ya puso en Ajustes, para no pedirlo dos veces */
export async function nombreDelTaller() {
    return (await getConfig('nombre_taller')) || '';
}

async function guardarToken(token) {
    await updateConfig(CLAVE_TOKEN_VITRINA, token);
}

export async function olvidarVitrina() {
    await guardarToken('');
}

async function llamar(ruta, { metodo = 'GET', cuerpo, token } = {}) {
    const headers = {};
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    let respuesta;
    try {
        respuesta = await fetch(`${URL_VITRINA}${ruta}`, {
            method: metodo,
            headers,
            body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
        });
    } catch {
        throw new ErrorVitrina('No hay conexión con la vitrina. Revisa tu internet e intenta de nuevo.');
    }

    if (respuesta.status === 204) return null;
    let datos = null;
    try {
        datos = await respuesta.json();
    } catch {
        // Una página de error del proxy, por ejemplo
    }
    if (!respuesta.ok) {
        throw new ErrorVitrina(datos?.error || 'La vitrina no respondió bien. Intenta en un rato.', respuesta.status);
    }
    return datos;
}

async function conToken(ruta, opciones = {}) {
    const token = await leerTokenVitrina();
    if (!token) throw new ErrorVitrina('Todavía no tienes una vitrina.', 401);
    return llamar(ruta, { ...opciones, token });
}

/** Crea la vitrina del taller y guarda su código. Queda pendiente de aprobación. */
export async function crearVitrina(perfil) {
    const { token, ...vitrina } = await llamar('/api/modistas', { metodo: 'POST', cuerpo: perfil });
    await guardarToken(token);
    return vitrina;
}

/**
 * Vincula una vitrina que ya existe con el código que dio la administración
 * (por ejemplo, después de perder el teléfono). Solo guarda el código si sirve.
 */
export async function vincularVitrina(codigo) {
    const token = String(codigo || '').trim();
    if (!token) throw new ErrorVitrina('Escribe el código de tu vitrina.');
    const vitrina = await llamar('/api/mi-vitrina', { token });
    await guardarToken(token);
    return vitrina;
}

export function cargarMiVitrina() {
    return conToken('/api/mi-vitrina');
}

export function actualizarPerfilVitrina(cambios) {
    return conToken('/api/mi-vitrina', { metodo: 'PUT', cuerpo: cambios });
}

/** `foto` es el JPEG en base64, tal como lo entrega la cámara */
export function publicarPrenda(prenda) {
    return conToken('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: prenda });
}

export function marcarVendida(id, vendida) {
    return conToken(`/api/mi-vitrina/prendas/${id}`, { metodo: 'PATCH', cuerpo: { vendida } });
}

export function cambiarPrecio(id, precio) {
    return conToken(`/api/mi-vitrina/prendas/${id}`, { metodo: 'PATCH', cuerpo: { precio } });
}

export function quitarPrenda(id) {
    return conToken(`/api/mi-vitrina/prendas/${id}`, { metodo: 'DELETE' });
}

/** Borra el perfil, las prendas y las fotos del servidor, y olvida el código */
export async function borrarVitrina() {
    await conToken('/api/mi-vitrina', { metodo: 'DELETE' });
    await olvidarVitrina();
}

export function urlFotoVitrina(ruta) {
    return `${URL_VITRINA}/${ruta}`;
}
