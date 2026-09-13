/**
 * SQLite real para las pruebas (sql.js, el mismo motor que usa jeep-sqlite en
 * la versión web), detrás de un adaptador con la forma de SQLiteDBConnection de
 * @capacitor-community/sqlite limitada a lo que usa la app.
 *
 * Uso en un archivo de pruebas:
 *
 *   vi.mock('<ruta>/database/connection.js', async () =>
 *       (await import('<ruta>/__tests__/helpers/sqliteReal.js')).crearConexionFalsa());
 *
 * y en `beforeAll` / `beforeEach`: `await prepararMotor()` y `nuevaBase()`.
 */
import initSqlJs from 'sql.js';

export const motor = { SQL: null, base: null };

export async function prepararMotor() {
    if (!motor.SQL) motor.SQL = await initSqlJs();
}

/** Base vacía. Activa las claves foráneas igual que database/connection.js. */
export function nuevaBase() {
    motor.base = new motor.SQL.Database();
    motor.base.exec('PRAGMA foreign_keys = ON;');
    return motor.base;
}

function ultimoId() {
    return motor.base.exec('SELECT last_insert_rowid()')[0].values[0][0];
}

export function crearConexionFalsa() {
    const db = {
        async query(sql, params = []) {
            const sentencia = motor.base.prepare(sql);
            sentencia.bind(params);
            const values = [];
            while (sentencia.step()) values.push(sentencia.getAsObject());
            sentencia.free();
            return { values };
        },
        async run(sql, params = []) {
            motor.base.run(sql, params);
            return { changes: { lastId: ultimoId() } };
        },
        async execute(sql) {
            motor.base.exec(sql);
            return { changes: {} };
        },
        async executeSet(set, transaction = true) {
            if (transaction) motor.base.exec('BEGIN');
            try {
                for (const { statement, values } of set) motor.base.run(statement, values ?? []);
                if (transaction) motor.base.exec('COMMIT');
                return { changes: { lastId: ultimoId() } };
            } catch (error) {
                if (transaction) motor.base.exec('ROLLBACK');
                throw error;
            }
        },
        async beginTransaction() { motor.base.exec('BEGIN'); },
        async commitTransaction() { motor.base.exec('COMMIT'); },
        async rollbackTransaction() { motor.base.exec('ROLLBACK'); }
    };

    return { db, saveDb: async () => {} };
}
