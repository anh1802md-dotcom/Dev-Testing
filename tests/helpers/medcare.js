import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const STORAGE_SCRIPT = "js/storage.js";
const APP_SCRIPTS = [
  "js/storage.js",
  "js/core.js",
  "js/i18n.js",
  "js/modules/bundle.js",
];

function runInBrowserScope(code) {
  const runner = new Function(
    "global",
    "window",
    "document",
    "localStorage",
    "navigator",
    "location",
    "setInterval",
    "clearInterval",
    "setTimeout",
    "clearTimeout",
    "requestAnimationFrame",
    "URL",
    "Blob",
    "FormData",
    "FileReader",
    `${code}
if (typeof MedStore !== "undefined") global.MedStore = MedStore;
if (typeof window.MedCare !== "undefined") global.MedCare = window.MedCare;`
  );
  runner(
    globalThis,
    window,
    document,
    localStorage,
    navigator,
    window.location,
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    requestAnimationFrame,
    URL,
    Blob,
    FormData,
    FileReader
  );
}

export function loadStorageScript() {
  const code = readFileSync(path.join(ROOT, STORAGE_SCRIPT), "utf8");
  runInBrowserScope(code);
}

export function mountBundleDom() {
  document.body.innerHTML = `
    <div id="screen-auth" class="screen"></div>
    <div id="screen-app" class="screen"></div>
    <form id="form-login"></form>
    <form id="form-register"></form>
    <form id="form-forgot" class="hidden"></form>
    <form id="form-otp" class="hidden"></form>
    <button id="btn-forgot" type="button"></button>
    <button data-back-login type="button"></button>
    <button class="auth-tab" data-auth="login" type="button"></button>
    <button class="auth-tab" data-auth="register" type="button"></button>
    <div id="patient-status-chips"></div>
    <div id="notif-filter-chips"></div>
    <div id="history-status-chips"></div>
    <div id="schedule-status-chips"></div>
    <button id="btn-add-patient" type="button"></button>
    <input id="search-patient" />
    <button id="btn-add-rx" type="button"></button>
    <input id="search-rx" />
    <div id="patient-list" class="card-list"></div>
    <p id="patient-count"></p>
    <div id="rx-list" class="card-list"></div>
    <p id="rx-count"></p>
    <span id="rx-stat-active"></span>
    <span id="rx-stat-low"></span>
    <span id="rx-stat-total"></span>
    <div id="history-list" class="card-list"></div>
    <input id="search-history" />
    <input id="filter-history-date" type="date" />
    <div id="notif-list" class="card-list"></div>
    <span id="notif-chip-count"></span>
    <p id="notif-unread-text"></p>
    <button id="btn-export-history" type="button"></button>
    <button id="btn-export-pdf" type="button"></button>
    <input id="setting-otp" type="checkbox" />
    <select id="setting-lang"><option value="vi">vi</option><option value="en">en</option></select>
    <input id="setting-notif" type="checkbox" checked />
    <button id="btn-change-pw" type="button"></button>
    <button id="btn-backup" type="button"></button>
    <button id="btn-restore" type="button"></button>
    <input id="input-restore" type="file" />
    <button id="btn-sync" type="button"></button>
    <button id="btn-logout" type="button"></button>
    <div id="modal" class="hidden">
      <h2 id="modal-title"></h2>
      <div id="modal-body"></div>
      <div id="modal-foot"></div>
    </div>
    <div id="confirm-dialog" class="hidden">
      <div class="confirm-panel">
        <button id="confirm-ok" type="button"></button>
        <button id="confirm-cancel" type="button"></button>
      </div>
    </div>
    <nav class="bottom-nav"></nav>
    <div id="toast" class="hidden"><span id="toast-msg"></span></div>
  `;
}

export function loadAppScripts() {
  const code = APP_SCRIPTS.map((file) =>
    readFileSync(path.join(ROOT, file), "utf8")
  ).join("\n");
  runInBrowserScope(code);
}

export function initBundleForTests() {
  localStorage.clear();
  mountBundleDom();
  loadAppScripts();

  const { MedCare, MedStore } = globalThis;

  MedCare.toast = () => {};
  MedCare.confirm = () => Promise.resolve(true);
  MedCare.openModal = () => {};
  MedCare.closeModal = () => {};
  MedCare.enterApp = () => {};
  MedCare.exitApp = () => {};
  MedCare.renderAll = () => {};
  MedCare.setView = () => {};
  MedCare.downloadJson = () => {};

  MedCare.Modules.bundle.init();
  return { MedStore, MedCare };
}

export function resetStoreData() {
  localStorage.clear();
  globalThis.MedStore.reset();
}

export function loginAs(userId = "u1") {
  const d = globalThis.MedStore.get();
  d.session = {
    userId,
    loginAt: new Date().toISOString(),
    token: "test_token",
  };
  globalThis.MedStore.save(d);
}

export function makeForm(fields) {
  const form = document.createElement("form");
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.name = name;
    input.value = value == null ? "" : String(value);
    form.appendChild(input);
  }
  return form;
}

export const STORAGE_KEY = "medcare_v2";
