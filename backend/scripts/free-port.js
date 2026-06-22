/**
 * Giải phóng port trước khi npm start (Windows).
 * Tránh lỗi EADDRINUSE khi backend cũ còn chạy ngầm.
 */
const { execSync } = require("child_process");

const port = String(process.env.PORT || 5000);

function freePortWindows(targetPort) {
  try {
    const out = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid) && pid !== "0") pids.add(pid);
    }
    for (const pid of pids) {
      console.log(`Port ${targetPort} đang bận — tắt process cũ (PID ${pid})...`);
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
      } catch (_) {}
    }
    if (pids.size) {
      execSync("timeout /t 1 /nobreak >nul", { stdio: "ignore", shell: true });
    }
  } catch (_) {
    // Port trống
  }
}

freePortWindows(port);
