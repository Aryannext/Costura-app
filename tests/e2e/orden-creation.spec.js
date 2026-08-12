import { test, expect } from "@playwright/test";

test.describe("Order Creation & Concurrency", () => {
  test("handles concurrent order creations cleanly without cross-contamination", async ({
    page,
  }) => {
    let transactionErrors = 0;
    let unknownErrors = 0;

    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error") {
        if (text.includes("cannot start a transaction within a transaction")) {
          transactionErrors++;
        } else {
          console.log("UNEXPECTED APP ERROR:", text);
          unknownErrors++;
        }
      }
    });

    // 1. Login and Setup
    await page.goto("/");
    await page.waitForSelector("#username", { timeout: 15000 });
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.click('button[type="submit"]');
    await expect(page.locator(".main-content")).toBeVisible({ timeout: 15000 });

    // 2. Create Initial Client via Orders View
    await page.locator(".nav-item", { hasText: "Órdenes" }).click();
    await expect(page.locator(".ordenes-view")).toBeVisible();
    await page.getByText("+ Nueva", { exact: true }).click();
    await page.getByText("+ Nuevo Cliente", { exact: true }).click();

    const clientName = `SyncClient_${Date.now()}`;
    await page
      .locator('input[placeholder="Nombre del cliente"]')
      .fill(clientName);
    await page.getByText("Mañana", { exact: true }).click();

    // Normal submit for the first order to establish the client
    await page.evaluate(() => {
      document
        .querySelector("form.orden-form")
        .dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true }),
        );
    });

    // Wait for it to succeed and go to Detail View
    await expect(page.locator(".orden-detail-view")).toBeVisible({
      timeout: 15000,
    });

    // Save the first order's ID from URL
    const firstOrderUrl = page.url();
    const firstOrderId = firstOrderUrl.split("/").pop();
    expect(firstOrderId).toBeDefined();

    // 3. Go back to Orders for Concurrency Test
    await page.locator(".nav-item", { hasText: "Órdenes" }).click();
    await expect(page.locator(".ordenes-view")).toBeVisible();
    await page.getByText("+ Nueva", { exact: true }).click();

    // Ensure dropdown is populated and select our client
    await page.waitForFunction(
      () =>
        document.querySelector("select#cliente") &&
        document.querySelector("select#cliente").options.length > 1,
    );

    // Select the client by matching text
    const clientId = await page.evaluate((name) => {
      const select = document.querySelector("select#cliente");
      const option = Array.from(select.options).find((opt) =>
        opt.text.includes(name),
      );
      return option ? option.value : null;
    }, clientName);

    expect(clientId).not.toBeNull();
    await page.locator("select#cliente").selectOption(clientId);
    await page.getByText("En 3 días", { exact: true }).click();

    // Reset counters before overlap
    transactionErrors = 0;
    unknownErrors = 0;

    // 4. Overlapped Creation (Fire 3 submits synchronously)
    await page.evaluate(() => {
      const form = document.querySelector("form.orden-form");
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
      form.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true }),
      );
    });

    // Wait for the successful one to navigate to Detail View
    await expect(page.locator(".orden-detail-view")).toBeVisible({
      timeout: 15000,
    });

    // 5. Verification
    // Exactly ONE of the 3 should succeed. The other 2 should fail with expected transaction errors.
    expect(transactionErrors).toBe(2);

    const secondOrderUrl = page.url();
    const secondOrderId = secondOrderUrl.split("/").pop();

    // Ensure it's a completely new order ID
    expect(secondOrderId).not.toBe(firstOrderId);

    // Verify History on the new order Detail page
    await expect(page.locator(".timeline").first()).toBeVisible();
    await expect(page.locator(".timeline").first().locator("li")).toHaveCount(
      1,
      { timeout: 10000 },
    );
    await expect(page.locator(".timeline").first().locator("li")).toContainText(
      "Orden creada en estado Pendiente",
    );

    // 6. Check total orders for this client
    await page.locator(".nav-item", { hasText: "Órdenes" }).click();
    await expect(page.locator(".ordenes-view")).toBeVisible();
    await page
      .locator('input[placeholder="Buscar por cliente..."]')
      .fill(clientName);
    await page.waitForTimeout(1000); // Wait for debounce/filter

    // We created 1 initial + 3 overlapped (where 1 succeeded, 2 were rejected)
    await expect(page.locator(".orden-card")).toHaveCount(2, {
      timeout: 10000,
    });

    // 7. Verify Persistence & Integrity via Reload
    // Allow jeep-sqlite to sync to IndexedDB before reloading
    await page.waitForTimeout(2000);
    await page.reload();

    // App redirects to login after reload
    await page.waitForSelector("#username", { timeout: 15000 });
    await page.fill("#username", "admin");
    await page.fill("#password", "admin123");
    await page.click('button[type="submit"]');

    await expect(page.locator(".main-content")).toBeVisible({ timeout: 15000 });

    // Go to Orders list again
    await page.locator(".nav-item", { hasText: "Órdenes" }).click();
    await expect(page.locator(".ordenes-view")).toBeVisible();
    await page
      .locator('input[placeholder="Buscar por cliente..."]')
      .fill(clientName);
    await page.waitForTimeout(1000); // UI filter debounce

    await expect(page.locator(".orden-card")).toHaveCount(2, {
      timeout: 10000,
    }); // The data persists correctly!

    // Let's verify that BOTH orders have exactly 1 history item to prove no cross-contamination
    const ordenCards = await page.locator(".orden-card").all();

    // Go to first order
    await ordenCards[0].click();
    await expect(page.locator(".orden-detail-view")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator(".timeline").first().locator("li")).toHaveCount(
      1,
      { timeout: 10000 },
    );
    await page.locator(".back-btn").click();
    await expect(page.locator(".ordenes-view")).toBeVisible({ timeout: 15000 });

    // Ensure filter is still applied or re-apply
    await page
      .locator('input[placeholder="Buscar por cliente..."]')
      .fill(clientName);
    await page.waitForTimeout(1000);

    // Go to second order
    await page.locator(".orden-card").nth(1).click();
    await expect(page.locator(".orden-detail-view")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.locator(".timeline").first().locator("li")).toHaveCount(
      1,
      { timeout: 10000 },
    );

    // Ensure we didn't receive any unexpected application errors throughout the flow
    expect(unknownErrors).toBe(0);
  });
});
