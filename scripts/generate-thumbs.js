#!/usr/bin/env node
// Generates resized JPEG thumbnails (max 900px on the long edge) for every photo
// under images/, mirrored into images/thumbs/<category>/<file>.jpg via macOS `sips`.
// Re-run any time new photos are added — existing thumbs are skipped.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "media", "images");
const THUMBS_DIR = path.join(IMAGES_DIR, "thumbs");
const MAX_SIZE = 900;
const QUALITY = 65;
const EXT_RE = /\.(jpe?g|png)$/i;

function isCategoryDir(name) {
  return name !== "thumbs" && !name.startsWith(".");
}

const categories = fs
  .readdirSync(IMAGES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && isCategoryDir(d.name))
  .map((d) => d.name);

let created = 0;
let skipped = 0;

for (const category of categories) {
  const srcDir = path.join(IMAGES_DIR, category);
  const destDir = path.join(THUMBS_DIR, category);
  fs.mkdirSync(destDir, { recursive: true });

  const files = fs
    .readdirSync(srcDir, { withFileTypes: true })
    .filter((f) => f.isFile() && EXT_RE.test(f.name));

  for (const file of files) {
    const srcPath = path.join(srcDir, file.name);
    const destName = file.name.replace(EXT_RE, ".jpg");
    const destPath = path.join(destDir, destName);

    if (fs.existsSync(destPath)) {
      skipped++;
      continue;
    }

    execFileSync("sips", [
      "-Z",
      String(MAX_SIZE),
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      String(QUALITY),
      srcPath,
      "--out",
      destPath,
    ]);
    created++;
    process.stdout.write(`\r${created} thumbnails created...`);
  }
}

console.log(`\nDone. Created ${created} thumbnails, skipped ${skipped} existing.`);
