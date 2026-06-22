/**
 * MedCare Mobile Web App
 * Bản đồ COD1 ↔ code: xem file COD1-MAPPING.md (thư mục gốc dự án)
 * Tìm trong file: Ctrl+F "COD1-"
 */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  let chartDoses = null;
  let chartMeds = null;
  let pendingForgotEmail = null;

  const TITLES = {
    home: ["Trang chủ", "Dashboard tổng quan"],
    patients: ["Bệnh nhân", "Quản lý hồ sơ"],
    rx: ["Toa thuốc", "Danh sách & lịch nhắc"],
    history: ["Lịch sử", "Theo dõi uống thuốc"],
    reports: ["Báo cáo", "Thống kê & biểu đồ"],
    notifications: ["Thông báo", "Nhắc & cảnh báo"],
    settings: ["Cài đặt", "Bảo mật & đồng bộ"],
  };

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add("hidden"), 2800);
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function data() {
    return MedStore.get();
  }

  function persist() {
    MedStore.save(data());
  }

  function currentUser() {
    const d = data();
    if (!d.session) return null;
    return d.users.find((u) => u.id === d.session.userId) || null;
  }

  function patientById(id) {
    return data().patients.find((p) => p.id === id);
  }

  function rxById(id) {
    return data().prescriptions.find((r) => r.id === id);
  }

  /* ========== AUTH ==========
   * COD1-70  Đăng ký tài khoản
   * COD1-71  Đăng nhập hệ thống
   * COD1-90  Thiết kế giao diện đăng ký (kèm index.html + app.css #screen-auth)
   * COD1-91  Xây dựng chức năng đăng ký → #form-register
   * COD1-112 Xây dựng chức năng đăng nhập → #form-login, enterApp
   * COD1-115 Xác thực OTP → #form-otp
   * COD1-116 Quên mật khẩu → #form-forgot
   * COD1-120 Quản lý phiên → session, renderSettings #session-info
   */
  function showAuthForm(name) {
    ["form-login", "form-register", "form-forgot", "form-otp"].forEach((id) => {
      $("#" + id).classList.toggle("hidden", id !== "form-" + name);
    });
    $$(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.auth === name));
  }

  function enterApp() {
    $("#screen-auth").classList.remove("active");
    $("#screen-app").classList.add("active");
    renderAll();
    checkReminders();
  }

  function exitApp() {
    const d = data();
    d.session = null;
    persist();
    MedStore.log("Đăng xuất");
    $("#screen-app").classList.remove("active");
    $("#screen-auth").classList.add("active");
    showAuthForm("login");
  }

  $("#form-login").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get("email").trim().toLowerCase();
    const password = fd.get("password");
    const d = data();
    const user = d.users.find((u) => u.email === email && u.password === password);
    if (!user) {
      toast("Email hoặc mật khẩu không đúng");
      return;
    }
    d.session = { userId: user.id, loginAt: new Date().toISOString(), token: MedStore.uid("tok") };
    persist();
    MedStore.log("Đăng nhập: " + email);
    enterApp();
    toast("Chào " + user.name);
  });

  $("#form-register").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const email = fd.get("email").trim().toLowerCase();
    const d = data();
    if (d.users.some((u) => u.email === email)) {
      toast("Email đã tồn tại");
      return;
    }
    const user = {
      id: MedStore.uid("u"),
      email,
      password: fd.get("password"),
      name: fd.get("name").trim(),
      otpEnabled: false,
      lang: "vi",
      notifEnabled: true,
      createdAt: new Date().toISOString(),
    };
    d.users.push(user);
    d.session = { userId: user.id, loginAt: new Date().toISOString(), token: MedStore.uid("tok") };
    persist();
    MedStore.log("Đăng ký: " + email);
    enterApp();
    toast("Đăng ký thành công");
  });

  $$(".auth-tab").forEach((btn) => {
    btn.addEventListener("click", () => showAuthForm(btn.dataset.auth));
  });

  $("#btn-forgot").addEventListener("click", () => showAuthForm("forgot"));

  $$("[data-back-login]").forEach((b) => b.addEventListener("click", () => showAuthForm("login")));

  $("#form-forgot").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = new FormData(e.target).get("email").trim().toLowerCase();
    const user = data().users.find((u) => u.email === email);
    if (!user) {
      toast("Không tìm thấy email");
      return;
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    data().pendingOtp = { email, otp, exp: Date.now() + 300000 };
    pendingForgotEmail = email;
    persist();
    toast("OTP demo: " + otp);
    showAuthForm("otp");
  });

  $("#form-otp").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const pending = data().pendingOtp;
    if (!pending || pending.email !== pendingForgotEmail) {
      toast("Vui lòng gửi OTP trước");
      return;
    }
    if (fd.get("otp") !== pending.otp) {
      toast("OTP không đúng (COD1-115)");
      return;
    }
    if (Date.now() > pending.exp) {
      toast("OTP hết hạn");
      return;
    }
    const user = data().users.find((u) => u.email === pending.email);
    user.password = fd.get("password");
    data().pendingOtp = null;
    persist();
    MedStore.log("Đổi mật khẩu qua OTP");
    toast("Đã đặt lại mật khẩu");
    showAuthForm("login");
  });

  /* ---------- NAV ---------- */
  function setView(name) {
    $$(".view").forEach((v) => v.classList.remove("active"));
    const view = $("#view-" + name);
    if (view) view.classList.add("active");
    const t = TITLES[name] || [name, ""];
    $("#page-title").textContent = t[0];
    $("#page-sub").textContent = t[1];
    $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === name || (name === "reports" || name === "notifications" || name === "settings") && n.dataset.view === "more"));
    if (name === "reports") renderCharts();
    if (name === "notifications") renderNotifications();
    if (name === "settings") renderSettings();
    $("#more-sheet").classList.add("hidden");
  }

  $$(".nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.view === "more") {
        $("#more-sheet").classList.toggle("hidden");
        return;
      }
      setView(btn.dataset.view);
    });
  });

  $$("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.goto));
  });

  $(".sheet-backdrop")?.addEventListener("click", () => $("#more-sheet").classList.add("hidden"));

  $("#btn-notif-bell").addEventListener("click", () => setView("notifications"));

  /* ---------- MODAL ---------- */
  function openModal(title, bodyHtml, footHtml) {
    $("#modal-title").textContent = title;
    $("#modal-body").innerHTML = bodyHtml;
    $("#modal-foot").innerHTML = footHtml || "";
    $("#modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    $("#modal").classList.add("hidden");
    document.body.style.overflow = "";
  }

  $$("#modal .modal-close, #modal .modal-backdrop").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  /* ========== PATIENTS ==========
   * COD1-74,122  Tạo hồ sơ → openPatientModal(null), savePatientFromForm
   * COD1-75,123  Cập nhật hồ sơ → savePatientFromForm(id)
   * COD1-76,125  Xóa hồ sơ → showPatientDetail [data-del-patient]
   * COD1-82,114  Tìm kiếm BN → #search-patient, renderPatients filter
   * COD1-129      Chi tiết hồ sơ → showPatientDetail
   * COD1-131      Upload ảnh → patientForm avatarFile, FileReader
   * COD1-97       Đồng bộ BN → backup/restore/sync (patients[])
   */
  function renderPatients() {
    const q = ($("#search-patient").value || "").toLowerCase();
    const list = data().patients.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || (p.code || "").toLowerCase().includes(q) || (p.phone || "").includes(q)
    );
    const el = $("#patient-list");
    if (!list.length) {
      el.innerHTML = '<p class="list-empty-hint">Chưa có bệnh nhân. Bấm + Thêm (COD1-74)</p>';
      return;
    }
    el.innerHTML = list
      .map((p) => {
        const ini = p.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
        const av = p.avatar
          ? `<img src="${esc(p.avatar)}" alt="">`
          : ini;
        return `
        <article class="patient-card" data-id="${p.id}">
          <div class="avatar">${av}</div>
          <div>
            <div class="card-title">${esc(p.name)}</div>
            <div class="card-meta">${esc(p.code)} · ${esc(p.phone || "—")}</div>
          </div>
        </article>`;
      })
      .join("");
    el.querySelectorAll(".patient-card").forEach((card) => {
      card.addEventListener("click", () => showPatientDetail(card.dataset.id));
    });
  }

  function patientForm(p) {
    return `
      <div class="form-field"><label>Mã BN</label><input name="code" value="${esc(p?.code || "")}" required></div>
      <div class="form-field"><label>Họ tên</label><input name="name" value="${esc(p?.name || "")}" required></div>
      <div class="form-field"><label>Điện thoại</label><input name="phone" type="tel" value="${esc(p?.phone || "")}"></div>
      <div class="form-field"><label>Ngày sinh</label><input name="birth" type="date" value="${esc(p?.birth || "")}"></div>
      <div class="form-field"><label>Ảnh đại diện (base64)</label><input name="avatarFile" type="file" accept="image/*"></div>
      <div class="form-field"><label>Ghi chú</label><textarea name="note">${esc(p?.note || "")}</textarea></div>`;
  }

  function savePatientFromForm(form, id) {
    const fd = new FormData(form);
    const d = data();
    const payload = {
      code: fd.get("code").trim(),
      name: fd.get("name").trim(),
      phone: fd.get("phone").trim(),
      birth: fd.get("birth"),
      note: fd.get("note").trim(),
    };
    const file = fd.get("avatarFile");
    const done = () => {
      if (id) {
        const p = patientById(id);
        Object.assign(p, payload, { updatedAt: new Date().toISOString() });
        MedStore.log("Cập nhật BN: " + p.name);
        toast("Đã cập nhật hồ sơ (COD1-75)");
      } else {
        d.patients.push({
          id: MedStore.uid("p"),
          code: payload.code,
          name: payload.name,
          phone: payload.phone,
          birth: payload.birth,
          note: payload.note,
          avatar: payload.avatar || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        MedStore.log("Tạo BN: " + payload.name);
        toast("Đã tạo hồ sơ (COD1-74)");
      }
      persist();
      renderPatients();
      renderDashboard();
      closeModal();
    };
    if (file && file.size) {
      const reader = new FileReader();
      reader.onload = () => {
        payload.avatar = reader.result;
        done();
      };
      reader.readAsDataURL(file);
    } else {
      if (id) payload.avatar = patientById(id).avatar;
      done();
    }
  }

  function showPatientDetail(id) {
    const p = patientById(id);
    if (!p) return;
    const rxCount = data().prescriptions.filter((r) => r.patientId === id).length;
    openModal(
      "Chi tiết hồ sơ (COD1-129)",
      `<dl class="detail-grid">
        <dt>Mã</dt><dd>${esc(p.code)}</dd>
        <dt>Họ tên</dt><dd>${esc(p.name)}</dd>
        <dt>Điện thoại</dt><dd>${esc(p.phone)}</dd>
        <dt>Ngày sinh</dt><dd>${esc(p.birth)}</dd>
        <dt>Toa thuốc</dt><dd>${rxCount}</dd>
        <dt>Ghi chú</dt><dd>${esc(p.note)}</dd>
      </dl>`,
      `<button type="button" class="btn btn-secondary" data-edit-patient="${id}">Sửa</button>
       <button type="button" class="btn btn-danger" data-del-patient="${id}">Xóa</button>
       <button type="button" class="btn btn-primary" data-close-modal>Đóng</button>`
    );
    $("[data-edit-patient]", $("#modal-foot"))?.addEventListener("click", () => {
      closeModal();
      openPatientModal(id);
    });
    $("[data-del-patient]", $("#modal-foot"))?.addEventListener("click", () => {
      if (!confirm("Xóa hồ sơ " + p.name + "? (COD1-76)")) return;
      const d = data();
      d.patients = d.patients.filter((x) => x.id !== id);
      d.prescriptions = d.prescriptions.filter((r) => r.patientId !== id);
      d.reminders = d.reminders.filter((r) => r.patientId !== id);
      persist();
      MedStore.log("Xóa BN: " + p.name);
      toast("Đã xóa hồ sơ");
      closeModal();
      renderAll();
    });
    $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
  }

  function openPatientModal(id) {
    const p = id ? patientById(id) : null;
    openModal(
      id ? "Cập nhật hồ sơ" : "Tạo hồ sơ bệnh nhân",
      `<form id="modal-form">${patientForm(p)}</form>`,
      `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button>
       <button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`
    );
    $("#modal-save").onclick = () => savePatientFromForm($("#modal-form"), id);
    $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
  }

  $("#btn-add-patient").addEventListener("click", () => openPatientModal(null));
  $("#search-patient").addEventListener("input", renderPatients);

  /* ========== PRESCRIPTIONS ==========
   * COD1-78,133  Thêm toa → openRxModal(null), saveRxFromForm
   * COD1-72,135  Sửa toa → saveRxFromForm(id)
   * COD1-136     Xóa toa → showRxDetail [data-del-rx]
   * COD1-73,137  Danh sách → renderRx, #rx-list
   * COD1-138     Chi tiết toa → showRxDetail
   * COD1-83      Lọc danh sách thuốc → #filter-rx-status, #filter-rx-date
   * COD1-117     Tìm thuốc → #search-rx
   * COD1-119     Lọc theo ngày → filter-rx-date trong renderRx
   * COD1-124     Lọc trạng thái → filter-rx-status
   * COD1-99      Đồng bộ toa → backup/restore
   * COD1-77,139  Tạo lịch nhắc → syncRemindersForRx, openReminderModal
   * COD1-140     Sửa lịch nhắc → openReminderModal save
   * COD1-141     Hủy lịch nhắc → #modal-cancel-rem
   * COD1-95      Giờ uống thuốc → rx.times, reminders[].time
   */
  function renderRx() {
    const q = ($("#search-rx").value || "").toLowerCase();
    const status = $("#filter-rx-status").value;
    const dateFilter = $("#filter-rx-date").value;
    let list = data().prescriptions;
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q));
    if (status) list = list.filter((r) => r.status === status);
    if (dateFilter) list = list.filter((r) => r.startDate <= dateFilter && (!r.endDate || r.endDate >= dateFilter));

    const el = $("#rx-list");
    if (!list.length) {
      el.innerHTML = '<p class="list-empty-hint">Chưa có toa thuốc (COD1-78)</p>';
      return;
    }
    el.innerHTML = list
      .map((r) => {
        const p = patientById(r.patientId);
        const st = r.status || "active";
        return `
        <article class="rx-card" data-id="${r.id}">
          <div class="card-title">${esc(r.name)}</div>
          <div class="card-meta">${esc(p?.name || "—")} · ${esc(r.dosage)} · ${esc(r.frequency)}</div>
          <span class="status-pill status-${st}">${st === "active" ? "Đang dùng" : st === "done" ? "Hoàn thành" : "Tạm dừng"}</span>
        </article>`;
      })
      .join("");
    el.querySelectorAll(".rx-card").forEach((c) => c.addEventListener("click", () => showRxDetail(c.dataset.id)));
  }

  function rxForm(r) {
    const patients = data().patients
      .map((p) => `<option value="${p.id}" ${r?.patientId === p.id ? "selected" : ""}>${esc(p.name)}</option>`)
      .join("");
    const times = (r?.times || ["08:00"]).join(", ");
    return `
      <div class="form-field"><label>Bệnh nhân</label><select name="patientId" required>${patients || "<option value=''>Chưa có BN</option>"}</select></div>
      <div class="form-field"><label>Tên thuốc</label><input name="name" value="${esc(r?.name || "")}" required></div>
      <div class="form-row">
        <div class="form-field"><label>Liều</label><input name="dosage" value="${esc(r?.dosage || "")}"></div>
        <div class="form-field"><label>Tần suất</label><input name="frequency" value="${esc(r?.frequency || "")}"></div>
      </div>
      <div class="form-field"><label>Giờ uống (cách nhau dấu phẩy)</label><input name="times" value="${esc(times)}" placeholder="08:00, 20:00"></div>
      <div class="form-row">
        <div class="form-field"><label>Từ ngày</label><input name="startDate" type="date" value="${esc(r?.startDate || new Date().toISOString().slice(0, 10))}"></div>
        <div class="form-field"><label>Đến ngày</label><input name="endDate" type="date" value="${esc(r?.endDate || "")}"></div>
      </div>
      <div class="form-field"><label>Trạng thái</label>
        <select name="status">
          <option value="active" ${r?.status === "active" ? "selected" : ""}>Đang dùng</option>
          <option value="paused" ${r?.status === "paused" ? "selected" : ""}>Tạm dừng</option>
          <option value="done" ${r?.status === "done" ? "selected" : ""}>Hoàn thành</option>
        </select>
      </div>
      <div class="form-field"><label>Ghi chú</label><textarea name="note">${esc(r?.note || "")}</textarea></div>`;
  }

  function syncRemindersForRx(rx) {
    const d = data();
    d.reminders = d.reminders.filter((rem) => rem.rxId !== rx.id);
    if (rx.status !== "active") return;
    (rx.times || []).forEach((time) => {
      d.reminders.push({
        id: MedStore.uid("rem"),
        rxId: rx.id,
        patientId: rx.patientId,
        time: time.trim(),
        days: [0, 1, 2, 3, 4, 5, 6],
        active: true,
      });
    });
  }

  function saveRxFromForm(form, id) {
    const fd = new FormData(form);
    const times = (fd.get("times") || "08:00")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      patientId: fd.get("patientId"),
      name: fd.get("name").trim(),
      dosage: fd.get("dosage").trim(),
      frequency: fd.get("frequency").trim(),
      times,
      status: fd.get("status"),
      startDate: fd.get("startDate"),
      endDate: fd.get("endDate"),
      note: fd.get("note").trim(),
    };
    const d = data();
    let rx;
    if (id) {
      rx = rxById(id);
      Object.assign(rx, payload);
      MedStore.log("Sửa toa: " + rx.name);
      toast("Đã cập nhật toa (COD1-72)");
    } else {
      rx = { id: MedStore.uid("rx"), ...payload, createdAt: new Date().toISOString() };
      d.prescriptions.push(rx);
      MedStore.log("Thêm toa: " + rx.name);
      toast("Đã thêm toa thuốc (COD1-78)");
    }
    syncRemindersForRx(rx);
    persist();
    pushNotif("Đã lên lịch nhắc cho " + rx.name, "reminder");
    renderRx();
    renderDashboard();
    closeModal();
  }

  function showRxDetail(id) {
    const r = rxById(id);
    const p = patientById(r.patientId);
    const rems = data().reminders.filter((rem) => rem.rxId === id && rem.active);
    openModal(
      "Chi tiết toa (COD1-138)",
      `<dl class="detail-grid">
        <dt>Thuốc</dt><dd>${esc(r.name)}</dd>
        <dt>Bệnh nhân</dt><dd>${esc(p?.name)}</dd>
        <dt>Liều / Tần suất</dt><dd>${esc(r.dosage)} · ${esc(r.frequency)}</dd>
        <dt>Giờ uống</dt><dd>${esc((r.times || []).join(", "))}</dd>
        <dt>Lịch nhắc</dt><dd>${rems.length} khung giờ</dd>
        <dt>Ghi chú</dt><dd>${esc(r.note)}</dd>
      </dl>`,
      `<button type="button" class="btn btn-secondary" data-edit-rx="${id}">Sửa</button>
       <button type="button" class="btn btn-secondary" data-rem-rx="${id}">Lịch nhắc</button>
       <button type="button" class="btn btn-danger" data-del-rx="${id}">Xóa</button>`
    );
    $("[data-edit-rx]", $("#modal-foot"))?.addEventListener("click", () => {
      closeModal();
      openRxModal(id);
    });
    $("[data-rem-rx]", $("#modal-foot"))?.addEventListener("click", () => {
      closeModal();
      openReminderModal(id);
    });
    $("[data-del-rx]", $("#modal-foot"))?.addEventListener("click", () => {
      if (!confirm("Xóa toa này? (COD1-136)")) return;
      const d = data();
      d.prescriptions = d.prescriptions.filter((x) => x.id !== id);
      d.reminders = d.reminders.filter((rem) => rem.rxId !== id);
      persist();
      MedStore.log("Xóa toa: " + r.name);
      toast("Đã xóa toa thuốc");
      closeModal();
      renderAll();
    });
  }

  function openRxModal(id) {
    const r = id ? rxById(id) : null;
    openModal(
      id ? "Chỉnh sửa toa" : "Thêm toa thuốc",
      `<form id="modal-form">${rxForm(r)}</form>`,
      `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button>
       <button type="button" class="btn btn-ghost" data-close-modal>Hủy</button>`
    );
    $("#modal-save").onclick = () => saveRxFromForm($("#modal-form"), id);
    $("[data-close-modal]", $("#modal-foot"))?.addEventListener("click", closeModal);
  }

  function openReminderModal(rxId) {
    const r = rxById(rxId);
    const rems = data().reminders.filter((rem) => rem.rxId === rxId);
    const times = rems.map((rem) => rem.time).join(", ") || (r.times || []).join(", ");
    openModal(
      "Lịch nhắc thuốc (COD1-139)",
      `<form id="modal-form">
        <div class="form-field"><label>Giờ nhắc (phẩy)</label><input name="times" value="${esc(times)}"></div>
        <p style="font-size:0.8rem;color:var(--muted)">Hủy tất cả nhắc: để trống và lưu</p>
      </form>`,
      `<button type="button" class="btn btn-primary" id="modal-save">Lưu lịch</button>
       <button type="button" class="btn btn-danger" id="modal-cancel-rem">Hủy lịch (COD1-141)</button>`
    );
    $("#modal-save").onclick = () => {
      const t = new FormData($("#modal-form")).get("times");
      r.times = t.split(",").map((x) => x.trim()).filter(Boolean);
      syncRemindersForRx(r);
      persist();
      toast("Đã cập nhật lịch (COD1-140)");
      closeModal();
      renderDashboard();
    };
    $("#modal-cancel-rem").onclick = () => {
      data().reminders.forEach((rem) => {
        if (rem.rxId === rxId) rem.active = false;
      });
      r.status = "paused";
      persist();
      toast("Đã hủy lịch nhắc");
      closeModal();
      renderAll();
    };
  }

  $("#btn-add-rx").addEventListener("click", () => openRxModal(null));
  $("#search-rx").addEventListener("input", renderRx);
  $("#filter-rx-status").addEventListener("change", renderRx);
  $("#filter-rx-date").addEventListener("change", renderRx);

  /* ========== HISTORY ==========
   * COD1-80   Lưu lịch sử → addHistory
   * COD1-101  Đã uống → addHistory(..., "taken")
   * COD1-104  Bỏ qua → addHistory(..., "skipped")
   * COD1-81,106 Hiển thị lịch sử → renderHistory
   * COD1-110  Tìm lịch sử → #search-history
   * COD1-111  Xuất lịch sử → #btn-export-history
   */
  function addHistory(rxId, status) {
    const rx = rxById(rxId);
    if (!rx) return;
    const entry = {
      id: MedStore.uid("h"),
      rxId,
      patientId: rx.patientId,
      medName: rx.name,
      status,
      at: new Date().toISOString(),
    };
    data().history.unshift(entry);
    if (data().history.length > 500) data().history.splice(500);
    persist();
    const msg = status === "taken" ? "Đã ghi nhận uống thuốc (COD1-101)" : "Đã ghi bỏ qua (COD1-104)";
    MedStore.log(msg + ": " + rx.name);
    if (status === "skipped") pushNotif("Bỏ qua: " + rx.name, "warn");
  }

  function renderHistory() {
    const q = ($("#search-history").value || "").toLowerCase();
    let list = data().history;
    if (q) list = list.filter((h) => h.medName.toLowerCase().includes(q) || (patientById(h.patientId)?.name || "").toLowerCase().includes(q));

    const el = $("#history-list");
    if (!list.length) {
      el.innerHTML = '<p class="list-empty-hint">Chưa có lịch sử (COD1-81)</p>';
      return;
    }
    el.innerHTML = list
      .slice(0, 80)
      .map((h) => {
        const p = patientById(h.patientId);
        const st = h.status === "taken" ? "✅ Đã uống" : "⏭ Bỏ qua";
        const dt = new Date(h.at).toLocaleString("vi-VN");
        return `
        <article class="history-card">
          <div class="card-title">${esc(h.medName)}</div>
          <div class="card-meta">${esc(p?.name)} · ${st} · ${dt}</div>
        </article>`;
      })
      .join("");
  }

  $("#search-history").addEventListener("input", renderHistory);

  $("#btn-export-history").addEventListener("click", () => {
    const rows = data().history.map((h) => ({
      thuoc: h.medName,
      benhNhan: patientById(h.patientId)?.name,
      trangThai: h.status,
      thoiGian: h.at,
    }));
    downloadJson(rows, "lich-su-thuoc.json");
    toast("Đã xuất lịch sử (COD1-111)");
  });

  /* ========== NOTIFICATIONS ==========
   * COD1-87,103 Push notification → pushNotif, checkReminders
   * COD1-105      Cảnh báo quên thuốc → stat-missed, pushNotif warn
   * COD1-107      Quản lý DS thông báo → renderNotifications
   * COD1-108      Đánh dấu đã đọc → [data-read], btn-mark-all-read
   * COD1-109      Xóa thông báo → [data-del-n], btn-clear-notif
   * COD1-121      Cài đặt thông báo → #setting-notif
   */
  function pushNotif(message, type) {
    const user = currentUser();
    if (user && !user.notifEnabled) return;
    data().notifications.unshift({
      id: MedStore.uid("n"),
      message,
      type: type || "info",
      read: false,
      at: new Date().toISOString(),
    });
    if (data().notifications.length > 80) data().notifications.splice(80);
    persist();
    updateNotifBadge();
  }

  function updateNotifBadge() {
    const n = data().notifications.filter((x) => !x.read).length;
    const badge = $("#notif-badge");
    badge.textContent = n;
    badge.classList.toggle("hidden", n === 0);
  }

  function renderNotifications() {
    const list = data().notifications;
    const el = $("#notif-list");
    if (!list.length) {
      el.innerHTML = '<p class="list-empty-hint">Không có thông báo</p>';
      return;
    }
    el.innerHTML = list
      .map(
        (n) => `
      <article class="notif-card ${n.read ? "" : "unread"}" data-id="${n.id}">
        <div class="card-title">${esc(n.message)}</div>
        <div class="card-meta">${new Date(n.at).toLocaleString("vi-VN")}</div>
        <div class="notif-actions">
          ${n.read ? "" : `<button type="button" class="btn btn-sm btn-secondary" data-read="${n.id}">Đã đọc</button>`}
          <button type="button" class="btn btn-sm btn-ghost" data-del-n="${n.id}">Xóa</button>
        </div>
      </article>`
      )
      .join("");
    el.querySelectorAll("[data-read]").forEach((b) =>
      b.addEventListener("click", () => {
        const x = data().notifications.find((n) => n.id === b.dataset.read);
        if (x) x.read = true;
        persist();
        renderNotifications();
        updateNotifBadge();
      })
    );
    el.querySelectorAll("[data-del-n]").forEach((b) =>
      b.addEventListener("click", () => {
        data().notifications = data().notifications.filter((n) => n.id !== b.dataset.delN);
        persist();
        renderNotifications();
        updateNotifBadge();
      })
    );
  }

  $("#btn-mark-all-read").addEventListener("click", () => {
    data().notifications.forEach((n) => (n.read = true));
    persist();
    renderNotifications();
    updateNotifBadge();
    toast("Đã đọc tất cả (COD1-108)");
  });

  $("#btn-clear-notif").addEventListener("click", () => {
    data().notifications = data().notifications.filter((n) => !n.read);
    persist();
    renderNotifications();
    updateNotifBadge();
    toast("Đã xóa thông báo đã đọc (COD1-109)");
  });

  /* ========== DASHBOARD & REMINDERS ==========
   * COD1-128 Dashboard → renderDashboard, #view-home .dash-cards
   * COD1-79  Nhận thông báo uống thuốc → renderTodayReminders
   * COD1-92  Lập lịch thông báo → syncRemindersForRx, checkReminders
   * COD1-127 Nhật ký (gần đây) → #recent-activity, MedStore.log
   */
  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function renderTodayReminders() {
    const d = data();
    const day = new Date().getDay();
    const active = d.reminders.filter((rem) => rem.active && rem.days.includes(day));
    const takenToday = new Set(
      d.history.filter((h) => h.at.startsWith(todayKey()) && h.status === "taken").map((h) => h.rxId + h.at.slice(11, 16))
    );

    const el = $("#today-reminders");
    if (!active.length) {
      el.innerHTML = '<p class="list-empty-hint">Thêm toa thuốc để có lịch nhắc</p>';
      return;
    }

    const sorted = [...active].sort((a, b) => a.time.localeCompare(b.time));
    el.innerHTML = sorted
      .map((rem) => {
        const rx = rxById(rem.rxId);
        const p = patientById(rem.patientId);
        const done = d.history.some(
          (h) => h.rxId === rem.rxId && h.status === "taken" && h.at.startsWith(todayKey()) && h.at.includes(rem.time.slice(0, 2))
        );
        return `
        <div class="reminder-item ${done ? "done" : ""}" data-rx="${rem.rxId}">
          <span class="reminder-time">${esc(rem.time)}</span>
          <div>
            <div class="card-title">${esc(rx?.name)}</div>
            <div class="card-meta">${esc(p?.name)}</div>
          </div>
          ${
            done
              ? ""
              : `<div class="reminder-actions">
            <button type="button" class="btn-taken" data-taken="${rem.rxId}">Đã uống</button>
            <button type="button" class="btn-skip" data-skip="${rem.rxId}">Bỏ qua</button>
          </div>`
          }
        </div>`;
      })
      .join("");

    el.querySelectorAll("[data-taken]").forEach((b) =>
      b.addEventListener("click", () => {
        addHistory(b.dataset.taken, "taken");
        pushNotif("Đã uống: " + rxById(b.dataset.taken)?.name, "info");
        renderTodayReminders();
        renderHistory();
        renderDashboard();
        toast("Ghi nhận đã uống");
      })
    );
    el.querySelectorAll("[data-skip]").forEach((b) =>
      b.addEventListener("click", () => {
        addHistory(b.dataset.skip, "skipped");
        renderTodayReminders();
        renderHistory();
        renderDashboard();
        toast("Đã bỏ qua");
      })
    );
  }

  function renderDashboard() {
    const d = data();
    $("#stat-patients").textContent = d.patients.length;
    $("#stat-rx").textContent = d.prescriptions.filter((r) => r.status === "active").length;
    const day = new Date().getDay();
    $("#stat-today").textContent = d.reminders.filter((r) => r.active && r.days.includes(day)).length;
    const missed = d.history.filter((h) => h.status === "skipped" && h.at.startsWith(todayKey())).length;
    $("#stat-missed").textContent = missed;

    const recent = $("#recent-activity");
    recent.innerHTML = d.activityLog
      .slice(0, 6)
      .map((a) => `<div class="activity-item">${new Date(a.at).toLocaleString("vi-VN")} — ${esc(a.text)}</div>`)
      .join("");

    renderTodayReminders();
    updateNotifBadge();
  }

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

  setInterval(checkReminders, 60000);

  /* ========== REPORTS ==========
   * COD1-84  Xem báo cáo → setView reports
   * COD1-130 Thống kê số lần uống → #chart-doses
   * COD1-132 Thống kê thuốc → #chart-meds
   * COD1-134 Biểu đồ theo thời gian → renderCharts 7 ngày
   * COD1-85,93 Xuất PDF → #btn-export-pdf
   */
  function renderCharts() {
    if (typeof Chart === "undefined") return;
    const d = data();
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setDate(dt.getDate() - i);
      last7.push(dt.toISOString().slice(0, 10));
    }
    const takenByDay = last7.map((day) => d.history.filter((h) => h.status === "taken" && h.at.startsWith(day)).length);
    const skippedByDay = last7.map((day) => d.history.filter((h) => h.status === "skipped" && h.at.startsWith(day)).length);

    const labels = last7.map((day) => day.slice(5));

    if (chartDoses) chartDoses.destroy();
    chartDoses = new Chart($("#chart-doses"), {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Đã uống", data: takenByDay, borderColor: "#0d9488", tension: 0.3 },
          { label: "Bỏ qua", data: skippedByDay, borderColor: "#f59e0b", tension: 0.3 },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Số lần uống / bỏ qua (COD1-130)" } } },
    });

    const medCounts = {};
    d.history.filter((h) => h.status === "taken").forEach((h) => {
      medCounts[h.medName] = (medCounts[h.medName] || 0) + 1;
    });
    const medLabels = Object.keys(medCounts);
    const medData = Object.values(medCounts);

    if (chartMeds) chartMeds.destroy();
    chartMeds = new Chart($("#chart-meds"), {
      type: "doughnut",
      data: {
        labels: medLabels.length ? medLabels : ["Chưa có dữ liệu"],
        datasets: [{ data: medData.length ? medData : [1], backgroundColor: ["#0d9488", "#6366f1", "#f59e0b", "#ec4899"] }],
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: "Thuốc đã dùng (COD1-132)" } } },
    });
  }

  $("#btn-export-pdf").addEventListener("click", () => {
    const d = data();
    const w = window.open("", "_blank");
    const taken = d.history.filter((h) => h.status === "taken").length;
    const skipped = d.history.filter((h) => h.status === "skipped").length;
    w.document.write(`
      <html><head><meta charset="utf-8"><title>Báo cáo MedCare</title>
      <style>body{font-family:Segoe UI,sans-serif;padding:2rem}h1{color:#0d9488}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px}</style></head><body>
      <h1>Báo cáo sử dụng thuốc</h1>
      <p>Ngày in: ${new Date().toLocaleString("vi-VN")}</p>
      <p>Bệnh nhân: ${d.patients.length} · Toa active: ${d.prescriptions.filter((r) => r.status === "active").length}</p>
      <p>Đã uống: ${taken} · Bỏ qua: ${skipped}</p>
      <h2>Lịch sử gần đây</h2>
      <table><tr><th>Thuốc</th><th>BN</th><th>TT</th><th>Thời gian</th></tr>
      ${d.history
        .slice(0, 30)
        .map(
          (h) =>
            `<tr><td>${h.medName}</td><td>${patientById(h.patientId)?.name || ""}</td><td>${h.status}</td><td>${new Date(h.at).toLocaleString("vi-VN")}</td></tr>`
        )
        .join("")}
      </table>
      <script>window.print()<\/script></body></html>`);
    w.document.close();
    toast("Mở cửa sổ in / Lưu PDF (COD1-85)");
  });

  /* ========== SETTINGS & SYNC ==========
   * COD1-88,113 Đổi mật khẩu → #btn-change-pw
   * COD1-89       Bật OTP → #setting-otp
   * COD1-118      Ngôn ngữ → #setting-lang
   * COD1-120      Phiên đăng nhập → #session-info, exitApp
   * COD1-127      Nhật ký hoạt động → #activity-log
   * COD1-86       Đồng bộ dữ liệu → #btn-sync
   * COD1-94       Firebase (mô phỏng) → #btn-sync
   * COD1-100      Backup → #btn-backup
   * COD1-102      Khôi phục → #btn-restore
   * COD1-126      Tối ưu tìm kiếm → input realtime renderPatients/Rx/History
   */
  function renderSettings() {
    const u = currentUser();
    const d = data();
    if (!u) return;
    $("#setting-otp").checked = u.otpEnabled;
    $("#setting-lang").value = u.lang || "vi";
    $("#setting-notif").checked = u.notifEnabled !== false;
    $("#session-info").innerHTML = `
      <div>Email: ${esc(u.email)}</div>
      <div>Đăng nhập: ${d.session ? new Date(d.session.loginAt).toLocaleString("vi-VN") : "—"}</div>
      <div>Token phiên: ${esc((d.session?.token || "").slice(0, 12))}…</div>`;
    $("#activity-log").innerHTML = d.activityLog
      .slice(0, 15)
      .map((a) => `<div class="activity-item">${new Date(a.at).toLocaleString("vi-VN")} — ${esc(a.text)}</div>`)
      .join("");
  }

  $("#setting-otp").addEventListener("change", (e) => {
    const u = currentUser();
    if (u) {
      u.otpEnabled = e.target.checked;
      persist();
      toast(u.otpEnabled ? "Đã bật OTP (COD1-89)" : "Đã tắt OTP");
    }
  });

  $("#setting-lang").addEventListener("change", (e) => {
    const u = currentUser();
    if (u) {
      u.lang = e.target.value;
      persist();
      toast("Ngôn ngữ: " + (u.lang === "vi" ? "Tiếng Việt" : "English"));
    }
  });

  $("#setting-notif").addEventListener("change", (e) => {
    const u = currentUser();
    if (u) {
      u.notifEnabled = e.target.checked;
      persist();
      toast("Cài đặt thông báo (COD1-121)");
    }
  });

  $("#btn-change-pw").addEventListener("click", () => {
    openModal(
      "Đổi mật khẩu (COD1-88)",
      `<form id="modal-form">
        <div class="form-field"><label>Mật khẩu cũ</label><input type="password" name="old" required></div>
        <div class="form-field"><label>Mật khẩu mới</label><input type="password" name="new" required minlength="6"></div>
      </form>`,
      `<button type="button" class="btn btn-primary" id="modal-save">Lưu</button>`
    );
    $("#modal-save").onclick = () => {
      const fd = new FormData($("#modal-form"));
      const u = currentUser();
      if (fd.get("old") !== u.password) {
        toast("Mật khẩu cũ sai");
        return;
      }
      u.password = fd.get("new");
      persist();
      MedStore.log("Đổi mật khẩu");
      toast("Đã đổi mật khẩu");
      closeModal();
    };
  });

  function downloadJson(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  $("#btn-backup").addEventListener("click", () => {
    const payload = data();
    downloadJson(payload, "medcare-backup-" + todayKey() + ".json");
    MedStore.log("Backup dữ liệu (COD1-100)");
    toast("Đã tải file backup");
  });

  $("#btn-restore").addEventListener("click", () => $("#input-restore").click());

  $("#input-restore").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.patients || !parsed.users) throw new Error("invalid");
        localStorage.setItem("medcare_v1", JSON.stringify(parsed));
        MedStore.log("Khôi phục dữ liệu (COD1-102)");
        toast("Đã khôi phục — tải lại trang");
        setTimeout(() => location.reload(), 800);
      } catch {
        toast("File không hợp lệ");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  $("#btn-sync").addEventListener("click", () => {
    const d = data();
    d.lastSync = new Date().toISOString();
    persist();
    MedStore.log("Đồng bộ Firebase (mô phỏng COD1-94)");
    pushNotif("Đồng bộ thành công: BN, toa, lịch sử", "sync");
    toast("Đã đồng bộ (demo)");
  });

  $("#btn-logout").addEventListener("click", () => {
    if (confirm("Đăng xuất?")) exitApp();
  });

  /* ---------- INIT ---------- */
  function renderAll() {
    renderDashboard();
    renderPatients();
    renderRx();
    renderHistory();
    updateNotifBadge();
  }

  function init() {
    const d = data();
    if (d.session && currentUser()) {
      enterApp();
    } else {
      showAuthForm("login");
    }
  }

  init();
})();
