// Recorre la app compilada con las cabeceras de docker/seguridad.inc aplicadas,
// y junta cualquier violación de la CSP, error de página o pedido fallido.
// Uso: node csp.mjs <ruta-del-proyecto> <url-base> <carpeta-capturas>
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const [proyecto, base, salida] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const { iniciarSesion } = await import(new URL('file:///' + path.join(proyecto, 'tests/e2e/helpers.js').replace(/\\/g, '/')).href);

// Las mismas cabeceras que el contenedor, leídas del archivo real
const inc = readFileSync(path.join(proyecto, 'docker/seguridad.inc'), 'utf8');
const cabeceras = Object.fromEntries([...inc.matchAll(/add_header\s+([\w-]+)\s+"([^"]+)"\s+always;/g)].map(m => [m[1], m[2]]));

const browser = await chromium.launch({ channel: 'msedge' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
await context.route(`${base}/**`, async (route) => {
  const respuesta = await route.fetch();
  await route.fulfill({ response: respuesta, headers: { ...respuesta.headers(), ...cabeceras } });
});
await context.addInitScript(() => {
  window.__violaciones = [];
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__violaciones.push(`${e.violatedDirective} ← ${e.blockedURI || '(en línea)'} @ ${e.sourceFile || ''}:${e.lineNumber || ''}`);
  });
  window.open = () => null;
});

const page = await context.newPage();
const errores = [], fallidos = [], consola = [];
page.on('pageerror', (e) => errores.push(e.message));
page.on('requestfailed', (r) => fallidos.push(`${r.url()} · ${r.failure()?.errorText}`));
page.on('console', (m) => { if (m.type() === 'error' || /Content Security Policy|Permissions-Policy/i.test(m.text())) consola.push(m.text().slice(0, 200)); });
const violaciones = async () => page.evaluate(() => window.__violaciones.slice());
const pasos = [];
let miniatura = null;
const paso = async (nombre, fn) => { await fn(); pasos.push(`${nombre}: ${(await violaciones()).length} violaciones`); };

await paso('arranque y SQLite (wasm)', async () => {
  await page.goto(`${base}/`);
  await iniciarSesion(page); // incluye el cambio obligatorio de la clave de fábrica
});

await paso('orden con prenda', async () => {
  await page.locator('.nav-item', { hasText: 'Órdenes' }).click();
  await page.getByText('+ Nueva', { exact: true }).click();
  await page.getByText('+ Nuevo Cliente', { exact: true }).click();
  await page.fill('input[placeholder="Nombre del cliente"]', 'CSP Prueba');
  await page.check('#autoriza_datos');
  await page.fill('input[type="tel"]', '3009990000');
  await page.getByText('Mañana', { exact: true }).click();
  await page.getByRole('button', { name: 'Crear Orden' }).click();
  await page.locator('.orden-header h2').waitFor({ timeout: 10000 });
  await page.locator('.tabs button', { hasText: 'Prendas' }).click();
  await page.getByRole('button', { name: '+ Prenda' }).click();
  await page.selectOption('#tipo_prenda', { label: 'Pantalón' });
  await page.fill('#descripcion', 'Basta');
  await page.locator('.modal-content #valor').fill('12000');
  await page.locator('.modal-content button[type="submit"]').click();
  await page.locator('.prenda-card').waitFor();
});

await paso('foto desde archivo (img data:/blob:)', async () => {
  await page.locator('.prenda-card .accion', { hasText: 'Fotos' }).click();
  const selector = page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null);
  await page.locator('.foto-nueva').click();
  // Con PWA Elements la web pregunta primero cámara o galería (DEF-13)
  await page.locator('pwa-action-sheet').getByText('From Photos').click({ timeout: 5000 }).catch(() => {});
  const fc = await selector;
  if (fc) {
    // JPEG mínimo válido de 1x1
    const fotoArchivo = process.env.FOTO_PRUEBA;
    const jpeg = fotoArchivo && existsSync(fotoArchivo) ? readFileSync(fotoArchivo) : Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
    await fc.setFiles({ name: 'prueba.jpg', mimeType: 'image/jpeg', buffer: jpeg });
    await page.waitForTimeout(1500);
  } else {
    pasos.push('  (no apareció el selector de archivos)');
  }
  await page.locator('.prenda-card').screenshot({ path: path.join(salida, 'csp-prenda.png') });
  miniatura = await page.evaluate(() => [...document.querySelectorAll('.foto-thumb img, img.foto-thumb, .foto-thumb')].map((e) => { const i = e.tagName === 'IMG' ? e : e.querySelector('img'); return i ? { src: i.src.slice(0, 30), cargada: i.complete, ancho: i.naturalWidth, alto: i.naturalHeight } : { sinImg: e.outerHTML.slice(0, 120) }; }));
});

await paso('reportes (Chart.js)', async () => {
  await page.locator('.nav-item', { hasText: 'Reportes' }).click();
  await page.waitForTimeout(1500);
});

await paso('ayuda y tutorial (driver.js)', async () => {
  await page.goto(`${base}/ayuda`);
  await iniciarSesion(page);
  await page.locator('.mission-card').nth(1).click();
  await page.locator('.driver-popover').waitFor({ timeout: 10000 });
  await page.locator('.driver-popover-close-btn').click();
});

await paso('recarga con bloqueo', async () => {
  await page.reload();
  await iniciarSesion(page);
});

const fuentes = await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v, i, a) => a.indexOf(v) === i));
const fotos = await page.evaluate(() => document.querySelectorAll('.foto-thumb').length);
console.log(JSON.stringify({ cabecerasAplicadas: Object.keys(cabeceras), pasos, violaciones: await violaciones(), errores, consola, fallidos, fuentesCargadas: fuentes, fotosEnPantalla: fotos, miniatura }, null, 2));
await browser.close();
