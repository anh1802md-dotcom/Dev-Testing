const fs = require("fs");
const path = require("path");
let s = fs.readFileSync(path.join(__dirname, "../js/modules/_bundle-source.js"), "utf8");
s = s.replace(/^\(function \(\) \{\s*"use strict";\s*/m, "");
s = s.replace(/\s*init\(\);\s*\}\)\(\);\s*$/m, "");
s = s.replace(/\bconst \$ = /g, "const $ = ");
s = s.replace(/\$\(/g, "M.$(");
s = s.replace(/M\.\$\$\(/g, "M.$$(");
s = s.replace(/\$\$\(/g, "M.$$(");
s = s.replace(/\btoast\(/g, "M.toast(");
s = s.replace(/\besc\(/g, "M.esc(");
s = s.replace(/\bdata\(\)/g, "M.data()");
s = s.replace(/\bpersist\(\)/g, "M.persist()");
s = s.replace(/\bcurrentUser\(\)/g, "M.currentUser()");
s = s.replace(/\bpatientById\(/g, "M.patientById(");
s = s.replace(/\brxById\(/g, "M.rxById(");
s = s.replace(/\bopenModal\(/g, "M.openModal(");
s = s.replace(/\bcloseModal\(/g, "M.closeModal(");
s = s.replace(/\bsetView\(/g, "M.setView(");
s = s.replace(/\benterApp\(\)/g, "M.enterApp()");
s = s.replace(/\bexitApp\(\)/g, "M.exitApp()");
s = s.replace(/\brenderAll\(\)/g, "M.renderAll()");
s = s.replace(/\btodayKey\(\)/g, "M.todayKey()");
s = s.replace(/\bdownloadJson\(/g, "M.downloadJson(");
s = s.replace(/let chartDoses/g, "M.charts.doses");
s = s.replace(/let chartMeds/g, "M.charts.meds");
s = s.replace(/chartDoses/g, "M.charts.doses");
s = s.replace(/chartMeds/g, "M.charts.meds");
s = s.replace(/pendingForgotEmail/g, "M.state.pendingForgotEmail");
s = s.replace(/const TITLES = \{[\s\S]*?\};\s*/m, "");
s = s.replace(/function showAuthForm/g, "function showForm");
s = s.replace(/showAuthForm\(/g, "M.Auth.showForm(");

const header = `/**
 * MedCare — Logic nghiệp vụ (gộp module, gọi từ cod1/COD1-XXX.js)
 */
(function (M) {
  "use strict";
  M.Modules = M.Modules || {};
  M.Modules.bundle = {
    init() {
`;

const footer = `
      M.Auth = { showForm };
      M.Patients = {
        render: renderPatients,
        openModal: openPatientModal,
        detail: showPatientDetail,
        save: savePatientFromForm,
      };
      M.Rx = {
        render: renderRx,
        openModal: openRxModal,
        detail: showRxDetail,
        save: saveRxFromForm,
        syncReminders: syncRemindersForRx,
        openReminder: openReminderModal,
      };
      M.History = { render: renderHistory, add: addHistory };
      M.Notifications = {
        push: pushNotif,
        render: renderNotifications,
        updateBadge: updateNotifBadge,
      };
      M.Dashboard = { render: renderDashboard };
      M.Reminders = { check: checkReminders, renderToday: renderTodayReminders };
      M.Reports = { renderCharts };
      M.Settings = { render: renderSettings };
      M.Auth.showForm = showForm;

      // Wire events (từ app.js gốc)
      wireAuth();
      wirePatients();
      wireRx();
      wireHistory();
      wireNotifications();
      wireDashboard();
      wireReports();
      wireSettings();
      wireNav();
    },
    initPart(id) {
      console.info("[COD1] Active: " + id);
    },
  };

  function wireNav() {
    M.$$(".nav-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.view === "more") {
          M.$("#more-sheet").classList.toggle("hidden");
          return;
        }
        M.setView(btn.dataset.view);
      });
    });
    M.$$("[data-goto]").forEach((btn) => btn.addEventListener("click", () => M.setView(btn.dataset.goto)));
    M.$(".sheet-backdrop")?.addEventListener("click", () => M.$("#more-sheet").classList.add("hidden"));
    M.$("#btn-notif-bell").addEventListener("click", () => M.setView("notifications"));
  }

  function wireAuth() {
    M.$("#form-login").addEventListener("submit", onLogin);
    M.$("#form-register").addEventListener("submit", onRegister);
    M.$$(".auth-tab").forEach((btn) => btn.addEventListener("click", () => showForm(btn.dataset.auth)));
    M.$("#btn-forgot").addEventListener("click", () => showForm("forgot"));
    M.$$("[data-back-login]").forEach((b) => b.addEventListener("click", () => showForm("login")));
    M.$("#form-forgot").addEventListener("submit", onForgot);
    M.$("#form-otp").addEventListener("submit", onOtp);
  }
  function wirePatients() {
    M.$("#btn-add-patient").addEventListener("click", () => openPatientModal(null));
    M.$("#search-patient").addEventListener("input", renderPatients);
  }
  function wireRx() {
    M.$("#btn-add-rx").addEventListener("click", () => openRxModal(null));
    M.$("#search-rx").addEventListener("input", renderRx);
    M.$("#filter-rx-status").addEventListener("change", renderRx);
    M.$("#filter-rx-date").addEventListener("change", renderRx);
  }
  function wireHistory() {
    M.$("#search-history").addEventListener("input", renderHistory);
    M.$("#btn-export-history").addEventListener("click", onExportHistory);
  }
  function wireNotifications() {
    M.$("#btn-mark-all-read").addEventListener("click", onMarkAllRead);
    M.$("#btn-clear-notif").addEventListener("click", onClearNotif);
  }
  function wireDashboard() {
    setInterval(checkReminders, 60000);
  }
  function wireReports() {
    M.$("#btn-export-pdf").addEventListener("click", onExportPdf);
  }
  function wireSettings() {
    M.$("#setting-otp").addEventListener("change", onSettingOtp);
    M.$("#setting-lang").addEventListener("change", onSettingLang);
    M.$("#setting-notif").addEventListener("change", onSettingNotif);
    M.$("#btn-change-pw").addEventListener("click", onChangePw);
    M.$("#btn-backup").addEventListener("click", onBackup);
    M.$("#btn-restore").addEventListener("click", () => M.$("#input-restore").click());
    M.$("#input-restore").addEventListener("change", onRestore);
    M.$("#btn-sync").addEventListener("click", onSync);
    M.$("#btn-logout").addEventListener("click", () => { if (confirm("Đăng xuất?")) M.exitApp(); });
  }

})(MedCare);
`;

// Extract function bodies - the port script is too fragile. Use simpler approach: wrap entire source
const simple = `/**
 * MedCare bundle — toàn bộ logic app (tương thích cod1/COD1-XXX.js)
 */
(function (M) {
  const appSource = function () {
${fs.readFileSync(path.join(__dirname, "../js/modules/_bundle-source.js"), "utf8")
  .replace(/^\(function \(\) \{[\r\n]+\s*"use strict";[\r\n]+/m, "")
  .replace(/[\r\n]+\s*init\(\);[\r\n]+\}\)\(\);[\r\n]*$/m, "")
  .split("\n")
  .map((line) => "    " + line)
  .join("\n")}
  };
  M.Modules = M.Modules || {};
  M.Modules.bundle = {
    init() {
      const $ = (sel, root) => M.$(sel, root);
      const $$ = (sel, root) => M.$$(sel, root);
      window.__medcare_run = appSource;
      appSource();
    },
    initPart(id) { console.info("[COD1] " + id); },
  };
})(MedCare);
`;

fs.writeFileSync(path.join(__dirname, "../js/modules/bundle.js"), simple, "utf8");
console.log("Wrote bundle.js (wrapper)");
