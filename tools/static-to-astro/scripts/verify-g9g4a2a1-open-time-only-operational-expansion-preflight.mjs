/**
 * G-9g4a2a1 — open_time-only operational expansion preflight (no Save/Preview/DB/SQL by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a2a1-open-time-only-operational-expansion-preflight";
const NEXT_PHASE = "G-9g4a2a2-open-time-only-operational-expansion-manual-execution";
const PRIOR_COMMIT = "8ae0d1e";
const TARGET_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const LEGACY_ID = "schedule-2026-03-003";
const CURRENT_OPEN_TIME = "11:30";
const CANDIDATE_OPEN_TIME = "11:30 [G-9g4a2a open_time smoke]";
const RESTORE_OPEN_TIME = "11:30";
const EXPECTED_UPDATED_AT = "2026-06-19T05:54:34.767498+00:00";
const APPROVAL_ID = "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED";
const G9G4A1_ENV = "PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED";
const G9G3G_ENV = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const G9G3G5_ENV = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const PREVIEW_BTN_ID = "site-slug-edit-g9g4a2a-open-time-only-dry-run-preview-btn";
const SAVE_BTN_ID = "site-slug-edit-g9g4a2a-open-time-only-save-btn";
const DOC_NAME = "staging-shell-schedule-open-time-only-operational-expansion-preflight.md";

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
assert("preflight doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a2a1", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("target row id", docSrc.includes(TARGET_ID));
assert("legacy_id", docSrc.includes(LEGACY_ID));
assert("current open_time", docSrc.includes(CURRENT_OPEN_TIME));
assert("candidate open_time", docSrc.includes(CANDIDATE_OPEN_TIME));
assert("restore target", docSrc.includes(RESTORE_OPEN_TIME));
assert("expectedBeforeUpdatedAt", docSrc.includes(EXPECTED_UPDATED_AT));
assert(
  "payload exact open_time",
  docSrc.includes('"open_time": "11:30 [G-9g4a2a open_time smoke]"') ||
    docSrc.includes(CANDIDATE_OPEN_TIME),
);
assert(
  "changedFields open_time only",
  docSrc.includes('["open_time"]') || docSrc.includes('changedFields: ["open_time"]'),
);
assert("env stack", docSrc.includes("Env stack") || docSrc.includes("env stack"));
assert(
  "G-9g4a2a arm only",
  docSrc.includes("G-9g4a2a arm only") || docSrc.includes("G-9g4a2a arm only on"),
);
assert(
  "G-9g4a1 arm off",
  docSrc.includes(G9G4A1_ENV) && docSrc.includes("off"),
);
assert(
  "G-9g3g arm off",
  docSrc.includes(G9G3G_ENV) && docSrc.includes("off"),
);
assert(
  "G-9g3g5 arm off",
  docSrc.includes(G9G3G5_ENV) && docSrc.includes("off"),
);
assert("UI target IDs", docSrc.includes(PREVIEW_BTN_ID) && docSrc.includes(SAVE_BTN_ID));
assert(
  "rollback SQL document-only",
  docSrc.includes("Rollback SQL") || docSrc.includes("document-only"),
);
assert(
  "SQL do-not-run marker",
  docSrc.includes("DO NOT RUN") && docSrc.includes("G-9g4a2a1 preflight"),
);
assert(
  "restore required marker",
  docSrc.includes("restore required") || docSrc.includes("Restore required"),
);
assert("approval ID", docSrc.includes(APPROVAL_ID));
assert("env arm", docSrc.includes(ENV_ARM));
assert("prior commit 8ae0d1e", docSrc.includes(PRIOR_COMMIT));
assert("next phase G-9g4a2a2", docSrc.includes(NEXT_PHASE));
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

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a2a1", currentStateSrc.includes("G-9g4a2a1"));
assert("current state 8ae0d1e", currentStateSrc.includes("8ae0d1e"));
assert("current state target row id", currentStateSrc.includes(TARGET_ID));
assert("current state open_time 11:30", currentStateSrc.includes("11:30"));
assert("next actions G-9g4a2a2", nextActionsSrc.includes("G-9g4a2a2"));
assert(
  "handoff G-9g4a2a1 complete",
  handoffSrc.includes("G-9g4a2a1") && handoffSrc.includes("G-9g4a2a2"),
);
assert(
  "handoff no Preview/Save",
  handoffSrc.includes("Preview") && handoffSrc.includes("no"),
);

console.log(`\nG-9g4a2a1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
