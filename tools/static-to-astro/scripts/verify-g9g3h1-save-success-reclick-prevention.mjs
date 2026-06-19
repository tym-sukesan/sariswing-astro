/**
 * G-9g3h1 — Save success re-click prevention implementation (no Save / DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h1-save-success-reclick-prevention";
const NEXT_PHASE = "G-9g3h1a-save-success-reclick-prevention-smoke-test";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const GATE_PANEL_ID = "site-slug-edit-save-gate-panel";
const PRIOR_COMMIT = "972e640";

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
  "docs/staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md",
);
assert("implementation doc exists", fs.existsSync(implDocPath));
const implDocSrc = fs.readFileSync(implDocPath, "utf8");

assert("phase G-9g3h1", implDocSrc.includes(PHASE));
assert("status implementation complete", implDocSrc.includes("implementation complete"));
assert(
  "Save success re-click prevention marker",
  implDocSrc.includes("re-click prevention") ||
    implDocSrc.includes("Re-click is blocked"),
);
assert(
  "consumed preview marker",
  implDocSrc.includes("consumed preview") || implDocSrc.includes("preview consumed"),
);
assert(
  "fresh Preview required marker",
  implDocSrc.includes("fresh Preview required"),
);
assert(
  "general operational mode covered",
  implDocSrc.includes("General operational mode") ||
    implDocSrc.includes("G-9g3g"),
);
assert(
  "restore mode covered",
  implDocSrc.includes("Restore mode") || implDocSrc.includes("G-9g3g5"),
);
assert(
  "Save button disabled after success marker",
  implDocSrc.includes("Save disabled") || implDocSrc.includes("Save button **disabled**"),
);
assert(
  "result panel executed-state marker",
  implDocSrc.includes("executed-state"),
);
assert(
  "gate panel copy marker",
  implDocSrc.includes(GATE_PANEL_ID) || implDocSrc.includes("gate panel"),
);
assert(
  "no Save clicked marker",
  implDocSrc.includes("Save clicked (this phase) | **no**"),
);
assert(
  "no DB write marker",
  implDocSrc.includes("DB write executed (this phase) | **no**"),
);
assert("next phase G-9g3h1a", implDocSrc.includes(NEXT_PHASE));
assert("prior commit 972e640", implDocSrc.includes(PRIOR_COMMIT));

const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const reclickSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-save-reclick.ts",
);
const generalSaveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-operational-general-edit-save.ts",
);
const restoreSaveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-operational-restore-save.ts",
);
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");

assert("reclick module exists", reclickSrc.includes("buildOperationalPreviewIdentity"));
assert("operationalSaveSuccess in UI", editUiSrc.includes("operationalSaveSuccess"));
assert("checkOperationalSaveReclickGate in UI", editUiSrc.includes("checkOperationalSaveReclickGate"));
assert("clearPreviewState in UI", editUiSrc.includes("clearPreviewState"));
assert("G9G3H1_SAVE_SUCCESS_BLOCKED_MSG in UI", editUiSrc.includes("G9G3H1_SAVE_SUCCESS_BLOCKED_MSG"));
assert("G9G3H1_PREVIEW_CONSUMED_MSG in UI", editUiSrc.includes("G9G3H1_PREVIEW_CONSUMED_MSG"));
assert(`Save button id ${SAVE_BTN_ID}`, editUiSrc.includes(SAVE_BTN_ID));
assert(`Save result id ${SAVE_RESULT_ID}`, editUiSrc.includes(SAVE_RESULT_ID));
assert(`gate panel id ${GATE_PANEL_ID}`, editUiSrc.includes(GATE_PANEL_ID));
assert("previewIdentity on binding", generalSaveSrc.includes("previewIdentity"));
assert("consumedPreviewIdentity on binding", generalSaveSrc.includes("consumedPreviewIdentity"));
assert("preview_consumed in general save", generalSaveSrc.includes("preview_consumed"));
assert("preview_consumed in restore save", restoreSaveSrc.includes("preview_consumed"));
assert("assertOperationalPreviewNotConsumed", guardsSrc.includes("assertOperationalPreviewNotConsumed"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g3h1", currentStateSrc.includes("G-9g3h1"));
assert("current state 8780f84", currentStateSrc.includes("8780f84"));
assert("next actions G-9g3h1a", nextActionsSrc.includes("G-9g3h1a"));
assert(
  "handoff reclick prevention",
  handoffSrc.includes("reclick") || handoffSrc.includes("G-9g3h1"),
);

console.log(`\nG-9g3h1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
