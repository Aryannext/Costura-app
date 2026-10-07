// Base SQLite real en memoria (node:sqlite, Node 22.5+) con la misma interfaz que usa
// la app del plugin @capacitor-community/sqlite: query, run, execute, executeSet y transacciones.
// Permite probar las reglas de negocio contra SQL de verdad, sin teléfono ni navegador.
import { DatabaseSync } from 'node:sqlite';
import { migrations } from '../migrations.js';

export function crearDbMemoria() {
    let memoria = null;

    const resultado = (r) => ({ changes: { lastId: Number(r.lastInsertRowid), changes: Number(r.changes) } });
    const ejecutar = (sql, values = []) => memoria.prepare(sql).run(...values);

    const db = {
        reiniciar() {
            if (memoria) memoria.close();
            memoria = new DatabaseSync(':memory:');
            memoria.exec('PRAGMA foreign_keys = ON;');
            for (const m of migrations) {
                for (const sql of m.statements) memoria.exec(sql);
            }
        },
        // Atajo para preparar datos de prueba
        sql(sql, values = []) {
            return ejecutar(sql, values);
        },
        async query(sql, values = []) {
            return { values: memoria.prepare(sql).all(...values) };
        },
        async run(sql, values = []) {
            return resultado(ejecutar(sql, values));
        },
        async execute(sql) {
            memoria.exec(sql);
            return {};
        },
        async executeSet(set, transaction = true) {
            if (transaction) memoria.exec('BEGIN;');
            try {
                let ultimo = { lastInsertRowid: 0, changes: 0 };
                for (const { statement, values } of set) ultimo = ejecutar(statement, values);
                if (transaction) memoria.exec('COMMIT;');
                return resultado(ultimo);
            } catch (e) {
                if (transaction) memoria.exec('ROLLBACK;');
                throw e;
            }
        },
        async beginTransaction() { memoria.exec('BEGIN;'); },
        async commitTransaction() { memoria.exec('COMMIT;'); },
        async rollbackTransaction() { memoria.exec('ROLLBACK;'); }
    };

    db.reiniciar();
    return db;
}

// Datos base: un cliente y una orden con las prendas indicadas [{ valor, estado }]
export function sembrarOrden(db, { estadoOrden = 1, prendas = [], pagos = [] } = {}) {
    db.sql("INSERT INTO cliente (nombre, telefono) VALUES ('María Pérez', '3001234567')");
    const total = prendas.reduce((acc, p) => acc + p.valor, 0);
    const pagado = pagos.reduce((acc, v) => acc + v, 0);
    const idOrden = Number(db.sql(
        "INSERT INTO orden_trabajo (fecha_entrega_estimada, valor_total, saldo_pendiente, id_cliente, id_estado_orden) VALUES ('2026-10-20', ?, ?, 1, ?)",
        [total, total - pagado, estadoOrden]
    ).lastInsertRowid);
    const idsPrendas = prendas.map(p => Number(db.sql(
        "INSERT INTO prenda (descripcion_arreglo, valor, id_orden, id_tipo_prenda, id_estado_prenda) VALUES ('Dobladillo', ?, ?, 1, ?)",
        [p.valor, idOrden, p.estado]
    ).lastInsertRowid));
    const idsPagos = pagos.map(v => Number(db.sql(
        "INSERT INTO pago (valor, id_orden, id_metodo_pago) VALUES (?, ?, 1)", [v, idOrden]
    ).lastInsertRowid));
    return { idOrden, idsPrendas, idsPagos };
}
