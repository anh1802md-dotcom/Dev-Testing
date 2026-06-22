// @ts-check

/** @typedef {import('@playwright/test').Page} Page */

const fs = require("fs");
const os = require("os");
const path = require("path");

const STORAGE_KEY = "medcare_v2";

const DEMO = {
  admin: { email: "admin@demo.com", password: "123456", name: "Admin Hệ thống" },
  doctor: { email: "bs.nguyenminh@hospital.vn", password: "123456", name: "BS. Nguyễn Minh" },
};

/**
 * Đợi bundle.js + COD1 modules nạp xong (tránh click trước khi listener gắn).
 * @param {Page} page
 */
async function waitForAppReady(page) {
  await page.waitForSelector("#screen-auth.auth-ready", { state: "attached", timeout: 60_000 });
}

/**
 * Xóa localStorage để app khởi tạo lại dữ liệu demo.
 * @param {Page} page
 */
async function resetAppData(page) {
  await page.addInitScript(() => {
    window.__MEDCARE_E2E__ = true;
  });
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  await waitForAppReady(page);
  await page.waitForSelector("#form-login");
}

/**
 * @param {Page} page
 * @param {{ email: string, password: string }} creds
 */
async function login(page, { email, password }) {
  await page.locator("#form-login input[name=email]").fill(email);
  await page.locator("#form-login input[name=password]").fill(password);
  await page.locator("#form-login button[type=submit]").click();
  await page.locator("#screen-app.active").waitFor({ state: "visible", timeout: 30_000 });
}

/**
 * @param {Page} page
 */
async function loginAsAdmin(page) {
  await login(page, DEMO.admin);
}

/**
 * @param {Page} page
 * @param {string} view home | patients | rx | notifications | settings
 */
async function goToNav(page, view) {
  await page.locator("#screen-app.active").waitFor({ state: "visible" });
  const staffNav = page.locator(`#nav-staff .nav-item[data-view="${view}"]`);
  const userNav = page.locator(`#nav-user .nav-item[data-view="${view}"]`);
  const nav = (await staffNav.isVisible()) ? staffNav : userNav;
  await nav.waitFor({ state: "visible" });
  await nav.click();
  await page.locator(`#view-${view}.active`).waitFor({ state: "visible" });
}

/**
 * @param {Page} page
 */
async function confirmDialog(page) {
  const dialog = page.locator("#confirm-dialog:not(.hidden)");
  await dialog.waitFor({ state: "visible" });
  await page.locator("#confirm-ok").click();
  await dialog.waitFor({ state: "hidden" });
}

/**
 * @param {Page} page
 */
async function openRegisterTab(page) {
  await page.locator('.auth-tab[data-auth="register"]').click();
  await page.locator("#form-register:not(.hidden)").waitFor({ state: "visible" });
}

/**
 * @param {Page} page
 * @returns {Promise<object>}
 */
async function getAppData(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

/**
 * Ghi file JSON tạm để test khôi phục.
 * @param {object} data
 */
function writeTempJson(data) {
  const file = path.join(os.tmpdir(), `medcare-e2e-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  return file;
}

module.exports = {
  STORAGE_KEY,
  DEMO,
  waitForAppReady,
  resetAppData,
  login,
  loginAsAdmin,
  goToNav,
  confirmDialog,
  openRegisterTab,
  getAppData,
  writeTempJson,
};
