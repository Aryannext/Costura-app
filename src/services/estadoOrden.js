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

/**
 * RN-04: una orden sin prendas existe y se lista para poder completarla, pero
 * todavía no cuenta para la gestión: ni activas, ni atrasadas, ni próximas a
 * vencer, ni recordatorios. Con el estado derivado de las prendas eso es
 * exactamente En Proceso o Lista para Entregar.
 */
export const ESTADOS_ORDEN_ACTIVA = Object.freeze([ESTADO_ORDEN.EN_PROCESO, ESTADO_ORDEN.LISTA]);

export function esOrdenActiva(orden) {
    return !!orden && ESTADOS_ORDEN_ACTIVA.includes(orden.id_estado_orden);
}

export const ESTADO_PAGO = Object.freeze({ PENDIENTE: 'Pendiente', PAGADA: 'Pagada' });

/**
 * RN-28 y HU-37: una orden está pagada cuando su saldo pendiente llega a cero.
 *
 * Se deriva al leer y no se guarda en una columna. El saldo ya se recalcula
 * en cada escritura (P1-4); una segunda copia con el "estado de pago" sería
 * otra caché que podría descuadrarse, justo el error que se corrigió allí.
 *
 * @returns {'Pagada'|'Pendiente'|null} null si la orden aún no tiene nada que cobrar
 */
export function estadoDePago(orden) {
    const tieneValor = orden?.valor_total > 0;
    if (!tieneValor) return null;
    // <= 0 y no === 0: un saldo negativo heredado de la v1 también está saldado.
    return orden.saldo_pendiente <= 0 ? ESTADO_PAGO.PAGADA : ESTADO_PAGO.PENDIENTE;
}

/**
 * HU-36: órdenes con saldo por cobrar, de mayor a menor deuda.
 *
 * Mismo criterio que la cifra "Pagos Pendientes" del panel
 * (`saldo_pendiente > 0 AND id_estado_orden != 5` en queries/reportes.js): la
 * lista tiene que sumar exactamente lo que muestra esa tarjeta.
 */
export function ordenesPorCobrar(ordenes) {
    return ordenes
        .filter(o => o.id_estado_orden !== ESTADO_ORDEN.CANCELADA && o.saldo_pendiente > 0)
        .sort((a, b) => b.saldo_pendiente - a.saldo_pendiente);
}

/**
 * Cuántas prendas están ya terminadas (o entregadas) de las que tiene la orden.
 * La orden pasa a Lista para Entregar —y se ofrece el aviso al cliente— al
 * terminar la última; mostrarlo evita que parezca que el aviso "no salió".
 */
export function progresoPrendas(prendas) {
    const total = prendas.length;
    const terminadas = prendas.filter(p =>
        p.id_estado_prenda === ESTADO_PRENDA.TERMINADA || p.id_estado_prenda === ESTADO_PRENDA.ENTREGADA
    ).length;
    return { terminadas, total, faltan: total - terminadas };
}

export function totalPorCobrar(ordenes) {
    return ordenesPorCobrar(ordenes).reduce((total, o) => total + o.saldo_pendiente, 0);
}
