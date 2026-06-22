/**

 * MedCare — localStorage persistence (demo, no backend)

 */

const MedStore = (function () {

  const KEY = "medcare_v2";
  let _cache = null;

  function load() {

    try {

      const raw = localStorage.getItem(KEY);

      if (raw) return JSON.parse(raw);

    } catch (_) {}

    return null;

  }



  function save(data) {
    _cache = data;
    localStorage.setItem(KEY, JSON.stringify(data));
  }



  function defaultData() {

    const now = new Date().toISOString();

    const today = now.slice(0, 10);

    const adminUser = {
      id: "u1",
      email: "admin@demo.com",
      password: "123456",
      name: "Admin Hệ thống",
      role: "admin",
      department: "",
      title: "Quản trị viên",
      otpEnabled: false,
      lang: "vi",
      notifEnabled: true,
      soundEnabled: true,
      createdAt: now,
    };
    const doctorUser1 = {
      id: "u2",
      email: "bs.nguyenminh@hospital.vn",
      password: "123456",
      name: "BS. Nguyễn Minh",
      role: "doctor",
      department: "Tim mạch",
      title: "Bác sĩ",
      otpEnabled: false,
      lang: "vi",
      notifEnabled: true,
      soundEnabled: true,
      createdAt: now,
    };
    const doctorUser2 = {
      id: "u3",
      email: "bs.tranvan@hospital.vn",
      password: "123456",
      name: "BS. Trần Văn B",
      role: "doctor",
      department: "Nội tiết",
      title: "Bác sĩ",
      otpEnabled: false,
      lang: "vi",
      notifEnabled: true,
      soundEnabled: true,
      createdAt: now,
    };

    const patients = [

      { id: "p1", code: "BN001", name: "Nguyễn Văn A", phone: "0901111111", birth: "1981-05-10", gender: "Nam", department: "Tim mạch", status: "stable", statusConfirmedBy: "BS. Nguyễn Minh", statusConfirmedAt: now, lastVisit: "2026-05-15", note: "Tiểu đường type 2", avatar: null, createdAt: now, updatedAt: now },

      { id: "p2", code: "BN002", name: "Trần Thị B", phone: "0902222222", birth: "1990-08-22", gender: "Nữ", department: "Nội tiết", status: "monitoring", statusConfirmedBy: "BS. Nguyễn Minh", statusConfirmedAt: now, lastVisit: "2026-05-14", note: "Theo dõi đường huyết", avatar: null, createdAt: now, updatedAt: now },

      { id: "p3", code: "BN003", name: "Lê Văn C", phone: "0903333333", birth: "1975-12-03", gender: "Nam", department: "Hô hấp", status: "emergency", statusConfirmedBy: "BS. Trần Văn B", statusConfirmedAt: now, lastVisit: "2026-05-13", note: "Viêm phổi", avatar: null, createdAt: now, updatedAt: now },

      { id: "p4", code: "BN004", name: "Phạm Thị D", phone: "0904444444", birth: "1998-02-18", gender: "Nữ", department: "Sản khoa", status: "pending", lastVisit: "2026-05-13", note: "", avatar: null, createdAt: now, updatedAt: now },

      { id: "p5", code: "BN005", name: "Hoàng Văn E", phone: "0905555555", birth: "1968-07-25", gender: "Nam", department: "Thần kinh", status: "pending", lastVisit: "2026-05-12", note: "", avatar: null, createdAt: now, updatedAt: now },

      { id: "p6", code: "BN006", name: "Võ Thị F", phone: "0906666666", birth: "1992-11-30", gender: "Nữ", department: "Da liễu", status: "stable", lastVisit: "2026-05-11", note: "", avatar: null, createdAt: now, updatedAt: now },

      { id: "p7", code: "BN007", name: "Đặng Văn G", phone: "0907777777", birth: "1988-04-14", gender: "Nam", department: "Tiêu hóa", status: "emergency", lastVisit: "2026-05-10", note: "", avatar: null, createdAt: now, updatedAt: now },

      { id: "p8", code: "BN008", name: "Bùi Thị H", phone: "0908888888", birth: "1995-09-09", gender: "Nữ", department: "Nhi khoa", status: "stable", lastVisit: "2026-05-09", note: "", avatar: null, createdAt: now, updatedAt: now },

    ];

    const prescriptions = [

      { id: "rx1", patientId: "p1", name: "Aspirin", dosage: "100mg", frequency: "1 lần/ngày", intakeTime: "Sau bữa sáng", times: ["08:00"], status: "active", statusConfirmedBy: "BS. Nguyễn Minh", statusConfirmedAt: now, startDate: "2026-05-01", endDate: "2026-08-01", note: "Uống sau bữa ăn để tránh kích ứng dạ dày", runningOut: false, createdAt: now },

      { id: "rx2", patientId: "p2", name: "Metformin", dosage: "500mg", frequency: "2 lần/ngày", intakeTime: "Sau bữa ăn", times: ["08:00", "20:00"], status: "active", statusConfirmedBy: "BS. Nguyễn Minh", statusConfirmedAt: now, startDate: today, endDate: "", note: "Sau ăn", runningOut: false, createdAt: now },

      { id: "rx3", patientId: "p3", name: "Amoxicillin", dosage: "250mg", frequency: "3 lần/ngày", intakeTime: "Mỗi 8 giờ", times: ["08:00", "16:00", "00:00"], status: "pending", startDate: "2026-05-14", endDate: "2026-05-21", note: "Hoàn thành liệu trình 7 ngày — cần BS xác nhận sắp hết", runningOut: false, createdAt: now },

      { id: "rx4", patientId: "p4", name: "Lisinopril", dosage: "10mg", frequency: "1 lần/ngày", intakeTime: "Buổi sáng", times: ["07:00"], status: "pending", startDate: "2026-04-01", endDate: "2026-10-01", note: "Thuốc hạ huyết áp", runningOut: false, createdAt: now },

    ];

    const mr1 = {

      id: "mr1", patientId: "p1", title: "Khám định kỳ", diagnosis: "Tiểu đường type 2",

      doctor: "BS. Nguyễn Minh", visitDate: "2026-05-15", symptoms: "Khát nước, mệt mỏi",

      treatment: "Tiếp tục Metformin", vitals: "Huyết áp 125/82", note: "Tái khám 3 tháng", createdAt: now,

    };

    const notifications = [

      { id: "n1", message: "Đã đến giờ uống Aspirin 100mg cho bệnh nhân Nguyễn Văn A", title: "Nhắc nhở uống thuốc", type: "reminder", icon: "pill", read: false, at: new Date(Date.now() - 300000).toISOString() },

      { id: "n2", message: "Bệnh nhân Trần Thị B đã đặt lịch khám ngày 20/05/2026 lúc 14:00", title: "Lịch hẹn mới", type: "appointment", icon: "calendar", read: false, at: new Date(Date.now() - 3600000).toISOString() },

      { id: "n3", message: "Kết quả xét nghiệm máu của Lê Văn C đã sẵn sàng", title: "Kết quả xét nghiệm", type: "info", icon: "doc", read: true, at: new Date(Date.now() - 7200000).toISOString() },

      { id: "n4", message: "Bệnh nhân mới Phạm Thị D đã được thêm vào hệ thống", title: "Bệnh nhân mới", type: "patient", icon: "user", read: true, at: new Date(Date.now() - 10800000).toISOString() },

      { id: "n5", message: "Thuốc Amoxicillin của bệnh nhân Lê Văn C sắp hết. Cần kê đơn mới.", title: "Cảnh báo thuốc", type: "warn", icon: "alert", read: false, at: new Date(Date.now() - 18000000).toISOString() },

      { id: "n6", message: "Hệ thống đã được cập nhật phiên bản mới với nhiều tính năng cải tiến", title: "Cập nhật hệ thống", type: "info", icon: "info", read: true, at: new Date(Date.now() - 86400000).toISOString() },

    ];

    return {

      users: [adminUser, doctorUser1, doctorUser2],

      session: null,

      patients,

      medicalRecords: [mr1],

      prescriptions,

      reminders: [

        { id: "rem1", rxId: "rx1", patientId: "p1", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6], active: true },

        { id: "rem2", rxId: "rx2", patientId: "p2", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6], active: true },

        { id: "rem3", rxId: "rx2", patientId: "p2", time: "20:00", days: [0, 1, 2, 3, 4, 5, 6], active: true },

        { id: "rem4", rxId: "rx3", patientId: "p3", time: "08:00", days: [0, 1, 2, 3, 4, 5, 6], active: true },

        { id: "rem5", rxId: "rx4", patientId: "p4", time: "07:00", days: [0, 1, 2, 3, 4, 5, 6], active: true },

      ],

      history: [],

      notifications,

      activityLog: [{ at: now, text: "Khởi tạo dữ liệu demo" }],

      pendingOtp: null,

      lastSync: null,

    };

  }



  function get() {
    if (_cache) return _cache;

    let d = load();

    if (!d) {

      d = defaultData();

      save(d);

    }

    if (!Array.isArray(d.medicalRecords)) d.medicalRecords = [];

    if (!d._clearedDemoDoctorAssign) {
      d.patients.forEach((p) => {
        delete p.doctorId;
        delete p.doctorName;
      });
      d._clearedDemoDoctorAssign = true;
      save(d);
    }

    d.patients.forEach((p) => {

      if (!p.status) p.status = "pending";
      if (p.status && p.status !== "pending" && !p.statusConfirmedBy) {
        p.statusConfirmedBy = "BS. (dữ liệu cũ)";
        p.statusConfirmedAt = p.updatedAt || new Date().toISOString();
      }
      if (!p.gender) p.gender = "Nam";
      if (p.doctorId && !p.doctorName) {
        const doc = d.users.find((u) => u.id === p.doctorId);
        if (doc) p.doctorName = doc.name;
      }
      if (!p.department) p.department = "Đa khoa";

      if (!p.lastVisit) p.lastVisit = p.updatedAt?.slice(0, 10) || "";

    });

    d.prescriptions.forEach((r) => {
      if (!r.intakeTime) r.intakeTime = (r.times || [])[0] ? "Theo lịch " + r.times[0] : "";
      if (!r.status) r.status = "pending";
      if (r.runningOut === undefined) r.runningOut = false;
      if (r.status === "active" && !r.statusConfirmedBy) {
        r.statusConfirmedBy = "BS. (dữ liệu cũ)";
        r.statusConfirmedAt = r.createdAt || new Date().toISOString();
      }
    });
    (d.history || []).forEach((h) => {
      if (h.confirmed === undefined) {
        h.confirmed = true;
        h.confirmedBy = h.confirmedBy || "BS. (dữ liệu cũ)";
        h.confirmedAt = h.confirmedAt || h.at;
      }
    });

    d.notifications.forEach((n) => {
      if (!n.title) n.title = n.type === "warn" ? "Cảnh báo" : "Thông báo";
      if (!n.icon) n.icon = n.type === "reminder" ? "pill" : "info";
    });
    d.users.forEach((u) => {
      if (!u.role) u.role = u.email === "admin@demo.com" ? "admin" : "doctor";
      if (u.role === "doctor" && !u.department) u.department = "Đa khoa";
      if (!u.title) u.title = u.role === "admin" ? "Quản trị viên" : "Bác sĩ";
    });
    if (!d.users.some((u) => u.role === "doctor")) {
      d.users.push({
        id: "u_doc_" + Date.now(),
        email: "bs.nguyenminh@hospital.vn",
        password: "123456",
        name: "BS. Nguyễn Minh",
        role: "doctor",
        department: "Tim mạch",
        title: "Bác sĩ",
        otpEnabled: false,
        lang: "vi",
        notifEnabled: true,
        soundEnabled: true,
        createdAt: new Date().toISOString(),
      });
      save(d);
    }
    _cache = d;
    return d;

  }



  function uid(prefix) {

    return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  }



  function log(text) {

    const d = get();

    d.activityLog.unshift({ at: new Date().toISOString(), text });

    if (d.activityLog.length > 100) d.activityLog.splice(100);

    save(d);

  }



  return {
    get, save, uid, log,
    reset() {
      localStorage.removeItem(KEY);
      _cache = null;
      return defaultData();
    },
    invalidate() { _cache = null; },
  };

})();


