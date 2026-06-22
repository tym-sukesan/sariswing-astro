/**
 * G-9k6f — Gosaki schedule existing event title field slice Save success finalization.
 * Run: node tools/static-to-astro/scripts/verify-g9k6f-gosaki-schedule-existing-event-title-field-slice-save-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const BEFORE_TITLE = "<Duo>";
const AFTER_TITLE = "<Duo> [G-9k6 title UI保存テスト]";
const BEFORE_UPDATED_AT = "2026-06-22T13:02:19.63835+00:00";
const POST_SAVE_UPDATED_AT = "2026-06-22T15:01:47.671778+00:00";

const ALL_SLICE_FIELDS = ["description", "price", "open_time", "start_time", "venue", "title"];

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
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md",
);
const matrixDoc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-verification-planning.md",
);

assert(
  "G-9k6f doc phase",
  doc.includes("G-9k6f-gosaki-schedule-existing-event-title-field-slice-save-success-finalization"),
);
assert("title slice success gate", doc.includes("gosakiScheduleExistingEventTitleFieldSliceSaveSuccess: true"));
assert("all slices complete gate", doc.includes("gosakiScheduleExistingEventFieldSliceManualSaveAllComplete: true"));
assert("target row recorded", doc.includes(TARGET_ID));
assert("project ref recorded", doc.includes(PROJECT_REF));
assert('changedFields title only', doc.includes('changedFields: ["title"]'));
assert("payload keys title only", doc.includes('payload keys: ["title"]'));
assert("rowsAffected = 1", doc.includes("rowsAffected: 1"));
assert("before title recorded", doc.includes(BEFORE_TITLE));
assert("after title recorded", doc.includes(AFTER_TITLE));
assert("before updated_at recorded", doc.includes(BEFORE_UPDATED_AT));
assert("post-save updated_at recorded", doc.includes(POST_SAVE_UPDATED_AT));
assert("post-save result panel recorded", doc.includes("保存成功") && doc.includes("Post-save result panel"));
assert("diff table タイトル recorded", doc.includes("タイトル"));
assert("next phase G-9k6g closure", doc.includes("G-9k6g") && doc.includes("field-slice-closure"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));

for (const field of ALL_SLICE_FIELDS) {
  assert(`G-9k6f doc ${field} slice succeeded`, doc.includes(`\`${field}\``) && doc.includes("**succeeded**"));
}

assert(
  "G-9k6a matrix title succeeded",
  matrixDoc.includes("G-9k6f") && matrixDoc.match(/`title`[\s\S]*?\*\*succeeded\*\*/),
);
assert(
  "G-9k6a references G-9k6f doc",
  matrixDoc.includes("gosaki-schedule-existing-event-title-field-slice-save-success-finalization.md"),
);
assert("G-9k6a all slices complete", matrixDoc.includes("gosakiScheduleExistingEventFieldSliceManualSaveAllComplete: true"));
assert("G-9k6a next phase G-9k6g", matrixDoc.includes("G-9k6g") && matrixDoc.includes("field-slice closure"));

for (const field of ALL_SLICE_FIELDS) {
  assert(`G-9k6a matrix ${field} succeeded`, matrixDoc.match(new RegExp(`\`${field}\`[\\s\\S]*?\\*\\*succeeded\\*\\*`)));
}

const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
assert("save module no auto execute", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k6f", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k6f"));
assert("03-next-actions G-9k6f", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k6f"));
assert("handoff G-9k6f", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k6f"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
