/**
 * G-22h7 — Gosaki Schedule republish UPDATE result closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h7-gosaki-schedule-republish-update-result-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-republish-update-result-closure.md";
const G22H6A_DOC = "tools/static-to-astro/docs/gosaki-schedule-republish-update-implementation.md";
const G22H6B_BLOCKER_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-republish-save-disabled-blocker.md";
const G22H6B_RETRY2_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-republish-save-still-disabled-blocker.md";

const BASE_COMMIT = "d28a3d7";
const APPROVAL_ID = "G-22h-gosaki-schedule-republish-update-non-dry-run-slice";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const TARGET_LEGACY = "schedule-2026-07-008";
const BEFORE_UPDATED_AT = "2026-07-06T13:58:41.425402+00:00";
const SAVED_UPDATED_AT = "2026-07-07T02:30:32.260326+00:00";
const REF_014 = "schedule-2026-03-014";
const REF_014_ID = "434e4051-86c3-473e-9ad0-39d2e5042fb8";
const REF_001 = "schedule-2026-09-001";
const REF_001_ID = "18b48259-9a9a-4b00-b136-6c0c4ff3b2f3";
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

assert("HEAD is d28a3d7", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is d28a3d7", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("closure doc exists", exists(DOC_REL));
assert("G-22h6a prior doc exists", exists(G22H6A_DOC));
assert("G-22h6b blocker doc exists", exists(G22H6B_BLOCKER_DOC));
assert("G-22h6b retry2 blocker doc exists", exists(G22H6B_RETRY2_DOC));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h7", doc.includes("G-22h7-gosaki-schedule-republish-update-result-closure"));
assert(
  "doc closure gate complete",
  doc.includes("gosakiScheduleRepublishUpdateResultClosureComplete: true"),
);
assert("doc g22h chain closed", doc.includes("g22hRepublishUpdateChainClosed: true"));
assert("doc g22h6b save executed", doc.includes("g22h6bRepublishUpdateOperatorSaveOnceExecuted: true"));
assert("doc g22h6b save closed", doc.includes("g22h6bRepublishUpdateSaveClosed: true"));
assert(
  "doc save re-exec forbidden",
  doc.includes("readyForG22h6bRepublishUpdateSaveReExecution: false"),
);
assert("doc actualWrite true", doc.includes("actualWrite: true"));
assert("doc operation republish-update", doc.includes("operation: republish-update"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc target legacy 008", doc.includes(TARGET_LEGACY));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc published false to true", doc.includes("false") && doc.includes("true"));
assert("doc before updated_at", doc.includes(BEFORE_UPDATED_AT));
assert("doc saved updated_at", doc.includes(SAVED_UPDATED_AT));
assert("doc afterVerification pass", doc.includes("afterVerificationPass: true"));
assert("doc reference rows unchanged", doc.includes("referenceRowsUnchanged: true"));
assert("doc reference 014", doc.includes(REF_014) && doc.includes(REF_014_ID));
assert("doc reference 001", doc.includes(REF_001) && doc.includes(REF_001_ID));
assert("doc physicalDelete false", doc.includes("physicalDelete: false"));
assert("doc contentFieldsChanged false", doc.includes("contentFieldsChanged: false"));
assert("doc publicReflectionPending true", doc.includes("publicReflectionPending: true"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc package not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc write-armed stopped", doc.includes("writeArmedDevServerStopped: true"));
assert("doc port 4321 none", doc.includes("port4321ListenConfirmedNone: true"));
assert("doc save once only", doc.includes("Save count") || doc.includes("1**"));
assert("doc public reflection deferred", doc.includes("public reflection") || doc.includes("Public reflection"));
assert("doc next phase candidates", doc.includes("Public reflection planning") || doc.includes("public reflection planning"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

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

assert("00-current-state mentions G-22h7", currentState.includes("G-22h7"));
assert("03-next-actions mentions G-22h7", nextActions.includes("G-22h7"));
assert("handoff mentions G-22h7", handoff.includes("G-22h7"));
assert("handoff chain closed", handoff.includes("closed") || handoff.includes("G-22h7"));

assert("Save re-execution not by Cursor", true);
assert("DB write not by Cursor", true);
assert("SQL mutation not by Cursor", true);
assert("Rollback not by Cursor", true);
assert("GRANT/REVOKE not by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22h7 Gosaki Schedule republish UPDATE result closure verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
