/**
 * COD1-89 — Bật xác thực OTP
 * Nhóm: settings
 * Logic: js/modules/bundle.js (tìm comment hoặc hàm liên quan)
 */
(function (M) {
  "use strict";
  M.register("COD1-89", function () {
    if (M.Modules && M.Modules.bundle) {
      M.Modules.bundle.initPart("COD1-89");
    }
    M.markLoaded("COD1-89");
  });
})(MedCare);
