/**
 * G-9g4a1e — Venue-only operational restore result finalization (doc/verifier/AI only).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a1e-venue-only-operational-restore-result-finalization";
const NEXT_PHASE = "G-9g4a2-text-fields-operational-expansion-planning";
const DOC_NAME =
  "staging-shell-schedule-venue-only-operational-restore-result-finalization.md";
const TARGET_ROW_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const TARGET_LEGACY_ID = "schedule-2026-03-003";
const FINAL_VENUE = "学芸大学 珈琲美学";
const FINAL_UPDATED_AT = "2026-06-19T05:54:34.767498+00:00";
const PRIOR_COMMIT = "82e1aaa";

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
assert("finalization doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a1e exists", docSrc.includes(PHASE));
assert("status complete exists", docSrc.includes("**complete**"));
assert("target row id exists", docSrc.includes(TARGET_ROW_ID));
assert("legacy_id exists", docSrc.includes(TARGET_LEGACY_ID));
assert("final venue exists", docSrc.includes(FINAL_VENUE));
assert("final updated_at exists", docSrc.includes(FINAL_UPDATED_AT));
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
  docSrc.includes("No further Save or restore needed") ||
    docSrc.includes("no further Save / restore needed"),
);
assert(
  "round-trip complete marker exists",
  docSrc.includes("Round-trip complete") || docSrc.includes("round-trip complete"),
);
assert(
  "G-9g4a1b1 write success marker exists",
  docSrc.includes("G-9g4a1b1") && docSrc.includes("actualWrite: true"),
);
assert(
  "G-9g4a1d restore success marker exists",
  docSrc.includes("G-9g4a1d") && docSrc.includes("actualWrite: true"),
);
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
  "routine dev stack exists",
  docSrc.includes("ENABLE_ADMIN_STAGING_WRITE=false") &&
    docSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"),
);
assert(
  "G-9g4a1 arm off marker exists",
  docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false"),
);
assert(
  "G-9g3g arm off marker exists",
  docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false"),
);
assert(
  "G-9g3g5 arm off marker exists",
  docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false"),
);
assert("next phase G-9g4a2 exists", docSrc.includes(NEXT_PHASE));
assert(
  "no UI operation marker exists",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**") &&
    docSrc.includes("Save clicked (Cursor/AI) | **no**"),
);
assert(
  "no DB write marker exists",
  docSrc.includes("DB write executed (this phase) | **no**"),
);
assert(
  "no SQL execution marker exists",
  docSrc.includes("SQL mutation executed (this phase) | **no**"),
);
assert(
  "no FTP/deploy marker exists",
  docSrc.includes("FTP / workflow_dispatch / deploy") &&
    docSrc.includes("not executed"),
);
assert("prior commit 82e1aaa", docSrc.includes(PRIOR_COMMIT));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a1e", currentStateSrc.includes("G-9g4a1e"));
assert(
  "current state round-trip complete",
  currentStateSrc.includes("round-trip complete") ||
    currentStateSrc.includes("round-trip closure"),
);
assert(
  "current state markerRemainsInStagingDb false",
  currentStateSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "current state activeRestoreExceptionsCount 0",
  currentStateSrc.includes("activeRestoreExceptionsCount: 0"),
);
assert("next actions G-9g4a2", nextActionsSrc.includes("G-9g4a2"));
assert(
  "handoff G-9g4a1e complete or G-9g4a2",
  (handoffSrc.includes("G-9g4a1e") && handoffSrc.includes("G-9g4a2")) ||
    handoffSrc.includes("G-9g4a2"),
);
assert("handoff final venue", handoffSrc.includes(FINAL_VENUE));
assert(
  "AI context routine dev stack",
  nextActionsSrc.includes("ENABLE_ADMIN_STAGING_WRITE") &&
    nextActionsSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN"),
);

console.log(`\nG-9g4a1e verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
