import { db } from '../connection.js';

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

    const set = [
        {
            // 1. Insert order
            statement: "INSERT INTO orden_trabajo (fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden) VALUES (?, 0, 0, ?, 1)",
            values: [orden.fecha_entrega_estimada, orden.id_cliente]
        },
        {
            // 2. Register history using last_insert_rowid() to reference the newly created order
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, last_insert_rowid(), 1)",
            values: ["Orden creada en estado Pendiente"]
        }
    ];

    await db.executeSet(set, true);

    // Dado que executeSet solo devuelve el lastId de la última sentencia (el historial),
    // y no podemos invertir el orden por la restricción de llave foránea (orden_trabajo debe existir primero),
    // la única forma segura en esta API de recuperar el id_orden es mediante una consulta posterior.
    // En un entorno de usuario único (SQLite local), MAX(id_orden) es completamente seguro y determinista.
    const maxResult = await db.query("SELECT MAX(id_orden) as last_id FROM orden_trabajo");
    return maxResult.values[0].last_id;
}

export async function changeEstado(id_orden, id_estado_orden, nombre_estado, current_orden) {
    if (!db) throw new Error("Database not initialized");

    const set = [];

    // 1. Update the order status
    if (id_estado_orden === 4) {
        // Entregada
        set.push({
            statement: "UPDATE orden_trabajo SET id_estado_orden = ?, fecha_entrega_real = datetime('now','localtime') WHERE id_orden = ?",
            values: [id_estado_orden, id_orden]
        });
        // ALSO update all items (prendas) to 'Entregada' (id_estado_prenda = 4)
        set.push({
            statement: "UPDATE prenda SET id_estado_prenda = 4 WHERE id_orden = ?",
            values: [id_orden]
        });
    } else {
        set.push({
            statement: "UPDATE orden_trabajo SET id_estado_orden = ? WHERE id_orden = ?",
            values: [id_estado_orden, id_orden]
        });
    }

    // 2. Insert history record
    let id_tipo_actividad = 3; // Cambio de estado por defecto
    if (id_estado_orden === 4) id_tipo_actividad = 5; // Entrega
    if (id_estado_orden === 5) id_tipo_actividad = 6; // Cancelacion
    if (id_estado_orden === 1 && current_orden?.id_estado_orden === 4) id_tipo_actividad = 7; // Reapertura

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
