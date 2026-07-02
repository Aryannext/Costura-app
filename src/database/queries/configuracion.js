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
    await db.run("UPDATE configuracion SET valor = ? WHERE clave = ?", [valor, clave]);
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
