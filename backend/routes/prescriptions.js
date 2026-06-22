const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db/connection");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function mapRx(row) {
  let times = [];
  try {
    times = row.TimesJson ? JSON.parse(row.TimesJson) : [];
  } catch (_) {}

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

router.get("/", requireAuth, async (req, res) => {
  try {
    const { patientId, status } = req.query;
    let sqlText = "SELECT * FROM dbo.Prescriptions WHERE 1=1";
    const params = {};

    if (patientId) {
      sqlText += " AND PatientId = @patientId";
      params.patientId = patientId;
    }
    if (status) {
      sqlText += " AND Status = @status";
      params.status = status;
    }
    sqlText += " ORDER BY CreatedAt DESC";

    const result = await query(sqlText, params);
    res.json({ data: result.recordset.map(mapRx), total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await query("SELECT * FROM dbo.Prescriptions WHERE Id = @id", { id: req.params.id });
    if (!result.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy toa thuốc" });
    }
    res.json({ data: mapRx(result.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.patientId || !body.name) {
      return res.status(400).json({ error: "BadRequest", message: "Thiếu patientId hoặc name" });
    }

    const patient = await query("SELECT Id FROM dbo.Patients WHERE Id = @id", { id: body.patientId });
    if (!patient.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Bệnh nhân không tồn tại" });
    }

    const id = "rx_" + uuidv4().slice(0, 8);
    const timesJson = JSON.stringify(body.times || []);

    await query(`
      INSERT INTO dbo.Prescriptions (Id, PatientId, Name, Dosage, Frequency, IntakeTime, TimesJson, Status, StartDate, EndDate, Note)
      VALUES (@id, @patientId, @name, @dosage, @frequency, @intakeTime, @timesJson, @status, @startDate, @endDate, @note)
    `, {
      id,
      patientId: body.patientId,
      name: body.name,
      dosage: body.dosage || null,
      frequency: body.frequency || null,
      intakeTime: body.intakeTime || null,
      timesJson,
      status: body.status || "pending",
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      note: body.note || null,
    });

    const created = await query("SELECT * FROM dbo.Prescriptions WHERE Id = @id", { id });
    res.status(201).json({ data: mapRx(created.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const existing = await query("SELECT Id FROM dbo.Prescriptions WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy toa thuốc" });
    }

    const timesJson = body.times ? JSON.stringify(body.times) : null;

    await query(`
      UPDATE dbo.Prescriptions SET
        Name = COALESCE(@name, Name),
        Dosage = COALESCE(@dosage, Dosage),
        Frequency = COALESCE(@frequency, Frequency),
        IntakeTime = COALESCE(@intakeTime, IntakeTime),
        TimesJson = COALESCE(@timesJson, TimesJson),
        Status = COALESCE(@status, Status),
        StatusConfirmedBy = CASE WHEN @status IS NOT NULL THEN @confirmedBy ELSE StatusConfirmedBy END,
        StatusConfirmedAt = CASE WHEN @status IS NOT NULL THEN SYSUTCDATETIME() ELSE StatusConfirmedAt END,
        StartDate = COALESCE(@startDate, StartDate),
        EndDate = COALESCE(@endDate, EndDate),
        Note = COALESCE(@note, Note),
        RunningOut = COALESCE(@runningOut, RunningOut)
      WHERE Id = @id
    `, {
      id: req.params.id,
      name: body.name ?? null,
      dosage: body.dosage ?? null,
      frequency: body.frequency ?? null,
      intakeTime: body.intakeTime ?? null,
      timesJson,
      status: body.status ?? null,
      confirmedBy: req.user.Name,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      note: body.note ?? null,
      runningOut: body.runningOut !== undefined ? (body.runningOut ? 1 : 0) : null,
    });

    const updated = await query("SELECT * FROM dbo.Prescriptions WHERE Id = @id", { id: req.params.id });
    res.json({ data: mapRx(updated.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await query("SELECT Name FROM dbo.Prescriptions WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy toa thuốc" });
    }

    await query("DELETE FROM dbo.Prescriptions WHERE Id = @id", { id: req.params.id });
    res.json({ ok: true, message: "Đã xóa toa thuốc" });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
