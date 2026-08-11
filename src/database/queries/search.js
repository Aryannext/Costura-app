import { db } from '../connection.js';

export async function globalSearch(query) {
    if (!db) throw new Error("Database not initialized");
    if (!query || query.trim() === '') {
        return { clientes: [], ordenes: [] };
    }

    const searchTerm = `%${query.trim()}%`;
    const numSearch = isNaN(Number(query.trim())) ? null : Number(query.trim());

    // 1. Buscar clientes por nombre o teléfono
    const resClientes = await db.query(
        "SELECT * FROM cliente WHERE nombre LIKE ? OR telefono LIKE ? ORDER BY nombre ASC LIMIT 10",
        [searchTerm, searchTerm]
    );

    // 2. Buscar órdenes por ID, o cruzando el nombre del cliente
    let ordenesQuery = `
        SELECT o.*, c.nombre as cliente_nombre, c.telefono as cliente_telefono, e.nombre as estado_nombre 
        FROM orden_trabajo o 
        JOIN cliente c ON o.id_cliente = c.id_cliente
        JOIN estado_orden e ON o.id_estado_orden = e.id_estado_orden
        WHERE c.nombre LIKE ? 
    `;
    let params = [searchTerm];

    if (numSearch !== null) {
        ordenesQuery += ` OR o.id_orden = ?`;
        params.push(numSearch);
    }
    
    ordenesQuery += ` ORDER BY o.fecha_creacion DESC LIMIT 20`;

    const resOrdenes = await db.query(ordenesQuery, params);

    return {
        clientes: resClientes.values || [],
        ordenes: resOrdenes.values || []
    };
}
