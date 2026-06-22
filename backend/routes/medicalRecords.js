const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db/connection");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

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

router.get("/", requireAuth, async (req, res) => {
  try {
    const { patientId } = req.query;
    let sqlText = "SELECT * FROM dbo.MedicalRecords WHERE 1=1";
    const params = {};

    if (patientId) {
      sqlText += " AND PatientId = @patientId";
      params.patientId = patientId;
    }
    sqlText += " ORDER BY VisitDate DESC, CreatedAt DESC";

    const result = await query(sqlText, params);
    res.json({ data: result.recordset.map(mapRecord), total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.patientId || !body.title) {
      return res.status(400).json({ error: "BadRequest", message: "Thiếu patientId hoặc title" });
    }

    const id = "mr_" + uuidv4().slice(0, 8);

    await query(`
      INSERT INTO dbo.MedicalRecords (Id, PatientId, Title, Diagnosis, Doctor, VisitDate, Symptoms, Treatment, Vitals, Note)
      VALUES (@id, @patientId, @title, @diagnosis, @doctor, @visitDate, @symptoms, @treatment, @vitals, @note)
    `, {
      id,
      patientId: body.patientId,
      title: body.title,
      diagnosis: body.diagnosis || null,
      doctor: body.doctor || req.user.Name,
      visitDate: body.visitDate || null,
      symptoms: body.symptoms || null,
      treatment: body.treatment || null,
      vitals: body.vitals || null,
      note: body.note || null,
    });

    const created = await query("SELECT * FROM dbo.MedicalRecords WHERE Id = @id", { id });
    res.status(201).json({ data: mapRecord(created.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const existing = await query("SELECT Id FROM dbo.MedicalRecords WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy hồ sơ bệnh án" });
    }

    await query(`
      UPDATE dbo.MedicalRecords SET
        PatientId = COALESCE(@patientId, PatientId),
        Title = COALESCE(@title, Title),
        Diagnosis = COALESCE(@diagnosis, Diagnosis),
        Doctor = COALESCE(@doctor, Doctor),
        VisitDate = COALESCE(@visitDate, VisitDate),
        Symptoms = COALESCE(@symptoms, Symptoms),
        Treatment = COALESCE(@treatment, Treatment),
        Vitals = COALESCE(@vitals, Vitals),
        Note = COALESCE(@note, Note)
      WHERE Id = @id
    `, {
      id: req.params.id,
      patientId: body.patientId ?? null,
      title: body.title ?? null,
      diagnosis: body.diagnosis ?? null,
      doctor: body.doctor ?? null,
      visitDate: body.visitDate ?? null,
      symptoms: body.symptoms ?? null,
      treatment: body.treatment ?? null,
      vitals: body.vitals ?? null,
      note: body.note ?? null,
    });

    const updated = await query("SELECT * FROM dbo.MedicalRecords WHERE Id = @id", { id: req.params.id });
    res.json({ data: mapRecord(updated.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await query("SELECT Title FROM dbo.MedicalRecords WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy hồ sơ bệnh án" });
    }
    await query("DELETE FROM dbo.MedicalRecords WHERE Id = @id", { id: req.params.id });
    res.json({ ok: true, message: "Đã xóa hồ sơ bệnh án" });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
