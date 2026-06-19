/**
 * G-9g4a2 C3 — generic edit UI module + open_time delegate + Astro/binding wiring (static only).
 * Run: node --experimental-strip-types tools/static-to-astro/scripts/verify-g9g4a2-framework-single-text-field-operational-commonization-c3.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const GENERIC_EDIT_UI_PATH =
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-edit-ui.ts";
const OPEN_TIME_EDIT_UI_PATH =
  "src/lib/admin/staging-data/staging-schedule-site-slug-open-time-only-operational-edit-ui.ts";
const EDIT_UI_PATH = "src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts";
const BINDING_PATH = "src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts";
const GENERIC_SAVE_PATH =
  "src/lib/admin/staging-write/staging-schedule-single-text-field-operational-save.ts";
const REGISTRY_PATH =
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-registry.ts";
const CONFIG_PATH =
  "src/lib/admin/staging-data/staging-schedule-single-text-field-operational-config.ts";
const ASTRO_PATH =
  "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro";

const OPEN_TIME_UI_PREFIX = "site-slug-edit-g9g4a2a-open-time-only";
const START_TIME_UI_PREFIX = "site-slug-edit-g9g4a2b-start-time-only";
const PRICE_UI_PREFIX = "site-slug-edit-g9g4a2c-price-only";

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

function readTool(relPath) {
  return fs.readFileSync(path.join(TOOL_ROOT, relPath), "utf8");
}

const genericEditUiSrc = readRepo(GENERIC_EDIT_UI_PATH);
const openTimeEditUiSrc = readRepo(OPEN_TIME_EDIT_UI_PATH);
const editUiSrc = readRepo(EDIT_UI_PATH);
const bindingSrc = readRepo(BINDING_PATH);
const genericSaveSrc = readRepo(GENERIC_SAVE_PATH);
const registrySrc = readRepo(REGISTRY_PATH);
const configSrc = readRepo(CONFIG_PATH);
const astroSrc = readTool(ASTRO_PATH);

assert("generic edit UI module file exists", genericEditUiSrc.length > 0);
assert(
  "generic edit UI uses registry",
  genericEditUiSrc.includes("getSingleTextFieldOperationalRegistryEntry") &&
    genericEditUiSrc.includes("SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY"),
);
assert(
  "generic edit UI uses generic config",
  genericEditUiSrc.includes("getSingleTextFieldOperationalConfig"),
);
assert(
  "generic edit UI uses C2 generic Save executor",
  genericEditUiSrc.includes("executeSingleTextFieldOperationalNonDryRunSave"),
);
assert(
  "generic edit UI uses buildSingleTextFieldPayload",
  genericEditUiSrc.includes("buildSingleTextFieldPayload"),
);
assert(
  "per-field state map keyed by fieldName",
  genericEditUiSrc.includes("fieldStates") &&
    genericEditUiSrc.includes("Map<SingleTextFieldOperationalFieldName"),
);
assert(
  "per-field previewValid state",
  genericEditUiSrc.includes("previewValid") && genericEditUiSrc.includes("state.previewValid"),
);
assert(
  "per-field previewIdentity state",
  genericEditUiSrc.includes("previewIdentity") && genericEditUiSrc.includes("state.previewIdentity"),
);
assert(
  "per-field saveSuccess state",
  genericEditUiSrc.includes("saveSuccess") && genericEditUiSrc.includes("state.saveSuccess"),
);
assert(
  "uiIdPrefix resolved via config for DOM ids",
  genericEditUiSrc.includes("config.previewBtnId") &&
    genericEditUiSrc.includes("config.saveBtnId"),
);
assert(
  "changedFields single field only check on preview",
  genericEditUiSrc.includes("result.changedFields.length !== 1") &&
    genericEditUiSrc.includes("result.changedFields[0] !== entry.fieldName"),
);
assert(
  "re-click prevention via buildOperationalPreviewIdentity",
  genericEditUiSrc.includes("buildOperationalPreviewIdentity") &&
    genericEditUiSrc.includes("isOperationalSaveReclickBlocked"),
);
assert(
  "initSingleTextFieldOperationalEditUi export",
  genericEditUiSrc.includes("export function initSingleTextFieldOperationalEditUi"),
);
assert(
  "initAllSingleTextFieldOperationalEditUi export",
  genericEditUiSrc.includes("export function initAllSingleTextFieldOperationalEditUi"),
);
assert("generic edit UI no service_role", !genericEditUiSrc.includes("service_role"));
assert(
  "generic edit UI no schedule_months write",
  !genericEditUiSrc.includes("schedule_months"),
);

assert(
  "open_time edit-ui delegates to generic module",
  openTimeEditUiSrc.includes("staging-schedule-single-text-field-operational-edit-ui") &&
    openTimeEditUiSrc.includes('initSingleTextFieldOperationalEditUi("open_time")'),
);
assert(
  "initG9G4a2aOpenTimeOnlyOperationalEditUi export preserved",
  openTimeEditUiSrc.includes("export function initG9g4a2aOpenTimeOnlyOperationalEditUi"),
);
assert(
  "isG9g4a2aOpenTimeOnlyArmed export preserved",
  openTimeEditUiSrc.includes("export function isG9g4a2aOpenTimeOnlyArmed"),
);
assert(
  "canEnableG9G4a2aOpenTimeOnlySave export preserved",
  openTimeEditUiSrc.includes("export function canEnableG9g4a2aOpenTimeOnlySave"),
);
assert(
  "open_time delegate is thin wrapper",
  openTimeEditUiSrc.split("\n").length < 60,
);

assert(
  "open_time preview btn id unchanged",
  astroSrc.includes(`id="${OPEN_TIME_UI_PREFIX}-dry-run-preview-btn"`),
);
assert(
  "open_time save btn id unchanged",
  astroSrc.includes(`id="${OPEN_TIME_UI_PREFIX}-save-btn"`),
);
assert(
  "open_time save gate id unchanged",
  astroSrc.includes(`id="${OPEN_TIME_UI_PREFIX}-save-gate-panel"`),
);
assert(
  "registry open_time uiIdPrefix unchanged",
  registrySrc.includes(`uiIdPrefix: "${OPEN_TIME_UI_PREFIX}"`),
);

assert(
  "start_time panel ids match registry uiIdPrefix",
  astroSrc.includes(`id="${START_TIME_UI_PREFIX}-dry-run-preview-btn"`) &&
    astroSrc.includes(`id="${START_TIME_UI_PREFIX}-save-btn"`) &&
    astroSrc.includes(`id="${START_TIME_UI_PREFIX}-save-gate-panel"`),
);
assert(
  "price panel ids match registry uiIdPrefix",
  astroSrc.includes(`id="${PRICE_UI_PREFIX}-dry-run-preview-btn"`) &&
    astroSrc.includes(`id="${PRICE_UI_PREFIX}-save-btn"`) &&
    astroSrc.includes(`id="${PRICE_UI_PREFIX}-save-gate-panel"`),
);
assert(
  "registry start_time uiIdPrefix",
  registrySrc.includes(`uiIdPrefix: "${START_TIME_UI_PREFIX}"`),
);
assert(
  "registry price uiIdPrefix",
  registrySrc.includes(`uiIdPrefix: "${PRICE_UI_PREFIX}"`),
);

assert(
  "edit-ui init uses initAllSingleTextFieldOperationalEditUi",
  editUiSrc.includes("initAllSingleTextFieldOperationalEditUi"),
);
assert(
  "edit-ui invalidate uses invalidateAllSingleTextFieldOperationalPreviews",
  editUiSrc.includes("invalidateAllSingleTextFieldOperationalPreviews"),
);
assert(
  "edit-ui refresh uses refreshAllSingleTextFieldOperationalUiState",
  editUiSrc.includes("refreshAllSingleTextFieldOperationalUiState"),
);
assert(
  "edit-ui g9g3g blocks any single-text-field arm",
  editUiSrc.includes("isAnySingleTextFieldOperationalArmed"),
);

assert("binding g9g4a2aArmed", bindingSrc.includes("g9g4a2aArmed"));
assert("binding g9g4a2bArmed", bindingSrc.includes("g9g4a2bArmed"));
assert("binding g9g4a2cArmed", bindingSrc.includes("g9g4a2cArmed"));
assert("binding g9g4a2bSaveEnabled", bindingSrc.includes("g9g4a2bSaveEnabled"));
assert("binding g9g4a2cSaveEnabled", bindingSrc.includes("g9g4a2cSaveEnabled"));
assert(
  "binding uses getSingleTextFieldOperationalConfig for start_time",
  bindingSrc.includes('getSingleTextFieldOperationalConfig("start_time")'),
);
assert(
  "binding uses getSingleTextFieldOperationalConfig for price",
  bindingSrc.includes('getSingleTextFieldOperationalConfig("price")'),
);

assert(
  "astro data-g9g4a2b-armed dataset",
  astroSrc.includes("data-g9g4a2b-armed") && astroSrc.includes("data-g9g4a2c-armed"),
);
assert(
  "astro safety flags g9g4a2b/g9g4a2c",
  astroSrc.includes("g9g4a2bArmed") && astroSrc.includes("g9g4a2cArmed"),
);

assert(
  "no auto-click Preview in generic edit UI",
  !genericEditUiSrc.includes(".click()") && !genericEditUiSrc.includes("dispatchEvent"),
);
assert(
  "no auto-click Save in generic edit UI",
  !genericEditUiSrc.match(/saveBtn.*\.click\(/),
);
assert(
  "no production host write in generic edit UI",
  !genericEditUiSrc.includes("isKnownProductionHost") ||
    genericEditUiSrc.includes("productionBlocked"),
);

assert(
  "generic config references registry uiIdPrefix",
  configSrc.includes("buildSingleTextFieldUiElementIds") || configSrc.includes("uiIdPrefix"),
);
assert(
  "C2 generic Save still present for edit-ui wiring",
  genericSaveSrc.includes("executeSingleTextFieldOperationalNonDryRunSave"),
);

console.log(`\nSummary: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
