import { db, saveDb } from '../connection.js';
import bcrypt from 'bcryptjs';

// Credenciales con las que arranca toda instalación nueva. Son públicas por
// definición (están en el código y en el manual), así que la aplicación obliga
// a cambiarlas en el primer inicio de sesión: ver `mustChangePassword` en
// services/auth.js y la guardia del router.
export const DEFAULT_USERNAME = "admin";
export const DEFAULT_PASSWORD = "admin123";

/**
 * ¿Este hash sigue siendo el de la contraseña de fábrica?
 * Se comprueba contra el hash en lugar de guardar una bandera aparte para que
 * la respuesta siga siendo correcta después de restaurar un respaldo.
 */
export function isDefaultPassword(password_hash) {
    if (!password_hash) return false;
    return bcrypt.compareSync(DEFAULT_PASSWORD, password_hash);
}

export async function getUsuarioByUsername(username) {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT * FROM usuario WHERE username = ?", [username]);
    if (result.values && result.values.length > 0) {
        return result.values[0];
    }
    return null;
}

export async function updateUltimoAcceso(id_usuario) {
    if (!db) throw new Error("Database not initialized");
    await db.run("UPDATE usuario SET ultimo_acceso = datetime('now','localtime') WHERE id_usuario = ?", [id_usuario]);
    await saveDb();
}

export async function setupDefaultUser() {
    if (!db) throw new Error("Database not initialized");
    const result = await db.query("SELECT count(*) as count FROM usuario");
    const count = result.values[0].count;
    if (count === 0) {
        // Usuario de fábrica. La app fuerza el cambio en el primer inicio de sesión.
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(DEFAULT_PASSWORD, salt);
        await db.run("INSERT INTO usuario (username, password_hash) VALUES (?, ?)", [DEFAULT_USERNAME, hash]);
        console.log("Default admin user created.");
        await saveDb();
    }
}

export async function updatePassword(id_usuario, newPassword) {
    if (!db) throw new Error("Database not initialized");
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    await db.run("UPDATE usuario SET password_hash = ? WHERE id_usuario = ?", [hash, id_usuario]);
    await saveDb();
}
