/**
 * G-22f6 — Gosaki Schedule unpublish UPDATE execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f6-gosaki-schedule-unpublish-update-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-result.md";
const PREFLIGHT_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-target-fixed-beforeverification.md";

const APPROVAL_ID = "G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const TARGET_LEGACY = "schedule-2026-07-008";
const UPDATED_AT_BEFORE = "2026-06-16T16:03:41.551792+00:00";
const UPDATED_AT_AFTER = "2026-07-06T13:58:41.425402+00:00";
const MONTH_COUNT = "14";
const PROTECTED_014 = "schedule-2026-03-014";
const PROTECTED_001 = "schedule-2026-09-001";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "500aaf0";

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

assert("HEAD is 500aaf0", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 500aaf0", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("execution result doc exists", exists(DOC_REL));
assert("prior target-fixed doc exists", exists(PREFLIGHT_DOC));

const doc = read(DOC_REL);

assert("doc phase G-22f6", doc.includes("G-22f6-gosaki-schedule-unpublish-update-execution-result"));
assert(
  "doc execution result gate complete",
  doc.includes("gosakiScheduleUnpublishUpdateExecutionResultComplete: true"),
);
assert("doc g22f5 chain save closed", doc.includes("g22f5UnpublishUpdateChainSaveClosed: true"));
assert(
  "doc save re-exec forbidden",
  doc.includes("readyForG22fUnpublishUpdateSaveReExecution: false"),
);
assert("doc physical delete not occurred", doc.includes("physicalDeleteOccurred: false"));

assert("doc targetId recorded", doc.includes(TARGET_ID));
assert("doc legacy_id 008", doc.includes(TARGET_LEGACY));
assert("doc operation unpublish-update", doc.includes("unpublish-update"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert(
  "doc actualWrite true",
  doc.includes("actualWrite: true") || doc.includes("actualWrite` | `true"),
);
assert("doc wouldDelete false", doc.includes("wouldDelete") && doc.includes("false"));
assert("doc physicalDelete false", doc.includes("physicalDelete") && doc.includes("false"));

assert("doc published true to false", doc.includes("true → false") || doc.includes("true` | **`false`**"));
assert("doc updated_at_before", doc.includes(UPDATED_AT_BEFORE));
assert("doc updated_at_after", doc.includes(UPDATED_AT_AFTER));

assert("doc afterVerification PASS", doc.includes("afterVerification PASS"));
assert("doc target row still exists", doc.includes("still exists") || doc.includes("Row **still exists**"));
assert("doc target_row_count 1", doc.includes("target_row_count") && doc.includes("`1`"));
assert("doc target_legacy_id_count 1", doc.includes("target_legacy_id_count") && doc.includes("`1`"));
assert(
  "doc month count 14 unchanged",
  doc.includes("target_month_count_before") &&
    doc.includes(MONTH_COUNT) &&
    doc.includes("target_month_count_after"),
);
assert("doc physical DELETE did not occur", doc.includes("Physical DELETE") && doc.includes("did not occur"));

assert("doc protected 014", doc.includes(PROTECTED_014));
assert("doc protected 001", doc.includes(PROTECTED_001));
assert("doc protected rows unchanged", doc.includes("Protected rows") && doc.includes("unchanged"));
assert("doc all_protected_rows_still_unpublished", doc.includes("all_protected_rows_still_unpublished"));

assert("doc not physical DELETE", doc.includes("NOT physical DELETE") || doc.includes("not physical DELETE"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rollback archive only", doc.includes("NOT executed") || doc.includes("Not needed"));

assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert(
  "doc no package ftp",
  doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"),
);
assert("doc no save re-click", doc.includes("Do not re-click"));
assert("doc cursor save not executed", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write not executed", doc.includes("cursorDbWriteExecuted: false"));

assert("doc save once G-22f5", doc.includes("G-22f5") && doc.includes("once"));
assert("doc G-22f7 next", doc.includes("G-22f7"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc mentions prod ref only as never",
  doc.includes(PROD_REF) && /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);
assert("doc base commit 500aaf0", doc.includes(BASE_COMMIT));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert("doc UI expectedBeforeUpdatedAt note", doc.includes("expectedBeforeUpdatedAt"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("00-current-state mentions G-22f6", currentState.includes("G-22f6"));
assert("03-next-actions mentions G-22f6", nextActions.includes("G-22f6"));
assert("handoff mentions G-22f6", handoff.includes("G-22f6"));
assert("03-next-actions G-22f7 next", nextActions.includes("G-22f7"));
assert("handoff G-22f7 next", handoff.includes("G-22f7"));

console.log(
  `\nG-22f6 Gosaki Schedule unpublish UPDATE execution result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
