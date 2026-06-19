/**
 * G-9g4a2 — Text fields operational expansion planning (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g4a2-text-fields-operational-expansion-planning";
const NEXT_PHASE = "G-9g4a2a-open-time-only-operational-expansion-implementation";
const DOC_NAME = "staging-shell-schedule-text-fields-operational-expansion-planning.md";
const PRIOR_COMMIT = "3b807c8";
const G9G4A1_COMMIT = "3b807c8";

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
assert("planning doc exists", fs.existsSync(docPath));
const docSrc = fs.readFileSync(docPath, "utf8");

assert("phase G-9g4a2 exists", docSrc.includes(PHASE));
assert("status complete exists", docSrc.includes("**complete**"));
assert(
  "G-9g4a1 completion referenced",
  docSrc.includes("G-9g4a1") &&
    (docSrc.includes("round-trip complete") || docSrc.includes("Round-trip")),
);
assert(
  "target fields listed",
  docSrc.includes("open_time") &&
    docSrc.includes("start_time") &&
    docSrc.includes("price") &&
    docSrc.includes("description"),
);
assert(
  "single-field-first policy exists",
  docSrc.includes("single-field-first") || docSrc.includes("Single-field-first"),
);
assert(
  "open_time-only recommendation exists",
  docSrc.includes("open_time` only") || docSrc.includes("open_time only"),
);
assert(
  "payload exact policy exists",
  docSrc.includes("Payload exact policy") || docSrc.includes("payload keys"),
);
assert(
  "changedFields exact policy exists",
  docSrc.includes("changedFields exact policy") ||
    docSrc.includes("changedFields.length === 1"),
);
assert(
  "optimistic lock policy exists",
  docSrc.includes("Optimistic lock policy") || docSrc.includes("expectedBeforeUpdatedAt"),
);
assert(
  "re-click prevention policy exists",
  docSrc.includes("Re-click prevention policy") || docSrc.includes("re-click"),
);
assert(
  "restore policy exists",
  docSrc.includes("Restore required policy") || docSrc.includes("restore required"),
);
assert(
  "rollback SQL document-only policy exists",
  docSrc.includes("DO NOT RUN") && docSrc.includes("Rollback SQL"),
);
assert(
  "routine dev safety exists",
  docSrc.includes("ENABLE_ADMIN_STAGING_WRITE=false") &&
    docSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"),
);
assert(
  "non-dry-run arms off marker exists",
  docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED=false") &&
    docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED=false") &&
    docSrc.includes("PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED=false"),
);
assert(
  "no UI operation marker exists",
  docSrc.includes("Preview clicked (Cursor/AI) | **no**") &&
    docSrc.includes("Row picker clicked (Cursor/AI) | **no**"),
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
assert("prior commit 3b807c8", docSrc.includes(PRIOR_COMMIT));
assert("next phase recommendation exists", docSrc.includes(NEXT_PHASE));
assert(
  "markerRemainsInStagingDb false",
  docSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "activeRestoreExceptionsCount 0",
  docSrc.includes("activeRestoreExceptionsCount: 0"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g4a2", currentStateSrc.includes("G-9g4a2"));
assert(
  "current state G-9g4a1 complete at 3b807c8",
  currentStateSrc.includes("3b807c8") || currentStateSrc.includes("G-9g4a1e"),
);
assert(
  "current state round-trip complete",
  currentStateSrc.includes("round-trip complete") ||
    currentStateSrc.includes("round-trip closure"),
);
assert("next actions G-9g4a2a", nextActionsSrc.includes("G-9g4a2a"));
assert(
  "handoff G-9g4a2 complete",
  handoffSrc.includes("G-9g4a2") && handoffSrc.includes("G-9g4a2a"),
);
assert(
  "handoff no restore required",
  handoffSrc.includes("restore required") || handoffSrc.includes("restoreRequired"),
);

console.log(`\nG-9g4a2 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
