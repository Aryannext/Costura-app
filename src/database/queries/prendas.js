import { db, saveDb } from '../connection.js';
import { recalcularTotalesOrden } from './saldo.js';

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
            // 1. Registrar historial: 2 = Modificación
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: ["Prenda añadida a la orden", prenda.id_orden, 2]
        },
        {
            // 2. Insert prenda (id_estado_prenda = 1 = Pendiente)
            // Es el último INSERT para que el lastId devuelto sea el id_prenda.
            statement: "INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES (?, ?, ?, ?, 1)",
            values: [prenda.descripcion_arreglo, prenda.valor, prenda.id_orden, prenda.id_tipo_prenda]
        },
        // 3. Total y saldo recalculados con la prenda ya dentro
        recalcularTotalesOrden(prenda.id_orden)
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

export async function getTodasLasFotografias() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT id_fotografia, ruta_archivo FROM fotografia");
    return result.values || [];
}

/**
 * Reescribe las rutas absolutas heredadas a un simple nombre de archivo.
 * Los archivos siempre estuvieron en el directorio de datos, así que quedarse
 * con el nombre es suficiente y sobrevive a una reinstalación.
 * Idempotente: se ejecuta en cada arranque y no hace nada si ya está limpio.
 */
export async function normalizarRutasDeFotos() {
    if (!db) throw new Error("Database not initialized");

    const result = await db.query(
        "SELECT id_fotografia, ruta_archivo FROM fotografia WHERE ruta_archivo LIKE '%/%'"
    );
    const heredadas = result.values || [];
    if (heredadas.length === 0) return 0;

    const set = heredadas.map(f => ({
        statement: "UPDATE fotografia SET ruta_archivo = ? WHERE id_fotografia = ?",
        values: [f.ruta_archivo.split(/[\\/]/).pop(), f.id_fotografia]
    }));

    await db.executeSet(set, true);
    return heredadas.length;
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

/**
 * Lo que hace falta para decidir si se puede editar o eliminar una prenda:
 * su estado, el de la orden, cuánto suman las demás prendas y cuánto se ha
 * pagado sin contar los pagos anulados (RN-29).
 */
export async function getContextoPrenda(id_prenda, id_orden) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(`
        SELECT
            p.descripcion_arreglo,
            p.valor,
            p.id_estado_prenda,
            o.id_estado_orden,
            (SELECT COALESCE(SUM(valor), 0) FROM prenda
             WHERE id_orden = p.id_orden AND id_prenda <> p.id_prenda) AS total_otras_prendas,
            (SELECT COALESCE(SUM(valor), 0) FROM pago
             WHERE id_orden = p.id_orden AND anulado_en IS NULL) AS total_pagado
        FROM prenda p
        JOIN orden_trabajo o ON o.id_orden = p.id_orden
        WHERE p.id_prenda = ? AND p.id_orden = ?
    `, [id_prenda, id_orden]);

    const fila = result.values?.[0];
    if (!fila) throw new Error("Prenda no encontrada");
    return {
        descripcion: fila.descripcion_arreglo,
        valor: fila.valor,
        estadoPrenda: fila.id_estado_prenda,
        estadoOrden: fila.id_estado_orden,
        totalOtrasPrendas: fila.total_otras_prendas,
        totalPagado: fila.total_pagado
    };
}

export async function updatePrenda(id_prenda, descripcion_arreglo, valor_nuevo, id_orden) {
    if (!db) throw new Error("Database not initialized");

    const set = [
        {
            statement: "UPDATE prenda SET descripcion_arreglo = ?, valor = ? WHERE id_prenda = ? AND id_orden = ?",
            values: [descripcion_arreglo, valor_nuevo, id_prenda, id_orden]
        },
        recalcularTotalesOrden(id_orden),
        {
            // Registrar historial: 2 = Modificación
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [`Información de la prenda #${id_prenda} actualizada`, id_orden, 2]
        }
    ];

    await db.executeSet(set, true);
}

/**
 * Elimina la prenda con sus observaciones y fotografías, recalcula la orden y
 * lo deja en el historial. Las reglas se validan antes, en el composable.
 *
 * Devuelve las rutas de las fotos para que quien llama borre los archivos
 * DESPUÉS de confirmar la transacción: si ese borrado falla queda una foto
 * huérfana en disco, nunca una fila apuntando a un archivo inexistente.
 */
export async function eliminarPrenda(id_prenda, id_orden, { descripcion, valor }) {
    if (!db) throw new Error("Database not initialized");

    const fotos = await db.query("SELECT ruta_archivo FROM fotografia WHERE id_prenda = ?", [id_prenda]);

    const set = [
        { statement: "DELETE FROM observacion WHERE id_prenda = ?", values: [id_prenda] },
        { statement: "DELETE FROM fotografia WHERE id_prenda = ?", values: [id_prenda] },
        { statement: "DELETE FROM prenda WHERE id_prenda = ? AND id_orden = ?", values: [id_prenda, id_orden] },
        recalcularTotalesOrden(id_orden),
        {
            // 9 = Eliminación de prenda
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [`Prenda #${id_prenda} eliminada: ${descripcion} ($${valor})`, id_orden, 9]
        }
    ];

    await db.executeSet(set, true);
    return (fotos.values || []).map(f => f.ruta_archivo);
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
