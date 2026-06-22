# Bản đồ mã nguồn ↔ Jira COD1-XXX

Tài liệu này giúp **rà soát**: mỗi task COD1 trong ảnh Jira tương ứng file / dòng / hàm nào trong web MedCare.

> **Ghi chú:** Một số COD1 trùng tên (vd. COD1-85 và COD1-93 đều là Xuất PDF) — cùng trỏ một đoạn code.  
> Firebase / Push thật được **mô phỏng** trong app (toast + danh sách thông báo).

---

## Cấu trúc file dự án

| File | Vai trò |
|------|---------|
| `index.html` | Giao diện (HTML) — màn hình, form, menu |
| `css/app.css` | Giao diện (CSS) — layout mobile, dashboard, thẻ |
| `js/storage.js` | Lưu trữ `localStorage` — users, patients, rx, history… |
| `js/core.js` | Hàm dùng chung: modal, toast, `setView`, `enterApp`… |
| `js/modules/bundle.js` | Logic nghiệp vụ (CRUD, báo cáo, nhắc thuốc…) |
| `cod1/COD1-XXX.js` | **Một file Jira = một task** — đăng ký task, gọi `bundle.initPart` |
| `cod1/load-order.js` | Thứ tự nạp script |
| `js/loader.js` | Nạp tuần tự theo `load-order` |
| `js/main.js` | Chạy tất cả `COD1-XXX` rồi `bundle.init()` |

Tìm nhanh: mở **`cod1/COD1-74.js`** (vd. tạo BN) hoặc **Ctrl+F** `COD1-74` trong `js/modules/bundle.js`.  
File `js/modules/bundle.js` (cũ) giữ tham chiếu; app chạy qua cấu trúc trên.

---

## 1. Quản lý tài khoản

| COD1 | Tên task (ảnh Jira) | File | Vị trí / Hàm |
|------|---------------------|------|----------------|
| **COD1-70** | Đăng ký tài khoản | `index.html` | `#form-register` (dòng ~32–37) |
| | | `js/modules/bundle.js` | `#form-register` submit (~104–130) |
| | | `css/app.css` | `#screen-auth`, `.auth-form` |
| **COD1-71** | Đăng nhập hệ thống | `index.html` | `#form-login` (~25–31) |
| | | `js/modules/bundle.js` | `#form-login` submit (~86–102) |
| **COD1-90** | Thiết kế giao diện đăng ký | `index.html` | `#screen-auth`, tab Đăng ký |
| | | `css/app.css` | `.auth-wrap`, `.auth-tabs`, `.auth-brand` |
| **COD1-91** | Xây dựng chức năng đăng ký | `js/modules/bundle.js` | `#form-register` handler, `MedStore.save` users |
| **COD1-112** | Xây dựng chức năng đăng nhập | `js/modules/bundle.js` | `#form-login`, `enterApp()`, `d.session` |
| | | `js/storage.js` | `users`, `session` trong `defaultData()` |
| **COD1-116** | Quên mật khẩu | `index.html` | `#btn-forgot`, `#form-forgot` |
| | | `js/modules/bundle.js` | `#form-forgot` (~139–153), `pendingOtp` |
| **COD1-115** | Xác thực OTP | `index.html` | `#form-otp` |
| | | `js/modules/bundle.js` | `#form-otp` (~155–178) |
| **COD1-120** | Quản lý phiên đăng nhập | `js/modules/bundle.js` | `enterApp`, `exitApp`, `renderSettings` → `#session-info` |
| | | `js/storage.js` | `session: { userId, loginAt, token }` |

---

## 2. Quản lý hồ sơ bệnh nhân

| COD1 | Tên task | File | Vị trí / Hàm |
|------|----------|------|----------------|
| **COD1-74** | Tạo hồ sơ bệnh nhân | `index.html` | `#view-patients`, `#btn-add-patient` |
| | | `js/modules/bundle.js` | `openPatientModal(null)`, `savePatientFromForm` (không id) |
| **COD1-122** | Tạo hồ sơ bệnh nhân | *Trùng COD1-74* | Cùng đoạn trên |
| **COD1-75** | Cập nhật hồ sơ | `js/modules/bundle.js` | `savePatientFromForm(form, id)`, `showPatientDetail` → Sửa |
| **COD1-123** | Cập nhật hồ sơ | *Trùng COD1-75* | Cùng đoạn trên |
| **COD1-76** | Xóa hồ sơ | `js/modules/bundle.js` | `showPatientDetail` → `[data-del-patient]` |
| **COD1-125** | Xóa hồ sơ | *Trùng COD1-76* | Cùng đoạn trên |
| **COD1-82** | Tìm kiếm bệnh nhân | `index.html` | `#search-patient` |
| | | `js/modules/bundle.js` | `renderPatients()` filter theo tên/mã/SĐT |
| **COD1-114** | Tìm kiếm bệnh nhân | *Trùng COD1-82* | `#search-patient` + `renderPatients` |
| **COD1-129** | Xem chi tiết hồ sơ | `js/modules/bundle.js` | `showPatientDetail(id)` |
| **COD1-131** | Upload ảnh đại diện | `js/modules/bundle.js` | `patientForm()` → `avatarFile`, `FileReader` trong `savePatientFromForm` |
| **COD1-97** | Đồng bộ hồ sơ BN | `js/modules/bundle.js` | `#btn-sync`, `#btn-backup` / `#btn-restore` (toàn bộ `patients`) |

---

## 3. Quản lý toa thuốc

| COD1 | Tên task | File | Vị trí / Hàm |
|------|----------|------|----------------|
| **COD1-78** | Thêm toa thuốc | `index.html` | `#btn-add-rx`, `#view-rx` |
| | | `js/modules/bundle.js` | `openRxModal(null)`, `saveRxFromForm` (tạo mới) |
| **COD1-133** | Thêm toa thuốc | *Trùng COD1-78* | Cùng đoạn |
| **COD1-72** | Chỉnh sửa toa thuốc | `js/modules/bundle.js` | `saveRxFromForm(form, id)`, modal Sửa |
| **COD1-135** | Chỉnh sửa toa thuốc | *Trùng COD1-72* | Cùng đoạn |
| **COD1-136** | Xóa toa thuốc | `js/modules/bundle.js` | `showRxDetail` → `[data-del-rx]` |
| **COD1-73** | Xem danh sách thuốc | `js/modules/bundle.js` | `renderRx()`, `#rx-list` |
| **COD1-137** | Danh sách toa thuốc | *Trùng COD1-73* | `renderRx()` |
| **COD1-138** | Chi tiết toa thuốc | `js/modules/bundle.js` | `showRxDetail(id)` |
| **COD1-83** | Lọc danh sách thuốc | `index.html` | `#filter-rx-status`, `#filter-rx-date` |
| | | `js/modules/bundle.js` | `renderRx()` filter status + date |
| **COD1-117** | Tìm kiếm thuốc | `index.html` | `#search-rx` |
| | | `js/modules/bundle.js` | `renderRx()` filter `r.name` |
| **COD1-119** | Lọc theo ngày | `index.html` | `#filter-rx-date` |
| | | `js/modules/bundle.js` | `renderRx()` so `startDate`/`endDate` |
| **COD1-124** | Lọc theo trạng thái | `index.html` | `#filter-rx-status` |
| | | `js/modules/bundle.js` | `renderRx()` filter `r.status` |
| **COD1-99** | Đồng bộ toa thuốc | `js/modules/bundle.js` | Backup/restore/sync — `prescriptions` + `reminders` |

---

## 4. Nhắc lịch uống thuốc & thông báo

| COD1 | Tên task | File | Vị trí / Hàm |
|------|----------|------|----------------|
| **COD1-77** | Tạo lịch nhắc thuốc | `js/modules/bundle.js` | `syncRemindersForRx()`, `openReminderModal` |
| **COD1-139** | Tạo lịch nhắc | *Trùng* | `openReminderModal`, field `times` |
| **COD1-140** | Chỉnh sửa lịch nhắc | `js/modules/bundle.js` | `openReminderModal` → `#modal-save` |
| **COD1-141** | Hủy lịch nhắc | `js/modules/bundle.js` | `#modal-cancel-rem` |
| **COD1-95** | Quản lý giờ uống thuốc | `js/modules/bundle.js` | `rxForm` / `times`, `reminders[].time` |
| | | `js/storage.js` | `reminders[]`, `prescriptions[].times` |
| **COD1-92** | Lập lịch thông báo | `js/modules/bundle.js` | `syncRemindersForRx`, `checkReminders()` |
| **COD1-79** | Nhận thông báo uống thuốc | `js/modules/bundle.js` | `renderTodayReminders`, `checkReminders`, `pushNotif` |
| **COD1-87** | Gửi push notification | `js/modules/bundle.js` | `pushNotif()`, `checkReminders()` |
| **COD1-103** | Push Notification | *Trùng COD1-87* | `pushNotif` |
| **COD1-105** | Cảnh báo quên thuốc | `js/modules/bundle.js` | `#stat-missed`, `pushNotif` type warn khi skip |
| **COD1-107** | Quản lý DS thông báo | `index.html` | `#view-notifications`, `#notif-list` |
| | | `js/modules/bundle.js` | `renderNotifications()` |
| **COD1-108** | Đánh dấu đã đọc | `js/modules/bundle.js` | `[data-read]`, `#btn-mark-all-read` |
| **COD1-109** | Xóa thông báo | `js/modules/bundle.js` | `[data-del-n]`, `#btn-clear-notif` |
| **COD1-121** | Cài đặt thông báo | `index.html` | `#setting-notif` |
| | | `js/modules/bundle.js` | `#setting-notif` change, `pushNotif` check `notifEnabled` |

---

## 5. Lịch sử sử dụng thuốc

| COD1 | Tên task | File | Vị trí / Hàm |
|------|----------|------|----------------|
| **COD1-80** | Lưu lịch sử dùng thuốc | `js/modules/bundle.js` | `addHistory()` |
| | | `js/storage.js` | `history[]` |
| **COD1-101** | Ghi nhận đã uống | `js/modules/bundle.js` | `addHistory(..., "taken")`, `[data-taken]` |
| **COD1-104** | Ghi nhận bỏ qua | `js/modules/bundle.js` | `addHistory(..., "skipped")`, `[data-skip]` |
| **COD1-81** | Xem lịch sử | `index.html` | `#view-history`, `#history-list` |
| | | `js/modules/bundle.js` | `renderHistory()` |
| **COD1-106** | Hiển thị lịch sử thuốc | *Trùng COD1-81* | `renderHistory()` |
| **COD1-110** | Tìm kiếm lịch sử | `index.html` | `#search-history` |
| | | `js/modules/bundle.js` | `renderHistory()` filter |
| **COD1-111** | Xuất lịch sử | `js/modules/bundle.js` | `#btn-export-history` → `downloadJson` |

---

## 6. Báo cáo & thống kê

| COD1 | Tên task | File | Vị trí / Hàm |
|------|----------|------|----------------|
| **COD1-84** | Xem báo cáo sử dụng thuốc | `index.html` | Menu Thêm → `#view-reports` |
| | | `js/modules/bundle.js` | `setView("reports")`, `renderCharts()` |
| **COD1-128** | Dashboard tổng quan | `index.html` | `#view-home`, `.dash-cards` |
| | | `js/modules/bundle.js` | `renderDashboard()` |
| **COD1-130** | Thống kê số lần uống | `index.html` | `#chart-doses` |
| | | `js/modules/bundle.js` | `renderCharts()` chart line |
| **COD1-132** | Thống kê thuốc sử dụng | `index.html` | `#chart-meds` |
| | | `js/modules/bundle.js` | `renderCharts()` doughnut |
| **COD1-134** | Biểu đồ theo thời gian | `js/modules/bundle.js` | `renderCharts()` — 7 ngày gần nhất |
| **COD1-85** | Xuất báo cáo PDF | `js/modules/bundle.js` | `#btn-export-pdf` → `window.open` + `print()` |
| **COD1-93** | Xuất báo cáo PDF | *Trùng COD1-85* | Cùng `#btn-export-pdf` |

---

## 7. Đồng bộ dữ liệu

| COD1 | Tên task | File | Vị trí / Hàm |
|------|----------|------|----------------|
| **COD1-86** | Đồng bộ dữ liệu | `js/modules/bundle.js` | `#btn-sync` |
| **COD1-94** | Tích hợp Firebase | `js/modules/bundle.js` | `#btn-sync` (mô phỏng), `lastSync` |
| **COD1-100** | Backup dữ liệu | `js/modules/bundle.js` | `#btn-backup` |
| **COD1-102** | Khôi phục dữ liệu | `js/modules/bundle.js` | `#btn-restore`, `#input-restore` |

---

## 8. Cài đặt & bảo mật

| COD1 | Tên task | File | Vị trí / Hàm |
|------|----------|------|----------------|
| **COD1-88** | Đổi mật khẩu | `js/modules/bundle.js` | `#btn-change-pw` |
| **COD1-113** | Đổi mật khẩu | *Trùng COD1-88* | Cùng đoạn |
| **COD1-89** | Bật xác thực OTP | `index.html` | `#setting-otp` |
| | | `js/modules/bundle.js` | `#setting-otp` → `user.otpEnabled` |
| **COD1-118** | Cài đặt ngôn ngữ | `index.html` | `#setting-lang` |
| | | `js/modules/bundle.js` | `#setting-lang` → `user.lang` |
| **COD1-127** | Nhật ký hoạt động | `index.html` | `#activity-log` |
| | | `js/modules/bundle.js` | `MedStore.log()`, `renderSettings`, `#recent-activity` |

---

## 9. Tìm kiếm (tối ưu)

| COD1 | Tên task | File | Ghi chú |
|------|----------|------|---------|
| **COD1-126** | Tối ưu tìm kiếm | `js/modules/bundle.js` | Filter client-side realtime trên `input` — `renderPatients`, `renderRx`, `renderHistory` |

---

## Liên kết với Epic/Story ban đầu (ảnh đầu tiên)

| Story (ảnh gốc) | COD1 tương ứng trong app |
|-----------------|---------------------------|
| STORY-01 Đăng ký | COD1-70, 90, 91 |
| STORY-02 Đăng nhập | COD1-71, 112, 116, 120 |
| STORY-03–05 Hồ sơ BN | COD1-74–76, 122–125, 129, 131 |
| STORY-06–08 Toa thuốc | COD1-72, 73, 78, 133–138, 83, 117, 119, 124 |
| STORY-09–10 Nhắc thuốc | COD1-77, 79, 92, 95, 139–141, 87, 103 |
| STORY-11–12 Lịch sử | COD1-80, 81, 101, 104, 106, 110, 111 |
| STORY-13–14 Tìm/Lọc | COD1-82, 83, 114, 117, 119, 124, 126 |
| STORY-15–16 Báo cáo | COD1-84, 85, 93, 128, 130, 132, 134 |
| STORY-17 Đồng bộ | COD1-86, 94, 97, 99, 100, 102 |
| STORY-18 Thông báo | COD1-87, 103, 105, 107–109, 121 |
| STORY-19–20 Bảo mật | COD1-88, 89, 113, 115, 116 |

---

## COD1 chưa có server thật (mô phỏng trong code)

| COD1 | Cách app xử lý |
|------|----------------|
| COD1-94 Firebase | `#btn-sync` + toast, `lastSync` |
| COD1-87, 103 Push | `pushNotif()`, `checkReminders()` mỗi 60s |
| COD1-93, 85 PDF | In trang HTML → user chọn “Save as PDF” |

Khi triển khai production, thay các hàm trên bằng SDK Firebase / FCM / API backend — giữ nguyên tên hàm và comment COD1 để dễ trace.
