/**
 * G-9g4a1 — Venue-only operational expansion implementation (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a1-venue-only-operational-expansion-implementation";
const NEXT_PHASE = "G-9g4a1a-venue-only-operational-expansion-preflight";
const PRIOR_COMMIT = "9a38c11";
const APPROVAL_ID = "G-9g4a1-schedule-site-slug-venue-only-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED";
const PREVIEW_BTN_ID = "site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-g9g4a1-venue-only-dry-run-result";
const SAVE_GATE_ID = "site-slug-edit-g9g4a1-venue-only-save-gate-panel";
const SAVE_BTN_ID = "site-slug-edit-g9g4a1-venue-only-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g4a1-venue-only-save-result";
const DOC_NAME = "staging-shell-schedule-venue-only-operational-expansion-implementation.md";

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
  "src/lib/admin/staging-data/staging-schedule-site-slug-venue-only-operational-config.ts",
);
const saveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-venue-only-operational-save.ts",
);
const editUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-venue-only-operational-edit-ui.ts",
);
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
const g9g3gConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts",
);

assert("phase G-9g4a1", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("approval ID in doc", docSrc.includes(APPROVAL_ID));
assert("env arm in doc", docSrc.includes(ENV_ARM));
assert(
  "venue-only guard design",
  docSrc.includes("assertG9G4a1VenueOnlyPayloadOnly") ||
    docSrc.includes("Venue-only guard"),
);
assert(
  "changedFields exactly venue",
  docSrc.includes('["venue"]') || docSrc.includes("changedFields: venue"),
);
assert(
  "payload exactly venue",
  docSrc.includes("{ venue") || docSrc.includes("venue only"),
);
assert(
  "no route/date/month",
  docSrc.includes("date") && docSrc.includes("source_route"),
);
assert(
  "no publication/image",
  docSrc.includes("published") && docSrc.includes("image_url"),
);
assert("UI gate/button IDs in doc", docSrc.includes(PREVIEW_BTN_ID));
assert("Preview behavior in doc", docSrc.includes("actualWrite"));
assert("Save behavior in doc", docSrc.includes("disabled=true") || docSrc.includes("disabled"));
assert("re-click prevention in doc", docSrc.includes("re-click") || docSrc.includes("Re-click"));
assert("row selection strategy in doc", docSrc.includes("Option A"));
assert("smoke candidate in doc", docSrc.includes("G-9g4a1 venue smoke"));
assert("restore strategy placeholder in doc", docSrc.includes("G-9g4a1b"));
assert("next phase G-9g4a1a", docSrc.includes(NEXT_PHASE));
assert("no Save click marker", docSrc.includes("Save clicked (this phase) | **no**"));
assert("no Preview click marker", docSrc.includes("Preview clicked (Cursor/AI) | **no**"));
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert("no SQL marker", docSrc.includes("SQL mutation executed (this phase) | **no**"));
assert(
  "no FTP/deploy marker",
  docSrc.includes("FTP") && docSrc.includes("not executed"),
);

assert("approval ID registered in types", typesSrc.includes(APPROVAL_ID));
assert("G9G4A1 executor", saveSrc.includes("executeG9G4a1VenueOnlyNonDryRunSave"));
assert("assertG9G4a1VenueOnlyPayloadOnly", guardsSrc.includes("assertG9G4a1VenueOnlyPayloadOnly"));
assert(
  "assertG9G4a1VenueOnlyChangedFieldsOnly",
  guardsSrc.includes("assertG9G4a1VenueOnlyChangedFieldsOnly"),
);
assert(
  "assertG9G4a1NoRouteDatePublicationImageMutation",
  guardsSrc.includes("assertG9G4a1NoRouteDatePublicationImageMutation"),
);
assert("assertG9G4a1VenueOnlyWritableRow", guardsSrc.includes("assertG9G4a1VenueOnlyWritableRow"));
assert("env arm in config", configSrc.includes(ENV_ARM));
assert(
  "g9g4a1 mutual exclusion in g9g3g config",
  g9g3gConfigSrc.includes("SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV") &&
    g9g3gConfigSrc.includes("must be off"),
);
assert("venue-only UI module", editUiSrc.includes("canEnableG9g4a1VenueOnlySave"));
assert("binding g9g4a1Armed", editBindingSrc.includes("g9g4a1Armed"));
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

const previewValidIdx = editUiSrc.indexOf("g9g4a1VenueOnlyPreviewValid = true");
const saveClickIdx = editUiSrc.indexOf("async function onG9g4a1VenueOnlySaveClick");
const previewSuccessSlice =
  previewValidIdx >= 0 && saveClickIdx > previewValidIdx
    ? editUiSrc.slice(previewValidIdx, saveClickIdx)
    : "";
assert(
  "preview success refresh save button after previewValid",
  previewSuccessSlice.includes("refreshG9g4a1VenueOnlySaveButtonState()"),
);
assert(
  "preview success refresh save gate after previewValid",
  previewSuccessSlice.includes("refreshG9g4a1VenueOnlySaveGatePanel()"),
);
assert(
  "save completed msg conditional on g9g4a1VenueOnlySaveSuccess",
  editUiSrc.includes("if (g9g4a1VenueOnlySaveSuccess)") &&
    editUiSrc.includes("lines.push(G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG)"),
);
const gatePanelFnStart = editUiSrc.indexOf("export function refreshG9g4a1VenueOnlySaveGatePanel");
const gatePanelFnEnd = editUiSrc.indexOf("function refreshG9g4a1VenueOnlyPreviewButtonState");
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
  "preview gate sync fix documented",
  docSrc.includes("gate sync") || docSrc.includes("refresh after preview"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a1", currentStateSrc.includes("G-9g4a1"));
assert(
  "current state 49986c1 or G-9g4a1a",
  currentStateSrc.includes("49986c1") || currentStateSrc.includes("G-9g4a1a"),
);
assert(
  "next actions G-9g4a1a or G-9g4a1b",
  nextActionsSrc.includes("G-9g4a1"),
);
assert(
  "handoff G-9g4a1",
  handoffSrc.includes("G-9g4a1"),
);
assert(
  "current state gate sync fix",
  currentStateSrc.includes("gate sync") || currentStateSrc.includes("Save gate sync"),
);

console.log(`\nG-9g4a1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
