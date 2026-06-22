/**
 * MedCare — Khởi động app + nạp từng task COD1-XXX
 */
(function () {
  "use strict";

  function codNum(id) {
    return parseInt(id.replace("COD1-", ""), 10);
  }

  const ids = Object.keys(MedCare._inited).sort((a, b) => codNum(a) - codNum(b));
  ids.forEach((id) => {
    try {
      MedCare._inited[id]();
    } catch (e) {
      console.error("COD1 init error:", id, e);
    }
  });

  if (MedCare.Modules.bundle) {
    MedCare.Modules.bundle.init();
  }

  console.info("[MedCare] Ready — " + ids.length + " COD1 modules registered");
})();
