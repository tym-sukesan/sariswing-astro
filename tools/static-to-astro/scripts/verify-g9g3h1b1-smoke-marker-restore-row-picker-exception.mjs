/**
 * G-9g3h1b1 — G-9g3h1a smoke marker restore row-picker narrow exception (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h1b1-smoke-marker-restore-row-picker-exception";
const NEXT_PHASE = "G-9g3h1c-smoke-marker-restore-execution";
const PRIOR_COMMIT = "f868435";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const TARGET_LEGACY_ID = "schedule-2026-03-001";
const SITE_SLUG = "gosaki-piano";
const G6_POC_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const SMOKE_MARKER =
  "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker";
const GENERIC_MARKER = "[CMS Kit staging]";
const LOCK_BASELINE = "2026-06-19T01:18:46.3938+00:00";
const UI_LABEL = "G-9g3h1a restore target";
const SELECTABLE_HINT = "temporary selectable for smoke marker restore";

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

const implDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-row-picker-exception.md",
);
assert("implementation doc exists", fs.existsSync(implDocPath));
const implDocSrc = fs.readFileSync(implDocPath, "utf8");

const preflightSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-preflight.md",
);
const execPendingSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md",
);
const rowPickerUtilsSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-utils.ts",
);
const rowPickerUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-ui.ts",
);
const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const astroSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugRowPickerSection.astro",
  ),
  "utf8",
);
const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("phase G-9g3h1b1", implDocSrc.includes(PHASE));
assert("implementation complete", implDocSrc.includes("implementation complete"));
assert("target id in doc", implDocSrc.includes(TARGET_ROW_ID));
assert("target legacy_id in doc", implDocSrc.includes(TARGET_LEGACY_ID));
assert("G-9g3h1a smoke marker in doc", implDocSrc.includes(SMOKE_MARKER));
assert("pause before Preview Save", implDocSrc.includes("paused before Preview"));
assert(
  "generic marker not globally selectable",
  implDocSrc.includes("Generic") && implDocSrc.includes("remain audit-only"),
);
assert(
  "G-6 pilot excluded",
  implDocSrc.includes(G6_POC_ROW_ID) || implDocSrc.includes("G-6 pilot"),
);
assert("UI label in doc", implDocSrc.includes(UI_LABEL));

assert(
  "isG9g3h1aSmokeMarkerRestoreTargetRow exists",
  rowPickerUtilsSrc.includes("isG9g3h1aSmokeMarkerRestoreTargetRow"),
);
assert(
  "exception in isPocAuditScheduleRow",
  rowPickerUtilsSrc.includes("isG9g3h1aSmokeMarkerRestoreTargetRow(row)") &&
    rowPickerUtilsSrc.includes("return false"),
);
assert("rowContainsPocAuditMarker preserved", rowPickerUtilsSrc.includes("rowContainsPocAuditMarker"));
assert("G9G1 pilot still audit", rowPickerUtilsSrc.includes("G9G1_TARGET_ROW_ID"));
assert("config smoke marker constant", configSrc.includes("G9G3H1A_SMOKE_MARKER"));
assert("config lock baseline", configSrc.includes(LOCK_BASELINE));
assert("UI label constant", configSrc.includes("G9G3H1A_RESTORE_TARGET_UI_LABEL"));

assert("row picker UI restore badge", rowPickerUiSrc.includes("site-slug-row-picker__restore-badge"));
assert("Select (restore) label", rowPickerUiSrc.includes("Select (restore)"));
assert("astro restore badge", astroSrc.includes("site-slug-row-picker__restore-badge"));
assert("astro Select (restore)", astroSrc.includes("Select (restore)"));

assert(
  "assertOperationalNotPocAuditRow exception",
  guardsSrc.includes("isG9g3h1aSmokeMarkerRestoreTargetRow"),
);

assert("preflight row picker section", preflightSrc.includes("G-9g3h1b1"));
assert("preflight STOP if audit only", preflightSrc.includes("STOP") && preflightSrc.includes("audit"));
assert(
  "execution doc paused",
  execPendingSrc.includes("paused before Preview/Save") ||
    execPendingSrc.includes("g9g3h1cExecutionPausedBeforePreviewSave"),
);
assert("execution doc no Preview yet", execPendingSrc.includes("Preview clicked (operator) | **not yet**") || execPendingSrc.includes("not yet"));
assert("execution doc no Save yet", execPendingSrc.includes("Save clicked | **no**"));

assert("no Preview executed marker", implDocSrc.includes("Preview clicked (operator) | **no**"));
assert("no Save executed marker", implDocSrc.includes("Save clicked (this phase) | **no**"));
assert("no DB write marker", implDocSrc.includes("DB write executed (this phase) | **no**"));

assert("next phase G-9g3h1c", implDocSrc.includes(NEXT_PHASE));
assert("prior commit f868435", implDocSrc.includes(PRIOR_COMMIT));

assert("current state G-9g3h1b1", currentStateSrc.includes("G-9g3h1b1"));
assert("current state paused", currentStateSrc.includes("paused") || currentStateSrc.includes("Paused"));
assert("next actions G-9g3h1c", nextActionsSrc.includes("G-9g3h1c"));
assert("handoff G-9g3h1b1", handoffSrc.includes("G-9g3h1b1"));
assert("marker remains", handoffSrc.includes("markerRemainsInStagingDb: true") || implDocSrc.includes("markerRemainsInStagingDb: true"));

console.log(`\nG-9g3h1b1 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
