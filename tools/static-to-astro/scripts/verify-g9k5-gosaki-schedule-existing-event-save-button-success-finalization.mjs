/**
 * G-9k5 — Gosaki schedule existing event save button success finalization.
 * Run: node tools/static-to-astro/scripts/verify-g9k5-gosaki-schedule-existing-event-save-button-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
const POST_SAVE_UPDATED_AT = "2026-06-22T02:20:07.217037+00:00";
const G9K_PHASES = [
  "G-9k",
  "G-9k1",
  "G-9k2",
  "G-9k3",
  "G-9k4a",
  "G-9k4a-fix",
  "G-9k4b",
  "G-9k5",
];

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
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-save-button-success-finalization.md",
);
const g9k4bDoc = read(
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md",
);

assert("G-9k5 finalization doc exists", doc.includes("G-9k5-gosaki-schedule-existing-event-save-button-success-finalization"));
assert("G-9k arc closure gate", doc.includes("gosakiScheduleExistingEventSaveButtonArcComplete: true"));
assert("G-9k4b UI manual Save success recorded", doc.includes("gosakiScheduleExistingEventSaveButtonUiManualSaveSuccess: true"));
assert("target row recorded", doc.includes(TARGET_ID));
assert("project ref recorded", doc.includes(PROJECT_REF));
assert("post-save updated_at recorded", doc.includes(POST_SAVE_UPDATED_AT));
assert('changedFields description only', doc.includes('changedFields: ["description"]'));
assert("rowsAffected = 1 recorded", doc.includes("rowsAffected: 1"));
assert("post-save result display fix recorded", doc.includes("applyPostSaveSuccessState"));
assert("existing event UPDATE only", doc.includes("existing event UPDATE only"));
assert("first Save description only", doc.includes("description") && doc.includes("1フィールド"));
assert("date month published schedule_months out of scope", doc.includes("schedule_months"));
assert("new delete duplicate out of scope", doc.includes("Delete / duplicate"));
assert("production sari-site no impact", doc.includes("sari-site") && doc.includes("production"));
assert("service_role not used", doc.includes("service_role") && doc.includes("not used"));
assert("safety mechanisms section", doc.includes("Safety mechanisms"));
assert("auth gate recorded", doc.includes("auth gate"));
assert("optimistic lock recorded", doc.includes("Optimistic lock"));
assert("approvalId recorded", doc.includes(G9K_APPROVAL));
assert("next phases section", doc.includes("Recommended next phases"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("no DB write this phase", doc.includes("DB write in this phase") && doc.includes("no"));

for (const phase of G9K_PHASES) {
  assert(`G-9k phase timeline includes ${phase}`, doc.includes(phase));
}

assert("G-9k4b prior doc still present", g9k4bDoc.includes("G-9k4b"));
assert("G-9k5 references G-9k4b doc", doc.includes("gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md"));

const uiSrc = read("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");
assert("UI has post-save success path", uiSrc.includes("applyPostSaveSuccessState"));
assert("no auto Save on init", !uiSrc.match(/initGosakiStagingScheduleOperatorUi[\s\S]*runEditSave\(\)/));
assert("save module no auto execute", !read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts").includes(
  "executeG9kExistingEventSaveButtonSave()",
));

const g9j5Runner = read(
  "tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs",
);
assert("g9j5 runner not repurposed for G-9k", !g9j5Runner.includes(G9K_APPROVAL));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k5", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k5"));
assert("03-next-actions G-9k5", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k5"));
assert("handoff G-9k5", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k5"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
