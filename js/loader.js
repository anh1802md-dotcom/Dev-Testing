/**
 * Tự động nạp script theo cod1/load-order.js
 */
(function () {
  const scripts = window.COD1_LOAD_ORDER || [
    "js/storage.js",
    "js/core.js",
    "js/i18n.js",
    "js/modules/bundle.js",
    "js/main.js",
  ];
  let i = 0;
  function next() {
    if (i >= scripts.length) return;
    const s = document.createElement("script");
    s.src = scripts[i++];
    s.onload = next;
    s.onerror = () => {
      console.error("Failed to load:", scripts[i - 1]);
      next();
    };
    document.head.appendChild(s);
  }
  next();
})();
