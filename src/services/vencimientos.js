import { aFechaLocal, fechaLocalISO, sumarDias } from './fechas.js';

/**
 * RN-38: una orden está próxima a vencer cuando su fecha estimada de entrega
 * cae dentro del período de anticipación que configura el negocio.
 *
 * Antes el período era un 3 escrito dentro de AppHeader.vue, y la clave
 * `dias_anticipacion_vencer` de la tabla `configuracion` existía sin que nadie
 * la leyera.
 */

export const DIAS_ANTICIPACION_POR_DEFECTO = 3;
export const DIAS_ANTICIPACION_MAXIMO = 30;

export const VENCIMIENTO = Object.freeze({ ATRASADA: 'atrasada', PROXIMA: 'proxima' });

/**
 * @param {string} fechaEntregaEstimada 'YYYY-MM-DD'
 * @param {Date} hoy
 * @param {number} diasAnticipacion 0 = sólo lo que se entrega hoy
 * @returns {'atrasada'|'proxima'|null}
 */
export function clasificarVencimiento(fechaEntregaEstimada, hoy, diasAnticipacion) {
    if (!fechaEntregaEstimada) return null;

    // Se compara por día, en hora local: la hora a la que se mire no importa.
    const inicioDeHoy = aFechaLocal(fechaLocalISO(hoy));
    const entrega = aFechaLocal(fechaEntregaEstimada);

    if (entrega < inicioDeHoy) return VENCIMIENTO.ATRASADA;
    // Inclusivo: con 3 días de anticipación, lo que vence dentro de 3 días ya avisa.
    if (entrega <= sumarDias(inicioDeHoy, diasAnticipacion)) return VENCIMIENTO.PROXIMA;
    return null;
}

/** RN-37: días en Lista para Entregar a partir de los cuales una orden está sin reclamar. */
export const DIAS_SIN_RECLAMAR_POR_DEFECTO = 30;
export const DIAS_SIN_RECLAMAR_MAXIMO = 365;

/** Valor guardado en `configuracion` → días válidos; si falta o está corrupto, el de por defecto. */
function interpretarDias(valor, { porDefecto, minimo, maximo }) {
    if (valor === null || valor === undefined || String(valor).trim() === '') return porDefecto;
    const dias = Number(valor);
    return Number.isInteger(dias) && dias >= minimo && dias <= maximo ? dias : porDefecto;
}

export function interpretarDiasAnticipacion(valor) {
    return interpretarDias(valor, {
        porDefecto: DIAS_ANTICIPACION_POR_DEFECTO, minimo: 0, maximo: DIAS_ANTICIPACION_MAXIMO
    });
}

export function interpretarDiasSinReclamar(valor) {
    return interpretarDias(valor, {
        porDefecto: DIAS_SIN_RECLAMAR_POR_DEFECTO, minimo: 1, maximo: DIAS_SIN_RECLAMAR_MAXIMO
    });
}
