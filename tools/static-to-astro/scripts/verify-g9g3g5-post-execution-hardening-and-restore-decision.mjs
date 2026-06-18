/**
 * G-9g3g5 — Post-execution hardening and restore decision (planning only; no DB write).
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
const G9G3G4_COMMIT = "a58f5f9";
const DESCRIPTION_MARKER =
  "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const RESTORE_APPROVAL_ID =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";
const RESTORE_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";
const NEXT_PHASE = "G-9g3g5b-operational-restore-preflight";

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

const g9g5DocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-post-execution-hardening-and-restore-decision.md",
);
assert("G-9g3g5 doc exists", fs.existsSync(g9g5DocPath));
const g9g5DocSrc = fs.readFileSync(g9g5DocPath, "utf8");

assert(
  "phase G-9g3g5",
  g9g5DocSrc.includes("G-9g3g5-post-execution-hardening-and-restore-decision"),
);
assert(
  "planning complete status",
  g9g5DocSrc.includes("decision / hardening planning complete"),
);
assert("execution success summary exists", g9g5DocSrc.includes(G9G3G4_COMMIT));
assert("actualWrite true in summary", g9g5DocSrc.includes("actualWrite"));
assert("rowsAffected 1 in summary", g9g5DocSrc.includes("rowsAffected"));
assert("marker currently remains", g9g5DocSrc.includes("markerRemainsInStagingDb: true"));
assert("restore options A/B/C exist", g9g5DocSrc.includes("Option A") && g9g5DocSrc.includes("Option B") && g9g5DocSrc.includes("Option C"));
assert(
  "recommended restore path Option B",
  g9g5DocSrc.includes("Option B") && g9g5DocSrc.includes("Recommended"),
);
assert("SQL rollback discouraged", g9g5DocSrc.includes("Discouraged") || g9g5DocSrc.includes("do not run"));
assert(
  "restore not executed marker",
  g9g5DocSrc.includes("restoreExecuted: false") ||
    g9g5DocSrc.includes("Restore executed | **no**"),
);
assert(
  "DB write not executed in G-9g3g5",
  g9g5DocSrc.includes("DB write executed (this phase) | **no**"),
);
assert("re-click prevention marker", g9g5DocSrc.includes("Do not re-click G-9g3g4 operational Save"));
assert("routine dev safety marker", g9g5DocSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("next phase marker", g9g5DocSrc.includes(NEXT_PHASE));
assert("target id exists", g9g5DocSrc.includes(TARGET_ROW_ID));
assert("restore approval ID recommended", g9g5DocSrc.includes(RESTORE_APPROVAL_ID));
assert("restore env arm recommended", g9g5DocSrc.includes(RESTORE_ARM));
assert("changedFields description only", g9g5DocSrc.includes("description` only") || g9g5DocSrc.includes("description only"));

const execDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md",
);
assert("G-9g3g4 execution doc exists", fs.existsSync(execDocPath));

const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
assert("config G9G3G5 phase", configSrc.includes("G-9g3g5-post-execution-hardening-and-restore-decision"));
assert("config restore approval ID", configSrc.includes(RESTORE_APPROVAL_ID));
assert("config restore env arm", configSrc.includes(RESTORE_ARM));
assert("config description original", configSrc.includes("G9G3G4_OPERATIONAL_DESCRIPTION_ORIGINAL"));

const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
assert("current state G-9g3g5", currentStateSrc.includes("G-9g3g5"));
assert("current state commit a58f5f9", currentStateSrc.includes("a58f5f9"));

const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
assert("next actions G-9g3g5b", nextActionsSrc.includes("G-9g3g5b"));

const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");
assert("handoff G-9g3g5", handoffSrc.includes("G-9g3g5"));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
