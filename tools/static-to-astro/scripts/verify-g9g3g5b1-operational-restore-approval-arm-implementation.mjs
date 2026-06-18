/**
 * G-9g3g5b1 — Operational restore approval arm implementation (no DB write).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const RESTORE_APPROVAL_ID =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";
const RESTORE_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const G9G3G_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const MARKER = "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const NEXT_PHASE = "G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test";

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

const implPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md",
);
assert("restore implementation doc exists", fs.existsSync(implPath));
const implSrc = fs.readFileSync(implPath, "utf8");

assert(
  "phase G-9g3g5b1",
  implSrc.includes("G-9g3g5b1-operational-restore-approval-arm-implementation"),
);
assert("implementation complete", implSrc.includes("implementation complete"));
assert("restore approval ID in doc", implSrc.includes(RESTORE_APPROVAL_ID));
assert("restore env arm in doc", implSrc.includes(RESTORE_ARM));
assert("gap resolved markers", implSrc.includes("resolved"));
assert("Save not clicked", implSrc.includes("Save clicked") && implSrc.includes("no"));
assert("DB write not executed", implSrc.includes("DB write") && implSrc.includes("not executed"));
assert("restore not executed", implSrc.includes("restoreExecuted: false"));
assert("next phase G-9g3g5b2", implSrc.includes(NEXT_PHASE));

const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
assert("restore approval ID registered in types", typesSrc.includes(RESTORE_APPROVAL_ID));
assert(
  "restore approval in SCHEDULE_WRITE_APPROVAL_IDS",
  typesSrc.includes("G9G3G5_SCHEDULE_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID"),
);

const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
assert("restore env arm in config", configSrc.includes(RESTORE_ARM));
assert("G9G3G5B1 phase in config", configSrc.includes("G-9g3g5b1-operational-restore-approval-arm-implementation"));
assert("lock baseline in config", configSrc.includes("2026-06-18T16:35:45.060011+00:00"));

const restoreConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-restore-config.ts",
);
assert("getG9G3g5OperationalRestoreConfig exists", restoreConfigSrc.includes("getG9G3g5OperationalRestoreConfig"));
assert(
  "restore target id in restore config",
  restoreConfigSrc.includes("G9G3G4_OPERATIONAL_TARGET_ROW_ID") || restoreConfigSrc.includes(TARGET_ROW_ID),
);
assert(
  "g9g3g arm must be off in restore config",
  restoreConfigSrc.includes("SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV") &&
    restoreConfigSrc.includes("must be off"),
);

const restoreSaveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-operational-restore-save.ts",
);
assert("executeG9G3g5OperationalRestoreSave exists", restoreSaveSrc.includes("executeG9G3g5OperationalRestoreSave"));
assert("service_role not used in restore save", !restoreSaveSrc.includes("service_role"));

const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
assert("assertG9G3g5RestorePayloadOnly exists", guardsSrc.includes("assertG9G3g5RestorePayloadOnly"));
assert("assertG9G3g5RestoreWritableRow exists", guardsSrc.includes("assertG9G3g5RestoreWritableRow"));
assert("marker-before guard", guardsSrc.includes("temporary marker"));
assert("original-after guard", guardsSrc.includes("G9G3G4_OPERATIONAL_DESCRIPTION_ORIGINAL"));

const operationalConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts",
);
assert(
  "g9g3g5 restore arm must be off in operational config",
  operationalConfigSrc.includes("SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV") &&
    operationalConfigSrc.includes("must be off"),
);

const titlePocSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-title-poc-config.ts");
assert(
  "title PoC checks g9g3g5 arm off",
  titlePocSrc.includes("SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV"),
);

const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
assert("canEnableG9G3g5OperationalRestoreSave exists", editUiSrc.includes("canEnableG9G3g5OperationalRestoreSave"));
assert(
  "restore mode UI marker",
  editUiSrc.includes("G9G3G5_OPERATIONAL_RESTORE_MODE_LABEL") ||
    editUiSrc.includes("G-9g3g5 restore mode"),
);
assert("changedFields description only for restore", editUiSrc.includes("changedFields must be description only for restore"));
assert("executeG9G3g5OperationalRestoreSave in UI", editUiSrc.includes("executeG9G3g5OperationalRestoreSave"));
assert(
  "g9g3g and restore mutual exclusion in UI",
  editUiSrc.includes("cannot both be on"),
);

const astroSrc = readRepo(
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
);
assert("data-g9g3g5-armed in astro", astroSrc.includes("data-g9g3g5-armed"));
assert("restore mode warning in astro", astroSrc.includes("G-9g3g5 restore mode"));

const rowPickerSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts");
assert(
  "isG9G3g4OperationalRestoreTargetRow exists",
  rowPickerSrc.includes("isG9G3g4OperationalRestoreTargetRow"),
);

console.log(`\nG-9g3g5b1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
