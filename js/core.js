/**
 * MedCare — Core (dùng chung cho mọi file cod1/COD1-XXX.js)
 */
window.MedCare = {
  charts: { doses: null, meds: null },
  _inited: {},
  _aliases: {},

  $(sel, root) {
    return (root || document).querySelector(sel);
  },
  $$(sel, root) {
    return [...(root || document).querySelectorAll(sel)];
  },

  toast(msg, type) {
    const el = this.$("#toast");
    const msgEl = this.$("#toast-msg");
    const iconEl = this.$("#toast-icon");
    if (!el || !msgEl) return;
    const kind = type || "success";
    const icons = { success: "✓", info: "ℹ", warn: "!", error: "✕" };
    if (iconEl) iconEl.textContent = icons[kind] || icons.success;
    el.className = "toast toast-" + kind;
    msgEl.textContent = msg;
    el.classList.remove("hidden");
    requestAnimationFrame(() => el.classList.add("toast-visible"));
    clearTimeout(this.toast._t);
    this.toast._t = setTimeout(() => {
      el.classList.remove("toast-visible");
      setTimeout(() => el.classList.add("hidden"), 220);
    }, 2800);
  },

  _confirmResolve: null,

  confirm(opts) {
    const o = typeof opts === "string" ? { message: opts } : (opts || {});
    const title = o.title || "Xác nhận";
    const message = o.message || "";
    const confirmText = o.confirmText || (this.t ? this.t("common.confirm") : "Xác nhận");
    const cancelText = o.cancelText || (this.t ? this.t("common.cancel") : "Hủy");
    const variant = o.variant || "default";

    const dialog = this.$("#confirm-dialog");
    const panel = dialog?.querySelector(".confirm-panel");
    const ring = this.$("#confirm-icon-ring");
    const icon = this.$("#confirm-icon");
    const titleEl = this.$("#confirm-title");
    const msgEl = this.$("#confirm-message");
    const okBtn = this.$("#confirm-ok");
    const cancelBtn = this.$("#confirm-cancel");
    if (!dialog || !panel) return Promise.resolve(false);

    const icons = {
      default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      danger: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
      delete: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    };

    panel.className = "confirm-panel confirm-" + variant;
    if (ring) ring.className = "confirm-icon-ring confirm-ring-" + variant;
    if (icon) icon.innerHTML = o.iconHtml || icons[variant] || icons.default;
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;
    if (okBtn) okBtn.textContent = confirmText;
    if (cancelBtn) cancelBtn.textContent = cancelText;

    dialog.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => dialog.classList.add("confirm-visible"));
    okBtn?.focus();

    return new Promise((resolve) => {
      this._confirmResolve = resolve;
    });
  },

  closeConfirm(result) {
    const dialog = this.$("#confirm-dialog");
    if (!dialog) return;
    dialog.classList.remove("confirm-visible");
    setTimeout(() => {
      dialog.classList.add("hidden");
      const modalOpen = this.$("#modal") && !this.$("#modal").classList.contains("hidden");
      if (!modalOpen) document.body.style.overflow = "";
    }, 200);
    if (this._confirmResolve) {
      this._confirmResolve(!!result);
      this._confirmResolve = null;
    }
  },

  esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  },

  data() {
    return MedStore.get();
  },
  persist() {
    MedStore.save(this.data());
  },

  syncApiUser(apiUser) {
    if (!apiUser?.id) return null;
    const d = this.data();
    const normalized = {
      id: apiUser.id,
      email: apiUser.email,
      name: apiUser.name,
      role: apiUser.role,
      department: apiUser.department || "",
      title: apiUser.title || (apiUser.role === "admin" ? "Quản trị viên" : apiUser.role === "user" ? "Bệnh nhân" : "Bác sĩ"),
      otpEnabled: false,
      lang: "vi",
      notifEnabled: true,
      soundEnabled: true,
      createdAt: apiUser.createdAt || new Date().toISOString(),
    };
    let idx = d.users.findIndex((u) => u.id === normalized.id);
    if (idx < 0) idx = d.users.findIndex((u) => u.email === normalized.email);
    if (idx >= 0) Object.assign(d.users[idx], normalized);
    else d.users.push(normalized);
    return normalized;
  },

  syncApiUsers(list) {
    (list || []).forEach((u) => this.syncApiUser(u));
  },

  applyApiSession(token, apiUser) {
    this.syncApiUser(apiUser);
    const d = this.data();
    d.session = {
      userId: apiUser.id,
      loginAt: new Date().toISOString(),
      token,
      source: "api",
    };
    this.persist();
  },

  async syncAllFromApi() {
    if (!this.data().session?.token || this.isUser()) return false;
    try {
      return await MedSync.pullAll();
    } catch (err) {
      console.warn("[MedCare] syncAllFromApi:", err.message);
      return false;
    }
  },

  async syncPatientsFromApi() {
    return this.syncAllFromApi();
  },

  currentUser() {
    const d = this.data();
    if (!d.session) return null;
    return d.users.find((u) => u.id === d.session.userId) || null;
  },
  isAdmin() {
    const u = this.currentUser();
    return u?.role === "admin";
  },
  isDoctor() {
    const u = this.currentUser();
    return u?.role === "doctor";
  },
  isUser() {
    const u = this.currentUser();
    return u?.role === "user";
  },
  canManagePatients() {
    const u = this.currentUser();
    return u && (u.role === "admin" || u.role === "doctor");
  },
  roleLabel(role) {
    if (role === "admin") return this.t ? this.t("role.admin") : "Quản trị viên";
    if (role === "doctor") return this.t ? this.t("role.doctor") : "Bác sĩ";
    if (role === "user") return "Bệnh nhân";
    return role || "—";
  },
  patientDoctor(p) {
    if (!p?.doctorId) return null;
    return this.data().users.find((u) => u.id === p.doctorId) || null;
  },
  canManagePatient(p) {
    const u = this.currentUser();
    if (!u || !p) return false;
    if (u.role === "admin") return true;
    if (u.role !== "doctor") return false;
    return p.doctorId === u.id;
  },
  isTreatmentComplete(patientId) {
    const rx = (this.data().prescriptions || []).filter((r) => r.patientId === patientId);
    if (!rx.length) return true;
    return rx.every((r) => r.status === "done");
  },
  getPatientManageBlock(p) {
    const u = this.currentUser();
    if (!u || u.role === "admin" || !p) return null;
    if (!p.doctorId || p.doctorId === u.id) return null;
    const doc = this.patientDoctor(p);
    return { doctorId: p.doctorId, doctorName: doc?.name || p.doctorName || "—" };
  },
  claimPatient(p) {
    const u = this.currentUser();
    if (!u || u.role !== "doctor" || !p) return { ok: false };
    const block = this.getPatientManageBlock(p);
    if (block) return { ok: false, block };
    if (!p.doctorId) {
      p.doctorId = u.id;
      p.doctorName = u.name;
      this.persist();
      MedSync.run(() => MedSync.patchPatient(p.id, { doctorId: u.id }));
      return { ok: true, claimed: true };
    }
    return { ok: true, claimed: false };
  },
  releasePatient(p) {
    const u = this.currentUser();
    if (!u || u.role !== "doctor" || !p) return { ok: false };
    if (p.doctorId !== u.id) return { ok: false, reason: "not_manager" };
    delete p.doctorId;
    delete p.doctorName;
    this.persist();
    MedSync.run(() => MedSync.patchPatient(p.id, { doctorId: null }));
    return { ok: true };
  },
  adminSetPatientDoctor(p, doctorId) {
    const u = this.currentUser();
    if (!u || u.role !== "admin" || !p) return { ok: false };
    if (!doctorId) {
      delete p.doctorId;
      delete p.doctorName;
      this.persist();
      MedSync.run(() => MedSync.patchPatient(p.id, { doctorId: null }));
      return { ok: true, released: true };
    }
    const doc = this.data().users.find((x) => x.id === doctorId && x.role === "doctor");
    if (!doc) return { ok: false, reason: "invalid_doctor" };
    p.doctorId = doc.id;
    p.doctorName = doc.name;
    this.persist();
    MedSync.run(() => MedSync.patchPatient(p.id, { doctorId: doc.id }));
    return { ok: true, doctorName: doc.name };
  },
  patientById(id) {
    return this.data().patients.find((p) => p.id === id);
  },
  rxById(id) {
    return this.data().prescriptions.find((r) => r.id === id);
  },

  state: { pendingForgotEmail: null, selectedPatientId: null },

  TITLES: {
    home: ["Trang chủ", "Dashboard tổng quan"],
    patients: ["Bệnh nhân", "Quản lý hồ sơ"],
    "patient-detail": ["Chi tiết BN", "Hồ sơ & bệnh án"],
    records: ["Hồ sơ bệnh án", "Chẩn đoán & điều trị"],
    rx: ["Toa thuốc", "Danh sách & lịch nhắc"],
    schedule: ["Lịch nhắc", "Giờ uống thuốc hôm nay"],
    history: ["Lịch sử", "Theo dõi uống thuốc"],
    reports: ["Báo cáo", "Thống kê & biểu đồ"],
    notifications: ["Thông báo", "Nhắc & cảnh báo"],
    settings: ["Cài đặt", "Bảo mật & đồng bộ"],
    "user-home": ["Trang chủ", "Cổng bệnh nhân"],
    "user-meds": ["Toa thuốc", "Thuốc của tôi"],
    "user-schedule": ["Lịch nhắc", "Giờ uống thuốc"],
  },

  register(id, fn) {
    this._inited[id] = fn;
  },
  alias(id, primaryId) {
    this._aliases[id] = primaryId;
  },
  markLoaded(id) {
    console.info("[MedCare] Loaded " + id);
  },

  openModal(title, bodyHtml, footHtml) {
    this.$("#modal-title").textContent = title;
    this.$("#modal-body").innerHTML = bodyHtml;
    this.$("#modal-foot").innerHTML = footHtml || "";
    this.$("#modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  },
  closeModal() {
    this.$("#modal").classList.add("hidden");
    document.body.style.overflow = "";
  },

  setView(name) {
    this.$$(".view").forEach((v) => v.classList.remove("active"));
    const view = this.$("#view-" + name);
    if (view) view.classList.add("active");
    const subViews = ["schedule", "history", "records", "reports", "patient-detail"];
    this.$$(".nav-item").forEach((n) =>
      n.classList.toggle(
        "active",
        n.dataset.view === name ||
          (name === "schedule" && n.dataset.view === "home") ||
          (subViews.includes(name) && n.dataset.view === "patients" && name === "patient-detail") ||
          (subViews.includes(name) && n.dataset.view === "rx" && name === "schedule")
      )
    );
    if (name === "home" && this.Dashboard) {
      if (!this.isUser() && this.data().session?.source === "api") {
        this.syncAllFromApi().finally(() => this.Dashboard.render());
      } else {
        this.Dashboard.render();
      }
      return;
    }
    if (name === "patients" && this.Patients) {
      if (!this.isUser() && this.data().session?.source === "api") {
        this.syncAllFromApi().finally(() => this.Patients.render());
      } else {
        this.Patients.render();
      }
      return;
    }
    if (name === "rx" && this.Rx) this.Rx.render();
    if (name === "schedule" && this.Reminders) this.Reminders.renderSchedule();
    if (name === "reports" && this.Reports) this.Reports.renderCharts();
    if (name === "notifications" && this.Notifications) this.Notifications.render();
    if (name === "settings" && this.Settings) this.Settings.render();
    if (name === "records" && this.Records) this.Records.render();
    if (name === "history" && this.History) this.History.render();
    if (name === "patient-detail" && this.Patients) this.Patients.renderDetail();
    if (name === "user-home" && this.UserPortal) this.UserPortal.renderHome();
    if (name === "user-meds" && this.UserPortal) this.UserPortal.renderMeds();
    if (name === "user-schedule" && this.UserPortal) this.UserPortal.renderSchedule();
  },

  enterApp() {
    this.$("#screen-auth").classList.remove("active");
    this.$("#screen-app").classList.add("active");
    const userMode = this.isUser();
    document.body.classList.toggle("mode-user", userMode);
    document.body.classList.toggle("mode-staff", !userMode);
    if (this.$("#nav-staff")) this.$("#nav-staff").classList.toggle("hidden", userMode);
    if (this.$("#nav-user")) this.$("#nav-user").classList.toggle("hidden", !userMode);
    this.updateHeaderUser();
    if (this.applyI18n) this.applyI18n();
    if (userMode) {
      this.setView("user-home");
      if (this.UserPortal) this.UserPortal.renderAll();
    } else {
      this.setView("home");
      const renderStaff = () => this.renderAll();
      if (this.data().session?.source === "api") {
        this.syncAllFromApi().finally(renderStaff);
      } else {
        renderStaff();
      }
    }
    if (this.Reminders) this.Reminders.check();
  },

  updateHeaderUser() {
    const u = this.currentUser();
    if (!u) return;
    const h = new Date().getHours();
    const greet = h < 12 ? this.t("greet.morning") : h < 18 ? this.t("greet.afternoon") : this.t("greet.evening");
    const dg = this.$("#dash-greeting");
    if (dg) dg.textContent = greet;
    const dd = this.$("#dash-doctor");
    if (dd) {
      const dept = u.department ? " · " + u.department : "";
      dd.textContent = u.name + dept;
    }
  },

  exitApp() {
    const d = this.data();
    d.session = null;
    this.persist();
    MedStore.log("Đăng xuất");
    this.$("#screen-app").classList.remove("active");
    this.$("#screen-auth").classList.add("active");
    if (this.Auth) this.Auth.showForm("login");
  },

  renderAll() {
    if (this.Dashboard) this.Dashboard.render();
    if (this.Patients) this.Patients.render();
    if (this.Records) this.Records.render();
    if (this.Rx) this.Rx.render();
    if (this.History) this.History.render();
    if (this.Notifications) this.Notifications.updateBadge();
  },

  todayKey() {
    return new Date().toISOString().slice(0, 10);
  },

  downloadJson(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },
};

function initModalClose() {
  const modal = document.getElementById("modal");
  if (!modal || modal.dataset.closeBound) return;
  modal.dataset.closeBound = "1";
  modal.addEventListener("click", (e) => {
    if (e.target.closest(".modal-close") || e.target.classList.contains("modal-backdrop")) {
      MedCare.closeModal();
    }
  });
}

function initConfirmDialog() {
  const dialog = document.getElementById("confirm-dialog");
  if (!dialog || dialog.dataset.bound) return;
  dialog.dataset.bound = "1";
  dialog.querySelector("#confirm-ok")?.addEventListener("click", () => MedCare.closeConfirm(true));
  dialog.querySelector("#confirm-cancel")?.addEventListener("click", () => MedCare.closeConfirm(false));
  dialog.querySelector(".confirm-close")?.addEventListener("click", () => MedCare.closeConfirm(false));
  dialog.querySelector(".confirm-backdrop")?.addEventListener("click", () => MedCare.closeConfirm(false));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const modal = document.getElementById("modal");
    const confirm = document.getElementById("confirm-dialog");
    if (confirm && !confirm.classList.contains("hidden")) {
      MedCare.closeConfirm(false);
      return;
    }
    if (modal && !modal.classList.contains("hidden")) MedCare.closeModal();
  });
}

function initOverlays() {
  initModalClose();
  initConfirmDialog();
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOverlays);
} else {
  initOverlays();
}
