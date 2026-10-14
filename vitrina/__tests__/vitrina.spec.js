// @vitest-environment node
/**
 * Pruebas del servidor de la Vitrina de Modistas (D-15) con peticiones HTTP reales
 * contra una base SQLite temporal.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearVitrina } from '../src/app.js';
import { limpiarJpeg } from '../src/jpeg.js';

// JPEG de 8x10 con un bloque EXIF que simula coordenadas GPS y un comentario
const FOTO = '/9j/4QAjRXhpZgAAR1BTLVNFQ1JFVE8tNi4yNDQyLC03NS41ODEy//4ADGNvbWVudGFyaW//4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wAARCAAKAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCaiiiuI9Q//9k=';
const CLAVE_ADMIN = 'clave-admin-de-pruebas-123456';

let carpeta, vitrina, servidor, base;

beforeEach(async () => {
    carpeta = mkdtempSync(join(tmpdir(), 'vitrina-'));
    vitrina = crearVitrina({
        archivoBd: join(carpeta, 'v.sqlite'),
        carpetaFotos: join(carpeta, 'fotos'),
        carpetaPublica: join(__dirname, '..', 'public'),
        claveAdmin: CLAVE_ADMIN,
        registrosPorHora: 3
    });
    servidor = createServer(vitrina.manejar);
    await new Promise(r => servidor.listen(0, '127.0.0.1', r));
    base = `http://127.0.0.1:${servidor.address().port}`;
});

afterEach(async () => {
    await new Promise(r => servidor.close(r));
    vitrina.cerrar();
    rmSync(carpeta, { recursive: true, force: true });
});

async function api(ruta, { metodo = 'GET', cuerpo, token } = {}) {
    const headers = {};
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    const r = await fetch(base + ruta, { method: metodo, headers, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
    const texto = await r.text();
    let json = null;
    try { json = JSON.parse(texto); } catch { /* sin JSON */ }
    return { estado: r.status, json, r };
}

const TALLER = {
    nombre: 'Taller Doña Marta',
    ciudad: 'Bogotá',
    barrio: 'Kennedy',
    whatsapp: '300 123 4567',
    horario: 'Lun a sáb, 8 a. m. a 6 p. m.',
    servicios: [{ nombre: 'Dobladillo de pantalón', desde: '12.000' }],
    aceptaCondiciones: true
};

const PRENDA = { titulo: 'Vestido cruzado en lino', categoria: 'Vestidos', precio: 185000, talla: 'M', tela: 'Lino', medidas: 'Busto 92 cm · Largo 108 cm', foto: FOTO };

async function tallerAprobado(datos = TALLER) {
    const { json } = await api('/api/modistas', { metodo: 'POST', cuerpo: datos });
    await api(`/api/admin/modistas/${json.perfil.id}/estado`, { metodo: 'POST', cuerpo: { estado: 'aprobada' }, token: CLAVE_ADMIN });
    return json;
}

describe('Registro de un taller', () => {
    it('crea el taller pendiente, devuelve el código una sola vez y normaliza el WhatsApp y los precios', async () => {
        const { estado, json } = await api('/api/modistas', { metodo: 'POST', cuerpo: TALLER });
        expect(estado).toBe(201);
        expect(json.token).toMatch(/^[\w-]{32}$/);
        expect(json.perfil).toMatchObject({ estado: 'pendiente', whatsapp: '573001234567', servicios: [{ nombre: 'Dobladillo de pantalón', desde: 12000 }] });

        const mia = await api('/api/mi-vitrina', { token: json.token });
        expect(mia.json.perfil.nombre).toBe('Taller Doña Marta');
        expect(mia.json).not.toHaveProperty('token');
    });

    it('exige aceptar que los datos del taller se publiquen', async () => {
        const { estado, json } = await api('/api/modistas', { metodo: 'POST', cuerpo: { ...TALLER, aceptaCondiciones: false } });
        expect(estado).toBe(400);
        expect(json.error).toMatch(/aceptar/);
    });

    it('rechaza un WhatsApp que no es un celular colombiano', async () => {
        const { estado, json } = await api('/api/modistas', { metodo: 'POST', cuerpo: { ...TALLER, whatsapp: '601 555 1234' } });
        expect(estado).toBe(400);
        expect(json.error).toMatch(/WhatsApp/);
    });

    it('limita los registros por conexión', async () => {
        for (let i = 0; i < 3; i++) await api('/api/modistas', { metodo: 'POST', cuerpo: TALLER });
        const { estado } = await api('/api/modistas', { metodo: 'POST', cuerpo: TALLER });
        expect(estado).toBe(429);
    });

    it('un código inventado no abre ninguna vitrina', async () => {
        const { estado } = await api('/api/mi-vitrina', { token: 'no-es-un-codigo' });
        expect(estado).toBe(401);
    });
});

describe('Lo que ven los clientes', () => {
    it('un taller pendiente no aparece, ni sus prendas, hasta que se aprueba', async () => {
        const { json: t } = await api('/api/modistas', { metodo: 'POST', cuerpo: TALLER });
        await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: t.token });
        expect((await api('/api/modistas')).json.modistas).toEqual([]);
        expect((await api('/api/prendas')).json.prendas).toEqual([]);

        await api(`/api/admin/modistas/${t.perfil.id}/estado`, { metodo: 'POST', cuerpo: { estado: 'aprobada' }, token: CLAVE_ADMIN });
        const { json } = await api('/api/prendas');
        expect(json.prendas).toHaveLength(1);
        expect(json.prendas[0]).toMatchObject({ titulo: 'Vestido cruzado en lino', precio: 185000, modistaId: t.perfil.id });
        const modistas = (await api('/api/modistas')).json;
        expect(modistas.modistas[0]).toMatchObject({ nombre: 'Taller Doña Marta', prendas: 1 });
        expect(modistas.ciudades).toEqual(['Bogotá']);
    });

    it('filtra por ciudad, categoría y búsqueda, con % tomado como texto', async () => {
        const a = await tallerAprobado();
        const b = await tallerAprobado({ ...TALLER, nombre: 'Costuras Lucía', ciudad: 'Medellín', barrio: 'Laureles' });
        await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: a.token });
        await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: { ...PRENDA, titulo: 'Falda midi de vuelo', categoria: 'Faldas' }, token: b.token });

        expect((await api('/api/prendas?ciudad=medellín')).json.prendas.map(p => p.titulo)).toEqual(['Falda midi de vuelo']);
        expect((await api('/api/prendas?categoria=Vestidos')).json.prendas.map(p => p.titulo)).toEqual(['Vestido cruzado en lino']);
        expect((await api('/api/prendas?q=lucía')).json.prendas.map(p => p.titulo)).toEqual(['Falda midi de vuelo']);
        expect((await api('/api/prendas?q=%25')).json.prendas).toEqual([]);
        expect((await api('/api/modistas?q=dobladillo')).json.modistas).toHaveLength(2);
    });

    it('una prenda vendida sale de la vitrina pero la modista la sigue viendo', async () => {
        const t = await tallerAprobado();
        const { json: p } = await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: t.token });
        const { json } = await api(`/api/mi-vitrina/prendas/${p.id}`, { metodo: 'PATCH', cuerpo: { vendida: true }, token: t.token });
        expect(json.vendida).toBe(true);
        expect((await api('/api/prendas')).json.prendas).toEqual([]);
        expect((await api('/api/mi-vitrina', { token: t.token })).json.prendas).toHaveLength(1);
    });

    it('un taller suspendido desaparece y no puede publicar', async () => {
        const t = await tallerAprobado();
        await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: t.token });
        await api(`/api/admin/modistas/${t.perfil.id}/estado`, { metodo: 'POST', cuerpo: { estado: 'suspendida' }, token: CLAVE_ADMIN });
        expect((await api('/api/prendas')).json.prendas).toEqual([]);
        expect((await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: t.token })).estado).toBe(403);
    });

    it('sirve la página pública con su política de contenido y responde a la app desde otro origen', async () => {
        const pagina = await api('/');
        expect(pagina.estado).toBe(200);
        expect(pagina.r.headers.get('content-security-policy')).toContain("script-src 'self'");
        expect((await api('/vitrina.js')).r.headers.get('content-type')).toMatch(/javascript/);
        expect((await api('/../server.js')).estado).toBe(404);

        const pre = await fetch(base + '/api/mi-vitrina', { method: 'OPTIONS' });
        expect(pre.status).toBe(204);
        expect(pre.headers.get('access-control-allow-headers')).toContain('Authorization');
    });
});

describe('Fotos', () => {
    it('quita la ubicación y los comentarios de la foto antes de guardarla', async () => {
        const t = await tallerAprobado();
        const { estado, json: p } = await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: t.token });
        expect(estado).toBe(201);
        expect(p.foto).toMatch(/^fotos\/[a-f0-9]{32}\.jpg$/);

        const r = await fetch(`${base}/${p.foto}`);
        expect(r.headers.get('content-type')).toBe('image/jpeg');
        const guardada = Buffer.from(await r.arrayBuffer());
        expect(guardada.includes('GPS-SECRETO')).toBe(false);
        expect(guardada.includes('comentario')).toBe(false);
        expect(guardada.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
        expect(limpiarJpeg(guardada)).toMatchObject({ ancho: 8, alto: 10 });
    });

    it('rechaza lo que no es JPEG', async () => {
        const t = await tallerAprobado();
        const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');
        const { estado, json } = await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: { ...PRENDA, foto: png }, token: t.token });
        expect(estado).toBe(400);
        expect(json.error).toMatch(/JPEG/);
        expect(readdirSync(join(carpeta, 'fotos'))).toEqual([]);
    });

    it('borrar una prenda borra su foto', async () => {
        const t = await tallerAprobado();
        const { json: p } = await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: t.token });
        expect(readdirSync(join(carpeta, 'fotos'))).toHaveLength(1);
        expect((await api(`/api/mi-vitrina/prendas/${p.id}`, { metodo: 'DELETE', token: t.token })).estado).toBe(204);
        expect(readdirSync(join(carpeta, 'fotos'))).toEqual([]);
    });
});

describe('Cada modista solo toca lo suyo', () => {
    it('no puede editar ni borrar la prenda de otro taller', async () => {
        const a = await tallerAprobado();
        const b = await tallerAprobado({ ...TALLER, nombre: 'Costuras Lucía' });
        const { json: p } = await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: a.token });
        expect((await api(`/api/mi-vitrina/prendas/${p.id}`, { metodo: 'PATCH', cuerpo: { precio: 1000 }, token: b.token })).estado).toBe(404);
        expect((await api(`/api/mi-vitrina/prendas/${p.id}`, { metodo: 'DELETE', token: b.token })).estado).toBe(404);
        expect((await api('/api/prendas')).json.prendas[0].precio).toBe(185000);
    });

    it('borrar la vitrina se lleva el perfil, las prendas y las fotos', async () => {
        const t = await tallerAprobado();
        await api('/api/mi-vitrina/prendas', { metodo: 'POST', cuerpo: PRENDA, token: t.token });
        expect((await api('/api/mi-vitrina', { metodo: 'DELETE', token: t.token })).estado).toBe(204);
        expect((await api('/api/mi-vitrina', { token: t.token })).estado).toBe(401);
        expect((await api('/api/modistas')).json.modistas).toEqual([]);
        expect(readdirSync(join(carpeta, 'fotos'))).toEqual([]);
    });

    it('edita el perfil sin tocar lo que no se envía', async () => {
        const t = await tallerAprobado();
        const { json } = await api('/api/mi-vitrina', { metodo: 'PUT', cuerpo: { horario: 'Solo sábados' }, token: t.token });
        expect(json.perfil).toMatchObject({ horario: 'Solo sábados', nombre: 'Taller Doña Marta', barrio: 'Kennedy' });
    });
});

describe('Administración', () => {
    it('sin la clave no se puede aprobar ni listar', async () => {
        const { json: t } = await api('/api/modistas', { metodo: 'POST', cuerpo: TALLER });
        expect((await api('/api/admin/modistas')).estado).toBe(401);
        expect((await api(`/api/admin/modistas/${t.perfil.id}/estado`, { metodo: 'POST', cuerpo: { estado: 'aprobada' }, token: t.token })).estado).toBe(401);
    });

    it('un código nuevo reemplaza al anterior (teléfono perdido)', async () => {
        const t = await tallerAprobado();
        const { json } = await api(`/api/admin/modistas/${t.perfil.id}/token`, { metodo: 'POST', token: CLAVE_ADMIN });
        expect((await api('/api/mi-vitrina', { token: t.token })).estado).toBe(401);
        expect((await api('/api/mi-vitrina', { token: json.token })).estado).toBe(200);
    });

    it('sin clave configurada la administración no existe', async () => {
        const otra = crearVitrina({ archivoBd: join(carpeta, 'o.sqlite'), carpetaFotos: join(carpeta, 'f2'), carpetaPublica: carpeta });
        const s = createServer(otra.manejar);
        await new Promise(r => s.listen(0, '127.0.0.1', r));
        const r = await fetch(`http://127.0.0.1:${s.address().port}/api/admin/modistas`, { headers: { Authorization: 'Bearer ' } });
        expect(r.status).toBe(404);
        await new Promise(r2 => s.close(r2));
        otra.cerrar();
    });
});
