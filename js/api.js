/**
 * MedCare — REST API client (backend SQL Server)
 */
const MedApi = (function () {
  const DEFAULT_LOCAL = "http://localhost:5000";
  const FETCH_TIMEOUT_MS = 4000;

  function resolveBase() {
    try {
      if (typeof window !== "undefined" && window.MEDCARE_CONFIG?.apiBase) {
        const cfg = String(window.MEDCARE_CONFIG.apiBase).trim().replace(/\/$/, "");
        if (cfg) return cfg;
      }
    } catch (_) {}
    try {
      const stored = localStorage.getItem("medcare_api_base");
      if (stored && stored.trim()) return stored.trim().replace(/\/$/, "");
    } catch (_) {}
    if (typeof location === "undefined") return DEFAULT_LOCAL;
    const host = location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return DEFAULT_LOCAL;
    // Trang public (Render, GitHub Pages...) — offline/localStorage trừ khi cấu hình API URL
    return "";
  }

  const BASE = resolveBase();

  function networkError() {
    const err = new Error("Không kết nối được API. Hãy chạy backend: cd backend && npm start");
    err.code = "NETWORK";
    return err;
  }

  function getToken() {
    try {
      return MedStore.get().session?.token || "";
    } catch (_) {
      return "";
    }
  }

  async function request(path, options = {}) {
    if (typeof window !== "undefined" && window.__MEDCARE_E2E__) {
      throw networkError();
    }
    if (!BASE) {
      throw networkError();
    }
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (BASE.includes("ngrok")) {
      headers["ngrok-skip-browser-warning"] = "true";
    }
    if (!options.noAuth) {
      const token = getToken();
      if (token) headers.Authorization = "Bearer " + token;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(BASE + path, {
        method: options.method || "GET",
        headers,
        body: options.body,
        signal: ctrl.signal,
      });
    } catch (_) {
      throw networkError();
    } finally {
      clearTimeout(timer);
    }

    let json = {};
    try {
      json = await res.json();
    } catch (_) {}

    if (!res.ok) {
      const err = new Error(json.message || json.error || "Lỗi API " + res.status);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  }

  return {
    BASE,
    resolveBase,
    getToken,
    health: () => request("/api/health", { noAuth: true }),
    login: (email, password) =>
      request("/api/auth/login", {
        method: "POST",
        noAuth: true,
        body: JSON.stringify({ email, password }),
      }),
    register: (payload) =>
      request("/api/auth/register", {
        method: "POST",
        noAuth: !getToken(),
        body: JSON.stringify(payload),
      }),
    me: () => request("/api/auth/me"),
    listUsers: () => request("/api/users"),
    getUser: (id) => request("/api/users/" + encodeURIComponent(id)),
    updateUser: (id, body) =>
      request("/api/users/" + encodeURIComponent(id), {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    deleteUser: (id) => request("/api/users/" + encodeURIComponent(id), { method: "DELETE" }),
    getPortal: () => request("/api/portal"),
    listPatients: (query) => {
      const qs = query ? "?" + new URLSearchParams(query).toString() : "";
      return request("/api/patients" + qs);
    },
    getPatient: (id) => request("/api/patients/" + encodeURIComponent(id)),
    createPatient: (body) =>
      request("/api/patients", { method: "POST", body: JSON.stringify(body) }),
    updatePatient: (id, body) =>
      request("/api/patients/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify(body) }),
    deletePatient: (id) =>
      request("/api/patients/" + encodeURIComponent(id), { method: "DELETE" }),
    listPrescriptions: (query) => {
      const qs = query ? "?" + new URLSearchParams(query).toString() : "";
      return request("/api/prescriptions" + qs);
    },
    createPrescription: (body) =>
      request("/api/prescriptions", { method: "POST", body: JSON.stringify(body) }),
    updatePrescription: (id, body) =>
      request("/api/prescriptions/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify(body) }),
    deletePrescription: (id) =>
      request("/api/prescriptions/" + encodeURIComponent(id), { method: "DELETE" }),
    listMedicalRecords: (query) => {
      const qs = query ? "?" + new URLSearchParams(query).toString() : "";
      return request("/api/medical-records" + qs);
    },
    createMedicalRecord: (body) =>
      request("/api/medical-records", { method: "POST", body: JSON.stringify(body) }),
    updateMedicalRecord: (id, body) =>
      request("/api/medical-records/" + encodeURIComponent(id), { method: "PUT", body: JSON.stringify(body) }),
    deleteMedicalRecord: (id) =>
      request("/api/medical-records/" + encodeURIComponent(id), { method: "DELETE" }),
    listNotifications: () => request("/api/notifications"),
    createNotification: (body) =>
      request("/api/notifications", { method: "POST", body: JSON.stringify(body) }),
    markNotifRead: (id) =>
      request("/api/notifications/" + encodeURIComponent(id) + "/read", { method: "PATCH" }),
    deleteNotification: (id) =>
      request("/api/notifications/" + encodeURIComponent(id), { method: "DELETE" }),
    addHistory: (body) =>
      request("/api/history", { method: "POST", body: JSON.stringify(body) }),
    syncReminders: (rxId, body) =>
      request("/api/reminders/rx/" + encodeURIComponent(rxId), { method: "PUT", body: JSON.stringify(body) }),
    syncAll: () => request("/api/sync"),
  };
})();
