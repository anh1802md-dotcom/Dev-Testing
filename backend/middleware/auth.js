const { query } = require("../db/connection");

const sessions = new Map();

function createToken(userId) {
  const token = "mc_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  sessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const raw = token.startsWith("Bearer ") ? token.slice(7) : token;
  return sessions.get(raw) || null;
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const session = getSession(header);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized", message: "Cần đăng nhập (Authorization: Bearer <token>)" });
  }

  const result = await query(
    "SELECT Id, Email, Name, Role, Department, Title FROM dbo.Users WHERE Id = @userId",
    { userId: session.userId }
  );

  if (!result.recordset.length) {
    return res.status(401).json({ error: "Unauthorized", message: "Phiên đăng nhập không hợp lệ" });
  }

  req.user = result.recordset[0];
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.Role)) {
      return res.status(403).json({ error: "Forbidden", message: "Không đủ quyền" });
    }
    next();
  };
}

module.exports = {
  createToken,
  getSession,
  requireAuth,
  requireRole,
};
