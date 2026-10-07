import { db, saveDb } from '../connection.js';

export async function createNotificacion(mensaje, id_orden, id_tipo_notificacion) {
    if (!db) throw new Error("Database not initialized");
    
    const result = await db.run(
        "INSERT INTO notificacion (mensaje, id_orden, id_tipo_notificacion) VALUES (?, ?, ?)",
        [mensaje, id_orden, id_tipo_notificacion]
    );
    await saveDb();
    return result.changes.lastId;
}

export async function getNotificacionesByOrden(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT n.*, tn.nombre as tipo_nombre 
        FROM notificacion n
        JOIN tipo_notificacion tn ON n.id_tipo_notificacion = tn.id_tipo_notificacion
        WHERE n.id_orden = ?
        ORDER BY n.fecha_envio DESC
    `, [id_orden]);
    
    return result.values || [];
}

export async function getNotificacionesByCliente(id_cliente) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT n.*, tn.nombre as tipo_nombre, ot.id_orden
        FROM notificacion n
        JOIN tipo_notificacion tn ON n.id_tipo_notificacion = tn.id_tipo_notificacion
        JOIN orden_trabajo ot ON n.id_orden = ot.id_orden
        WHERE ot.id_cliente = ?
        ORDER BY n.fecha_envio DESC
    `, [id_cliente]);
    
    return result.values || [];
}

// Órdenes Listas a las que aún no se les registró recordatorio hoy (RN-33).
// No inserta nada: antes se registraban recordatorios "enviados" que nunca
// salían (A02). El registro lo hace useNotificaciones tras un envío confirmado.
export async function getOrdenesParaRecordar() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT o.id_orden, o.saldo_pendiente, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
        FROM orden_trabajo o
        JOIN cliente c ON c.id_cliente = o.id_cliente
        WHERE o.id_estado_orden = 3
          AND NOT EXISTS (
              SELECT 1 FROM notificacion n
              WHERE n.id_orden = o.id_orden AND n.id_tipo_notificacion = 3
                AND date(n.fecha_envio) = date('now','localtime')
          )
        ORDER BY o.fecha_lista ASC
    `);
    return result.values || [];
}
