import { db, saveDb } from '../connection.js';
import { getEstadosPrendas, getTotalPagado, sentenciasTransicion } from './ordenes.js';
import { ESTADO_ORDEN, estadoOrdenSegunPrendas, validarNuevoTotal } from '../../services/reglasOrden.js';

async function getOrdenBasica(id_orden) {
    const res = await db.query("SELECT id_estado_orden, valor_total FROM orden_trabajo WHERE id_orden = ?", [id_orden]);
    if (!res.values || res.values.length === 0) throw new Error("Orden no encontrada");
    return res.values[0];
}

// Agrega al set las sentencias para que la orden quede en el estado que
// corresponde a sus prendas. Devuelve el estado final de la orden.
function agregarRecalculo(set, id_orden, estadoActual, estadosPrendas, motivo) {
    const estadoNuevo = estadoOrdenSegunPrendas(estadoActual, estadosPrendas);
    set.push(...sentenciasTransicion(id_orden, estadoActual, estadoNuevo, motivo));
    return estadoNuevo;
}

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

    const orden = await getOrdenBasica(prenda.id_orden);
    if (orden.id_estado_orden === ESTADO_ORDEN.ENTREGADA || orden.id_estado_orden === ESTADO_ORDEN.CANCELADA) {
        throw new Error("No se pueden agregar prendas a una orden entregada o cancelada.");
    }
    const estados = (await getEstadosPrendas(prenda.id_orden)).map(p => p.id_estado_prenda);

    const set = [
        {
            statement: "UPDATE orden_trabajo SET valor_total = valor_total + ?, saldo_pendiente = saldo_pendiente + ? WHERE id_orden = ?",
            values: [prenda.valor, prenda.valor, prenda.id_orden]
        },
        {
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: ["Prenda añadida a la orden", prenda.id_orden, 2]
        }
    ];
    // Si la orden estaba Lista y llega una prenda nueva sin hacer, vuelve a En Proceso (A05)
    if (estados.length > 0) {
        agregarRecalculo(set, prenda.id_orden, orden.id_estado_orden, [...estados, 1], 'se agregó una prenda');
    }
    // El INSERT va al final para que lastId sea el id_prenda recién creado
    set.push({
        statement: "INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES (?, ?, ?, ?, 1)",
        values: [prenda.descripcion_arreglo, prenda.valor, prenda.id_orden, prenda.id_tipo_prenda]
    });

    const result = await db.executeSet(set, true);
    return result.changes.lastId;
}

// Elimina la prenda con sus fotos y observaciones y descuenta su valor (A01).
// No se permite si el cliente ya pagó más de lo que quedaría como total.
export async function deletePrenda(id_prenda) {
    if (!db) throw new Error("Database not initialized");

    const res = await db.query("SELECT id_orden, valor FROM prenda WHERE id_prenda = ?", [id_prenda]);
    if (!res.values || res.values.length === 0) throw new Error("Prenda no encontrada");
    const { id_orden, valor } = res.values[0];

    const orden = await getOrdenBasica(id_orden);
    if (orden.id_estado_orden === ESTADO_ORDEN.ENTREGADA || orden.id_estado_orden === ESTADO_ORDEN.CANCELADA) {
        throw new Error("No se pueden eliminar prendas de una orden entregada o cancelada.");
    }
    validarNuevoTotal(orden.valor_total - valor, await getTotalPagado(id_orden));

    const fotosRes = await db.query("SELECT ruta_archivo FROM fotografia WHERE id_prenda = ?", [id_prenda]);
    const restantes = (await getEstadosPrendas(id_orden))
        .filter(p => p.id_prenda !== id_prenda)
        .map(p => p.id_estado_prenda);

    const set = [
        { statement: "DELETE FROM observacion WHERE id_prenda = ?", values: [id_prenda] },
        { statement: "DELETE FROM fotografia WHERE id_prenda = ?", values: [id_prenda] },
        { statement: "DELETE FROM prenda WHERE id_prenda = ?", values: [id_prenda] },
        {
            statement: "UPDATE orden_trabajo SET valor_total = valor_total - ?, saldo_pendiente = saldo_pendiente - ? WHERE id_orden = ?",
            values: [valor, valor, id_orden]
        },
        {
            statement: "INSERT INTO historial_actividad (descripcion, id_orden, id_tipo_actividad) VALUES (?, ?, ?)",
            values: [`Prenda #${id_prenda} eliminada ($${valor})`, id_orden, 2]
        }
    ];
    agregarRecalculo(set, id_orden, orden.id_estado_orden, restantes, 'se eliminó una prenda');

    await db.executeSet(set, true);
    // Las rutas se devuelven para borrar los archivos de foto después de confirmar en la base
    return (fotosRes.values || []).map(f => f.ruta_archivo);
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

// Cambia el estado de una prenda y recalcula el de la orden en la misma transacción.
// Devuelve { estadoAnterior, estadoOrden } para que la pantalla ofrezca avisar al cliente.
export async function updateEstadoPrenda(id_prenda, id_estado_prenda, id_orden) {
    if (!db) throw new Error("Database not initialized");

    const orden = await getOrdenBasica(id_orden);
    if (orden.id_estado_orden === ESTADO_ORDEN.CANCELADA) {
        throw new Error("La orden está cancelada.");
    }

    const prendas = await getEstadosPrendas(id_orden);
    const objetivo = prendas.find(p => p.id_prenda === id_prenda);
    if (!objetivo) throw new Error("La prenda no pertenece a esta orden.");
    if (id_estado_prenda === 4 && objetivo.id_estado_prenda < 3) {
        throw new Error("No se puede entregar una prenda que no está Terminada.");
    }
    objetivo.id_estado_prenda = id_estado_prenda;

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
    const estadoOrden = agregarRecalculo(
        set, id_orden, orden.id_estado_orden, prendas.map(p => p.id_estado_prenda), 'automático según las prendas'
    );
    // Antes se insertaba aquí una notificación "Orden Lista" que nunca se enviaba (A02).
    // Ahora solo se registra un aviso cuando la modista realmente abre WhatsApp.

    await db.executeSet(set, true);
    return { estadoAnterior: orden.id_estado_orden, estadoOrden };
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

    if (diferencia < 0) {
        const orden = await getOrdenBasica(id_orden);
        validarNuevoTotal(orden.valor_total + diferencia, await getTotalPagado(id_orden));
    }

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
