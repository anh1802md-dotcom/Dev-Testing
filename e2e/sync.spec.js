// @ts-check
/** COD1-100, COD1-102 — Backup / khôi phục dữ liệu */
const { test, expect } = require("@playwright/test");
const {
  STORAGE_KEY,
  resetAppData,
  loginAsAdmin,
  goToNav,
  getAppData,
  writeTempJson,
} = require("./helpers");

test.describe("Đồng bộ dữ liệu", () => {
  test.beforeEach(async ({ page }) => {
    await resetAppData(page);
    await loginAsAdmin(page);
    await goToNav(page, "settings");
  });

  test("COD1-100 — sao lưu dữ liệu JSON", async ({ page }) => {
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#btn-backup").click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe("medcare-backup.json");
    await expect(page.locator("#toast:not(.hidden)")).toContainText(/backup/i);
  });

  test("COD1-102 — khôi phục dữ liệu từ file JSON", async ({ page }) => {
    const original = await getAppData(page);
    const fullCount = original.patients.length;

    await page.evaluate(
      ({ key, data }) => {
        const trimmed = { ...data, patients: data.patients.slice(0, 2) };
        localStorage.setItem(key, JSON.stringify(trimmed));
      },
      { key: STORAGE_KEY, data: original }
    );

    const backupFile = writeTempJson(original);
    await page.locator("#input-restore").setInputFiles(backupFile);
    await page.waitForLoadState("load");

    await expect(page.locator("#screen-app.active")).toBeVisible();
    const restored = await getAppData(page);
    expect(restored.patients.length).toBe(fullCount);
    await expect(page.locator("#stat-patients")).toHaveText(String(fullCount));
  });
});
