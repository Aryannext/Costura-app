import { db, saveDb } from '../connection.js';
import { MENSAJE_FALTA_AUTORIZACION } from '../../services/avisoPrivacidad.js';

// LIMIT -1 en SQLite = sin límite. Con 50 la agenda ocultaba al cliente 51 (A12).
export async function getAllClientes(limit = -1, offset = 0) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(
        "SELECT * FROM cliente ORDER BY nombre ASC LIMIT ? OFFSET ?",
        [limit, offset]
    );
    return result.values || [];
}

export async function getClienteById(id_cliente) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(
        "SELECT * FROM cliente WHERE id_cliente = ?", 
        [id_cliente]
    );
    return result.values && result.values.length > 0 ? result.values[0] : null;
}

// Ley 1581: sin autorización de la clienta no se guardan sus datos. Se valida
// aquí, en la capa de datos, para que ninguna pantalla pueda saltárselo, y se
// guarda la fecha como prueba de la autorización.
export async function createCliente(cliente) {
    if (!db) throw new Error("Database not initialized");
    if (cliente.autoriza_datos !== true) throw new Error(MENSAJE_FALTA_AUTORIZACION);
    const result = await db.run(
        "INSERT INTO cliente (nombre, telefono, direccion, fecha_autorizacion_datos) VALUES (?, ?, ?, datetime('now','localtime'))",
        [cliente.nombre, cliente.telefono, cliente.direccion || null]
    );
    await saveDb();
    return result.changes.lastId;
}

export async function updateCliente(id_cliente, cliente) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "UPDATE cliente SET nombre = ?, telefono = ?, direccion = ? WHERE id_cliente = ?",
        [cliente.nombre, cliente.telefono, cliente.direccion || null, id_cliente]
    );
    await saveDb();
}

export async function searchClientes(query) {
    if (!db) throw new Error("Database not initialized");
    const searchTerm = `%${query}%`;
    const result = await db.query(
        "SELECT * FROM cliente WHERE nombre LIKE ? OR telefono LIKE ? ORDER BY nombre ASC",
        [searchTerm, searchTerm]
    );
    return result.values || [];
}

export async function getOrdenesByCliente(id_cliente) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query(
        `SELECT o.*, e.nombre as estado_nombre 
         FROM orden_trabajo o 
         JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
         WHERE o.id_cliente = ? 
         ORDER BY o.fecha_creacion DESC`,
        [id_cliente]
    );
    return result.values || [];
}

// Para clientas registradas antes de la versión 7: deja constancia de que
// autorizaron. No cambia una fecha ya registrada.
export async function registrarAutorizacionDatos(id_cliente) {
    if (!db) throw new Error("Database not initialized");
    await db.run(
        "UPDATE cliente SET fecha_autorizacion_datos = datetime('now','localtime') WHERE id_cliente = ? AND fecha_autorizacion_datos IS NULL",
        [id_cliente]
    );
    await saveDb();
}

// Derecho de supresión (Ley 1581): borra nombre, celular y dirección de la clienta.
// Las órdenes y pagos se conservan sin datos personales, porque son las cuentas
// del taller. No se permite con órdenes abiertas o saldo pendiente.
export async function anonimizarCliente(id_cliente) {
    if (!db) throw new Error("Database not initialized");
    const pendientes = await db.query(
        `SELECT COUNT(*) AS n FROM orden_trabajo
         WHERE id_cliente = ? AND (id_estado_orden IN (1, 2, 3) OR (id_estado_orden = 4 AND saldo_pendiente > 0))`,
        [id_cliente]
    );
    if ((pendientes.values?.[0]?.n || 0) > 0) {
        throw new Error('La clienta tiene órdenes abiertas o saldo pendiente. Entrégalas, cóbralas o cancélalas antes de borrar sus datos.');
    }
    await db.run(
        "UPDATE cliente SET nombre = 'Clienta retirada', telefono = '', direccion = NULL, fecha_autorizacion_datos = NULL WHERE id_cliente = ?",
        [id_cliente]
    );
    await saveDb();
}
