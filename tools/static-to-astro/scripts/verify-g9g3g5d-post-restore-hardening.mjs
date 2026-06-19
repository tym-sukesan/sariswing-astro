/**
 * G-9g3g5d — Post-restore hardening doc (planning / verification only; no DB).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const PHASE = "G-9g3g5d-post-restore-hardening";
const G9G3G4_COMMIT = "a58f5f9";
const G9G3G5C_COMMIT = "ca1f721";
const TARGET_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const MARKER = "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";
const ORIGINAL_SNIPPET = "会場website: https://subsaku.com/ginza/";
const NEXT_PHASE = "G-9g3h1-save-success-reclick-prevention";
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
  "docs/staging-shell-schedule-site-slug-operational-general-edit-post-restore-hardening.md",
);
assert("post-restore hardening doc exists", fs.existsSync(hardeningDocPath));
const hardeningSrc = fs.readFileSync(hardeningDocPath, "utf8");

assert("phase G-9g3g5d", hardeningSrc.includes(PHASE));
assert("status complete", hardeningSrc.includes("**complete**"));
assert("G-9g3g4 marker add success summary", hardeningSrc.includes(G9G3G4_COMMIT));
assert(
  "G-9g3g4 actualWrite true",
  hardeningSrc.includes("actualWrite") && hardeningSrc.includes("`true`"),
);
assert("G-9g3g5c restore success summary", hardeningSrc.includes(G9G3G5C_COMMIT));
assert("target row id", hardeningSrc.includes(TARGET_ROW_ID));
assert(
  "marker removed marker",
  hardeningSrc.includes("markerRemoved: true") ||
    hardeningSrc.includes("marker **removed**") ||
    hardeningSrc.includes("markerRemainsInStagingDb: false"),
);
assert(
  "routine dev safety marker",
  hardeningSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN: true") &&
    hardeningSrc.includes("ENABLE_ADMIN_STAGING_WRITE: false"),
);
assert(
  "restore arm off",
  hardeningSrc.includes("G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED") ||
    hardeningSrc.includes("G-9g3g5 restore arm"),
);
assert(
  "operational arm off",
  hardeningSrc.includes("G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED") ||
    hardeningSrc.includes("G-9g3g operational arm"),
);
assert(
  "re-click prevention marker",
  hardeningSrc.includes("Do not re-click G-9g3g4") &&
    hardeningSrc.includes("Do not re-click G-9g3g5"),
);
assert(
  "rollback not executed marker",
  hardeningSrc.includes("rollback executed | **no**") ||
    hardeningSrc.includes("rollbackExecuted: false"),
);
assert(
  "service_role not used marker",
  hardeningSrc.includes("serviceRoleUsed: false") ||
    hardeningSrc.includes("service_role used | **no**"),
);
assert(
  "production untouched marker",
  hardeningSrc.includes("productionUntouched: true") ||
    hardeningSrc.includes("production") && hardeningSrc.includes("untouched"),
);
assert("original description snippet", hardeningSrc.includes(ORIGINAL_SNIPPET));
assert("marker string documented", hardeningSrc.includes(MARKER));
assert("round-trip complete", hardeningSrc.includes("restoreRoundTripComplete: true"));
assert("row picker impact section", hardeningSrc.includes("Row picker"));
assert("next phase marker", hardeningSrc.includes(NEXT_PHASE));
assert("staging host", hardeningSrc.includes(STAGING_HOST));
assert("production blocked", hardeningSrc.includes(PRODUCTION_HOST));
assert(
  "no Save this phase",
  hardeningSrc.includes("Save clicked (this phase) | **no**"),
);
assert(
  "no DB write this phase",
  hardeningSrc.includes("DB write executed (this phase) | **no**"),
);

const g9g3g4ExecSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-general-edit-non-dry-run-execution-result.md",
);
const g9g3g5cExecSrc = readRepo(
  "tools/static-to-astro/docs/staging-shell-schedule-site-slug-operational-general-edit-restore-execution-result.md",
);
const currentStateSrc = readRepo("tools/static-to-astro/docs/ai/00-current-state.md");
const nextActionsSrc = readRepo("tools/static-to-astro/docs/ai/03-next-actions.md");
const handoffSrc = readRepo("tools/static-to-astro/docs/ai/handoff-to-chatgpt.md");

assert("G-9g3g4 execution doc success", g9g3g4ExecSrc.includes("success"));
assert(
  "G-9g3g5c execution doc success",
  g9g3g5cExecSrc.includes("success — restore execution complete"),
);
assert("current state G-9g3g5d", currentStateSrc.includes("G-9g3g5d"));
assert("current state ca1f721", currentStateSrc.includes("ca1f721"));
assert("next actions G-9g3h1", nextActionsSrc.includes("G-9g3h1"));
assert("handoff round-trip", handoffSrc.includes("restoreRoundTripComplete") || handoffSrc.includes("round-trip"));

console.log(`\nG-9g3g5d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
