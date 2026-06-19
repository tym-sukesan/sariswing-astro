/**
 * G-9g4a2a — open_time-only operational restore and closure (doc/verifier/AI only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a2a-open-time-only-operational-restore-and-closure";
const NEXT_PHASE = "G-9g4a2-framework-single-text-field-operational-commonization-planning";
const DOC_NAME = "staging-shell-schedule-open-time-only-operational-restore-and-closure.md";
const TARGET_ROW_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const TARGET_LEGACY_ID = "schedule-2026-03-003";
const SMOKE_OPEN_TIME = "11:30 [G-9g4a2a open_time smoke]";
const FINAL_OPEN_TIME = "11:30";
const FINAL_UPDATED_AT = "2026-06-19T07:27:53.256604+00:00";
const PRIOR_COMMIT = "54623a1";

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
assert("closure doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a2a restore-and-closure", docSrc.includes(PHASE));
assert("status complete exists", docSrc.includes("**complete**"));
assert(
  "open_time restore result exists",
  docSrc.includes("Restore Save summary") && docSrc.includes("actualWrite: true"),
);
assert("before smoke open_time exists", docSrc.includes(SMOKE_OPEN_TIME));
assert("final open_time 11:30 exists", docSrc.includes(`open_time: ${FINAL_OPEN_TIME}`));
assert("target row id exists", docSrc.includes(TARGET_ROW_ID));
assert("legacy_id exists", docSrc.includes(TARGET_LEGACY_ID));
assert("rowsAffected=1 exists", docSrc.includes("rowsAffected: 1"));
assert(
  'changedFields ["open_time"] exists',
  docSrc.includes('changedFields: ["open_time"]'),
);
assert("G-9g4a2a2 Save success summary", docSrc.includes("G-9g4a2a2 smoke Save summary"));
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
  docSrc.includes("re-click: blocked"),
);
assert("after updated_at exists", docSrc.includes(FINAL_UPDATED_AT));
assert(
  "markerRemainsInStagingDb false exists",
  docSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "activeRestoreExceptionsCount 0 exists",
  docSrc.includes("activeRestoreExceptionsCount: 0"),
);
assert(
  "restore required no exists",
  docSrc.includes("restore required: no") || docSrc.includes("restoreRequired: false"),
);
assert(
  "no further Save restore needed exists",
  docSrc.includes("no further Save / restore needed") ||
    docSrc.includes("No further Save or restore needed"),
);
assert(
  "policy change against repeated per-field manual round-trips exists",
  docSrc.includes("Do **not** repeat full manual round-trip") ||
    docSrc.includes("do not repeat full manual round-trip"),
);
assert(
  "common single-text-field framework planning next phase exists",
  docSrc.includes(NEXT_PHASE),
);
assert("round-trip complete", docSrc.includes("Round-trip complete"));
assert("prior commit 54623a1", docSrc.includes(PRIOR_COMMIT));
assert(
  "no UI operation marker exists",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**") &&
    docSrc.includes("Save clicked (Cursor/AI) | **no**"),
);
assert(
  "no DB write by Cursor marker exists",
  docSrc.includes("DB write executed (Cursor/AI) | **no**"),
);
assert(
  "no SQL execution marker exists",
  docSrc.includes("SQL mutation executed (Cursor/AI) | **no**"),
);
assert(
  "no FTP/deploy marker exists",
  docSrc.includes("FTP / workflow_dispatch / deploy") &&
    docSrc.includes("not executed"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert(
  "current state open_time round-trip complete",
  currentStateSrc.includes("round-trip complete") ||
    currentStateSrc.includes("restore-and-closure"),
);
assert(
  "current state markerRemainsInStagingDb false",
  currentStateSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "current state activeRestoreExceptionsCount 0",
  currentStateSrc.includes("activeRestoreExceptionsCount: 0"),
);
assert("next actions framework planning", nextActionsSrc.includes("G-9g4a2-framework"));
assert(
  "handoff closure or framework",
  handoffSrc.includes("restore-and-closure") || handoffSrc.includes("G-9g4a2-framework"),
);
assert("handoff final open_time 11:30", handoffSrc.includes(FINAL_OPEN_TIME));

console.log(`\nG-9g4a2a restore-and-closure verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
