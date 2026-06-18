/**
 * G-9g3g4 — Operational non-dry-run execution result (operator pending; no Save, no DB write).
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
const OPERATIONAL_APPROVAL_ID =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const OPERATIONAL_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const DESCRIPTION_MARKER =
  "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const NEXT_PHASE = "G-9g3g5-post-execution-hardening-and-restore-decision";

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
  "docs/staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md",
);
assert("execution result doc exists", fs.existsSync(execDocPath));
const execDocSrc = fs.readFileSync(execDocPath, "utf8");

assert("phase G-9g3g4", execDocSrc.includes("G-9g3g4-operational-non-dry-run-execution"));
assert("status operator pending", execDocSrc.includes("operator pending"));
assert("target id exists", execDocSrc.includes(TARGET_ROW_ID));
assert("target legacy_id exists", execDocSrc.includes(TARGET_LEGACY_ID));
assert("target site_slug exists", execDocSrc.includes(SITE_SLUG));
assert("planned description marker exists", execDocSrc.includes(DESCRIPTION_MARKER));
assert("approval ID exists", execDocSrc.includes(OPERATIONAL_APPROVAL_ID));
assert("env arm exists", execDocSrc.includes(OPERATIONAL_ARM));
assert(
  "required env stack exists",
  execDocSrc.includes("ENABLE_ADMIN_STAGING_WRITE=true") &&
    execDocSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false") &&
    execDocSrc.includes("PUBLIC_ADMIN_WRITE_PROVIDER=supabase") &&
    execDocSrc.includes("PUBLIC_ADMIN_WRITE_MODULE=schedule"),
);
assert("Preview button id exists", execDocSrc.includes(PREVIEW_BTN_ID));
assert("Preview result id exists", execDocSrc.includes(PREVIEW_RESULT_ID));
assert("Save button id exists", execDocSrc.includes(SAVE_BTN_ID));
assert("Save result id exists", execDocSrc.includes(SAVE_RESULT_ID));
assert(
  "actualWrite expectation exists",
  execDocSrc.includes("actualWrite") && execDocSrc.includes("`true`"),
);
assert(
  "rowsAffected expectation exists",
  execDocSrc.includes("rowsAffected") && execDocSrc.includes("`1`"),
);
assert(
  "failure stop conditions exist",
  execDocSrc.includes("Failure stop conditions") || execDocSrc.includes("Stop immediately"),
);
assert(
  "Save not yet clicked marker",
  execDocSrc.includes("Save clicked | **not yet**") ||
    execDocSrc.includes("Save button clicked: not yet"),
);
assert(
  "DB write not yet executed marker",
  execDocSrc.includes("DB write executed | **not yet**") ||
    execDocSrc.includes("DB write performed: not yet"),
);
assert(
  "rollback not executed marker",
  execDocSrc.includes("Rollback SQL executed | **no**") ||
    execDocSrc.includes("rollback executed: false"),
);
assert("next phase G-9g3g5 marker", execDocSrc.includes(NEXT_PHASE));
assert("staging host", execDocSrc.includes(STAGING_HOST));
assert("production blocked", execDocSrc.includes(PRODUCTION_HOST));
assert("changedFields description only", execDocSrc.includes("description` only") || execDocSrc.includes("description only"));
assert("legacy G-6 do not press", execDocSrc.includes("schedule-dry-run-update-btn"));
assert("G-9g3d PoC do not press", execDocSrc.includes("g9g3d-save-btn"));

const preflightDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-preflight.md",
);
assert("preflight doc still exists", fs.existsSync(preflightDocPath));

const sectionSrc = readRepo(
  "tools/static-to-astro/templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
);
assert("UI Preview button id", sectionSrc.includes(PREVIEW_BTN_ID));
assert("UI Save button id", sectionSrc.includes(SAVE_BTN_ID));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
assert("current state G-9g3g4", currentStateSrc.includes("G-9g3g4"));
assert("current state commit 43c7aa7", currentStateSrc.includes("43c7aa7"));

const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
assert("next actions operator pending", nextActionsSrc.includes("operator pending") || nextActionsSrc.includes("G-9g3g4"));

const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("handoff G-9g3g4", handoffSrc.includes("G-9g3g4"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
