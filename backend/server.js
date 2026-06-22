require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { getPool, closePool, config } = require("./db/connection");

const authRoutes = require("./routes/auth");
const patientRoutes = require("./routes/patients");
const prescriptionRoutes = require("./routes/prescriptions");
const medicalRecordRoutes = require("./routes/medicalRecords");
const notificationRoutes = require("./routes/notifications");
const portalRoutes = require("./routes/portal");
const userRoutes = require("./routes/users");
const syncRoutes = require("./routes/sync");
const reminderRoutes = require("./routes/reminders");
const historyRoutes = require("./routes/history");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "MedCare API",
    version: "1.0.0",
    docs: "/api/health",
    postman: "postman/MedCare-API.postman_collection.json",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.request().query("SELECT 1 AS ok");
    res.json({
      status: "ok",
      database: config.database,
      server: config.server,
      time: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      message: err.message,
      hint: "Kiểm tra SQL Server (LAPTOP-BD1H54CO\\SQLEXPRESS) và chạy npm run db:init",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/medical-records", medicalRecordRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/sync", syncRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/history", historyRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "NotFound", message: "Endpoint không tồn tại" });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "ServerError", message: err.message });
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function shutdown() {
  console.log("\nĐang dừng backend...");
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  await closePool();
  process.exit(0);
}

// Giữ Node.js chạy liên tục (chỉ dừng bằng Ctrl+C) — kể cả terminal VS Code đóng stdin
let keepAliveTimer = setInterval(() => {}, 60 * 60 * 1000);
if (process.stdin.isTTY) {
  process.stdin.resume();
}

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

async function start() {
  try {
    await getPool();
    console.log("SQL Server:", config.server, "→", config.database);
  } catch (err) {
    console.warn("Warning: chưa kết nối DB —", err.message);
    console.warn("Chạy: cd backend && npm run db:init");
  }

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log("MedCare API: http://localhost:" + PORT);
    console.log("Health:     http://localhost:" + PORT + "/api/health");
    console.log("");
    console.log("✓ Backend đang chạy — nhấn Ctrl+C để dừng");
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error("");
      console.error("✗ Port " + PORT + " vẫn đang bận sau khi giải phóng.");
      console.error("  Thử: taskkill /F /IM node.exe  rồi chạy lại npm start");
    } else {
      console.error("✗ Không khởi động được server:", err.message);
    }
    process.exit(1);
  });

  return server;
}

start().catch((err) => {
  console.error("✗ Lỗi khởi động:", err.message);
  process.exit(1);
});
