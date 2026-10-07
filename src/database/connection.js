import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

export const sqlite = new SQLiteConnection(CapacitorSQLite);
export let db = null;

export async function initDatabase() {
    try {
        const platform = Capacitor.getPlatform();
        if (platform === 'web') {
            jeepSqlite(window);
            if (!document.querySelector('jeep-sqlite')) {
                const jeepEl = document.createElement('jeep-sqlite');
                document.body.appendChild(jeepEl);
            }
            await customElements.whenDefined('jeep-sqlite');
            await sqlite.initWebStore();
        }

        // check connections consistency
        const ret = await sqlite.checkConnectionsConsistency();
        const isConn = (await sqlite.isConnection("costura_db", false)).result;

        if (ret.result && isConn) {
            db = await sqlite.retrieveConnection("costura_db", false);
        } else {
            db = await sqlite.createConnection("costura_db", false, "no-encryption", 1, false);
        }

        await db.open();

        await db.execute('PRAGMA foreign_keys = ON;', false);

        // Initialize schema
        await runMigrations(db);

        if (platform === 'web') {
            await sqlite.saveToStore("costura_db");
        }

        return db;
    } catch (error) {
        console.error("Error initializing database", error);
        throw error;
    }
}

export async function saveDb() {
    if (Capacitor.getPlatform() === 'web') {
        try {
            await sqlite.saveToStore("costura_db");
        } catch (e) {
            console.error("Error saving DB to store", e);
        }
    }
}

// La versión del esquema se guarda en configuracion.schema_version.
// No se usa PRAGMA user_version porque el plugin de SQLite lo maneja para su propio versionado.
// La v1 usa CREATE ... IF NOT EXISTS, así que se puede ejecutar siempre sin riesgo;
// las siguientes (ALTER TABLE) se ejecutan una sola vez.
async function runMigrations(db) {
    const { migrations } = await import('./migrations.js');
    for (const stmt of migrations[0].statements) {
        try {
            await db.execute(stmt);
        } catch(e) {
            console.error("Error executing stmt: " + stmt, e);
        }
    }

    const res = await db.query("SELECT valor FROM configuracion WHERE clave = 'schema_version'");
    let actual = res.values && res.values.length > 0 ? parseInt(res.values[0].valor, 10) : 1;

    for (const migration of migrations.slice(1)) {
        if (migration.toVersion <= actual) continue;
        for (const stmt of migration.statements) {
            try {
                await db.execute(stmt);
            } catch (e) {
                // Si una ejecución anterior se interrumpió, la columna ya puede existir.
                if (!String(e?.message || e).includes('duplicate column')) throw e;
            }
        }
        await db.run(
            "INSERT OR REPLACE INTO configuracion (clave, valor) VALUES ('schema_version', ?)",
            [String(migration.toVersion)]
        );
        actual = migration.toVersion;
    }
}

export async function exportDatabaseToJson() {
    if (!db) throw new Error("Database not initialized");
    try {
        const jsonExport = await db.exportToJson('full');
        return JSON.stringify(jsonExport.export, null, 2);
    } catch (e) {
        console.error("Error exporting database:", e);
        throw e;
    }
}

export async function importDatabaseFromJson(jsonString) {
    let snapshot = null;
    try {
        snapshot = await exportDatabaseToJson();
    } catch (e) {
        throw new Error("No se pudo crear el snapshot de seguridad antes de restaurar.");
    }

    try {
        JSON.parse(jsonString);
        await sqlite.importFromJson(jsonString);
        if (Capacitor.getPlatform() === 'web') {
            await sqlite.saveToStore("costura_db");
        }
        return true;
    } catch (importError) {
        console.error("Error importando backup, iniciando Rollback...", importError);
        try {
            await sqlite.importFromJson(snapshot);
            if (Capacitor.getPlatform() === 'web') {
                await sqlite.saveToStore("costura_db");
            }
            console.warn("Rollback completado. La base de datos no sufrió daños.");
        } catch (rollbackError) {
            console.error("CRÍTICO: Fallo en importación Y en rollback.", rollbackError);
            throw new Error("CRÍTICO: Corrupción de base de datos irrecuperable.");
        }
        throw new Error("Fallo la restauración del Backup. Se revirtieron los cambios.");
    }
}
