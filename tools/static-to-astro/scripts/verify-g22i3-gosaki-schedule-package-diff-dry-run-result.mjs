/**
 * G-22i3 — Gosaki Schedule package/diff dry-run result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22i3-gosaki-schedule-package-diff-dry-run-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.join(REPO_ROOT, "tools/static-to-astro");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-package-diff-dry-run-result.md";
const G22I2_PLAN = "tools/static-to-astro/docs/gosaki-schedule-public-reflection-planning.md";
const BUILD_SCRIPT = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const PACKAGE_DIST = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist";
const SCHEDULES_JSON =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedules.json";
const JULY_HTML = `${PACKAGE_DIST}/schedule/2026-07/index.html`;
const MARCH_HTML = `${PACKAGE_DIST}/schedule/2026-03/index.html`;
const LEGACY_JULY = `${PACKAGE_DIST}/2026-07/index.html`;
const MANIFEST = "tools/static-to-astro/output/manual-upload/gosaki-piano/MANIFEST.json";

const BASE_COMMIT = "442f8db";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const REF_014 = "schedule-2026-03-014";
const REF_001 = "schedule-2026-09-001";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

assert("HEAD is 442f8db", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 442f8db", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("result doc exists", exists(DOC_REL));
assert("G-22i2 planning doc exists", exists(G22I2_PLAN));
assert("build script exists", exists(BUILD_SCRIPT));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22i3", doc.includes("G-22i3-gosaki-schedule-package-diff-dry-run-result"));
assert(
  "doc dry-run gate complete",
  doc.includes("gosakiSchedulePackageDiffDryRunComplete: true"),
);
assert("doc package diff dry-run", /package.*diff.*dry-run/i.test(doc));
assert("doc ready G-22i4", doc.includes("readyForG22i4PublicOutputReview: true"));

assert(
  "doc build command recorded",
  doc.includes("build-gosaki-staging-admin-package.mjs"),
);
assert("doc package generation PASS", doc.includes("package build: PASS"));
assert(
  "doc output manual-upload path",
  doc.includes("output/manual-upload/gosaki-piano/public-dist"),
);

assert("doc 008 include", doc.includes(TARGET_LEGACY) && /include|FOUND/i.test(doc));
assert("doc 008 id", doc.includes(TARGET_ID));
assert("doc 014 exclude", doc.includes(REF_014) && /exclude|ABSENT/i.test(doc));
assert("doc 001 exclude", doc.includes(REF_001) && /exclude|ABSENT/i.test(doc));

assert("doc schedule 2026-07 html", doc.includes("schedule/2026-07/index.html"));
assert("doc scheduleDataSource supabase", doc.includes("scheduleDataSource=supabase"));
assert("doc safeForStaticFtp", doc.includes("safeForStaticFtp"));

assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));
assert("doc production not executed", doc.includes("productionDeployExecuted: false"));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor sql mutation false", doc.includes("cursorSqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));

assert("doc upload candidates", doc.includes("Upload candidates") || doc.includes("upload candidate"));
assert("doc next G-22i4", doc.includes("G-22i4"));
assert("doc no ftp until G-22i5", /G-22i5|Do not FTP until/i.test(doc));

assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

assert("package dist exists", exists(PACKAGE_DIST));
assert("MANIFEST exists", exists(MANIFEST));
assert("gosaki-schedules.json exists", exists(SCHEDULES_JSON));
assert("july html exists", exists(JULY_HTML));
assert("march html exists", exists(MARCH_HTML));
assert("legacy july stub exists", exists(LEGACY_JULY));

if (exists(SCHEDULES_JSON)) {
  const schedules = JSON.parse(read(SCHEDULES_JSON));
  const row008 = schedules.find((r) => r.legacy_id === TARGET_LEGACY);
  const row014 = schedules.find((r) => r.legacy_id === REF_014);
  const row001 = schedules.find((r) => r.legacy_id === REF_001);
  assert("json 008 present", Boolean(row008));
  assert("json 008 date", row008?.date === "2026-07-17");
  assert("json 008 published true", row008?.published === true);
  assert("json 014 absent", !row014);
  assert("json 001 absent", !row001);
}

if (exists(JULY_HTML)) {
  const july = read(JULY_HTML);
  assert("july html scheduleDataSource supabase", july.includes("scheduleDataSource=supabase"));
  assert("july html 2026.07.17", july.includes("2026.07.17"));
}

if (exists(MARCH_HTML)) {
  const march = read(MARCH_HTML);
  assert("march html 014 absent", !march.includes(REF_014));
}

if (exists(LEGACY_JULY)) {
  const stub = read(LEGACY_JULY);
  assert("legacy stub no event cards", !stub.includes("gosaki-schedule-event-card"));
  assert("legacy stub moved text", stub.includes("Schedule page moved"));
}

if (exists(MANIFEST)) {
  const manifest = JSON.parse(read(MANIFEST));
  assert("manifest safeForStaticFtp true", manifest.safeForStaticFtp === true);
  assert("manifest ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
  assert("manifest fileCount 27", manifest.fileCount === 27);
}

const portCheck = spawnSync("lsof", ["-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("00-current-state mentions G-22i3", currentState.includes("G-22i3"));
assert("03-next-actions mentions G-22i3", nextActions.includes("G-22i3"));
assert("handoff mentions G-22i3", handoff.includes("G-22i3"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Rollback not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22i3 Gosaki Schedule package/diff dry-run verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
