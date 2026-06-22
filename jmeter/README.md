# MedCare — JMeter Performance Test (Giai đoạn 7)

Kiểm tra **hiệu năng phục vụ static file** của MedCare khi nhiều người dùng mở app đồng thời.

> App **client-only** (localStorage) — không có API backend. JMeter đo thời gian tải `index.html`, CSS và toàn bộ script theo `cod1/load-order.js` qua `serve` (port 3000).

## Yêu cầu

1. **Java** 8+ ([Adoptium](https://adoptium.net/))
2. **Apache JMeter** 5.6+ ([jmeter.apache.org](https://jmeter.apache.org/download_jmeter.cgi))
3. App đang chạy: `npm start` → http://localhost:3000

## Sinh lại test plan (sau khi đổi `load-order.js`)

```bash
npm run jmeter:generate
```

Tạo/cập nhật:

| File | Mô tả |
|------|--------|
| `asset-paths.csv` | Danh sách script từ `cod1/load-order.js` |
| `medcare-load-test.jmx` | Test plan JMeter |

## Chạy test

### Cách 1 — Double-click

1. `npm start` (terminal 1)
2. Double-click **`RUN-JMETER.bat`** (terminal 2)

### Cách 2 — CLI (không GUI)

```bash
# Từ thư mục gốc repo, sau npm start
jmeter -n -t jmeter/medcare-load-test.jmx -l jmeter/results/run.jtl -e -o jmeter/results/html-report
```

Tham số tuỳ chỉnh (`-J`):

| Property | Mặc định | Ý nghĩa |
|----------|----------|---------|
| `HOST` | `localhost` | Host server |
| `PORT` | `3000` | Cổng `serve` |
| `THREADS` | `10` | Số user ảo đồng thời |
| `RAMP_UP` | `30` | Giây để tăng dần đến đủ THREADS |
| `LOOPS` | `1` | Số lần mỗi user lặp kịch bản |

Ví dụ 50 user, ramp 60s:

```bash
jmeter -n -t jmeter/medcare-load-test.jmx -JTHREADS=50 -JRAMP_UP=60 -l jmeter/results/run.jtl -e -o jmeter/results/html-report
```

### Cách 3 — GUI (debug)

```bash
jmeter -t jmeter/medcare-load-test.jmx
```

Mở **Summary Report** → Run (▶). Đừng dùng GUI cho load test lớn.

## Kịch bản trong test plan

Mỗi virtual user thực hiện **một transaction** mô phỏng lần mở app đầu tiên:

1. `GET /index.html`
2. `GET /css/app.css`
3. `GET /cod1/load-order.js`
4. `GET /js/loader.js`
5. Lần lượt `GET` từng file trong `asset-paths.csv` (75 script)

Mỗi request có assertion **HTTP 200**.

## Ngưỡng tham chiếu (demo / báo cáo)

Trên máy dev local (`serve`, 10 threads):

| Chỉ số | Mục tiêu gợi ý |
|--------|----------------|
| Error % | **0%** |
| Throughput (TX) | ≥ 1 txn/s (tuỳ máy) |
| Avg response time (mỗi GET) | &lt; 200 ms |
| TX — MedCare first page load (p95) | &lt; 5 s |

> CDN (Chart.js, Google Fonts) **không** nằm trong test — chỉ tài nguyên local.

## Kết quả

- `results/run.jtl` — raw log (gitignore)
- `results/html-report/` — báo cáo HTML JMeter (gitignore)

Chụp **Summary Report** hoặc dashboard HTML để nộp Jira / báo cáo Giai đoạn 7.

## Giới hạn đã biết

| Hạng mục | Ghi chú |
|----------|---------|
| Không test API | Giống Giai đoạn 6 — không có REST endpoint |
| Không test localStorage / UI | Chỉ đo HTTP static; logic app đã cover bởi Vitest + Playwright |
| `serve` dev server | Không phản ánh production CDN/nginx — đủ cho bài lab |
