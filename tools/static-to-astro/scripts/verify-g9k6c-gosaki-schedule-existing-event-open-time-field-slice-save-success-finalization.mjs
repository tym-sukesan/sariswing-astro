/**
 * G-9k6c — Gosaki schedule existing event open_time field slice Save success finalization.
 * Run: node tools/static-to-astro/scripts/verify-g9k6c-gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const BEFORE_OPEN_TIME = "15:00";
const AFTER_OPEN_TIME = "18:00";
const BEFORE_UPDATED_AT = "2026-06-22T06:53:39.857434+00:00";
const POST_SAVE_UPDATED_AT = "2026-06-22T07:30:35.391238+00:00";

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
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md",
);
const matrixDoc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-verification-planning.md",
);

assert("G-9k6c doc phase", doc.includes("G-9k6c-gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization"));
assert("open_time slice success gate", doc.includes("gosakiScheduleExistingEventOpenTimeFieldSliceSaveSuccess: true"));
assert("target row recorded", doc.includes(TARGET_ID));
assert("project ref recorded", doc.includes(PROJECT_REF));
assert('changedFields open_time only', doc.includes('changedFields: ["open_time"]'));
assert("payload keys open_time only", doc.includes('payload keys: ["open_time"]'));
assert("rowsAffected = 1", doc.includes("rowsAffected: 1"));
assert("before open_time recorded", doc.includes(BEFORE_OPEN_TIME));
assert("after open_time recorded", doc.includes(AFTER_OPEN_TIME));
assert("before updated_at recorded", doc.includes(BEFORE_UPDATED_AT));
assert("post-save updated_at recorded", doc.includes(POST_SAVE_UPDATED_AT));
assert("post-save result panel recorded", doc.includes("保存成功") && doc.includes("Post-save result panel"));
assert("diff table 開場 recorded", doc.includes("開場") && doc.includes("15:00") && doc.includes("18:00"));
assert("next phase start_time", doc.includes("G-9k6d") && doc.includes("start_time"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));

assert("G-9k6a matrix open_time succeeded", matrixDoc.includes("G-9k6c") && matrixDoc.match(/`open_time`[\s\S]*?\*\*succeeded\*\*/));
assert("G-9k6a references G-9k6c doc", matrixDoc.includes("gosaki-schedule-existing-event-open-time-field-slice-save-success-finalization.md"));
assert("G-9k6a next slice start_time", matrixDoc.includes("G-9k6d") && matrixDoc.includes("start_time"));

const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
assert("save module no auto execute", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k6c", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k6c"));
assert("03-next-actions G-9k6c", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k6c"));
assert("handoff G-9k6c", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k6c"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
