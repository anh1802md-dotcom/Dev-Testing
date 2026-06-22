/**
 * COD1-85 — Xuất báo cáo PDF
 * Nhóm: reports
 * Logic: js/modules/bundle.js (tìm comment hoặc hàm liên quan)
 */
(function (M) {
  "use strict";
  M.register("COD1-85", function () {
    if (M.Modules && M.Modules.bundle) {
      M.Modules.bundle.initPart("COD1-85");
    }
    M.markLoaded("COD1-85");
  });
})(MedCare);
