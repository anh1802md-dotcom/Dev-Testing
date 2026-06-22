-- MedCare Database — chạy trên LAPTOP-BD1H54CO\SQLEXPRESS
-- Đăng nhập SSMS bằng sa / 123456 → New Query → chạy toàn bộ script

USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.databases WHERE name = N'MedCareDB')
BEGIN
  CREATE DATABASE MedCareDB;
END
GO

USE MedCareDB;
GO

-- Users
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
CREATE TABLE dbo.Users (
  Id            NVARCHAR(50)  NOT NULL PRIMARY KEY,
  Email         NVARCHAR(255) NOT NULL UNIQUE,
  PasswordHash  NVARCHAR(255) NOT NULL,
  Name          NVARCHAR(200) NOT NULL,
  Role          NVARCHAR(20)  NOT NULL DEFAULT N'user',
  Department    NVARCHAR(100) NULL,
  Title         NVARCHAR(100) NULL,
  OtpEnabled    BIT           NOT NULL DEFAULT 0,
  Lang          NVARCHAR(10)  NOT NULL DEFAULT N'vi',
  NotifEnabled  BIT           NOT NULL DEFAULT 1,
  SoundEnabled  BIT           NOT NULL DEFAULT 1,
  CreatedAt     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Patients
IF OBJECT_ID(N'dbo.Patients', N'U') IS NULL
CREATE TABLE dbo.Patients (
  Id                  NVARCHAR(50)  NOT NULL PRIMARY KEY,
  Code                NVARCHAR(20)  NOT NULL UNIQUE,
  Name                NVARCHAR(200) NOT NULL,
  Phone               NVARCHAR(20)  NULL,
  Birth               DATE          NULL,
  Gender              NVARCHAR(10)  NULL DEFAULT N'Nam',
  Department          NVARCHAR(100) NULL DEFAULT N'Đa khoa',
  Status              NVARCHAR(20)  NOT NULL DEFAULT N'pending',
  StatusConfirmedBy   NVARCHAR(200) NULL,
  StatusConfirmedAt   DATETIME2     NULL,
  DoctorId            NVARCHAR(50)  NULL REFERENCES dbo.Users(Id),
  UserId              NVARCHAR(50)  NULL REFERENCES dbo.Users(Id),
  LastVisit           DATE          NULL,
  Note                NVARCHAR(MAX) NULL,
  Avatar              NVARCHAR(500) NULL,
  CreatedAt           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Prescriptions
IF OBJECT_ID(N'dbo.Prescriptions', N'U') IS NULL
CREATE TABLE dbo.Prescriptions (
  Id                  NVARCHAR(50)  NOT NULL PRIMARY KEY,
  PatientId           NVARCHAR(50)  NOT NULL REFERENCES dbo.Patients(Id) ON DELETE CASCADE,
  Name                NVARCHAR(200) NOT NULL,
  Dosage              NVARCHAR(100) NULL,
  Frequency           NVARCHAR(100) NULL,
  IntakeTime          NVARCHAR(100) NULL,
  TimesJson           NVARCHAR(500) NULL,
  Status              NVARCHAR(20)  NOT NULL DEFAULT N'pending',
  StatusConfirmedBy   NVARCHAR(200) NULL,
  StatusConfirmedAt   DATETIME2     NULL,
  StartDate           DATE          NULL,
  EndDate             DATE          NULL,
  Note                NVARCHAR(MAX) NULL,
  RunningOut          BIT           NOT NULL DEFAULT 0,
  CreatedAt           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Medical Records
IF OBJECT_ID(N'dbo.MedicalRecords', N'U') IS NULL
CREATE TABLE dbo.MedicalRecords (
  Id          NVARCHAR(50)  NOT NULL PRIMARY KEY,
  PatientId   NVARCHAR(50)  NOT NULL REFERENCES dbo.Patients(Id) ON DELETE CASCADE,
  Title       NVARCHAR(200) NOT NULL,
  Diagnosis   NVARCHAR(500) NULL,
  Doctor      NVARCHAR(200) NULL,
  VisitDate   DATE          NULL,
  Symptoms    NVARCHAR(MAX) NULL,
  Treatment   NVARCHAR(MAX) NULL,
  Vitals      NVARCHAR(200) NULL,
  Note        NVARCHAR(MAX) NULL,
  CreatedAt   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Medicine History
IF OBJECT_ID(N'dbo.MedicineHistory', N'U') IS NULL
CREATE TABLE dbo.MedicineHistory (
  Id          NVARCHAR(50)  NOT NULL PRIMARY KEY,
  PatientId   NVARCHAR(50)  NOT NULL REFERENCES dbo.Patients(Id) ON DELETE CASCADE,
  RxId        NVARCHAR(50)  NULL REFERENCES dbo.Prescriptions(Id),
  DrugName    NVARCHAR(200) NOT NULL,
  Dosage      NVARCHAR(100) NULL,
  Status      NVARCHAR(20)  NOT NULL DEFAULT N'taken',
  At          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  Confirmed   BIT           NOT NULL DEFAULT 1,
  ConfirmedBy NVARCHAR(200) NULL,
  ConfirmedAt DATETIME2     NULL,
  Note        NVARCHAR(MAX) NULL
);
GO

-- Reminders
IF OBJECT_ID(N'dbo.Reminders', N'U') IS NULL
CREATE TABLE dbo.Reminders (
  Id        NVARCHAR(50)  NOT NULL PRIMARY KEY,
  RxId      NVARCHAR(50)  NOT NULL REFERENCES dbo.Prescriptions(Id) ON DELETE CASCADE,
  PatientId NVARCHAR(50)  NOT NULL REFERENCES dbo.Patients(Id) ON DELETE NO ACTION,
  Time      NVARCHAR(10)  NOT NULL,
  DaysJson  NVARCHAR(100) NOT NULL DEFAULT N'[0,1,2,3,4,5,6]',
  Active    BIT           NOT NULL DEFAULT 1
);
GO

-- Notifications
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
CREATE TABLE dbo.Notifications (
  Id        NVARCHAR(50)  NOT NULL PRIMARY KEY,
  Title     NVARCHAR(200) NOT NULL,
  Message   NVARCHAR(MAX) NOT NULL,
  Type      NVARCHAR(50)  NOT NULL DEFAULT N'info',
  Icon      NVARCHAR(50)  NULL DEFAULT N'info',
  IsRead    BIT           NOT NULL DEFAULT 0,
  At        DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- Activity Log
IF OBJECT_ID(N'dbo.ActivityLog', N'U') IS NULL
CREATE TABLE dbo.ActivityLog (
  Id    INT IDENTITY(1,1) PRIMARY KEY,
  At    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
  Text  NVARCHAR(500) NOT NULL
);
GO

PRINT N'MedCareDB schema ready. Chạy: cd backend && npm run db:init';
GO
