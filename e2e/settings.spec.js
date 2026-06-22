// @ts-check
/** COD1-88 — Đổi mật khẩu */
const { test, expect } = require("@playwright/test");
const { resetAppData, login, goToNav, confirmDialog, DEMO } = require("./helpers");

const NEW_PASSWORD = "newpass789";

test.describe("Cài đặt tài khoản", () => {
  test.beforeEach(async ({ page }) => {
    await resetAppData(page);
    await login(page, DEMO.admin);
    await goToNav(page, "settings");
  });

  test("COD1-88 — đổi mật khẩu và đăng nhập lại", async ({ page }) => {
    await page.locator("#btn-change-pw").click();
    await page.locator("#modal-form input[name=old]").fill(DEMO.admin.password);
    await page.locator("#modal-form input[name=new]").fill(NEW_PASSWORD);
    await page.locator("#modal-save").click();
    await expect(page.locator("#toast:not(.hidden)")).toContainText(/đổi MK/i);

    await page.locator("#btn-logout").click();
    await confirmDialog(page);
    await expect(page.locator("#form-login")).toBeVisible();

    await page.locator("#form-login input[name=email]").fill(DEMO.admin.email);
    await page.locator("#form-login input[name=password]").fill(NEW_PASSWORD);
    await page.locator("#form-login button[type=submit]").click();
    await expect(page.locator("#screen-app.active")).toBeVisible();
    await expect(page.locator("#dash-doctor")).toContainText(DEMO.admin.name);
  });
});
