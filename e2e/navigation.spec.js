// @ts-check
/** COD1-82, COD1-84 — Điều hướng & dashboard */
const { test, expect } = require("@playwright/test");
const { resetAppData, loginAsAdmin, goToNav } = require("./helpers");

test.describe("Điều hướng chính", () => {
  test.beforeEach(async ({ page }) => {
    await resetAppData(page);
    await loginAsAdmin(page);
  });

  test("COD1-84 — dashboard hiển thị thống kê demo", async ({ page }) => {
    await expect(page.locator("#stat-patients")).toHaveText(/\d+/);
    await expect(page.locator("#recent-patients .recent-item").first()).toBeVisible();
  });

  test("COD1-84 — menu dưới chuyển giữa các màn hình", async ({ page }) => {
    await goToNav(page, "patients");
    await expect(page.locator("#patient-list")).toBeVisible();

    await goToNav(page, "rx");
    await expect(page.locator("#rx-list")).toBeVisible();

    await goToNav(page, "notifications");
    await expect(page.locator("#view-notifications")).toBeVisible();

    await goToNav(page, "settings");
    await expect(page.locator("#btn-logout")).toBeVisible();

    await goToNav(page, "home");
    await expect(page.locator("#dash-greeting")).toBeVisible();
  });

  test("COD1-82 — truy cập nhanh từ dashboard sang bệnh nhân", async ({ page }) => {
    await page.locator('.quick-row[data-goto="patients"]').click();
    await expect(page.locator("#view-patients.active")).toBeVisible();
  });
});
