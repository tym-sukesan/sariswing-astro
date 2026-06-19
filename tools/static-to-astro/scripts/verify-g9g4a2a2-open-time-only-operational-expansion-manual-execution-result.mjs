/**
 * G-9g4a2a2 — open_time-only manual execution result (operator Save; Cursor did not click).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a2a2-open-time-only-operational-expansion-manual-execution";
const NEXT_PHASE = "G-9g4a2a3-open-time-only-operational-restore-preflight";
const DOC_NAME =
  "staging-shell-schedule-open-time-only-operational-expansion-manual-execution-result.md";
const TARGET_ROW_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const TARGET_LEGACY_ID = "schedule-2026-03-003";
const BEFORE_OPEN_TIME = "11:30";
const AFTER_OPEN_TIME = "11:30 [G-9g4a2a open_time smoke]";
const RESTORE_TARGET = "11:30";
const AFTER_UPDATED_AT = "2026-06-19T07:14:34.018855+00:00";
const RESTORE_LOCK_BASELINE = "2026-06-19T07:14:34.018855+00:00";
const APPROVAL_ID = "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";

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
assert("execution result doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a2a2", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("target row id exists", docSrc.includes(TARGET_ROW_ID));
assert("legacy_id exists", docSrc.includes(TARGET_LEGACY_ID));
assert("before open_time exists", docSrc.includes(`"open_time": "${BEFORE_OPEN_TIME}"`));
assert("after smoke open_time exists", docSrc.includes(AFTER_OPEN_TIME));
assert(
  "payload open_time only exists",
  docSrc.includes('"open_time": "11:30 [G-9g4a2a open_time smoke]"') ||
    docSrc.includes(AFTER_OPEN_TIME),
);
assert("rowsAffected=1 exists", docSrc.includes("rowsAffected: 1"));
assert("actualWrite=true exists", docSrc.includes("actualWrite: true"));
assert("serviceRoleUsed=false exists", docSrc.includes("serviceRoleUsed: false"));
assert("productionBlocked=true exists", docSrc.includes("productionBlocked: true"));
assert(
  "scheduleMonthsTouched=false exists",
  docSrc.includes("scheduleMonthsTouched: false"),
);
assert("deleteEnabled=false exists", docSrc.includes("deleteEnabled: false"));
assert(
  "publishTriggered=false exists",
  docSrc.includes("publishTriggered: false"),
);
assert(
  "re-click blocked marker exists",
  docSrc.includes("re-click: blocked") ||
    docSrc.includes("Re-click blocked") ||
    docSrc.includes("PREVIEW_CONSUMED"),
);
assert("after updated_at exists", docSrc.includes(AFTER_UPDATED_AT));
assert(
  "marker remains marker exists",
  docSrc.includes("markerRemainsInStagingDb: true") ||
    docSrc.includes("marker remains"),
);
assert(
  "markerRemainsInStagingDb true exists",
  docSrc.includes("markerRemainsInStagingDb: true"),
);
assert(
  "activeRestoreExceptionsCount 1 exists",
  docSrc.includes("activeRestoreExceptionsCount: 1"),
);
assert(
  "restore required yes exists",
  docSrc.includes("restore required: yes") || docSrc.includes("restoreRequired: yes"),
);
assert("restore target exists", docSrc.includes(RESTORE_TARGET));
assert(
  "restore lock baseline exists",
  docSrc.includes(RESTORE_LOCK_BASELINE) || docSrc.includes("restore lock baseline"),
);
assert("next phase G-9g4a2a3 exists", docSrc.includes(NEXT_PHASE));
assert(
  "cursor did not click Save",
  docSrc.includes("Save clicked (Cursor/AI) | **no**"),
);
assert(
  "cursor did not click Preview",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a2a2", currentStateSrc.includes("G-9g4a2a2"));
assert("current state target row id", currentStateSrc.includes(TARGET_ROW_ID));
assert(
  "current state marker remains",
  currentStateSrc.includes("markerRemainsInStagingDb: true") ||
    currentStateSrc.includes(AFTER_OPEN_TIME),
);
assert("next actions G-9g4a2a3", nextActionsSrc.includes("G-9g4a2a3"));
assert(
  "handoff G-9g4a2a2",
  handoffSrc.includes("G-9g4a2a2") && handoffSrc.includes("G-9g4a2a3"),
);
assert(
  "handoff restore target",
  handoffSrc.includes(RESTORE_TARGET) || handoffSrc.includes(BEFORE_OPEN_TIME),
);

console.log(`\nG-9g4a2a2 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
