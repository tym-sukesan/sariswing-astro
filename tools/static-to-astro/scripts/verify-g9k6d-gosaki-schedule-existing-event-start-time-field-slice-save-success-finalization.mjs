/**
 * G-9k6d — Gosaki schedule existing event start_time field slice Save success finalization.
 * Run: node tools/static-to-astro/scripts/verify-g9k6d-gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const BEFORE_START_TIME = "15:30";
const AFTER_START_TIME = "19:00";
const BEFORE_UPDATED_AT = "2026-06-22T07:30:35.391238+00:00";
const POST_SAVE_UPDATED_AT = "2026-06-22T12:42:32.483922+00:00";

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

const doc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md",
);
const matrixDoc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-verification-planning.md",
);

assert("G-9k6d doc phase", doc.includes("G-9k6d-gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization"));
assert("start_time slice success gate", doc.includes("gosakiScheduleExistingEventStartTimeFieldSliceSaveSuccess: true"));
assert("target row recorded", doc.includes(TARGET_ID));
assert("project ref recorded", doc.includes(PROJECT_REF));
assert('changedFields start_time only', doc.includes('changedFields: ["start_time"]'));
assert("payload keys start_time only", doc.includes('payload keys: ["start_time"]'));
assert("rowsAffected = 1", doc.includes("rowsAffected: 1"));
assert("before start_time recorded", doc.includes(BEFORE_START_TIME));
assert("after start_time recorded", doc.includes(AFTER_START_TIME));
assert("before updated_at recorded", doc.includes(BEFORE_UPDATED_AT));
assert("post-save updated_at recorded", doc.includes(POST_SAVE_UPDATED_AT));
assert("post-save result panel recorded", doc.includes("保存成功") && doc.includes("Post-save result panel"));
assert("diff table 開演 recorded", doc.includes("開演") && doc.includes("15:30") && doc.includes("19:00"));
assert("next phase venue", doc.includes("G-9k6e") && doc.includes("venue"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));

assert("G-9k6a matrix start_time succeeded", matrixDoc.includes("G-9k6d") && matrixDoc.match(/`start_time`[\s\S]*?\*\*succeeded\*\*/));
assert("G-9k6a references G-9k6d doc", matrixDoc.includes("gosaki-schedule-existing-event-start-time-field-slice-save-success-finalization.md"));
assert("G-9k6a next slice venue", matrixDoc.includes("G-9k6e") && matrixDoc.includes("venue"));

const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
assert("save module no auto execute", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k6d", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k6d"));
assert("03-next-actions G-9k6d", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k6d"));
assert("handoff G-9k6d", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k6d"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
