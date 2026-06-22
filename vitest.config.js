const path = require("path");

/** @type {import('vitest/config').UserConfig} */
module.exports = {
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.js"],
    setupFiles: [path.join(__dirname, "tests/setup.js")],
    clearMocks: true,
  },
};
