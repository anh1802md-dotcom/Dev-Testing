# MedCare Backend API

REST API cho MedCare, kết nối **SQL Server Express** tại `LAPTOP-BD1H54CO\SQLEXPRESS`.

## Yêu cầu

- Node.js 18+
- SQL Server Express đang chạy trên máy
- TCP/IP bật cho SQLEXPRESS (SQL Server Configuration Manager)

## Cài đặt nhanh

```bash
cd backend
npm install
npm run db:init    # tạo DB + bảng + dữ liệu demo
npm start          # http://localhost:5000
```

Hoặc double-click **`START-BACKEND.bat`** ở thư mục gốc dự án.

## Cấu hình database

File `backend/.env`:

| Biến | Mặc định |
|------|----------|
| `DB_SERVER` | `localhost` |
| `DB_PORT` | `1433` |
| `DB_NAME` | `MedCareDB` |
| `DB_USERNAME` | `sa` |
| `DB_PASSWORD` | `123456` |

> Instance: `LAPTOP-BD1H54CO\SQLEXPRESS` — kết nối qua port **1433** (không cần SQL Browser).

Script `db/schema.sql` cũng có thể chạy thủ công trong **SSMS** nếu cần.

## Tài khoản demo

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | 123456 | admin |
| bs.nguyenminh@hospital.vn | 123456 | doctor |

## API Endpoints

| Method | URL | Mô tả |
|--------|-----|-------|
| GET | `/api/health` | Kiểm tra server + DB |
| POST | `/api/auth/login` | Đăng nhập → token |
| POST | `/api/auth/register` | Đăng ký |
| GET | `/api/auth/me` | Thông tin user (Bearer token) |
| GET | `/api/patients` | Danh sách BN |
| GET | `/api/patients/:id` | Chi tiết BN |
| POST | `/api/patients` | Tạo BN (COD1-74) |
| PUT | `/api/patients/:id` | Cập nhật BN |
| DELETE | `/api/patients/:id` | Xóa BN |
| GET | `/api/prescriptions` | Danh sách toa thuốc |
| POST | `/api/prescriptions` | Kê toa mới |
| GET | `/api/medical-records` | Hồ sơ khám |
| POST | `/api/medical-records` | Thêm hồ sơ khám |
| GET | `/api/notifications` | Thông báo |
| PATCH | `/api/notifications/:id/read` | Đánh dấu đã đọc |

Header cho request cần auth:

```
Authorization: Bearer <token>
```

## Postman

Import file: **`postman/MedCare-API.postman_collection.json`**

1. Chạy request **Login** trước — token tự lưu vào biến `{{token}}`
2. Các request còn lại dùng Bearer token tự động

Base URL mặc định: `http://localhost:5000`
