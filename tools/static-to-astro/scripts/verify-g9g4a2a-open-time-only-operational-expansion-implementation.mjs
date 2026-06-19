/**
 * G-9g4a2a — open_time-only operational expansion implementation (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a2a-open-time-only-operational-expansion-implementation";
const NEXT_PHASE = "G-9g4a2a1-open-time-only-operational-expansion-preflight";
const PRIOR_COMMIT = "0d80d7d";
const APPROVAL_ID = "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED";
const G9G4A1_ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED";
const G9G3G_ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const G9G3G5_ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const PREVIEW_BTN_ID = "site-slug-edit-g9g4a2a-open-time-only-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-g9g4a2a-open-time-only-dry-run-result";
const SAVE_GATE_ID = "site-slug-edit-g9g4a2a-open-time-only-save-gate-panel";
const SAVE_BTN_ID = "site-slug-edit-g9g4a2a-open-time-only-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g4a2a-open-time-only-save-result";
const DOC_NAME = "staging-shell-schedule-open-time-only-operational-expansion-implementation.md";

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

const docPath = path.join(TOOL_ROOT, `docs/${DOC_NAME}`);
assert("implementation doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");
const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
const operationalConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-open-time-only-operational-config.ts",
);
const venueConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-venue-only-operational-config.ts",
);
const saveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-open-time-only-operational-save.ts",
);
const editUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-open-time-only-operational-edit-ui.ts",
);
const editBindingSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts",
);
const g9g3gConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts",
);
const g9g3g5ConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-restore-config.ts",
);
const reclickSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-save-reclick.ts",
);
const editSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert("phase G-9g4a2a", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("G-9g4a2 planning reference", docSrc.includes("G-9g4a2") || docSrc.includes(PRIOR_COMMIT));
assert(
  "G-9g4a1 pattern reference",
  docSrc.includes("G-9g4a1") || docSrc.includes("venue-only"),
);
assert("approval ID in doc", docSrc.includes(APPROVAL_ID));
assert("env arm in doc", docSrc.includes(ENV_ARM));
assert("target field open_time", docSrc.includes("open_time"));
assert(
  "payload exact open_time policy",
  docSrc.includes('"open_time"') && (docSrc.includes("{ \"open_time\"") || docSrc.includes("open_time")),
);
assert(
  "changedFields exactly open_time",
  docSrc.includes('["open_time"]') || docSrc.includes("changedFields: [\"open_time\"]"),
);
assert(
  "open_time-only guard design",
  docSrc.includes("assertG9G4a2aOpenTimeOnlyPayloadOnly") ||
    docSrc.includes("open_time-only guard"),
);
assert(
  "forbidden payload fields documented",
  docSrc.includes("venue") && docSrc.includes("start_time") && docSrc.includes("title"),
);
assert("optimistic lock in doc", docSrc.includes("optimistic lock") || docSrc.includes("expectedBeforeUpdatedAt"));
assert("re-click prevention in doc", docSrc.includes("re-click") || docSrc.includes("Re-click"));
assert(
  "mutual exclusion in doc",
  docSrc.includes(G9G4A1_ENV_ARM) &&
    docSrc.includes(G9G3G_ENV_ARM) &&
    docSrc.includes(G9G3G5_ENV_ARM),
);
assert("serviceRoleUsed=false policy", docSrc.includes("serviceRoleUsed") && docSrc.includes("false"));
assert(
  "productionBlocked=true policy",
  docSrc.includes("productionBlocked") && docSrc.includes("true"),
);
assert("routine dev safety in doc", docSrc.includes("ENABLE_ADMIN_STAGING_WRITE=false"));
assert("UI gate/button IDs in doc", docSrc.includes(PREVIEW_BTN_ID));
assert("next phase G-9g4a2a1", docSrc.includes(NEXT_PHASE));
assert("no Save click marker", docSrc.includes("Save clicked (this phase) | **no**"));
assert("no Preview click marker", docSrc.includes("Preview clicked (Cursor/AI) | **no**"));
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no SQL marker", docSrc.includes("SQL mutation executed (this phase) | **no**"));
assert(
  "no FTP/deploy marker",
  docSrc.includes("FTP") && docSrc.includes("not executed"),
);

assert("approval ID registered in types", typesSrc.includes(APPROVAL_ID));
assert("G9G4A2A executor", saveSrc.includes("executeG9G4a2aOpenTimeOnlyNonDryRunSave"));
assert(
  "assertG9G4a2aOpenTimeOnlyPayloadOnly",
  guardsSrc.includes("assertG9G4a2aOpenTimeOnlyPayloadOnly"),
);
assert(
  "assertG9G4a2aOpenTimeOnlyChangedFieldsOnly",
  guardsSrc.includes("assertG9G4a2aOpenTimeOnlyChangedFieldsOnly"),
);
assert(
  "assertG9G4a2aNoRouteDatePublicationImageMutation",
  guardsSrc.includes("assertG9G4a2aNoRouteDatePublicationImageMutation"),
);
assert(
  "assertG9G4a2aOpenTimeOnlyWritableRow",
  guardsSrc.includes("assertG9G4a2aOpenTimeOnlyWritableRow"),
);
assert("buildG9G4a2aOpenTimeOnlyPayload", guardsSrc.includes("buildG9G4a2aOpenTimeOnlyPayload"));
assert("env arm in config", configSrc.includes(ENV_ARM));
assert(
  "g9g4a2a mutual exclusion in g9g3g config",
  g9g3gConfigSrc.includes("SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV") &&
    g9g3gConfigSrc.includes("must be off"),
);
assert(
  "g9g4a2a mutual exclusion in g9g3g5 config",
  g9g3g5ConfigSrc.includes("SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV") &&
    g9g3g5ConfigSrc.includes("must be off"),
);
assert(
  "g9g4a2a mutual exclusion in g9g4a1 config",
  venueConfigSrc.includes("SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV") &&
    venueConfigSrc.includes("must be off"),
);
assert(
  "g9g4a1 mutual exclusion in g9g4a2a config",
  operationalConfigSrc.includes("SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV") &&
    operationalConfigSrc.includes("must be off"),
);
assert("open_time-only UI module", editUiSrc.includes("canEnableG9g4a2aOpenTimeOnlySave"));
assert("binding g9g4a2aArmed", editBindingSrc.includes("g9g4a2aArmed"));
assert("re-click mode open-time-only", reclickSrc.includes('"open-time-only"'));
assert("preview button in template", editSectionSrc.includes(`id="${PREVIEW_BTN_ID}"`));
assert("preview result in template", editSectionSrc.includes(`id="${PREVIEW_RESULT_ID}"`));
assert("save gate in template", editSectionSrc.includes(`id="${SAVE_GATE_ID}"`));
assert("save button in template", editSectionSrc.includes(`id="${SAVE_BTN_ID}"`));
assert("save result in template", editSectionSrc.includes(`id="${SAVE_RESULT_ID}"`));
assert(
  "save button disabled by default",
  editSectionSrc.includes(`id="${SAVE_BTN_ID}"`) && editSectionSrc.includes("disabled={true}"),
);
assert("no service_role in executor", !saveSrc.includes("service_role"));
assert(
  "productionBlocked in save executor",
  saveSrc.includes("productionBlocked") && saveSrc.includes("true"),
);
assert(
  "serviceRoleUsed false in save executor",
  saveSrc.includes("serviceRoleUsed") && saveSrc.includes("false"),
);

const previewValidIdx = editUiSrc.indexOf("g9g4a2aOpenTimeOnlyPreviewValid = true");
const saveClickIdx = editUiSrc.indexOf("async function onG9g4a2aOpenTimeOnlySaveClick");
const previewSuccessSlice =
  previewValidIdx >= 0 && saveClickIdx > previewValidIdx
    ? editUiSrc.slice(previewValidIdx, saveClickIdx)
    : "";
assert(
  "preview success refresh save button after previewValid",
  previewSuccessSlice.includes("refreshG9g4a2aOpenTimeOnlySaveButtonState()"),
);
assert(
  "preview success refresh save gate after previewValid",
  previewSuccessSlice.includes("refreshG9g4a2aOpenTimeOnlySaveGatePanel()"),
);
assert(
  "save completed msg conditional on g9g4a2aOpenTimeOnlySaveSuccess",
  editUiSrc.includes("if (g9g4a2aOpenTimeOnlySaveSuccess)") &&
    editUiSrc.includes("lines.push(G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG)"),
);
const gatePanelFnStart = editUiSrc.indexOf("export function refreshG9g4a2aOpenTimeOnlySaveGatePanel");
const gatePanelFnEnd = editUiSrc.indexOf("function refreshG9g4a2aOpenTimeOnlyPreviewButtonState");
const gatePanelSlice =
  gatePanelFnStart >= 0 && gatePanelFnEnd > gatePanelFnStart
    ? editUiSrc.slice(gatePanelFnStart, gatePanelFnEnd)
    : "";
assert(
  "save completed msg not unconditional in gate panel",
  !gatePanelSlice.includes("G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG,"),
);
assert(
  "preview valid gate copy",
  gatePanelSlice.includes('"preview: valid"'),
);
assert(
  "preview consumed after save success",
  editUiSrc.includes("invalidateG9g4a2aOpenTimeOnlyPreview") &&
    editUiSrc.includes("g9g4a2aOpenTimeOnlySaveSuccess"),
);
assert(
  "loaded open_time updated after save",
  editUiSrc.includes("site-slug-edit-loaded-open-time"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a2a", currentStateSrc.includes("G-9g4a2a"));
assert("current state G-9g4a2 planning at 0d80d7d", currentStateSrc.includes("0d80d7d"));
assert(
  "current state implementation complete",
  currentStateSrc.includes("implementation complete") || currentStateSrc.includes("implementation **complete**"),
);
assert(
  "next actions G-9g4a2a1 or framework",
  nextActionsSrc.includes("G-9g4a2a") || nextActionsSrc.includes("G-9g4a2-framework"),
);
assert("handoff G-9g4a2a", handoffSrc.includes("G-9g4a2a"));
assert(
  "handoff no Preview/Save executed",
  handoffSrc.includes("Preview") && handoffSrc.includes("no"),
);

console.log(`\nG-9g4a2a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
