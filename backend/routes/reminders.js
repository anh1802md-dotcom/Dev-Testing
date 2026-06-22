const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db/connection");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

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

router.get("/", requireAuth, async (req, res) => {
  try {
    const { rxId, patientId } = req.query;
    let sqlText = "SELECT * FROM dbo.Reminders WHERE 1=1";
    const params = {};
    if (rxId) { sqlText += " AND RxId = @rxId"; params.rxId = rxId; }
    if (patientId) { sqlText += " AND PatientId = @patientId"; params.patientId = patientId; }
    sqlText += " ORDER BY Time";
    const result = await query(sqlText, params);
    res.json({ data: result.recordset.map(mapReminder), total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.put("/rx/:rxId", requireAuth, async (req, res) => {
  try {
    const { times, active } = req.body || {};
    const rxResult = await query("SELECT Id, PatientId FROM dbo.Prescriptions WHERE Id = @id", { id: req.params.rxId });
    if (!rxResult.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy toa thuốc" });
    }
    const patientId = rxResult.recordset[0].PatientId;
    await query("DELETE FROM dbo.Reminders WHERE RxId = @rxId", { rxId: req.params.rxId });

    const timeList = Array.isArray(times) ? times : [];
    const isActive = active !== false;
    for (const time of timeList) {
      if (!time) continue;
      const id = "rem_" + uuidv4().slice(0, 8);
      await query(`
        INSERT INTO dbo.Reminders (Id, RxId, PatientId, Time, DaysJson, Active)
        VALUES (@id, @rxId, @patientId, @time, @daysJson, @active)
      `, {
        id,
        rxId: req.params.rxId,
        patientId,
        time: String(time).trim(),
        daysJson: JSON.stringify([0, 1, 2, 3, 4, 5, 6]),
        active: isActive ? 1 : 0,
      });
    }

    const result = await query("SELECT * FROM dbo.Reminders WHERE RxId = @rxId", { rxId: req.params.rxId });
    res.json({ data: result.recordset.map(mapReminder) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
