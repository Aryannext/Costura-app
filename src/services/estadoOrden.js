/**
 * Estado de una orden derivado de sus prendas (RN-04, RN-06, RN-09, RN-17, HU-23).
 *
 * Antes cada estado intermedio se fijaba con un botón ("Iniciar Proceso",
 * "Marcar Lista") y podía contradecir a las prendas: una orden *Lista para
 * Entregar* con costuras pendientes, o *Pendiente* con trabajo en curso. La
 * especificación pide lo contrario: que el sistema lo decida solo. Esta función
 * es la única que lo decide, y es pura para poder probarla caso por caso.
 */

export const ESTADO_ORDEN = Object.freeze({
    PENDIENTE: 1,
    EN_PROCESO: 2,
    LISTA: 3,
    ENTREGADA: 4,
    CANCELADA: 5
});

export const ESTADO_PRENDA = Object.freeze({
    PENDIENTE: 1,
    EN_PROCESO: 2,
    TERMINADA: 3,
    ENTREGADA: 4
});

/**
 * @param {number} estadoActual   estado actual de la orden
 * @param {number[]} estadosPrendas estados de TODAS sus prendas, ya con el cambio aplicado
 * @returns {number} el estado que le corresponde a la orden
 */
export function derivarEstadoOrden(estadoActual, estadosPrendas) {
    // Cancelada y Entregada son cierres. Sólo se sale de ellos con una acción
    // explícita (reabrir, RN-16); una prenda no reabre una orden por su cuenta.
    if (estadoActual === ESTADO_ORDEN.CANCELADA || estadoActual === ESTADO_ORDEN.ENTREGADA) {
        return estadoActual;
    }

    // RN-04: sin prendas la orden todavía no está activa.
    if (estadosPrendas.length === 0) return ESTADO_ORDEN.PENDIENTE;

    // RN-09
    if (estadosPrendas.every(e => e === ESTADO_PRENDA.ENTREGADA)) return ESTADO_ORDEN.ENTREGADA;

    // RN-17
    if (estadosPrendas.some(e => e === ESTADO_PRENDA.PENDIENTE || e === ESTADO_PRENDA.EN_PROCESO)) {
        return ESTADO_ORDEN.EN_PROCESO;
    }

    // RN-06 y RN-10: todas terminadas o entregadas, y alguna aún sin entregar.
    return ESTADO_ORDEN.LISTA;
}
