# Bản đồ test automation ↔ Jira COD1

Tài liệu liên kết **43 test tự động** (17 E2E Playwright + 26 unit Vitest) với task **COD1-XXX** trên Jira.

> **Mã nguồn:** `COD1-MAPPING.md` (code ↔ Jira) · **Test:** file này (test ↔ Jira)

---

## Tổng quan

| Loại | Số test | Công cụ | Thư mục |
|------|---------|---------|---------|
| E2E (UI) | 17 | Playwright | `e2e/*.spec.js` |
| Unit (logic) | 26 | Vitest | `tests/*.test.js` |
| **Tổng** | **43** | | |

| COD1 được cover bởi automation | Ghi chú |
|--------------------------------|---------|
| E2E: 70, 71, 72, 74, 76, 78, 82, 84, 88, 100, 102, 120, 131 | 17 test UI |
| Unit: 74–78, 80, 81, 83, 86, 87, 92, 100, 101, 102, 104, 122, 123, 125, 127 | 26 test logic |
| **Bỏ qua** (Đợt 3) | 85, 90, 91, 93, 94, 103 — xem mục cuối |

---

## Bảng map nhanh — E2E (Playwright)

| Mã Jira | Tên task (Jira) | File | Tên test automation |
|---------|-----------------|------|---------------------|
| **COD1-71** | Đăng nhập hệ thống | `e2e/auth.spec.js` | `COD1-71 — hiển thị màn hình đăng nhập` |
| **COD1-71** | Đăng nhập hệ thống | `e2e/auth.spec.js` | `COD1-71 — đăng nhập admin thành công` |
| **COD1-71** | Đăng nhập hệ thống | `e2e/auth.spec.js` | `COD1-71 — từ chối mật khẩu sai` |
| **COD1-120** | Quản lý phiên đăng nhập | `e2e/auth.spec.js` | `COD1-120 — đăng xuất quay về màn hình auth` |
| **COD1-70** | Đăng ký tài khoản | `e2e/auth.spec.js` | `COD1-70 — đăng ký bác sĩ mới thành công` |
| **COD1-84** | Xem báo cáo sử dụng thuốc | `e2e/navigation.spec.js` | `COD1-84 — dashboard hiển thị thống kê demo` |
| **COD1-84** | Xem báo cáo sử dụng thuốc | `e2e/navigation.spec.js` | `COD1-84 — menu dưới chuyển giữa các màn hình` |
| **COD1-82** | Tìm kiếm bệnh nhân | `e2e/navigation.spec.js` | `COD1-82 — truy cập nhanh từ dashboard sang bệnh nhân` |
| **COD1-74** | Tạo hồ sơ bệnh nhân | `e2e/patients.spec.js` | `COD1-74 — hiển thị danh sách bệnh nhân demo` |
| **COD1-82** | Tìm kiếm bệnh nhân | `e2e/patients.spec.js` | `COD1-82 — tìm kiếm theo tên` |
| **COD1-131** | Xem chi tiết bệnh nhân | `e2e/patients.spec.js` | `COD1-131 — mở chi tiết bệnh nhân` |
| **COD1-76** | Xóa hồ sơ bệnh nhân | `e2e/patients.spec.js` | `COD1-76 — admin xóa bệnh nhân mới tạo` |
| **COD1-78** | Thêm toa thuốc | `e2e/prescriptions.spec.js` | `COD1-78 — thêm toa thuốc mới` |
| **COD1-72** | Chỉnh sửa toa thuốc | `e2e/prescriptions.spec.js` | `COD1-72 — chỉnh sửa toa thuốc` |
| **COD1-100** | Backup dữ liệu | `e2e/sync.spec.js` | `COD1-100 — sao lưu dữ liệu JSON` |
| **COD1-102** | Khôi phục dữ liệu | `e2e/sync.spec.js` | `COD1-102 — khôi phục dữ liệu từ file JSON` |
| **COD1-88** | Đổi mật khẩu | `e2e/settings.spec.js` | `COD1-88 — đổi mật khẩu và đăng nhập lại` |

---

## Bảng map nhanh — Unit (Vitest)

| Mã Jira | Tên task (Jira) | File | Mô tả test |
|---------|-----------------|------|------------|
| **COD1-86** | Đồng bộ dữ liệu | `tests/storage.test.js` | `get()` seeds demo data |
| **COD1-86** | Đồng bộ dữ liệu | `tests/storage.test.js` | `get()` migrates legacy patients |
| **COD1-100** | Backup dữ liệu | `tests/storage.test.js` | `save()` persists to localStorage |
| **COD1-102** | Khôi phục dữ liệu | `tests/storage.test.js` | `reset()` clears and re-seeds |
| **COD1-127** | Nhật ký hoạt động | `tests/storage.test.js` | `log()` keeps max 100 entries |
| **COD1-74** | Tạo hồ sơ bệnh nhân | `tests/bundle.test.js` | `Patients.save` creates new patient |
| **COD1-75** | Cập nhật hồ sơ BN | `tests/bundle.test.js` | `Patients.save` updates existing |
| **COD1-78** | Thêm toa thuốc | `tests/bundle.test.js` | `Rx.save` creates prescription |
| **COD1-77** | Tạo lịch nhắc thuốc | `tests/bundle.test.js` | `syncReminders` for active rx |
| **COD1-78** | Thêm toa thuốc | `tests/bundle.test.js` | `syncReminders` skips pending rx |
| **COD1-92** | Lập lịch thông báo | `tests/bundle.test.js` | `syncReminders` replaces on time change |
| **COD1-101** | Ghi nhận đã uống thuốc | `tests/bundle.test.js` | `History.add` records taken |
| **COD1-104** | Ghi nhận bỏ qua thuốc | `tests/bundle.test.js` | `History.add` replaces same-day entry |
| **COD1-122** | Phân quyền admin | `tests/bundle.test.js` | admin can manage any patient |
| **COD1-123** | Phân quyền bác sĩ | `tests/bundle.test.js` | doctor blocked from other's patient |
| **COD1-125** | Nhận bệnh nhân | `tests/bundle.test.js` | `claimPatient` assigns to doctor |
| **COD1-76** | Xóa hồ sơ bệnh nhân | `tests/bundle.test.js` | `Patients.delete` admin removes patient + rx |
| **COD1-76** | Xóa hồ sơ bệnh nhân | `tests/bundle.test.js` | doctor blocked when treatment active |
| **COD1-80** | Lưu lịch sử dùng thuốc | `tests/bundle.test.js` | `History.add` + activity log |
| **COD1-81** | Xem lịch sử dùng thuốc | `tests/bundle.test.js` | `History.render` lists entries |
| **COD1-81** | Xem lịch sử dùng thuốc | `tests/bundle.test.js` | `History.render` filters by search |
| **COD1-83** | Lọc danh sách thuốc | `tests/bundle.test.js` | `Rx.render` filter by drug name |
| **COD1-83** | Lọc danh sách thuốc | `tests/bundle.test.js` | `Rx.render` filter by patient name |
| **COD1-87** | Gửi push notification | `tests/bundle.test.js` | `Notifications.push` in-app (Đợt 3) |

*(Các test hạ tầng: `uid()`, `resetStoreData()` — không map trực tiếp COD1.)*

---

## Chi tiết test case — nhập vào Jira / Xray

Dùng bảng dưới để tạo **Test** trong Jira (Xray hoặc Zephyr). Mỗi dòng = 1 Test Case, link tới Story **COD1-XXX**.

### E2E — Xác thực (`e2e/auth.spec.js`)

#### TC-AUTH-01 · COD1-71 — Hiển thị màn hình đăng nhập

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/auth.spec.js` → `COD1-71 — hiển thị màn hình đăng nhập` |
| **Precondition** | App chạy tại http://localhost:3000, localStorage đã reset |
| **Steps** | 1. Mở trang chủ |
| **Expected** | `#screen-auth`, `#form-login` và nút submit hiển thị |

#### TC-AUTH-02 · COD1-71 — Đăng nhập admin thành công

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/auth.spec.js` → `COD1-71 — đăng nhập admin thành công` |
| **Precondition** | Dữ liệu demo, chưa đăng nhập |
| **Steps** | 1. Nhập `admin@demo.com` / `123456` → Submit |
| **Expected** | Dashboard (`#view-home`) hiển thị, tên admin và số BN > 0 |

#### TC-AUTH-03 · COD1-71 — Từ chối mật khẩu sai

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/auth.spec.js` → `COD1-71 — từ chối mật khẩu sai` |
| **Steps** | 1. Nhập email đúng, mật khẩu sai → Submit |
| **Expected** | Vẫn ở `#screen-auth`, toast lỗi hiển thị |

#### TC-AUTH-04 · COD1-120 — Đăng xuất

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/auth.spec.js` → `COD1-120 — đăng xuất quay về màn hình auth` |
| **Precondition** | Đã đăng nhập admin |
| **Steps** | 1. Vào Cài đặt → Đăng xuất → Xác nhận |
| **Expected** | Quay về `#form-login` |

### E2E — Điều hướng (`e2e/navigation.spec.js`)

#### TC-NAV-01 · COD1-84 — Dashboard thống kê

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/navigation.spec.js` → `COD1-84 — dashboard hiển thị thống kê demo` |
| **Precondition** | Đăng nhập admin |
| **Expected** | `#stat-patients` có số, danh sách BN gần đây hiển thị |

#### TC-NAV-02 · COD1-84 — Menu điều hướng

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/navigation.spec.js` → `COD1-84 — menu dưới chuyển giữa các màn hình` |
| **Steps** | 1. Chuyển BN → Toa → Thông báo → Cài đặt → Trang chủ |
| **Expected** | Mỗi view tương ứng hiển thị đúng |

#### TC-NAV-03 · COD1-82 — Truy cập nhanh

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/navigation.spec.js` → `COD1-82 — truy cập nhanh từ dashboard sang bệnh nhân` |
| **Steps** | 1. Click hàng truy cập nhanh "Bệnh nhân" |
| **Expected** | `#view-patients` active |

### E2E — Bệnh nhân (`e2e/patients.spec.js`)

#### TC-PAT-01 · COD1-74 — Danh sách bệnh nhân

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/patients.spec.js` → `COD1-74 — hiển thị danh sách bệnh nhân demo` |
| **Precondition** | Đăng nhập admin, vào màn Bệnh nhân |
| **Expected** | Có thẻ BN, đếm số, thấy "Nguyễn Văn A" |

#### TC-PAT-02 · COD1-82 — Tìm kiếm theo tên

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/patients.spec.js` → `COD1-82 — tìm kiếm theo tên` |
| **Steps** | 1. Gõ "Trần Thị B" vào `#search-patient` |
| **Expected** | Chỉ hiện BN khớp, ẩn BN khác |

#### TC-PAT-03 · COD1-131 — Chi tiết bệnh nhân

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/patients.spec.js` → `COD1-131 — mở chi tiết bệnh nhân` |
| **Steps** | 1. Click thẻ BN → Xem chi tiết → Quay lại |
| **Expected** | Hero chi tiết có mã BN, quay lại danh sách OK |

#### TC-PAT-04 · COD1-76 — Xóa bệnh nhân

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/patients.spec.js` → `COD1-76 — admin xóa bệnh nhân mới tạo` |
| **Precondition** | Đăng nhập admin |
| **Steps** | 1. Thêm BN "BN Xóa E2E" → 2. Vào chi tiết → Xóa → Xác nhận |
| **Expected** | BN biến mất khỏi danh sách |

#### TC-AUTH-05 · COD1-70 — Đăng ký bác sĩ

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/auth.spec.js` → `COD1-70 — đăng ký bác sĩ mới thành công` |
| **Steps** | 1. Tab Đăng ký → điền tên, khoa, email, MK → Submit |
| **Expected** | Vào app, dashboard hiển thị tên BS mới, toast thành công |

### E2E — Toa thuốc (`e2e/prescriptions.spec.js`)

#### TC-RX-01 · COD1-78 — Thêm toa thuốc

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/prescriptions.spec.js` → `COD1-78 — thêm toa thuốc mới` |
| **Precondition** | Đăng nhập admin, màn Toa thuốc |
| **Steps** | 1. Thêm toa → chọn BN, tên, liều, tần suất, giờ → Lưu |
| **Expected** | Danh sách toa tăng 1, hiển thị tên thuốc mới |

#### TC-RX-02 · COD1-72 — Sửa toa thuốc

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/prescriptions.spec.js` → `COD1-72 — chỉnh sửa toa thuốc` |
| **Steps** | 1. Tạo toa → 2. Sửa liều 650mg → Lưu |
| **Expected** | Danh sách hiển thị liều 650mg |

### E2E — Đồng bộ (`e2e/sync.spec.js`)

#### TC-SYNC-01 · COD1-100 — Backup JSON

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/sync.spec.js` → `COD1-100 — sao lưu dữ liệu JSON` |
| **Precondition** | Đăng nhập admin, màn Cài đặt |
| **Steps** | 1. Click Sao lưu |
| **Expected** | Tải `medcare-backup.json`, toast backup |

#### TC-SYNC-02 · COD1-102 — Khôi phục JSON

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/sync.spec.js` → `COD1-102 — khôi phục dữ liệu từ file JSON` |
| **Steps** | 1. Chọn file backup → khôi phục |
| **Expected** | Số BN trở về đầy đủ, app vẫn hoạt động |

### E2E — Cài đặt (`e2e/settings.spec.js`)

#### TC-SET-01 · COD1-88 — Đổi mật khẩu

| Trường | Nội dung |
|--------|----------|
| **Automation** | `e2e/settings.spec.js` → `COD1-88 — đổi mật khẩu và đăng nhập lại` |
| **Steps** | 1. Đổi MK → 2. Đăng xuất → 3. Đăng nhập MK mới |
| **Expected** | Đăng nhập thành công với mật khẩu mới |

### Unit — Nhập Jira (tóm tắt)

Mỗi test Vitest trong bảng *Unit* ở trên = 1 Test Case. **Summary** = tên hàm/it trong file; **Automation** = đường dẫn file + tên test. Không cần Steps chi tiết — ghi *"Chạy `npm test` — test pass"* làm Expected.

Xuất CSV đầy đủ 41 test case (17 E2E + 24 unit có map COD1):

```bash
npm run jira:export
```

File: `jira-export/test-cases.csv` (mở Excel → copy vào Jira) và `jira-export/story-checklist.txt` (tick từng Story).

---

## Hoàn thiện Jira — từng bước (~30–45 phút)

### Bước 0 — Chuẩn bị bằng chứng (trong repo)

```powershell
cd "C:\Users\Hi\OneDrive\Máy tính\BaiTest"
npm install
npm run test:validate-cod1   # 17/17 E2E có mã COD1
npm run test:ci              # 43/43 pass
npm run jira:export          # sinh jira-export/*
```

Kết quả test: `test-results/junit.xml` (E2E), `playwright-report/` (HTML).

### Bước 1 — Tạo Test Case (ưu tiên 17 E2E trước)

**Nếu dùng Xray:**

1. Jira → **Create** → Issue type **Test**
2. **Summary:** copy cột *Automation Name* từ `jira-export/test-cases.csv` (vd. `COD1-71 — đăng nhập admin thành công`)
3. **Test Type:** Manual hoặc Generic (Automation)
4. Tab **Test Details:** Steps + Expected từ CSV
5. **Labels:** `medcare`, `e2e`, `automation`
6. Lặp cho 17 dòng E2E (hoặc import CSV nếu Xray bật CSV import)

**Nếu không có Xray:** tạo **Sub-task** trên Story COD1-XXX, tiêu đề = tên automation, mô tả = Steps/Expected.

### Bước 2 — Link Test ↔ Story

Với mỗi Test vừa tạo:

1. Mở **Story** `COD1-XXX` (vd. COD1-71)
2. Xray: tab **Tests** → **Add Tests** → chọn Test đã tạo
3. Hoặc: mở Test → **Link** → *Tests* → chọn Story

Dùng `jira-export/story-checklist.txt` — đánh dấu `[x]` khi xong mỗi Story (**27 Story**, **41 Test**).

| Story | Số test | Ưu tiên |
|-------|---------|---------|
| COD1-70, 71, 72, 74, 76, 78, 82, 84, 88, 100, 102, 120, 131 | Có E2E | **Cao** — làm trước |
| COD1-75, 77, 80, 81, 83, 86, 87, 92, 101, 104, 122, 123, 125, 127 | Chỉ unit | Thấp — làm sau hoặc gộp 1 test/Story |

### Bước 3 — (Tuỳ chọn) Import kết quả chạy test

```powershell
npm run test:e2e:junit
```

Jira Xray → **Import Execution Results** → JUnit → chọn `test-results/junit.xml`.

> Tên test trong XML phải **trùng Summary** trên Xray để auto-map. Repo đã đặt tên `COD1-XXX — …`.

### Bước 4 — Đính kèm bằng chứng (nộp bài)

- Screenshot tab **Tests** trên 2–3 Story (vd. COD1-71, COD1-74, COD1-100)
- Hoặc đính kèm `playwright-report/index.html` + output `npm run test:ci`

---

## Hướng dẫn liên kết trên Jira

### Cách 1 — Thủ công (phù hợp nộp bài / demo)

1. Mở project **COD1** trên Jira.
2. Với mỗi Story **COD1-XXX** đã có test automation:
   - Tạo sub-task hoặc **Test** (Xray: *Create Test*).
   - Điền Steps / Expected theo bảng trên.
   - Trường **Automation** hoặc mô tả: ghi đường dẫn file + tên test.
3. Link Test → Story bằng **Tests** (Xray) hoặc **Relates to**.
4. Chạy `npm run test:ci` — đính kèm screenshot/report làm bằng chứng.

### Cách 2 — Import kết quả JUnit (Xray)

1. Chạy E2E với reporter JUnit:
   ```bash
   npm run test:e2e:junit
   ```
2. File sinh ra: `test-results/junit.xml` (tên test = `COD1-XXX — …`).
3. Trong Jira Xray: **Import Execution Results** → chọn JUnit XML.
4. Map test key trong Xray trùng tên automation (vd. `COD1-71 — đăng nhập admin thành công`).

### Cách 3 — CI đẩy kết quả lên Xray (nâng cao)

Thêm secrets vào GitHub repo:

| Secret | Mô tả |
|--------|-------|
| `XRAY_CLIENT_ID` | Client ID Xray Cloud |
| `XRAY_CLIENT_SECRET` | Client secret |
| `JIRA_TEST_PLAN_KEY` | Mã Test Plan (vd. `COD1-200`) |

Sau đó bổ sung bước upload `test-results/junit.xml` trong `.github/workflows/ci.yml` (xem [Xray JUnit integration](https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST)).

---

## Kiểm tra đồng bộ map ↔ code

```bash
node tools/validate-cod1-tests.js
```

Script quét `e2e/*.spec.js` — báo lỗi nếu test E2E **không** có tiền tố `COD1-XXX` trong tên.

---

## Đợt 3 — COD1 **bỏ qua** automation (có code, khó / ít giá trị)

| COD1 | Tên task | Lý do bỏ qua | Cách kiểm tra thay thế |
|------|----------|--------------|------------------------|
| **COD1-85, 93** | Xuất báo cáo PDF | Dùng `window.print()` — phụ thuộc hộp thoại In trình duyệt | Test thủ công: Báo cáo → Xuất PDF |
| **COD1-90, 91** | Giao diện / chức năng đăng ký | Chủ yếu CSS; logic đăng ký đã cover bởi **COD1-70** E2E | `e2e/auth.spec.js` |
| **COD1-94** | Tích hợp Firebase | Chưa có SDK thật — mô phỏng bằng toast + `lastSync` | Test thủ công: Cài đặt → Đồng bộ |
| **COD1-103** | Push Notification (FCM) | Trùng **COD1-87** — push mô phợng trong `notifications[]` | `tests/bundle.test.js` → `COD1-87` |

> **COD1-87** có 1 unit test (`Notifications.push`) — đủ cho demo “push trong app”. FCM/PDF/Firebase production để khi có backend thật.

---

## Checklist Giai đoạn 5

```
[x] File COD1-TEST-MAP.md — map 43 test ↔ COD1
[x] Tên test E2E có tiền tố COD1-XXX (17 test)
[x] Unit test Đợt 2: COD1-76, 80, 81, 83 (8 test mới)
[x] Đợt 3: ghi nhận COD1 bỏ qua + COD1-87 unit tối thiểu
[x] JUnit reporter (test-results/junit.xml) cho Xray
[x] Script validate-cod1-tests.js
[ ] Tạo Test Case trên Jira (thủ công theo bảng trên)
[ ] Link Test ↔ Story COD1 trên Jira
[ ] (Tuỳ chọn) Import junit.xml vào Xray
```

---

## Giai đoạn 6 — Postman / API test

**Kết luận: N/A (bỏ qua)** — MedCare là web app **client-only**, lưu dữ liệu bằng `localStorage` (`js/storage.js`), không có REST/GraphQL endpoint.

| Kiểm tra | Kết quả |
|----------|---------|
| Backend server (Express, FastAPI, …) | Không có |
| Gọi HTTP (`fetch`, `axios`, `/api/…`) trong `js/` | Không có |
| Postman collection | Không cần tạo |

### Thay thế đã có (Giai đoạn 2 + 3)

Logic mà API thường đảm nhiệm (CRUD BN, toa, lịch sử, backup…) được cover bởi:

| Lớp | Công cụ | Số test |
|-----|---------|---------|
| Logic JS thuần | Vitest (`tests/storage.test.js`, `tests/bundle.test.js`) | 26 |
| Luồng người dùng | Playwright E2E (`e2e/*.spec.js`) | 17 |

### Khi có backend thật (tương lai)

1. Tạo Postman Collection: Auth → Patients → Prescriptions → Sync.
2. Mỗi request map tới COD1 (vd. `POST /patients` ↔ COD1-74).
3. Chạy Newman trong CI: `newman run medcare.postman_collection.json`.
4. Cập nhật `COD1-MAPPING.md` — thay stub localStorage bằng API call.

### Checklist Giai đoạn 6

```
[x] Xác nhận app không có backend API
[x] Ghi nhận N/A + lý do trong COD1-TEST-MAP.md
[x] Chức năng tương đương đã cover bởi unit + E2E (43 test)
[ ] Postman — chỉ làm khi triển khai API backend
```

---

## Giai đoạn 7 — Performance test (JMeter)

**Phạm vi:** Load test **static file server** (`npm start` → `serve` port 3000) — mô phỏng nhiều user mở MedCare lần đầu (tải HTML, CSS, 75 script theo `cod1/load-order.js`).

| Kiểm tra | Kết quả |
|----------|---------|
| API backend | Không có (giống Giai đoạn 6) |
| Static SPA qua HTTP | **Có** — phù hợp JMeter |
| Test plan | `jmeter/medcare-load-test.jmx` |
| Tài liệu | `jmeter/README.md` |

### Kịch bản

| Bước | Mô tả |
|------|--------|
| 1 | `npm start` — bật server localhost:3000 |
| 2 | `npm run jmeter:generate` — (tuỳ chọn) sinh lại CSV/JMX sau khi đổi `load-order.js` |
| 3 | `RUN-JMETER.bat` hoặc `jmeter -n -t jmeter/medcare-load-test.jmx …` |
| 4 | Xem `jmeter/results/html_*/index.html` — chụp báo cáo nộp Jira |

### Tham số mặc định

| Property | Giá trị | Ý nghĩa |
|----------|---------|---------|
| `THREADS` | 10 | User ảo đồng thời |
| `RAMP_UP` | 30 s | Tăng dần đến đủ threads |
| `LOOPS` | 1 | Lần lặp / user |
| Requests / loop | 79 | 4 bootstrap + 75 script |

### Ngưỡng tham chiếu (local dev)

| Chỉ số | Mục tiêu |
|--------|----------|
| Error % | 0% |
| Avg response (mỗi GET) | &lt; 200 ms |
| TX first page load (p95) | &lt; 5 s |

### Checklist Giai đoạn 7

```
[x] Test plan JMeter (medcare-load-test.jmx + asset-paths.csv)
[x] Script sinh lại plan: tools/generate-jmeter-plan.js
[x] RUN-JMETER.bat + jmeter/README.md
[x] Ghi nhận phạm vi (static only, không API) trong COD1-TEST-MAP.md
[ ] Cài JMeter + Java trên máy dev
[ ] Chạy load test với app đang bật (npm start)
[ ] Lưu screenshot / HTML report làm bằng chứng
[ ] (Tuỳ chọn) Tạo Test Case Jira "PERF-01 — Load MedCare SPA"
```
