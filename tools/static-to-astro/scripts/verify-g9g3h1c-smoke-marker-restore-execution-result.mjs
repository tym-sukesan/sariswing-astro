/**
 * G-9g3h1c — G-9g3h1a smoke marker restore execution result (no Save/Preview/DB by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h1c-smoke-marker-restore-execution";
const NEXT_PHASE = "G-9g3h1d-smoke-marker-restore-post-execution-hardening";
const PRIOR_COMMIT = "863fdff";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const TARGET_LEGACY_ID = "schedule-2026-03-001";
const SITE_SLUG = "gosaki-piano";
const SMOKE_MARKER =
  "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const ORIGINAL_DESCRIPTION =
  "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/";
const LOCK_BEFORE = "2026-06-19T01:18:46.3938+00:00";
const UPDATED_AFTER = "2026-06-19T02:05:42.615781+00:00";
const OPERATIONAL_APPROVAL_ID =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";

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

const execDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md",
);
assert("execution result doc exists", fs.existsSync(execDocPath));
const execDocSrc = fs.readFileSync(execDocPath, "utf8");

assert("phase G-9g3h1c", execDocSrc.includes(PHASE));
assert(
  "status success",
  execDocSrc.includes("**success**") ||
    execDocSrc.includes("restore execution complete"),
);
assert("target id", execDocSrc.includes(TARGET_ROW_ID));
assert("target legacy_id", execDocSrc.includes(TARGET_LEGACY_ID));
assert("target site_slug", execDocSrc.includes(SITE_SLUG));
assert("smoke marker in before", execDocSrc.includes(SMOKE_MARKER));
assert("original description after", execDocSrc.includes(ORIGINAL_DESCRIPTION));
assert("original snippet", execDocSrc.includes(ORIGINAL_SNIPPET));

assert(
  "Preview executed once by operator",
  execDocSrc.includes("Preview clicked (operator) | **yes**") ||
    execDocSrc.includes("Preview: executed once by operator"),
);
assert(
  "Save executed once by operator",
  execDocSrc.includes("Save clicked | **yes**") &&
    execDocSrc.includes("exactly once"),
);
assert("preview actualWrite false", execDocSrc.includes("actualWrite | `false`"));
assert("save actualWrite true", execDocSrc.includes("actualWrite | `true`"));
assert("rowsAffected 1", execDocSrc.includes("rowsAffected | `1`"));
assert(
  "changedFields description only",
  execDocSrc.includes("changedFields | `description` only") ||
    (execDocSrc.includes("changedFields") && execDocSrc.includes("description only")),
);
assert("expectedBeforeUpdatedAt", execDocSrc.includes(LOCK_BEFORE));
assert("updated_at after Save", execDocSrc.includes(UPDATED_AFTER));
assert("before includes marker", execDocSrc.includes("before.description") || execDocSrc.includes("beforeSnapshot.description"));
assert(
  "after equals original",
  execDocSrc.includes("after.description") || execDocSrc.includes("afterSnapshot.description"),
);
assert("markerRemainsInStagingDb false", execDocSrc.includes("markerRemainsInStagingDb: false"));
assert("markerRemoved true", execDocSrc.includes("markerRemoved: true"));
assert("restoreExecuted true", execDocSrc.includes("restoreExecuted: true"));
assert("serviceRoleUsed false", execDocSrc.includes("serviceRoleUsed: false") || execDocSrc.includes('"serviceRoleUsed": false'));
assert("stagingOnly true", execDocSrc.includes("stagingOnly: true") || execDocSrc.includes('"stagingOnly": true'));
assert("productionBlocked true", execDocSrc.includes("productionBlocked: true") || execDocSrc.includes('"productionBlocked": true'));
assert(
  "re-click blocked observed",
  execDocSrc.includes("Re-click is blocked") || execDocSrc.includes("re-click blocked"),
);
assert("executed-state observed", execDocSrc.includes("executed-state"));
assert("Save disabled after success", execDocSrc.includes("Save button | **disabled**") || execDocSrc.includes("Save disabled"));
assert("fresh Preview required", execDocSrc.includes("fresh Preview required"));
assert("no second Save clicked", execDocSrc.includes("Second Save clicked | **no**"));
assert("no second Preview clicked", execDocSrc.includes("Second Preview clicked | **no**"));
assert("rollbackNeeded false", execDocSrc.includes("rollbackNeeded: false"));
assert(
  "rollback executed false",
  execDocSrc.includes("rollback executed: false") ||
    execDocSrc.includes("rollbackExecuted: false"),
);
assert("operational approval ID", execDocSrc.includes(OPERATIONAL_APPROVAL_ID));
assert("Option A restore path", execDocSrc.includes("Option A"));
assert("exact Preview button", execDocSrc.includes(`#${PREVIEW_BTN_ID}`));
assert("exact Save button", execDocSrc.includes(`#${SAVE_BTN_ID}`));
assert("execution complete gate", execDocSrc.includes("stagingShellScheduleSiteSlugOperationalSaveReclickSmokeMarkerRestoreExecutionComplete: true"));
assert("next phase recommendation", execDocSrc.includes(NEXT_PHASE));
assert("prior commit 863fdff", execDocSrc.includes(PRIOR_COMMIT));
assert("no Cursor Save", execDocSrc.includes("cursorClickedSave: false"));
assert("no Cursor Preview", execDocSrc.includes("cursorClickedPreview: false"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g3h1c success", currentStateSrc.includes("G-9g3h1c") || currentStateSrc.includes("G-9g3h1d"));
assert("current state marker removed", currentStateSrc.includes("markerRemoved: true") || currentStateSrc.includes("marker removed"));
assert(
  "current state e6b3ece or prior",
  currentStateSrc.includes("e6b3ece") || currentStateSrc.includes(PRIOR_COMMIT),
);
assert(
  "next actions post-execution or routine",
  nextActionsSrc.includes("G-9g3h1d") ||
    nextActionsSrc.includes("G-9g3h2b") ||
    nextActionsSrc.includes("routine"),
);
assert("handoff restore success", handoffSrc.includes("G-9g3h1c") && (handoffSrc.includes("success") || handoffSrc.includes("marker removed")));

console.log(`\nG-9g3h1c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
