/**
 * G-9g4a1b1 — Venue-only manual execution result (operator Save; Cursor did not click).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a1b1-venue-only-operational-expansion-manual-execution";
const NEXT_PHASE = "G-9g4a1c-venue-only-operational-restore-preflight";
const DOC_NAME =
  "staging-shell-schedule-venue-only-operational-expansion-manual-execution-result.md";
const TARGET_ROW_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const TARGET_LEGACY_ID = "schedule-2026-03-003";
const BEFORE_VENUE = "学芸大学 珈琲美学";
const AFTER_VENUE = "学芸大学 珈琲美学 [G-9g4a1 venue smoke]";
const AFTER_UPDATED_AT = "2026-06-19T05:12:41.853845+00:00";
const APPROVAL_ID = "G-9g4a1-schedule-site-slug-venue-only-non-dry-run";

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

assert("phase G-9g4a1b1", docSrc.includes(PHASE));
assert("status complete", docSrc.includes("**complete**"));
assert("target row id exists", docSrc.includes(TARGET_ROW_ID));
assert("legacy_id exists", docSrc.includes(TARGET_LEGACY_ID));
assert("before venue exists", docSrc.includes(BEFORE_VENUE));
assert("after venue exists", docSrc.includes(AFTER_VENUE));
assert(
  "payload venue only exists",
  docSrc.includes('"venue": "学芸大学 珈琲美学 [G-9g4a1 venue smoke]"') ||
    docSrc.includes(AFTER_VENUE),
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
  "restore required marker exists",
  docSrc.includes("restore required: yes") || docSrc.includes("restoreRequired: true"),
);
assert("next phase G-9g4a1c exists", docSrc.includes(NEXT_PHASE));
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

assert("current state G-9g4a1b1", currentStateSrc.includes("G-9g4a1b1"));
assert("current state target row id", currentStateSrc.includes(TARGET_ROW_ID));
assert("current state marker remains", currentStateSrc.includes("markerRemainsInStagingDb: true"));
assert("next actions G-9g4a1c", nextActionsSrc.includes("G-9g4a1c"));
assert("handoff G-9g4a1b1 complete", handoffSrc.includes("G-9g4a1b1"));
assert("handoff restore target", handoffSrc.includes(BEFORE_VENUE));

console.log(`\nG-9g4a1b1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
