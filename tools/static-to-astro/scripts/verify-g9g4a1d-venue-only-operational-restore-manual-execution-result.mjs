/**
 * G-9g4a1d — Venue-only restore manual execution result (operator Save; Cursor did not click).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a1d-venue-only-operational-restore-manual-execution";
const NEXT_PHASE = "G-9g4a1e-venue-only-operational-restore-result-finalization";
const DOC_NAME =
  "staging-shell-schedule-venue-only-operational-restore-manual-execution-result.md";
const TARGET_ROW_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const TARGET_LEGACY_ID = "schedule-2026-03-003";
const SMOKE_VENUE = "学芸大学 珈琲美学 [G-9g4a1 venue smoke]";
const RESTORED_VENUE = "学芸大学 珈琲美学";
const BEFORE_UPDATED_AT = "2026-06-19T05:12:41.853845+00:00";
const AFTER_UPDATED_AT = "2026-06-19T05:54:34.767498+00:00";
const APPROVAL_ID = "G-9g4a1-schedule-site-slug-venue-only-non-dry-run";
const PRIOR_COMMIT = "3b3e4e0";

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
assert("restore execution result doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a1d", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("target row id exists", docSrc.includes(TARGET_ROW_ID));
assert("legacy_id exists", docSrc.includes(TARGET_LEGACY_ID));
assert("before smoke venue exists", docSrc.includes(SMOKE_VENUE));
assert("after restored venue exists", docSrc.includes(`"venue": "${RESTORED_VENUE}"`) || docSrc.includes(RESTORED_VENUE));
assert(
  "payload venue only exists",
  docSrc.includes('"venue": "学芸大学 珈琲美学"'),
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
  docSrc.includes("re-click: blocked") || docSrc.includes("Re-click blocked"),
);
assert("before updated_at exists", docSrc.includes(BEFORE_UPDATED_AT));
assert("after updated_at exists", docSrc.includes(AFTER_UPDATED_AT));
assert(
  "marker removed marker exists",
  docSrc.includes("markerRemoved: yes") || docSrc.includes("marker removed"),
);
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
assert("next phase G-9g4a1e exists", docSrc.includes(NEXT_PHASE));
assert(
  "cursor did not click Save",
  docSrc.includes("Save clicked (Cursor/AI) | **no**"),
);
assert(
  "cursor did not click Preview",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**"),
);
assert("prior commit 3b3e4e0", docSrc.includes(PRIOR_COMMIT));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a1d", currentStateSrc.includes("G-9g4a1d"));
assert("current state target row id", currentStateSrc.includes(TARGET_ROW_ID));
assert(
  "current state marker removed",
  currentStateSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "current state activeRestoreExceptionsCount 0",
  currentStateSrc.includes("activeRestoreExceptionsCount: 0"),
);
assert("next actions G-9g4a1e", nextActionsSrc.includes("G-9g4a1e"));
assert(
  "handoff G-9g4a1d complete",
  handoffSrc.includes("G-9g4a1d") && handoffSrc.includes("G-9g4a1e"),
);
assert("handoff final venue", handoffSrc.includes(RESTORED_VENUE));

console.log(`\nG-9g4a1d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
