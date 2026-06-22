# MedCare — Ứng dụng quản lý hồ sơ bệnh nhân & lịch sử dùng thuốc

Web app mobile-first (PWA-style), chạy trên trình duyệt, lưu dữ liệu bằng **localStorage** — không cần server.

## Chạy ứng dụng

### Cách khuyến nghị (localhost — dùng cho test automation)

Yêu cầu: **Node.js** (LTS). Lần đầu:

```bash
npm install
npm start
```

Mở http://localhost:3000 — đăng nhập demo: **admin@demo.com** / **123456**

Hoặc double-click **`START-DEV.bat`** (tự chạy server + mở trình duyệt).

### Cách nhanh (không cần Node)

1. Double-click **`START.bat`** hoặc mở **`index.html`**
2. Đăng nhập demo: **admin@demo.com** / **123456**

> Biểu đồ báo cáo cần internet lần đầu (CDN Chart.js). Các chức năng khác chạy offline.

## Test unit (Vitest)

Kiểm tra logic thuần JS trong `js/storage.js` và `js/modules/bundle.js` (localStorage, CRUD, nhắc thuốc, lịch sử…).

```bash
npm install          # lần đầu
npm test             # chạy một lần
npm run test:watch   # theo dõi khi sửa code
```

| File test | Phạm vi |
|-----------|---------|
| `tests/storage.test.js` | `MedStore.get/save/reset`, `uid`, `log`, migration |
| `tests/bundle.test.js` | CRUD BN/toa, xóa BN, lịch sử, lọc thuốc, push, phân quyền BS |

## CI/CD (GitHub Actions)

Mỗi lần **push** hoặc mở **pull request**, workflow `.github/workflows/ci.yml` tự chạy:

1. `npm test` — 26 unit test (Vitest)
2. `npm run test:e2e` — 17 E2E test (Playwright + Chromium trên Ubuntu)

**Kích hoạt lần đầu:**

```bash
git add .
git commit -m "Add MedCare app and CI pipeline"
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin master
```

Vào tab **Actions** trên GitHub để xem kết quả. Badge (tuỳ chọn): `![CI](https://github.com/<user>/<repo>/actions/workflows/ci.yml/badge.svg)`

## Test E2E (Playwright)

Yêu cầu: **Google Chrome** đã cài trên máy (hoặc chạy `npx playwright install chromium` sau khi giải phóng dung lượng ổ đĩa).

```bash
npm install          # lần đầu
npm run test:e2e     # chạy toàn bộ test (tự bật server localhost:3000)
npm run test:e2e:ui  # giao diện debug Playwright
```

| File test | Map Jira | Luồng kiểm tra |
|-----------|----------|----------------|
| `e2e/auth.spec.js` | COD1-70, 71, 120 | Đăng ký, đăng nhập, đăng xuất |
| `e2e/navigation.spec.js` | COD1-82, 84 | Dashboard, menu, truy cập nhanh |
| `e2e/patients.spec.js` | COD1-74, 76, 82, 131 | Danh sách, tìm kiếm, chi tiết, xóa BN |
| `e2e/prescriptions.spec.js` | COD1-72, 78 | Thêm / sửa toa thuốc |
| `e2e/sync.spec.js` | COD1-100, 102 | Backup / khôi phục JSON |
| `e2e/settings.spec.js` | COD1-88 | Đổi mật khẩu |

Mỗi test E2E có tiền tố **`COD1-XXX`** trong tên — dùng khi tạo Test Case trên Jira.

## Quản lý test trên Jira (Giai đoạn 5)

Liên kết **43 test tự động** với task COD1 trên Jira:

| Tài liệu | Nội dung |
|----------|----------|
| **`COD1-TEST-MAP.md`** | Bảng map test ↔ COD1, steps/expected để nhập Jira/Xray |
| **`COD1-MAPPING.md`** | Map mã nguồn ↔ COD1 (code review) |

```bash
npm run test:validate-cod1   # kiểm tra tên test E2E có mã COD1
npm run test:e2e:junit       # xuất test-results/junit.xml (import Xray)
npm run jira:export          # xuất jira-export/test-cases.csv + story-checklist.txt
```

**Trên Jira:** tạo Test Case theo `COD1-TEST-MAP.md` → link tới Story COD1-XXX → (tuỳ chọn) import `junit.xml` vào Xray sau mỗi lần chạy test.

## Giai đoạn 6 — Postman / API test

**Không áp dụng** — app dùng `localStorage`, không có backend API. Xem mục *Giai đoạn 6* trong `COD1-TEST-MAP.md` (N/A + checklist). Khi có API thật, mới cần Postman/Newman.

## Giai đoạn 7 — Performance test (JMeter)

Load test **phục vụ static file** khi nhiều user mở app đồng thời (không test API — xem `jmeter/README.md`).

```bash
npm start                  # terminal 1
npm run jmeter:generate    # sinh lại plan sau khi đổi load-order (tuỳ chọn)
RUN-JMETER.bat             # terminal 2 — hoặc jmeter CLI
```

| File | Nội dung |
|------|----------|
| `jmeter/medcare-load-test.jmx` | Test plan (10 users, 79 HTTP GET / user) |
| `jmeter/asset-paths.csv` | Danh sách script từ `cod1/load-order.js` |
| `jmeter/README.md` | Hướng dẫn cài JMeter, tham số, ngưỡng |

## Chức năng (theo task Jira trong ảnh)

| Nhóm | Mã tham chiếu | Tính năng |
|------|---------------|-----------|
| Tài khoản | COD1-70, 71, 112, 116, 120 | Đăng ký, đăng nhập, quên MK + OTP, phiên |
| Hồ sơ BN | COD1-74–76, 122–125, 129, 131 | CRUD, chi tiết, upload ảnh |
| Toa thuốc | COD1-72, 73, 78, 133–138 | Thêm/sửa/xóa, danh sách, lọc |
| Nhắc thuốc | COD1-77, 79, 92, 95, 139–141 | Lịch giờ, nhắc hôm nay, push trong app |
| Lịch sử | COD1-80, 81, 101, 104, 106, 110, 111 | Đã uống / bỏ qua, tìm, xuất JSON |
| Tìm kiếm | COD1-82, 83, 114, 117, 119, 124 | BN, thuốc, ngày, trạng thái |
| Báo cáo | COD1-84, 85, 128, 130, 132, 134 | Dashboard, biểu đồ, in PDF |
| Thông báo | COD1-87, 103, 105, 107–109 | Danh sách, đọc/xóa, cảnh báo |
| Đồng bộ | COD1-86, 94, 97, 99, 100, 102 | Backup/restore JSON, sync demo |
| Cài đặt | COD1-88, 89, 113, 115, 118, 121, 127 | Đổi MK, OTP, ngôn ngữ, nhật ký |

## Rà soát Jira COD1-XXX

Xem file **`COD1-MAPPING.md`** — bảng đầy đủ: mỗi **COD1-70 … COD1-141** map tới `cod1/COD1-XXX.js`, HTML và hàm trong `js/modules/bundle.js`.

Sửa theo task Jira: mở đúng file **`cod1/COD1-74.js`** … **`cod1/COD1-141.js`** (70 file); logic chi tiết nằm trong **`js/modules/bundle.js`**.

## Cấu trúc

```
BaiTest/
├── index.html
├── package.json
├── playwright.config.js
├── tests/                         # Unit test Vitest
│   ├── storage.test.js
│   ├── bundle.test.js
│   └── helpers/medcare.js
├── e2e/                           # Test E2E Playwright
├── START-DEV.bat                  # npm start + mở localhost:3000
├── COD1-MAPPING.md
├── COD1-TEST-MAP.md               # Test automation ↔ Jira COD1
├── jmeter/                        # Giai đoạn 7 — JMeter load test
│   ├── medcare-load-test.jmx
│   ├── asset-paths.csv
│   └── README.md
├── RUN-JMETER.bat                 # Chạy load test (cần JMeter + npm start)
├── css/app.css
├── cod1/
│   ├── load-order.js
│   ├── COD1-70.js … COD1-141.js   # 70 task (một file = một COD1)
├── js/
│   ├── storage.js
│   ├── core.js
│   ├── loader.js
│   ├── main.js
│   └── modules/bundle.js          # Logic nghiệp vụ
├── tools/generate-cod1.js         # Tạo lại cod1/* khi cần
└── START.bat
```

## Ghi chú

- **Firebase / Push thật**: mô phỏng trong app (thông báo trong danh sách + toast).
- **PDF**: dùng hộp thoại In của trình duyệt → “Lưu dưới dạng PDF”.
- Xóa dữ liệu demo: xóa `localStorage` key `medcare_v1` hoặc khôi phục file backup.
