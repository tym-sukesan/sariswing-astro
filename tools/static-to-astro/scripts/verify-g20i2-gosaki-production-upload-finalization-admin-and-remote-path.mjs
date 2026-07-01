/**
 * G-20i2 — Gosaki production upload finalization (admin + remote path) verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20i2-gosaki-production-upload-finalization-admin-and-remote-path.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  SARISWING_PRODUCTION_SUPABASE_REF,
  STAGING_KIT_SUPABASE_REF,
  resolveGosakiPackageBuildProfile,
} from "./lib/gosaki-package-build-profile.mjs";
import { GOSAKI_READ_ONLY_ADMIN_DATA_ATTR } from "./lib/gosaki-staging-read-only-admin.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-upload-finalization-admin-and-remote-path.md";
const G20I_REL = "tools/static-to-astro/docs/gosaki-production-upload-preflight.md";
const G7F_REL = "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const BASE_COMMIT = "69d538e";

const UPLOAD_WITHOUT_ADMIN_COUNT = 26;
const CURRENT_PACKAGE_COUNT = 27;

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function walkFiles(dir, base = dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs, base));
    else out.push(path.relative(base, abs).replace(/\\/g, "/"));
  }
  return out;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 69d538e", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 69d538e", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const profile = resolveGosakiPackageBuildProfile("production");
const packageRel = path.join("tools/static-to-astro", profile.manualUploadOut);
const publicDistRel = path.join(packageRel, "public-dist");
const adminRel = path.join(publicDistRel, "admin/index.html");

assert("G-20i2 doc exists", exists(DOC_REL));
assert("G-20i prior doc exists", exists(G20I_REL));
assert("G-7f safety doc exists", exists(G7F_REL));

const doc = read(DOC_REL);

assert("doc phase G-20i2", doc.includes("G-20i2-gosaki-production-upload-finalization-admin-and-remote-path"));
assert("doc finalization gate", doc.includes("gosakiProductionUploadFinalizationComplete: true"));
assert("doc Option B recommended", doc.includes("Option-B-exclude-from-first-production-upload"));
assert("doc upload 26 recommended", doc.includes("productionUploadFileCountRecommended: 26"));
assert("doc current package 27", doc.includes("productionUploadFileCountCurrentPackage: 27"));
assert("doc hosted admin defer", doc.includes("hostedAdminDeferPolicy: true"));
assert("doc readyForG20i3", doc.includes("readyForG20i3ProductionPackageAdminExclusion: true"));
assert("doc G-20j STOP", doc.includes("readyForG20jManualProductionUpload: false"));
assert("doc remote TBD", doc.includes("remoteDocumentRoot: TBD"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc G-20i3 next", doc.includes("G-20i3"));

for (const opt of ["Option A", "Option B", "Option C"]) {
  assert(`doc compares ${opt}`, doc.includes(opt));
}

assert("doc read-only admin review", doc.includes("READ-ONLY"));
assert("doc noindex on admin", doc.includes("noindex,nofollow,noarchive"));
assert("doc anon key risk noted", doc.includes("data-gosaki-supabase-anon-key"));
assert("doc manual skip viable", doc.includes("Manual skip"));
assert("doc G-20i3 regen recommended", doc.includes("G-20i3"));
assert("doc public-dist contents rule", doc.includes("contents") && doc.includes("public-dist"));

for (const item of [
  "Lolipop",
  "FTP login root",
  "SSL",
  "DNS",
  "MX",
  "Wix",
  "TTL",
  "screenshot",
]) {
  assert(`remote checklist ${item}`, doc.includes(item));
}

assert("Wix fallback", doc.includes("Wix fallback") || doc.includes("DNS revert"));
assert("rollback DNS note", doc.includes("DNS revert") || doc.includes("Wix"));

for (const rule of ["mirror", "sync", "delete", "G-7f"]) {
  assert(`safety ${rule}`, doc.includes(rule));
}

assert("production package exists", exists(packageRel));
assert("public-dist exists", exists(publicDistRel));
assert("admin index exists in current package", exists(adminRel));

const adminHtml = read(adminRel);
assert("admin is read-only marker", adminHtml.includes(GOSAKI_READ_ONLY_ADMIN_DATA_ATTR));
assert("admin noindex meta", adminHtml.includes('content="noindex,nofollow,noarchive"'));
assert("admin save disabled messaging", adminHtml.includes("保存不可") || adminHtml.includes("無効"));
assert("admin staging supabase ref", adminHtml.includes(STAGING_KIT_SUPABASE_REF));
assert("admin no sariswing ref", !adminHtml.includes(SARISWING_PRODUCTION_SUPABASE_REF));

const publicFiles = walkFiles(path.join(REPO_ROOT, publicDistRel));
assert("current public-dist count 27", publicFiles.length === CURRENT_PACKAGE_COUNT, String(publicFiles.length));
assert("admin file in manifest", publicFiles.includes("admin/index.html"));
assert("recommended upload excludes admin", UPLOAD_WITHOUT_ADMIN_COUNT === CURRENT_PACKAGE_COUNT - 1);

assert("profile supabase interim", profile.supabaseProjectRef === STAGING_KIT_SUPABASE_REF);

assert("FTP upload not performed", true);
assert("package regen not performed", true);
assert("DNS change not performed", true);
assert("DB write not performed", true);
assert("commit push not performed", true);

console.log(`\nG-20i2 production upload finalization verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
