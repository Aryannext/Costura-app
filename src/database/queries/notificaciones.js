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

export async function executeRecordatoriosMasivos() {
    if (!db) throw new Error("Database not initialized");
    
    // Buscar órdenes en estado 3 (Lista para entregar)
    const ordersRes = await db.query(`
        SELECT id_orden 
        FROM orden_trabajo 
        WHERE id_estado_orden = 3
    `);
    
    let count = 0;
    if (ordersRes.values && ordersRes.values.length > 0) {
        for (let o of ordersRes.values) {
            // Verificar si ya se envió un recordatorio (tipo 3) HOY para esta orden
            const notifRes = await db.query(`
                SELECT count(*) as count 
                FROM notificacion 
                WHERE id_orden = ? AND id_tipo_notificacion = 3 AND date(fecha_envio) = date('now','localtime')
            `, [o.id_orden]);
            
            if (notifRes.values[0].count === 0) {
                await createNotificacion("Recordatorio: Su orden está lista para ser reclamada. Por favor, acérquese a recogerla.", o.id_orden, 3);
                count++;
            }
        }
    }
    return count;
}
