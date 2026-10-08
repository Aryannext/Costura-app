import { db, saveDb } from '../connection.js';
import { condicionOrdenActiva } from './estadoOrden.js';

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
        SELECT o.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono, c.direccion as cliente_direccion,
               e.nombre as estado_nombre
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
        // fecha_creacion es opcional: permite pasar a la app ropa recibida antes
        // de empezar a usarla. Sin ella, SQLite pone la fecha y hora actuales.
        const resOrden = await db.run(
            "INSERT INTO orden_trabajo (fecha_creacion, fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden) VALUES (COALESCE(?, datetime('now','localtime')), ?, 0, 0, ?, 1)",
            [orden.fecha_creacion ?? null, orden.fecha_entrega_estimada, orden.id_cliente],
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

export async function changeEstado(id_orden, id_estado_orden, nombre_estado, current_orden) {
    if (!db) throw new Error("Database not initialized");

    const set = [];

    // 1. Update the order status
    if (id_estado_orden === 4) {
        // Entregada
        // Entregar la orden también entrega todas sus prendas (id_estado_prenda = 4)
        set.push(
            {
                statement: "UPDATE orden_trabajo SET id_estado_orden = ?, fecha_entrega_real = datetime('now','localtime') WHERE id_orden = ?",
                values: [id_estado_orden, id_orden]
            },
            {
                statement: "UPDATE prenda SET id_estado_prenda = 4 WHERE id_orden = ?",
                values: [id_orden]
            }
        );
    } else {
        set.push({
            // Cancelar o reabrir: la orden deja de estar Lista para Entregar (RN-37).
            // Al entregar, en cambio, fecha_lista se conserva como dato histórico.
            statement: "UPDATE orden_trabajo SET id_estado_orden = ?, fecha_lista = NULL WHERE id_orden = ?",
            values: [id_estado_orden, id_orden]
        });
    }

    // 2. Insert history record
    let id_tipo_actividad = 3; // Cambio de estado por defecto
    if (id_estado_orden === 4) id_tipo_actividad = 5; // Entrega
    if (id_estado_orden === 5) id_tipo_actividad = 6; // Cancelacion
    if (id_estado_orden === 2 && current_orden?.id_estado_orden === 4) id_tipo_actividad = 7; // Reapertura (RN-16: vuelve a En Proceso)

    set.push({
        statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
        values: [`Estado cambiado a ${nombre_estado}`, id_orden, id_tipo_actividad]
    });

    await db.executeSet(set, true);
}

export async function registrarHistorialActividad(id_orden, id_tipo_actividad, descripcion) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
        [descripcion, id_orden, id_tipo_actividad],
        false
    );
}

/**
 * Entregas pendientes agrupadas por día, para armar los recordatorios locales.
 * Ambas fechas se pasan en hora local ('YYYY-MM-DD'), igual que se guardan.
 */
export async function getEntregasPorDia(desdeISO, hastaISO) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT date(fecha_entrega_estimada) AS dia, COUNT(*) AS total
        FROM orden_trabajo
        WHERE ${condicionOrdenActiva()}
          AND date(fecha_entrega_estimada) BETWEEN ? AND ?
        GROUP BY dia
        ORDER BY dia ASC
    `, [desdeISO, hastaISO]);
    return result.values || [];
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
