/**
 * G-9g3h1b — G-9g3h1a smoke marker restore preflight (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h1b-smoke-marker-restore-preflight";
const NEXT_PHASE = "G-9g3h1c-smoke-marker-restore-execution";
const PRIOR_COMMIT = "03cbbbe";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const TARGET_LEGACY_ID = "schedule-2026-03-001";
const SITE_SLUG = "gosaki-piano";
const SMOKE_MARKER =
  "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const ORIGINAL_DESCRIPTION =
  "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/";
const LOCK_BASELINE = "2026-06-19T01:18:46.3938+00:00";
const OPERATIONAL_APPROVAL_ID =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const OPERATIONAL_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const RESTORE_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const RESTORE_APPROVAL_ID =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const GATE_PANEL_ID = "site-slug-edit-save-gate-panel";

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
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-preflight.md",
);
assert("preflight doc exists", fs.existsSync(preflightPath));
const preflightSrc = fs.readFileSync(preflightPath, "utf8");

const execPendingPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md",
);
const execPendingSrc = fs.existsSync(execPendingPath)
  ? fs.readFileSync(execPendingPath, "utf8")
  : "";

const guardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
const smokeResultSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md",
);

assert("phase G-9g3h1b", preflightSrc.includes(PHASE));
assert("preflight status complete", preflightSrc.includes("**complete**"));
assert("current marker exists", preflightSrc.includes(SMOKE_MARKER));
assert("restore target original description exists", preflightSrc.includes(ORIGINAL_DESCRIPTION));
assert("original description snippet", preflightSrc.includes(ORIGINAL_SNIPPET));
assert("expectedBeforeUpdatedAt exists", preflightSrc.includes(LOCK_BASELINE));
assert(
  "chosen restore path Option A",
  preflightSrc.includes("Option A") &&
    preflightSrc.includes("G-9g3g general operational"),
);
assert(
  "Option B not recommended documented",
  preflightSrc.includes("Option B") && preflightSrc.includes("not recommended"),
);
assert(
  "G-9g3g5 restore mode not for G-9g3h1a",
  preflightSrc.includes("do not use G-9g3g5 restore mode") ||
    preflightSrc.includes("Do **not** reuse G-9g3g5 restore mode"),
);
assert("env stack exists", preflightSrc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("operational approval ID", preflightSrc.includes(OPERATIONAL_APPROVAL_ID));
assert("operational env arm", preflightSrc.includes(`${OPERATIONAL_ARM}=true`));
assert("restore arm off", preflightSrc.includes(`${RESTORE_ARM} — off`));
assert("target id exists", preflightSrc.includes(TARGET_ROW_ID));
assert("target legacy_id exists", preflightSrc.includes(TARGET_LEGACY_ID));
assert("target site_slug exists", preflightSrc.includes(SITE_SLUG));
assert("exact Preview button id", preflightSrc.includes(`#${PREVIEW_BTN_ID}`));
assert("exact Preview result panel", preflightSrc.includes(`#${PREVIEW_RESULT_ID}`));
assert("exact Save button id", preflightSrc.includes(`#${SAVE_BTN_ID}`));
assert("exact Save result panel", preflightSrc.includes(`#${SAVE_RESULT_ID}`));
assert("gate panel id", preflightSrc.includes(`#${GATE_PANEL_ID}`));
assert(
  "expected Preview actualWrite false",
  preflightSrc.includes("actualWrite") && preflightSrc.includes("`false`"),
);
assert(
  "expected Save actualWrite true",
  preflightSrc.includes("actualWrite") && preflightSrc.includes("`true`"),
);
assert(
  "expected changedFields description only",
  preflightSrc.includes("changedFields") && preflightSrc.includes("description"),
);
assert("stop conditions exist", preflightSrc.includes("Stop conditions") || preflightSrc.includes("STOP"));
assert(
  "forbidden paths exist",
  preflightSrc.includes("Wrong buttons") || preflightSrc.includes("forbidden paths"),
);
assert(
  "forbidden G-9g3g5 restore mode",
  preflightSrc.includes("G-9g3g5 restore mode") || preflightSrc.includes(RESTORE_APPROVAL_ID),
);
assert("no DB write marker", preflightSrc.includes("DB write executed (this phase) | **no**"));
assert(
  "no SQL marker",
  preflightSrc.includes("SQL mutation") || preflightSrc.includes("no SQL"),
);
assert("next phase G-9g3h1c", preflightSrc.includes(NEXT_PHASE));
assert("ready for execution gate", preflightSrc.includes("readyForG9g3h1cSmokeMarkerRestoreExecution: true"));
assert("marker remains gate", preflightSrc.includes("markerRemainsInStagingDb: true"));
assert("staging host only", preflightSrc.includes(STAGING_HOST));
assert("production blocked", preflightSrc.includes(PRODUCTION_HOST));
assert("prior commit 03cbbbe", preflightSrc.includes(PRIOR_COMMIT));
assert("re-click prevention step I", preflightSrc.includes("Re-click prevention"));

assert("pending execution doc exists", execPendingSrc.length > 0);
assert("pending execution operator pending", execPendingSrc.includes("operator pending"));
assert("pending execution phase G-9g3h1c", execPendingSrc.includes(NEXT_PHASE));
assert("pending execution no Save yet", execPendingSrc.includes("Save clicked | **no**"));

assert("G9G3G4 marker guard constant", guardsSrc.includes("G9G3G4_OPERATIONAL_DESCRIPTION_MARKER"));
assert("assertG9G3g5RestorePayloadOnly in guards", guardsSrc.includes("assertG9G3g5RestorePayloadOnly"));
assert("smoke result marker remains", smokeResultSrc.includes("markerRemainsInStagingDb: true"));
assert("current state G-9g3h1b complete", currentStateSrc.includes("G-9g3h1b"));
assert("current state 03cbbbe", currentStateSrc.includes(PRIOR_COMMIT));
assert("next actions G-9g3h1c", nextActionsSrc.includes("G-9g3h1c"));
assert("handoff restore preflight or execution", handoffSrc.includes("G-9g3h1b") || handoffSrc.includes("G-9g3h1c"));

console.log(`\nG-9g3h1b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
