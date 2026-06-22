const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db/connection");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

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

router.get("/", requireAuth, async (req, res) => {
  try {
    const { patientId, rxId } = req.query;
    let sqlText = "SELECT * FROM dbo.MedicineHistory WHERE 1=1";
    const params = {};
    if (patientId) { sqlText += " AND PatientId = @patientId"; params.patientId = patientId; }
    if (rxId) { sqlText += " AND RxId = @rxId"; params.rxId = rxId; }
    sqlText += " ORDER BY At DESC";
    const result = await query(sqlText, params);
    res.json({ data: result.recordset.map(mapHistory), total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.patientId || !body.medName) {
      return res.status(400).json({ error: "BadRequest", message: "Thiếu patientId hoặc medName" });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (body.rxId) {
      await query(`
        DELETE FROM dbo.MedicineHistory
        WHERE RxId = @rxId AND CONVERT(date, At) = @today
      `, { rxId: body.rxId, today });
    }

    const id = body.id || ("h_" + uuidv4().slice(0, 8));
    await query(`
      INSERT INTO dbo.MedicineHistory (Id, PatientId, RxId, DrugName, Dosage, Status, At, Confirmed, ConfirmedBy, ConfirmedAt, Note)
      VALUES (@id, @patientId, @rxId, @drugName, @dosage, @status, @at, @confirmed, @confirmedBy, @confirmedAt, @note)
    `, {
      id,
      patientId: body.patientId,
      rxId: body.rxId || null,
      drugName: body.medName,
      dosage: body.dosage || null,
      status: body.status || "taken",
      at: body.at || new Date().toISOString(),
      confirmed: body.confirmed !== false ? 1 : 0,
      confirmedBy: body.confirmedBy || req.user.Name,
      confirmedAt: body.confirmedAt || body.at || new Date().toISOString(),
      note: body.note || null,
    });

    const created = await query("SELECT * FROM dbo.MedicineHistory WHERE Id = @id", { id });
    res.status(201).json({ data: mapHistory(created.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
