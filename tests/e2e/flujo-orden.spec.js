// Flujo completo de una orden en el navegador, tal como lo haría la modista.
// Ejecutar: PW_CHANNEL=msedge npx playwright test flujo-orden
import { test, expect } from '@playwright/test';
import { iniciarSesion } from './helpers.js';

function haceDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x) => String(x).padStart(2, '0');
  return { iso: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, dia: d.getDate() };
}

test('orden de punta a punta: cliente, fecha anterior, prenda, aviso WhatsApp, pago Bre-B y entrega con deuda', async ({ page }) => {
  // Capturar los enlaces de WhatsApp en lugar de abrir otra pestaña
  await page.addInitScript(() => {
    window.__abiertos = [];
    window.open = (url) => { window.__abiertos.push(url); return null; };
  });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await page.goto('/');
  await iniciarSesion(page);

  // 1. Cliente nuevo desde la orden: con un teléfono inválido no deja (A07)
  await page.locator('.nav-item', { hasText: 'Órdenes' }).click();
  await page.getByText('+ Nueva', { exact: true }).click();
  await page.getByText('+ Nuevo Cliente', { exact: true }).click();
  await page.fill('input[placeholder="Nombre del cliente"]', `Cliente E2E ${Date.now()}`);
  await page.fill('input[type="tel"]', '12');
  await page.getByText('Mañana', { exact: true }).click();
  await page.getByRole('button', { name: 'Crear Orden' }).click();
  await expect(page.locator('.error-message')).toContainText('teléfono');

  // 2. Teléfono válido y ropa recibida hace 5 días (trabajo anterior a la app)
  const recibida = haceDias(5);
  await page.fill('input[type="tel"]', '3001234567');
  await page.fill('#fecha_recepcion', recibida.iso);
  await page.getByRole('button', { name: 'Crear Orden' }).click();
  await expect(page.locator('.orden-header h2')).toContainText('Orden #', { timeout: 10000 });
  await expect(page.locator('.cliente-fechas')).toContainText(`Recibida el ${recibida.dia} `);

  // 3. Agregar una prenda
  await page.locator('.tabs button', { hasText: 'Prendas' }).click();
  await page.getByRole('button', { name: '+ Prenda' }).click();
  await page.selectOption('#tipo_prenda', { label: 'Pantalón' });
  await page.fill('#descripcion', 'Dobladillo');
  await page.locator('.modal-content #valor').fill('20000');
  await page.locator('.modal-content button[type="submit"]').click();
  await expect(page.locator('.estado-btn')).toHaveCount(4);

  // 4. Terminarla deja la orden Lista y ofrece avisar por WhatsApp con +57
  await page.locator('.estado-btn', { hasText: 'Terminada' }).click();
  const modal = page.locator('.confirm-modal');
  await expect(modal).toContainText('Todas las prendas están terminadas');
  await modal.getByRole('button', { name: 'Sí, avisar por WhatsApp' }).click();
  await expect(page.locator('.orden-header')).toContainText('Lista');
  await expect.poll(() => page.evaluate(() => window.__abiertos.length)).toBe(1);
  const [enlace] = await page.evaluate(() => window.__abiertos);
  expect(enlace).toContain('https://wa.me/573001234567?text=');
  expect(decodeURIComponent(enlace)).toContain('ya está lista');

  // 5. Abono parcial con Bre-B
  await page.locator('.tabs button', { hasText: 'Pagos' }).click();
  await page.getByRole('button', { name: '+ Registrar Pago' }).click();
  await page.selectOption('#metodo', { label: 'Bre-B' });
  await page.locator('.modal-content #valor').fill('5000');
  await page.locator('.modal-content button[type="submit"]').click();
  await expect(page.locator('.saldo-valor')).toContainText('15.000');

  // 6. Entregar con deuda pide confirmación (fiado, RN-30)
  await page.locator('.tabs button', { hasText: 'Detalle' }).click();
  await page.getByRole('button', { name: 'Entregar orden' }).click();
  await expect(modal).toContainText('15.000');
  await modal.locator('button').last().click();
  await expect(page.locator('.orden-header')).toContainText('Entregada');

  expect(errores).toEqual([]);
});
