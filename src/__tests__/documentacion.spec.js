// @vitest-environment node
/**
 * La documentación de diseño tiene que decir lo mismo que el código.
 *
 * Cada prueba compara un documento de docs/ con la fuente real: el esquema que
 * crean las migraciones, las rutas del router, los archivos de cada capa, las
 * funciones que existen y los enlaces entre documentos. Si alguien cambia el
 * código sin actualizar los diagramas (o al revés), la CI falla aquí.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepararMotor, nuevaBase, crearConexionFalsa } from './helpers/sqliteReal.js';
import { migrations } from '../database/migrations.js';
import { runMigrations } from '../database/migrationRunner.js';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');
const DISENO = 'docs/02-diseno';

function archivos(carpeta, filtro = () => true) {
    const salida = [];
    for (const nombre of readdirSync(join(RAIZ, carpeta))) {
        const ruta = join(carpeta, nombre).split(sep).join('/');
        if (statSync(join(RAIZ, ruta)).isDirectory()) salida.push(...archivos(ruta, filtro));
        else if (filtro(ruta)) salida.push(ruta);
    }
    return salida;
}

const sinPruebas = (ruta) => !ruta.includes('__tests__');
const nombreBase = (ruta) => ruta.split('/').pop().replace(/\.(js|vue)$/, '');

function bloquesMermaid(texto) {
    return [...texto.matchAll(/```mermaid\n([\s\S]*?)```/g)].map(m => m[1]);
}

describe('Modelo de datos', () => {
    let esquemaReal;

    beforeAll(async () => {
        await prepararMotor();
        const base = nuevaBase();
        await runMigrations(crearConexionFalsa().db, migrations);
        const tablas = base.exec("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")[0].values.map(f => f[0]);
        esquemaReal = Object.fromEntries(tablas.map(tabla => [
            tabla,
            base.exec(`PRAGMA table_info(${tabla})`)[0].values.map(columna => columna[1]).sort()
        ]));
    });

    it('el diagrama entidad-relación tiene exactamente las tablas y columnas reales', () => {
        const er = bloquesMermaid(leer(`${DISENO}/MODELO_DE_DATOS.md`)).find(b => b.includes('erDiagram'));
        const documentado = {};
        for (const [, tabla, cuerpo] of er.matchAll(/^\s+(\w+) \{\n([\s\S]*?)\n\s+\}/gm)) {
            documentado[tabla] = [...cuerpo.matchAll(/^\s+[A-Z]+\s+(\w+)/gm)].map(m => m[1]).sort();
        }
        expect(documentado).toEqual(esquemaReal);
    });

    it('los documentos dicen la versión real del esquema', () => {
        const ultima = Math.max(...migrations.map(m => m.toVersion));
        expect(leer(`${DISENO}/MODELO_DE_DATOS.md`)).toContain(`Versión del esquema documentada:** ${ultima}`);
        expect(leer(`${DISENO}/ARQUITECTURA.md`)).toContain(`esquema de base de datos versión ${ultima}`);
        expect(leer('docs/03-manuales/MANUAL_TECNICO.md')).toContain(`**Versión del esquema** | ${ultima} |`);
        // Una fila por migración en la tabla de migraciones
        const filas = [...leer(`${DISENO}/MODELO_DE_DATOS.md`).matchAll(/^\| (\d+) \| /gm)].map(m => Number(m[1]));
        expect(filas).toEqual(migrations.map(m => m.toVersion));
    });
});

describe('Arquitectura', () => {
    const arquitectura = leer(`${DISENO}/ARQUITECTURA.md`);

    it('nombra cada composable, servicio y consulta que existe', () => {
        const faltan = [
            ...archivos('src/composables', r => r.endsWith('.js') && sinPruebas(r)).map(r => `\`${nombreBase(r)}\``),
            ...archivos('src/services', r => r.endsWith('.js') && sinPruebas(r)).map(r => `\`${nombreBase(r)}\``),
            ...archivos('src/database/queries', r => r.endsWith('.js') && sinPruebas(r)).map(r => `\`queries/${nombreBase(r)}\``),
            ...['connection', 'migrationRunner', 'migrations'].map(n => `\`${n}\``)
        ].filter(nombre => !arquitectura.includes(nombre));
        expect(faltan).toEqual([]);

        const cuenta = (carpeta) => archivos(carpeta, r => r.endsWith('.js') && sinPruebas(r)).length;
        expect(arquitectura).toContain(`${cuenta('src/composables')} composables`);
        expect(arquitectura).toContain(`${cuenta('src/services')} módulos`);
        expect(arquitectura).toContain(`${cuenta('src/database/queries')} consultas`);
    });

    it('lista exactamente las vistas y componentes que leen la base sin pasar por un composable', () => {
        const reales = archivos('src', r => r.endsWith('.vue') && sinPruebas(r))
            .filter(r => /from '(\.\.\/)+database\//.test(leer(r)))
            .sort();
        const seccion = arquitectura.split('### Excepciones conocidas')[1].split('\n## ')[0];
        const documentadas = [...seccion.matchAll(/^\| `(src\/[^`]+)` \|/gm)].map(m => m[1]).sort();
        expect(documentadas).toEqual(reales);
    });
});

describe('Navegación', () => {
    it('el diagrama tiene todas las rutas del router y dice cuántas son', () => {
        // Solo las definiciones de ruta (sangradas), no los next({ path }) de la guardia
        const rutas = [...leer('src/router/index.js').matchAll(/^\s+path: '([^']+)'/gm)]
            .map(m => m[1])
            .filter(ruta => !ruta.includes('pathMatch'));
        const comportamiento = leer(`${DISENO}/COMPORTAMIENTO.md`);
        expect(rutas.filter(ruta => !comportamiento.includes(`"${ruta}`))).toEqual([]);
        expect(comportamiento).toContain(`Las ${rutas.length} rutas`);
        expect(leer(`${DISENO}/ARQUITECTURA.md`)).toContain(`${rutas.length} rutas`);
        expect(archivos('src/views', r => r.endsWith('.vue') && sinPruebas(r))).toHaveLength(rutas.length);
    });
});

describe('Diagrama de clases', () => {
    it('cada método dibujado es una función que existe en el código', () => {
        const exportadas = new Set(
            archivos('src', r => r.endsWith('.js') && sinPruebas(r))
                .flatMap(r => [...leer(r).matchAll(/export (?:async )?function (\w+)/g)].map(m => m[1]))
        );
        const clases = bloquesMermaid(leer(`${DISENO}/CLASES.md`)).find(b => b.includes('classDiagram'));
        const metodos = [...clases.matchAll(/^\s+\+(\w+)\(\)/gm)].map(m => m[1]);
        expect(metodos.length).toBeGreaterThan(20);
        expect(metodos.filter(m => !exportadas.has(m))).toEqual([]);
    });
});

describe('Forma de los documentos', () => {
    const vigentes = [
        'README.md',
        ...archivos('docs', r => r.endsWith('.md') && !r.includes('/historico/') && !r.startsWith('docs/99-archivo/'))
    ];

    it('ningún enlace entre documentos está roto', () => {
        const rotos = [];
        for (const doc of vigentes) {
            const texto = leer(doc).replace(/```[\s\S]*?```/g, '');
            for (const [, destino] of texto.matchAll(/\]\(([^)\s]+)\)/g)) {
                if (/^(https?:|mailto:|#)/.test(destino)) continue;
                const ruta = join(RAIZ, dirname(doc), decodeURIComponent(destino.split('#')[0]));
                if (!existsSync(ruta)) rotos.push(`${doc} → ${destino}`);
            }
        }
        expect(rotos).toEqual([]);
    });

    it('los diagramas no llevan emojis ni colores', () => {
        const conAdornos = archivos(DISENO, r => r.endsWith('.md'))
            .flatMap(doc => bloquesMermaid(leer(doc)).map(bloque => ({ doc, bloque })))
            .filter(({ bloque }) => /\p{Extended_Pictographic}/u.test(bloque) || /\b(style|classDef|fill:)/.test(bloque))
            .map(({ doc }) => relative(RAIZ, join(RAIZ, doc)));
        expect(conAdornos).toEqual([]);
    });
});
