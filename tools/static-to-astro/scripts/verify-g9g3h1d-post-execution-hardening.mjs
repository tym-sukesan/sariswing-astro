/**
 * G-9g3h1d — Post-execution hardening doc (verification only; no DB).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3h1d-smoke-marker-restore-post-execution-hardening";
const G9G3H1C_COMMIT = "e6b3ece";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const SMOKE_MARKER =
  "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const FINAL_UPDATED_AT = "2026-06-19T02:05:42.615781+00:00";
const NEXT_PHASE = "G-9g3h2b-row-picker-exception-lifecycle-cleanup";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";

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

const hardeningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-save-reclick-post-execution-hardening.md",
);
assert("post-execution hardening doc exists", fs.existsSync(hardeningDocPath));
const hardeningSrc = fs.readFileSync(hardeningDocPath, "utf8");

assert("phase G-9g3h1d", hardeningSrc.includes(PHASE));
assert("status complete", hardeningSrc.includes("**complete**"));
assert("G-9g3h1 round-trip summary", hardeningSrc.includes("G-9g3h1 round-trip summary"));
assert("marker added and removed", hardeningSrc.includes("Marker added and removed"));
assert(
  "markerRemainsInStagingDb false",
  hardeningSrc.includes("markerRemainsInStagingDb: false"),
);
assert("final updated_at", hardeningSrc.includes(FINAL_UPDATED_AT));
assert(
  "routine dev safety",
  hardeningSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN: true") &&
    hardeningSrc.includes("ENABLE_ADMIN_STAGING_WRITE: false"),
);
assert(
  "non-dry-run env stopped marker",
  hardeningSrc.includes("Non-dry-run dev server") &&
    hardeningSrc.includes("stopped"),
);
assert(
  "serviceRoleUsed false",
  hardeningSrc.includes("serviceRoleUsed: false") ||
    hardeningSrc.includes("service_role used | **no**"),
);
assert(
  "productionBlocked true",
  hardeningSrc.includes("productionBlocked: true") ||
    hardeningSrc.includes("production") && hardeningSrc.includes("blocked"),
);
assert(
  "re-click prevention confirmed",
  hardeningSrc.includes("Re-click prevention confirmed"),
);
assert(
  "row-picker exception no longer matches after marker removal",
  hardeningSrc.includes("should no longer match") ||
    hardeningSrc.includes("no longer match"),
);
assert(
  "audit protections preserved",
  hardeningSrc.includes("Audit protections preserved"),
);
assert("generalization notes", hardeningSrc.includes("Generalization notes"));
assert("next phase recommendation", hardeningSrc.includes(NEXT_PHASE));
assert("target row id", hardeningSrc.includes(TARGET_ROW_ID));
assert("smoke marker documented", hardeningSrc.includes(SMOKE_MARKER));
assert("original description snippet", hardeningSrc.includes(ORIGINAL_SNIPPET));
assert("round-trip complete", hardeningSrc.includes("restoreRoundTripComplete: true"));
assert("G-9g3h1c commit", hardeningSrc.includes(G9G3H1C_COMMIT));
assert("staging host", hardeningSrc.includes(STAGING_HOST));
assert("production host blocked", hardeningSrc.includes(PRODUCTION_HOST));
assert(
  "no Save this phase",
  hardeningSrc.includes("Save clicked (this phase) | **no**"),
);
assert(
  "no DB write this phase",
  hardeningSrc.includes("DB write executed (this phase) | **no**"),
);
assert(
  "rollback not executed",
  hardeningSrc.includes("rollbackExecuted: false") ||
    hardeningSrc.includes("Rollback SQL executed | **no**"),
);

const g9g3h1cExecSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-save-reclick-smoke-marker-restore-execution-result.md",
);
const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert(
  "G-9g3h1c execution doc success",
  g9g3h1cExecSrc.includes("success") && g9g3h1cExecSrc.includes("markerRemainsInStagingDb: false"),
);
assert("current state G-9g3h1d complete", currentStateSrc.includes("G-9g3h1d"));
assert("current state e6b3ece", currentStateSrc.includes("e6b3ece"));
assert(
  "next actions G-9g3h2b or hardening complete",
  nextActionsSrc.includes("G-9g3h2b") || nextActionsSrc.includes("G-9g3h1d"),
);
assert(
  "handoff round-trip or marker removed",
  handoffSrc.includes("markerRemoved: true") ||
    handoffSrc.includes("restoreRoundTripComplete") ||
    handoffSrc.includes("round-trip"),
);

console.log(`\nG-9g3h1d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
