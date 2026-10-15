/**
 * DEF-03: cabeceras de seguridad de la versión web (docker/).
 *
 * La CSP y la política de permisos las entrega el nginx del contenedor en cada
 * respuesta. El APK no pasa por nginx: estas cabeceras no lo afectan.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(__dirname, '..', '..');
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');

const seguridad = leer('docker/seguridad.inc');
const cabecera = (nombre) => {
    const m = seguridad.match(new RegExp(`add_header\\s+${nombre}\\s+"([^"]+)"\\s+always;`, 'i'));
    return m ? m[1] : null;
};
const directivas = (csp) => Object.fromEntries(
    csp.split(';').map(d => d.trim()).filter(Boolean).map(d => {
        const [nombre, ...valores] = d.split(/\s+/);
        return [nombre, valores];
    }));

describe('Cabeceras de seguridad del contenedor (DEF-03)', () => {
    it('envía una CSP que solo deja ejecutar scripts propios', () => {
        const csp = cabecera('Content-Security-Policy');
        expect(csp).not.toBeNull();
        const d = directivas(csp);

        expect(d['default-src']).toEqual(["'self'"]);
        // WebAssembly (sql.js) necesita wasm-unsafe-eval; nada de unsafe-inline ni unsafe-eval
        expect(d['script-src']).toEqual(["'self'", "'wasm-unsafe-eval'"]);
        expect(d['object-src']).toEqual(["'none'"]);
        expect(d['base-uri']).toEqual(["'self'"]);
        expect(d['frame-ancestors']).toEqual(["'none'"]);
        // Telegram es el único servicio externo al que la app le habla
        expect(d['connect-src']).toContain('https://api.telegram.org');
    });

    it('envía una política de permisos que solo deja la cámara', () => {
        const permisos = cabecera('Permissions-Policy');
        expect(permisos).not.toBeNull();
        expect(permisos).toContain('camera=(self)');
        expect(permisos).toContain('microphone=()');
        expect(permisos).toContain('geolocation=()');
    });

    it('el nginx del contenedor no dice su versión', () => {
        expect(leer('docker/nginx.conf')).toMatch(/^\s*server_tokens\s+off;/m);
    });

    it('index.html no tiene scripts en línea, que la CSP bloquearía', () => {
        const scripts = [...leer('index.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
        const enLinea = scripts.filter(([, atributos, cuerpo]) => !/\bsrc=/.test(atributos) && cuerpo.trim());
        expect(enLinea.map(([etiqueta]) => etiqueta.slice(0, 60))).toEqual([]);
    });
});
