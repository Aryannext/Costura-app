// Arranque en frío del APK y persistencia de los datos tras cerrar la app.
// Cierra la app (am force-stop), la vuelve a abrir y mide hasta que la pantalla de
// ingreso es usable. En la última vuelta entra y comprueba que la clienta y la
// orden entregada siguen ahí.
// Uso: node apk-arranque.mjs <proyecto> <adb> <clienta> <carpeta-capturas> [vueltas]
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const [proyecto, adb, clienta, salida, vueltasArg] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const { expect } = require('@playwright/test');
const { iniciarSesion } = await import(new URL('file:///' + path.join(proyecto, 'tests/e2e/helpers.js').replace(/\\/g, '/')).href);
const sh = (...a) => execFileSync(adb, a, { encoding: 'utf8' }).trim();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const vueltas = [];
let browser, page;
for (let v = 0; v < Number(vueltasArg || 3); v++) {
  sh('shell', 'am', 'force-stop', 'com.costura.app');
  await espera(1500);
  const t0 = Date.now();
  const inicio = sh('shell', 'am', 'start', '-W', '-n', 'com.costura.app/.MainActivity');
  const primerCuadro = Number(/TotalTime: (\d+)/.exec(inicio)?.[1]);
  // El socket de depuración del WebView aparece con el proceso nuevo
  let pid = '';
  while (!pid) { try { pid = sh('shell', 'pidof', 'com.costura.app'); } catch { await espera(100); } }
  try { sh('forward', '--remove', 'tcp:9222'); } catch {}
  let conectado = false;
  while (!conectado && Date.now() - t0 < 120000) {
    try {
      sh('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${pid}`);
      browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 3000 });
      page = browser.contexts()[0]?.pages()[0];
      conectado = !!page;
      if (!conectado) await browser.close();
    } catch { await espera(250); }
  }
  // Usable: el formulario de ingreso, el bloqueo o el cambio de clave a la vista
  await page.locator('#username, .lock-overlay, #nueva').first().waitFor({ state: 'visible', timeout: 120000 });
  const usable = Date.now() - t0;
  const pantalla = await page.evaluate(() => document.querySelector('#username') ? 'ingreso' : document.querySelector('.lock-overlay') ? 'bloqueo' : 'otra');
  vueltas.push({ vuelta: v + 1, primerCuadroMs: primerCuadro, pantallaUsableMs: usable, pantalla });
  if (v < Number(vueltasArg || 3) - 1) await browser.close();
}

const persistencia = {};
await iniciarSesion(page);
await page.locator('.nav-item', { hasText: 'Clientes' }).click();
await expect(page.locator('.clientes-list')).toContainText(clienta, { timeout: 15000 });
persistencia.clienta = 'sigue en la lista';
console.log(JSON.stringify({ vueltas }));
await page.locator('.nav-item', { hasText: 'Órdenes' }).click();
// Entregada con deuda: va a Historial y también a Por cobrar (RN-30)
await page.locator('.tab-btn', { hasText: 'Por cobrar' }).click();
persistencia.porCobrar = (await page.locator('.total-por-cobrar').innerText()).trim();
const tarjeta = page.locator('.orden-card, .ordenes-list > *').filter({ hasText: clienta }).first();
await tarjeta.click();
await expect(page.locator('.orden-detail-view .orden-header')).toContainText('Entregada', { timeout: 15000 });
persistencia.orden = (await page.locator('.orden-detail-view .orden-header').innerText()).replace(/\s+/g, ' ').slice(0, 120);
await page.screenshot({ path: path.join(salida, 'apk-06-tras-reinicio.png') });

console.log(JSON.stringify({ vueltas, persistencia }, null, 2));
await browser.close();
