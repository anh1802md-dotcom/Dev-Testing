/**
 * Kiểm tra mọi test E2E có tiền tố COD1-XXX trong tên.
 * Chạy: node tools/validate-cod1-tests.js
 */
const fs = require("fs");
const path = require("path");

const E2E_DIR = path.join(__dirname, "..", "e2e");
const COD1_PREFIX = /COD1-\d+/;

const files = fs.readdirSync(E2E_DIR).filter((f) => f.endsWith(".spec.js"));
let errors = 0;
let total = 0;

for (const file of files) {
  const content = fs.readFileSync(path.join(E2E_DIR, file), "utf8");
  const matches = [...content.matchAll(/^\s*test\(\s*["'`]([^"'`]+)["'`]/gm)];

  for (const [, title] of matches) {
    total++;
    if (!COD1_PREFIX.test(title)) {
      console.error(`[FAIL] ${file}: "${title}" — thiếu tiền tố COD1-XXX`);
      errors++;
    }
  }
}

if (errors === 0) {
  console.log(`OK — ${total} test E2E đều có mã COD1 trong tên.`);
  process.exit(0);
}

console.error(`\n${errors}/${total} test thiếu mã COD1.`);
process.exit(1);
