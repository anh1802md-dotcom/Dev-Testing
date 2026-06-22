// @ts-check
const { defineConfig, devices } = require("@playwright/test");

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;
const isCI = !!process.env.CI;

// Local: Chrome đã cài (tránh tải Chromium). CI: Playwright Chromium bundled.
const browserUse = isCI
  ? devices["Desktop Chrome"]
  : { channel: "chrome", ...devices["Desktop Chrome"] };

module.exports = defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...browserUse,
  },
  webServer: {
    command: "npm start",
    url: BASE_URL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
