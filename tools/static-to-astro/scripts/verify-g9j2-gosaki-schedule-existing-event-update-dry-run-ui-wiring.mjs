/**
 * G-9j2 — Gosaki schedule existing event update dry-run UI wiring (no Save, no DB write).
 * Run: node tools/static-to-astro/scripts/verify-g9j2-gosaki-schedule-existing-event-update-dry-run-ui-wiring.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
];
const FORBIDDEN_IN_PAYLOAD = [
  "date",
  "month",
  "source_route",
  "published",
  "updated_at",
  "schedule_months",
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

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

const astroSrc = readRepo(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro",
);
const uiSrc = readRepo("src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts");
const cssSrc = readRepo("tools/static-to-astro/templates/admin-cms/styles/admin.css");
const dryRunSrc = readRepo(
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-dry-run.ts",
);

assert("dry-run confirm button in Astro", astroSrc.includes("gosaki-schedule-edit-dry-run-btn"));
assert(
  "dry-run button label",
  astroSrc.includes("変更を確認") || astroSrc.includes("保存前に変更を確認"),
);
assert("dry-run result panel in Astro", astroSrc.includes("gosaki-schedule-edit-dry-run-result"));
assert("dry-run only data attribute", astroSrc.includes("data-gosaki-dry-run-only"));
assert(
  "update button disabled",
  astroSrc.includes('id="gosaki-schedule-update-btn"') &&
    astroSrc.includes("disabled") &&
    astroSrc.includes("data-gosaki-schedule-action-disabled"),
);
assert(
  "update button preparation label",
  astroSrc.includes("更新する（準備中）") || astroSrc.includes("準備中"),
);
assert(
  "save not available copy",
  astroSrc.includes("まだ保存は実行できません") ||
    astroSrc.includes("保存はまだ実行されません") ||
    astroSrc.includes("G-9k4") ||
    astroSrc.includes("実保存はできません"),
);

assert(
  "UI imports dry-run executor (G-9j or G-9k operator path)",
  uiSrc.includes("executeG9jExistingEventUpdateDryRun") ||
    uiSrc.includes("executeG9kExistingEventSaveButtonDryRun"),
);
assert("UI does not call updateScheduleWrite", !uiSrc.includes("updateScheduleWrite("));
assert("UI does not import service_role", !uiSrc.includes("service_role"));
assert("UI wires dry-run button", uiSrc.includes("gosaki-schedule-edit-dry-run-btn"));
assert("UI renders dry-run result", uiSrc.includes("renderDryRunResult"));
assert(
  "UI saveAllowed false display",
  uiSrc.includes('data-gosaki-save-allowed="false"') ||
    uiSrc.includes("まだ保存は実行できません") ||
    uiSrc.includes("実保存未開放") ||
    uiSrc.includes("G-9k4"),
);
assert(
  "UI uses safe field registry",
  uiSrc.includes("G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS") ||
    uiSrc.includes("G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS"),
);

const fieldIdsMatch = uiSrc.match(
  /const G9(?:J2|K2)_EDIT_DRY_RUN_FIELD_IDS[^=]+=\s*\{([\s\S]*?)\};/,
);
const fieldIdsBlock = fieldIdsMatch?.[1] ?? "";

for (const field of SAFE_FIELDS) {
  assert(`dry-run field map includes ${field}`, fieldIdsBlock.includes(`${field}:`));
}

for (const field of FORBIDDEN_IN_PAYLOAD) {
  assert(`dry-run field map excludes ${field}`, !fieldIdsBlock.includes(`${field}:`));
}

assert(
  "G-9j5 save module exists (UI must not call it yet)",
  fs.existsSync(
    path.join(REPO_ROOT, "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-save.ts"),
  ),
);
assert(
  "UI does not import G-9j5 save executor",
  !uiSrc.includes("executeG9j5ExistingEventDescriptionOneRowSave") &&
    !uiSrc.includes("gosaki-schedule-existing-event-update-save"),
);

assert("dry-run panel CSS", cssSrc.includes("gosaki-schedule-edit-dry-run"));
assert("before/after diff CSS", cssSrc.includes("gosaki-schedule-edit-dry-run__diff"));

const pagesAdminChanged = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "src/pages/admin unchanged",
  !pagesAdminChanged.stdout.trim(),
);

for (const script of [
  "verify-g9j-gosaki-schedule-existing-event-save-enablement-planning.mjs",
  "verify-g9j1-gosaki-schedule-existing-event-update-guards-and-dry-run.mjs",
]) {
  const result = spawnSync("node", [`tools/static-to-astro/scripts/${script}`], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${script} passes`, result.status === 0);
}

assert(
  "dry-run module saveAllowed false",
  dryRunSrc.includes("saveAllowed: false") || dryRunSrc.includes("G9J_EXISTING_EVENT_UPDATE_SAVE_ENABLED"),
);
assert("env arm not set in UI", !uiSrc.includes("PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED=true"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
