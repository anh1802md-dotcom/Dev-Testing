const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { query } = require("../db/connection");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

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

router.get("/", requireAuth, async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    let sqlText = "SELECT * FROM dbo.Notifications";
    if (unreadOnly === "true") {
      sqlText += " WHERE IsRead = 0";
    }
    sqlText += " ORDER BY At DESC";

    const result = await query(sqlText);
    res.json({ data: result.recordset.map(mapNotif), total: result.recordset.length });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.title || !body.message) {
      return res.status(400).json({ error: "BadRequest", message: "Thiếu title hoặc message" });
    }

    const id = "n_" + uuidv4().slice(0, 8);

    await query(`
      INSERT INTO dbo.Notifications (Id, Title, Message, Type, Icon, IsRead)
      VALUES (@id, @title, @message, @type, @icon, 0)
    `, {
      id,
      title: body.title,
      message: body.message,
      type: body.type || "info",
      icon: body.icon || "info",
    });

    const created = await query("SELECT * FROM dbo.Notifications WHERE Id = @id", { id });
    res.status(201).json({ data: mapNotif(created.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  try {
    const result = await query(
      "UPDATE dbo.Notifications SET IsRead = 1 OUTPUT INSERTED.* WHERE Id = @id",
      { id: req.params.id }
    );
    if (!result.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy thông báo" });
    }
    res.json({ data: mapNotif(result.recordset[0]) });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const existing = await query("SELECT Id FROM dbo.Notifications WHERE Id = @id", { id: req.params.id });
    if (!existing.recordset.length) {
      return res.status(404).json({ error: "NotFound", message: "Không tìm thấy thông báo" });
    }
    await query("DELETE FROM dbo.Notifications WHERE Id = @id", { id: req.params.id });
    res.json({ ok: true, message: "Đã xóa thông báo" });
  } catch (err) {
    res.status(500).json({ error: "ServerError", message: err.message });
  }
});

module.exports = router;
