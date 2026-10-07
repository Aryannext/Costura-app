// Reglas de negocio de estados de orden y prenda, en un solo lugar.
// Son funciones puras (no tocan la base de datos) para poder probarlas
// y explicarlas sin depender de SQLite ni de la interfaz.

export const ESTADO_ORDEN = {
    PENDIENTE: 1,
    EN_PROCESO: 2,
    LISTA: 3,
    ENTREGADA: 4,
    CANCELADA: 5
};

export const ESTADO_PRENDA = {
    PENDIENTE: 1,
    EN_PROCESO: 2,
    TERMINADA: 3,
    ENTREGADA: 4
};

export const NOMBRE_ESTADO_ORDEN = {
    1: 'Pendiente',
    2: 'En Proceso',
    3: 'Lista para Entregar',
    4: 'Entregada',
    5: 'Cancelada'
};

const terminada = (e) => e === ESTADO_PRENDA.TERMINADA || e === ESTADO_PRENDA.ENTREGADA;

// Calcula el estado que debe tener la orden según el estado de sus prendas (RN-06, RN-17).
// - Todas entregadas            -> Entregada
// - Todas terminadas/entregadas -> Lista para Entregar
// - Alguna empezada             -> En Proceso
// - Ninguna empezada            -> se respeta Pendiente/En Proceso elegido a mano
export function estadoOrdenSegunPrendas(estadoActual, estadosPrendas) {
    if (estadoActual === ESTADO_ORDEN.CANCELADA) return estadoActual;

    if (estadosPrendas.length === 0) {
        return estadoActual === ESTADO_ORDEN.PENDIENTE ? ESTADO_ORDEN.PENDIENTE : ESTADO_ORDEN.EN_PROCESO;
    }
    if (estadosPrendas.every(e => e === ESTADO_PRENDA.ENTREGADA)) return ESTADO_ORDEN.ENTREGADA;
    if (estadosPrendas.every(terminada)) return ESTADO_ORDEN.LISTA;
    if (estadosPrendas.some(e => e !== ESTADO_PRENDA.PENDIENTE)) return ESTADO_ORDEN.EN_PROCESO;

    return estadoActual >= ESTADO_ORDEN.LISTA ? ESTADO_ORDEN.EN_PROCESO : estadoActual;
}

// Valida un cambio de estado pedido a mano desde el botón de la orden.
// Lanza un Error con un mensaje para la modista si no está permitido.
export function validarCambioManual(estadoActual, estadoNuevo, estadosPrendas) {
    const faltan = estadosPrendas.filter(e => !terminada(e)).length;

    if (estadoActual === ESTADO_ORDEN.CANCELADA) {
        throw new Error('La orden está cancelada; no se puede cambiar su estado.');
    }

    switch (estadoNuevo) {
        case ESTADO_ORDEN.EN_PROCESO:
            if (estadoActual === ESTADO_ORDEN.ENTREGADA) return true; // reabrir
            if (estadosPrendas.length === 0) {
                throw new Error('Agrega al menos una prenda antes de iniciar el trabajo.');
            }
            return true;

        case ESTADO_ORDEN.LISTA:
        case ESTADO_ORDEN.ENTREGADA:
            if (estadosPrendas.length === 0) {
                throw new Error('La orden no tiene prendas.');
            }
            if (faltan > 0) {
                throw new Error(`Faltan ${faltan} prenda(s) por marcar como Terminada en la pestaña Prendas.`);
            }
            return true;

        case ESTADO_ORDEN.CANCELADA:
            if (estadoActual === ESTADO_ORDEN.ENTREGADA) {
                throw new Error('Una orden entregada no se puede cancelar.');
            }
            return true;

        default:
            throw new Error('Cambio de estado no permitido.');
    }
}

// Al cambiar el valor de una prenda, el nuevo total nunca puede quedar
// por debajo de lo que el cliente ya pagó (RN-27 / RN-29, fallo A06).
export function validarNuevoTotal(nuevoTotal, totalPagado) {
    if (nuevoTotal < totalPagado) {
        throw new Error(
            `El cliente ya pagó $${totalPagado.toLocaleString('es-CO')}; ` +
            `el total de la orden no puede quedar en $${nuevoTotal.toLocaleString('es-CO')}. ` +
            'Si hay que devolver dinero, elimina primero el pago correspondiente.'
        );
    }
    return true;
}
