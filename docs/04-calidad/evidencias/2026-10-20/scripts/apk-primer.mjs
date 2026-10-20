// Primer arranque: datos de la app borrados (pm clear), como recién instalada.
// Mide hasta que el formulario de ingreso es usable (incluye crear la base y las migraciones).
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const [proyecto, adb] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const sh = (...a) => execFileSync(adb, a, { encoding: 'utf8' }).trim();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
sh('shell', 'pm', 'clear', 'com.costura.app');
await espera(1500);
const t0 = Date.now();
const primerCuadro = Number(/TotalTime: (\d+)/.exec(sh('shell', 'am', 'start', '-W', '-n', 'com.costura.app/.MainActivity'))?.[1]);
let pid = '';
while (!pid) { try { pid = sh('shell', 'pidof', 'com.costura.app'); } catch { await espera(100); } }
let page, b;
while (!page && Date.now() - t0 < 180000) {
  try { sh('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${pid}`); b = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 3000 }); page = b.contexts()[0]?.pages()[0]; if (!page) await b.close(); }
  catch { await espera(250); }
}
await page.locator('#username').waitFor({ state: 'visible', timeout: 180000 });
console.log(JSON.stringify({ primerArranque: { primerCuadroMs: primerCuadro, ingresoUsableMs: Date.now() - t0 }, idioma: await page.evaluate(() => navigator.language) }));
await b.close();
