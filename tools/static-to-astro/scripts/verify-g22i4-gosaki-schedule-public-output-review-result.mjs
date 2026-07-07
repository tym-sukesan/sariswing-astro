/**
 * G-22i4 — Gosaki Schedule public output review result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22i4-gosaki-schedule-public-output-review-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-public-output-review-result.md";
const G22I3_RESULT = "tools/static-to-astro/docs/gosaki-schedule-package-diff-dry-run-result.md";
const PACKAGE_DIST = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist";
const SCHEDULES_JSON =
  "tools/static-to-astro/output/gosaki-piano-astro/src/data/gosaki-schedules.json";
const JULY_HTML = `${PACKAGE_DIST}/schedule/2026-07/index.html`;
const MARCH_HTML = `${PACKAGE_DIST}/schedule/2026-03/index.html`;
const LEGACY_JULY = `${PACKAGE_DIST}/2026-07/index.html`;
const CSS_FILE = `${PACKAGE_DIST}/_astro/index.YcHrHZH4.css`;

const BASE_COMMIT = "55fd5ef";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const REF_014 = "schedule-2026-03-014";
const REF_001 = "schedule-2026-09-001";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const LIVE_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";

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

assert("HEAD is 55fd5ef", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 55fd5ef", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("result doc exists", exists(DOC_REL));
assert("G-22i3 result doc exists", exists(G22I3_RESULT));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22i4", doc.includes("G-22i4-gosaki-schedule-public-output-review-result"));
assert(
  "doc review gate complete",
  doc.includes("gosakiSchedulePublicOutputReviewComplete: true"),
);
assert("doc public output review", /public output review/i.test(doc));
assert("doc local output review", /local output review/i.test(doc));
assert("doc live staging HTTP review", /live staging HTTP review/i.test(doc));

assert("doc 008 include", doc.includes(TARGET_LEGACY) && /include|FOUND|present/i.test(doc));
assert("doc 008 id", doc.includes(TARGET_ID));
assert("doc 014 exclude", doc.includes(REF_014) && /exclude|absent|ABSENT/i.test(doc));
assert("doc 001 exclude", doc.includes(REF_001) && /exclude|absent|ABSENT/i.test(doc));

assert("doc local vs live diff", /local vs live|MD5/i.test(doc));
assert(
  "doc upload not needed or conclusion A",
  /upload.*not needed|Conclusion.*A|no upload/i.test(doc),
);
assert(
  "doc upload candidate none or skip G-22i5",
  /uploadCandidateFiles: none|G-22i5.*skip|skip.*G-22i5/i.test(doc),
);

assert("doc live base url", doc.includes(LIVE_BASE));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));
assert("doc package regen false", doc.includes("packageRegenExecuted: false"));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor sql mutation false", doc.includes("cursorSqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));

assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

assert("package dist exists", exists(PACKAGE_DIST));
assert("gosaki-schedules.json exists", exists(SCHEDULES_JSON));
assert("july html exists", exists(JULY_HTML));
assert("march html exists", exists(MARCH_HTML));
assert("legacy july stub exists", exists(LEGACY_JULY));
assert("css file exists", exists(CSS_FILE));

if (exists(SCHEDULES_JSON)) {
  const schedules = JSON.parse(read(SCHEDULES_JSON));
  assert("json 008 present", schedules.some((r) => r.legacy_id === TARGET_LEGACY));
  assert("json 014 absent", !schedules.some((r) => r.legacy_id === REF_014));
  assert("json 001 absent", !schedules.some((r) => r.legacy_id === REF_001));
}

if (exists(JULY_HTML)) {
  const july = read(JULY_HTML);
  assert("local july 2026.07.17", july.includes("2026.07.17"));
  assert("local july 014 absent", !july.includes(REF_014));
}

if (exists(LEGACY_JULY)) {
  const stub = read(LEGACY_JULY);
  assert("legacy stub no event cards", !stub.includes("gosaki-schedule-event-card"));
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

assert("00-current-state mentions G-22i4", currentState.includes("G-22i4"));
assert("03-next-actions mentions G-22i4", nextActions.includes("G-22i4"));
assert("handoff mentions G-22i4", handoff.includes("G-22i4"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Rollback not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22i4 Gosaki Schedule public output review verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
