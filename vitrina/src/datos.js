/**
 * Base de datos de la vitrina: solo lo que las modistas deciden publicar.
 *
 * Aquí NO hay clientas, órdenes, medidas de clientas ni pagos. Eso sigue
 * viviendo en el teléfono de cada modista (D-06). La vitrina guarda el perfil
 * público del taller y las prendas que la modista hizo para vender (D-15).
 */
import { DatabaseSync } from 'node:sqlite';

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS modistas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    barrio TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    horario TEXT NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL DEFAULT '',
    servicios TEXT NOT NULL DEFAULT '[]',
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'suspendida')),
    acepto_terminos_en TEXT NOT NULL,
    version_terminos INTEGER NOT NULL,
    creada_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE TABLE IF NOT EXISTS prendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modista_id INTEGER NOT NULL REFERENCES modistas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL,
    precio INTEGER NOT NULL CHECK (precio > 0),
    talla TEXT NOT NULL DEFAULT '',
    tela TEXT NOT NULL DEFAULT '',
    medidas TEXT NOT NULL DEFAULT '',
    descripcion TEXT NOT NULL DEFAULT '',
    foto TEXT NOT NULL,
    vendida INTEGER NOT NULL DEFAULT 0 CHECK (vendida IN (0, 1)),
    creada_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    actualizada_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_prendas_modista ON prendas(modista_id);
CREATE INDEX IF NOT EXISTS idx_prendas_publicas ON prendas(vendida, creada_en);
`;

export function abrirBaseDatos(archivo) {
    const db = new DatabaseSync(archivo);
    db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    db.exec(ESQUEMA);
    return db;
}
