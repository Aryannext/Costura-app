/**
 * Servidor de la Vitrina de Modistas (D-15).
 *
 * - Clientes (sin cuenta): ven las prendas y los talleres aprobados.
 * - Modista (con el código que le da la app al registrarse): publica, edita y
 *   borra sus prendas, y puede borrar su vitrina completa.
 * - Administración (con VITRINA_CLAVE_ADMIN): aprueba o suspende talleres.
 *
 * Sin dependencias: node:http, node:sqlite y node:crypto. Así la imagen no trae
 * código de terceros que haya que vigilar.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { abrirBaseDatos } from './datos.js';
import { limpiarJpeg } from './jpeg.js';
import * as reglas from './reglas.js';

const { ErrorDeDatos } = reglas;

export const MAX_CUERPO = 4 * 1024 * 1024;   // una foto de 2 MB pesa ~2,7 MB en base64
export const MAX_FOTO = 2 * 1024 * 1024;

const TIPOS = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml'
};

// La página pública solo carga sus propios archivos y las fotos de la vitrina
const CSP = "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; " +
    "connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

class ErrorHttp extends Error {
    constructor(estado, mensaje) {
        super(mensaje);
        this.estado = estado;
    }
}

const hash = token => createHash('sha256').update(token).digest('hex');

function iguales(a, b) {
    const x = Buffer.from(hash(a));
    const y = Buffer.from(hash(b));
    return timingSafeEqual(x, y);
}

function servicios(texto) {
    try {
        return JSON.parse(texto);
    } catch {
        return [];
    }
}

function perfilPublico(m) {
    return {
        id: m.id,
        nombre: m.nombre,
        ciudad: m.ciudad,
        barrio: m.barrio,
        whatsapp: m.whatsapp,
        horario: m.horario,
        descripcion: m.descripcion,
        servicios: servicios(m.servicios)
    };
}

function prendaPublica(p) {
    return {
        id: p.id,
        modistaId: p.modista_id,
        titulo: p.titulo,
        categoria: p.categoria,
        precio: p.precio,
        talla: p.talla,
        tela: p.tela,
        medidas: p.medidas,
        descripcion: p.descripcion,
        foto: `fotos/${p.foto}`,
        vendida: p.vendida === 1,
        creadaEn: p.creada_en
    };
}

/** Escapa los comodines de LIKE para que un "%" en la búsqueda sea literal */
const patron = q => `%${q.replace(/[\\%_]/g, c => '\\' + c)}%`;

/**
 * Límite simple por IP en memoria para los registros nuevos. Basta para un
 * servidor pequeño: frena a quien intente llenar la lista de pendientes.
 */
function crearLimitador(max, ventanaMs) {
    const visitas = new Map();
    return ip => {
        const ahora = Date.now();
        const recientes = (visitas.get(ip) || []).filter(t => ahora - t < ventanaMs);
        if (recientes.length >= max) return false;
        recientes.push(ahora);
        visitas.set(ip, recientes);
        if (visitas.size > 10_000) visitas.clear();
        return true;
    };
}

export function crearVitrina({
    archivoBd,
    carpetaFotos,
    carpetaPublica,
    claveAdmin = '',
    confiarEnProxy = false,
    registrosPorHora = 5
}) {
    mkdirSync(carpetaFotos, { recursive: true });
    const db = abrirBaseDatos(archivoBd);
    const puedeRegistrar = crearLimitador(registrosPorHora, 60 * 60 * 1000);

    const sql = {
        modistaPorToken: db.prepare('SELECT * FROM modistas WHERE token_hash = ?'),
        modista: db.prepare('SELECT * FROM modistas WHERE id = ?'),
        crearModista: db.prepare(`INSERT INTO modistas
            (token_hash, nombre, ciudad, barrio, whatsapp, horario, descripcion, servicios, acepto_terminos_en, version_terminos)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'), ?)`),
        prendasDe: db.prepare('SELECT * FROM prendas WHERE modista_id = ? ORDER BY creada_en DESC, id DESC'),
        prendaDe: db.prepare('SELECT * FROM prendas WHERE id = ? AND modista_id = ?'),
        activasDe: db.prepare('SELECT COUNT(*) AS n FROM prendas WHERE modista_id = ? AND vendida = 0'),
        crearPrenda: db.prepare(`INSERT INTO prendas
            (modista_id, titulo, categoria, precio, talla, tela, medidas, descripcion, foto)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),
        borrarPrenda: db.prepare('DELETE FROM prendas WHERE id = ?'),
        borrarModista: db.prepare('DELETE FROM modistas WHERE id = ?'),
        estado: db.prepare('UPDATE modistas SET estado = ? WHERE id = ?'),
        // Consultas fijas: ningún dato de la petición se vuelve texto SQL.
        // Un NULL deja el campo como estaba.
        editarPerfil: db.prepare(`UPDATE modistas SET
            nombre = COALESCE(?, nombre), ciudad = COALESCE(?, ciudad), barrio = COALESCE(?, barrio),
            whatsapp = COALESCE(?, whatsapp), horario = COALESCE(?, horario),
            descripcion = COALESCE(?, descripcion), servicios = COALESCE(?, servicios)
            WHERE id = ?`),
        editarPrenda: db.prepare(`UPDATE prendas SET
            titulo = COALESCE(?, titulo), categoria = COALESCE(?, categoria), precio = COALESCE(?, precio),
            talla = COALESCE(?, talla), tela = COALESCE(?, tela), medidas = COALESCE(?, medidas),
            descripcion = COALESCE(?, descripcion), vendida = COALESCE(?, vendida),
            actualizada_en = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
            WHERE id = ?`),
        prendasPublicas: db.prepare(`SELECT p.* FROM prendas p JOIN modistas m ON m.id = p.modista_id
            WHERE m.estado = 'aprobada' AND p.vendida = 0
              AND (?1 IS NULL OR m.ciudad = ?1 COLLATE NOCASE)
              AND (?2 IS NULL OR p.categoria = ?2)
              AND (?3 IS NULL OR m.id = ?3)
              AND (?4 IS NULL OR p.titulo LIKE ?4 ESCAPE '\\' OR p.tela LIKE ?4 ESCAPE '\\'
                   OR p.descripcion LIKE ?4 ESCAPE '\\' OR m.nombre LIKE ?4 ESCAPE '\\')
            ORDER BY p.creada_en DESC, p.id DESC LIMIT 200`),
        modistasPublicas: db.prepare(`SELECT m.*,
                (SELECT COUNT(*) FROM prendas p WHERE p.modista_id = m.id AND p.vendida = 0) AS prendas
            FROM modistas m WHERE m.estado = 'aprobada'
              AND (?1 IS NULL OR m.ciudad = ?1 COLLATE NOCASE)
              AND (?2 IS NULL OR m.nombre LIKE ?2 ESCAPE '\\' OR m.barrio LIKE ?2 ESCAPE '\\' OR m.servicios LIKE ?2 ESCAPE '\\')
            ORDER BY m.nombre COLLATE NOCASE`),
        ciudades: db.prepare("SELECT DISTINCT ciudad FROM modistas WHERE estado = 'aprobada' ORDER BY ciudad COLLATE NOCASE"),
        fotoGuardada: db.prepare('SELECT foto FROM prendas WHERE foto = ?'),
        adminTodas: db.prepare('SELECT * FROM modistas ORDER BY creada_en'),
        adminPorEstado: db.prepare('SELECT * FROM modistas WHERE estado = ? ORDER BY creada_en'),
        token: db.prepare('UPDATE modistas SET token_hash = ? WHERE id = ?')
    };

    // ---------- utilidades de la petición ----------

    function ipDe(req) {
        if (confiarEnProxy) {
            const reenviada = req.headers['x-forwarded-for'];
            if (typeof reenviada === 'string' && reenviada) return reenviada.split(',')[0].trim();
        }
        return req.socket.remoteAddress || '';
    }

    async function leerJson(req) {
        const tipo = req.headers['content-type'] || '';
        if (!tipo.startsWith('application/json')) throw new ErrorHttp(415, 'Se esperaba JSON.');
        const declarado = Number(req.headers['content-length'] || 0);
        if (declarado > MAX_CUERPO) throw new ErrorHttp(413, 'La foto es demasiado pesada.');
        const trozos = [];
        let total = 0;
        for await (const trozo of req) {
            total += trozo.length;
            if (total > MAX_CUERPO) throw new ErrorHttp(413, 'La foto es demasiado pesada.');
            trozos.push(trozo);
        }
        try {
            return JSON.parse(Buffer.concat(trozos).toString('utf8') || '{}');
        } catch {
            throw new ErrorHttp(400, 'Los datos no tienen un formato válido.');
        }
    }

    function tokenDe(req) {
        const auth = req.headers.authorization || '';
        return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    }

    function modistaAutenticada(req) {
        const token = tokenDe(req);
        const m = token ? sql.modistaPorToken.get(hash(token)) : null;
        if (!m) throw new ErrorHttp(401, 'El código de tu vitrina no es válido. Vuelve a vincularla desde la app.');
        return m;
    }

    function exigirAdmin(req) {
        // Sin clave configurada, la administración no existe
        if (!claveAdmin) throw new ErrorHttp(404, 'No encontrado.');
        const token = tokenDe(req);
        if (!token || !iguales(token, claveAdmin)) throw new ErrorHttp(401, 'Clave de administración incorrecta.');
    }

    function guardarFoto(base64) {
        if (typeof base64 !== 'string' || !base64) throw new ErrorDeDatos('Falta la foto de la prenda.');
        const limpio = base64.replace(/^data:image\/jpeg;base64,/, '');
        if (!/^[A-Za-z0-9+/=\s]+$/.test(limpio)) throw new ErrorDeDatos('La foto tiene que ser una imagen JPEG.');
        const crudo = Buffer.from(limpio, 'base64');
        if (crudo.length > MAX_FOTO) throw new ErrorDeDatos('La foto es demasiado pesada (máximo 2 MB).');
        const { datos } = limpiarJpeg(crudo);
        const nombre = `${randomBytes(16).toString('hex')}.jpg`;
        writeFileSync(join(carpetaFotos, nombre), datos);
        return nombre;
    }

    function borrarFoto(nombre) {
        try {
            unlinkSync(join(carpetaFotos, nombre));
        } catch {
            // Ya no estaba: no es un error para quien borra
        }
    }

    function miVitrina(m) {
        return {
            perfil: { ...perfilPublico(m), estado: m.estado },
            prendas: sql.prendasDe.all(m.id).map(prendaPublica)
        };
    }

    // ---------- rutas ----------

    const parametro = (url, nombre) => url.searchParams.get(nombre) || null;
    const busqueda = url => {
        const q = (url.searchParams.get('q') || '').trim().slice(0, 60);
        return q ? patron(q) : null;
    };

    function listarPrendas(url) {
        const modista = parametro(url, 'modista');
        const filas = sql.prendasPublicas.all(parametro(url, 'ciudad'), parametro(url, 'categoria'),
            modista === null ? null : (Number(modista) || 0), busqueda(url));
        return { prendas: filas.map(prendaPublica) };
    }

    function listarModistas(url) {
        const filas = sql.modistasPublicas.all(parametro(url, 'ciudad'), busqueda(url));
        const ciudades = sql.ciudades.all().map(f => f.ciudad);
        return { modistas: filas.map(m => ({ ...perfilPublico(m), prendas: m.prendas })), ciudades };
    }

    async function registrar(req) {
        if (!puedeRegistrar(ipDe(req))) {
            throw new ErrorHttp(429, 'Demasiados registros desde esta conexión. Intenta más tarde.');
        }
        const datos = await leerJson(req);
        if (datos.aceptaCondiciones !== true) {
            throw new ErrorDeDatos('Para publicar tienes que aceptar que tus datos del taller se muestren en la vitrina.');
        }
        const p = reglas.perfil(datos);
        const token = randomBytes(24).toString('base64url');
        const { lastInsertRowid } = sql.crearModista.run(hash(token), p.nombre, p.ciudad, p.barrio, p.whatsapp,
            p.horario, p.descripcion, JSON.stringify(p.servicios), reglas.VERSION_TERMINOS);
        return [201, { token, ...miVitrina(sql.modista.get(lastInsertRowid)) }];
    }

    async function actualizarPerfil(req, m) {
        const p = reglas.perfil(await leerJson(req), { parcial: true });
        const servicios = p.servicios ? JSON.stringify(p.servicios) : null;
        sql.editarPerfil.run(p.nombre ?? null, p.ciudad ?? null, p.barrio ?? null, p.whatsapp ?? null,
            p.horario ?? null, p.descripcion ?? null, servicios, m.id);
        return miVitrina(sql.modista.get(m.id));
    }

    function exigirCupo(m) {
        if (sql.activasDe.get(m.id).n >= reglas.MAX_PRENDAS_ACTIVAS) {
            throw new ErrorDeDatos(`Puedes tener máximo ${reglas.MAX_PRENDAS_ACTIVAS} prendas a la venta. Marca como vendidas o borra algunas.`);
        }
    }

    async function publicar(req, m) {
        const datos = await leerJson(req);
        if (m.estado === 'suspendida') throw new ErrorHttp(403, 'Tu vitrina está suspendida. Escribe a la administración.');
        exigirCupo(m);
        const p = reglas.prenda(datos);
        const foto = guardarFoto(datos.foto);
        const { lastInsertRowid } = sql.crearPrenda.run(m.id, p.titulo, p.categoria, p.precio, p.talla, p.tela,
            p.medidas, p.descripcion, foto);
        return [201, prendaPublica(sql.prendaDe.get(lastInsertRowid, m.id))];
    }

    async function editarPrenda(req, m, id) {
        const actual = sql.prendaDe.get(id, m.id);
        if (!actual) throw new ErrorHttp(404, 'Esa prenda ya no está en tu vitrina.');
        const p = reglas.prenda(await leerJson(req), { parcial: true });
        // Volver a publicar una vendida cuenta igual que publicar una nueva
        if (p.vendida === 0 && actual.vendida === 1) exigirCupo(m);
        sql.editarPrenda.run(p.titulo ?? null, p.categoria ?? null, p.precio ?? null, p.talla ?? null,
            p.tela ?? null, p.medidas ?? null, p.descripcion ?? null, p.vendida ?? null, id);
        return prendaPublica(sql.prendaDe.get(id, m.id));
    }

    function borrarPrendaDe(m, id) {
        const actual = sql.prendaDe.get(id, m.id);
        if (!actual) throw new ErrorHttp(404, 'Esa prenda ya no está en tu vitrina.');
        sql.borrarPrenda.run(id);
        borrarFoto(actual.foto);
        return [204, null];
    }

    /** Derecho de supresión: se va el perfil, las prendas y sus fotos */
    function borrarVitrina(m) {
        const fotos = sql.prendasDe.all(m.id).map(p => p.foto);
        sql.borrarModista.run(m.id);
        fotos.forEach(borrarFoto);
        return [204, null];
    }

    async function cambiarEstado(req, id) {
        const { estado } = await leerJson(req);
        if (!['pendiente', 'aprobada', 'suspendida'].includes(estado)) throw new ErrorDeDatos('Estado no válido.');
        if (!sql.modista.get(id)) throw new ErrorHttp(404, 'No existe ese taller.');
        sql.estado.run(estado, id);
        return { id, estado };
    }

    function nuevoToken(id) {
        if (!sql.modista.get(id)) throw new ErrorHttp(404, 'No existe ese taller.');
        const token = randomBytes(24).toString('base64url');
        sql.token.run(hash(token), id);
        return { id, token };
    }

    function listarAdmin(url) {
        const estado = url.searchParams.get('estado');
        const filas = estado ? sql.adminPorEstado.all(estado) : sql.adminTodas.all();
        return {
            modistas: filas.map(m => ({
                ...perfilPublico(m), estado: m.estado, creadaEn: m.creada_en, aceptoTerminosEn: m.acepto_terminos_en,
                prendas: sql.prendasDe.all(m.id).length
            }))
        };
    }

    // Los archivos de la página se leen una vez al arrancar. Una petición solo
    // elige entre ellos por nombre: nunca arma una ruta en el disco.
    const estaticos = new Map(readdirSync(carpetaPublica, { withFileTypes: true })
        .filter(f => f.isFile() && TIPOS[extname(f.name)])
        .map(f => [f.name, { datos: readFileSync(join(carpetaPublica, f.name)), tipo: TIPOS[extname(f.name)] }]));

    function archivoPublico(ruta) {
        return estaticos.get(ruta === '/' ? 'index.html' : ruta.slice(1)) || null;
    }

    // ---------- respuesta ----------

    function enviar(res, estado, cuerpo, encabezados = {}) {
        const comunes = {
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Frame-Options': 'DENY'
        };
        if (cuerpo === null || cuerpo === undefined) {
            res.writeHead(estado, { ...comunes, ...encabezados });
            return res.end();
        }
        if (Buffer.isBuffer(cuerpo)) {
            res.writeHead(estado, { ...comunes, 'Content-Length': cuerpo.length, ...encabezados });
            return res.end(cuerpo);
        }
        const json = JSON.stringify(cuerpo);
        res.writeHead(estado, {
            ...comunes,
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            ...encabezados
        });
        res.end(json);
    }

    // La app (APK y versión web) llama a la API desde otro origen. Se autentica
    // con un encabezado Authorization, no con cookies, así que un "*" no le da
    // a otra página nada que no tenga ya.
    const CORS = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600'
    };

    async function rutear(req, url) {
        const { pathname: ruta } = url;
        const metodo = req.method;
        let m;

        if (ruta === '/healthz') return [200, Buffer.from('ok\n'), { 'Content-Type': 'text/plain' }];

        if (ruta.startsWith('/api/')) {
            if (metodo === 'OPTIONS') return [204, null];

            if (ruta === '/api/prendas' && metodo === 'GET') return [200, listarPrendas(url)];
            if (ruta === '/api/modistas' && metodo === 'GET') return [200, listarModistas(url)];
            if (ruta === '/api/modistas' && metodo === 'POST') return registrar(req);

            if (ruta === '/api/mi-vitrina') {
                m = modistaAutenticada(req);
                if (metodo === 'GET') return [200, miVitrina(m)];
                if (metodo === 'PUT') return [200, await actualizarPerfil(req, m)];
                if (metodo === 'DELETE') return borrarVitrina(m);
            }
            if (ruta === '/api/mi-vitrina/prendas' && metodo === 'POST') {
                return publicar(req, modistaAutenticada(req));
            }
            let partes = ruta.match(/^\/api\/mi-vitrina\/prendas\/(\d+)$/);
            if (partes) {
                m = modistaAutenticada(req);
                if (metodo === 'PATCH') return [200, await editarPrenda(req, m, Number(partes[1]))];
                if (metodo === 'DELETE') return borrarPrendaDe(m, Number(partes[1]));
            }

            if (ruta === '/api/admin/modistas' && metodo === 'GET') {
                exigirAdmin(req);
                return [200, listarAdmin(url)];
            }
            partes = ruta.match(/^\/api\/admin\/modistas\/(\d+)\/(estado|token)$/);
            if (partes && metodo === 'POST') {
                exigirAdmin(req);
                const id = Number(partes[1]);
                return [200, partes[2] === 'estado' ? await cambiarEstado(req, id) : nuevoToken(id)];
            }
            throw new ErrorHttp(404, 'No encontrado.');
        }

        if (metodo !== 'GET' && metodo !== 'HEAD') throw new ErrorHttp(405, 'Método no permitido.');

        const foto = ruta.match(/^\/fotos\/([a-f0-9]{32}\.jpg)$/);
        if (foto) {
            // El nombre del archivo sale de la base, no de la dirección pedida
            const guardada = sql.fotoGuardada.get(foto[1]);
            if (!guardada) throw new ErrorHttp(404, 'No encontrado.');
            let datos;
            try {
                datos = readFileSync(join(carpetaFotos, guardada.foto));
            } catch {
                throw new ErrorHttp(404, 'No encontrado.');
            }
            return [200, datos, {
                'Content-Type': 'image/jpeg',
                // El nombre es aleatorio y nunca se reutiliza: se puede guardar en caché
                'Cache-Control': 'public, max-age=31536000, immutable'
            }];
        }

        const estatico = archivoPublico(ruta);
        if (estatico) {
            return [200, estatico.datos, {
                'Content-Type': estatico.tipo,
                'Content-Security-Policy': CSP,
                'Cache-Control': 'no-cache'
            }];
        }
        throw new ErrorHttp(404, 'No encontrado.');
    }

    async function manejar(req, res) {
        const url = new URL(req.url, 'http://vitrina.local');
        const esApi = url.pathname.startsWith('/api/');
        const extra = esApi ? CORS : {};
        try {
            const [estado, cuerpo, encabezados = {}] = await rutear(req, url);
            enviar(res, estado, cuerpo, { ...extra, ...encabezados });
        } catch (e) {
            if (e instanceof ErrorHttp) return enviar(res, e.estado, { error: e.message }, extra);
            if (e instanceof ErrorDeDatos) {
                return enviar(res, 400, { error: e.message }, extra);
            }
            console.error('Error en la vitrina', e);
            enviar(res, 500, { error: 'Algo falló en el servidor. Intenta de nuevo.' }, extra);
        }
    }

    return { manejar, cerrar: () => db.close(), db };
}
