const express = require("express");
const { v4: uuidv4 } = require("uuid");
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
    lastVisit: row.LastVisit ? row.LastVisit.toISOString().slice(0, 10) : null,
    note: row.Note,
    avatar: row.Avatar,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  };
}

router.get("/", requireAuth, async (req, res) => {
  try {
    const { status, department, search } = req.query;
    let sqlText = "SELECT * FROM dbo.Patients WHERE 1=1";
    const params = {};

    if (status) {
      sqlText += " AND Status = @status";
      params.status = status;
    }
    if (department) {
      sqlText += " AND Department = @department";
      params.department = department;
    }
    if (search) {
      sqlText += " AND (Name LIKE @search OR Code LIKE @search OR Phone LIKE @search)";
      params.search = "%" + search + "%";
    }
    sqlText += " ORDER BY UpdatedAt DESC";

    const result = await query(sqlText, params);
    res.json({ data: result.recordset.map(mapPatient), total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await query("SELECT * FROM dbo.Patients WHERE Id = @id", { id: req.params.id });
    if (!result.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy bệnh nhân" });
    }
    res.json({ data: mapPatient(result.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name) {
      return res.status(400).json({ error: "BadRequest", message: "Thiếu tên bệnh nhân" });
    }

    const id = "p_" + uuidv4().slice(0, 8);
    let code = body.code;
    if (!code) {
      const codeResult = await query("SELECT COUNT(*) AS cnt FROM dbo.Patients");
      code = "BN" + String(codeResult.recordset[0].cnt + 1).padStart(3, "0");
    }

    await query(`
      INSERT INTO dbo.Patients (Id, Code, Name, Phone, Birth, Gender, Department, Status, StatusConfirmedBy, StatusConfirmedAt, LastVisit, Note, DoctorId)
      VALUES (@id, @code, @name, @phone, @birth, @gender, @department, @status, @statusConfirmedBy, @statusConfirmedAt, @lastVisit, @note, @doctorId)
    `, {
      id,
      code,
      name: body.name,
      phone: body.phone || null,
      birth: body.birth || null,
      gender: body.gender || "Nam",
      department: body.department || "Đa khoa",
      status: body.status || "pending",
      statusConfirmedBy: body.statusConfirmedBy || null,
      statusConfirmedAt: body.statusConfirmedBy ? new Date() : null,
      lastVisit: body.lastVisit || null,
      note: body.note || null,
      doctorId: body.doctorId || null,
    });

    await query("INSERT INTO dbo.ActivityLog (Text) VALUES (@text)", {
      text: (req.user.Name || "User") + " tạo BN: " + body.name,
    });

    const created = await query("SELECT * FROM dbo.Patients WHERE Id = @id", { id });
    res.status(201).json({ data: mapPatient(created.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const existing = await query("SELECT Id FROM dbo.Patients WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy bệnh nhân" });
    }

    if (Object.prototype.hasOwnProperty.call(body, "doctorId")) {
      await query("UPDATE dbo.Patients SET DoctorId = @doctorId, UpdatedAt = SYSUTCDATETIME() WHERE Id = @id", {
        id: req.params.id,
        doctorId: body.doctorId,
      });
    }

    await query(`
      UPDATE dbo.Patients SET
        Name = COALESCE(@name, Name),
        Phone = COALESCE(@phone, Phone),
        Birth = COALESCE(@birth, Birth),
        Gender = COALESCE(@gender, Gender),
        Department = COALESCE(@department, Department),
        Status = COALESCE(@status, Status),
        StatusConfirmedBy = COALESCE(@statusConfirmedBy, StatusConfirmedBy),
        StatusConfirmedAt = CASE WHEN @status IS NOT NULL THEN SYSUTCDATETIME() ELSE StatusConfirmedAt END,
        LastVisit = COALESCE(@lastVisit, LastVisit),
        Note = COALESCE(@note, Note),
        UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @id
    `, {
      id: req.params.id,
      name: body.name ?? null,
      phone: body.phone ?? null,
      birth: body.birth ?? null,
      gender: body.gender ?? null,
      department: body.department ?? null,
      status: body.status ?? null,
      statusConfirmedBy: body.status ? (body.statusConfirmedBy || req.user.Name) : null,
      lastVisit: body.lastVisit ?? null,
      note: body.note ?? null,
    });

    const updated = await query("SELECT * FROM dbo.Patients WHERE Id = @id", { id: req.params.id });
    res.json({ data: mapPatient(updated.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await query("SELECT Name FROM dbo.Patients WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy bệnh nhân" });
    }

    await query("DELETE FROM dbo.Patients WHERE Id = @id", { id: req.params.id });
    await query("INSERT INTO dbo.ActivityLog (Text) VALUES (@text)", {
      text: (req.user.Name || "User") + " xóa BN: " + existing.recordset[0].Name,
    });

    res.json({ ok: true, message: "Đã xóa bệnh nhân" });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
