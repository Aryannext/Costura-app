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
            const jeepEl = document.createElement('jeep-sqlite');
            document.body.appendChild(jeepEl);
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

async function runMigrations(db) {
    const { migrations } = await import('./migrations.js');
    for (const stmt of migrations[0].statements) {
        try {
            await db.execute(stmt);
        } catch(e) {
            console.error("Error executing stmt: " + stmt, e);
        }
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
    try {
        // The capacitor-community-sqlite plugin expects a parsed JSON object for importFromJson
        const jsonToImport = JSON.parse(jsonString);
        await sqlite.importFromJson(jsonString); // The plugin documentation says importFromJson takes a stringified JSON
        if (Capacitor.getPlatform() === 'web') {
            await sqlite.saveToStore("costura_db");
        }
        return true;
    } catch (e) {
        console.error("Error importing database:", e);
        throw e;
    }
}
