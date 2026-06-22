/**
 * MedCare — Toàn bộ logic nghiệp vụ
 * Mỗi cod1/COD1-XXX.js gọi M.Modules.bundle.initPart('COD1-XX') để đánh dấu task Jira.
 * Xem COD1-MAPPING.md để biết file COD1 ↔ chức năng.
 */
(function (M) {
  M.Modules = M.Modules || {};

  M.Modules.bundle = {
    init() {
      const $ = (sel, root) => M.$(sel, root);
      const $$ = (sel, root) => M.$$(sel, root);
      const toast = (msg, type) => M.toast(msg, type);
      const t = (key, params) => M.t(key, params);
      const appConfirm = (opts) => M.confirm(opts);
      const esc = (s) => M.esc(s);
      const data = () => M.data();
      const persist = () => M.persist();
      const currentUser = () => M.currentUser();
      const patientById = (id) => M.patientById(id);
      const rxById = (id) => M.rxById(id);
      const openModal = (t, b, f) => M.openModal(t, b, f);
      const closeModal = () => M.closeModal();
      const setView = (n) => M.setView(n);
      const enterApp = () => M.enterApp();
      const exitApp = () => M.exitApp();
      const renderAll = () => M.renderAll();
      const todayKey = () => M.todayKey();
      const downloadJson = (o, f) => M.downloadJson(o, f);

      let chartDoses = null;
      let chartMeds = null;
      let pendingForgotEmail = null;
      let historyStatusFilter = "";
      let scheduleStatusFilter = "";
      let patientDetailTab = "info";
      let patientStatusFilter = "";
      let notifFilter = "all";

      function calcAge(birth) {
        if (!birth) return "—";
        const b = new Date(birth);
        const t = new Date();
        let age = t.getFullYear() - b.getFullYear();
        const m = t.getMonth() - b.getMonth();
        if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
        return age;
      }

      function timeAgo(iso) {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return t("time.justNow");
        if (mins < 60) return t("time.ago", { n: mins });
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return t("time.agoHours", { n: hrs });
        return t("time.agoDays", { n: Math.floor(hrs / 24) });
      }

      function formatDateVi(d) {
        if (!d) return "—";
        const p = String(d).split("-");
        return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : d;
      }

      function statusBadge(status) {
        if (!status || status === "pending") return `<span class="status-badge status-pending">${t("status.pending")}</span>`;
        const map = { stable: ["status.stable", "status-stable"], monitoring: ["status.monitoring", "status-monitoring"], emergency: ["status.emergency", "status-emergency"] };
        const pair = map[status] || map.stable;
        return `<span class="status-badge ${pair[1]}">${t(pair[0])}</span>`;
      }

      function patientDoctorBadge(p) {
        if (!p.doctorId) return `<span class="patient-doctor-badge unassigned">${t("patient.unassigned")}</span>`;
        const name = p.doctorName || M.patientDoctor(p)?.name || "—";
        const isMine = currentUser()?.id === p.doctorId;
        return `<span class="patient-doctor-badge${isMine ? " mine" : ""}">${t("patient.managedBy")}: ${esc(name)}</span>`;
      }

      function blockPatientManage(p) {
        const block = M.getPatientManageBlock(p);
        if (!block) return false;
        toast(t("patient.alreadyManaged", { doctor: block.doctorName }), "warn");
        return true;
      }

      function tryOpenPatient(patientId) {
        return !!patientById(patientId);
      }

      function confirmClaimPatient(patientId) {
        if (!M.isDoctor()) return;
        const p = patientById(patientId);
        if (!p) return;
        if (p.doctorId && p.doctorId !== currentUser()?.id) {
          toast(t("patient.alreadyManaged", { doctor: p.doctorName || M.patientDoctor(p)?.name || "—" }), "warn");
          return;
        }
        if (p.doctorId === currentUser()?.id) return;
        appConfirm({
          title: t("patient.claimManage"),
          message: t("patient.claimConfirm", { name: p.name }),
          variant: "success",
          confirmText: t("patient.claimManage"),
        }).then((ok) => {
          if (!ok) return;
          const result = M.claimPatient(p);
          if (!result.ok) {
            toast(t("patient.alreadyManaged", { doctor: result.block.doctorName }), "warn");
            return;
          }
          MedStore.log((currentUser()?.name || "BS") + " xác nhận quản lý BN: " + p.name);
          toast(t("toast.patientClaimed"));
          renderPatients();
          renderRecentPatients();
          renderPatientDetail();
        });
      }

      function confirmReleasePatient(patientId) {
        if (!M.isDoctor()) return;
        const p = patientById(patientId);
        if (!p || p.doctorId !== currentUser()?.id) return;
        appConfirm({
          title: t("patient.releaseManage"),
          message: t("patient.releaseConfirm", { name: p.name }),
          variant: "warning",
          confirmText: t("patient.releaseManage"),
        }).then((ok) => {
          if (!ok) return;
          const result = M.releasePatient(p);
          if (!result.ok) return;
          MedStore.log((currentUser()?.name || "BS") + " bỏ quản lý BN: " + p.name);
          toast(t("toast.patientReleased"));
          renderPatients();
          renderRecentPatients();
          renderPatientDetail();
        });
      }

      function confirmAdminReleasePatient(patientId) {
        if (!M.isAdmin()) return;
        const p = patientById(patientId);
        if (!p || !p.doctorId) return;
        appConfirm({
          title: t("patient.adminReleaseManage"),
          message: t("patient.adminReleaseConfirm", { name: p.name }),
          variant: "warning",
          confirmText: t("patient.adminReleaseManage"),
        }).then((ok) => {
          if (!ok) return;
          const result = M.adminSetPatientDoctor(p, null);
          if (!result.ok) return;
          MedStore.log("Admin bỏ quản lý BS cho BN: " + p.name);
          toast(t("toast.patientReleased"));
          renderPatients();
          renderRecentPatients();
          renderPatientDetail();
        });
      }

      function openAdminAssignDoctorModal(patientId) {
        if (!M.isAdmin()) return;
        const p = patientById(patientId);
        if (!p || !p.doctorId) return;
        const doctors = data().users.filter((u) => u.role === "doctor" && u.id !== p.doctorId);
        if (!doctors.length) {
          toast(t("patient.adminNoOtherDoctor"), "warn");
          return;
        }
        const options = doctors.map((doc) => {
          const dept = doc.department ? ` (${esc(doc.department)})` : "";
          return `<option value="${esc(doc.id)}">${esc(doc.name)}${dept}</option>`;
        }).join("");
        openModal(t("patient.adminAssignTitle"),
          `<form id="modal-form"><div class="form-field"><label>${t("patient.adminSelectDoctor")}</label><select name="doctorId" required>${options}</select></div></form>`,
          `<button type="button" class="btn btn-primary" id="modal-save">${t("patient.adminAssignDoctor")}</button><button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`);
        $("#modal-save").onclick = () => {
          const doctorId = $("#modal-form [name=doctorId]").value;
          const doc = doctors.find((d) => d.id === doctorId);
          if (!doc) return;
          closeModal();
          appConfirm({
            title: t("patient.adminAssignTitle"),
            message: t("patient.adminAssignConfirm", { doctor: doc.name, name: p.name }),
            variant: "success",
            confirmText: t("patient.adminAssignDoctor"),
          }).then((ok) => {
            if (!ok) return;
            const result = M.adminSetPatientDoctor(p, doctorId);
            if (!result.ok) {
              toast(t("patient.adminCannotChangeDoctor"), "warn");
              return;
            }
            MedStore.log("Admin thay BS " + doc.name + " cho BN: " + p.name);
            toast(t("toast.patientDoctorChanged"));
            renderPatients();
            renderRecentPatients();
            renderPatientDetail();
          });
        };
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      }

      function patientStatusConfirmBar(p) {
        if (!M.canManagePatients() || !M.canManagePatient(p)) return "";
        return `<div class="status-confirm-bar" data-stop-nav>
          <span class="status-confirm-label">${t("confirm.bsLabel")}</span>
          <button type="button" class="btn-confirm-status stable" data-confirm-pstatus="stable" data-pid="${p.id}">${t("status.stable")}</button>
          <button type="button" class="btn-confirm-status monitoring" data-confirm-pstatus="monitoring" data-pid="${p.id}">${t("status.monitoring")}</button>
          <button type="button" class="btn-confirm-status emergency" data-confirm-pstatus="emergency" data-pid="${p.id}">${t("status.emergency")}</button>
        </div>`;
      }

      function confirmPatientStatus(patientId, status) {
        if (!M.canManagePatients()) { toast("Chỉ bác sĩ mới xác nhận trạng thái", "warn"); return; }
        const p = patientById(patientId);
        if (!p) return;
        if (!M.canManagePatient(p)) {
          if (M.isDoctor() && !p.doctorId) toast(t("patient.needClaim"), "warn");
          else if (blockPatientManage(p)) { /* toast inside */ }
          else toast(t("patient.alreadyManaged", { doctor: p.doctorName || M.patientDoctor(p)?.name || "—" }), "warn");
          return;
        }
        const labels = { stable: t("status.stable"), monitoring: t("status.monitoring"), emergency: t("status.emergency") };
        const variants = { stable: "success", monitoring: "warning", emergency: "danger" };
        appConfirm({
          title: t("common.confirm"),
          message: `${labels[status]} — ${p.name}?`,
          variant: variants[status] || "success",
          confirmText: "Xác nhận",
        }).then((ok) => {
          if (!ok) return;
          const u = currentUser();
          p.status = status;
          p.statusConfirmedBy = u?.name || "";
          p.statusConfirmedAt = new Date().toISOString();
          p.updatedAt = new Date().toISOString();
          persist();
          MedSync.run(() => MedSync.savePatient(p, false));
          MedStore.log((u?.name || "BS") + " xác nhận BN " + p.name + ": " + labels[status]);
          renderPatients();
          renderRecentPatients();
          renderDashboard();
          if (M.state.selectedPatientId === patientId) renderPatientDetail();
          toast("Đã xác nhận: " + labels[status]);
        });
      }

      function rxStatusBadge(r) {
        if (r.runningOut && r.statusConfirmedBy) return `<span class="status-badge status-running-out">${t("status.runningOut")}</span>`;
        if (!r.status || r.status === "pending") return `<span class="status-badge status-pending">${t("status.pending")}</span>`;
        const map = { active: ["status.active", "status-active"], done: ["status.done", "status-done"], paused: ["status.paused", "status-paused"] };
        const pair = map[r.status] || map.active;
        return `<span class="status-badge ${pair[1]}">${t(pair[0])}</span>`;
      }

      function rxConfirmBar(r) {
        if (!M.canManagePatients()) return "";
        const p = patientById(r.patientId);
        if (!p || !M.canManagePatient(p)) return "";
        return `<div class="status-confirm-bar rx-confirm" data-stop-nav>
          <span class="status-confirm-label">${t("confirm.bsLabel")}</span>
          <button type="button" class="btn-confirm-status active" data-confirm-rx="active" data-rxid="${r.id}">${t("status.active")}</button>
          <button type="button" class="btn-confirm-status running-out" data-confirm-rx="running_out" data-rxid="${r.id}">${t("status.runningOut")}</button>
        </div>`;
      }

      function confirmRxStatus(rxId, type) {
        if (!M.canManagePatients()) { toast("Chỉ bác sĩ mới xác nhận trạng thái", "warn"); return; }
        const r = rxById(rxId);
        if (!r) return;
        if (!guardPatientById(r.patientId)) return;
        const label = type === "running_out" ? t("status.runningOut") : t("status.active");
        appConfirm({
          title: t("common.confirm"),
          message: `${label} — ${r.name}?`,
          variant: type === "running_out" ? "warning" : "success",
          confirmText: "Xác nhận",
        }).then((ok) => {
          if (!ok) return;
          const u = currentUser();
          if (type === "running_out") {
            r.runningOut = true;
            r.status = "active";
          } else {
            r.runningOut = false;
            r.status = "active";
          }
          r.statusConfirmedBy = u?.name || "";
          r.statusConfirmedAt = new Date().toISOString();
          syncRemindersForRx(r);
          persist();
          MedSync.run(() => MedSync.savePrescription(r, false));
          MedStore.log((u?.name || "BS") + " xác nhận toa " + r.name + ": " + label);
          renderRx();
          renderDashboard();
          if (M.state.selectedPatientId) renderPatientDetail();
          toast("Đã xác nhận: " + label);
        });
      }

      function isRxConfirmedActive(r) {
        return r.status === "active" && !!r.statusConfirmedBy;
      }

      function notifIconHtml(icon, type) {
        const key = icon || (type === "warn" ? "alert" : type === "reminder" ? "pill" : "info");
        const map = {
          pill: ["blue", "💊"], calendar: ["green", "📅"], doc: ["blue", "📄"],
          user: ["green", "👤"], alert: ["red", "!"], info: ["gray", "i"],
        };
        const pair = map[key] || map.info;
        return `<div class="notif-icon ${pair[0]}">${pair[1]}</div>`;
      }

      function showAuthForm(name) {
        ["form-login", "form-register", "form-forgot", "form-otp"].forEach((id) => {
          $("#" + id).classList.toggle("hidden", id !== "form-" + name);
        });
        $$(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.auth === name));
      }
      M.Auth = { showForm: showAuthForm };

      function patientCardHtml(p) {
        const ini = p.name.split(" ").map((w) => w[0]).join("").slice(0, 1).toUpperCase();
        const av = p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : ini;
        const age = calcAge(p.birth);
        const needsConfirm = !p.status || p.status === "pending" || !p.statusConfirmedBy;
        const locked = !!M.getPatientManageBlock(p);
        return `<article class="patient-card-v2${locked ? " patient-locked" : ""}" data-id="${p.id}">
          <div class="avatar">${av}</div>
          <div class="info">
            <div class="name">${esc(p.name)}</div>
            <div class="demographics">${t("patient.age", { n: age })} · ${esc(p.gender || "—")} · ${esc(p.department || "—")}</div>
            <div class="visit">${t("patient.visit")}: ${formatDateVi(p.lastVisit)}</div>
            ${patientDoctorBadge(p)}
            ${needsConfirm ? patientStatusConfirmBar(p) : ""}
          </div>
          <div class="right">
            <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            ${statusBadge(p.status)}
          </div>
        </article>`;
      }

      function renderPatients() {
        const q = ($("#search-patient")?.value || "").toLowerCase();
        let list = data().patients;
        if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.code || "").toLowerCase().includes(q) || (p.phone || "").includes(q) || (p.department || "").toLowerCase().includes(q));
        if (patientStatusFilter) list = list.filter((p) => p.status === patientStatusFilter);
        const countEl = $("#patient-count");
        if (countEl) countEl.textContent = t("patient.count", { n: data().patients.length });
        const el = $("#patient-list");
        if (!el) return;
        if (!list.length) {
          el.innerHTML = '<p class="list-empty-hint">' + t("empty.noPatients") + '</p>';
          return;
        }
        el.innerHTML = list.map((p) => patientCardHtml(p)).join("");
        el.querySelectorAll(".patient-card-v2").forEach((card) => {
          card.addEventListener("click", (e) => {
            if (e.target.closest("[data-stop-nav]")) return;
            openPatientDetail(card.dataset.id);
          });
        });
      }

      function renderRecentPatients() {
        const el = $("#recent-patients");
        if (!el) return;
        const list = [...data().patients].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
        if (!list.length) { el.innerHTML = '<p class="list-empty-hint">' + t("empty.noPatientsDash") + '</p>'; return; }
        el.innerHTML = list.map((p) => {
          const ini = p.name.split(" ").map((w) => w[0]).join("").slice(0, 1).toUpperCase();
          const av = p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : ini;
          const needsConfirm = !p.status || p.status === "pending" || !p.statusConfirmedBy;
          return `<div class="recent-item" data-id="${p.id}">
            <div class="avatar">${av}</div>
            <div class="recent-info">
              <div class="name">${esc(p.name)}</div>
              <div class="meta">${t("patient.age", { n: calcAge(p.birth) })} · ${timeAgo(p.updatedAt)}</div>
              ${patientDoctorBadge(p)}
              ${needsConfirm ? patientStatusConfirmBar(p) : ""}
            </div>
            ${statusBadge(p.status)}
          </div>`;
        }).join("");
        el.querySelectorAll(".recent-item").forEach((item) => {
          item.addEventListener("click", (e) => {
            if (e.target.closest("[data-stop-nav]")) return;
            openPatientDetail(item.dataset.id);
          });
        });
      }

      function patientAvatarHtml(p) {
        const ini = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        return p.avatar ? `<img src="${esc(p.avatar)}" alt="">` : ini;
      }

      function openPatientDetail(id) {
        if (!tryOpenPatient(id)) return;
        M.state.selectedPatientId = id;
        patientDetailTab = "info";
        setView("patient-detail");
      }

      function renderPatientDetail() {
        const id = M.state.selectedPatientId;
        const p = patientById(id);
        if (!p) {
          setView("patients");
          return;
        }
        const d = data();
        const rxCount = d.prescriptions.filter((r) => r.patientId === id).length;
        const recCount = (d.medicalRecords || []).filter((r) => r.patientId === id).length;
        const day = new Date().getDay();
        const remCount = d.reminders.filter((r) => {
          const rx = rxById(r.rxId);
          return r.patientId === id && r.active && r.days.includes(day) && rx && isRxConfirmedActive(rx);
        }).length;

        $("#patient-detail-hero").innerHTML = `
          <div class="avatar">${patientAvatarHtml(p)}</div>
          <div>
            <h3>${esc(p.name)}</h3>
            <p>${esc(p.code)} · ${esc(p.phone || "—")}</p>
            <div class="patient-hero-stats">
              <span class="patient-hero-stat"><strong>${recCount}</strong>${t("detail.records")}</span>
              <span class="patient-hero-stat"><strong>${rxCount}</strong>${t("detail.rxCount")}</span>
              <span class="patient-hero-stat"><strong>${remCount}</strong>${t("detail.remToday")}</span>
            </div>
          </div>`;

        $$("#patient-detail-tabs .detail-tab").forEach((t) => t.classList.toggle("active", t.dataset.ptab === patientDetailTab));
        $$("#view-patient-detail .detail-panel").forEach((panel) => panel.classList.remove("active"));
        const panelMap = { info: "#patient-tab-info", records: "#patient-tab-records", rx: "#patient-tab-rx" };
        $(panelMap[patientDetailTab])?.classList.add("active");

        const needsConfirm = !p.status || p.status === "pending" || !p.statusConfirmedBy;
        const block = M.getPatientManageBlock(p);
        const viewOnlyBanner = block
          ? `<div class="patient-view-only-banner">${t("patient.viewOnlyBanner", { doctor: esc(block.doctorName) })}</div>`
          : "";
        $("#patient-tab-info").innerHTML = `
          ${viewOnlyBanner}
          <dl class="detail-info-grid">
            <div class="detail-info-row"><dt>${t("patient.managedBy")}</dt><dd>${patientDoctorBadge(p)}</dd></div>
            <div class="detail-info-row"><dt>${t("detail.status")}</dt><dd>${statusBadge(p.status)}${p.statusConfirmedBy ? ` <small class="confirm-meta">— ${esc(p.statusConfirmedBy)}</small>` : ""}</dd></div>
            <div class="detail-info-row"><dt>${t("detail.code")}</dt><dd>${esc(p.code)}</dd></div>
            <div class="detail-info-row"><dt>${t("detail.birth")}</dt><dd>${esc(p.birth || "—")}</dd></div>
            <div class="detail-info-row"><dt>${t("detail.phone")}</dt><dd>${esc(p.phone || "—")}</dd></div>
            <div class="detail-info-row"><dt>${t("detail.note")}</dt><dd>${esc(p.note || "—")}</dd></div>
            <div class="detail-info-row"><dt>${t("detail.updated")}</dt><dd>${p.updatedAt ? new Date(p.updatedAt).toLocaleDateString(M.lang() === "en" ? "en-US" : "vi-VN") : "—"}</dd></div>
          </dl>
          ${needsConfirm ? patientStatusConfirmBar(p) : ""}`;

        const records = (d.medicalRecords || []).filter((r) => r.patientId === id);
        $("#patient-tab-records").innerHTML = records.length
          ? records.map((r) => recordCardHtml(r)).join("")
          : '<p class="list-empty-hint">' + t("empty.noRecords") + '</p>';
        $("#patient-tab-records").querySelectorAll(".record-card").forEach((c) => {
          c.addEventListener("click", () => showRecordDetail(c.dataset.id));
        });

        const rxList = d.prescriptions.filter((r) => r.patientId === id);
        $("#patient-tab-rx").innerHTML = rxList.length
          ? rxList.map((r) => {
              const needsRxConfirm = !r.statusConfirmedBy || r.status === "pending";
              return `<article class="rx-card" data-id="${r.id}"><div class="card-title">${esc(r.name)}</div><div class="card-meta">${esc(r.dosage)} · ${esc(r.frequency || "")}</div>${rxStatusBadge(r)}${needsRxConfirm ? rxConfirmBar(r) : ""}</article>`;
            }).join("")
          : '<p class="list-empty-hint">' + t("empty.noRx") + '</p>';
        $("#patient-tab-rx").querySelectorAll(".rx-card").forEach((c) => {
          c.addEventListener("click", () => showRxDetail(c.dataset.id));
        });

        const u = currentUser();
        const isAdmin = u?.role === "admin";
        const isDoctor = u?.role === "doctor";
        const isMine = isDoctor && p.doctorId === u.id;
        const canClaim = isDoctor && !p.doctorId;
        const treatmentDone = M.isTreatmentComplete(id);
        const canManage = M.canManagePatient(p);
        const canDelete = isAdmin || (isMine && treatmentDone);
        const canAdminAssign = isAdmin && !!p.doctorId;
        const canAdminRelease = isAdmin && !!p.doctorId;

        const show = (sel, visible) => {
          const btn = $(sel);
          if (btn) btn.style.display = visible ? "" : "none";
        };
        show("#btn-claim-patient-detail", canClaim);
        show("#btn-release-patient-detail", isMine);
        show("#btn-admin-assign-doctor-detail", canAdminAssign);
        show("#btn-admin-release-patient-detail", canAdminRelease);
        show("#btn-edit-patient-detail", canManage);
        show("#btn-add-record-detail", canManage);
        show("#btn-delete-patient-detail", canDelete);
      }

      function showPatientDetail(id) {
        openPatientDetail(id);
      }

      function patientForm(p) {
        return `<div class="form-field"><label>Mã BN</label><input name="code" value="${esc(p?.code || "")}" required></div>
          <div class="form-field"><label>Họ tên</label><input name="name" value="${esc(p?.name || "")}" required></div>
          <div class="form-row"><div class="form-field"><label>Giới tính</label><select name="gender"><option value="Nam" ${p?.gender === "Nam" ? "selected" : ""}>Nam</option><option value="Nữ" ${p?.gender === "Nữ" ? "selected" : ""}>Nữ</option></select></div>
          <div class="form-field"><label>Trạng thái (BS xác nhận)</label><select name="status"><option value="pending" ${!p?.status || p?.status === "pending" ? "selected" : ""}>— Chưa xác nhận —</option><option value="stable" ${p?.status === "stable" ? "selected" : ""}>Ổn định</option><option value="monitoring" ${p?.status === "monitoring" ? "selected" : ""}>Theo dõi</option><option value="emergency" ${p?.status === "emergency" ? "selected" : ""}>Khẩn cấp</option></select></div></div>
          <div class="form-field"><label>Chuyên khoa</label><input name="department" value="${esc(p?.department || "")}" placeholder="Tim mạch"></div>
          <div class="form-field"><label>Điện thoại</label><input name="phone" type="tel" value="${esc(p?.phone || "")}"></div>
          <div class="form-row"><div class="form-field"><label>Ngày sinh</label><input name="birth" type="date" value="${esc(p?.birth || "")}"></div>
          <div class="form-field"><label>Lần khám</label><input name="lastVisit" type="date" value="${esc(p?.lastVisit || new Date().toISOString().slice(0, 10))}"></div></div>
          <div class="form-field"><label>Ảnh đại diện</label><input name="avatarFile" type="file" accept="image/*"></div>
          <div class="form-field"><label>Ghi chú</label><textarea name="note">${esc(p?.note || "")}</textarea></div>`;
      }

      function savePatientFromForm(form, id) {
        const fd = new FormData(form);
        const d = data();
        const payload = { code: fd.get("code").trim(), name: fd.get("name").trim(), phone: fd.get("phone").trim(), birth: fd.get("birth"), gender: fd.get("gender"), department: fd.get("department").trim(), status: fd.get("status") || "pending", lastVisit: fd.get("lastVisit"), note: fd.get("note").trim() };
        const file = fd.get("avatarFile");
        const u = currentUser();
        const done = async () => {
          if (payload.status && payload.status !== "pending") {
            payload.statusConfirmedBy = u?.name || "";
            payload.statusConfirmedAt = new Date().toISOString();
          } else {
            payload.statusConfirmedBy = null;
            payload.statusConfirmedAt = null;
          }
          let patient;
          if (id) {
            const existing = patientById(id);
            if (!M.canManagePatient(existing)) {
              if (M.isDoctor() && !existing.doctorId) toast(t("patient.needClaim"), "warn");
              else toast(t("patient.alreadyManaged", { doctor: existing.doctorName || M.patientDoctor(existing)?.name || "—" }), "warn");
              return;
            }
            Object.assign(existing, payload, { updatedAt: new Date().toISOString() });
            patient = existing;
            MedStore.log("Cập nhật BN: " + existing.name);
            toast("Đã cập nhật hồ sơ");
          } else {
            patient = { id: MedStore.uid("p"), ...payload, avatar: payload.avatar || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            d.patients.push(patient);
            MedStore.log("Tạo BN: " + payload.name);
            toast(payload.status === "pending" ? "Đã tạo hồ sơ — chờ BS xác nhận trạng thái" : "Đã tạo hồ sơ");
          }
          persist();
          await MedSync.run(() => MedSync.savePatient(patient, !id));
          renderPatients();
          renderRecords();
          renderDashboard();
          if (M.state.selectedPatientId === id) renderPatientDetail();
          closeModal();
        };
        if (file && file.size) {
          const reader = new FileReader();
          reader.onload = () => { payload.avatar = reader.result; done(); };
          reader.readAsDataURL(file);
        } else {
          if (id) payload.avatar = patientById(id).avatar;
          done();
        }
      }

      function deletePatient(id) {
        const p = patientById(id);
        if (!p) return;
        if (!M.canManagePatient(p) && currentUser()?.role !== "admin") {
          if (M.isDoctor() && !p.doctorId) toast(t("patient.needClaim"), "warn");
          else toast(t("patient.alreadyManaged", { doctor: p.doctorName || M.patientDoctor(p)?.name || "—" }), "warn");
          return;
        }
        if (M.isDoctor() && !M.isTreatmentComplete(id)) {
          toast(t("patient.cannotDeleteActive"), "warn");
          return;
        }
        appConfirm({
          title: "Xóa hồ sơ bệnh nhân",
          message: `Xóa hồ sơ ${p.name} và toàn bộ dữ liệu liên quan? Hành động này không thể hoàn tác.`,
          variant: "delete",
          confirmText: "Xóa",
        }).then(async (ok) => {
          if (!ok) return;
          const d = data();
          d.patients = d.patients.filter((x) => x.id !== id);
          d.medicalRecords = (d.medicalRecords || []).filter((r) => r.patientId !== id);
          d.prescriptions = d.prescriptions.filter((r) => r.patientId !== id);
          d.reminders = d.reminders.filter((r) => r.patientId !== id);
          persist();
          await MedSync.run(() => MedSync.deletePatient(id));
          MedStore.log("Xóa BN: " + p.name);
          toast("Đã xóa hồ sơ");
          M.state.selectedPatientId = null;
          renderAll();
          setView("patients");
        });
      }

      function openPatientModal(id) {
        const p = id ? patientById(id) : null;
        if (p && !M.canManagePatient(p)) {
          if (M.isDoctor() && !p.doctorId) toast(t("patient.needClaim"), "warn");
          else toast(t("patient.alreadyManaged", { doctor: p.doctorName || M.patientDoctor(p)?.name || "—" }), "warn");
          return;
        }
        openModal(id ? "Cập nhật hồ sơ" : "Tạo hồ sơ bệnh nhân", `<form id="modal-form">${patientForm(p)}</form>`, `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button><button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`);
        $("#modal-save").onclick = () => savePatientFromForm($("#modal-form"), id);
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      }
      M.Patients = { render: renderPatients, openModal: openPatientModal, detail: showPatientDetail, renderDetail: renderPatientDetail, save: savePatientFromForm, delete: deletePatient };

      function recordCardHtml(r) {
        const p = patientById(r.patientId);
        return `<article class="record-card" data-id="${r.id}">
          <span class="record-date">${esc(r.visitDate || "—")}</span>
          <div class="card-title">${esc(r.title)}</div>
          <div class="record-diagnosis">${esc(r.diagnosis)}</div>
          <div class="card-meta">${esc(r.doctor || "—")}${p ? " · " + esc(p.name) : ""}</div>
        </article>`;
      }

      function recordForm(r, presetPatientId) {
        const patients = data().patients.map((p) => `<option value="${p.id}" ${(r?.patientId || presetPatientId) === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("");
        return `<div class="form-field"><label>Bệnh nhân</label><select name="patientId" required>${patients || "<option value=''>Chưa có BN</option>"}</select></div>
          <div class="form-field"><label>Tiêu đề</label><input name="title" value="${esc(r?.title || "")}" required placeholder="Khám định kỳ"></div>
          <div class="form-field"><label>Chẩn đoán</label><input name="diagnosis" value="${esc(r?.diagnosis || "")}" required></div>
          <div class="form-row"><div class="form-field"><label>Bác sĩ</label><input name="doctor" value="${esc(r?.doctor || "")}"></div><div class="form-field"><label>Ngày khám</label><input name="visitDate" type="date" value="${esc(r?.visitDate || new Date().toISOString().slice(0, 10))}"></div></div>
          <div class="form-field"><label>Triệu chứng</label><textarea name="symptoms">${esc(r?.symptoms || "")}</textarea></div>
          <div class="form-field"><label>Điều trị</label><textarea name="treatment">${esc(r?.treatment || "")}</textarea></div>
          <div class="form-field"><label>Chỉ số sinh tồn</label><input name="vitals" value="${esc(r?.vitals || "")}" placeholder="Huyết áp, đường huyết..."></div>
          <div class="form-field"><label>Ghi chú</label><textarea name="note">${esc(r?.note || "")}</textarea></div>`;
      }

      function guardPatientById(patientId) {
        const p = patientById(patientId);
        if (!p || M.canManagePatient(p)) return true;
        if (M.isDoctor() && !p.doctorId) toast(t("patient.needClaim"), "warn");
        else toast(t("patient.alreadyManaged", { doctor: p.doctorName || M.patientDoctor(p)?.name || "—" }), "warn");
        return false;
      }

      function saveRecordFromForm(form, id) {
        const fd = new FormData(form);
        const payload = {
          patientId: fd.get("patientId"),
          title: fd.get("title").trim(),
          diagnosis: fd.get("diagnosis").trim(),
          doctor: fd.get("doctor").trim(),
          visitDate: fd.get("visitDate"),
          symptoms: fd.get("symptoms").trim(),
          treatment: fd.get("treatment").trim(),
          vitals: fd.get("vitals").trim(),
          note: fd.get("note").trim(),
        };
        if (!guardPatientById(payload.patientId)) return;
        const d = data();
        if (!d.medicalRecords) d.medicalRecords = [];
        const cu = currentUser();
        if (!payload.doctor && cu) payload.doctor = cu.name;
        let record;
        if (id) {
          record = d.medicalRecords.find((x) => x.id === id);
          Object.assign(record, payload, { updatedAt: new Date().toISOString() });
          MedStore.log("Cập nhật bệnh án: " + payload.title);
          toast("Đã cập nhật hồ sơ bệnh án");
        } else {
          record = { id: MedStore.uid("mr"), ...payload, createdAt: new Date().toISOString() };
          d.medicalRecords.unshift(record);
          MedStore.log((cu?.role === "doctor" ? "BS" : "Admin") + " thêm bệnh án: " + payload.title);
          toast("Đã thêm hồ sơ bệnh án");
        }
        persist();
        MedSync.run(() => MedSync.saveMedicalRecord(record, !id));
        renderRecords();
        if (M.state.selectedPatientId) renderPatientDetail();
        closeModal();
      }

      function openRecordModal(id, presetPatientId) {
        const r = id ? (data().medicalRecords || []).find((x) => x.id === id) : null;
        const pid = presetPatientId || r?.patientId;
        if (pid && !guardPatientById(pid)) return;
        openModal(id ? "Cập nhật bệnh án" : "Thêm hồ sơ bệnh án", `<form id="modal-form">${recordForm(r, presetPatientId)}</form>`,
          `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button><button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`);
        $("#modal-save").onclick = () => saveRecordFromForm($("#modal-form"), id);
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      }

      function showRecordDetail(id) {
        const r = (data().medicalRecords || []).find((x) => x.id === id);
        if (!r) return;
        const p = patientById(r.patientId);
        const canManage = p ? M.canManagePatient(p) : true;
        const actions = canManage
          ? `<button type="button" class="btn btn-secondary" data-edit-record="${id}">Sửa</button><button type="button" class="btn btn-danger" data-del-record="${id}">Xóa</button>`
          : "";
        openModal("Chi tiết bệnh án",
          `<dl class="detail-grid">
            <dt>Bệnh nhân</dt><dd>${esc(p?.name || "—")}</dd>
            <dt>Tiêu đề</dt><dd>${esc(r.title)}</dd>
            <dt>Chẩn đoán</dt><dd>${esc(r.diagnosis)}</dd>
            <dt>Bác sĩ</dt><dd>${esc(r.doctor || "—")}</dd>
            <dt>Ngày khám</dt><dd>${esc(r.visitDate || "—")}</dd>
            <dt>Triệu chứng</dt><dd>${esc(r.symptoms || "—")}</dd>
            <dt>Điều trị</dt><dd>${esc(r.treatment || "—")}</dd>
            <dt>Chỉ số</dt><dd>${esc(r.vitals || "—")}</dd>
            <dt>Ghi chú</dt><dd>${esc(r.note || "—")}</dd>
          </dl>`,
          `${actions}<button type="button" class="btn btn-primary" data-close-modal>Đóng</button>`);
        $("[data-edit-record]", $("#modal-foot"))?.addEventListener("click", () => { closeModal(); openRecordModal(id); });
        $("[data-del-record]", $("#modal-foot"))?.addEventListener("click", () => {
          if (!guardPatientById(r.patientId)) return;
          appConfirm({
            title: "Xóa hồ sơ bệnh án",
            message: `Xóa hồ sơ "${r.title}"? Dữ liệu sẽ bị xóa vĩnh viễn.`,
            variant: "delete",
            confirmText: "Xóa",
          }).then(async (ok) => {
            if (!ok) return;
            const d = data();
            d.medicalRecords = (d.medicalRecords || []).filter((x) => x.id !== id);
            persist();
            await MedSync.run(() => MedSync.deleteMedicalRecord(id));
            MedStore.log("Xóa bệnh án: " + r.title);
            toast("Đã xóa hồ sơ bệnh án");
            closeModal();
            renderRecords();
            if (M.state.selectedPatientId) renderPatientDetail();
          });
        });
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      }

      function renderRecords() {
        const q = ($("#search-records")?.value || "").toLowerCase();
        const patientFilter = $("#filter-records-patient")?.value || "";
        let list = data().medicalRecords || [];
        if (q) list = list.filter((r) => `${r.title} ${r.diagnosis} ${r.doctor}`.toLowerCase().includes(q));
        if (patientFilter) list = list.filter((r) => r.patientId === patientFilter);

        const sel = $("#filter-records-patient");
        if (sel) {
          const cur = sel.value;
          sel.innerHTML = '<option value="">' + t("records.allPatients") + '</option>' +
            data().patients.map((p) => `<option value="${p.id}">${esc(p.name)}</option>`).join("");
          sel.value = cur;
        }

        const el = $("#records-list");
        if (!el) return;
        if (!list.length) {
          el.innerHTML = '<p class="list-empty-hint">' + t("empty.noRecords") + '</p>';
          return;
        }
        el.innerHTML = list.map((r) => recordCardHtml(r)).join("");
        el.querySelectorAll(".record-card").forEach((c) => {
          c.addEventListener("click", () => showRecordDetail(c.dataset.id));
        });
      }
      M.Records = { render: renderRecords, openModal: openRecordModal, detail: showRecordDetail };

      function medCardHtml(r) {
        const p = patientById(r.patientId);
        const needsRxConfirm = !r.statusConfirmedBy || r.status === "pending";
        return `<article class="med-card" data-id="${r.id}">
          <div class="med-card-head">
            <div class="med-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.5 20.5 3 13l7.5-7.5 7.5 7.5-7.5 7.5z"/></svg></div>
            <div class="info">
              <div class="patient">${esc(p?.name || "—")}${p?.code ? `<span class="patient-code">${esc(p.code)}</span>` : ""}</div>
              <div class="med-name">${esc(r.name)}</div>
            </div>
            ${rxStatusBadge(r)}
          </div>
          <dl class="med-grid">
            <div><dt>${t("med.dosage")}</dt><dd>${esc(r.dosage || "—")}</dd></div>
            <div><dt>${t("med.frequency")}</dt><dd>${esc(r.frequency || "—")}</dd></div>
          </dl>
          <div class="med-meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${t("med.intakeTime")}: ${esc(r.intakeTime || (r.times || []).join(", "))}</div>
          <div class="med-meta">${t("med.fromTo", { from: formatDateVi(r.startDate), to: formatDateVi(r.endDate || "—") })}</div>
          ${r.note ? `<div class="med-note">${esc(r.note)}</div>` : ""}
          ${needsRxConfirm ? rxConfirmBar(r) : (r.statusConfirmedBy ? `<div class="confirm-meta">${t("med.confirmedBy", { name: esc(r.statusConfirmedBy) })}</div>` : "")}
        </article>`;
      }

      function renderRx() {
        const q = ($("#search-rx")?.value || "").toLowerCase();
        let list = data().prescriptions;
        if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || (patientById(r.patientId)?.name || "").toLowerCase().includes(q));
        const all = data().prescriptions;
        const active = all.filter((r) => isRxConfirmedActive(r)).length;
        const low = all.filter((r) => r.runningOut && r.statusConfirmedBy).length;
        $("#rx-count") && ($("#rx-count").textContent = t("rx.count", { n: all.length }));
        $("#rx-stat-active") && ($("#rx-stat-active").textContent = active);
        $("#rx-stat-low") && ($("#rx-stat-low").textContent = low);
        $("#rx-stat-total") && ($("#rx-stat-total").textContent = all.length);
        const el = $("#rx-list");
        if (!el) return;
        if (!list.length) { el.innerHTML = '<p class="list-empty-hint">' + t("empty.noRx") + '</p>'; return; }
        el.innerHTML = list.map((r) => medCardHtml(r)).join("");
        el.querySelectorAll(".med-card").forEach((c) => {
          c.addEventListener("click", (e) => {
            if (e.target.closest("[data-stop-nav]")) return;
            showRxDetail(c.dataset.id);
          });
        });
      }

      function rxForm(r) {
        const patients = data().patients.map((p) => `<option value="${p.id}" ${r?.patientId === p.id ? "selected" : ""}>${esc(p.name)}</option>`).join("");
        const times = (r?.times || ["08:00"]).join(", ");
        return `<div class="form-field"><label>Bệnh nhân</label><select name="patientId" required>${patients || "<option value=''>Chưa có BN</option>"}</select></div>
          <div class="form-field"><label>Tên thuốc</label><input name="name" value="${esc(r?.name || "")}" required></div>
          <div class="form-row"><div class="form-field"><label>Liều</label><input name="dosage" value="${esc(r?.dosage || "")}"></div><div class="form-field"><label>Tần suất</label><input name="frequency" value="${esc(r?.frequency || "")}"></div></div>
          <div class="form-field"><label>Giờ uống (phẩy)</label><input name="times" value="${esc(times)}"></div>
          <div class="form-field"><label>Thời gian uống</label><input name="intakeTime" value="${esc(r?.intakeTime || "")}" placeholder="Sau bữa sáng"></div>
          <div class="form-row"><div class="form-field"><label>Từ ngày</label><input name="startDate" type="date" value="${esc(r?.startDate || new Date().toISOString().slice(0, 10))}"></div><div class="form-field"><label>Đến ngày</label><input name="endDate" type="date" value="${esc(r?.endDate || "")}"></div></div>
          <div class="form-field"><label>Trạng thái (BS xác nhận)</label><select name="status"><option value="pending" ${!r?.status || r?.status === "pending" ? "selected" : ""}>— Chưa xác nhận —</option><option value="active" ${r?.status === "active" ? "selected" : ""}>Đang dùng</option><option value="paused" ${r?.status === "paused" ? "selected" : ""}>Tạm dừng</option><option value="done" ${r?.status === "done" ? "selected" : ""}>Hoàn thành</option></select></div>
          <div class="form-field"><label>Ghi chú</label><textarea name="note">${esc(r?.note || "")}</textarea></div>`;
      }

      function syncRemindersForRx(rx) {
        const d = data();
        d.reminders = d.reminders.filter((rem) => rem.rxId !== rx.id);
        if (rx.status !== "active" || !rx.statusConfirmedBy) return;
        (rx.times || []).forEach((time) => {
          d.reminders.push({ id: MedStore.uid("rem"), rxId: rx.id, patientId: rx.patientId, time: time.trim(), days: [0, 1, 2, 3, 4, 5, 6], active: true });
        });
      }

      function saveRxFromForm(form, id) {
        const fd = new FormData(form);
        const times = (fd.get("times") || "08:00").split(",").map((t) => t.trim()).filter(Boolean);
        const status = fd.get("status") || "pending";
        const payload = { patientId: fd.get("patientId"), name: fd.get("name").trim(), dosage: fd.get("dosage").trim(), frequency: fd.get("frequency").trim(), intakeTime: fd.get("intakeTime").trim(), times, status, startDate: fd.get("startDate"), endDate: fd.get("endDate"), note: fd.get("note").trim(), runningOut: false };
        const u = currentUser();
        if (status === "active" || status === "paused" || status === "done") {
          payload.statusConfirmedBy = u?.name || "";
          payload.statusConfirmedAt = new Date().toISOString();
        } else {
          payload.statusConfirmedBy = null;
          payload.statusConfirmedAt = null;
        }
        if (!guardPatientById(payload.patientId)) return;
        const d = data();
        let rx;
        if (id) { rx = rxById(id); Object.assign(rx, payload); toast("Đã cập nhật toa"); }
        else { rx = { id: MedStore.uid("rx"), ...payload, createdAt: new Date().toISOString() }; d.prescriptions.push(rx); toast(status === "pending" ? "Đã thêm toa — chờ BS xác nhận" : "Đã thêm toa thuốc"); }
        syncRemindersForRx(rx);
        persist();
        const isNew = !id;
        MedSync.run(() => MedSync.savePrescription(rx, isNew));
        if (isRxConfirmedActive(rx)) pushNotif("Đã lên lịch nhắc cho " + rx.name, "reminder");
        renderRx();
        renderDashboard();
        closeModal();
      }

      function showRxDetail(id) {
        const r = rxById(id);
        const p = patientById(r.patientId);
        const canManage = p ? M.canManagePatient(p) : true;
        const rems = data().reminders.filter((rem) => rem.rxId === id && rem.active);
        const actions = canManage
          ? `<button type="button" class="btn btn-secondary" data-edit-rx="${id}">Sửa</button><button type="button" class="btn btn-secondary" data-rem-rx="${id}">Lịch nhắc</button><button type="button" class="btn btn-danger" data-del-rx="${id}">Xóa</button>`
          : "";
        openModal("Chi tiết toa", `<dl class="detail-grid"><dt>Thuốc</dt><dd>${esc(r.name)}</dd><dt>BN</dt><dd>${esc(p?.name)}</dd><dt>Giờ</dt><dd>${esc((r.times || []).join(", "))}</dd><dt>Nhắc</dt><dd>${rems.length} khung</dd></dl>`,
          actions);
        $("[data-edit-rx]", $("#modal-foot"))?.addEventListener("click", () => { closeModal(); openRxModal(id); });
        $("[data-rem-rx]", $("#modal-foot"))?.addEventListener("click", () => { closeModal(); openReminderModal(id); });
        $("[data-del-rx]", $("#modal-foot"))?.addEventListener("click", () => {
          if (!guardPatientById(r.patientId)) return;
          appConfirm({
            title: "Xóa toa thuốc",
            message: `Xóa toa ${r.name}? Lịch nhắc liên quan cũng sẽ bị xóa.`,
            variant: "delete",
            confirmText: "Xóa",
          }).then(async (ok) => {
            if (!ok) return;
            const d = data();
            d.prescriptions = d.prescriptions.filter((x) => x.id !== id);
            d.reminders = d.reminders.filter((rem) => rem.rxId !== id);
            persist();
            await MedSync.run(() => MedSync.deletePrescription(id));
            closeModal();
            renderAll();
            toast("Đã xóa toa thuốc");
          });
        });
      }

      function openRxModal(id) {
        const r = id ? rxById(id) : null;
        if (r && !guardPatientById(r.patientId)) return;
        openModal(id ? "Chỉnh sửa toa" : "Thêm toa thuốc", `<form id="modal-form">${rxForm(r)}</form>`, `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button><button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`);
        $("#modal-save").onclick = () => saveRxFromForm($("#modal-form"), id);
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      }

      function openReminderModal(rxId) {
        const r = rxById(rxId);
        if (!r || !guardPatientById(r.patientId)) return;
        const rems = data().reminders.filter((rem) => rem.rxId === rxId);
        const times = rems.map((rem) => rem.time).join(", ") || (r.times || []).join(", ");
        openModal("Lịch nhắc thuốc", `<form id="modal-form"><div class="form-field"><label>Giờ nhắc</label><input name="times" value="${esc(times)}"></div></form>`,
          `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button><button type="button" class="btn btn-danger" id="modal-cancel-rem">Hủy lịch</button>`);
        $("#modal-save").onclick = async () => {
          r.times = new FormData($("#modal-form")).get("times").split(",").map((x) => x.trim()).filter(Boolean);
          syncRemindersForRx(r);
          persist();
          await MedSync.run(() => MedSync.syncReminders(r));
          toast("Đã cập nhật lịch");
          closeModal();
          renderDashboard();
        };
        $("#modal-cancel-rem").onclick = async () => {
          data().reminders.forEach((rem) => { if (rem.rxId === rxId) rem.active = false; });
          r.status = "paused";
          persist();
          await MedSync.run(() => MedSync.syncReminders(r));
          closeModal();
          renderAll();
        };
      }
      M.Rx = { render: renderRx, openModal: openRxModal, detail: showRxDetail, save: saveRxFromForm, syncReminders: syncRemindersForRx, openReminder: openReminderModal };

      function todayHistoryForRx(rxId) {
        const today = todayKey();
        return data().history.find((h) => h.rxId === rxId && h.confirmed && h.at.startsWith(today));
      }

      function addHistory(rxId, status) {
        const rx = rxById(rxId);
        if (!rx) return;
        const u = currentUser();
        const now = new Date().toISOString();
        const today = todayKey();
        const d = data();
        d.history = d.history.filter((h) => !(h.rxId === rxId && h.at.startsWith(today)));
        const entry = {
          id: MedStore.uid("h"), rxId, patientId: rx.patientId, medName: rx.name, status,
          confirmed: true, confirmedBy: u?.name || "", confirmedAt: now, at: now,
        };
        d.history.unshift(entry);
        if (d.history.length > 500) d.history.splice(500);
        persist();
        MedSync.run(() => MedSync.addHistory(entry));
        const labels = { taken: "đã uống", skipped: "bỏ qua", not_taken: "chưa uống" };
        MedStore.log((u?.name || "BS") + " xác nhận " + (labels[status] || status) + ": " + rx.name);
        if (status === "skipped") pushNotif("BS xác nhận bỏ qua: " + rx.name, "warn");
        if (status === "not_taken") pushNotif("BS xác nhận chưa uống: " + rx.name, "warn");
      }

      function renderHistory() {
        const q = ($("#search-history").value || "").toLowerCase();
        const dateFilter = $("#filter-history-date")?.value || "";
        let list = data().history;
        if (q) list = list.filter((h) => h.medName.toLowerCase().includes(q) || (patientById(h.patientId)?.name || "").toLowerCase().includes(q));
        if (historyStatusFilter) list = list.filter((h) => h.status === historyStatusFilter);
        if (dateFilter) list = list.filter((h) => h.at.startsWith(dateFilter));
        const el = $("#history-list");
        if (!list.length) { el.innerHTML = '<p class="list-empty-hint">' + t("empty.noHistory") + '</p>'; return; }
        el.innerHTML = list.slice(0, 80).map((h) => {
          const p = patientById(h.patientId);
          const stMap = { taken: t("status.taken"), skipped: t("status.skipped"), not_taken: t("status.notTaken") };
          const st = "✓ " + (stMap[h.status] || h.status);
          const dt = new Date(h.at).toLocaleString("vi-VN");
          const by = h.confirmedBy ? ` · ${esc(h.confirmedBy)}` : "";
          return `<article class="history-card" data-id="${h.id}"><div class="card-title">${esc(h.medName)}</div><div class="card-meta">${esc(p?.name)} · ${st}${by}</div><div class="card-meta">${dt}</div></article>`;
        }).join("");
        el.querySelectorAll(".history-card").forEach((c) => c.addEventListener("click", () => showHistoryDetail(c.dataset.id)));
      }

      function showHistoryDetail(id) {
        const h = data().history.find((x) => x.id === id);
        if (!h) return;
        const p = patientById(h.patientId);
        const rx = rxById(h.rxId);
        const stMap = { taken: t("status.taken"), skipped: t("status.skipped"), not_taken: t("status.notTaken") };
        const st = stMap[h.status] || h.status;
        openModal("Chi tiết lịch sử",
          `<dl class="detail-grid"><dt>Thuốc</dt><dd>${esc(h.medName)}</dd><dt>Bệnh nhân</dt><dd>${esc(p?.name)}</dd><dt>Liều</dt><dd>${esc(rx?.dosage || "—")}</dd><dt>Trạng thái</dt><dd>${st}</dd><dt>Xác nhận bởi</dt><dd>${esc(h.confirmedBy || "—")}</dd><dt>Thời gian</dt><dd>${new Date(h.at).toLocaleString("vi-VN")}</dd></dl>`,
          `<button type="button" class="btn btn-primary" data-close-modal>Đóng</button>`);
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      }
      M.History = { render: renderHistory, add: addHistory, detail: showHistoryDetail };

      function playNotifSound() {
        const user = currentUser();
        if (!user?.soundEnabled) return;
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.08;
          osc.start();
          osc.stop(ctx.currentTime + 0.15);
        } catch (_) {}
      }

      function pushNotif(message, type, title) {
        const user = currentUser();
        if (user && !user.notifEnabled) return;
        const t = type || "info";
        const icons = { reminder: "pill", warn: "alert", info: "info", appointment: "calendar", patient: "user" };
        const notif = {
          id: MedStore.uid("n"), message, title: title || (t === "warn" ? "Cảnh báo" : t === "reminder" ? "Nhắc nhở uống thuốc" : "Thông báo"),
          type: t, icon: icons[t] || "info", read: false, at: new Date().toISOString(),
        };
        data().notifications.unshift(notif);
        if (data().notifications.length > 80) data().notifications.splice(80);
        persist();
        MedSync.run(() => MedSync.pushNotification(notif));
        updateNotifBadge();
        playNotifSound();
      }

      function updateNotifBadge() {
        const n = data().notifications.filter((x) => !x.read).length;
        ["#nav-notif-badge", "#notif-header-badge"].forEach((sel) => {
          const badge = $(sel);
          if (!badge) return;
          badge.textContent = n > 99 ? "99+" : String(n);
          badge.classList.toggle("hidden", n === 0);
          badge.setAttribute("aria-hidden", n === 0 ? "true" : "false");
        });
        const chipCount = $("#notif-chip-count");
        if (chipCount) chipCount.textContent = n;
        const unreadText = $("#notif-unread-text");
        if (unreadText) {
          unreadText.textContent = n === 0 ? t("notif.unreadNone") : t("notif.unread", { n });
        }
      }

      function renderNotifications() {
        if (M.isUser()) {
          renderUserNotifications();
          return;
        }
        let list = data().notifications;
        if (notifFilter === "unread") list = list.filter((n) => !n.read);
        const el = $("#notif-list");
        if (!el) return;
        if (!list.length) { el.innerHTML = '<p class="list-empty-hint">' + t("empty.noNotif") + '</p>'; return; }
        el.innerHTML = list.map((n) => {
          const alertCls = n.type === "warn" && !n.read ? " alert-unread" : "";
          const unreadCls = !n.read ? " unread" : "";
          return `<article class="notif-card-v2${unreadCls}${alertCls}" data-nid="${n.id}">
            ${notifIconHtml(n.icon, n.type)}
            <div class="notif-body">
              <div class="title">${esc(n.title || "Thông báo")}</div>
              <div class="msg">${esc(n.message)}</div>
              <div class="time">${timeAgo(n.at)}</div>
              <div class="notif-actions">
                ${n.read ? "" : `<button type="button" class="btn btn-notif-read" data-read="${n.id}">${t("notif.read")}</button>`}
                <button type="button" class="btn btn-notif-del" data-del-n="${n.id}">${t("notif.delete")}</button>
              </div>
            </div>
            ${n.read ? "" : '<span class="notif-dot" aria-hidden="true"></span>'}
          </article>`;
        }).join("");
        updateNotifBadge();
      }

      function markNotifRead(id) {
        const x = data().notifications.find((n) => n.id === id);
        if (!x || x.read) return;
        x.read = true;
        persist();
        MedSync.run(() => MedSync.markNotifRead(id));
        MedStore.log("Đọc thông báo: " + (x.title || x.message));
        renderNotifications();
        updateNotifBadge();
        toast("Đã đánh dấu đọc");
      }

      function deleteNotif(id) {
        const removed = data().notifications.find((n) => n.id === id);
        if (!removed) return;
        data().notifications = data().notifications.filter((n) => n.id !== id);
        persist();
        MedSync.run(() => MedSync.deleteNotification(id));
        MedStore.log("Xóa thông báo: " + (removed.title || removed.message));
        renderNotifications();
        updateNotifBadge();
        toast("Đã xóa thông báo");
      }

      function onNotifListClick(e) {
        const readBtn = e.target.closest("[data-read]");
        if (readBtn) {
          e.preventDefault();
          e.stopPropagation();
          markNotifRead(readBtn.dataset.read);
          return;
        }
        const delBtn = e.target.closest("[data-del-n]");
        if (delBtn) {
          e.preventDefault();
          e.stopPropagation();
          deleteNotif(delBtn.dataset.delN);
        }
      }
      M.Notifications = { push: pushNotif, render: renderNotifications, updateBadge: updateNotifBadge };

      const reminderCheckSvg = `<svg class="reminder-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`;

      function reminderStatusForRx(rxId) {
        const hist = todayHistoryForRx(rxId);
        if (hist?.status === "taken") return "taken";
        if (hist?.status === "skipped") return "skipped";
        if (hist?.status === "not_taken") return "not_taken";
        return "pending";
      }

      function reminderHtml(rem, d, compact) {
        const rx = rxById(rem.rxId);
        const p = patientById(rem.patientId);
        const hist = todayHistoryForRx(rem.rxId);
        const taken = hist?.status === "taken";
        const skipped = hist?.status === "skipped";
        const notTaken = hist?.status === "not_taken";
        const done = taken || skipped || notTaken;
        const statusBadge = taken
          ? `<span class="reminder-status taken">${reminderCheckSvg}${t("status.takenDone")}</span>`
          : skipped
            ? `<span class="reminder-status skipped">${reminderCheckSvg}${t("status.skippedDone")}</span>`
            : notTaken
              ? `<span class="reminder-status not-taken">${reminderCheckSvg}${t("status.notTaken")}</span>`
              : "";
        const notTakenBtn = !done && M.canManagePatients()
          ? `<button type="button" class="btn-not-taken" data-not-taken="${rem.rxId}">${t("confirm.notTaken")}</button>`
          : "";
        const actions = !done && M.canManagePatients()
          ? `<div class="reminder-actions"><button type="button" class="btn-taken" data-taken="${rem.rxId}">${t("confirm.taken")}</button><button type="button" class="btn-skip" data-skip="${rem.rxId}">${t("confirm.skip")}</button></div>`
          : !done ? `<span class="reminder-status pending">${t("status.waitDoctor")}</span>` : "";
        const right = done
          ? statusBadge
          : `<div class="reminder-right">${notTakenBtn}${actions}</div>`;
        const stateClass = taken ? "status-taken" : skipped ? "status-skipped" : notTaken ? "status-not-taken" : "status-pending";
        return `<div class="reminder-item ${stateClass}${done ? " confirmed" : ""}">
          <span class="reminder-time">${esc(rem.time)}</span>
          <div class="reminder-info">
            <div class="reminder-patient">${esc(p?.name || "—")}</div>
            <div class="reminder-med">${esc(rx?.name || "—")}${compact ? "" : " · " + esc(rx?.dosage || "")}${hist?.confirmedBy ? " · " + esc(hist.confirmedBy) : ""}</div>
          </div>
          ${right}
        </div>`;
      }

      function bindReminderActions(root) {
        root.querySelectorAll("[data-taken]").forEach((b) => b.addEventListener("click", () => {
          if (!M.canManagePatients()) { toast("Chỉ bác sĩ mới xác nhận", "warn"); return; }
          const rx = rxById(b.dataset.taken);
          appConfirm({
            title: "Xác nhận đã uống thuốc",
            message: `Bác sĩ xác nhận bệnh nhân đã uống ${rx?.name}?`,
            variant: "success",
            confirmText: "Xác nhận",
          }).then((ok) => {
            if (!ok) return;
            addHistory(b.dataset.taken, "taken");
            pushNotif("BS xác nhận đã uống: " + rx?.name, "info");
            renderTodayReminders();
            renderSchedule();
            renderHistory();
            renderDashboard();
            toast("Đã xác nhận uống thuốc");
          });
        }));
        root.querySelectorAll("[data-skip]").forEach((b) => b.addEventListener("click", () => {
          if (!M.canManagePatients()) { toast("Chỉ bác sĩ mới xác nhận", "warn"); return; }
          const rx = rxById(b.dataset.skip);
          appConfirm({
            title: "Xác nhận bỏ qua thuốc",
            message: `Bác sĩ xác nhận bỏ qua liều ${rx?.name} hôm nay?`,
            variant: "warning",
            confirmText: "Xác nhận bỏ qua",
          }).then((ok) => {
            if (!ok) return;
            addHistory(b.dataset.skip, "skipped");
            renderTodayReminders();
            renderSchedule();
            renderHistory();
            renderDashboard();
            toast("Đã xác nhận bỏ qua");
          });
        }));
        root.querySelectorAll("[data-not-taken]").forEach((b) => b.addEventListener("click", () => {
          if (!M.canManagePatients()) { toast("Chỉ bác sĩ mới xác nhận", "warn"); return; }
          const rx = rxById(b.dataset.notTaken);
          appConfirm({
            title: t("confirm.notTakenTitle"),
            message: t("confirm.notTakenMsg", { med: rx?.name || "" }),
            variant: "warning",
            confirmText: t("confirm.notTaken"),
          }).then((ok) => {
            if (!ok) return;
            addHistory(b.dataset.notTaken, "not_taken");
            renderTodayReminders();
            renderSchedule();
            renderHistory();
            renderDashboard();
            toast(t("toast.notTaken"));
          });
        }));
      }

      function renderTodayReminders() {
        const d = data();
        const day = new Date().getDay();
        const active = d.reminders.filter((rem) => {
          const rx = rxById(rem.rxId);
          return rem.active && rem.days.includes(day) && rx && isRxConfirmedActive(rx);
        });
        const el = $("#today-reminders");
        if (!active.length) { el.innerHTML = '<p class="list-empty-hint">' + t("empty.noRemindersDash") + '</p>'; return; }
        el.innerHTML = [...active].sort((a, b) => a.time.localeCompare(b.time)).map((rem) => reminderHtml(rem, d, true)).join("");
        bindReminderActions(el);
      }

      function renderSchedule() {
        const d = data();
        const day = new Date().getDay();
        let active = d.reminders.filter((rem) => {
          const rx = rxById(rem.rxId);
          return rem.active && rem.days.includes(day) && rx && isRxConfirmedActive(rx);
        });
        if (scheduleStatusFilter === "pending") {
          active = active.filter((rem) => {
            const s = reminderStatusForRx(rem.rxId);
            return s === "pending" || s === "not_taken";
          });
        } else if (scheduleStatusFilter === "taken") {
          active = active.filter((rem) => reminderStatusForRx(rem.rxId) === "taken");
        } else if (scheduleStatusFilter === "skipped") {
          active = active.filter((rem) => reminderStatusForRx(rem.rxId) === "skipped");
        }
        const el = $("#schedule-list");
        if (!el) return;
        if (!active.length) { el.innerHTML = '<p class="list-empty-hint">' + t("empty.noReminders") + '</p>'; return; }
        el.innerHTML = [...active].sort((a, b) => a.time.localeCompare(b.time)).map((rem) => reminderHtml(rem, d, false)).join("");
        bindReminderActions(el);
      }

      function renderDashboard() {
        const d = data();
        const day = new Date().getDay();
        $("#stat-patients") && ($("#stat-patients").textContent = d.patients.length);
        $("#stat-today") && ($("#stat-today").textContent = d.reminders.filter((r) => r.active && r.days.includes(day)).length);
        $("#stat-rx") && ($("#stat-rx").textContent = d.prescriptions.filter((r) => isRxConfirmedActive(r)).length);
        $("#stat-reports") && ($("#stat-reports").textContent = d.medicalRecords.length + d.history.length);
        M.updateHeaderUser();
        renderRecentPatients();
        updateNotifBadge();
      }
      M.Dashboard = { render: renderDashboard };

      function checkReminders() {
        const user = currentUser();
        if (!user?.notifEnabled) return;
        const now = new Date();
        const hm = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
        const day = now.getDay();
        data().reminders.forEach((rem) => {
          if (rem.active && rem.days.includes(day) && rem.time === hm) {
            const rx = rxById(rem.rxId);
            pushNotif("⏰ Đến giờ uống: " + (rx?.name || "thuốc"), "reminder");
            toast("Nhắc uống thuốc: " + (rx?.name || ""));
          }
        });
      }
      M.Reminders = { check: checkReminders, renderToday: renderTodayReminders, renderSchedule };

      function renderCharts() {
        if (typeof Chart === "undefined") return;
        const d = data();
        const last7 = [];
        for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); last7.push(dt.toISOString().slice(0, 10)); }
        const takenByDay = last7.map((day) => d.history.filter((h) => h.status === "taken" && h.at.startsWith(day)).length);
        const skippedByDay = last7.map((day) => d.history.filter((h) => h.status === "skipped" && h.at.startsWith(day)).length);
        if (chartDoses) chartDoses.destroy();
        chartDoses = new Chart($("#chart-doses"), { type: "line", data: { labels: last7.map((d) => d.slice(5)), datasets: [{ label: t("status.taken"), data: takenByDay, borderColor: "#3b82f6" }, { label: t("status.skipped"), data: skippedByDay, borderColor: "#f59e0b" }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#94a3b8" } } }, scales: { x: { ticks: { color: "#94a3b8" } }, y: { ticks: { color: "#94a3b8" } } } } });
        M.charts.doses = chartDoses;
        const medCounts = {};
        d.history.filter((h) => h.status === "taken").forEach((h) => { medCounts[h.medName] = (medCounts[h.medName] || 0) + 1; });
        if (chartMeds) chartMeds.destroy();
        chartMeds = new Chart($("#chart-meds"), { type: "doughnut", data: { labels: Object.keys(medCounts).length ? Object.keys(medCounts) : ["Chưa có"], datasets: [{ data: Object.values(medCounts).length ? Object.values(medCounts) : [1] }] }, options: { responsive: true, maintainAspectRatio: false } });
        M.charts.meds = chartMeds;
      }
      M.Reports = { renderCharts };

      function roleBadgeHtml(role) {
        const cls = role === "admin" ? "role-badge admin" : role === "user" ? "role-badge user" : "role-badge doctor";
        return `<span class="${cls}">${M.roleLabel(role)}</span>`;
      }

      let _portalCache = null;

      async function loadPortal() {
        try {
          _portalCache = await MedApi.getPortal();
          return _portalCache;
        } catch (err) {
          _portalCache = { patient: null, prescriptions: [], scheduleToday: [], notifications: [], message: err.message };
          return _portalCache;
        }
      }

      function rxStatusLabel(status) {
        const map = { active: "Đang dùng", pending: "Chờ xác nhận", done: "Hoàn thành" };
        return map[status] || status || "—";
      }

      async function renderUserHome() {
        const portal = await loadPortal();
        const u = currentUser();
        const h = new Date().getHours();
        const greet = h < 12 ? "Chào buổi sáng" : h < 18 ? "Chào buổi chiều" : "Chào buổi tối";
        $("#user-dash-greeting") && ($("#user-dash-greeting").textContent = greet);
        $("#user-dash-name") && ($("#user-dash-name").textContent = u?.name || "Bệnh nhân");
        const activeRx = (portal.prescriptions || []).filter((r) => r.status === "active" || r.status === "pending");
        $("#user-stat-rx") && ($("#user-stat-rx").textContent = activeRx.length);
        $("#user-stat-today") && ($("#user-stat-today").textContent = (portal.scheduleToday || []).length);
        const el = $("#user-today-schedule");
        if (!el) return;
        if (!portal.patient) {
          el.innerHTML = '<p class="list-empty-hint">' + esc(portal.message || "Chưa có hồ sơ bệnh nhân.") + '</p>';
          return;
        }
        const today = portal.scheduleToday || [];
        if (!today.length) {
          el.innerHTML = '<p class="list-empty-hint">Chưa có lịch uống thuốc hôm nay. Bác sĩ sẽ kê đơn khi khám.</p>';
          return;
        }
        el.innerHTML = today.map((s) => `
          <div class="user-schedule-row">
            <span class="time">${esc(s.time)}</span>
            <div><strong>${esc(s.drugName)}</strong> ${esc(s.dosage || "")}<br><span class="meta">${esc(rxStatusLabel("active"))}</span></div>
          </div>`).join("");
      }

      async function renderUserMeds() {
        const portal = await loadPortal();
        const el = $("#user-meds-list");
        if (!el) return;
        const list = portal.prescriptions || [];
        $("#user-meds-sub") && ($("#user-meds-sub").textContent = portal.patient ? "Mã BN: " + portal.patient.code : "Chưa có hồ sơ");
        if (!list.length) {
          el.innerHTML = '<p class="list-empty-hint">Chưa có toa thuốc. Vui lòng liên hệ bác sĩ.</p>';
          return;
        }
        el.innerHTML = list.map((rx) => `
          <article class="user-med-card">
            <h4>${esc(rx.name)} <span class="status-badge status-${rx.status === "active" ? "stable" : "pending"}">${esc(rxStatusLabel(rx.status))}</span></h4>
            <div class="meta">${esc(rx.dosage || "")} · ${esc(rx.frequency || "")}</div>
            <div class="meta">${esc(rx.intakeTime || "")}</div>
            ${rx.note ? '<div class="meta" style="margin-top:0.35rem">' + esc(rx.note) + "</div>" : ""}
          </article>`).join("");
      }

      async function renderUserSchedule() {
        const portal = await loadPortal();
        const el = $("#user-schedule-list");
        if (!el) return;
        const today = portal.scheduleToday || [];
        if (!today.length) {
          el.innerHTML = '<p class="list-empty-hint">Chưa có lịch nhắc uống thuốc.</p>';
          return;
        }
        el.innerHTML = today.map((s) => `
          <div class="user-schedule-row">
            <span class="time">${esc(s.time)}</span>
            <div><strong>${esc(s.drugName)}</strong><br><span class="meta">${esc(s.dosage || "")}</span></div>
          </div>`).join("");
      }

      async function renderUserNotifications() {
        const portal = await loadPortal();
        let list = portal.notifications || [];
        if (notifFilter === "unread") list = list.filter((n) => !n.read);
        const el = $("#notif-list");
        if (!el) return;
        if (!list.length) { el.innerHTML = '<p class="list-empty-hint">' + t("empty.noNotif") + '</p>'; return; }
        el.innerHTML = list.map((n) => {
          const unreadCls = !n.read ? " unread" : "";
          return `<article class="notif-card-v2${unreadCls}" data-nid="${n.id}">
            ${notifIconHtml(n.icon, n.type)}
            <div class="notif-body">
              <div class="title">${esc(n.title || "Thông báo")}</div>
              <div class="msg">${esc(n.message)}</div>
              <div class="time">${timeAgo(n.at)}</div>
            </div>
            ${n.read ? "" : '<span class="notif-dot" aria-hidden="true"></span>'}
          </article>`;
        }).join("");
      }

      M.UserPortal = {
        async renderAll() { await Promise.all([renderUserHome(), renderUserMeds(), renderUserSchedule()]); },
        renderHome: renderUserHome,
        renderMeds: renderUserMeds,
        renderSchedule: renderUserSchedule,
        renderNotifications: renderUserNotifications,
      };

      async function renderDoctorAccounts() {
        const el = $("#doctor-accounts-list");
        if (!el || !M.isAdmin()) return;
        try {
          const res = await MedApi.listUsers();
          M.syncApiUsers(res.data);
          persist();
        } catch (_) {}
        const doctors = data().users.filter((u) => u.role === "doctor");
        if (!doctors.length) {
          el.innerHTML = '<p class="list-empty-hint" style="margin:0.5rem 1rem 1rem">' + t("empty.noDoctors") + '</p>';
          return;
        }
        el.innerHTML = doctors.map((doc) => `
          <div class="doctor-account-row">
            <div>
              <div class="doctor-account-name">${esc(doc.name)}</div>
              <div class="doctor-account-meta">${esc(doc.email)} · ${esc(doc.department || "—")}</div>
            </div>
            <button type="button" class="btn btn-sm btn-ghost" data-del-doctor="${doc.id}" ${doc.id === currentUser()?.id ? "disabled" : ""}>Xóa</button>
          </div>
        `).join("");
        el.querySelectorAll("[data-del-doctor]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const id = btn.dataset.delDoctor;
            if (id === currentUser()?.id) return;
            appConfirm({
              title: "Xóa tài khoản bác sĩ",
              message: "Xóa tài khoản bác sĩ này? Họ sẽ không thể đăng nhập nữa.",
              variant: "delete",
              confirmText: "Xóa",
            }).then(async (ok) => {
              if (!ok) return;
              try {
                await MedApi.deleteUser(id);
              } catch (err) {
                toast(err.message || "Không xóa được tài khoản", "error");
                return;
              }
              const d = data();
              d.users = d.users.filter((u) => u.id !== id);
              persist();
              MedStore.log("Admin xóa tài khoản bác sĩ");
              renderDoctorAccounts();
              toast("Đã xóa tài khoản bác sĩ");
            });
          });
        });
      }

      function openDoctorModal() {
        if (!M.isAdmin()) { toast("Chỉ admin mới thêm bác sĩ"); return; }
        openModal("Thêm tài khoản bác sĩ",
          `<form id="modal-form">
            <div class="form-field"><label>Họ tên</label><input name="name" required placeholder="BS. Nguyễn Văn A"></div>
            <div class="form-field"><label>Chuyên khoa</label><input name="department" placeholder="Tim mạch"></div>
            <div class="form-field"><label>Email</label><input name="email" type="email" required></div>
            <div class="form-field"><label>Mật khẩu</label><input name="password" type="password" required minlength="6"></div>
          </form>`,
          `<button type="button" class="btn btn-primary" id="modal-save">Tạo tài khoản</button><button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`);
        $("#modal-save").onclick = async () => {
          const fd = new FormData($("#modal-form"));
          const email = fd.get("email").trim().toLowerCase();
          const payload = {
            email,
            password: fd.get("password"),
            name: fd.get("name").trim(),
            department: (fd.get("department") || "").trim() || "Đa khoa",
            title: "Bác sĩ",
            role: "doctor",
          };
          try {
            const res = await MedApi.register(payload);
            M.syncApiUser(res.user);
            persist();
            MedStore.log("Admin tạo bác sĩ: " + res.user.name);
            closeModal();
            renderDoctorAccounts();
            toast("Đã tạo tài khoản bác sĩ");
          } catch (err) {
            toast(err.message || "Không tạo được tài khoản", err.status === 409 ? "warn" : "error");
          }
        };
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      }

      function renderSettings() {
        const u = currentUser();
        if (!u) return;
        const ini = u.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        const profile = $("#settings-profile");
        if (profile) {
          profile.innerHTML = `<div class="avatar">${ini}</div><div><div class="name">${esc(u.name)} ${roleBadgeHtml(u.role)}</div><div class="email">${esc(u.email)}${u.department ? " · " + esc(u.department) : ""}</div></div>`;
        }
        $("#settings-doctors-group")?.classList.toggle("hidden", !M.isAdmin());
        if (M.isAdmin()) renderDoctorAccounts();
        $("#settings-name-val") && ($("#settings-name-val").innerHTML = esc(u.name) + ' <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>');
        $("#setting-otp").checked = u.otpEnabled;
        $("#setting-lang").value = u.lang || "vi";
        $("#settings-lang-val") && ($("#settings-lang-val").innerHTML = (u.lang === "en" ? t("settings.langEn") : t("settings.langVi")) + ' <svg class="chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>');
        $("#setting-notif").checked = u.notifEnabled !== false;
        $("#notif-toggle-label") && ($("#notif-toggle-label").textContent = u.notifEnabled !== false ? t("settings.notifOn") : t("settings.notifOff"));
        const soundEl = $("#setting-sound");
        if (soundEl) soundEl.checked = u.soundEnabled !== false;
      }
      M.Settings = { render: renderSettings };

      // --- Events ---
      $$(".auth-tab").forEach((btn) => btn.addEventListener("click", () => showAuthForm(btn.dataset.auth)));
      $("#btn-forgot").addEventListener("click", () => showAuthForm("forgot"));
      $$("[data-back-login]").forEach((b) => b.addEventListener("click", () => showAuthForm("login")));

      $$("#patient-status-chips .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          $$("#patient-status-chips .chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          patientStatusFilter = chip.dataset.pstatus;
          renderPatients();
        });
      });
      $$("#notif-filter-chips .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          $$("#notif-filter-chips .chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          notifFilter = chip.dataset.nfilter;
          renderNotifications();
        });
      });

      $("#form-login").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const email = fd.get("email").trim().toLowerCase();
        const password = fd.get("password");
        const btn = e.target.querySelector('[type="submit"]');
        if (btn) btn.disabled = true;
        try {
          const res = await MedApi.login(email, password);
          M.applyApiSession(res.token, res.user);
          enterApp();
          toast("Chào " + res.user.name + " (" + M.roleLabel(res.user.role) + ")");
        } catch (err) {
          if (err.code === "NETWORK") {
            const user = data().users.find((u) => u.email === email && u.password === password);
            if (user) {
              const d = data();
              d.session = { userId: user.id, loginAt: new Date().toISOString(), token: MedStore.uid("tok"), source: "local" };
              persist();
              enterApp();
              toast("Chào " + user.name + " (offline — backend chưa chạy)", "warn");
              if (btn) btn.disabled = false;
              return;
            }
          }
          toast(err.message || "Email hoặc mật khẩu không đúng", "error");
        } finally {
          if (btn) btn.disabled = false;
        }
      });
      $("#form-register").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const email = fd.get("email").trim().toLowerCase();
        const payload = {
          email,
          password: fd.get("password"),
          name: fd.get("name").trim(),
          phone: (fd.get("phone") || "").trim(),
          role: "user",
        };
        const btn = e.target.querySelector('[type="submit"]');
        if (btn) btn.disabled = true;
        try {
          const res = await MedApi.register(payload);
          M.applyApiSession(res.token, res.user);
          MedStore.log("Đăng ký bệnh nhân: " + res.user.name);
          enterApp();
          toast("Đăng ký thành công — chào " + res.user.name);
        } catch (err) {
          if (err.code === "NETWORK") {
            const d = data();
            if (d.users.some((u) => u.email === email)) {
              toast("Email đã tồn tại", "warn");
              if (btn) btn.disabled = false;
              return;
            }
            const user = {
              id: MedStore.uid("u"),
              email,
              password: payload.password,
              name: payload.name,
              phone: payload.phone || "",
              role: "user",
              department: "",
              title: "Bệnh nhân",
              otpEnabled: false,
              lang: "vi",
              notifEnabled: true,
              soundEnabled: true,
              createdAt: new Date().toISOString(),
            };
            d.users.push(user);
            const patient = {
              id: MedStore.uid("p"),
              code: "BN" + String(d.patients.length + 1).padStart(3, "0"),
              name: payload.name,
              phone: payload.phone || "",
              birth: null,
              gender: "Nam",
              department: "Đa khoa",
              status: "pending",
              lastVisit: new Date().toISOString().slice(0, 10),
              note: "Đăng ký E2E/offline",
              avatar: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            d.patients.push(patient);
            d.session = { userId: user.id, loginAt: new Date().toISOString(), token: MedStore.uid("tok"), source: "local" };
            persist();
            MedStore.log("Đăng ký bệnh nhân (offline): " + user.name);
            enterApp();
            toast("Đăng ký thành công — chào " + user.name);
            if (btn) btn.disabled = false;
            return;
          }
          toast(err.message || "Không đăng ký được", err.status === 409 ? "warn" : "error");
        } finally {
          if (btn) btn.disabled = false;
        }
      });
      $("#form-forgot").addEventListener("submit", (e) => {
        e.preventDefault();
        const email = new FormData(e.target).get("email").trim().toLowerCase();
        if (!data().users.find((u) => u.email === email)) { toast("Không tìm thấy email"); return; }
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        data().pendingOtp = { email, otp, exp: Date.now() + 300000 };
        M.state.pendingForgotEmail = email;
        persist();
        toast("OTP demo: " + otp);
        showAuthForm("otp");
      });
      $("#form-otp").addEventListener("submit", (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const pending = data().pendingOtp;
        if (!pending || pending.email !== M.state.pendingForgotEmail) { toast("Gửi OTP trước"); return; }
        if (fd.get("otp") !== pending.otp) { toast("OTP không đúng"); return; }
        data().users.find((u) => u.email === pending.email).password = fd.get("password");
        data().pendingOtp = null;
        persist();
        toast("Đã đặt lại mật khẩu");
        showAuthForm("login");
      });
      function onStatusConfirmClick(e) {
        const pBtn = e.target.closest("[data-confirm-pstatus]");
        if (pBtn) {
          e.preventDefault();
          e.stopPropagation();
          confirmPatientStatus(pBtn.dataset.pid, pBtn.dataset.confirmPstatus);
          return;
        }
        const rxBtn = e.target.closest("[data-confirm-rx]");
        if (rxBtn) {
          e.preventDefault();
          e.stopPropagation();
          confirmRxStatus(rxBtn.dataset.rxid, rxBtn.dataset.confirmRx);
        }
      }
      document.addEventListener("click", onStatusConfirmClick);

      $("#btn-add-patient").addEventListener("click", () => openPatientModal(null));
      $("#search-patient").addEventListener("input", renderPatients);
      $("#btn-back-patients")?.addEventListener("click", () => setView("patients"));
      $$("#patient-detail-tabs .detail-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          patientDetailTab = tab.dataset.ptab;
          renderPatientDetail();
        });
      });
      $("#btn-claim-patient-detail")?.addEventListener("click", () => {
        if (M.state.selectedPatientId) confirmClaimPatient(M.state.selectedPatientId);
      });
      $("#btn-release-patient-detail")?.addEventListener("click", () => {
        if (M.state.selectedPatientId) confirmReleasePatient(M.state.selectedPatientId);
      });
      $("#btn-admin-assign-doctor-detail")?.addEventListener("click", () => {
        if (M.state.selectedPatientId) openAdminAssignDoctorModal(M.state.selectedPatientId);
      });
      $("#btn-admin-release-patient-detail")?.addEventListener("click", () => {
        if (M.state.selectedPatientId) confirmAdminReleasePatient(M.state.selectedPatientId);
      });
      $("#btn-edit-patient-detail")?.addEventListener("click", () => {
        if (M.state.selectedPatientId) openPatientModal(M.state.selectedPatientId);
      });
      $("#btn-add-record-detail")?.addEventListener("click", () => {
        openRecordModal(null, M.state.selectedPatientId);
      });
      $("#btn-delete-patient-detail")?.addEventListener("click", () => {
        if (M.state.selectedPatientId) deletePatient(M.state.selectedPatientId);
      });
      $("#btn-add-record")?.addEventListener("click", () => openRecordModal(null, null));
      $("#search-records")?.addEventListener("input", renderRecords);
      $("#filter-records-patient")?.addEventListener("change", renderRecords);
      $("#btn-add-rx").addEventListener("click", () => openRxModal(null));
      $("#search-rx")?.addEventListener("input", renderRx);
      $("#search-history").addEventListener("input", renderHistory);
      $("#filter-history-date")?.addEventListener("change", renderHistory);
      $$("#history-status-chips .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          $$("#history-status-chips .chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          historyStatusFilter = chip.dataset.status;
          renderHistory();
        });
      });
      $$("#schedule-status-chips .chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          $$("#schedule-status-chips .chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          scheduleStatusFilter = chip.dataset.sstatus || "";
          renderSchedule();
        });
      });
      $("#btn-export-history").addEventListener("click", () => {
        downloadJson(data().history.map((h) => ({ thuoc: h.medName, bn: patientById(h.patientId)?.name, tt: h.status, at: h.at })), "lich-su.json");
        toast("Đã xuất lịch sử");
      });
      $("#view-notifications")?.addEventListener("click", onNotifListClick);
      $("#btn-mark-all-read")?.addEventListener("click", () => {
        const unreadList = data().notifications.filter((n) => !n.read);
        if (!unreadList.length) { toast("Không có thông báo chưa đọc"); return; }
        unreadList.forEach((n) => (n.read = true));
        persist();
        unreadList.forEach((n) => MedSync.run(() => MedSync.markNotifRead(n.id)));
        MedStore.log("Đánh dấu tất cả thông báo đã đọc");
        renderNotifications();
        updateNotifBadge();
        toast("Đã đọc tất cả thông báo");
      });
      $("#btn-clear-notif")?.addEventListener("click", () => {
        const n = data().notifications.filter((x) => x.read).length;
        if (!n) { toast("Không có thông báo đã đọc để xóa"); return; }
        data().notifications = data().notifications.filter((x) => !x.read);
        persist();
        MedStore.log("Xóa thông báo đã đọc");
        renderNotifications();
        updateNotifBadge();
        toast("Đã xóa " + n + " thông báo đã đọc");
      });
      setInterval(checkReminders, 60000);
      $("#btn-export-pdf").addEventListener("click", () => {
        const d = data();
        const w = window.open("", "_blank");
        w.document.write(`<html><head><meta charset="utf-8"><title>Báo cáo</title></head><body><h1>Báo cáo MedCare</h1><p>BN: ${d.patients.length}</p><p>Toa: ${d.prescriptions.length}</p><p>Lịch sử: ${d.history.length}</p><script>print()<\/script></body></html>`);
        w.document.close();
        toast("In / Lưu PDF");
      });
      $("#btn-share-report")?.addEventListener("click", () => {
        const d = data();
        const text = `MedCare báo cáo: ${d.patients.length} BN, ${d.prescriptions.length} toa, ${d.history.length} lịch sử`;
        if (navigator.share) {
          navigator.share({ title: "MedCare Báo cáo", text }).catch(() => {});
        } else {
          const a = document.createElement("a");
          a.href = "mailto:?subject=MedCare%20B%C3%A1o%20c%C3%A1o&body=" + encodeURIComponent(text);
          a.click();
        }
        toast("Chia sẻ báo cáo");
      });
      $("#setting-otp").addEventListener("change", (e) => { const u = currentUser(); if (u) { u.otpEnabled = e.target.checked; persist(); } });
      $("#setting-lang").addEventListener("change", (e) => {
        M.setLang(e.target.value);
        toast(t(e.target.value === "vi" ? "toast.langVi" : "toast.langEn"));
      });
      $("#setting-notif").addEventListener("change", (e) => { const u = currentUser(); if (u) { u.notifEnabled = e.target.checked; persist(); renderSettings(); } });
      $("#btn-lang-row")?.addEventListener("click", () => {
        const u = currentUser();
        if (!u) return;
        const next = u.lang === "vi" ? "en" : "vi";
        M.setLang(next);
        toast(t(next === "vi" ? "toast.langVi" : "toast.langEn"));
      });
      $("#btn-profile-info")?.addEventListener("click", () => {
        const u = currentUser();
        if (!u) return;
        openModal("Thông tin cá nhân",
          `<dl class="detail-grid">
            <dt>Vai trò</dt><dd>${esc(M.roleLabel(u.role))}</dd>
            <dt>Họ tên</dt><dd>${esc(u.name)}</dd>
            <dt>Email</dt><dd>${esc(u.email)}</dd>
            ${u.department ? `<dt>Chuyên khoa</dt><dd>${esc(u.department)}</dd>` : ""}
          </dl>`,
          `<button type="button" class="btn btn-primary" data-close-modal>Đóng</button>`);
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      });
      $("#btn-add-doctor")?.addEventListener("click", openDoctorModal);
      $("#btn-help")?.addEventListener("click", () => toast("Liên hệ hỗ trợ: support@hospital.vn"));
      $("#setting-sound")?.addEventListener("change", (e) => { const u = currentUser(); if (u) { u.soundEnabled = e.target.checked; persist(); } });
      $("#btn-change-pw").addEventListener("click", () => {
        openModal("Đổi mật khẩu", `<form id="modal-form"><div class="form-field"><label>Cũ</label><input type="password" name="old" required></div><div class="form-field"><label>Mới</label><input type="password" name="new" required></div></form>`, `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button><button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`);
        $("#modal-save").onclick = () => {
          const fd = new FormData($("#modal-form"));
          const u = currentUser();
          if (fd.get("old") !== u.password) { toast("Mật khẩu cũ sai"); return; }
          u.password = fd.get("new");
          persist();
          closeModal();
          toast("Đã đổi MK");
        };
        $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
      });
      $("#btn-backup").addEventListener("click", () => { downloadJson(data(), "medcare-backup.json"); toast("Đã backup"); });
      $("#btn-restore").addEventListener("click", () => $("#input-restore").click());
      $("#input-restore").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const parsed = JSON.parse(reader.result);
            MedStore.save(parsed);
            MedStore.invalidate();
            toast("Khôi phục xong — tải lại trang");
            setTimeout(() => location.reload(), 800);
          } catch { toast("File lỗi"); }
        };
        reader.readAsText(file);
      });
      $("#btn-sync").addEventListener("click", async () => {
        if (MedSync.useApi()) {
          try {
            await MedSync.pullAll();
            data().lastSync = new Date().toISOString();
            persist();
            renderAll();
            toast("Đã đồng bộ từ SQL Server");
            return;
          } catch (err) {
            toast(err.message || "Lỗi đồng bộ", "warn");
          }
        }
        data().lastSync = new Date().toISOString();
        persist();
        pushNotif("Đồng bộ OK", "sync");
        toast("Đã đồng bộ");
      });
      $("#btn-logout").addEventListener("click", () => {
        appConfirm({
          title: t("confirm.logout.title"),
          message: t("confirm.logout.msg"),
          variant: "danger",
          confirmText: t("confirm.logout.ok"),
          cancelText: t("confirm.logout.cancel"),
        }).then((ok) => { if (ok) exitApp(); });
      });

      $$(".nav-item").forEach((btn) => {
        btn.addEventListener("click", () => setView(btn.dataset.view));
      });
      $$("[data-goto]").forEach((btn) => btn.addEventListener("click", () => setView(btn.dataset.goto)));

      $("#screen-auth").classList.add("auth-ready");
      if (M.applyI18n) M.applyI18n();

      async function bootAuth() {
        const d = data();
        if (d.session?.source === "api" && d.session?.token) {
          try {
            const res = await MedApi.me();
            M.applyApiSession(d.session.token, res.user);
            enterApp();
            return;
          } catch (_) {
            d.session = null;
            persist();
          }
        } else if (d.session && currentUser()) {
          enterApp();
          return;
        }
        showAuthForm("login");
      }

      bootAuth();
    },

    initPart(id) {
      console.info("[MedCare] Task loaded: " + id);
    },
  };
})(MedCare);
