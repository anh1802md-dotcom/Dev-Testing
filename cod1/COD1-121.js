/**
 * COD1-121 — Cài đặt thông báo
 * Nhóm: settings
 * Logic: js/modules/bundle.js (tìm comment hoặc hàm liên quan)
 */
(function (M) {
  "use strict";
  M.register("COD1-121", function () {
    if (M.Modules && M.Modules.bundle) {
      M.Modules.bundle.initPart("COD1-121");
    }
    M.markLoaded("COD1-121");
  });
})(MedCare);
