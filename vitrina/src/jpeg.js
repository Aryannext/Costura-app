/**
 * Limpieza de las fotos que suben las modistas.
 *
 * Solo se aceptan JPEG. Antes de guardarlas se quitan los bloques de metadatos
 * (EXIF, XMP, comentarios): una foto tomada con el celular puede llevar la
 * ubicación GPS exacta de la casa del taller, el modelo del teléfono y la fecha.
 * Se conservan los bloques que hacen falta para dibujar la imagen.
 */

import { ErrorDeDatos } from './reglas.js';

const SOI = 0xd8;
const SOS = 0xda;
const EOI = 0xd9;
const APP0 = 0xe0;
const COM = 0xfe;

// Marcadores de inicio de imagen (SOF0..SOF15 menos DHT, JPG y DAC)
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

export const LADO_MAXIMO = 4096;

/**
 * Devuelve { datos, ancho, alto } con la foto sin metadatos, o lanza un ErrorDeDatos
 * con un mensaje para la modista si el archivo no es un JPEG válido.
 */
export function limpiarJpeg(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== SOI) {
        throw new ErrorDeDatos('La foto tiene que ser una imagen JPEG.');
    }

    const partes = [buffer.subarray(0, 2)];
    let i = 2;
    let ancho = 0;
    let alto = 0;

    while (i < buffer.length) {
        if (buffer[i] !== 0xff) throw new ErrorDeDatos('La foto está dañada.');
        // Bytes de relleno 0xFF antes de un marcador
        while (buffer[i] === 0xff && i < buffer.length) i++;
        const marcador = buffer[i];
        const inicio = i - 1;
        i++;

        if (marcador === EOI) {
            partes.push(buffer.subarray(inicio, i));
            break;
        }
        if (i + 2 > buffer.length) throw new ErrorDeDatos('La foto está dañada.');
        const largo = buffer.readUInt16BE(i);
        const fin = i + largo;
        if (largo < 2 || fin > buffer.length) throw new ErrorDeDatos('La foto está dañada.');

        if (SOF.has(marcador)) {
            alto = buffer.readUInt16BE(i + 3);
            ancho = buffer.readUInt16BE(i + 5);
        }

        const esMetadato = (marcador > APP0 && marcador <= 0xef) || marcador === COM;
        if (!esMetadato) partes.push(buffer.subarray(inicio, fin));

        if (marcador === SOS) {
            // Después del inicio del escaneo vienen los datos comprimidos hasta el final
            partes.push(buffer.subarray(fin));
            break;
        }
        i = fin;
    }

    if (!ancho || !alto) throw new ErrorDeDatos('La foto está dañada.');
    if (ancho > LADO_MAXIMO || alto > LADO_MAXIMO) {
        throw new ErrorDeDatos(`La foto es demasiado grande (máximo ${LADO_MAXIMO} píxeles por lado).`);
    }
    return { datos: Buffer.concat(partes), ancho, alto };
}
