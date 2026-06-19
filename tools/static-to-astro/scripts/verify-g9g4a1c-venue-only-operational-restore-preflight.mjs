/**
 * G-9g4a1c — Venue-only operational restore preflight (no Save/Preview/DB/SQL by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a1c-venue-only-operational-restore-preflight";
const NEXT_PHASE = "G-9g4a1d-venue-only-operational-restore-manual-execution";
const PRIOR_COMMIT = "11368be";
const DOC_NAME = "staging-shell-schedule-venue-only-operational-restore-preflight.md";
const TARGET_ROW_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const TARGET_LEGACY_ID = "schedule-2026-03-003";
const SMOKE_VENUE = "学芸大学 珈琲美学 [G-9g4a1 venue smoke]";
const RESTORE_VENUE = "学芸大学 珈琲美学";
const LOCK_BASELINE = "2026-06-19T05:12:41.853845+00:00";
const PREVIEW_BTN_ID = "site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn";
const SAVE_BTN_ID = "site-slug-edit-g9g4a1-venue-only-save-btn";

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
assert("restore preflight doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a1c", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("target row id exists", docSrc.includes(TARGET_ROW_ID));
assert("legacy_id exists", docSrc.includes(TARGET_LEGACY_ID));
assert("current smoke venue exists", docSrc.includes(SMOKE_VENUE));
assert("restore venue exists", docSrc.includes(RESTORE_VENUE));
assert("expectedBeforeUpdatedAt exists", docSrc.includes(LOCK_BASELINE));
assert(
  "payload venue only exists",
  docSrc.includes('"venue": "学芸大学 珈琲美学"'),
);
assert(
  "changedFields venue only exists",
  docSrc.includes('["venue"]') || docSrc.includes("changedFields: venue"),
);
assert(
  "env stack",
  docSrc.includes("Env stack") || docSrc.includes("env stack"),
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
assert("UI target preview btn", docSrc.includes(PREVIEW_BTN_ID));
assert("UI target save btn", docSrc.includes(SAVE_BTN_ID));
assert(
  "rollback SQL document-only",
  docSrc.includes("Rollback SQL") || docSrc.includes("document-only"),
);
assert(
  "SQL do-not-run marker",
  docSrc.includes("DO NOT RUN") && docSrc.includes("G-9g4a1c restore preflight"),
);
assert(
  "marker remains marker exists",
  docSrc.includes("markerRemainsInStagingDb: true"),
);
assert("next phase G-9g4a1d", docSrc.includes(NEXT_PHASE));
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
assert("prior commit 11368be", docSrc.includes(PRIOR_COMMIT));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a1c", currentStateSrc.includes("G-9g4a1c"));
assert("current state 11368be", currentStateSrc.includes("11368be"));
assert("current state marker remains", currentStateSrc.includes("markerRemainsInStagingDb: true"));
assert("next actions G-9g4a1d", nextActionsSrc.includes("G-9g4a1d"));
assert(
  "handoff G-9g4a1c complete",
  handoffSrc.includes("G-9g4a1c") && handoffSrc.includes("G-9g4a1d"),
);

console.log(`\nG-9g4a1c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
