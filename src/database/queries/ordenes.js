import { db, saveDb } from '../connection.js';
import { ESTADO_ORDEN, NOMBRE_ESTADO_ORDEN, validarCambioManual } from '../../services/reglasOrden.js';

export async function getAllOrdenes() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT o.*, c.nombre as cliente_nombre, e.nombre as estado_nombre
        FROM orden_trabajo o
        JOIN cliente c ON o.id_cliente = c.id_cliente
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        ORDER BY o.fecha_creacion DESC
    `);
    return result.values || [];
}

export async function getOrdenById(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT o.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono, e.nombre as estado_nombre
        FROM orden_trabajo o
        JOIN cliente c ON o.id_cliente = c.id_cliente
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        WHERE o.id_orden = ?
    `, [id_orden]);
    return result.values && result.values.length > 0 ? result.values[0] : null;
}

export async function createOrden(orden) {
    if (!db) throw new Error("Database not initialized");

    await db.beginTransaction();
    let isCommitted = false;
    try {
        // fecha_creacion es opcional: permite registrar ropa recibida días antes
        // de empezar a usar la app. Si no viene, SQLite pone la fecha y hora actuales.
        const resOrden = orden.fecha_creacion
            ? await db.run(
                "INSERT INTO orden_trabajo (fecha_creacion, fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden) VALUES (?, ?, 0, 0, ?, 1)",
                [orden.fecha_creacion, orden.fecha_entrega_estimada, orden.id_cliente],
                false
            )
            : await db.run(
                "INSERT INTO orden_trabajo (fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden) VALUES (?, 0, 0, ?, 1)",
                [orden.fecha_entrega_estimada, orden.id_cliente],
                false
            );

        const idOrden = resOrden.changes.lastId;

        const set = [
            {
                statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, 1)",
                values: ["Orden creada en estado Pendiente", idOrden]
            }
        ];

        await db.executeSet(set, false);

        await db.commitTransaction();
        isCommitted = true;

        await saveDb();

        return idOrden;
    } catch (error) {
        if (!isCommitted) {
            try {
                await db.rollbackTransaction();
            } catch (rollbackError) {
                console.error("Critical: Rollback failed after transaction error", rollbackError);
            }
        }
        throw error;
    }
}

export async function getEstadosPrendas(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT id_prenda, id_estado_prenda FROM prenda WHERE id_orden = ?", [id_orden]);
    return result.values || [];
}

export async function getTotalPagado(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT COALESCE(SUM(valor), 0) AS total FROM pago WHERE id_orden = ?", [id_orden]);
    return result.values && result.values.length > 0 ? result.values[0].total : 0;
}

// Sentencias SQL para mover la orden de un estado a otro. Se devuelven (no se ejecutan)
// para que quien llama las meta en el mismo executeSet y todo sea atómico.
export function sentenciasTransicion(id_orden, estadoAnterior, estadoNuevo, motivo = '') {
    if (estadoAnterior === estadoNuevo) return [];

    let campos = 'id_estado_orden = ?';
    if (estadoNuevo !== ESTADO_ORDEN.CANCELADA) {
        if (estadoNuevo === ESTADO_ORDEN.LISTA && estadoAnterior < ESTADO_ORDEN.LISTA) {
            campos += ", fecha_lista = datetime('now','localtime')";
        }
        if (estadoNuevo < ESTADO_ORDEN.LISTA) campos += ', fecha_lista = NULL';
        if (estadoNuevo === ESTADO_ORDEN.ENTREGADA) campos += ", fecha_entrega_real = datetime('now','localtime')";
        if (estadoNuevo < ESTADO_ORDEN.ENTREGADA) campos += ', fecha_entrega_real = NULL';
    }

    let id_tipo_actividad = 3; // Cambio de estado
    if (estadoNuevo === ESTADO_ORDEN.ENTREGADA) id_tipo_actividad = 5;
    if (estadoNuevo === ESTADO_ORDEN.CANCELADA) id_tipo_actividad = 6;
    if (estadoAnterior === ESTADO_ORDEN.ENTREGADA && estadoNuevo < ESTADO_ORDEN.ENTREGADA) id_tipo_actividad = 7;

    const descripcion = `Estado cambiado a ${NOMBRE_ESTADO_ORDEN[estadoNuevo]}` + (motivo ? ` (${motivo})` : '');

    return [
        {
            statement: `UPDATE orden_trabajo SET ${campos} WHERE id_orden = ?`,
            values: [estadoNuevo, id_orden]
        },
        {
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [descripcion, id_orden, id_tipo_actividad]
        }
    ];
}

// Cambio de estado pedido a mano (botones de la pestaña Detalle).
// Las reglas se validan aquí, en la capa de datos, para que ninguna pantalla pueda saltárselas.
// Devuelve el estado final de la orden.
export async function changeEstado(id_orden, id_estado_orden) {
    if (!db) throw new Error("Database not initialized");

    const orden = await getOrdenById(id_orden);
    if (!orden) throw new Error("Orden no encontrada");

    const estadoActual = orden.id_estado_orden;
    const prendas = await getEstadosPrendas(id_orden);
    validarCambioManual(estadoActual, id_estado_orden, prendas.map(p => p.id_estado_prenda));

    const set = sentenciasTransicion(id_orden, estadoActual, id_estado_orden);
    if (set.length === 0) return estadoActual;

    if (id_estado_orden === ESTADO_ORDEN.ENTREGADA) {
        // Ya se validó que todas están Terminadas; ahora se entregan
        set.push({
            statement: "UPDATE prenda SET id_estado_prenda = 4 WHERE id_orden = ?",
            values: [id_orden]
        });
    }
    if (estadoActual === ESTADO_ORDEN.ENTREGADA && id_estado_orden === ESTADO_ORDEN.EN_PROCESO) {
        // Reabrir (RN-16): las prendas vuelven a Terminada; la modista pasa a En Proceso
        // solo la que necesita corrección. La entrega anterior queda en el historial.
        set.push({
            statement: "UPDATE prenda SET id_estado_prenda = 3 WHERE id_orden = ? AND id_estado_prenda = 4",
            values: [id_orden]
        });
    }

    await db.executeSet(set, true);
    return id_estado_orden;
}

export async function registrarHistorialActividad(id_orden, id_tipo_actividad, descripcion) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
        [descripcion, id_orden, id_tipo_actividad],
        false
    );
}

export async function getHistorialByOrden(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT h.*, t.nombre as tipo_nombre
        FROM historial_actividad h
        JOIN tipo_actividad t ON h.id_tipo_actividad = t.id_tipo_actividad
        WHERE h.id_orden = ?
        ORDER BY h.fecha_hora DESC
    `, [id_orden]);
    return result.values || [];
}
