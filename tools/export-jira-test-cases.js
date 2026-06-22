/**
 * Xuất danh sách Test Case sẵn sàng nhập Jira / Xray.
 * Chạy: node tools/export-jira-test-cases.js
 * Sinh ra: jira-export/test-cases.csv, jira-export/story-checklist.txt
 */
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "jira-export");

/** @type {Array<{id:string,cod1:string,story:string,type:string,file:string,automation:string,precondition:string,steps:string,expected:string}>} */
const CASES = [
  // —— E2E ——
  { id: "TC-AUTH-01", cod1: "COD1-71", story: "Đăng nhập hệ thống", type: "E2E", file: "e2e/auth.spec.js", automation: "COD1-71 — hiển thị màn hình đăng nhập", precondition: "App http://localhost:3000, localStorage reset", steps: "1. Mở trang chủ", expected: "#screen-auth, #form-login và nút submit hiển thị" },
  { id: "TC-AUTH-02", cod1: "COD1-71", story: "Đăng nhập hệ thống", type: "E2E", file: "e2e/auth.spec.js", automation: "COD1-71 — đăng nhập admin thành công", precondition: "Dữ liệu demo, chưa đăng nhập", steps: "1. Nhập admin@demo.com / 123456 → Submit", expected: "Dashboard (#view-home) hiển thị, tên admin và số BN > 0" },
  { id: "TC-AUTH-03", cod1: "COD1-71", story: "Đăng nhập hệ thống", type: "E2E", file: "e2e/auth.spec.js", automation: "COD1-71 — từ chối mật khẩu sai", precondition: "Chưa đăng nhập", steps: "1. Email đúng, mật khẩu sai → Submit", expected: "Vẫn ở #screen-auth, toast lỗi hiển thị" },
  { id: "TC-AUTH-04", cod1: "COD1-120", story: "Quản lý phiên đăng nhập", type: "E2E", file: "e2e/auth.spec.js", automation: "COD1-120 — đăng xuất quay về màn hình auth", precondition: "Đã đăng nhập admin", steps: "1. Cài đặt → Đăng xuất → Xác nhận", expected: "Quay về #form-login" },
  { id: "TC-AUTH-05", cod1: "COD1-70", story: "Đăng ký tài khoản", type: "E2E", file: "e2e/auth.spec.js", automation: "COD1-70 — đăng ký bác sĩ mới thành công", precondition: "Chưa đăng nhập", steps: "1. Tab Đăng ký → điền tên, khoa, email, MK → Submit", expected: "Vào app, dashboard hiển thị tên BS mới, toast thành công" },
  { id: "TC-NAV-01", cod1: "COD1-84", story: "Xem báo cáo sử dụng thuốc", type: "E2E", file: "e2e/navigation.spec.js", automation: "COD1-84 — dashboard hiển thị thống kê demo", precondition: "Đăng nhập admin", steps: "1. Vào Trang chủ", expected: "#stat-patients có số, danh sách BN gần đây hiển thị" },
  { id: "TC-NAV-02", cod1: "COD1-84", story: "Xem báo cáo sử dụng thuốc", type: "E2E", file: "e2e/navigation.spec.js", automation: "COD1-84 — menu dưới chuyển giữa các màn hình", precondition: "Đăng nhập admin", steps: "1. Chuyển BN → Toa → Thông báo → Cài đặt → Trang chủ", expected: "Mỗi view tương ứng hiển thị đúng" },
  { id: "TC-NAV-03", cod1: "COD1-82", story: "Tìm kiếm bệnh nhân", type: "E2E", file: "e2e/navigation.spec.js", automation: "COD1-82 — truy cập nhanh từ dashboard sang bệnh nhân", precondition: "Đăng nhập admin", steps: "1. Click hàng truy cập nhanh Bệnh nhân", expected: "#view-patients active" },
  { id: "TC-PAT-01", cod1: "COD1-74", story: "Tạo hồ sơ bệnh nhân", type: "E2E", file: "e2e/patients.spec.js", automation: "COD1-74 — hiển thị danh sách bệnh nhân demo", precondition: "Đăng nhập admin, màn Bệnh nhân", steps: "1. Mở tab Bệnh nhân", expected: "Có thẻ BN, đếm số, thấy Nguyễn Văn A" },
  { id: "TC-PAT-02", cod1: "COD1-82", story: "Tìm kiếm bệnh nhân", type: "E2E", file: "e2e/patients.spec.js", automation: "COD1-82 — tìm kiếm theo tên", precondition: "Đăng nhập admin, màn Bệnh nhân", steps: "1. Gõ Trần Thị B vào #search-patient", expected: "Chỉ hiện BN khớp, ẩn BN khác" },
  { id: "TC-PAT-03", cod1: "COD1-131", story: "Xem chi tiết bệnh nhân", type: "E2E", file: "e2e/patients.spec.js", automation: "COD1-131 — mở chi tiết bệnh nhân", precondition: "Đăng nhập admin, màn Bệnh nhân", steps: "1. Click thẻ BN → Xem chi tiết → Quay lại", expected: "Hero chi tiết có mã BN, quay lại danh sách OK" },
  { id: "TC-PAT-04", cod1: "COD1-76", story: "Xóa hồ sơ bệnh nhân", type: "E2E", file: "e2e/patients.spec.js", automation: "COD1-76 — admin xóa bệnh nhân mới tạo", precondition: "Đăng nhập admin", steps: "1. Thêm BN BN Xóa E2E → 2. Vào chi tiết → Xóa → Xác nhận", expected: "BN biến mất khỏi danh sách" },
  { id: "TC-RX-01", cod1: "COD1-78", story: "Thêm toa thuốc", type: "E2E", file: "e2e/prescriptions.spec.js", automation: "COD1-78 — thêm toa thuốc mới", precondition: "Đăng nhập admin, màn Toa thuốc", steps: "1. Thêm toa → chọn BN, tên thuốc, liều, tần suất, giờ → Lưu", expected: "Danh sách toa tăng 1, hiển thị tên thuốc mới" },
  { id: "TC-RX-02", cod1: "COD1-72", story: "Chỉnh sửa toa thuốc", type: "E2E", file: "e2e/prescriptions.spec.js", automation: "COD1-72 — chỉnh sửa toa thuốc", precondition: "Đăng nhập admin, có toa test", steps: "1. Tạo toa → 2. Mở sửa → đổi liều 650mg → Lưu", expected: "Danh sách hiển thị liều 650mg" },
  { id: "TC-SYNC-01", cod1: "COD1-100", story: "Backup dữ liệu", type: "E2E", file: "e2e/sync.spec.js", automation: "COD1-100 — sao lưu dữ liệu JSON", precondition: "Đăng nhập admin, màn Cài đặt", steps: "1. Click Sao lưu", expected: "Tải file medcare-backup.json, toast backup" },
  { id: "TC-SYNC-02", cod1: "COD1-102", story: "Khôi phục dữ liệu", type: "E2E", file: "e2e/sync.spec.js", automation: "COD1-102 — khôi phục dữ liệu từ file JSON", precondition: "Đăng nhập admin, dữ liệu đã bị cắt giảm", steps: "1. Chọn file backup JSON → khôi phục", expected: "Số BN trở về đầy đủ, app vẫn hoạt động" },
  { id: "TC-SET-01", cod1: "COD1-88", story: "Đổi mật khẩu", type: "E2E", file: "e2e/settings.spec.js", automation: "COD1-88 — đổi mật khẩu và đăng nhập lại", precondition: "Đăng nhập admin", steps: "1. Đổi MK → 2. Đăng xuất → 3. Đăng nhập MK mới", expected: "Đăng nhập thành công với mật khẩu mới" },
  // —— Unit ——
  { id: "TC-UNIT-01", cod1: "COD1-86", story: "Đồng bộ dữ liệu", type: "Unit", file: "tests/storage.test.js", automation: "get() seeds demo data when localStorage is empty", precondition: "localStorage trống", steps: "1. Gọi MedStore.get()", expected: "Có users, patients, prescriptions demo; ghi localStorage" },
  { id: "TC-UNIT-02", cod1: "COD1-86", story: "Đồng bộ dữ liệu", type: "Unit", file: "tests/storage.test.js", automation: "get() migrates legacy patients", precondition: "localStorage legacy", steps: "1. Gọi MedStore.get()", expected: "Migration thành công, dữ liệu hợp lệ" },
  { id: "TC-UNIT-03", cod1: "COD1-100", story: "Backup dữ liệu", type: "Unit", file: "tests/storage.test.js", automation: "save() persists data to localStorage", precondition: "Có dữ liệu", steps: "1. Thêm BN → MedStore.save()", expected: "Reload vẫn thấy BN mới" },
  { id: "TC-UNIT-04", cod1: "COD1-102", story: "Khôi phục dữ liệu", type: "Unit", file: "tests/storage.test.js", automation: "reset() clears and re-seeds", precondition: "Có dữ liệu tùy chỉnh", steps: "1. MedStore.reset()", expected: "localStorage xóa và seed lại demo" },
  { id: "TC-UNIT-05", cod1: "COD1-127", story: "Nhật ký hoạt động", type: "Unit", file: "tests/storage.test.js", automation: "log() keeps max 100 entries", precondition: "activityLog rỗng", steps: "1. Gọi log() 105 lần", expected: "Chỉ giữ 100 entry mới nhất" },
  { id: "TC-UNIT-06", cod1: "COD1-74", story: "Tạo hồ sơ bệnh nhân", type: "Unit", file: "tests/bundle.test.js", automation: "Patients.save creates new patient", precondition: "Đăng nhập admin", steps: "1. Patients.save(form BN mới)", expected: "patients.length +1, có mã BN100" },
  { id: "TC-UNIT-07", cod1: "COD1-75", story: "Cập nhật hồ sơ BN", type: "Unit", file: "tests/bundle.test.js", automation: "Patients.save updates existing", precondition: "Có BN p1", steps: "1. Patients.save(form cập nhật tên)", expected: "Tên BN thay đổi trong store" },
  { id: "TC-UNIT-08", cod1: "COD1-78", story: "Thêm toa thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "Rx.save creates prescription", precondition: "Có BN", steps: "1. Rx.save(form toa mới)", expected: "prescriptions.length +1" },
  { id: "TC-UNIT-09", cod1: "COD1-77", story: "Tạo lịch nhắc thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "syncReminders for active rx", precondition: "Toa active", steps: "1. Rx.syncReminders(rx)", expected: "2 reminder 08:00, 20:00" },
  { id: "TC-UNIT-10", cod1: "COD1-78", story: "Thêm toa thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "syncReminders skips pending rx", precondition: "Toa pending", steps: "1. Rx.syncReminders(rx pending)", expected: "Không tạo reminder" },
  { id: "TC-UNIT-11", cod1: "COD1-92", story: "Lập lịch thông báo", type: "Unit", file: "tests/bundle.test.js", automation: "syncReminders replaces on time change", precondition: "Có reminder cũ", steps: "1. Đổi times → syncReminders", expected: "Reminder cũ bị thay, 2 giờ mới" },
  { id: "TC-UNIT-12", cod1: "COD1-101", story: "Ghi nhận đã uống thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "History.add records taken", precondition: "Có toa", steps: "1. History.add(taken)", expected: "history có entry status taken" },
  { id: "TC-UNIT-13", cod1: "COD1-104", story: "Ghi nhận bỏ qua thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "History.add replaces same-day entry", precondition: "Có history cùng ngày", steps: "1. History.add(skipped)", expected: "Entry cùng ngày bị thay" },
  { id: "TC-UNIT-14", cod1: "COD1-122", story: "Phân quyền admin", type: "Unit", file: "tests/bundle.test.js", automation: "admin can manage any patient", precondition: "Login admin", steps: "1. Kiểm tra canManagePatient", expected: "Admin quản lý được mọi BN" },
  { id: "TC-UNIT-15", cod1: "COD1-123", story: "Phân quyền bác sĩ", type: "Unit", file: "tests/bundle.test.js", automation: "doctor blocked from other's patient", precondition: "Login doctor khác", steps: "1. canManagePatient BN của BS khác", expected: "Trả về false" },
  { id: "TC-UNIT-16", cod1: "COD1-125", story: "Nhận bệnh nhân", type: "Unit", file: "tests/bundle.test.js", automation: "claimPatient assigns to doctor", precondition: "BN pending", steps: "1. claimPatient(pending)", expected: "assignedDoctorId = doctor hiện tại" },
  { id: "TC-UNIT-17", cod1: "COD1-76", story: "Xóa hồ sơ bệnh nhân", type: "Unit", file: "tests/bundle.test.js", automation: "Patients.delete admin removes patient + rx", precondition: "Login admin", steps: "1. Patients.delete(patientId)", expected: "BN và toa liên quan bị xóa" },
  { id: "TC-UNIT-18", cod1: "COD1-76", story: "Xóa hồ sơ bệnh nhân", type: "Unit", file: "tests/bundle.test.js", automation: "doctor blocked when treatment active", precondition: "Login doctor, BN đang điều trị", steps: "1. Patients.delete()", expected: "Không xóa được" },
  { id: "TC-UNIT-19", cod1: "COD1-80", story: "Lưu lịch sử dùng thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "History.add + activity log", precondition: "Có toa", steps: "1. History.add()", expected: "history + activityLog có entry" },
  { id: "TC-UNIT-20", cod1: "COD1-81", story: "Xem lịch sử dùng thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "History.render lists entries", precondition: "Có history", steps: "1. History.render()", expected: "HTML chứa tên thuốc" },
  { id: "TC-UNIT-21", cod1: "COD1-81", story: "Xem lịch sử dùng thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "History.render filters by search", precondition: "Nhiều history", steps: "1. History.render(search)", expected: "Chỉ hiện entry khớp" },
  { id: "TC-UNIT-22", cod1: "COD1-83", story: "Lọc danh sách thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "Rx.render filter by drug name", precondition: "Nhiều toa", steps: "1. Rx.render(filter tên thuốc)", expected: "Chỉ toa khớp" },
  { id: "TC-UNIT-23", cod1: "COD1-83", story: "Lọc danh sách thuốc", type: "Unit", file: "tests/bundle.test.js", automation: "Rx.render filter by patient name", precondition: "Nhiều toa", steps: "1. Rx.render(filter tên BN)", expected: "Chỉ toa của BN đó" },
  { id: "TC-UNIT-24", cod1: "COD1-87", story: "Gửi push notification", type: "Unit", file: "tests/bundle.test.js", automation: "Notifications.push in-app", precondition: "Đăng nhập", steps: "1. Notifications.push(msg)", expected: "notifications[] có entry mới" },
];

function csvEscape(s) {
  const t = String(s ?? "").replace(/"/g, '""');
  return `"${t}"`;
}

function toCsv(rows, headers) {
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\r\n");
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const csvHeaders = ["Test ID", "Story Key", "Story Title", "Type", "File", "Automation Name", "Precondition", "Steps", "Expected Result"];
const csvRows = CASES.map((c) => ({
  "Test ID": c.id,
  "Story Key": c.cod1,
  "Story Title": c.story,
  Type: c.type,
  File: c.file,
  "Automation Name": c.automation,
  Precondition: c.precondition,
  Steps: c.steps,
  "Expected Result": c.expected,
}));

fs.writeFileSync(path.join(OUT_DIR, "test-cases.csv"), "\uFEFF" + toCsv(csvRows, csvHeaders), "utf8");

const stories = [...new Map(CASES.map((c) => [c.cod1, c.story])).entries()].sort((a, b) => {
  const na = parseInt(a[0].replace("COD1-", ""), 10);
  const nb = parseInt(b[0].replace("COD1-", ""), 10);
  return na - nb;
});

const checklist = [
  "CHECKLIST — Link Test ↔ Story COD1 trên Jira",
  "Đánh dấu [x] khi hoàn thành từng Story.",
  "",
  ...stories.map(([cod1, title]) => {
    const tests = CASES.filter((c) => c.cod1 === cod1);
    const e2e = tests.filter((c) => c.type === "E2E").length;
    const unit = tests.filter((c) => c.type === "Unit").length;
    const parts = [];
    if (e2e) parts.push(`${e2e} E2E`);
    if (unit) parts.push(`${unit} unit`);
    return `[ ] ${cod1} — ${title} (${parts.join(" + ")})`;
  }),
  "",
  `Tổng: ${CASES.length} Test Case · ${stories.length} Story COD1`,
  "",
  "Sau khi tạo Test trên Jira:",
  "1. Mở Story COD1-XXX → tab Tests (Xray) → Add Tests",
  "2. Hoặc: Test → Link → chọn Story",
  "3. Chạy npm run test:ci → đính kèm playwright-report/ hoặc import junit.xml",
].join("\r\n");

fs.writeFileSync(path.join(OUT_DIR, "story-checklist.txt"), checklist, "utf8");

console.log(`Exported ${CASES.length} test cases → jira-export/test-cases.csv`);
console.log(`Story checklist (${stories.length} stories) → jira-export/story-checklist.txt`);
