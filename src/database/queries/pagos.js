import { db } from '../connection.js';
import { recalcularTotalesOrden } from './saldo.js';

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
        ORDER BY p.anulado_en IS NOT NULL, p.fecha_pago DESC
    `, [id_orden]);
    return result.values || [];
}

export async function getPagoById(id_pago) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(
        "SELECT id_pago, valor, id_orden, anulado_en FROM pago WHERE id_pago = ?",
        [id_pago]
    );
    return result.values?.[0] || null;
}

/**
 * Un pago no se borra: se marca como anulado con fecha y motivo, deja de contar
 * en el saldo y queda en el historial (RN-14, RN-35). Las reglas se validan
 * antes, en el composable.
 */
export async function anularPago(pago, motivo) {
    if (!db) throw new Error("Database not initialized");

    const set = [
        {
            statement: "UPDATE pago SET anulado_en = datetime('now','localtime'), motivo_anulacion = ? WHERE id_pago = ? AND anulado_en IS NULL",
            values: [motivo, pago.id_pago]
        },
        recalcularTotalesOrden(pago.id_orden),
        {
            // 8 = Anulación de pago
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [`Pago de $${pago.valor} anulado: ${motivo}`, pago.id_orden, 8]
        }
    ];

    await db.executeSet(set, true);
}

export async function registrarPago(pago) {
    if (!db) throw new Error("Database not initialized");

    const set = [
        {
            // 1. Register history: 4 = Pago
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [`Abono de $${pago.valor} registrado`, pago.id_orden, 4]
        },
        {
            // 2. Register payment (último INSERT para que lastId devuelva el id_pago)
            statement: "INSERT INTO pago (valor, id_orden, id_metodo_pago) VALUES (?, ?, ?)",
            values: [pago.valor, pago.id_orden, pago.id_metodo_pago]
        },
        // 3. Saldo recalculado con el pago ya dentro
        recalcularTotalesOrden(pago.id_orden)
    ];

    // executeSet con transaction=true asegura atomicidad y autoSave a IndexedDB.
    const result = await db.executeSet(set, true);

    return result.changes.lastId;
}
