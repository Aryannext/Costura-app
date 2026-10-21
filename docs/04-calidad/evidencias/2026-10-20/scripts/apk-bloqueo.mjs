// RNF-09: al volver de segundo plano, bloquear solo si pasaron 2 minutos o más.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const [proyecto, adb, salida] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const sh = (...a) => execFileSync(adb, a, { encoding: 'utf8' }).trim();
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const resultado = [];
for (const segundos of [30, 135]) {
  sh('shell', 'input', 'keyevent', 'KEYCODE_HOME');
  const t0 = Date.now();
  await espera(segundos * 1000);
  sh('shell', 'monkey', '-p', 'com.costura.app', '-c', 'android.intent.category.LAUNCHER', '1');
  await espera(3000);
  const pid = sh('shell', 'pidof', 'com.costura.app');
  sh('forward', 'tcp:9222', `localabstract:webview_devtools_remote_${pid}`);
  const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const page = b.contexts()[0].pages()[0];
  const bloqueo = await page.locator('.lock-overlay').isVisible();
  await page.screenshot({ path: path.join(salida, `apk-bloqueo-${segundos}s.png`) });
  resultado.push({ fueraSegundos: Math.round((Date.now() - t0) / 1000), mismoProceso: pid, bloqueo });
  if (bloqueo) {
    const { iniciarSesion } = await import(new URL('file:///' + path.join(proyecto, 'tests/e2e/helpers.js').split(path.sep).join('/')).href);
    await iniciarSesion(page);
  }
  await b.close();
}
console.log(JSON.stringify(resultado));
