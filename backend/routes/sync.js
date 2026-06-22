const express = require("express");
const { query } = require("../db/connection");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function mapPatient(row) {
  return {
    id: row.Id,
    code: row.Code,
    name: row.Name,
    phone: row.Phone,
    birth: row.Birth ? row.Birth.toISOString().slice(0, 10) : null,
    gender: row.Gender,
    department: row.Department,
    status: row.Status,
    statusConfirmedBy: row.StatusConfirmedBy,
    statusConfirmedAt: row.StatusConfirmedAt,
    doctorId: row.DoctorId,
    userId: row.UserId,
    lastVisit: row.LastVisit ? row.LastVisit.toISOString().slice(0, 10) : null,
    note: row.Note,
    avatar: row.Avatar,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

function mapRx(row) {
  let times = [];
  try { times = row.TimesJson ? JSON.parse(row.TimesJson) : []; } catch (_) {}
  return {
    id: row.Id,
    patientId: row.PatientId,
    name: row.Name,
    dosage: row.Dosage,
    frequency: row.Frequency,
    intakeTime: row.IntakeTime,
    times,
    status: row.Status,
    statusConfirmedBy: row.StatusConfirmedBy,
    statusConfirmedAt: row.StatusConfirmedAt,
    startDate: row.StartDate ? row.StartDate.toISOString().slice(0, 10) : null,
    endDate: row.EndDate ? row.EndDate.toISOString().slice(0, 10) : null,
    note: row.Note,
    runningOut: !!row.RunningOut,
    createdAt: row.CreatedAt,
  };
}

function mapRecord(row) {
  return {
    id: row.Id,
    patientId: row.PatientId,
    title: row.Title,
    diagnosis: row.Diagnosis,
    doctor: row.Doctor,
    visitDate: row.VisitDate ? row.VisitDate.toISOString().slice(0, 10) : null,
    symptoms: row.Symptoms,
    treatment: row.Treatment,
    vitals: row.Vitals,
    note: row.Note,
    createdAt: row.CreatedAt,
  };
}

function mapHistory(row) {
  return {
    id: row.Id,
    rxId: row.RxId,
    patientId: row.PatientId,
    medName: row.DrugName,
    status: row.Status || "taken",
    confirmed: !!row.Confirmed,
    confirmedBy: row.ConfirmedBy,
    confirmedAt: row.ConfirmedAt,
    at: row.At,
  };
}

function mapReminder(row) {
  let days = [0, 1, 2, 3, 4, 5, 6];
  try { days = row.DaysJson ? JSON.parse(row.DaysJson) : days; } catch (_) {}
  return {
    id: row.Id,
    rxId: row.RxId,
    patientId: row.PatientId,
    time: row.Time,
    days,
    active: !!row.Active,
  };
}

function mapNotif(row) {
  return {
    id: row.Id,
    title: row.Title,
    message: row.Message,
    type: row.Type,
    icon: row.Icon,
    read: !!row.IsRead,
    at: row.At,
  };
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const [patients, prescriptions, medicalRecords, history, reminders, notifications] = await Promise.all([
      query("SELECT * FROM dbo.Patients ORDER BY UpdatedAt DESC"),
      query("SELECT * FROM dbo.Prescriptions ORDER BY CreatedAt DESC"),
      query("SELECT * FROM dbo.MedicalRecords ORDER BY CreatedAt DESC"),
      query("SELECT * FROM dbo.MedicineHistory ORDER BY At DESC"),
      query("SELECT * FROM dbo.Reminders ORDER BY Time"),
      query("SELECT * FROM dbo.Notifications ORDER BY At DESC"),
    ]);

    res.json({
      patients: patients.recordset.map(mapPatient),
      prescriptions: prescriptions.recordset.map(mapRx),
      medicalRecords: medicalRecords.recordset.map(mapRecord),
      history: history.recordset.map(mapHistory),
      reminders: reminders.recordset.map(mapReminder),
      notifications: notifications.recordset.map(mapNotif),
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
