const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db/connection");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

const ROLES = ["user", "doctor", "admin"];

function mapUser(row) {
  return {
    id: row.Id,
    email: row.Email,
    name: row.Name,
    role: row.Role,
    department: row.Department,
    title: row.Title,
    createdAt: row.CreatedAt,
  };
}

function roleTitle(role) {
  if (role === "admin") return "Quản trị viên";
  if (role === "doctor") return "Bác sĩ";
  return "Bệnh nhân";
}

async function ensurePatientForUser(userId, name) {
  const existing = await query("SELECT Id FROM dbo.Patients WHERE UserId = @userId", { userId });
  if (existing.recordset.length) return existing.recordset[0].Id;
  const codeResult = await query("SELECT COUNT(*) AS cnt FROM dbo.Patients");
  const code = "BN" + String(codeResult.recordset[0].cnt + 1).padStart(3, "0");
  const patientId = "p_" + uuidv4().slice(0, 8);
  await query(`
    INSERT INTO dbo.Patients (Id, Code, Name, UserId, Status, Department)
    VALUES (@id, @code, @name, @userId, N'pending', N'Đa khoa')
  `, { id: patientId, code, name, userId });
  return patientId;
}

router.get("/", requireAuth, async (_req, res) => {
  try {
    const result = await query(
      "SELECT Id, Email, Name, Role, Department, Title, CreatedAt FROM dbo.Users ORDER BY Name"
    );
    res.json({ data: result.recordset.map(mapUser), total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const result = await query(
      "SELECT Id, Email, Name, Role, Department, Title, CreatedAt FROM dbo.Users WHERE Id = @id",
      { id: req.params.id }
    );
    if (!result.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy tài khoản" });
    }
    res.json({ data: mapUser(result.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.patch("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const body = req.body || {};
    const existing = await query("SELECT * FROM dbo.Users WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy tài khoản" });
    }

    const row = existing.recordset[0];
    let newRole = row.Role;
    if (body.role !== undefined) {
      const r = String(body.role).toLowerCase();
      if (!ROLES.includes(r)) {
        return res.status(400).json({ error: "BadRequest", message: "Role phải là user, doctor hoặc admin" });
      }
      newRole = r;
    }

    const newName = body.name ?? row.Name;
    const newDept = body.department !== undefined
      ? body.department
      : row.Department;
    const newTitle = body.title ?? roleTitle(newRole);

    await query(`
      UPDATE dbo.Users SET
        Name = @name,
        Role = @role,
        Department = @department,
        Title = @title
      WHERE Id = @id
    `, {
      id: req.params.id,
      name: newName,
      role: newRole,
      department: newRole === "user" ? null : (newDept || "Đa khoa"),
      title: newTitle,
    });

    if (newRole === "user") {
      await ensurePatientForUser(req.params.id, newName);
    }

    const updated = await query(
      "SELECT Id, Email, Name, Role, Department, Title, CreatedAt FROM dbo.Users WHERE Id = @id",
      { id: req.params.id }
    );
    res.json({ data: mapUser(updated.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    if (req.params.id === req.user.Id) {
      return res.status(400).json({ error: "BadRequest", message: "Không thể xóa tài khoản đang đăng nhập" });
    }

    const existing = await query("SELECT Id, Name, Role FROM dbo.Users WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy tài khoản" });
    }

    await query("DELETE FROM dbo.Users WHERE Id = @id", { id: req.params.id });
    res.json({ ok: true, message: "Đã xóa tài khoản" });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
