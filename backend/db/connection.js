const sql = require("mssql");
require("dotenv").config();

const useWindowsAuth = String(process.env.DB_USE_WINDOWS_AUTH || "false").toLowerCase() === "true";
const rawServer = process.env.DB_SERVER || "localhost";
const rawPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433;

function parseServer(value) {
  const trimmed = String(value).trim();
  const slash = trimmed.indexOf("\\");
  if (slash === -1) return { server: trimmed, options: {} };
  return {
    server: trimmed.slice(0, slash),
    options: { instanceName: trimmed.slice(slash + 1) },
  };
}

const parsed = parseServer(rawServer);
const usePort = Number.isFinite(rawPort) && rawPort > 0;

const config = {
  server: parsed.server,
  database: process.env.DB_NAME || "MedCareDB",
  options: {
    encrypt: false,
    trustServerCertificate: String(process.env.DB_TRUST_CERT || "true").toLowerCase() === "true",
    enableArithAbort: true,
    ...(usePort ? { port: rawPort } : parsed.options),
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (useWindowsAuth) {
  config.options.trustedConnection = true;
} else {
  config.user = process.env.DB_USERNAME || "sa";
  config.password = process.env.DB_PASSWORD || "123456";
}

let pool = null;

async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

async function query(text, params = {}) {
  const p = await getPool();
  const request = p.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }
  return request.query(text);
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

module.exports = {
  sql,
  config,
  getPool,
  query,
  closePool,
};
