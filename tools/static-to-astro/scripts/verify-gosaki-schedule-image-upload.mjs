#!/usr/bin/env node
/**
 * Gosaki Schedule image file upload — offline checks.
 * No Storage write, no DB write, no Edge deploy, no production build, no FTP.
 *
 * Run: node scripts/verify-gosaki-schedule-image-upload.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

let passed = 0;
let failed = 0;
function assert(name, cond) {
  if (cond) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function readRel(rel) {
  return fs.readFileSync(path.join(TOOL_ROOT, rel), "utf8");
}

const upload = readRel("templates/site-extensions/gosaki-piano/gosaki-schedule-image-upload.ts");
const opEdit = readRel("templates/site-extensions/gosaki-piano/gosaki-staging-schedule-operational-edit.ts");
const adminAstro = readRel(
  "templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleContentPanel.astro",
);
const applySrc = readRel("scripts/lib/gosaki-staging-read-only-admin.mjs");

assert("bucket is site-assets", upload.includes('GOSAKI_SCHEDULE_IMAGE_BUCKET = "site-assets"'));
assert("path prefix gosaki-piano/schedule/", upload.includes('GOSAKI_SCHEDULE_IMAGE_PATH_PREFIX = "gosaki-piano/schedule/"'));
assert("unique filename uses randomUUID", upload.includes("crypto.randomUUID()") && upload.includes("slice(0, 16)"));
assert("upsert false", upload.includes('"x-upsert": "false"'));
assert("does not target images bucket", !upload.includes("/object/images/") && !upload.includes('BUCKET = "images"'));
assert("no service_role", !upload.includes("service_role") && !opEdit.includes("service_role"));
assert("JPEG/PNG/WebP only", upload.includes("image/jpeg") && upload.includes("image/png") && upload.includes("image/webp"));
assert("GIF/AVIF not accepted in UI module", !upload.includes("image/gif") && !upload.includes("image/avif"));
assert("max 2MB", upload.includes("IMAGE_UPLOAD_MAX_BYTES = 2 * 1024 * 1024"));
assert("max long edge 1600", upload.includes("IMAGE_MAX_LONG_EDGE = 1600"));
assert("processImageForUpload reused", upload.includes("export async function processImageForUpload"));
assert("empty legacy_id folder is new", upload.includes('return "new"'));
assert("production project stop", upload.includes("vsbvndwuajjhnzpohghh"));
assert("Authorization Bearer JWT", upload.includes("Authorization: `Bearer ${accessToken}`"));
assert("anon write not used", !upload.includes("to anon") && !upload.includes("images_anon"));

assert("admin has file input", adminAstro.includes('type="file"') && adminAstro.includes("data-gosaki-schedule-image-file"));
assert("admin has upload button", adminAstro.includes("data-gosaki-schedule-image-upload") && adminAstro.includes("アップロード"));
assert("admin keeps image_url field", adminAstro.includes('data-field="image_url"') && adminAstro.includes("画像URL"));
assert("admin keeps preview", adminAstro.includes("data-gosaki-schedule-image-preview"));
assert("accept jpeg/png/webp", adminAstro.includes("image/jpeg,image/png,image/webp"));
assert("no home_image_url field", !adminAstro.includes('data-field="home_image_url"'));

assert("op edit imports upload helper", opEdit.includes('from "./gosaki-schedule-image-upload"'));
assert("file select does not call upload helper", /image-file[\s\S]{0,400}setImageUploadStatus/.test(opEdit));
assert("upload button calls uploadGosakiScheduleImage", opEdit.includes("uploadGosakiScheduleImage"));
assert("success writes image_url only", opEdit.includes("writeForm(root, { image_url: publicUrl })"));
assert("does not auto Save after upload", !/uploadGosakiScheduleImage[\s\S]{0,800}runSave/.test(opEdit));
assert("Save payload still includes image_url", opEdit.includes("image_url: after.image_url"));
assert("apply copies upload module", applySrc.includes("gosaki-schedule-image-upload.ts"));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
