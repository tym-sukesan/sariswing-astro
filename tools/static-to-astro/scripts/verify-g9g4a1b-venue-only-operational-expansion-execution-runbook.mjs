/**
 * G-9g4a1b — Venue-only operational expansion execution runbook (no Save/Preview/DB/SQL by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a1b-venue-only-operational-expansion-execution-runbook";
const NEXT_PHASE = "G-9g4a1b1-venue-only-operational-expansion-manual-execution";
const PRIOR_COMMIT = "01e64af";
const DOC_NAME = "staging-shell-schedule-venue-only-operational-expansion-execution-runbook.md";

const PREVIEW_BTN_ID = "site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-g9g4a1-venue-only-dry-run-result";
const SAVE_GATE_ID = "site-slug-edit-g9g4a1-venue-only-save-gate-panel";
const SAVE_BTN_ID = "site-slug-edit-g9g4a1-venue-only-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g4a1-venue-only-save-result";

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
assert("execution runbook doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a1b", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert(
  "runbook-only marker",
  docSrc.includes("runbook only") || docSrc.includes("runbook documentation only"),
);
assert(
  "execution stack",
  docSrc.includes("Execution stack") || docSrc.includes("execution stack"),
);
assert(
  "routine dev stack",
  docSrc.includes("Routine dev stack") || docSrc.includes("routine dev stack"),
);
assert(
  "G-9g4a1 arm only",
  docSrc.includes("G-9g4a1 arm only") && docSrc.includes("on"),
);
assert(
  "G-9g3g arm off",
  docSrc.includes("G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED") &&
    docSrc.includes("off"),
);
assert(
  "G-9g3g5 arm off",
  docSrc.includes("G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED") &&
    docSrc.includes("off"),
);
assert("exact UI target preview btn", docSrc.includes(PREVIEW_BTN_ID));
assert("exact UI target preview result", docSrc.includes(PREVIEW_RESULT_ID));
assert("exact UI target save gate", docSrc.includes(SAVE_GATE_ID));
assert("exact UI target save btn", docSrc.includes(SAVE_BTN_ID));
assert("exact UI target save result", docSrc.includes(SAVE_RESULT_ID));
assert(
  "target row selection runbook",
  docSrc.includes("Target row selection runbook") ||
    docSrc.includes("target row selection"),
);
assert(
  "venue smoke value",
  docSrc.includes("Venue smoke value") || docSrc.includes("G-9g4a1 venue smoke"),
);
assert(
  "Preview step",
  docSrc.includes("Preview step") || docSrc.includes("Preview STOP"),
);
assert(
  "Preview STOP before Save",
  docSrc.includes("must not click Save until ChatGPT confirms"),
);
assert("Save step", docSrc.includes("Save step"));
assert(
  "Save exactly once",
  docSrc.includes("exactly once") && docSrc.includes("Save"),
);
assert(
  "Save result requirements",
  docSrc.includes("actualWrite: true") && docSrc.includes("rowsAffected: 1"),
);
assert(
  "re-click prevention",
  docSrc.includes("Re-click prevention") || docSrc.includes("re-click"),
);
assert(
  "restore follow-up",
  docSrc.includes("Restore follow-up") || docSrc.includes("restore chain"),
);
assert(
  "target row still unselected",
  docSrc.includes("targetRowSelected: false") ||
    docSrc.includes("Target row selected | **no**"),
);
assert("next phase G-9g4a1b1", docSrc.includes(NEXT_PHASE));
assert("no Save click marker", docSrc.includes("Save clicked (this phase) | **no**"));
assert(
  "no Preview click marker",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**"),
);
assert("no DB write marker", docSrc.includes("DB write executed (this phase) | **no**"));
assert(
  "no SQL execution marker",
  docSrc.includes("SQL mutation executed (this phase) | **no**"),
);
assert(
  "no FTP/deploy marker",
  docSrc.includes("FTP") && docSrc.includes("not executed"),
);
assert("prior commit 01e64af", docSrc.includes(PRIOR_COMMIT));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a1b", currentStateSrc.includes("G-9g4a1b"));
assert("current state 01e64af", currentStateSrc.includes("01e64af"));
assert("next actions G-9g4a1b1", nextActionsSrc.includes("G-9g4a1b1"));
assert(
  "handoff G-9g4a1b complete",
  handoffSrc.includes("G-9g4a1b") && handoffSrc.includes("G-9g4a1b1"),
);

console.log(`\nG-9g4a1b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
