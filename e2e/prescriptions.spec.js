// @ts-check
/** COD1-78, COD1-72 — Thêm / sửa toa thuốc */
const { test, expect } = require("@playwright/test");
const { resetAppData, loginAsAdmin, goToNav } = require("./helpers");

const RX_NAME = "E2E Paracetamol Test";

test.describe("Toa thuốc", () => {
  test.beforeEach(async ({ page }) => {
    await resetAppData(page);
    await loginAsAdmin(page);
    await goToNav(page, "rx");
  });

  test("COD1-78 — thêm toa thuốc mới", async ({ page }) => {
    const before = await page.locator("#rx-list .med-card").count();

    await page.locator("#btn-add-rx").click();
    await page.locator("#modal-form select[name=patientId]").selectOption({ index: 0 });
    await page.locator("#modal-form input[name=name]").fill(RX_NAME);
    await page.locator("#modal-form input[name=dosage]").fill("500mg");
    await page.locator("#modal-form input[name=frequency]").fill("2 lần/ngày");
    await page.locator("#modal-form input[name=times]").fill("08:00, 20:00");
    await page.locator("#modal-form select[name=status]").selectOption("active");
    await page.locator("#modal-save").click();

    await expect(page.locator("#rx-list .med-card")).toHaveCount(before + 1);
    await expect(page.locator("#rx-list").getByText(RX_NAME)).toBeVisible();
  });

  test("COD1-72 — chỉnh sửa toa thuốc", async ({ page }) => {
    await page.locator("#btn-add-rx").click();
    await page.locator("#modal-form select[name=patientId]").selectOption({ index: 0 });
    await page.locator("#modal-form input[name=name]").fill(RX_NAME);
    await page.locator("#modal-form input[name=dosage]").fill("500mg");
    await page.locator("#modal-form select[name=status]").selectOption("active");
    await page.locator("#modal-save").click();
    await expect(page.locator("#rx-list").getByText(RX_NAME)).toBeVisible();

    await page.locator("#rx-list").getByText(RX_NAME).click();
    await page.locator("[data-edit-rx]").click();
    await page.locator("#modal-form input[name=dosage]").fill("650mg");
    await page.locator("#modal-save").click();

    await expect(page.locator("#rx-list").getByText("650mg")).toBeVisible();
  });
});
