/**
 * G-9k6e — Gosaki schedule existing event venue field slice Save success finalization.
 * Run: node tools/static-to-astro/scripts/verify-g9k6e-gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const BEFORE_VENUE = "川崎 ぴあにしも";
const AFTER_VENUE = "川崎 ぴあにしも [G-9k6 venue UI保存テスト]";
const BEFORE_UPDATED_AT = "2026-06-22T12:42:32.483922+00:00";
const POST_SAVE_UPDATED_AT = "2026-06-22T13:02:19.63835+00:00";

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
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md",
);
const matrixDoc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-field-slice-verification-planning.md",
);

assert("G-9k6e doc phase", doc.includes("G-9k6e-gosaki-schedule-existing-event-venue-field-slice-save-success-finalization"));
assert("venue slice success gate", doc.includes("gosakiScheduleExistingEventVenueFieldSliceSaveSuccess: true"));
assert("target row recorded", doc.includes(TARGET_ID));
assert("project ref recorded", doc.includes(PROJECT_REF));
assert('changedFields venue only', doc.includes('changedFields: ["venue"]'));
assert("payload keys venue only", doc.includes('payload keys: ["venue"]'));
assert("rowsAffected = 1", doc.includes("rowsAffected: 1"));
assert("before venue recorded", doc.includes(BEFORE_VENUE));
assert("after venue recorded", doc.includes(AFTER_VENUE));
assert("before updated_at recorded", doc.includes(BEFORE_UPDATED_AT));
assert("post-save updated_at recorded", doc.includes(POST_SAVE_UPDATED_AT));
assert("post-save result panel recorded", doc.includes("保存成功") && doc.includes("Post-save result panel"));
assert("diff table 会場 recorded", doc.includes("会場"));
assert("next phase title", doc.includes("G-9k6f") && doc.includes("title"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));

assert("G-9k6a matrix venue succeeded", matrixDoc.includes("G-9k6e") && matrixDoc.match(/`venue`[\s\S]*?\*\*succeeded\*\*/));
assert("G-9k6a references G-9k6e doc", matrixDoc.includes("gosaki-schedule-existing-event-venue-field-slice-save-success-finalization.md"));
assert("G-9k6a next slice title", matrixDoc.includes("G-9k6f") && matrixDoc.includes("title"));

const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
assert("save module no auto execute", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k6e", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k6e"));
assert("03-next-actions G-9k6e", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k6e"));
assert("handoff G-9k6e", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k6e"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
