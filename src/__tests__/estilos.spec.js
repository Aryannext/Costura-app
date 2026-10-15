/**
 * DEF-10: toda variable de CSS que se usa tiene que estar definida.
 *
 * Una var(--x) sin definir no deja que se aplique otra regla: la propiedad
 * vuelve a su valor inicial. Así el botón Cancelar de los formularios se quedaba
 * sin borde y los mensajes de error sin su color, sin que nada fallara.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = join(__dirname, '..', '..');

function archivos(carpeta) {
    return readdirSync(carpeta).flatMap((nombre) => {
        const ruta = join(carpeta, nombre);
        if (statSync(ruta).isDirectory()) return nombre === '__tests__' ? [] : archivos(ruta);
        return /\.(vue|css)$/.test(nombre) ? [ruta] : [];
    });
}

const fuentes = [...archivos(join(RAIZ, 'src')), join(RAIZ, 'index.html')]
    .map(ruta => ({ ruta: relative(RAIZ, ruta).split(sep).join('/'), texto: readFileSync(ruta, 'utf8') }));

describe('Variables de CSS (DEF-10)', () => {
    it('cada var(--x) sin valor de respaldo tiene su definición', () => {
        const definidas = new Set(fuentes.flatMap(({ texto }) =>
            [...texto.matchAll(/(--[\w-]+)\s*:/g)].map(m => m[1])));

        const sinDefinir = fuentes.flatMap(({ ruta, texto }) =>
            // var(--x, respaldo) no cuenta: si falta --x, se usa el respaldo
            [...texto.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)]
                .map(m => m[1])
                .filter(nombre => !definidas.has(nombre))
                .map(nombre => `${ruta}: ${nombre}`));

        expect([...new Set(sinDefinir)]).toEqual([]);
    });
});

describe('Sin !important (SonarCloud css:S9423)', () => {
    it('ninguna regla usa !important: la especificidad se resuelve con el selector', () => {
        const conImportant = fuentes.flatMap(({ ruta, texto }) =>
            texto.split(/\r?\n/)
                .map((linea, i) => ({ linea, n: i + 1 }))
                .filter(({ linea }) => /!\s*important/i.test(linea))
                .map(({ n }) => `${ruta}:${n}`));

        expect(conImportant).toEqual([]);
    });
});
