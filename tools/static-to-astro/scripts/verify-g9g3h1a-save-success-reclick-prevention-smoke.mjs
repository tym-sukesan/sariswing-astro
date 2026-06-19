/**
 * G-9g3h1a — Save success re-click prevention smoke (operator pending; no Save/Preview by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h1a-save-success-reclick-prevention-smoke-test";
const PRIOR_COMMIT = "8780f84";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const TARGET_LEGACY_ID = "schedule-2026-03-001";
const SITE_SLUG = "gosaki-piano";
const OPERATIONAL_APPROVAL_ID =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const OPERATIONAL_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const RESTORE_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const GATE_PANEL_ID = "site-slug-edit-save-gate-panel";
const SMOKE_MARKER =
  "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const NEXT_RESTORE_PREFLIGHT = "G-9g3h1b-smoke-marker-restore-preflight";
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
  "docs/staging-shell-schedule-site-slug-operational-save-success-reclick-prevention-smoke-test-result.md",
);
assert("smoke doc exists", fs.existsSync(smokeDocPath));
const smokeDocSrc = fs.readFileSync(smokeDocPath, "utf8");

assert("phase G-9g3h1a", smokeDocSrc.includes(PHASE));
assert("status operator pending", smokeDocSrc.includes("operator pending"));
assert("target id exists", smokeDocSrc.includes(TARGET_ROW_ID));
assert("target legacy_id exists", smokeDocSrc.includes(TARGET_LEGACY_ID));
assert("target site_slug exists", smokeDocSrc.includes(SITE_SLUG));
assert("smoke marker exists", smokeDocSrc.includes(SMOKE_MARKER));
assert("original description snippet", smokeDocSrc.includes(ORIGINAL_SNIPPET));
assert("env stack exists", smokeDocSrc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert(
  "operational approval ID",
  smokeDocSrc.includes(OPERATIONAL_APPROVAL_ID),
);
assert("operational env arm", smokeDocSrc.includes(`${OPERATIONAL_ARM}=true`));
assert("restore arm off", smokeDocSrc.includes(`${RESTORE_ARM} — off`));
assert(
  "exact Preview button id",
  smokeDocSrc.includes(`#${PREVIEW_BTN_ID}`),
);
assert("exact Preview result panel", smokeDocSrc.includes(`#${PREVIEW_RESULT_ID}`));
assert(
  "exact Save button id",
  smokeDocSrc.includes(`#${SAVE_BTN_ID}`),
);
assert("exact Save result panel", smokeDocSrc.includes(`#${SAVE_RESULT_ID}`));
assert("gate panel id", smokeDocSrc.includes(`#${GATE_PANEL_ID}`));
assert(
  "expected preview actualWrite false",
  smokeDocSrc.includes("actualWrite") && smokeDocSrc.includes("`false`"),
);
assert(
  "expected save success actualWrite true",
  smokeDocSrc.includes("actualWrite") && smokeDocSrc.includes("`true`"),
);
assert(
  "re-click blocked expectation",
  smokeDocSrc.includes("re-click blocked") ||
    smokeDocSrc.includes("Re-click is blocked") ||
    smokeDocSrc.includes("re-click prevention"),
);
assert(
  "consumed preview expectation",
  smokeDocSrc.includes("consumed preview") ||
    smokeDocSrc.includes("preview consumed"),
);
assert(
  "fresh Preview required",
  smokeDocSrc.includes("fresh Preview required"),
);
assert(
  "candidate change behavior",
  smokeDocSrc.includes("Candidate change") || smokeDocSrc.includes("Step J"),
);
assert(
  "stop conditions exist",
  smokeDocSrc.includes("Stop conditions") || smokeDocSrc.includes("STOP"),
);
assert(
  "Save not yet clicked marker",
  smokeDocSrc.includes("Save clicked | **no**") ||
    smokeDocSrc.includes("not yet"),
);
assert(
  "DB write not yet executed marker",
  smokeDocSrc.includes("DB write executed | **no**"),
);
assert(
  "next restore-preflight recommendation",
  smokeDocSrc.includes(NEXT_RESTORE_PREFLIGHT),
);
assert("staging host only", smokeDocSrc.includes(STAGING_HOST));
assert("production blocked", smokeDocSrc.includes(PRODUCTION_HOST));
assert("staging shell URL", smokeDocSrc.includes(STAGING_SHELL_URL));
assert("prior commit 8780f84", smokeDocSrc.includes(PRIOR_COMMIT));
assert(
  "wrong buttons documented",
  smokeDocSrc.includes("#schedule-dry-run-update-btn"),
);
assert(
  "no second Save warning",
  smokeDocSrc.includes("do not click Save again") ||
    smokeDocSrc.includes("Do not click Save a second time"),
);

const implDocSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-save-success-reclick-prevention.md",
);
const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");

assert("G-9g3h1 impl doc references smoke", implDocSrc.includes("G-9g3h1a"));
assert("edit UI reclick prevention", editUiSrc.includes("operationalSaveSuccess"));
assert("current state G-9g3h1a", currentStateSrc.includes("G-9g3h1a"));
assert("current state 8780f84", currentStateSrc.includes("8780f84"));
assert("next actions smoke or restore", nextActionsSrc.includes("G-9g3h1a"));
assert("handoff operator pending or smoke", handoffSrc.includes("G-9g3h1a"));

console.log(`\nG-9g3h1a verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
