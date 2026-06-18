/**
 * G-9g3g5c — Operational restore execution result (operator pending; no Save by Cursor).
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
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const TARGET_LEGACY_ID = "schedule-2026-03-001";
const RESTORE_APPROVAL_ID =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";
const RESTORE_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const MARKER = "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const LOCK_BASELINE = "2026-06-18T16:35:45.060011+00:00";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const NEXT_PHASE = "G-9g3g5d-post-restore-hardening";

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
  "docs/staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md",
);
assert("restore execution result doc exists", fs.existsSync(execDocPath));
const execDocSrc = fs.readFileSync(execDocPath, "utf8");

assert("phase G-9g3g5c", execDocSrc.includes("G-9g3g5c-operational-restore-execution"));
assert("status operator pending", execDocSrc.includes("operator pending"));
assert("target id exists", execDocSrc.includes(TARGET_ROW_ID));
assert("target legacy_id exists", execDocSrc.includes(TARGET_LEGACY_ID));
assert("target site_slug exists", execDocSrc.includes(SITE_SLUG));
assert("restore approval ID exists", execDocSrc.includes(RESTORE_APPROVAL_ID));
assert("restore env arm exists", execDocSrc.includes(`${RESTORE_ARM}=true`));
assert(
  "required env stack exists",
  execDocSrc.includes("ENABLE_ADMIN_STAGING_WRITE=true") &&
    execDocSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false") &&
    execDocSrc.includes("PUBLIC_ADMIN_WRITE_PROVIDER=supabase") &&
    execDocSrc.includes("PUBLIC_ADMIN_WRITE_MODULE=schedule"),
);
assert("current marker baseline exists", execDocSrc.includes(MARKER));
assert("restore candidate exists", execDocSrc.includes(ORIGINAL_SNIPPET));
assert("lock baseline exists", execDocSrc.includes(LOCK_BASELINE));
assert(
  "exact Preview button id",
  execDocSrc.includes(`#${PREVIEW_BTN_ID}`) &&
    execDocSrc.includes("Preview G-9 site_slug general edit dry-run"),
);
assert(
  "exact Preview result panel",
  execDocSrc.includes(`#${PREVIEW_RESULT_ID}`),
);
assert(
  "exact Save button id",
  execDocSrc.includes(`#${SAVE_BTN_ID}`) &&
    execDocSrc.includes("Save operational general edit"),
);
assert("exact Save result panel id", execDocSrc.includes(`#${SAVE_RESULT_ID}`));
assert(
  "actualWrite expectation",
  execDocSrc.includes("actualWrite") &&
    execDocSrc.includes("false") &&
    execDocSrc.includes("true"),
);
assert(
  "rowsAffected expectation",
  execDocSrc.includes("rowsAffected") && execDocSrc.includes("1"),
);
assert(
  "failure stop conditions exist",
  execDocSrc.includes("Failure stop conditions") ||
    execDocSrc.includes("Stop immediately"),
);
assert(
  "Save not yet clicked marker",
  (execDocSrc.includes("Save clicked | **no**") ||
    execDocSrc.includes("Save clicked | **no** (not yet")) &&
    execDocSrc.includes("not yet"),
);
assert(
  "DB write not yet executed marker",
  execDocSrc.includes("DB write executed | **no**") ||
    (execDocSrc.includes("DB write") && execDocSrc.includes("no")),
);
assert(
  "restore not yet executed marker",
  execDocSrc.includes("restoreExecuted: false") ||
    execDocSrc.includes("restore executed | **no**"),
);
assert("next phase G-9g3g5d", execDocSrc.includes(NEXT_PHASE));
assert("live baseline check section", execDocSrc.includes("Live baseline check"));
assert("staging host only", execDocSrc.includes(STAGING_HOST));
assert("production blocked", execDocSrc.includes(PRODUCTION_HOST));
assert("service_role forbidden", execDocSrc.includes("service_role"));
assert(
  "wrong buttons documented",
  execDocSrc.includes("#schedule-dry-run-update-btn") &&
    execDocSrc.includes("G-9g3g4 operational Save"),
);
assert(
  "changedFields description only",
  execDocSrc.includes("changedFields") &&
    execDocSrc.includes("description") &&
    execDocSrc.includes("only"),
);
assert(
  "marker-before expectation",
  execDocSrc.includes("before.description") && execDocSrc.includes("temporary marker"),
);
assert(
  "original-after expectation",
  execDocSrc.includes("after.description") &&
    execDocSrc.includes("original description"),
);

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("current state G-9g3g5c", currentStateSrc.includes("G-9g3g5c"));
assert("current state commit 3b113c5", currentStateSrc.includes("3b113c5"));
assert("next actions G-9g3g5d after execution", nextActionsSrc.includes(NEXT_PHASE));
assert("handoff operator pending", handoffSrc.includes("operator pending"));

console.log(`\nG-9g3g5c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
