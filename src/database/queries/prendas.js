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
    
    // 1 = Pendiente
    const result = await db.run(
        "INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES (?, ?, ?, ?, 1)",
        [prenda.descripcion_arreglo, prenda.valor, prenda.id_orden, prenda.id_tipo_prenda]
    );
    const newId = result.changes.lastId;
    
    // Update orden_trabajo total & saldo
    await db.run(
        "UPDATE orden_trabajo SET valor_total = valor_total + ?, saldo_pendiente = saldo_pendiente + ? WHERE id_orden = ?",
        [prenda.valor, prenda.valor, prenda.id_orden]
    );

    // Registrar historial: 2 = Modificación
    await registrarHistorialActividad(prenda.id_orden, 2, "Prenda añadida a la orden");
    await saveDb();
    return newId;
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
    await db.run(
        "UPDATE prenda SET id_estado_prenda = ? WHERE id_prenda = ?",
        [id_estado_prenda, id_prenda]
    );
    
    // Log history
    await db.run(
        "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
        [`Estado de prenda #${id_prenda} actualizado`, id_orden, 2]
    );

    // Auto-transition: If all prendas are Terminada (3) or Entregada (4)
    const result = await db.query("SELECT id_estado_prenda FROM prenda WHERE id_orden = ?", [id_orden]);
    if (result.values && result.values.length > 0) {
        const allDelivered = result.values.every(p => p.id_estado_prenda === 4);
        const allDone = result.values.every(p => p.id_estado_prenda === 3 || p.id_estado_prenda === 4);
        
        const orderStateRes = await db.query("SELECT id_estado_orden FROM orden_trabajo WHERE id_orden = ?", [id_orden]);
        const currentOrderState = orderStateRes.values && orderStateRes.values.length > 0 ? orderStateRes.values[0].id_estado_orden : 0;
        
        if (allDelivered && currentOrderState < 4) {
            await db.run("UPDATE orden_trabajo SET id_estado_orden = 4, fecha_entrega_real = datetime('now','localtime') WHERE id_orden = ?", [id_orden]);
            await db.run(
                "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
                ["Estado cambiado automáticamente a Entregada porque todas las prendas fueron entregadas", id_orden, 5]
            );
        } else if (allDone && !allDelivered && currentOrderState < 3) {
            await db.run("UPDATE orden_trabajo SET id_estado_orden = 3 WHERE id_orden = ?", [id_orden]);
            await db.run(
                "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
                ["Estado cambiado automáticamente a Lista para Entregar porque todas las prendas están terminadas", id_orden, 3]
            );
            // Notificacion automatica "Orden Lista"
            await db.run("INSERT INTO notificacion (mensaje, id_orden, id_tipo_notificacion) VALUES (?, ?, ?)", ["Su orden está lista para ser reclamada.", id_orden, 2]);
        }
    }

    await saveDb();
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

    // Get current value to calculate difference
    const resPrenda = await db.query("SELECT valor FROM prenda WHERE id_prenda = ?", [id_prenda]);
    if (!resPrenda.values || resPrenda.values.length === 0) throw new Error("Prenda no encontrada");
    
    const valor_viejo = resPrenda.values[0].valor;
    const diferencia = valor_nuevo - valor_viejo;

    // Update prenda
    await db.run(
        "UPDATE prenda SET descripcion_arreglo = ?, valor = ? WHERE id_prenda = ?",
        [descripcion_arreglo, valor_nuevo, id_prenda]
    );

    // If value changed, update orden total and saldo
    if (diferencia !== 0) {
        await db.run(
            "UPDATE orden_trabajo SET valor_total = valor_total + ?, saldo_pendiente = saldo_pendiente + ? WHERE id_orden = ?",
            [diferencia, diferencia, id_orden]
        );
    }

    // Registrar historial: 2 = Modificación
    await registrarHistorialActividad(id_orden, 2, `Información de la prenda #${id_prenda} actualizada`);
    await saveDb();
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
