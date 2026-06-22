/**
 * COD1-87 — Gửi push notification
 * Nhóm: notifications
 * Logic: js/modules/bundle.js (tìm comment hoặc hàm liên quan)
 */
(function (M) {
  "use strict";
  M.register("COD1-87", function () {
    if (M.Modules && M.Modules.bundle) {
      M.Modules.bundle.initPart("COD1-87");
    }
    M.markLoaded("COD1-87");
  });
})(MedCare);
