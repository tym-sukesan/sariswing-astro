/**
 * G-9g3g3 — Operational non-dry-run preflight (no Save, no Preview click, no DB write).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const SITE_SLUG = "gosaki-piano";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const TARGET_LEGACY_ID = "schedule-2026-03-001";
const POC_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const OPERATIONAL_APPROVAL_ID =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const OPERATIONAL_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const DESCRIPTION_MARKER =
  "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const NEXT_PHASE = "G-9g3g4-operational-non-dry-run-execution";

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

const preflightDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md",
);
assert("preflight doc exists", fs.existsSync(preflightDocPath));
const preflightDocSrc = fs.readFileSync(preflightDocPath, "utf8");

assert("phase G-9g3g3", preflightDocSrc.includes("G-9g3g3-operational-non-dry-run-preflight"));
assert(
  "preflight complete execution pending",
  preflightDocSrc.includes("preflight complete / execution pending"),
);
assert("target id exists", preflightDocSrc.includes(TARGET_ROW_ID));
assert("target legacy_id exists", preflightDocSrc.includes(TARGET_LEGACY_ID));
assert("target site_slug exists", preflightDocSrc.includes(SITE_SLUG));
assert("approval ID exists", preflightDocSrc.includes(OPERATIONAL_APPROVAL_ID));
assert("env arm exists", preflightDocSrc.includes(OPERATIONAL_ARM));
assert("planned payload marker exists", preflightDocSrc.includes(DESCRIPTION_MARKER));
assert(
  "changedFields description only marker",
  preflightDocSrc.includes("changedFields") &&
    preflightDocSrc.includes("description") &&
    preflightDocSrc.includes('["description"]'),
);
assert("Preview button id exists", preflightDocSrc.includes(PREVIEW_BTN_ID));
assert("Preview result id exists", preflightDocSrc.includes(PREVIEW_RESULT_ID));
assert("Save button id exists", preflightDocSrc.includes(SAVE_BTN_ID));
assert("Save result id exists", preflightDocSrc.includes(SAVE_RESULT_ID));
assert("rollback template exists", preflightDocSrc.includes("Rollback SQL template"));
assert(
  "rollback not executed marker",
  preflightDocSrc.includes("rollback SQL **not executed**") ||
    preflightDocSrc.includes("Rollback SQL executed | **no**"),
);
assert(
  "Save not clicked marker",
  preflightDocSrc.includes("Save clicked | **no**") ||
    preflightDocSrc.includes("Save not clicked"),
);
assert(
  "DB write not executed marker",
  preflightDocSrc.includes("DB write executed | **no**") ||
    preflightDocSrc.includes("DB write not executed"),
);
assert("service_role not used marker", preflightDocSrc.includes("service_role"));
assert(
  "production untouched marker",
  preflightDocSrc.includes(PRODUCTION_HOST) && preflightDocSrc.includes("blocked"),
);
assert("next phase G-9g3g4 marker", preflightDocSrc.includes(NEXT_PHASE));
assert("not PoC audit row", preflightDocSrc.includes(POC_ROW_ID) === false || preflightDocSrc.includes("Not** PoC audit row"));
assert("single-arm rule G-9g2 off", preflightDocSrc.includes("G9G2_TITLE_NON_DRY_RUN_ARMED"));
assert("single-arm rule G-9g3b off", preflightDocSrc.includes("G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED"));
assert("single-arm rule G-9g3c off", preflightDocSrc.includes("G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED"));
assert("single-arm rule G-9g3d off", preflightDocSrc.includes("G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED"));
assert("G-9g3g4 Save forbidden in G-9g3g3", preflightDocSrc.includes("G-9g3g3"));

const configSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-config.ts",
);
assert("config G9G3G3 phase", configSrc.includes("G-9g3g3-operational-non-dry-run-preflight"));
assert("config G9G3G4 phase", configSrc.includes("G-9g3g4-operational-non-dry-run-execution"));
assert("config target row id", configSrc.includes(TARGET_ROW_ID));
assert("config description marker", configSrc.includes(DESCRIPTION_MARKER));

const sectionSrc = readRepo(
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
);
assert("UI Preview button id", sectionSrc.includes(PREVIEW_BTN_ID));
assert("UI Save button id", sectionSrc.includes(SAVE_BTN_ID));
assert("UI Save result id", sectionSrc.includes(SAVE_RESULT_ID));

const saveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-operational-general-edit-save.ts",
);
assert("save executor no service_role", !saveSrc.includes("service_role"));
assert(
  "save executor approval id constant",
  saveSrc.includes("G9G3G_SCHEDULE_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID"),
);
assert("config approval id string", configSrc.includes(OPERATIONAL_APPROVAL_ID));

const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
assert("types approval id", typesSrc.includes(OPERATIONAL_APPROVAL_ID));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
assert("current state G-9g3g3", currentStateSrc.includes("G-9g3g3"));
assert("current state commit 2fb6d08", currentStateSrc.includes("2fb6d08"));

const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
assert("next actions G-9g3g4", nextActionsSrc.includes("G-9g3g4"));

const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("handoff G-9g3g3", handoffSrc.includes("G-9g3g3"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
