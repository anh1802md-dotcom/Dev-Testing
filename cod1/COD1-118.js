/**
 * COD1-118 — Cài đặt ngôn ngữ
 * Nhóm: settings
 * Logic: js/modules/bundle.js (tìm comment hoặc hàm liên quan)
 */
(function (M) {
  "use strict";
  M.register("COD1-118", function () {
    if (M.Modules && M.Modules.bundle) {
      M.Modules.bundle.initPart("COD1-118");
    }
    M.markLoaded("COD1-118");
  });
})(MedCare);
