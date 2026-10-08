/**
 * Ejecutor de migraciones versionadas.
 *
 * El anterior recorría `migrations[0].statements` con el índice fijo y se tragaba
 * cada error con un `console.error`. Dos consecuencias: una segunda migración no
 * se habría ejecutado jamás, y una sentencia fallida dejaba el esquema a medias
 * sin que nadie se enterase.
 *
 * El control de versiones vive en una tabla propia y no en el `PRAGMA
 * user_version` ni en el mecanismo de upgrade del plugin: así es inspeccionable
 * desde cualquier visor de SQLite y no depende de los detalles internos de
 * @capacitor-community/sqlite.
 */

export const TABLA_MIGRACIONES = 'schema_migrations';

/**
 * Aplica las migraciones que falten, en orden, cada una dentro de su propia
 * transacción. Devuelve las versiones aplicadas en esta ejecución.
 */
export async function runMigrations(db, migrations) {
    if (!db) throw new Error("Database not initialized");

    await db.execute(`CREATE TABLE IF NOT EXISTS ${TABLA_MIGRACIONES} (
        version INTEGER PRIMARY KEY,
        aplicada_en TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );`);

    const resultado = await db.query(`SELECT version FROM ${TABLA_MIGRACIONES}`);
    const aplicadas = new Set((resultado?.values || []).map(fila => fila.version));

    const ordenadas = [...migrations].sort((a, b) => a.toVersion - b.toVersion);
    const versionQueEntiendeLaApp = ordenadas.at(-1)?.toVersion ?? 0;
    const versionEnLaBase = aplicadas.size ? Math.max(...aplicadas) : 0;

    // Guardia contra reversiones OTA. Capgo tiene `autoUpdate` activado y puede
    // devolver el teléfono a un bundle anterior; ese código no sabe leer un
    // esquema más nuevo, y dejarle escribir encima corrompe los datos en
    // silencio. Es preferible negarse a arrancar y pedir la actualización.
    if (versionEnLaBase > versionQueEntiendeLaApp) {
        throw new Error(
            `La base de datos usa el esquema versión ${versionEnLaBase} y esta versión ` +
            `de la aplicación sólo entiende hasta la ${versionQueEntiendeLaApp}. ` +
            `Actualiza la aplicación antes de continuar.`
        );
    }

    const pendientes = ordenadas.filter(m => !aplicadas.has(m.toVersion));
    for (const migracion of pendientes) {
        // En orden y una a la vez: cada versión parte del esquema que deja la anterior
        await aplicarMigracion(db, migracion); // NOSONAR
    }

    return pendientes.map(m => m.toVersion);
}

async function aplicarMigracion(db, migracion) {
    await db.beginTransaction();
    try {
        for (const sentencia of migracion.statements) {
            // Las sentencias de una migración dependen de las anteriores
            await db.execute(sentencia, false); // NOSONAR
        }
        await db.run(
            `INSERT INTO ${TABLA_MIGRACIONES} (version) VALUES (?)`,
            [migracion.toVersion],
            false
        );
        await db.commitTransaction();
    } catch (error) {
        try {
            await db.rollbackTransaction();
        } catch (error_) {
            console.error("Falló también el rollback de la migración", error_);
        }
        // Se propaga a propósito. Arrancar con el esquema a medio aplicar es peor
        // que no arrancar: main.js muestra la pantalla de error crítico y la
        // dueña sabe que algo pasa, en vez de perder datos sin enterarse.
        throw new Error(
            `Falló la migración a la versión ${migracion.toVersion}: ${error?.message || error}`
        );
    }
}
