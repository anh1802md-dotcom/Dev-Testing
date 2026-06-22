/**
 * Điều hướng — hỗ trợ COD1-84 (mở báo cáo), COD1-107 (thông báo)
 */
(function (M) {
  M.Modules = M.Modules || {};
  M.Modules.nav = {
    init() {
      M.$$(".nav-item").forEach((btn) => {
        btn.addEventListener("click", () => {
          if (btn.dataset.view === "more") {
            M.$("#more-sheet").classList.toggle("hidden");
            return;
          }
          M.setView(btn.dataset.view);
        });
      });
      M.$$("[data-goto]").forEach((btn) => {
        btn.addEventListener("click", () => M.setView(btn.dataset.goto));
      });
      M.$(".sheet-backdrop")?.addEventListener("click", () => M.$("#more-sheet").classList.add("hidden"));
      M.$("#btn-notif-bell").addEventListener("click", () => M.setView("notifications"));
    },
    initPart() {},
  };
})(MedCare);
