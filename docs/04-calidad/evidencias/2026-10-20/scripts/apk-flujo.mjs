// Recorrido de punta a punta dentro del APK instalado en el emulador.
// Se conecta al WebView de la app (depuración de WebView del build debug) por CDP,
// con los mismos pasos de tests/e2e/flujo-orden.spec.js, y mide los tiempos que
// piden RNF-01 a RNF-03 con el SQLite nativo del plugin.
// Uso: node apk-flujo.mjs <proyecto> <carpeta-capturas>
import { createRequire } from 'node:module';
import path from 'node:path';

const [proyecto, salida] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const { expect } = require('@playwright/test');
const { iniciarSesion } = await import(new URL('file:///' + path.join(proyecto, 'tests/e2e/helpers.js').replace(/\\/g, '/')).href);

const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = b.contexts()[0].pages()[0];
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errores.push('consola: ' + m.text().slice(0, 200)); });
const fallidos = [];
page.on('response', (r) => { if (r.status() >= 400) fallidos.push(`${r.status()} ${r.url()}`); });

const pasos = [];
const tiempos = {};
async function paso(nombre, fn) {
  const t0 = Date.now();
  try { await fn(); pasos.push({ paso: nombre, resultado: 'OK', ms: Date.now() - t0 }); }
  catch (e) {
    pasos.push({ paso: nombre, resultado: 'FALLA', detalle: e.message.split('\n').slice(0, 4).join(' | ') });
    await page.screenshot({ path: path.join(salida, `apk-falla-${pasos.length}.png`) }).catch(() => {});
  }
}
const medir = async (clave, accion, espera) => {
  const t0 = performance.now(); await accion(); await espera(); tiempos[clave] = Math.round(performance.now() - t0);
};
const captura = (n) => page.screenshot({ path: path.join(salida, n) });
const nombre = `Clienta APK ${Date.now()}`;

await paso('Ingreso con clave de fábrica y cambio obligatorio', async () => {
  await iniciarSesion(page);
  await captura('apk-01-inicio.png');
});

await paso('Teléfono inválido no deja crear la orden (A07)', async () => {
  await page.evaluate(() => { window.__abiertos = []; window.open = (u) => { window.__abiertos.push(u); return null; }; });
  await page.locator('.nav-item', { hasText: 'Órdenes' }).click();
  await page.getByText('+ Nueva', { exact: true }).click();
  await page.getByText('+ Nuevo Cliente', { exact: true }).click();
  await page.fill('input[placeholder="Nombre del cliente"]', nombre);
  await page.check('#autoriza_datos');
  await page.fill('input[type="tel"]', '12');
  await page.getByText('Mañana', { exact: true }).click();
  await page.getByRole('button', { name: 'Crear Orden' }).click();
  await expect(page.locator('.error-message')).toContainText('teléfono');
});

await paso('Crear la orden con clienta nueva (RNF-02)', async () => {
  await page.fill('input[type="tel"]', '3001234567');
  await medir('RNF-02 registrar orden', () => page.getByRole('button', { name: 'Crear Orden' }).click(),
    () => expect(page.locator('.orden-header h2')).toContainText('Orden #', { timeout: 10000 }));
});

await paso('Agregar una prenda', async () => {
  await page.locator('.tabs button', { hasText: 'Prendas' }).click();
  await page.getByRole('button', { name: '+ Prenda' }).click();
  await page.selectOption('#tipo_prenda', { label: 'Pantalón' });
  await page.fill('#descripcion', 'Dobladillo');
  await page.locator('.modal-content #valor').fill('20000');
  await page.locator('.modal-content button[type="submit"]').click();
  await expect(page.locator('.estado-btn')).toHaveCount(4);
  await captura('apk-02-prenda.png');
});

await paso('Terminar la prenda: orden Lista y aviso por WhatsApp con +57', async () => {
  await page.locator('.estado-btn', { hasText: 'Terminada' }).click();
  const modal = page.locator('.confirm-modal');
  await expect(modal).toContainText('Todas las prendas están terminadas');
  await modal.getByRole('button', { name: 'Sí, avisar por WhatsApp' }).click();
  await expect(page.locator('.orden-header')).toContainText('Lista');
  await expect.poll(() => page.evaluate(() => window.__abiertos.length)).toBe(1);
  const [enlace] = await page.evaluate(() => window.__abiertos);
  expect(enlace).toContain('https://wa.me/573001234567?text=');
});

await paso('Abono parcial con Bre-B (RNF-03)', async () => {
  await page.locator('.tabs button', { hasText: 'Pagos' }).click();
  await page.getByRole('button', { name: '+ Registrar Pago' }).click();
  await page.selectOption('#metodo', { label: 'Bre-B' });
  await page.locator('.modal-content #valor').fill('5000');
  await medir('RNF-03 registrar abono', () => page.locator('.modal-content button[type="submit"]').click(),
    () => expect(page.locator('.saldo-valor')).toContainText('15.000'));
  await captura('apk-03-pago.png');
});

await paso('Un abono mayor que el saldo no se puede registrar (CPV-06)', async () => {
  await page.getByRole('button', { name: '+ Registrar Pago' }).click();
  await page.locator('.modal-content #valor').fill('99000');
  await expect(page.locator('.modal-content button[type="submit"]')).toBeDisabled();
  await page.locator('.modal-content').getByRole('button', { name: /Cancelar|Cerrar/ }).first().click();
  await expect(page.locator('.modal-content')).toBeHidden();
  await expect(page.locator('.saldo-valor')).toContainText('15.000');
});

await paso('Entregar con deuda pide confirmación con el saldo (RN-30)', async () => {
  await page.locator('.tabs button', { hasText: 'Detalle' }).click();
  await page.getByRole('button', { name: 'Entregar orden' }).click();
  const modal = page.locator('.confirm-modal');
  await expect(modal).toContainText('15.000');
  await modal.locator('button').last().click();
  await expect(page.locator('.orden-header')).toContainText('Entregada');
  await captura('apk-04-entregada.png');
});

await paso('La clienta guarda la fecha de su autorización (Ley 1581)', async () => {
  await page.locator('.nav-item', { hasText: 'Clientes' }).click();
  await page.locator('.cliente-card, .clientes-list > *').filter({ hasText: nombre }).first().click();
  await expect(page.locator('.autorizo')).toContainText('Autorizó guardar sus datos');
});

await paso('Abrir la orden desde la lista (RNF-01)', async () => {
  await page.locator('.nav-item', { hasText: 'Órdenes' }).click();
  const tarjeta = page.locator('.orden-card, .ordenes-list > *').filter({ hasText: nombre }).first();
  await tarjeta.waitFor();
  await medir('RNF-01 abrir orden', () => tarjeta.click(),
    () => expect(page.locator('.orden-header h2')).toContainText('Orden #', { timeout: 10000 }));
});

console.log(JSON.stringify({ url: page.url(), pasos, tiempos, errores, fallidos, clienta: nombre }, null, 2));
await b.close();
