import { db, saveDb } from '../connection.js';

export async function getConfig(clave) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT valor FROM configuracion WHERE clave = ?", [clave]);
    if (result.values && result.values.length > 0) {
        return result.values[0].valor;
    }
    return null;
}

export async function updateConfig(clave, valor) {
    if (!db) throw new Error("Database not initialized");
    // UPSERT: un UPDATE simple no hacía nada si la clave todavía no existía,
    // y eso es justo lo que pasa con las claves que no vienen sembradas.
    await db.run(
        `INSERT INTO configuracion (clave, valor) VALUES (?, ?)
         ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor`,
        [clave, valor ?? '']
    );
    await saveDb();
}

export async function getAllConfig() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT * FROM configuracion");
    const config = {};
    if (result.values) {
        result.values.forEach(row => {
            config[row.clave] = row.valor;
        });
    }
    return config;
}
