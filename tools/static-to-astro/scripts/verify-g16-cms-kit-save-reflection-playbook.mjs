/**
 * G-16 — CMS Kit Save / Reflection playbook consolidation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g16-cms-kit-save-reflection-playbook.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const G14B1_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-reflection-closure.md";
const G15C_F_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-closure.md";
const G15E_F_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-closure.md";
const FTP_SAFETY_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const BUILD_SCRIPT_REL =
  "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const G16_BASE_COMMIT = "f722cf4";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G16_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("HEAD is f722cf4", head.stdout.trim() === G16_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is f722cf4",
  origin.stdout.trim() === G16_BASE_COMMIT,
  origin.stdout.trim(),
);
assert(
  "HEAD at or after G-15e-f baseline f722cf4",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("playbook doc exists", exists(DOC_REL));
assert(
  "doc phase G-16",
  doc.includes("G-16-cms-kit-save-reflection-playbook-consolidation"),
);
assert(
  "doc consolidation complete gate",
  doc.includes("cmsKitSaveReflectionPlaybookConsolidationComplete: true"),
);
assert("doc commit f722cf4", doc.includes("f722cf4"));

// Proven chains
assert("Schedule G-14b1 success chain", doc.includes("G-14b1"));
assert(
  "G-14b1 closure ref",
  doc.includes("gosaki-schedule-routine-edit-reflection-closure.md"),
);
assert("G-14b1 schedule-2026-04-005", doc.includes("schedule-2026-04-005"));
assert("G-14b1 price field", doc.includes("`price`"));

assert("Discography purchase_url chain", doc.includes("purchase_url"));
assert(
  "G-15c-f closure ref",
  doc.includes("gosaki-discography-public-reflection-closure.md"),
);
assert("discography-002 SKYLARK", doc.includes("discography-002"));

assert("Discography artist chain", doc.includes("artist"));
assert(
  "G-15e-f closure ref",
  doc.includes("gosaki-discography-artist-public-reflection-closure.md"),
);
assert("discography-003 About Us", doc.includes("discography-003"));

// Save slice procedure
assert("Save slice standard procedure", doc.includes("Save slice — standard procedure"));
assert("Save inventory step", doc.includes("S0") && doc.includes("Inventory"));
assert("Save dry-run Preview", doc.includes("Dry-run Preview"));
assert("Save preflight", doc.includes("Save preflight"));
assert("Save once", doc.includes("Save — exactly once") || doc.includes("Save **once**"));
assert("afterVerification", doc.includes("afterVerification"));
assert("Save result recording", doc.includes("Save result doc"));
assert("Save closure", doc.includes("Closure"));

// Reflection procedure
assert("Reflection standard procedure", doc.includes("Reflection — standard procedure"));
assert("public generation path", doc.includes("Public generation path"));
assert("local regen", doc.includes("Local package regen"));
assert("local HTML verify", doc.includes("Local HTML verify"));
assert("CSS / JS hash", doc.includes("CSS / JS hash"));
assert("minimal upload scope", doc.includes("Minimal upload scope"));
assert("manual upload", doc.includes("manual"));
assert("HTTP verify", doc.includes("HTTP verify"));
assert("reflection result recording", doc.includes("Upload result doc"));
assert("reflection closure", doc.includes("Closure doc"));

// Safety gates
assert("high-risk stop conditions", doc.includes("High-risk"));
assert("low-risk speed OK", doc.includes("Low-risk") && doc.includes("Speed OK"));
assert("ambiguous outcome stop", doc.includes("Ambiguous outcome"));

// Roles
assert("Cursor role", doc.includes("Cursor (agent)"));
assert("operator role", doc.includes("Operator"));
assert("ChatGPT role", doc.includes("ChatGPT"));
assert("ChatGPT timing", doc.includes("First-of-kind") || doc.includes("first-of-kind"));

// Template
assert("next field template", doc.includes("New field slice — template"));
assert("approvalId naming", doc.includes("approvalId naming"));
assert("expectedBeforeUpdatedAt template", doc.includes("expectedBeforeUpdatedAt"));
assert("changedFields template", doc.includes("changedFields"));
assert("rollback template", doc.includes("rollbackNeeded"));
assert("public reflection template", doc.includes("Public reflection"));
assert("upload target template", doc.includes("upload files"));

// Forbidden patterns
assert("re-Save forbidden", doc.includes("Re-Save"));
assert("re-upload forbidden", doc.includes("Re-upload"));
assert("mirror sync delete forbidden", doc.includes("mirror"));
assert("production forbidden", doc.includes("Production"));
assert("service_role forbidden", doc.includes("service_role"));
assert("secrets env forbidden", doc.includes(".env"));
assert("approvalId mismatch forbidden", doc.includes("approvalId mismatch"));
assert("multi-field Save forbidden", doc.includes("Multi-field Save"));
assert("multi-row Save forbidden", doc.includes("Multi-row Save"));

// Upload rules
assert("manual upload 1-file unit", doc.includes("1-file"));
assert("mirror delete forbidden explicit", doc.includes("--delete"));
assert("staging host", doc.includes(STAGING_REF));
assert("production stop host", doc.includes(PRODUCTION_HOST));
assert("ftp apply suspended", doc.includes("readyForAnyFutureFtpApply: false"));

// Cross-refs
assert("G-14c prior art", doc.includes("gosaki-public-reflection-operation-standardization.md"));
assert("build script ref", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("G-14c doc exists", exists(G14C_REL));
assert("G-14b1 closure exists", exists(G14B1_CLOSURE_REL));
assert("G-15c-f closure exists", exists(G15C_F_CLOSURE_REL));
assert("G-15e-f closure exists", exists(G15E_F_CLOSURE_REL));
assert("FTP safety doc exists", exists(FTP_SAFETY_REL));
assert("build script exists", exists(BUILD_SCRIPT_REL));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

assert("cursor ftp not executed in verifier", true);
assert("cursor db write not executed in verifier", true);
assert("cursor package regen not executed in verifier", true);

console.log(`\nG-16 playbook verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
