/**
 * COD1-108 — Đánh dấu đã đọc
 * Nhóm: notifications
 * Logic: js/modules/bundle.js (tìm comment hoặc hàm liên quan)
 */
(function (M) {
  "use strict";
  M.register("COD1-108", function () {
    if (M.Modules && M.Modules.bundle) {
      M.Modules.bundle.initPart("COD1-108");
    }
    M.markLoaded("COD1-108");
  });
})(MedCare);
