import { test, expect } from '@playwright/test';

test.describe('Web Persistence E2E (jeep-sqlite IndexedDB)', () => {
    test('should persist client data across page reloads', async ({ page }) => {
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

        // 1. Open the application (Home / Dashboard)
        await page.goto('/');

        // The App defaults to Login view if not authenticated
        await page.waitForSelector('#username', { timeout: 15000 });
        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');

        // Wait for the app to initialize the database and redirect
        // It should render the main content view (e.g. Dashboard)
        await expect(page.locator('.main-content')).toBeVisible({ timeout: 15000 });

        // Navigate to Clientes view via UI
        await page.locator('.nav-item', { hasText: 'Clientes' }).click();

        // Wait for clients to load (either empty state or list)
        await expect(page.locator('.clientes-view')).toBeVisible({ timeout: 15000 });

        // 2. Click "+ Nuevo" to add a client
        await page.getByText('+ Nuevo', { exact: true }).click();
        await expect(page.locator('.modal-content')).toBeVisible();

        const uniqueName = `TestClient_${Date.now()}`;
        const uniquePhone = `300${Math.floor(Math.random() * 10000000)}`;

        // 3. Fill the form
        await page.locator('input#nombre').fill(uniqueName);
        await page.locator('input#telefono').fill(uniquePhone);

        // Save
        await page.getByText('Guardar', { exact: true }).click();

        // 4. Verify client appears in the detail view after creation
        // Wait for modal to disappear
        await expect(page.locator('.modal-content')).not.toBeVisible();
        // The app redirects to the detail view
        await expect(page.locator('.cliente-detail-view')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('.cliente-header h2')).toContainText(uniqueName);

        // Give jeep-sqlite a small moment to ensure IndexedDB sync is triggered
        // Normally, saveToStore() is called under the hood or we call it explicitly.
        // We will wait 2 seconds just in case it's asynchronous.
        await page.waitForTimeout(2000);

        // 5. Force a hard reload
        await page.reload();

        // 6. Log back in and navigate to Clientes
        await page.waitForSelector('#username', { timeout: 15000 });
        await page.fill('#username', 'admin');
        await page.fill('#password', 'admin123');
        await page.click('button[type="submit"]');
        await expect(page.locator('.main-content')).toBeVisible({ timeout: 15000 });
        await page.locator('.nav-item', { hasText: 'Clientes' }).click();

        // 7. Verify the client is STILL there!
        // The app will re-initialize the DB from IndexedDB
        await expect(page.locator('.clientes-view')).toBeVisible({ timeout: 15000 });

        // Check if the name we created is visible in the list
        await expect(page.locator('.clientes-list')).toContainText(uniqueName, { timeout: 15000 });
    });
});
