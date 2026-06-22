// @ts-check
/** COD1-74, COD1-82 — Danh sách & tìm kiếm bệnh nhân */
const { test, expect } = require("@playwright/test");
const { resetAppData, loginAsAdmin, goToNav, confirmDialog } = require("./helpers");

test.describe("Bệnh nhân (COD1-74)", () => {
  test.beforeEach(async ({ page }) => {
    await resetAppData(page);
    await loginAsAdmin(page);
    await goToNav(page, "patients");
  });

  test("COD1-74 — hiển thị danh sách bệnh nhân demo", async ({ page }) => {
    await expect(page.locator("#patient-list .patient-card-v2").first()).toBeVisible();
    await expect(page.locator("#patient-count")).toContainText(/\d+/);
    await expect(page.locator("#patient-list").getByText("Nguyễn Văn A")).toBeVisible();
  });

  test("COD1-82 — tìm kiếm theo tên", async ({ page }) => {
    await page.locator("#search-patient").fill("Trần Thị B");
    await expect(page.locator("#patient-list").getByText("Trần Thị B")).toBeVisible();
    await expect(page.locator("#patient-list").getByText("Nguyễn Văn A")).toHaveCount(0);
  });

  test("COD1-131 — mở chi tiết bệnh nhân", async ({ page }) => {
    await page.locator("#patient-list .patient-card-v2").first().click();
    await expect(page.locator("#view-patient-detail.active")).toBeVisible();
    await expect(page.locator("#patient-detail-hero")).toContainText(/BN\d+/);
    await page.locator("#btn-back-patients").click();
    await expect(page.locator("#view-patients.active")).toBeVisible();
  });

  test("COD1-76 — admin xóa bệnh nhân mới tạo", async ({ page }) => {
    await page.locator("#btn-add-patient").click();
    await page.locator("#modal-form input[name=code]").fill("BN-DEL");
    await page.locator("#modal-form input[name=name]").fill("BN Xóa E2E");
    await page.locator("#modal-form input[name=phone]").fill("0999888777");
    await page.locator("#modal-form select[name=gender]").selectOption("Nam");
    await page.locator("#modal-form input[name=department]").fill("Đa khoa");
    await page.locator("#modal-save").click();
    await expect(page.locator("#patient-list").getByText("BN Xóa E2E")).toBeVisible();

    await page.locator("#patient-list").getByText("BN Xóa E2E").click();
    await expect(page.locator("#btn-delete-patient-detail")).toBeVisible();
    await page.locator("#btn-delete-patient-detail").click();
    await confirmDialog(page);

    await expect(page.locator("#view-patients.active")).toBeVisible();
    await expect(page.locator("#patient-list").getByText("BN Xóa E2E")).toHaveCount(0);
  });
});
