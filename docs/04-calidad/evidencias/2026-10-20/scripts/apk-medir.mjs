// Segunda pasada en el APK:
//  1. Repite los dos pasos que el script anterior no completó (abono mayor que el
//     saldo y entrega con deuda), con la orden que quedó abierta.
//  2. Mide RNF-01 a RNF-03 DENTRO del WebView: el clic y la espera ocurren en la
//     página, con performance.now(), así no cuenta la latencia de CDP ni las
//     esperas de Playwright. 5 repeticiones por operación.
//  3. Anota las respuestas con error (los 404 de la consola).
import { createRequire } from 'node:module';
import path from 'node:path';

const [proyecto, salida] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const { expect } = require('@playwright/test');

const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = b.contexts()[0].pages()[0];
const fallidos = [];
page.on('response', (r) => { if (r.status() >= 400) fallidos.push(`${r.status()} ${r.url()}`); });
page.on('requestfailed', (r) => fallidos.push(`falló ${r.url()} · ${r.failure()?.errorText}`));
const errores = [];
page.on('pageerror', (e) => errores.push(e.message));

const pasos = [];
async function paso(nombre, fn) {
  try { const r = await fn(); pasos.push({ paso: nombre, resultado: 'OK', ...(r ? { dato: r } : {}) }); }
  catch (e) { pasos.push({ paso: nombre, resultado: 'FALLA', detalle: e.message.split('\n').slice(0, 3).join(' | ') }); await page.screenshot({ path: path.join(salida, `apk-medir-falla-${pasos.length}.png`) }).catch(() => {}); }
}

// Clic y espera dentro de la página. `listo` es el cuerpo de una función que devuelve true.
async function cronometrar(selectorClic, listo, textoClic) {
  return page.evaluate(async ({ selectorClic, listo, textoClic }) => {
    const hecho = new Function(listo);
    const candidatos = [...document.querySelectorAll(selectorClic)];
    const el = textoClic ? candidatos.find((x) => x.textContent.includes(textoClic)) : candidatos[0];
    if (!el) throw new Error('no está ' + selectorClic);
    const t0 = performance.now();
    el.click();
    while (!hecho()) {
      if (performance.now() - t0 > 15000) throw new Error('tiempo agotado');
      await new Promise((r) => requestAnimationFrame(r));
    }
    return Math.round(performance.now() - t0);
  }, { selectorClic, listo, textoClic });
}
// Navegar con Vue Router (popstate) sin recargar: recargar activa el bloqueo
const nav = async (url) => { await page.evaluate((u) => { history.pushState({}, '', new URL(u, location.href).pathname); dispatchEvent(new PopStateEvent('popstate', { state: history.state })); }, url); await page.waitForTimeout(400); };
const mediana = (xs) => { const s = [...xs].sort((a, c) => a - c); return s[Math.floor(s.length / 2)]; };

// --- 1. Pasos pendientes, sobre la orden #1 que quedó con saldo de 15.000
await nav('https://localhost/ordenes/1');
await expect(page.locator('.orden-header h2')).toContainText('Orden #', { timeout: 15000 });

await paso('Abono mayor que el saldo: el botón queda deshabilitado', async () => {
  await page.locator('.tabs button', { hasText: 'Pagos' }).click();
  await page.getByRole('button', { name: '+ Registrar Pago' }).click();
  await page.locator('.modal-content #valor').fill('99000');
  await expect(page.locator('.modal-content button[type="submit"]')).toBeDisabled();
  const aviso = (await page.locator('.modal-content').innerText()).split('\n').filter((l) => /saldo|supera|máximo/i.test(l)).join(' / ');
  await page.screenshot({ path: path.join(salida, 'apk-05-abono-mayor.png') });
  await page.locator('.modal-content').getByRole('button', { name: /Cancelar|Cerrar/ }).first().click();
  await expect(page.locator('.modal-content')).toBeHidden();
  await expect(page.locator('.saldo-valor')).toContainText('15.000');
  return aviso || '(sin texto de aviso)';
});

await paso('Entregar con deuda pide confirmación con el saldo (RN-30)', async () => {
  await page.locator('.tabs button', { hasText: 'Detalle' }).click();
  await page.getByRole('button', { name: 'Entregar orden' }).click();
  const modal = page.locator('.confirm-modal');
  await expect(modal).toContainText('15.000');
  await modal.locator('button').last().click();
  await expect(page.locator('.orden-header')).toContainText('Entregada');
  await page.screenshot({ path: path.join(salida, 'apk-04-entregada.png') });
});

// --- 2. Tiempos dentro del WebView
const tiempos = { 'RNF-02 registrar orden': [], 'RNF-03 registrar abono': [], 'RNF-01 abrir orden': [] };

await paso('RNF-02: registrar orden con clienta nueva, 5 veces', async () => {
  for (let i = 0; i < 5; i++) {
    await nav('https://localhost/ordenes');
    await page.getByText('+ Nueva', { exact: true }).click();
    await page.getByText('+ Nuevo Cliente', { exact: true }).click();
    await page.fill('input[placeholder="Nombre del cliente"]', `Medición ${i} ${Date.now()}`);
    await page.check('#autoriza_datos');
    await page.fill('input[type="tel"]', `30055500${10 + i}`);
    await page.getByText('Mañana', { exact: true }).click();
    tiempos['RNF-02 registrar orden'].push(await cronometrar('button', "return /Orden #/.test(document.querySelector('.orden-header h2')?.textContent || '')", 'Crear Orden'));
    // Una prenda de 30.000 para tener saldo en la medición de abonos
    if (i === 0) {
      await page.locator('.tabs button', { hasText: 'Prendas' }).click();
      await page.getByRole('button', { name: '+ Prenda' }).click();
      await page.selectOption('#tipo_prenda', { label: 'Pantalón' });
      await page.fill('#descripcion', 'Ruedo');
      await page.locator('.modal-content #valor').fill('30000');
      await page.locator('.modal-content button[type="submit"]').click();
      await expect(page.locator('.estado-btn')).toHaveCount(4);
      tiempos.ordenConSaldo = page.url();
    }
  }
});

await paso('RNF-03: registrar abono y ver el saldo, 5 veces', async () => {
  await nav(tiempos.ordenConSaldo);
  await page.locator('.tabs button', { hasText: 'Pagos' }).click();
  for (let i = 0; i < 5; i++) {
    const antes = await page.locator('.saldo-valor').innerText();
    await page.getByRole('button', { name: '+ Registrar Pago' }).click();
    await page.locator('.modal-content #valor').fill('1000');
    tiempos['RNF-03 registrar abono'].push(await cronometrar('.modal-content button[type="submit"]',
      `return !document.querySelector('.modal-content') && document.querySelector('.saldo-valor')?.textContent.trim() !== ${JSON.stringify(antes.trim())}`));
  }
  return 'saldo final ' + (await page.locator('.saldo-valor').innerText());
});

await paso('RNF-01: abrir una orden desde la lista, 5 veces', async () => {
  for (let i = 0; i < 5; i++) {
    await nav('https://localhost/ordenes');
    await page.locator('.orden-card, .ordenes-list > *').first().waitFor();
    await page.waitForTimeout(300);
    tiempos['RNF-01 abrir orden'].push(await cronometrar('.orden-card, .ordenes-list > *',
      "return /Orden #/.test(document.querySelector('.orden-header h2')?.textContent || '') && document.querySelectorAll('.tabs button').length > 0"));
  }
});

const resumen = Object.fromEntries(Object.entries(tiempos).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, { muestras: v, mediana: mediana(v), maximo: Math.max(...v) }]));
console.log(JSON.stringify({ pasos, tiempos: resumen, errores, fallidos: [...new Set(fallidos)] }, null, 2));
await b.close();
