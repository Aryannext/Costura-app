/**
 * Utilidades de fecha en hora LOCAL.
 *
 * `toISOString()` devuelve la fecha en UTC: en Colombia, a partir de las 19:00
 * ya está contando el día siguiente. La base de datos guarda las fechas con
 * `datetime('now','localtime')`, así que mezclar ambas producía consultas del
 * día equivocado, alarmas descuadradas y fechas de entrega que el propio
 * formulario se negaba a aceptar.
 */

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const dosDigitos = n => String(n).padStart(2, '0');

/** 'YYYY-MM-DD' en hora local. */
export function fechaLocalISO(fecha = new Date()) {
    return `${fecha.getFullYear()}-${dosDigitos(fecha.getMonth() + 1)}-${dosDigitos(fecha.getDate())}`;
}

/**
 * Interpreta un valor como medianoche LOCAL.
 * `new Date('2026-09-09')` es medianoche UTC, que al oeste de Greenwich cae el
 * día anterior; esta función lo evita tratando las cadenas de sólo fecha por
 * sus componentes.
 */
export function aFechaLocal(valor) {
    const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor));
    if (soloFecha) {
        return new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
    }
    const fecha = new Date(valor);
    fecha.setHours(0, 0, 0, 0);
    return fecha;
}

/** Copia de la fecha desplazada `dias` días. No modifica la original. */
export function sumarDias(fecha, dias) {
    const resultado = new Date(fecha);
    resultado.setDate(resultado.getDate() + dias);
    return resultado;
}

/** Días enteros entre dos fechas, comparando medianoches locales. */
export function diasDeDiferencia(desde, hasta) {
    const a = aFechaLocal(desde);
    const b = aFechaLocal(hasta);
    return Math.round((b - a) / 86400000);
}

/** "14 sep". Acepta 'YYYY-MM-DD' o una fecha con hora de la base. */
export function fechaCorta(valor) {
    if (!valor) return '';
    return format(aFechaLocal(valor), 'd MMM', { locale: es });
}

/** "Domingo 13 de septiembre". */
export function fechaLarga(fecha = new Date()) {
    const texto = format(fecha, "EEEE d 'de' MMMM", { locale: es });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Hoy", "Mañana", "Ayer" o "15 sep": cómo se lee una fecha de entrega en una lista. */
export function etiquetaDia(valor, hoy = new Date()) {
    if (!valor) return '';
    const dias = diasDeDiferencia(hoy, valor);
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    if (dias === -1) return 'Ayer';
    return fechaCorta(valor);
}
