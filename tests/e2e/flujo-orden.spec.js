// Flujo completo de una orden en el navegador, tal como lo haría la modista.
// Ejecutar: PW_CHANNEL=msedge npx playwright test flujo-orden
import { test, expect } from '@playwright/test';

function haceDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = (x) => String(x).padStart(2, '0');
  return { iso: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, ddmm: `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}` };
}

test('orden de punta a punta: cliente, prendas, estados, aviso WhatsApp, pago y entrega con deuda', async ({ page }) => {
  // Capturar los enlaces de WhatsApp en lugar de abrir otra pestaña
  await page.addInitScript(() => {
    window.__abiertos = [];
    window.open = (url) => { window.__abiertos.push(url); return null; };
  });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));

  await page.goto('/');
  await page.waitForSelector('#username', { timeout: 20000 });
  await page.fill('#username', 'admin');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await expect(page.locator('.main-content')).toBeVisible({ timeout: 15000 });

  // 1. Nueva orden con cliente nuevo: sin teléfono no debe dejar (A07)
  await page.locator('.nav-item', { hasText: 'Órdenes' }).click();
  await page.getByText('+ Nueva', { exact: true }).click();
  await page.getByText('+ Nuevo Cliente', { exact: true }).click();
  const nombre = `Cliente E2E ${Date.now()}`;
  await page.fill('input[placeholder="Nombre del cliente"]', nombre);
  await page.fill('input[type="tel"]', '12');
  await page.getByText('Mañana', { exact: true }).click();
  await page.getByRole('button', { name: 'Crear Orden' }).click();
  await expect(page.locator('.error-message')).toContainText('teléfono');

  // 2. Teléfono válido y ropa recibida hace 5 días (registro de trabajos anteriores)
  const recibida = haceDias(5);
  await page.fill('input[type="tel"]', '3001234567');
  await page.fill('#fecha_recepcion', recibida.iso);
  await page.getByRole('button', { name: 'Crear Orden' }).click();
  await expect(page.locator('.orden-header h2')).toContainText('Orden #', { timeout: 10000 });
  await expect(page.getByText(`Recibida: ${recibida.ddmm}`)).toBeVisible();

  // 3. No se puede iniciar sin prendas
  await page.getByRole('button', { name: 'Iniciar Proceso' }).click();
  await expect(page.getByText('Agrega al menos una prenda')).toBeVisible();

  // 4. Agregar una prenda
  await page.locator('.tabs button', { hasText: 'Prendas' }).click();
  await page.getByRole('button', { name: '+ Prenda' }).click();
  await page.selectOption('#tipo_prenda', { label: 'Pantalón' });
  await page.fill('#descripcion', 'Dobladillo');
  await page.locator('.modal-content #valor').fill('20000');
  await page.locator('.modal-content button[type="submit"]').click();
  await expect(page.locator('.estado-select')).toHaveCount(1);

  // 5. Empezar la prenda pasa la orden a En Proceso y ofrece avisar (A05)
  await page.locator('.estado-select').selectOption('2');
  await expect(page.locator('.confirm-modal')).toContainText('ya empezaste');
  await page.locator('.confirm-modal').getByRole('button', { name: 'Cancelar' }).click();
  await expect(page.locator('.orden-header')).toContainText('En Proceso');

  // 6. Terminarla pasa la orden a Lista; aceptar abre WhatsApp con +57 y el mensaje
  await page.locator('.estado-select').selectOption('3');
  await expect(page.locator('.confirm-modal')).toContainText('quedó Lista');
  await page.locator('.confirm-modal').getByRole('button', { name: 'Sí' }).click();
  await expect(page.locator('.orden-header')).toContainText('Lista');
  const abiertos = await page.evaluate(() => window.__abiertos);
  expect(abiertos[0]).toContain('https://wa.me/573001234567?text=');
  expect(decodeURIComponent(abiertos[0])).toContain('ya está lista');

  // 7. Abono parcial con Bre-B
  await page.locator('.tabs button', { hasText: 'Pagos' }).click();
  await page.getByRole('button', { name: '+ Registrar Pago' }).click();
  await page.selectOption('#metodo', { label: 'Bre-B' });
  await page.locator('.modal-content #valor').fill('5000');
  await page.locator('.modal-content button[type="submit"]').click();
  await expect(page.locator('.orden-header')).toContainText('15000');

  // 8. Entregar con deuda pide confirmación; luego reabrir vuelve a En Proceso (A03, A14)
  await page.locator('.tabs button', { hasText: 'Detalle' }).click();
  await page.getByRole('button', { name: 'Entregar' }).click();
  await expect(page.locator('.confirm-modal')).toContainText('aún debe $15.000');
  await page.locator('.confirm-modal').getByRole('button', { name: 'Sí' }).click();
  await expect(page.locator('.orden-header')).toContainText('Entregada');
  await page.getByRole('button', { name: 'Reabrir Orden' }).click();
  await expect(page.locator('.orden-header')).toContainText('En Proceso');

  expect(errores).toEqual([]);
});
