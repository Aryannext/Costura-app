// Ejecuta pasos sueltos en el WebView del APK. Uso: node apk-cdp.mjs <proyecto> <accion>
import { createRequire } from 'node:module';
import path from 'node:path';
const [proyecto, accion] = process.argv.slice(2);
const require = createRequire(path.join(proyecto, 'package.json'));
const { chromium } = require('playwright');
const b = await chromium.connectOverCDP('http://127.0.0.1:9222');
const page = b.contexts()[0].pages()[0];
const nav = async (u) => { await page.evaluate((x) => { history.pushState({}, '', x); dispatchEvent(new PopStateEvent('popstate', { state: history.state })); }, u); await page.waitForTimeout(700); };
const avisos = () => page.evaluate(() => [...document.querySelectorAll('.toast, [class*="toast"]')].map((t) => t.textContent.trim()).filter(Boolean));
const { iniciarSesion } = await import(new URL('file:///' + path.join(proyecto, 'tests/e2e/helpers.js').split(path.sep).join('/')).href);
const acciones = {
  async entrar() { await iniciarSesion(page); return { url: page.url(), idioma: await page.evaluate(() => navigator.language) }; },
  async borrarPrimeraFoto() { await page.locator('.foto-thumb').first().waitFor(); const caja = await page.locator('.foto-thumb').first().boundingBox(); return { caja }; },
  async abrirCamara() {
    await nav('/ordenes/2');
    await page.locator('.tabs button', { hasText: 'Prendas' }).click();
    if (!(await page.locator('.foto-nueva').isVisible())) await page.locator('.prenda-card .accion', { hasText: 'Fotos' }).first().click();
    await page.evaluate(() => { window.__avisos = []; new MutationObserver(() => { document.querySelectorAll('.toast, [class*="toast"]').forEach((t) => { const x = t.textContent.trim(); if (x && !window.__avisos.includes(x)) window.__avisos.push(x); }); }).observe(document.body, { subtree: true, childList: true, characterData: true }); });
    await page.locator('.foto-nueva').click();
    return { fotosAntes: await page.locator('.foto-thumb').count() };
  },
  async estado() {
    await page.waitForTimeout(2500);
    return { url: page.url(), avisosVistos: await page.evaluate(() => window.__avisos || []), avisosAhora: await avisos(), fotos: await page.locator('.foto-thumb').count(), srcs: await page.evaluate(() => [...document.querySelectorAll('.foto-thumb img, img.foto-thumb')].map((i) => i.src.slice(0, 60))) };
  },
};
console.log(JSON.stringify(await acciones[accion]()));
await b.close();
