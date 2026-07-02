import { db, saveDb } from '../connection.js';

export async function getAllClientes(limit = 50, offset = 0) {
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

export async function createCliente(cliente) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.run(
        "INSERT INTO cliente (nombre, telefono, direccion) VALUES (?, ?, ?)",
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
