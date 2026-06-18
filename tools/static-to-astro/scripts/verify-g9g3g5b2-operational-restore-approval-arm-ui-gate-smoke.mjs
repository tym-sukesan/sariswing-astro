/**
 * G-9g3g5b2 — Operational restore approval arm UI gate smoke result verifier.
 * No Save, no Preview click by Cursor, no DB write.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const SITE_SLUG = "gosaki-piano";
const SELECTED_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const SELECTED_LEGACY_ID = "schedule-2026-03-001";
const POC_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const RESTORE_APPROVAL_ID =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";
const RESTORE_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const G9G3G_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const MARKER = "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const SAVE_GATE_PANEL_ID = "site-slug-edit-save-gate-panel";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const STALE_MSG = "Preview is stale — run G-9 preview again";
const NEXT_PHASE = "G-9g3g5c-operational-restore-execution";
const STAGING_SHELL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/#schedule";

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

const smokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-approval-arm-ui-gate-smoke-test-result.md",
);
assert("smoke doc exists", fs.existsSync(smokeDocPath));
const smokeDocSrc = fs.readFileSync(smokeDocPath, "utf8");

assert(
  "phase G-9g3g5b2",
  smokeDocSrc.includes("G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test"),
);
assert(
  "smoke passed",
  smokeDocSrc.includes("G-9g3g5b2 operational restore approval arm UI gate smoke passed"),
);
assert(
  "smoke gate passed",
  smokeDocSrc.includes(
    "stagingShellScheduleSiteSlugOperationalRestoreApprovalArmUiGateSmokeTestPassed: true",
  ),
);
assert(
  "ready for G-9g3g5c",
  smokeDocSrc.includes("readyForG9g3g5cOperationalRestoreExecution: true"),
);
assert(
  "operator manual preview confirmed",
  smokeDocSrc.includes("operatorManualPreviewClicked: true"),
);
assert(
  "operator manual stale confirmed",
  smokeDocSrc.includes("operatorManualStaleInvalidationConfirmed: true"),
);
assert(
  "optimistic lock baseline in smoke doc",
  smokeDocSrc.includes("2026-06-18T16:35:45.060011+00:00"),
);
assert(
  "Ready for restore Save marker",
  smokeDocSrc.includes("Ready for restore Save"),
);
assert(
  "restore env stack documented",
  smokeDocSrc.includes("ENABLE_ADMIN_STAGING_WRITE=true") &&
    smokeDocSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false") &&
    smokeDocSrc.includes(RESTORE_APPROVAL_ID) &&
    smokeDocSrc.includes(`${RESTORE_ARM}=true`),
);
assert(
  "G-9g3g operational arm off noted",
  smokeDocSrc.includes("G-9g3g operational arm off") || smokeDocSrc.includes(G9G3G_ARM),
);
assert("staging shell URL", smokeDocSrc.includes(STAGING_SHELL_URL));
assert("restore target id", smokeDocSrc.includes(SELECTED_ROW_ID));
assert("restore target legacy_id", smokeDocSrc.includes(SELECTED_LEGACY_ID));
assert("marker in loaded description", smokeDocSrc.includes(MARKER));
assert("restore candidate original", smokeDocSrc.includes(ORIGINAL_SNIPPET));
assert(
  "operator steps documented",
  smokeDocSrc.includes("Step A") && smokeDocSrc.includes("Step H"),
);
assert(
  "exact Preview button id",
  smokeDocSrc.includes(`#${PREVIEW_BTN_ID}`) &&
    smokeDocSrc.includes("Preview G-9 site_slug general edit dry-run"),
);
assert(
  "exact Preview result panel",
  smokeDocSrc.includes(`#${PREVIEW_RESULT_ID}`) &&
    smokeDocSrc.includes("G-9 site_slug general edit preview result"),
);
assert(
  "exact Save button id",
  smokeDocSrc.includes(`#${SAVE_BTN_ID}`) &&
    smokeDocSrc.includes("Save operational general edit"),
);
assert("exact Save result panel id", smokeDocSrc.includes(`#${SAVE_RESULT_ID}`));
assert("exact gate panel id", smokeDocSrc.includes(`#${SAVE_GATE_PANEL_ID}`));
assert(
  "restore mode expected marker",
  smokeDocSrc.includes("G-9g3g5 restore mode"),
);
assert("restore approval ID expected", smokeDocSrc.includes(RESTORE_APPROVAL_ID));
assert(
  "restore env arm expected",
  smokeDocSrc.includes(RESTORE_ARM),
);
assert(
  "marker-before expected",
  smokeDocSrc.includes("before.description") && smokeDocSrc.includes("temporary marker"),
);
assert(
  "original-after expected",
  smokeDocSrc.includes("after.description") &&
    (smokeDocSrc.includes("no marker") || smokeDocSrc.includes("restore candidate")),
);
assert(
  "changedFields description only",
  smokeDocSrc.includes("changedFields") &&
    smokeDocSrc.includes("description") &&
    smokeDocSrc.includes("only"),
);
assert(
  "stale blocks Save marker",
  smokeDocSrc.includes(STALE_MSG) &&
    (smokeDocSrc.includes("blocks Save") || smokeDocSrc.includes("disabled")),
);
assert(
  "Save not clicked marker",
  smokeDocSrc.includes("Save clicked") && smokeDocSrc.includes("no"),
);
assert(
  "DB write not executed marker",
  smokeDocSrc.includes("DB write") && smokeDocSrc.includes("no"),
);
assert(
  "restore not executed marker",
  smokeDocSrc.includes("restoreExecuted: false") ||
    smokeDocSrc.includes("restore executed | **no**"),
);
assert("next phase G-9g3g5c", smokeDocSrc.includes(NEXT_PHASE));
assert(
  "G-9g3g4 Save re-click prevention",
  smokeDocSrc.includes("G-9g3g4") && smokeDocSrc.includes("Do not re-click"),
);
assert(
  "PoC audit row warning",
  smokeDocSrc.includes(POC_ROW_ID),
);
assert(
  "mutual exclusion code confirmation",
  smokeDocSrc.includes("Mutual exclusion") && smokeDocSrc.includes("cannot both be on"),
);
assert(
  "forbidden paths documented",
  smokeDocSrc.includes("SQL rollback") && smokeDocSrc.includes("FTP"),
);
assert("staging host only", smokeDocSrc.includes(STAGING_HOST));
assert("production blocked", smokeDocSrc.includes(PRODUCTION_HOST));
assert("service_role forbidden", smokeDocSrc.includes("service_role"));

const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const restoreConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-restore-config.ts",
);
const operationalConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts",
);

assert(
  "UI supports restore mode gate",
  editUiSrc.includes("canEnableG9G3g5OperationalRestoreSave") &&
    editUiSrc.includes("G9G3G5_OPERATIONAL_RESTORE_MODE_LABEL"),
);
assert(
  "UI mutual exclusion",
  editUiSrc.includes("cannot both be on"),
);
assert(
  "restore config requires g9g3g off",
  restoreConfigSrc.includes("SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV") &&
    restoreConfigSrc.includes("must be off"),
);
assert(
  "operational config requires restore arm off",
  operationalConfigSrc.includes("SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV") &&
    operationalConfigSrc.includes("must be off"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g3g5b2 passed", currentStateSrc.includes("G-9g3g5b2") && currentStateSrc.includes("passed"));
assert("current state commit 3b113c5", currentStateSrc.includes("3b113c5"));
assert("next actions G-9g3g5c", nextActionsSrc.includes(NEXT_PHASE));
assert("handoff smoke passed", handoffSrc.includes("passed"));

console.log(`\nG-9g3g5b2 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
