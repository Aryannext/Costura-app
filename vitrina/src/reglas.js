/**
 * Validación de lo que llega a la vitrina. Cada función devuelve el valor
 * limpio o lanza un ErrorDeDatos con un mensaje que se le puede mostrar a la
 * modista tal cual.
 */

export const CATEGORIAS = ['Vestidos', 'Blusas', 'Faldas', 'Pantalones', 'Chaquetas', 'Niños', 'Uniformes', 'Otros'];

/** Sube este número si cambia el texto de las condiciones que acepta la modista. */
export const VERSION_TERMINOS = 1;

export const MAX_SERVICIOS = 12;
export const MAX_PRENDAS_ACTIVAS = 60;
export const PRECIO_MAXIMO = 20_000_000;

export class ErrorDeDatos extends Error {}

function texto(valor, campo, { max, min = 0 }) {
    const limpio = typeof valor === 'string'
        // Sin caracteres de control; los saltos de línea solo sobran en campos de una línea
        ? valor.replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').trim()
        : '';
    if (limpio.length < min) {
        throw new ErrorDeDatos(min === 1 ? `Falta ${campo}.` : `${campo} es demasiado corto.`);
    }
    if (limpio.length > max) throw new ErrorDeDatos(`${campo} admite máximo ${max} caracteres.`);
    return limpio;
}

function unaLinea(valor, campo, opciones) {
    return texto(valor, campo, opciones).replace(/\s+/g, ' ');
}

function pesos(valor, campo, { min, max }) {
    const n = typeof valor === 'string' ? Number(valor.replace(/[.\s$]/g, '')) : valor;
    if (!Number.isInteger(n) || n < min || n > max) {
        throw new ErrorDeDatos(`${campo} tiene que ser un valor en pesos entre ${min.toLocaleString('es-CO')} y ${max.toLocaleString('es-CO')}.`);
    }
    return n;
}

/**
 * Celular colombiano: 10 dígitos que empiezan por 3. Se guarda con el 57
 * delante, listo para un enlace wa.me.
 */
export function whatsapp(valor) {
    let digitos = String(valor ?? '').replace(/\D/g, '');
    if (digitos.length === 12 && digitos.startsWith('57')) digitos = digitos.slice(2);
    if (!/^3\d{9}$/.test(digitos)) {
        throw new ErrorDeDatos('El WhatsApp tiene que ser un celular de 10 dígitos que empiece por 3.');
    }
    return `57${digitos}`;
}

function servicios(lista) {
    if (lista === undefined) return [];
    if (!Array.isArray(lista)) throw new ErrorDeDatos('Los servicios no tienen un formato válido.');
    if (lista.length > MAX_SERVICIOS) throw new ErrorDeDatos(`Máximo ${MAX_SERVICIOS} servicios de arreglo.`);
    return lista.map(s => ({
        nombre: unaLinea(s?.nombre, 'El nombre del servicio', { min: 1, max: 60 }),
        desde: pesos(s?.desde, 'El precio del servicio', { min: 500, max: 5_000_000 })
    }));
}

export function perfil(datos, { parcial = false } = {}) {
    if (!datos || typeof datos !== 'object') throw new ErrorDeDatos('Faltan los datos del taller.');
    const campos = {
        nombre: () => unaLinea(datos.nombre, 'El nombre del taller', { min: 3, max: 60 }),
        ciudad: () => unaLinea(datos.ciudad, 'la ciudad', { min: 1, max: 40 }),
        barrio: () => unaLinea(datos.barrio, 'el barrio', { min: 1, max: 60 }),
        whatsapp: () => whatsapp(datos.whatsapp),
        horario: () => unaLinea(datos.horario, 'El horario', { max: 80 }),
        descripcion: () => texto(datos.descripcion, 'La presentación', { max: 400 }),
        servicios: () => servicios(datos.servicios)
    };
    const limpio = {};
    for (const [campo, validar] of Object.entries(campos)) {
        if (parcial && datos[campo] === undefined) continue;
        limpio[campo] = validar();
    }
    return limpio;
}

export function prenda(datos, { parcial = false } = {}) {
    if (!datos || typeof datos !== 'object') throw new ErrorDeDatos('Faltan los datos de la prenda.');
    const campos = {
        titulo: () => unaLinea(datos.titulo, 'El nombre de la prenda', { min: 3, max: 80 }),
        categoria: () => {
            if (!CATEGORIAS.includes(datos.categoria)) throw new ErrorDeDatos('Elige una categoría de la lista.');
            return datos.categoria;
        },
        precio: () => pesos(datos.precio, 'El precio', { min: 1000, max: PRECIO_MAXIMO }),
        talla: () => unaLinea(datos.talla, 'La talla', { max: 20 }),
        tela: () => unaLinea(datos.tela, 'La tela', { max: 40 }),
        medidas: () => unaLinea(datos.medidas, 'Las medidas', { max: 160 }),
        descripcion: () => texto(datos.descripcion, 'La descripción', { max: 500 }),
        vendida: () => {
            if (typeof datos.vendida !== 'boolean') throw new ErrorDeDatos('Vendida tiene que ser sí o no.');
            return datos.vendida ? 1 : 0;
        }
    };
    const limpio = {};
    for (const [campo, validar] of Object.entries(campos)) {
        if (datos[campo] === undefined && (parcial || campo === 'vendida')) continue;
        limpio[campo] = validar();
    }
    return limpio;
}
