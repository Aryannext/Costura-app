import { db, saveDb } from '../connection.js';

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
    // estado_orden 1 = Pendiente
    const result = await db.run(
        "INSERT INTO orden_trabajo (fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden) VALUES (?, 0, 0, ?, 1)",
        [orden.fecha_entrega_estimada, orden.id_cliente]
    );
    const newId = result.changes.lastId;
    
    // Registrar historial: 1 = Creación
    await registrarHistorialActividad(newId, 1, "Orden creada en estado Pendiente");
    await saveDb();
    return newId;
}

export async function changeEstado(id_orden, id_estado_orden, nombre_estado, current_orden) {
    if (!db) throw new Error("Database not initialized");
    
    // Update the order status
    if (id_estado_orden === 4) {
        // Entregada
        await db.run("UPDATE orden_trabajo SET id_estado_orden = ?, fecha_entrega_real = datetime('now','localtime') WHERE id_orden = ?", [id_estado_orden, id_orden]);
        // ALSO update all items (prendas) to 'Entregada' (id_estado_prenda = 4)
        await db.run("UPDATE prenda SET id_estado_prenda = 4 WHERE id_orden = ?", [id_orden]);
    } else {
        await db.run("UPDATE orden_trabajo SET id_estado_orden = ? WHERE id_orden = ?", [id_estado_orden, id_orden]);
    }

    // Insert history record
    let id_tipo_actividad = 3; // Cambio de estado por defecto
    if (id_estado_orden === 4) id_tipo_actividad = 5; // Entrega
    if (id_estado_orden === 5) id_tipo_actividad = 6; // Cancelacion
    if (id_estado_orden === 1 && current_orden?.id_estado_orden === 4) id_tipo_actividad = 7; // Reapertura

    await registrarHistorialActividad(id_orden, id_tipo_actividad, `Estado cambiado a ${nombre_estado}`);
    await saveDb();
}

export async function registrarHistorialActividad(id_orden, id_tipo_actividad, descripcion) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
        [descripcion, id_orden, id_tipo_actividad]
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
