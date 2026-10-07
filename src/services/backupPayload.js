/**
 * Formato del contenido que va dentro del sobre cifrado.
 *
 *   1  El texto era directamente la exportación JSON de SQLite. No llevaba
 *      fotografías, así que restaurar en un teléfono nuevo dejaba la galería vacía.
 *   2  Un objeto { formato, baseDatos, fotografias } donde `fotografias` mapea
 *      nombre de archivo -> contenido en base64.
 *
 * El número de versión del sobre criptográfico es otra cosa distinta y vive en
 * cryptoService: uno describe el cifrado, este describe lo que hay dentro.
 */
export const FORMATO_RESPALDO = 2;

export function construirPayload(baseDatos, fotografias = {}) {
    return JSON.stringify({
        formato: FORMATO_RESPALDO,
        baseDatos,
        fotografias
    });
}

/**
 * Interpreta el contenido descifrado, aceptando también los respaldos antiguos
 * para que nadie se quede sin poder restaurar una copia que ya tenía guardada.
 */
export function leerPayload(textoDescifrado) {
    let datos;
    try {
        datos = JSON.parse(textoDescifrado);
    } catch (e) {
        throw new Error('El respaldo no tiene un formato válido.');
    }

    if (datos && datos.formato === FORMATO_RESPALDO && datos.baseDatos) {
        return {
            formato: FORMATO_RESPALDO,
            baseDatosJson: JSON.stringify(datos.baseDatos),
            fotografias: datos.fotografias || {}
        };
    }

    return {
        formato: 1,
        baseDatosJson: textoDescifrado,
        fotografias: {}
    };
}

export function enMegabytes(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1);
}
