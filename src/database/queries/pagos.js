import { db, saveDb } from '../connection.js';
import { registrarHistorialActividad } from './ordenes.js';

export async function getMetodosPago() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT * FROM metodo_pago ORDER BY id_metodo_pago ASC");
    return result.values || [];
}

export async function getPagosByOrden(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT p.*, m.nombre as metodo_nombre 
        FROM pago p
        JOIN metodo_pago m ON p.id_metodo_pago = m.id_metodo_pago
        WHERE p.id_orden = ?
        ORDER BY p.fecha_pago DESC
    `, [id_orden]);
    return result.values || [];
}

export async function registrarPago(pago) {
    if (!db) throw new Error("Database not initialized");
    
    // 1. Register payment
    const result = await db.run(
        "INSERT INTO pago (valor, id_orden, id_metodo_pago) VALUES (?, ?, ?)",
        [pago.valor, pago.id_orden, pago.id_metodo_pago]
    );
    const newId = result.changes.lastId;

    // 2. Update order remaining balance
    await db.run(
        "UPDATE orden_trabajo SET saldo_pendiente = saldo_pendiente - ? WHERE id_orden = ?",
        [pago.valor, pago.id_orden]
    );

    // 3. Register history: 4 = Pago
    await registrarHistorialActividad(pago.id_orden, 4, `Abono de $${pago.valor} registrado`);
    
    await saveDb();
    return newId;
}
