/**
 * Sinh file cod1/COD1-XXX.js + cod1/load-order.js
 * Chạy: node tools/generate-cod1.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const COD1_DIR = path.join(ROOT, "cod1");

const TASKS = {
  "COD1-70": { title: "Đăng ký tài khoản", primary: true, group: "auth" },
  "COD1-71": { title: "Đăng nhập hệ thống", primary: true, group: "auth" },
  "COD1-72": { title: "Chỉnh sửa toa thuốc", primary: true, group: "rx" },
  "COD1-73": { title: "Xem danh sách thuốc", primary: true, group: "rx" },
  "COD1-74": { title: "Tạo hồ sơ bệnh nhân", primary: true, group: "patients" },
  "COD1-75": { title: "Cập nhật hồ sơ bệnh nhân", primary: true, group: "patients" },
  "COD1-76": { title: "Xóa hồ sơ bệnh nhân", primary: true, group: "patients" },
  "COD1-77": { title: "Tạo lịch nhắc thuốc", primary: true, group: "reminders" },
  "COD1-78": { title: "Thêm toa thuốc", primary: true, group: "rx" },
  "COD1-79": { title: "Nhận thông báo uống thuốc", primary: true, group: "reminders" },
  "COD1-80": { title: "Lưu lịch sử dùng thuốc", primary: true, group: "history" },
  "COD1-81": { title: "Xem lịch sử dùng thuốc", primary: true, group: "history" },
  "COD1-82": { title: "Tìm kiếm bệnh nhân", primary: true, group: "patients" },
  "COD1-83": { title: "Lọc danh sách thuốc", primary: true, group: "rx" },
  "COD1-84": { title: "Xem báo cáo sử dụng thuốc", primary: true, group: "reports" },
  "COD1-85": { title: "Xuất báo cáo PDF", primary: true, group: "reports" },
  "COD1-86": { title: "Đồng bộ dữ liệu", primary: true, group: "sync" },
  "COD1-87": { title: "Gửi push notification", primary: true, group: "notifications" },
  "COD1-88": { title: "Đổi mật khẩu", primary: true, group: "settings" },
  "COD1-89": { title: "Bật xác thực OTP", primary: true, group: "settings" },
  "COD1-90": { title: "Thiết kế giao diện đăng ký", primary: true, group: "auth-ui" },
  "COD1-91": { title: "Xây dựng chức năng đăng ký", alias: "COD1-70" },
  "COD1-92": { title: "Lập lịch thông báo", primary: true, group: "reminders" },
  "COD1-93": { title: "Xuất báo cáo PDF", alias: "COD1-85" },
  "COD1-94": { title: "Tích hợp Firebase", primary: true, group: "sync" },
  "COD1-95": { title: "Quản lý giờ uống thuốc", primary: true, group: "reminders" },
  "COD1-97": { title: "Đồng bộ hồ sơ bệnh nhân", alias: "COD1-86" },
  "COD1-99": { title: "Đồng bộ toa thuốc", alias: "COD1-86" },
  "COD1-100": { title: "Backup dữ liệu", primary: true, group: "sync" },
  "COD1-101": { title: "Ghi nhận đã uống thuốc", primary: true, group: "history" },
  "COD1-102": { title: "Khôi phục dữ liệu", primary: true, group: "sync" },
  "COD1-103": { title: "Push Notification", alias: "COD1-87" },
  "COD1-104": { title: "Ghi nhận bỏ qua thuốc", primary: true, group: "history" },
  "COD1-105": { title: "Cảnh báo quên thuốc", primary: true, group: "dashboard" },
  "COD1-106": { title: "Hiển thị lịch sử thuốc", alias: "COD1-81" },
  "COD1-107": { title: "Quản lý danh sách thông báo", primary: true, group: "notifications" },
  "COD1-108": { title: "Đánh dấu đã đọc", primary: true, group: "notifications" },
  "COD1-109": { title: "Xóa thông báo", primary: true, group: "notifications" },
  "COD1-110": { title: "Tìm kiếm lịch sử", primary: true, group: "history" },
  "COD1-111": { title: "Xuất lịch sử dùng thuốc", primary: true, group: "history" },
  "COD1-112": { title: "Xây dựng chức năng đăng nhập", primary: true, group: "auth" },
  "COD1-113": { title: "Đổi mật khẩu", alias: "COD1-88" },
  "COD1-114": { title: "Tìm kiếm bệnh nhân", alias: "COD1-82" },
  "COD1-115": { title: "Xác thực OTP", primary: true, group: "auth" },
  "COD1-116": { title: "Quên mật khẩu", primary: true, group: "auth" },
  "COD1-117": { title: "Tìm kiếm thuốc", alias: "COD1-83" },
  "COD1-118": { title: "Cài đặt ngôn ngữ", primary: true, group: "settings" },
  "COD1-119": { title: "Lọc theo ngày", alias: "COD1-83" },
  "COD1-120": { title: "Quản lý phiên đăng nhập", primary: true, group: "auth" },
  "COD1-121": { title: "Cài đặt thông báo", primary: true, group: "settings" },
  "COD1-122": { title: "Tạo hồ sơ bệnh nhân", alias: "COD1-74" },
  "COD1-123": { title: "Cập nhật hồ sơ bệnh nhân", alias: "COD1-75" },
  "COD1-124": { title: "Lọc theo trạng thái", alias: "COD1-83" },
  "COD1-125": { title: "Xóa hồ sơ bệnh nhân", alias: "COD1-76" },
  "COD1-126": { title: "Tối ưu tìm kiếm", primary: true, group: "search" },
  "COD1-127": { title: "Nhật ký hoạt động", primary: true, group: "dashboard" },
  "COD1-128": { title: "Dashboard tổng quan", primary: true, group: "dashboard" },
  "COD1-129": { title: "Xem chi tiết hồ sơ", primary: true, group: "patients" },
  "COD1-130": { title: "Thống kê số lần uống thuốc", primary: true, group: "reports" },
  "COD1-131": { title: "Upload ảnh đại diện", primary: true, group: "patients" },
  "COD1-132": { title: "Thống kê thuốc sử dụng", primary: true, group: "reports" },
  "COD1-133": { title: "Thêm toa thuốc", alias: "COD1-78" },
  "COD1-134": { title: "Biểu đồ theo thời gian", alias: "COD1-130" },
  "COD1-135": { title: "Chỉnh sửa toa thuốc", alias: "COD1-72" },
  "COD1-136": { title: "Xóa toa thuốc", primary: true, group: "rx" },
  "COD1-137": { title: "Danh sách toa thuốc", alias: "COD1-73" },
  "COD1-138": { title: "Chi tiết toa thuốc", primary: true, group: "rx" },
  "COD1-139": { title: "Tạo lịch nhắc thuốc", primary: true, group: "reminders" },
  "COD1-140": { title: "Chỉnh sửa lịch nhắc", primary: true, group: "reminders" },
  "COD1-141": { title: "Hủy lịch nhắc", primary: true, group: "reminders" },
};

function stubFile(id, meta) {
  const primary = meta.alias;
  return `/**
 * ${id} — ${meta.title}
 * ${primary ? `Liên kết logic chính: cod1/${primary}.js` : "File triển khai task Jira"}
 */
(function (M) {
  "use strict";
  M.register("${id}", function () {
    ${primary ? `M.alias("${id}", "${primary}");` : ""}
    M.markLoaded("${id}");
  });
})(MedCare);
`;
}

function primaryFile(id, meta) {
  return `/**
 * ${id} — ${meta.title}
 * Nhóm: ${meta.group}
 * Logic: js/modules/bundle.js (tìm comment hoặc hàm liên quan)
 */
(function (M) {
  "use strict";
  M.register("${id}", function () {
    if (M.Modules && M.Modules.bundle) {
      M.Modules.bundle.initPart("${id}");
    }
    M.markLoaded("${id}");
  });
})(MedCare);
`;
}

fs.mkdirSync(COD1_DIR, { recursive: true });
const order = Object.keys(TASKS).sort((a, b) => {
  const na = parseInt(a.split("-")[1], 10);
  const nb = parseInt(b.split("-")[1], 10);
  return na - nb;
});

const loadOrder = [
  "js/storage.js",
  "js/core.js",
  "js/modules/bundle.js",
  ...order.map((id) => `cod1/${id}.js`),
  "js/main.js",
];

for (const [id, meta] of Object.entries(TASKS)) {
  const content = meta.alias ? stubFile(id, meta) : primaryFile(id, meta);
  fs.writeFileSync(path.join(COD1_DIR, `${id}.js`), content, "utf8");
}

fs.writeFileSync(
  path.join(COD1_DIR, "load-order.js"),
  `window.COD1_LOAD_ORDER = ${JSON.stringify(loadOrder, null, 2)};\n`,
  "utf8"
);

console.log("Generated", order.length, "COD1 files + load-order.js");
