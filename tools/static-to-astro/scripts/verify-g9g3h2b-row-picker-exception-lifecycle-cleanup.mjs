/**
 * G-9g3h2b — Row-picker restore exception lifecycle cleanup (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h2b-row-picker-exception-lifecycle-cleanup";
const NEXT_PHASE = "G-9g3h3-cms-kit-generalization-notes";
const PRIOR_COMMIT = "a01fbf4";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const G6_POC_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const POC_MARKER = "[CMS Kit staging]";
const SMOKE_MARKER =
  "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker";
const FINAL_UPDATED_AT = "2026-06-19T02:05:42.615781+00:00";

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

const cleanupDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-exception-lifecycle-cleanup.md",
);
assert("lifecycle cleanup doc exists", fs.existsSync(cleanupDocPath));
const cleanupDocSrc = fs.readFileSync(cleanupDocPath, "utf8");

const registrySrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-restore-exception-registry.ts",
);
const rowPickerUtilsSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts",
);
const rowPickerUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-ui.ts",
);
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const astroSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugRowPickerSection.astro",
  ),
  "utf8",
);
const g9g3h1b1DocSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md",
);
const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("phase G-9g3h2b", cleanupDocSrc.includes(PHASE));
assert("status complete", cleanupDocSrc.includes("**complete**"));
assert(
  "chosen option B registry",
  cleanupDocSrc.includes("Option B") && cleanupDocSrc.includes("centralized restore exception registry"),
);
assert("markerRemainsInStagingDb false", cleanupDocSrc.includes("markerRemainsInStagingDb: false"));
assert("G-9g3h1a exception lifecycle", cleanupDocSrc.includes("G-9g3h1a exception lifecycle"));
assert(
  "target row normal selectable",
  cleanupDocSrc.includes("normal selectable") || cleanupDocSrc.includes("selectable content row"),
);
assert("generic audit protection", cleanupDocSrc.includes(POC_MARKER));
assert("G-6 pilot audit-only", cleanupDocSrc.includes(G6_POC_ROW_ID));
assert(
  "old PoC rows audit-only",
  cleanupDocSrc.includes("G-9g2") || cleanupDocSrc.includes("PoC audit rows"),
);
assert(
  "assertOperationalNotPocAuditRow preserved",
  cleanupDocSrc.includes("assertOperationalNotPocAuditRow"),
);
assert("no DB write marker", cleanupDocSrc.includes("DB write executed (this phase) | **no**"));
assert(
  "no SQL marker",
  cleanupDocSrc.includes("SQL mutation executed (this phase) | **no**"),
);
assert("generalization notes", cleanupDocSrc.includes("Generalization notes") || cleanupDocSrc.includes("generalization notes"));
assert("next phase recommendation", cleanupDocSrc.includes(NEXT_PHASE));
assert("prior commit a01fbf4", cleanupDocSrc.includes(PRIOR_COMMIT));
assert("final updated_at", cleanupDocSrc.includes(FINAL_UPDATED_AT));
assert("smoke marker historical", cleanupDocSrc.includes(SMOKE_MARKER));

assert("registry file exists", registrySrc.includes("STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY"));
assert("registry lifecycle status type", registrySrc.includes("RestoreExceptionLifecycleStatus"));
assert("g9g3h1a registry entry completed", registrySrc.includes('id: "g9g3h1a-smoke-marker-restore"') && registrySrc.includes('status: "completed"'));
assert("g9g3g4 registry entry completed", registrySrc.includes('id: "g9g3g4-operational-restore"') && registrySrc.includes('status: "completed"'));
assert("getActiveRestoreExceptionForRow", registrySrc.includes("getActiveRestoreExceptionForRow"));
assert("isActiveRestoreExceptionRow", registrySrc.includes("isActiveRestoreExceptionRow"));
assert("historical isG9g3h1a matcher", registrySrc.includes("isG9g3h1aSmokeMarkerRestoreTargetRow"));
assert("historical isG9G3g4 matcher", registrySrc.includes("isG9G3g4OperationalRestoreTargetRow"));

assert("isPocAuditScheduleRow uses active exception", rowPickerUtilsSrc.includes("isActiveRestoreExceptionRow"));
assert("rowContainsPocAuditMarker preserved", rowPickerUtilsSrc.includes("rowContainsPocAuditMarker"));
assert("G9G1 pilot still audit", rowPickerUtilsSrc.includes("G9G1_TARGET_ROW_ID"));
assert("registry re-export", rowPickerUtilsSrc.includes("STAGING_SCHEDULE_RESTORE_EXCEPTION_REGISTRY"));

assert("UI uses getActiveRestoreExceptionForRow", rowPickerUiSrc.includes("getActiveRestoreExceptionForRow"));
assert("UI no hard-coded G-9g3h1a label import", !rowPickerUiSrc.includes("G9G3H1A_RESTORE_TARGET_UI_LABEL"));

assert("guards use isActiveRestoreExceptionRow", guardsSrc.includes("isActiveRestoreExceptionRow"));
assert(
  "guards no direct g9g3h1a bypass",
  !guardsSrc.includes("isG9g3h1aSmokeMarkerRestoreTargetRow"),
);

assert("astro uses getActiveRestoreExceptionForRow", astroSrc.includes("getActiveRestoreExceptionForRow"));
assert("astro registry status active mention", astroSrc.includes("status: active"));

assert("G-9g3h1b1 historical doc preserved", g9g3h1b1DocSrc.includes("G-9g3h1b1-smoke-marker-restore-row-picker-exception"));

assert("current state G-9g3h2b", currentStateSrc.includes("G-9g3h2b"));
assert("current state a01fbf4", currentStateSrc.includes("a01fbf4"));
assert("current state marker removed", currentStateSrc.includes("markerRemainsInStagingDb: false") || currentStateSrc.includes("marker removed"));
assert("next actions G-9g3h3 or G-9g3h2b", nextActionsSrc.includes("G-9g3h3") || nextActionsSrc.includes("G-9g3h2b"));
assert("handoff lifecycle cleanup", handoffSrc.includes("G-9g3h2b") || handoffSrc.includes("registry"));

console.log(`\nG-9g3h2b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
