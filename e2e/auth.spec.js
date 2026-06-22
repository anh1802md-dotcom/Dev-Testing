// @ts-check
/** COD1-70, COD1-71 — Đăng nhập / phiên làm việc */
const { test, expect } = require("@playwright/test");
const { resetAppData, loginAsAdmin, goToNav, confirmDialog, openRegisterTab, DEMO } = require("./helpers");

test.describe("Xác thực (COD1-70)", () => {
  test.beforeEach(async ({ page }) => {
    await resetAppData(page);
  });

  test("COD1-71 — hiển thị màn hình đăng nhập", async ({ page }) => {
    await expect(page.locator("#screen-auth")).toBeVisible();
    await expect(page.locator("#form-login")).toBeVisible();
    await expect(page.locator("#form-login button[type=submit]")).toBeVisible();
  });

  test("COD1-71 — đăng nhập admin thành công", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.locator("#view-home")).toBeVisible();
    await expect(page.locator("#dash-doctor")).toContainText(DEMO.admin.name);
    await expect(page.locator("#stat-patients")).not.toHaveText("0");
  });

  test("COD1-71 — từ chối mật khẩu sai", async ({ page }) => {
    await page.locator("#form-login input[name=email]").fill(DEMO.admin.email);
    await page.locator("#form-login input[name=password]").fill("sai-mat-khau");
    await page.locator("#form-login button[type=submit]").click();
    await expect(page.locator("#screen-auth")).toBeVisible();
    await expect(page.locator("#toast:not(.hidden)")).toBeVisible();
  });

  test("COD1-120 — đăng xuất quay về màn hình auth", async ({ page }) => {
    await loginAsAdmin(page);
    await goToNav(page, "settings");
    await page.locator("#btn-logout").click();
    await confirmDialog(page);
    await expect(page.locator("#form-login")).toBeVisible();
  });

  test("COD1-70 — đăng ký bệnh nhân mới thành công", async ({ page }) => {
    const email = `user.e2e.${Date.now()}@test.local`;
    await openRegisterTab(page);
    await page.locator("#form-register input[name=name]").fill("BN E2E Test");
    await page.locator("#form-register input[name=phone]").fill("0911222333");
    await page.locator("#form-register input[name=email]").fill(email);
    await page.locator("#form-register input[name=password]").fill("654321");
    await page.locator("#form-register button[type=submit]").click();

    await expect(page.locator("#screen-app.active")).toBeVisible();
    await expect(page.locator("#view-user-home.active")).toBeVisible();
    await expect(page.locator("#toast:not(.hidden)")).toContainText(/thành công/i);
  });
});
