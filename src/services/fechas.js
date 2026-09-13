/**
 * Utilidades de fecha en hora LOCAL.
 *
 * `toISOString()` devuelve la fecha en UTC: en Colombia, a partir de las 19:00
 * ya está contando el día siguiente. La base de datos guarda las fechas con
 * `datetime('now','localtime')`, así que mezclar ambas producía consultas del
 * día equivocado, alarmas descuadradas y fechas de entrega que el propio
 * formulario se negaba a aceptar.
 */

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
