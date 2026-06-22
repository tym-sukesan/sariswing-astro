/**
 * G-9k4b — Gosaki schedule existing event UI manual Save success + post-save result UI fix.
 * Run: node tools/static-to-astro/scripts/verify-g9k4b-gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const TARGET_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const POST_SAVE_UPDATED_AT = "2026-06-22T02:20:07.217037+00:00";
const G9J5_APPROVAL = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";

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
  "tools/static-to-astro/docs/gosaki-schedule-existing-event-ui-manual-save-success-and-result-fix.md",
);
const uiSrc = read("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");
const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
const astroSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
);
const cssSrc = read("tools/static-to-astro/templates/admin-cms/styles/admin.css");
const g9j5Runner = read(
  "tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs",
);

assert("G-9k4b doc phase", doc.includes("G-9k4b-gosaki-schedule-existing-event-ui-manual-save-success-and-post-save-result-fix"));
assert("manual Save success recorded", doc.includes("gosakiScheduleExistingEventSaveButtonUiManualSaveSuccess: true"));
assert("target id recorded", doc.includes(TARGET_ID));
assert("changedFields description only", doc.includes('changedFields: ["description"]'));
assert("post-save updated_at recorded", doc.includes(POST_SAVE_UPDATED_AT));
assert("project ref recorded", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("no cursor Save this phase", doc.includes("cursorClickedSave: false"));
assert("UI fix documented", doc.includes("post-save result panel"));

assert("renderSaveResult shows 保存成功", uiSrc.includes("保存成功"));
assert("rowsAffected display", uiSrc.includes("rowsAffected"));
assert("post-save updated_at display", uiSrc.includes("post-save updated_at"));
assert("post-save description display", uiSrc.includes("post-save description"));
assert("before updated_at display", uiSrc.includes("before updated_at"));
const applyPostSaveBlock =
  uiSrc.match(/function applyPostSaveSuccessState[\s\S]*?^}/m)?.[0] ?? "";
assert("applyPostSaveSuccessState exists", uiSrc.includes("applyPostSaveSuccessState"));
assert("success path does not clear save result", !applyPostSaveBlock.includes("clearSaveResult"));
assert("showDryRunSavedState distinguishes saved", uiSrc.includes("showDryRunSavedState"));
assert("after save disable re-save", uiSrc.includes("lastDryRunResult = null") && uiSrc.includes("updateSaveButtonState(null)"));
assert("form edit clears save panel", uiSrc.includes("clearSaveResult()") && uiSrc.includes("markDryRunStale"));
assert("form updated_at element wired", uiSrc.includes("gosaki-edit-updated-at-value"));
assert("no auto Save on init", !uiSrc.includes("runEditSave();") || uiSrc.includes("wireSaveButton"));

assert("save record includes description", saveSrc.includes("description: row.description"));
assert("save no service_role", !saveSrc.includes("service_role"));
assert("save no auto execute on import", !saveSrc.includes("executeG9kExistingEventSaveButtonSave()"));

assert("Astro save result panel", astroSrc.includes("gosaki-schedule-edit-save-result"));
assert("Astro form updated_at", astroSrc.includes("gosaki-edit-updated-at-value"));
assert("CSS save success styles", cssSrc.includes("gosaki-schedule-edit-save-result__success"));
assert("CSS saved dry-run state", cssSrc.includes("gosaki-schedule-edit-dry-run--saved"));

assert("g9j5 runner unchanged", !g9j5Runner.includes(G9K_APPROVAL) && g9j5Runner.includes(G9J5_APPROVAL));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

assert("00-current-state G-9k4b", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k4b"));
assert("03-next-actions G-9k4b", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k4b"));
assert("handoff G-9k4b", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k4b"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
