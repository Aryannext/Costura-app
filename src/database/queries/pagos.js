import { db } from '../connection.js';

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

    const set = [
        {
            // 1. Update order remaining balance
            statement: "UPDATE orden_trabajo SET saldo_pendiente = saldo_pendiente - ? WHERE id_orden = ?",
            values: [pago.valor, pago.id_orden]
        },
        {
            // 2. Register history: 4 = Pago
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [`Abono de $${pago.valor} registrado`, pago.id_orden, 4]
        },
        {
            // 3. Register payment (última sentencia para que lastId devuelva el id_pago)
            statement: "INSERT INTO pago (valor, id_orden, id_metodo_pago) VALUES (?, ?, ?)",
            values: [pago.valor, pago.id_orden, pago.id_metodo_pago]
        }
    ];

    // executeSet con transaction=true asegura atomicidad y autoSave a IndexedDB.
    const result = await db.executeSet(set, true);

    return result.changes.lastId;
}
