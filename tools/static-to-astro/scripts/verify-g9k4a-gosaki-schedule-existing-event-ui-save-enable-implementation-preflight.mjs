/**
 * G-9k4a — Gosaki schedule existing event UI Save enable implementation preflight.
 * Run: node tools/static-to-astro/scripts/verify-g9k4a-gosaki-schedule-existing-event-ui-save-enable-implementation-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";
const G9J5_APPROVAL = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const G9J5_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";
const SAFE_FIELDS = ["title", "venue", "open_time", "start_time", "price", "description"];
const FORBIDDEN = ["date", "month", "published", "schedule_months"];

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

const doc = read(`tools/static-to-astro/docs/gosaki-schedule-existing-event-ui-save-enable-implementation-preflight.md`);
const saveSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts");
const configSrc = read("src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts");
const uiSrc = read("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");
const g9j5Runner = read("tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs");

assert("G-9k4a doc phase", doc.includes("G-9k4a-gosaki-schedule-existing-event-ui-save-enable-implementation-preflight"));
assert("preflight only no auto DB write", doc.includes("cursorClickedSave: false"));
assert("next G-9k4 manual save", doc.includes("G-9k4"));

assert("save executor exists", saveSrc.includes("executeG9kExistingEventSaveButtonSave"));
assert("save uses G-9k approval", saveSrc.includes("G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID"));
assert("save not G-9j5 approval", !saveSrc.includes(G9J5_APPROVAL));
assert("save calls updateScheduleWrite", saveSrc.includes("updateScheduleWrite("));
assert("save rowsAffected guard", saveSrc.includes("assertG9kRowsAffectedExactlyOne"));
assert("save dry-run re-check", saveSrc.includes("executeG9kExistingEventSaveButtonDryRun"));
assert("save auth session", saveSrc.includes("isSignedInStagingAuth"));
assert("save project allowlist", saveSrc.includes("assertStaticToAstroCmsStagingSupabaseProject"));
assert("save before after record", saveSrc.includes("beforeRecord") && saveSrc.includes("afterRecord"));
assert("save no service_role", !saveSrc.includes("service_role"));

assert("G9K_SAVE_BUTTON_SAVE_ENABLED false default", configSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED = false"));
assert("G-9k env arm in config", configSrc.includes(G9K_ARM));
assert("UI gate evaluator", configSrc.includes("evaluateG9kOperatorSaveButtonUiGate"));
assert("config blocks G-9j5 arm", configSrc.includes(G9J5_ARM));

assert("UI imports save executor", uiSrc.includes("executeG9kExistingEventSaveButtonSave"));
assert("UI does not import G-9j5 save", !uiSrc.includes("executeG9j5ExistingEventDescriptionOneRowSave"));
assert("UI evaluateG9kOperatorSaveButtonUiGate", uiSrc.includes("evaluateG9kOperatorSaveButtonUiGate"));
assert("UI runEditSave", uiSrc.includes("runEditSave"));
assert("UI renderSaveResult", uiSrc.includes("renderSaveResult"));
assert("UI save default blocked", uiSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED"));
assert("UI dry-run required", uiSrc.includes("dry-run"));
assert("UI before updated_at display", uiSrc.includes("before updated_at"));
assert("UI post-save updated_at display", uiSrc.includes("post-save updated_at"));
assert("UI no auto save on init", !uiSrc.includes("runEditSave()") || uiSrc.includes("wireSaveButton"));

for (const field of SAFE_FIELDS) {
  assert(`safe field ${field}`, saveSrc.includes(`"${field}"`) || saveSrc.includes("changedFields"));
}
for (const field of FORBIDDEN) {
  assert(`forbidden ${field} not in save-only export`, !saveSrc.match(new RegExp(`SAFE_FIELDS[\\s\\S]*"${field}"`)));
}

assert("g9j5 runner unchanged", !g9j5Runner.includes(G9K_APPROVAL) && g9j5Runner.includes(G9J5_APPROVAL));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

const g9k2 = spawnSync(
  "node",
  [path.join(TOOL_ROOT, "scripts", "verify-g9k2-gosaki-schedule-existing-event-save-button-ui-wiring.mjs")],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("verify-g9k2 passes", g9k2.status === 0);

assert("00-current-state G-9k4a", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-9k4a"));
assert("03-next-actions G-9k4a", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-9k4a"));
assert("handoff G-9k4a", read("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md").includes("G-9k4a"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
