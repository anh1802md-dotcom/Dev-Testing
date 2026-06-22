const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { sql, config, getPool, closePool } = require("../db/connection");

const DEMO_PASSWORD = "123456";

async function runSqlFile(filePath, useMaster = false) {
  const raw = fs.readFileSync(filePath, "utf8");
  const batches = raw.split(/\r?\nGO\r?\n/i).map((b) => b.trim()).filter(Boolean);

  const runConfig = useMaster ? { ...config, database: "master" } : config;
  const pool = await sql.connect(runConfig);

  for (const batch of batches) {
    if (!batch) continue;
    try {
      await pool.request().query(batch);
    } catch (err) {
      if (err.message.includes("already exists") || err.message.includes("There is already")) {
        continue;
      }
      throw err;
    }
  }

  await pool.close();
}

async function seedDemoData() {
  const pool = await getPool();
  await pool.request().query(`
    IF COL_LENGTH('dbo.Patients', 'UserId') IS NULL
      ALTER TABLE dbo.Patients ADD UserId NVARCHAR(50) NULL;
    IF COL_LENGTH('dbo.MedicineHistory', 'Status') IS NULL
      ALTER TABLE dbo.MedicineHistory ADD Status NVARCHAR(20) NOT NULL CONSTRAINT DF_MedicineHistory_Status DEFAULT N'taken';
  `);
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.Reminders', N'U') IS NULL
    CREATE TABLE dbo.Reminders (
      Id        NVARCHAR(50)  NOT NULL PRIMARY KEY,
      RxId      NVARCHAR(50)  NOT NULL REFERENCES dbo.Prescriptions(Id) ON DELETE CASCADE,
      PatientId NVARCHAR(50)  NOT NULL REFERENCES dbo.Patients(Id) ON DELETE NO ACTION,
      Time      NVARCHAR(10)  NOT NULL,
      DaysJson  NVARCHAR(100) NOT NULL DEFAULT N'[0,1,2,3,4,5,6]',
      Active    BIT           NOT NULL DEFAULT 1
    );
  `);
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const userCount = await pool.request().query("SELECT COUNT(*) AS cnt FROM dbo.Users");
  if (userCount.recordset[0].cnt === 0) {
    await pool.request()
      .input("hash", sql.NVarChar, hash)
      .query(`
        INSERT INTO dbo.Users (Id, Email, PasswordHash, Name, Role, Department, Title)
        VALUES
          (N'u1', N'admin@demo.com', @hash, N'Admin Hệ thống', N'admin', N'', N'Quản trị viên'),
          (N'u2', N'bs.nguyenminh@hospital.vn', @hash, N'BS. Nguyễn Minh', N'doctor', N'Tim mạch', N'Bác sĩ'),
          (N'u3', N'bs.tranvan@hospital.vn', @hash, N'BS. Trần Văn B', N'doctor', N'Nội tiết', N'Bác sĩ');
      `);
    console.log("✓ Seeded users (admin@demo.com / 123456)");
  }

  const patientCount = await pool.request().query("SELECT COUNT(*) AS cnt FROM dbo.Patients");
  if (patientCount.recordset[0].cnt === 0) {
    await pool.request().query(`
      INSERT INTO dbo.Patients (Id, Code, Name, Phone, Birth, Gender, Department, Status, StatusConfirmedBy, StatusConfirmedAt, LastVisit, Note)
      VALUES
        (N'p1', N'BN001', N'Nguyễn Văn A', N'0901111111', '1981-05-10', N'Nam', N'Tim mạch', N'stable', N'BS. Nguyễn Minh', SYSUTCDATETIME(), '2026-05-15', N'Tiểu đường type 2'),
        (N'p2', N'BN002', N'Trần Thị B', N'0902222222', '1990-08-22', N'Nữ', N'Nội tiết', N'monitoring', N'BS. Nguyễn Minh', SYSUTCDATETIME(), '2026-05-14', N'Theo dõi đường huyết'),
        (N'p3', N'BN003', N'Lê Văn C', N'0903333333', '1975-12-03', N'Nam', N'Hô hấp', N'emergency', N'BS. Trần Văn B', SYSUTCDATETIME(), '2026-05-13', N'Viêm phổi'),
        (N'p4', N'BN004', N'Phạm Thị D', N'0904444444', '1998-02-18', N'Nữ', N'Sản khoa', N'pending', NULL, NULL, '2026-05-13', N'');
    `);

    await pool.request().query(`
      INSERT INTO dbo.Prescriptions (Id, PatientId, Name, Dosage, Frequency, IntakeTime, TimesJson, Status, StatusConfirmedBy, StatusConfirmedAt, StartDate, EndDate, Note)
      VALUES
        (N'rx1', N'p1', N'Aspirin', N'100mg', N'1 lần/ngày', N'Sau bữa sáng', N'["08:00"]', N'active', N'BS. Nguyễn Minh', SYSUTCDATETIME(), '2026-05-01', '2026-08-01', N'Uống sau bữa ăn'),
        (N'rx2', N'p2', N'Metformin', N'500mg', N'2 lần/ngày', N'Sau bữa ăn', N'["08:00","20:00"]', N'active', N'BS. Nguyễn Minh', SYSUTCDATETIME(), CAST(GETDATE() AS DATE), NULL, N'Sau ăn'),
        (N'rx3', N'p3', N'Amoxicillin', N'250mg', N'3 lần/ngày', N'Mỗi 8 giờ', N'["08:00","16:00","00:00"]', N'pending', NULL, NULL, '2026-05-14', '2026-05-21', N'Liệu trình 7 ngày');
    `);

    await pool.request().query(`
      INSERT INTO dbo.MedicalRecords (Id, PatientId, Title, Diagnosis, Doctor, VisitDate, Symptoms, Treatment, Vitals, Note)
      VALUES (N'mr1', N'p1', N'Khám định kỳ', N'Tiểu đường type 2', N'BS. Nguyễn Minh', '2026-05-15', N'Khát nước, mệt mỏi', N'Tiếp tục Metformin', N'Huyết áp 125/82', N'Tái khám 3 tháng');
    `);

    await pool.request().query(`
      INSERT INTO dbo.Notifications (Id, Title, Message, Type, Icon, IsRead)
      VALUES
        (N'n1', N'Nhắc nhở uống thuốc', N'Đã đến giờ uống Aspirin 100mg cho bệnh nhân Nguyễn Văn A', N'reminder', N'pill', 0),
        (N'n2', N'Lịch hẹn mới', N'Bệnh nhân Trần Thị B đã đặt lịch khám ngày 20/05/2026', N'appointment', N'calendar', 0),
        (N'n3', N'Cảnh báo thuốc', N'Thuốc Amoxicillin của Lê Văn C sắp hết', N'warn', N'alert', 0);
    `);

    await pool.request().query(`
      INSERT INTO dbo.ActivityLog (Text) VALUES (N'Khởi tạo dữ liệu demo');
    `);

    await pool.request().query(`
      INSERT INTO dbo.Reminders (Id, RxId, PatientId, Time, DaysJson, Active)
      VALUES
        (N'rem1', N'rx1', N'p1', N'08:00', N'[0,1,2,3,4,5,6]', 1),
        (N'rem2', N'rx2', N'p2', N'08:00', N'[0,1,2,3,4,5,6]', 1),
        (N'rem3', N'rx2', N'p2', N'20:00', N'[0,1,2,3,4,5,6]', 1),
        (N'rem4', N'rx3', N'p3', N'08:00', N'[0,1,2,3,4,5,6]', 1);
    `);

    console.log("✓ Seeded patients, prescriptions, records, notifications, reminders");
  }

  const remCount = await pool.request().query("SELECT COUNT(*) AS cnt FROM dbo.Reminders");
  if (remCount.recordset[0].cnt === 0) {
    await pool.request().query(`
      IF EXISTS (SELECT 1 FROM dbo.Prescriptions WHERE Id = N'rx1')
      INSERT INTO dbo.Reminders (Id, RxId, PatientId, Time, DaysJson, Active)
      VALUES
        (N'rem1', N'rx1', N'p1', N'08:00', N'[0,1,2,3,4,5,6]', 1),
        (N'rem2', N'rx2', N'p2', N'08:00', N'[0,1,2,3,4,5,6]', 1),
        (N'rem3', N'rx2', N'p2', N'20:00', N'[0,1,2,3,4,5,6]', 1),
        (N'rem4', N'rx3', N'p3', N'08:00', N'[0,1,2,3,4,5,6]', 1);
    `);
    console.log("✓ Seeded reminders");
  }
}

async function main() {
  console.log("Connecting to:", config.server, config.options.instanceName ? "\\" + config.options.instanceName : "", "→", config.database);
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  await runSqlFile(schemaPath, true);
  await runSqlFile(schemaPath, false);
  await seedDemoData();
  await closePool();
  console.log("Database init complete.");
}

main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
