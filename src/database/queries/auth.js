import { db, saveDb } from '../connection.js';
import bcrypt from 'bcryptjs';

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
        // Create default user: admin / admin123
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync("admin123", salt);
        await db.run("INSERT INTO usuario (username, password_hash) VALUES (?, ?)", ["admin", hash]);
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
