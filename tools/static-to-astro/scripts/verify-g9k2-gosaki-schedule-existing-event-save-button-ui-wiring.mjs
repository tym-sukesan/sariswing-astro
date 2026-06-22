/**
 * G-9k2 — Gosaki schedule existing event save button UI wiring (dry-run gate only).
 * Run: node tools/static-to-astro/scripts/verify-g9k2-gosaki-schedule-existing-event-save-button-ui-wiring.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";
const G9J5_APPROVAL = "G-9j-gosaki-schedule-existing-event-update-non-dry-run";
const G9J5_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED";
const SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
];
const FORBIDDEN_FIELDS = ["date", "month", "published", "schedule_months"];

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

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const astroSrc = readRepo(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
);
const uiSrc = readRepo("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");
const dryRunSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-dry-run.ts",
);
const configSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts",
);
const g9j5RunnerSrc = readRepo(
  "tools/static-to-astro/scripts/run-g9j5-gosaki-schedule-existing-event-update-one-row.mjs",
);

assert("G9K2 phase in dry-run", dryRunSrc.includes("G9K2_PHASE"));
assert("G-9k dry-run executor exists", dryRunSrc.includes("executeG9kExistingEventSaveButtonDryRun"));
assert(
  "G-9k approval in dry-run",
  dryRunSrc.includes("G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID"),
);
assert("G-9k dry-run does not use G-9j5 approval", !dryRunSrc.includes(G9J5_APPROVAL));
assert("dry-run saveAllowed from runtime gate", dryRunSrc.includes("resolveG9kOperatorSaveButtonSaveEnabled"));
assert("dry-run no updateScheduleWrite", !dryRunSrc.includes("updateScheduleWrite("));
assert("dry-run no service_role", !dryRunSrc.includes("service_role"));
assert("dry-run actualWrite false", dryRunSrc.includes("actualWrite: false"));
assert("dry-run rowsAffected required", dryRunSrc.includes("rowsAffectedRequired: 1"));
assert("dry-run saveReadiness", dryRunSrc.includes("ready_but_save_disabled"));
assert("dry-run payloadKeys", dryRunSrc.includes("payloadKeys"));

assert("G9K_SAVE_BUTTON_SAVE_ENABLED false", configSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED = false"));

assert("UI imports G-9k dry-run", uiSrc.includes("executeG9kExistingEventSaveButtonDryRun"));
assert("UI does not import G-9j dry-run", !uiSrc.includes("executeG9jExistingEventUpdateDryRun"));
assert("UI does not import G-9j5 save", !uiSrc.includes("executeG9j5ExistingEventDescriptionOneRowSave"));
assert("UI does not import G-9j5 update-save module", !uiSrc.includes("gosaki-schedule-existing-event-update-save"));
assert("UI imports G-9k save executor", uiSrc.includes("executeG9kExistingEventSaveButtonSave"));
assert("UI does not call updateScheduleWrite directly", !uiSrc.includes("updateScheduleWrite("));
assert("UI wires dry-run button", uiSrc.includes("gosaki-schedule-edit-dry-run-btn"));
assert("UI renderDryRunResult", uiSrc.includes("renderDryRunResult"));
assert("UI save readiness message", uiSrc.includes("保存準備OK"));
assert("UI G-9k Save gate messaging", uiSrc.includes("G9K_SAVE_BUTTON_SAVE_ENABLED") || uiSrc.includes("G-9k4"));
assert("UI data-gosaki-save-allowed false", uiSrc.includes('data-gosaki-save-allowed="false"'));
assert("UI uses G9K safe fields", uiSrc.includes("G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS"));
assert("UI auth session check", uiSrc.includes("resolveStagingAuthSignedIn"));
assert("UI update button wired", uiSrc.includes("gosaki-schedule-update-btn"));
assert("UI does not arm G-9j5 env", !uiSrc.includes(`${G9J5_ARM}=true`));
assert("UI does not arm G-9k env in code", !uiSrc.includes(`${G9K_ARM}=true`));

const fieldIdsMatch = uiSrc.match(
  /const G9K2_EDIT_DRY_RUN_FIELD_IDS[^=]+=\s*\{([\s\S]*?)\};/,
);
const fieldIdsBlock = fieldIdsMatch?.[1] ?? "";
for (const field of SAFE_FIELDS) {
  assert(`field map includes ${field}`, fieldIdsBlock.includes(`${field}:`));
}
for (const field of FORBIDDEN_FIELDS) {
  assert(`field map excludes ${field}`, !fieldIdsBlock.includes(`${field}:`));
}

assert("dry-run confirm button in Astro", astroSrc.includes("gosaki-schedule-edit-dry-run-btn"));
assert("dry-run result panel in Astro", astroSrc.includes("gosaki-schedule-edit-dry-run-result"));
assert("update button disabled", astroSrc.includes('id="gosaki-schedule-update-btn"') && astroSrc.includes("disabled"));
assert(
  "G-9k Save enable copy in Astro",
  astroSrc.includes("g9k-schedule-save-button-page-config") || astroSrc.includes("G-9k"),
);

assert("g9j5 runner unchanged", !g9j5RunnerSrc.includes(G9K_APPROVAL) && g9j5RunnerSrc.includes(G9J5_APPROVAL));
assert(
  "G-9k save executor module exists",
  fs.existsSync(path.join(REPO_ROOT, "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts")),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
