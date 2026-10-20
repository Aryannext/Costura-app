// RNF-03 separado en dos momentos: cuándo cambia el saldo y cuándo termina de cerrarse el modal.
import { createRequire } from 'node:module';
import path from 'node:path';
const [proyecto, orden] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = b.contexts()[0].pages()[0];
await page.evaluate((u) => { history.pushState({}, '', u); dispatchEvent(new PopStateEvent('popstate', { state: history.state })); }, orden);
await page.waitForTimeout(800);
await page.locator('.tabs button', { hasText: 'Pagos' }).click();
const filas = [];
for (let i = 0; i < 5; i++) {
  await page.getByRole('button', { name: '+ Registrar Pago' }).click();
  await page.locator('.modal-content #valor').fill('1000');
  await page.waitForTimeout(300);
  filas.push(await page.evaluate(async () => {
    const saldo = () => document.querySelector('.saldo-valor')?.textContent.trim();
    const antes = saldo(); const t0 = performance.now(); let tSaldo = null;
    document.querySelector('.modal-content button[type="submit"]').click();
    while (document.querySelector('.modal-content') || tSaldo === null) {
      if (tSaldo === null && saldo() !== antes) tSaldo = performance.now() - t0;
      if (performance.now() - t0 > 15000) break;
      await new Promise((r) => requestAnimationFrame(r));
    }
    return { saldoCambia: Math.round(tSaldo), modalCerrado: Math.round(performance.now() - t0) };
  }));
}
console.log(JSON.stringify({ orden, filas, saldoFinal: await page.locator('.saldo-valor').innerText() }));
await b.close();
