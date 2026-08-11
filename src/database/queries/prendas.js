import { db, saveDb } from '../connection.js';
import { registrarHistorialActividad } from './ordenes.js';

export async function getTiposPrenda() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT * FROM tipo_prenda ORDER BY nombre ASC");
    return result.values || [];
}

export async function getPrendasByOrden(id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT p.*, tp.nombre as tipo_nombre, ep.nombre as estado_nombre
        FROM prenda p
        JOIN tipo_prenda tp ON p.id_tipo_prenda = tp.id_tipo_prenda
        JOIN estado_prenda ep ON p.id_estado_prenda = ep.id_estado_prenda
        WHERE p.id_orden = ?
        ORDER BY p.id_prenda ASC
    `, [id_orden]);

    const prendas = result.values || [];

    // Fetch observaciones for each prenda
    for (let p of prendas) {
        const obsRes = await db.query("SELECT * FROM observacion WHERE id_prenda = ? ORDER BY fecha_registro DESC", [p.id_prenda]);
        p.observaciones = obsRes.values || [];

        const photoRes = await db.query("SELECT * FROM fotografia WHERE id_prenda = ? ORDER BY fecha_registro DESC", [p.id_prenda]);
        p.fotografias = photoRes.values || [];
    }

    return prendas;
}

export async function createPrenda(prenda) {
    if (!db) throw new Error("Database not initialized");

    const set = [
        {
            // 1. Update orden_trabajo total & saldo
            statement: "UPDATE orden_trabajo SET valor_total = valor_total + ?, saldo_pendiente = saldo_pendiente + ? WHERE id_orden = ?",
            values: [prenda.valor, prenda.valor, prenda.id_orden]
        },
        {
            // 2. Registrar historial: 2 = Modificación
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: ["Prenda añadida a la orden", prenda.id_orden, 2]
        },
        {
            // 3. Insert prenda (id_estado_prenda = 1 = Pendiente)
            // Se ejecuta al final para que el lastId devuelto corresponda al id_prenda recién creado.
            statement: "INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES (?, ?, ?, ?, 1)",
            values: [prenda.descripcion_arreglo, prenda.valor, prenda.id_orden, prenda.id_tipo_prenda]
        }
    ];

    const result = await db.executeSet(set, true);
    return result.changes.lastId;
}

export async function addObservacion(id_prenda, descripcion) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "INSERT INTO observacion (descripcion, id_prenda) VALUES (?, ?)",
        [descripcion, id_prenda]
    );
    await saveDb();
}

export async function addFotografia(id_prenda, ruta_archivo) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "INSERT INTO fotografia (ruta_archivo, id_prenda) VALUES (?, ?)",
        [ruta_archivo, id_prenda]
    );
    await saveDb();
}

export async function updateEstadoPrenda(id_prenda, id_estado_prenda, id_orden) {
    if (!db) throw new Error("Database not initialized");

    // 1. Forecast the state by reading current data BEFORE the transaction
    const result = await db.query("SELECT id_prenda, id_estado_prenda FROM prenda WHERE id_orden = ?", [id_orden]);
    const prendas = result.values || [];

    // Simular el cambio en memoria
    const prendaTarget = prendas.find(p => p.id_prenda === id_prenda);
    if (prendaTarget) {
        prendaTarget.id_estado_prenda = id_estado_prenda;
    } else {
        // Fallback: Si no estaba cargada por alguna razón, la añadimos simulada
        prendas.push({ id_prenda, id_estado_prenda });
    }

    const allDelivered = prendas.every(p => p.id_estado_prenda === 4);
    const allDone = prendas.every(p => p.id_estado_prenda === 3 || p.id_estado_prenda === 4);

    const orderStateRes = await db.query("SELECT id_estado_orden FROM orden_trabajo WHERE id_orden = ?", [id_orden]);
    const currentOrderState = orderStateRes.values && orderStateRes.values.length > 0 ? orderStateRes.values[0].id_estado_orden : 0;

    // 2. Build the atomic set
    const set = [
        {
            statement: "UPDATE prenda SET id_estado_prenda = ? WHERE id_prenda = ?",
            values: [id_estado_prenda, id_prenda]
        },
        {
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [`Estado de prenda #${id_prenda} actualizado`, id_orden, 2]
        }
    ];

    // 3. Append auto-transition logic if conditions are met
    if (allDelivered && currentOrderState < 4) {
        set.push({
            statement: "UPDATE orden_trabajo SET id_estado_orden = 4, fecha_entrega_real = datetime('now','localtime') WHERE id_orden = ?",
            values: [id_orden]
        });
        set.push({
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: ["Estado cambiado automáticamente a Entregada porque todas las prendas fueron entregadas", id_orden, 5]
        });
    } else if (allDone && !allDelivered && currentOrderState < 3) {
        set.push({
            statement: "UPDATE orden_trabajo SET id_estado_orden = 3 WHERE id_orden = ?",
            values: [id_orden]
        });
        set.push({
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: ["Estado cambiado automáticamente a Lista para Entregar porque todas las prendas están terminadas", id_orden, 3]
        });
        // Notificacion automatica "Orden Lista"
        set.push({
            statement: "INSERT INTO notificacion (mensaje, id_orden, id_tipo_notificacion) VALUES (?, ?, ?)",
            values: ["Su orden está lista para ser reclamada.", id_orden, 2]
        });
    }

    // 4. Execute atomically
    await db.executeSet(set, true);
}

export async function getObservacionesByPrenda(id_prenda) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(
        "SELECT * FROM observacion WHERE id_prenda = ? ORDER BY fecha_registro DESC",
        [id_prenda]
    );
    return result.values || [];
}

export async function saveFotografia(id_prenda, ruta_archivo) {
    if (!db) throw new Error("Database not initialized");
    const res = await db.run(
        "INSERT INTO fotografia (ruta_archivo, id_prenda) VALUES (?, ?)",
        [ruta_archivo, id_prenda]
    );
    await saveDb();
    return res.changes.lastId;
}

export async function getFotografiasByPrenda(id_prenda) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(
        "SELECT * FROM fotografia WHERE id_prenda = ? ORDER BY fecha_registro DESC",
        [id_prenda]
    );
    return result.values || [];
}

export async function deleteFotografia(id_fotografia) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "DELETE FROM fotografia WHERE id_fotografia = ?",
        [id_fotografia]
    );
    await saveDb();
}

export async function updatePrenda(id_prenda, descripcion_arreglo, valor_nuevo, id_orden) {
    if (!db) throw new Error("Database not initialized");

    // 1. SELECT previo: Get current value to calculate difference before writing
    const resPrenda = await db.query("SELECT valor FROM prenda WHERE id_prenda = ?", [id_prenda]);
    if (!resPrenda.values || resPrenda.values.length === 0) throw new Error("Prenda no encontrada");

    const valor_viejo = resPrenda.values[0].valor;
    const diferencia = valor_nuevo - valor_viejo;

    // 2. Build the atomic set
    const set = [
        {
            // UPDATE prenda
            statement: "UPDATE prenda SET descripcion_arreglo = ?, valor = ? WHERE id_prenda = ?",
            values: [descripcion_arreglo, valor_nuevo, id_prenda]
        }
    ];

    // If value changed, add order total and saldo update to the set
    if (diferencia !== 0) {
        set.push({
            statement: "UPDATE orden_trabajo SET valor_total = valor_total + ?, saldo_pendiente = saldo_pendiente + ? WHERE id_orden = ?",
            values: [diferencia, diferencia, id_orden]
        });
    }

    // Registrar historial: 2 = Modificación
    set.push({
        statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
        values: [`Información de la prenda #${id_prenda} actualizada`, id_orden, 2]
    });

    // 3. Execute atomically
    await db.executeSet(set, true);
}

export async function getDescripcionesFrecuentes() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT descripcion_arreglo, COUNT(*) as frecuencia
        FROM prenda
        WHERE descripcion_arreglo IS NOT NULL AND TRIM(descripcion_arreglo) != ''
        GROUP BY TRIM(LOWER(descripcion_arreglo))
        ORDER BY frecuencia DESC, id_prenda DESC
        LIMIT 20
    `);
    return result.values ? result.values.map(r => r.descripcion_arreglo) : [];
}
