#!/usr/bin/env node
/**
 * Offline verifier — Schedule TBD CREATE oneshot success recording.
 * npm: verify:cms-core-v2-schedule-tbd-create-oneshot-success-result
 *
 * No network / SQL / DB write / arm / Save / cleanup.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-create-oneshot-success-result.md",
);
const IMPL = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation.md",
);
const FINAL = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-final-preflight.md",
);
const AUTHZ = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-site-owner-authz-rls-implementation.md",
);
const APPLY = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedules-site-writer-rls-apply-result.md",
);
const AI0 = path.join(TOOL_ROOT, "docs/ai/00-current-state.md");
const AI3 = path.join(TOOL_ROOT, "docs/ai/03-next-actions.md");
const HAND = path.join(TOOL_ROOT, "docs/ai/handoff-to-chatgpt.md");
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const GUARDS = path.join(
  TOOL_ROOT,
  "../../src/lib/admin/staging-write/gosaki-schedule-tbd-create-oneshot-guards.ts",
);

let passed = 0;
let failed = 0;
function assert(name, cond, detail = "") {
  if (cond) {
    console.log(`PASS ${name}`);
    passed += 1;
  } else {
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

const doc = fs.readFileSync(DOC, "utf8");
const impl = fs.readFileSync(IMPL, "utf8");
const finalDoc = fs.readFileSync(FINAL, "utf8");
const authz = fs.readFileSync(AUTHZ, "utf8");
const apply = fs.readFileSync(APPLY, "utf8");
const ai0 = fs.readFileSync(AI0, "utf8");
const ai3 = fs.readFileSync(AI3, "utf8");
const hand = fs.readFileSync(HAND, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");
const guards = fs.readFileSync(GUARDS, "utf8");

assert("success-result doc exists", fs.existsSync(DOC));
assert(
  "phase id",
  /cms-core-v2-schedule-tbd-create-oneshot-success-recording/.test(doc),
);
assert(
  "SUCCESS_RECORDED true",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED:\s*true/.test(doc) &&
    /SUCCESS_RECORDED:\s*true/.test(doc),
);
assert("OUTCOME INSERTED_EXACT", /OUTCOME:\s*INSERTED_EXACT/.test(doc));
assert("ACTUAL_WRITE_EXECUTED true", /ACTUAL_WRITE_EXECUTED:\s*true/.test(doc));
assert("TARGET_ROW_EXACT true", /TARGET_ROW_EXACT:\s*true/.test(doc));
assert("TARGET_ROW_EXISTS false", /TARGET_ROW_EXISTS:\s*false/.test(doc));
assert("ONESHOT_TERMINAL succeeded", /ONESHOT_TERMINAL:\s*succeeded/.test(doc));
assert("ONESHOT_RERUN_FORBIDDEN true", /ONESHOT_RERUN_FORBIDDEN:\s*true/.test(doc));
assert("READY_FOR_RETRY false", /READY_FOR_RETRY:\s*false/.test(doc));
assert("CLEANUP_EXECUTED true", /CLEANUP_EXECUTED:\s*true/.test(doc));
assert("CLEANUP_RECORDED true", /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_CLEANUP_RECORDED:\s*true/.test(doc));
assert("CURRENT_TOTAL 79", /CURRENT_TOTAL:\s*79/.test(doc));
assert("CURRENT_PUBLISHED 74", /CURRENT_PUBLISHED:\s*74/.test(doc));
assert("CURRENT_GOSAKI 79", /CURRENT_GOSAKI:\s*79/.test(doc));
assert("CURRENT_TBD 0", /CURRENT_TBD:\s*0/.test(doc));
assert("CURRENT_TARGET 0", /CURRENT_TARGET:\s*0/.test(doc));
assert("CONTRACT_VIOLATIONS 0", /CONTRACT_VIOLATIONS:\s*0/.test(doc));
assert("DATA_BASELINE_RESTORED true", /DATA_BASELINE_RESTORED:\s*true/.test(doc));
assert("SITE_SLUG_BASELINE_RESTORED true", /SITE_SLUG_BASELINE_RESTORED:\s*true/.test(doc));
assert("POC_CLOSE_READY true", /POC_CLOSE_READY:\s*true/.test(doc));
assert("legacy_id fixed", /schedule-2026-11-001/.test(doc));
assert("site_slug gosaki-piano", /gosaki-piano/.test(doc));
assert("published false", /published[\s\S]*\*\*false\*\*/.test(doc));
assert(
  "authz path",
  /sites\s*->\s*can_write_site\s*->\s*preflight\s*->\s*INSERT/i.test(doc),
);
assert(
  "failures resolved",
  /query-builder/.test(doc) &&
    /auth-before-preflight/.test(doc) &&
    /is_admin/.test(doc),
);
assert(
  "post-success fingerprints recorded",
  /POST_SUCCESS_SITE_SLUG_FP:\s*1d780b234483e3c860a66cec93311718/.test(doc) &&
    /POST_SUCCESS_DATA_FP:\s*221256605d1501abc7cab3e044d54e2b/.test(doc) &&
    !/pending-select-only/.test(doc),
);
assert(
  "post-cleanup fps restored",
  /POST_CLEANUP_SITE_SLUG_FP:\s*a4ff22feb81e19789732525937f4be7e/.test(doc) &&
    /POST_CLEANUP_DATA_FP:\s*1910b4faa5b17344d63968dc25f89cd6/.test(doc),
);
assert(
  "historical 79-row fps retained",
  /PRE_ONESHOT_SITE_SLUG_FP_HISTORICAL:\s*a4ff22feb81e19789732525937f4be7e/.test(
    doc,
  ) &&
    /PRE_ONESHOT_DATA_FP_HISTORICAL:\s*1910b4faa5b17344d63968dc25f89cd6/.test(
      doc,
    ),
);
assert(
  "target timestamps",
  /2026-08-08 11:25:17\.007763\+00/.test(doc),
);
assert(
  "current RLS fp",
  /3f6c87dda8edf44159d939ec69fbcc2b/.test(doc),
);
assert(
  "PoC closed next primary",
  /POC_CLOSE_READY:\s*true/.test(doc) &&
    /PoC closed for row write/i.test(doc),
);
assert(
  "guards still baseline 79",
  /totalSchedules:\s*79/.test(guards),
);
assert(
  "impl records cleanup",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_CLEANUP_RECORDED:\s*true/.test(impl) &&
    /ACTUAL_WRITE_EXECUTED:\s*true/.test(impl) &&
    /CURRENT_TOTAL:\s*79/.test(impl) &&
    /CLEANUP_EXECUTED:\s*true/.test(impl),
);
assert(
  "final-preflight records cleanup",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_CLEANUP_RECORDED:\s*true/.test(
    finalDoc,
  ) &&
    /ACTUAL_WRITE_EXECUTED:\s*true/.test(finalDoc) &&
    /CURRENT_TOTAL:\s*79/.test(finalDoc) &&
    /DATA_BASELINE_RESTORED:\s*true/.test(finalDoc),
);
assert(
  "authz records cleanup restore",
  /OWNER_WRITE_SUCCESS:\s*true/.test(authz) &&
    /CLEANUP_EXECUTED:\s*true/.test(authz) &&
    /CURRENT_TOTAL:\s*79/.test(authz),
);
assert(
  "apply-result post-cleanup",
  /ACTUAL_WRITE_EXECUTED:\s*true/.test(apply) &&
    /CURRENT_TOTAL:\s*79/.test(apply) &&
    /SITE_WRITER_RLS_RETAINED:\s*true/.test(apply) &&
    /POST_CLEANUP_SITE_SLUG_FP:\s*a4ff22feb81e19789732525937f4be7e/.test(apply),
);
assert(
  "AI context records cleanup",
  /cms-core-v2-schedule-tbd-create-oneshot-cleanup-recording/.test(ai0) &&
    /POC_CLOSE_READY:\s*true/.test(ai3) &&
    /DELETED_EXACT/.test(hand),
);
assert(
  "baseline doc referenced",
  /cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline/.test(doc),
);
assert(
  "cleanup doc referenced",
  /cms-core-v2-schedule-tbd-create-oneshot-cleanup-result/.test(doc),
);
assert(
  "npm script registered",
  /verify:cms-core-v2-schedule-tbd-create-oneshot-success-result/.test(pkg),
);
assert(
  "Safety Suite registers success-result",
  /schedule-tbd-create-oneshot-success-result/.test(suite),
);

console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
