import { expect } from '@playwright/test';

// Credenciales de prueba. Cada prueba de Playwright usa un navegador limpio, así
// que siempre arranca con el usuario de fábrica admin/admin123, y la app obliga a
// cambiar esa clave en el primer ingreso. Estos valores solo existen en pruebas.
export const USUARIO = 'admin';
export const CLAVE_FABRICA = 'admin123';
export const CLAVE_PRUEBA = 'Prueba-E2E-2026';

// Entra a la app desde cualquier punto: login, cambio obligatorio de clave,
// pantalla de bloqueo al reanudar, o ya dentro.
export async function iniciarSesion(page) {
  await page.waitForSelector('#username, #nueva, .lock-overlay, .main-content', { timeout: 20000 });
  await page.waitForLoadState('networkidle');

  if (await page.locator('#username').isVisible()) {
    await page.fill('#username', USUARIO);
    await page.fill('#password', CLAVE_FABRICA);
    await page.click('button[type="submit"]');
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 }).catch(() => {});

    // La clave de fábrica ya se cambió en esta base: entrar con la de prueba
    if (page.url().includes('/login')) {
      await page.fill('#password', CLAVE_PRUEBA);
      await page.click('button[type="submit"]');
      await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15000 });
    }
  }

  if (page.url().includes('/cambiar-clave')) {
    await page.waitForSelector('#nueva');
    await page.fill('#actual', CLAVE_FABRICA);
    await page.fill('#nueva', CLAVE_PRUEBA);
    await page.fill('#confirmacion', CLAVE_PRUEBA);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(url => !url.pathname.startsWith('/cambiar-clave'), { timeout: 15000 });
  }

  // Bloqueo al reanudar: tras recargar, la app pide la clave para seguir
  const bloqueo = page.locator('.lock-overlay');
  if (await bloqueo.isVisible()) {
    await bloqueo.locator('input[type="password"]').fill(CLAVE_PRUEBA);
    await bloqueo.locator('button[type="submit"]').click();
    await expect(bloqueo).toBeHidden({ timeout: 15000 });
  }

  await expect(page.locator('.nav-item').first()).toBeVisible({ timeout: 15000 });
}
