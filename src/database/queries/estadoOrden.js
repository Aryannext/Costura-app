import { db } from '../connection.js';
import { derivarEstadoOrden, ESTADO_ORDEN, ESTADOS_ORDEN_ACTIVA } from '../../services/estadoOrden.js';

/**
 * Condición SQL de orden activa (RN-04), generada desde la misma lista que usa
 * `esOrdenActiva` para que la pantalla y las consultas no puedan discrepar.
 * @param {string} [alias] alias de `orden_trabajo` en la consulta, si lo tiene
 */
export function condicionOrdenActiva(alias = '') {
    const columna = alias ? `${alias}.id_estado_orden` : 'id_estado_orden';
    return `${columna} IN (${ESTADOS_ORDEN_ACTIVA.join(', ')})`;
}

/**
 * Traducción a SQL de `derivarEstadoOrden`. Quien cambia prendas (crear, cambiar
 * de estado, eliminar) lee aquí la situación actual, calcula los estados
 * resultantes y añade a su transacción las sentencias de la transición.
 */

const INSERT_HISTORIAL = "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)";

export async function leerEstadosDeOrden(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const prendas = await db.query("SELECT id_prenda, id_estado_prenda FROM prenda WHERE id_orden = ?", [id_orden]);
    const orden = await db.query("SELECT id_estado_orden FROM orden_trabajo WHERE id_orden = ?", [id_orden]);
    return {
        estadoOrden: orden.values?.[0]?.id_estado_orden ?? 0,
        prendas: prendas.values || []
    };
}

function sentenciasHacia(id_orden, hacia) {
    switch (hacia) {
        case ESTADO_ORDEN.ENTREGADA:
            return [
                {
                    statement: "UPDATE orden_trabajo SET id_estado_orden = 4, fecha_entrega_real = datetime('now','localtime') WHERE id_orden = ?",
                    values: [id_orden]
                },
                {
                    statement: INSERT_HISTORIAL,
                    values: ["Estado cambiado automáticamente a Entregada porque todas las prendas fueron entregadas", id_orden, 5]
                }
            ];
        case ESTADO_ORDEN.LISTA:
            return [
                { statement: "UPDATE orden_trabajo SET id_estado_orden = 3 WHERE id_orden = ?", values: [id_orden] },
                {
                    statement: INSERT_HISTORIAL,
                    values: ["Estado cambiado automáticamente a Lista para Entregar porque todas las prendas están terminadas", id_orden, 3]
                },
                {
                    // RN-31: notificación "Orden Lista" sólo al entrar en este estado
                    statement: "INSERT INTO notificacion (mensaje, id_orden, id_tipo_notificacion) VALUES (?, ?, ?)",
                    values: ["Su orden está lista para ser reclamada.", id_orden, 2]
                }
            ];
        case ESTADO_ORDEN.EN_PROCESO:
            return [
                { statement: "UPDATE orden_trabajo SET id_estado_orden = 2 WHERE id_orden = ?", values: [id_orden] },
                {
                    statement: INSERT_HISTORIAL,
                    values: ["Estado cambiado automáticamente a En Proceso porque hay prendas pendientes o en proceso", id_orden, 3]
                }
            ];
        case ESTADO_ORDEN.PENDIENTE:
            return [
                { statement: "UPDATE orden_trabajo SET id_estado_orden = 1 WHERE id_orden = ?", values: [id_orden] },
                {
                    statement: INSERT_HISTORIAL,
                    values: ["Estado cambiado automáticamente a Pendiente porque la orden se quedó sin prendas", id_orden, 3]
                }
            ];
        default:
            return [];
    }
}

/**
 * @returns {{ desde: number, hacia: number, sentencias: object[] }}
 *   `sentencias` está vacío si el estado no cambia. Incluye INSERTs: si quien
 *   llama necesita el lastId de su propio INSERT, debe ponerlas antes de él.
 */
export function planificarTransicion(id_orden, estadoActual, estadosPrendas) {
    const hacia = derivarEstadoOrden(estadoActual, estadosPrendas);
    return {
        desde: estadoActual,
        hacia,
        sentencias: hacia === estadoActual ? [] : sentenciasHacia(id_orden, hacia)
    };
}
