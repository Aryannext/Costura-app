import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { runMigrations } from './migrationRunner.js';
import { migrations } from './migrations.js';

export const sqlite = new SQLiteConnection(CapacitorSQLite);
// Referencia viva a propósito: las consultas leen siempre la conexión actual,
// que es null antes de abrir y después de restaurar una copia (ver
// cerrarConexionActiva). Un `const` obligaría a cambiar las once consultas.
export let db = null; // NOSONAR

/**
 * En la versión web la base vive en memoria (sql.js) y sólo sobrevive a una
 * recarga si se copia a IndexedDB con `saveToStore`. Muchas escrituras no lo
 * hacían —las de `executeSet` casi nunca—, así que al recargar se perdían
 * prendas, pagos y cambios de estado. En Android SQLite escribe en archivo y
 * esto no hace falta.
 *
 * En vez de repetir `saveDb` en cada consulta, la conexión web guarda sola
 * después de cada escritura confirmada. Las que corren dentro de una
 * transacción manual (`transaction = false`) esperan a `commitTransaction`.
 * Se envuelve con un Proxy y no se modifica el objeto del plugin.
 */
const ESCRITURAS = {
    run: (args) => args[2] !== false,
    execute: (args) => args[1] !== false,
    executeSet: (args) => args[1] !== false,
    commitTransaction: () => true
};

function conGuardadoAutomatico(conexion) {
    return new Proxy(conexion, {
        get(objetivo, propiedad) {
            const valor = objetivo[propiedad];
            if (typeof valor !== 'function') return valor;
            const debeGuardar = ESCRITURAS[propiedad];
            if (!debeGuardar) return valor.bind(objetivo);

            return async (...args) => {
                const resultado = await valor.apply(objetivo, args);
                if (debeGuardar(args)) {
                    try {
                        await sqlite.saveToStore("costura_db");
                    } catch (e) {
                        console.error("Error saving DB to store", e);
                    }
                }
                return resultado;
            };
        }
    });
}

export async function initDatabase() {
    try {
        const platform = Capacitor.getPlatform();
        if (platform === 'web') {
            jeepSqlite(window);
            if (!document.querySelector('jeep-sqlite')) {
                const jeepEl = document.createElement('jeep-sqlite');
                // jeep-sqlite busca /assets/sql-wasm.wasm en la raíz del dominio. Si la
                // versión web vive en una subruta (proyectosena.online/costura-app/), el
                // archivo está en esa subruta. BASE_URL es relativa ('./') en el APK.
                const base = import.meta.env.BASE_URL;
                jeepEl.setAttribute('wasmpath', base.startsWith('/') ? `${base}assets` : '/assets');
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
            // Este número es el del mecanismo de upgrade del plugin, que no
            // usamos: el versionado del esquema lo lleva migrationRunner con su
            // propia tabla. Debe quedarse en 1 — subirlo aquí haría que el
            // plugin buscase sentencias de upgrade que no existen.
            db = await sqlite.createConnection("costura_db", false, "no-encryption", 1, false);
        }

        await db.open();

        await db.execute('PRAGMA foreign_keys = ON;', false);

        // Esquema. Si una migración falla, esto lanza y bootstrap muestra la
        // pantalla de error crítico en lugar de seguir con la base a medias.
        await runMigrations(db, migrations);

        if (platform === 'web') {
            await sqlite.saveToStore("costura_db");
            db = conGuardadoAutomatico(db);
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

export async function exportDatabaseObject() {
    if (!db) throw new Error("Database not initialized");
    try {
        const jsonExport = await db.exportToJson('full');
        return jsonExport.export;
    } catch (e) {
        console.error("Error exporting database:", e);
        throw e;
    }
}

export async function exportDatabaseToJson() {
    return JSON.stringify(await exportDatabaseObject(), null, 2);
}

/**
 * Suelta la conexión activa antes de importar.
 *
 * `importFromJson` no escribe sobre la conexión que la aplicación tiene abierta,
 * sino sobre su propio handle. Si se dejaba viva la conexión anterior, su copia
 * en memoria terminaba guardándose encima de lo recién importado: la
 * restauración decía haber ido bien y no restauraba absolutamente nada.
 */
async function cerrarConexionActiva() {
    try {
        if (db) await db.close();
    } catch (e) {
        console.warn("No se pudo cerrar la base de datos antes de importar", e);
    }
    try {
        await sqlite.closeConnection("costura_db", false);
    } catch (e) {
        console.warn("No se pudo liberar la conexión antes de importar", e);
    }
    db = null;
}

/**
 * Restaura la base de datos desde la exportación JSON de SQLite.
 *
 * Al terminar, la conexión queda cerrada y `db` en null a propósito: los datos
 * en memoria de la aplicación ya no valen. Quien llame a esta función tiene que
 * recargar la aplicación a continuación.
 */
export async function importDatabaseFromJson(jsonString) {
    let snapshot = null;
    try {
        snapshot = await exportDatabaseToJson();
    } catch (e) {
        throw new Error("No se pudo crear el snapshot de seguridad antes de restaurar.");
    }

    try {
        JSON.parse(jsonString);
    } catch (e) {
        throw new Error("El archivo de respaldo no contiene un JSON válido.");
    }

    await cerrarConexionActiva();

    try {
        await sqlite.importFromJson(jsonString);
        return true;
    } catch (importError) {
        console.error("Error importando backup, iniciando Rollback...", importError);
        try {
            await sqlite.importFromJson(snapshot);
            console.warn("Rollback completado. La base de datos no sufrió daños.");
        } catch (rollbackError) {
            console.error("CRÍTICO: Fallo en importación Y en rollback.", rollbackError);
            throw new Error("CRÍTICO: Corrupción de base de datos irrecuperable.");
        }
        throw new Error("Falló la restauración del respaldo. Se revirtieron los cambios.");
    }
}
