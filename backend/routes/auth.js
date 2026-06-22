const express = require("express");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { sql, query } = require("../db/connection");
const { createToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

const ROLES = ["user", "doctor", "admin"];

function normalizeRole(role) {
  const r = String(role || "user").toLowerCase();
  if (r === "doctor") return "doctor";
  if (r === "admin") return "user";
  return "user";
}

function roleTitle(role) {
  if (role === "admin") return "Quản trị viên";
  if (role === "doctor") return "Bác sĩ";
  return "Bệnh nhân";
}

async function createPatientForUser(userId, name) {
  const codeResult = await query("SELECT COUNT(*) AS cnt FROM dbo.Patients");
  const code = "BN" + String(codeResult.recordset[0].cnt + 1).padStart(3, "0");
  const patientId = "p_" + uuidv4().slice(0, 8);
  await query(`
    INSERT INTO dbo.Patients (Id, Code, Name, UserId, Status, Department)
    VALUES (@id, @code, @name, @userId, N'pending', N'Đa khoa')
  `, { id: patientId, code, name, userId });
  return patientId;
}

function publicUser(row) {
  return {
    id: row.Id,
    email: row.Email,
    name: row.Name,
    role: row.Role,
    department: row.Department,
    title: row.Title,
  };
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "BadRequest", message: "Thiếu email hoặc password" });
    }

    const result = await query(
      "SELECT * FROM dbo.Users WHERE Email = @email",
      { email: String(email).trim().toLowerCase() }
    );

    const user = result.recordset[0];
    if (!user) {
      return res.status(401).json({ error: "Unauthorized", message: "Email hoặc mật khẩu không đúng" });
    }

    const ok = await bcrypt.compare(password, user.PasswordHash);
    if (!ok) {
      return res.status(401).json({ error: "Unauthorized", message: "Email hoặc mật khẩu không đúng" });
    }

    const token = createToken(user.Id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role, department, title, phone } = req.body || {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "BadRequest", message: "Thiếu email, password hoặc name" });
    }

    const exists = await query(
      "SELECT Id FROM dbo.Users WHERE Email = @email",
      { email: String(email).trim().toLowerCase() }
    );
    if (exists.recordset.length) {
      return res.status(409).json({ error: "Conflict", message: "Email đã tồn tại" });
    }

    const userRole = normalizeRole(role);
    const id = "u_" + uuidv4().slice(0, 8);
    const hash = await bcrypt.hash(password, 10);

    await query(`
      INSERT INTO dbo.Users (Id, Email, PasswordHash, Name, Role, Department, Title)
      VALUES (@id, @email, @hash, @name, @role, @department, @title)
    `, {
      id,
      email: String(email).trim().toLowerCase(),
      hash,
      name,
      role: userRole,
      department: userRole === "user" ? null : (department || "Đa khoa"),
      title: title || roleTitle(userRole),
    });

    if (userRole === "user") {
      await createPatientForUser(id, name);
      if (phone) {
        const p = await query("SELECT Id FROM dbo.Patients WHERE UserId = @userId", { userId: id });
        if (p.recordset[0]) {
          await query("UPDATE dbo.Patients SET Phone = @phone WHERE Id = @id", {
            phone,
            id: p.recordset[0].Id,
          });
        }
      }
    }

    const token = createToken(id);
    res.status(201).json({
      token,
      user: {
        id,
        email: String(email).trim().toLowerCase(),
        name,
        role: userRole,
        department: userRole === "user" ? null : (department || "Đa khoa"),
        title: title || roleTitle(userRole),
      },
    });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

module.exports = router;
