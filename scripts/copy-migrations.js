const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "src", "db", "migrations");
const dest = path.join(__dirname, "..", "dist", "db", "migrations");

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Copied migrations to ${dest}`);
} else {
  console.warn(`No migrations folder found at ${src}; skipping copy.`);
}
