import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

/**
 * Tope de fotografías que se pueden meter dentro de un respaldo. El bot de
 * Telegram rechaza documentos de más de 50 MB, y entre el base64 y el cifrado
 * el archivo final pesa cerca del doble que las fotos en crudo.
 */
export const PHOTO_BACKUP_LIMIT_BYTES = 20 * 1024 * 1024;

let baseUri = null;

/**
 * Resuelve una vez la ruta real del directorio de datos. Se cachea para que
 * `resolvePhotoSrc` pueda ser síncrona y usarse directo en un `<img :src>`.
 */
export async function initPhotoStorage() {
    try {
        const { uri } = await Filesystem.getUri({ path: '', directory: Directory.Data });
        baseUri = uri.replace(/\/+$/, '');
    } catch (e) {
        console.warn("No se pudo resolver el directorio de fotografías", e);
        baseUri = null;
    }
    return baseUri;
}

/**
 * Rutas absolutas guardadas por versiones anteriores. Dejaron de usarse porque
 * el directorio de datos cambia de sitio al reinstalar, y las fotos quedaban
 * apuntando a un lugar inexistente.
 */
export function esRutaHeredada(ruta) {
    return !!ruta && (ruta.includes('://') || ruta.startsWith('/'));
}

export function nombreDeArchivo(ruta) {
    if (!ruta) return '';
    return ruta.split(/[\\/]/).pop();
}

/** URL lista para un `<img>`. Acepta tanto el formato nuevo como el heredado. */
export function resolvePhotoSrc(ruta) {
    if (!ruta) return '';
    if (ruta.startsWith('http') || ruta.startsWith('data:')) return ruta;
    if (esRutaHeredada(ruta)) return Capacitor.convertFileSrc(ruta);
    if (!baseUri) return '';
    return Capacitor.convertFileSrc(`${baseUri}/${ruta}`);
}

export async function savePhotoFromBase64(base64, filename) {
    await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Data
    });
    return filename;
}

function opcionesDeLectura(ruta) {
    return esRutaHeredada(ruta)
        ? { path: ruta }
        : { path: ruta, directory: Directory.Data };
}

export async function readPhotoAsBase64(ruta) {
    const { data } = await Filesystem.readFile(opcionesDeLectura(ruta));
    return typeof data === 'string' ? data : null;
}

/**
 * Borra el archivo de una foto. No lanza: un archivo que ya no existe no es un
 * error para quien elimina la prenda. Devuelve si llegó a borrarse.
 */
export async function deletePhotoFile(ruta) {
    if (!ruta || ruta.startsWith('http') || ruta.startsWith('data:')) return false;
    try {
        await Filesystem.deleteFile(opcionesDeLectura(ruta));
        return true;
    } catch (e) {
        console.warn("No se pudo borrar el archivo de la fotografía", ruta, e);
        return false;
    }
}

/** Tamaño en bytes, o 0 si el archivo ya no está. */
export async function photoSizeInBytes(ruta) {
    try {
        const { size } = await Filesystem.stat(opcionesDeLectura(ruta));
        return typeof size === 'number' ? size : 0;
    } catch (e) {
        return 0;
    }
}
