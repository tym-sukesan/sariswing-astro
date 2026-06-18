/**
 * G-9g3g5b — Operational restore preflight (planning + gap audit; no DB write).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const TARGET_LEGACY_ID = "schedule-2026-03-001";
const SITE_SLUG = "gosaki-piano";
const MARKER = "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const RESTORE_APPROVAL_ID =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";
const RESTORE_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const G9G3G_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const LOCK_BASELINE = "2026-06-18T16:35:45.060011+00:00";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const NEXT_PHASE = "G-9g3g5b1-operational-restore-approval-arm-implementation";

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

const preflightPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-preflight.md",
);
assert("restore preflight doc exists", fs.existsSync(preflightPath));
const preflightSrc = fs.readFileSync(preflightPath, "utf8");

assert("phase G-9g3g5b", preflightSrc.includes("G-9g3g5b-operational-restore-preflight"));
assert(
  "preflight complete restore pending",
  preflightSrc.includes("preflight complete / restore execution pending"),
);
assert("target id exists", preflightSrc.includes(TARGET_ROW_ID));
assert("marker baseline exists", preflightSrc.includes(MARKER));
assert("restore candidate exists", preflightSrc.includes("会場website: https://subsaku.com/ginza/"));
assert(
  "changedFields description only",
  preflightSrc.includes("description` only") || preflightSrc.includes("description only"),
);
assert("restore approval ID exists", preflightSrc.includes(RESTORE_APPROVAL_ID));
assert("restore env arm exists", preflightSrc.includes(RESTORE_ARM));
assert("single-arm rule exists", preflightSrc.includes(G9G3G_ARM) && preflightSrc.includes("off"));
assert(
  "implementation gap audit exists",
  preflightSrc.includes("Implementation gap audit") && preflightSrc.includes("not implemented"),
);
assert(
  "blocker documented",
  preflightSrc.includes("readyForG9g3g5cOperationalRestoreExecution: false"),
);
assert("Preview button id exists", preflightSrc.includes(PREVIEW_BTN_ID));
assert("Preview result id exists", preflightSrc.includes(PREVIEW_RESULT_ID));
assert("Save button id exists", preflightSrc.includes(SAVE_BTN_ID));
assert("Save result id exists", preflightSrc.includes(SAVE_RESULT_ID));
assert(
  "stop conditions exist",
  preflightSrc.includes("Stop conditions") || preflightSrc.includes("Stop immediately"),
);
assert(
  "SQL rollback discouraged",
  preflightSrc.includes("SQL rollback") && preflightSrc.includes("Discouraged"),
);
assert(
  "restore not executed marker",
  preflightSrc.includes("Restore executed | **no**") ||
    preflightSrc.includes("restoreExecuted: false"),
);
assert(
  "DB write not executed marker",
  preflightSrc.includes("DB write executed (this phase) | **no**"),
);
assert("next phase G-9g3g5b1 marker", preflightSrc.includes(NEXT_PHASE));
assert("lock baseline", preflightSrc.includes(LOCK_BASELINE));

const typesSrc = readRepo("src/lib/admin/staging-write/schedule-write-types.ts");
assert(
  "restore approval in types allowlist (G-9g3g5b1)",
  typesSrc.includes(RESTORE_APPROVAL_ID) &&
    typesSrc.includes("G9G3G5_SCHEDULE_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID"),
);

const b1ImplPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-implementation.md",
);
assert("G-9g3g5b1 implementation doc exists", fs.existsSync(b1ImplPath));

const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
assert("config restore approval ID", configSrc.includes(RESTORE_APPROVAL_ID));
assert("config G9G3G5B phase", configSrc.includes("G-9g3g5b-operational-restore-preflight"));
assert("config G9G3G5B1 phase", configSrc.includes("G-9g3g5b1-operational-restore-approval-arm-implementation"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
assert("current state G-9g3g5b2 passed", currentStateSrc.includes("G-9g3g5b2") && currentStateSrc.includes("passed"));
assert("current state commit 23b7b68", currentStateSrc.includes("23b7b68"));

const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
assert("next actions G-9g3g5c", nextActionsSrc.includes("G-9g3g5c-operational-restore-execution"));

const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("handoff G-9g3g5b2 passed", handoffSrc.includes("G-9g3g5b2") && handoffSrc.includes("passed"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
