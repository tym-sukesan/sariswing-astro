/**
 * G-9g3g1 — Operational general edit Save path implementation (no Save, no Preview click, no DB write).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const APPROVAL_ID = "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const POC_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";

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

const implDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-implementation.md",
);
const implDocSrc = fs.existsSync(implDocPath) ? fs.readFileSync(implDocPath, "utf8") : "";

const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const operationalConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts",
);
const saveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-operational-general-edit-save.ts",
);
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const editBindingSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts",
);
const editSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert("G-9g3g1 implementation doc exists", implDocSrc.length > 0);
assert(
  "G-9g3g1 implementation completed",
  implDocSrc.includes("G-9g3g1 implementation completed"),
);
assert(
  "implementation gate true",
  implDocSrc.includes(
    "stagingShellScheduleSiteSlugOperationalGeneralEditImplementationComplete: true",
  ),
);
assert(
  "next phase G-9g3g2",
  implDocSrc.includes("G-9g3g2-operational-save-ui-gate-smoke-test"),
);
assert("Save not clicked in doc", implDocSrc.includes("Save not clicked"));
assert(
  "DB write not executed in doc",
  implDocSrc.includes("no DB write") || implDocSrc.includes("DB write not executed"),
);
assert("service_role not used in doc", implDocSrc.includes("service_role used"));

assert("G9G3G1_PHASE in config", configSrc.includes("G9G3G1_PHASE"));
assert("G-9g3g approval ID in config", configSrc.includes(APPROVAL_ID));
assert("G-9g3g env arm in config", configSrc.includes(ENV_ARM));
assert("operational Save button id constant", configSrc.includes(SAVE_BTN_ID));
assert("operational Save result panel id constant", configSrc.includes(SAVE_RESULT_ID));

assert(
  "approval ID registered in types",
  typesSrc.includes(APPROVAL_ID) &&
    typesSrc.includes("G9G3G_SCHEDULE_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID"),
);

assert(
  "operational config single-arm checks",
  operationalConfigSrc.includes("SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV") &&
    operationalConfigSrc.includes("must be off"),
);

assert(
  "operational Save executor exists",
  saveSrc.includes("executeG9G3gOperationalGeneralEditSave") &&
    saveSrc.includes("getStagingSupabaseClient") &&
    !saveSrc.includes("service_role"),
);

assert(
  "changed-fields-only guard",
  guardsSrc.includes("assertG9G3gOperationalGeneralEditPayloadOnly"),
);
assert("PoC audit row block guard", guardsSrc.includes("assertOperationalNotPocAuditRow"));
assert(
  "candidate preview match guard",
  guardsSrc.includes("assertOperationalCandidatePreviewMatch"),
);

assert(
  "preview stale blocks Save in UI",
  editUiSrc.includes("isG9PreviewResultStale") &&
    editUiSrc.includes("canEnableG9G3gOperationalSave"),
);
assert(
  "candidate preview mismatch blocks Save",
  editUiSrc.includes("changed since preview"),
);

assert(
  "operational Save button in template",
  editSectionSrc.includes(`id="${SAVE_BTN_ID}"`) &&
    editSectionSrc.includes("Save operational general edit"),
);
assert(
  "operational Save result panel in template",
  editSectionSrc.includes(`id="${SAVE_RESULT_ID}"`),
);
assert(
  "operational Save button disabled by default",
  editSectionSrc.includes(`id="${SAVE_BTN_ID}"`) && editSectionSrc.includes("disabled={true}"),
);

assert(
  "G-9g3d PoC Save remains frozen",
  configSrc.includes("G9G3D_GENERAL_EDIT_POC_EXECUTED = true") &&
    editSectionSrc.includes("Save general edit (frozen)"),
);

assert(
  "PoC audit row id referenced in guards",
  guardsSrc.includes(POC_ROW_ID) || guardsSrc.includes("PoC audit row"),
);

assert(
  "binding exposes g9g3g fields",
  editBindingSrc.includes("g9g3gApprovalId") && editBindingSrc.includes("g9g3gArmed"),
);

assert(
  "G-9g3d PoC arm mutual exclusion with g9g3g",
  readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-general-edit-poc-config.ts").includes(
    "SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV",
  ),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
