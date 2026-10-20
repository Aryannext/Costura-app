// Producción, sin iniciar sesión: carga, errores, violaciones de la CSP y vista a 360 px.
import { createRequire } from 'node:module';
import path from 'node:path';
const [proyecto, salida] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
// El DNS local fallaba a ratos: se fija la IP pública del servidor
const browser = await chromium.launch({ channel: 'msedge', args: ['--host-resolver-rules=MAP proyectosena.online 31.97.129.144'] });
const resultados = [];
for (const [nombre, viewport] of [['360px', { width: 360, height: 760 }], ['escritorio', { width: 1366, height: 800 }]]) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript(() => { window.__v = []; document.addEventListener('securitypolicyviolation', (e) => window.__v.push(e.violatedDirective + ' ' + e.blockedURI)); });
  const page = await ctx.newPage();
  const errores = [], fallidos = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 160)); });
  page.on('response', (r) => { if (r.status() >= 400) fallidos.push(r.status() + ' ' + r.url()); });
  const t0 = Date.now();
  await page.goto('https://proyectosena.online/costura-app/ordenes/3', { waitUntil: 'load', timeout: 90000 });
  await page.locator('#username').waitFor({ timeout: 90000 });
  const ingresoMs = Date.now() - t0;
  const info = await page.evaluate(() => ({ url: location.pathname, desbordeHorizontal: document.documentElement.scrollWidth > innerWidth, titulo: document.title, vue: !!document.querySelector('#app').__vue_app__, pwa: !!customElements.get('pwa-camera-modal') }));
  await page.screenshot({ path: path.join(salida, `produccion-${nombre}.png`) });
  resultados.push({ nombre, ingresoMs, ...info, violaciones: await page.evaluate(() => window.__v), errores, fallidos });
  await ctx.close();
}
console.log(JSON.stringify(resultados, null, 2));
await browser.close();
