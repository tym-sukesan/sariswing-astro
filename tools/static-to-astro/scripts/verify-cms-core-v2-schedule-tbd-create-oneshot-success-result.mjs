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

const CURRENT_RLS_FP = "3f6c87dda8edf44159d939ec69fbcc2b";

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
assert("TARGET_ROW_EXISTS true", /TARGET_ROW_EXISTS:\s*true/.test(doc));
assert("ONESHOT_TERMINAL succeeded", /ONESHOT_TERMINAL:\s*succeeded/.test(doc));
assert("ONESHOT_RERUN_FORBIDDEN true", /ONESHOT_RERUN_FORBIDDEN:\s*true/.test(doc));
assert("READY_FOR_RETRY false", /READY_FOR_RETRY:\s*false/.test(doc));
assert("CLEANUP_EXECUTED false", /CLEANUP_EXECUTED:\s*false/.test(doc));
assert("READY_FOR_CLEANUP false", /READY_FOR_CLEANUP:\s*false/.test(doc));
assert("CURRENT_TOTAL 80", /CURRENT_TOTAL:\s*80/.test(doc));
assert("CURRENT_PUBLISHED 74", /CURRENT_PUBLISHED:\s*74/.test(doc));
assert("CURRENT_GOSAKI 80", /CURRENT_GOSAKI:\s*80/.test(doc));
assert("CURRENT_TBD 1", /CURRENT_TBD:\s*1/.test(doc));
assert("CURRENT_TARGET 1", /CURRENT_TARGET:\s*1/.test(doc));
assert("CONTRACT_VIOLATIONS 0", /CONTRACT_VIOLATIONS:\s*0/.test(doc));
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
  "pending SELECT-only fingerprint",
  /DATA_SITE_SLUG_FINGERPRINT_POST_SUCCESS:\s*pending-select-only/.test(doc) &&
    /pending SELECT-only/.test(doc),
);
assert(
  "current RLS fp",
  new RegExp(CURRENT_RLS_FP).test(doc),
);
assert(
  "next primary select-only",
  /cms-core-v2-schedule-tbd-create-oneshot-post-success-select-only-fingerprint/.test(
    doc,
  ),
);
assert(
  "guards still baseline 79",
  /totalSchedules:\s*79/.test(guards),
);
assert(
  "impl records success",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED:\s*true/.test(impl) &&
    /ACTUAL_WRITE_EXECUTED:\s*true/.test(impl) &&
    /CURRENT_TOTAL:\s*80/.test(impl),
);
assert(
  "final-preflight records success",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED:\s*true/.test(
    finalDoc,
  ) &&
    /ACTUAL_WRITE_EXECUTED:\s*true/.test(finalDoc) &&
    /CURRENT_TOTAL:\s*80/.test(finalDoc),
);
assert(
  "authz records owner write success",
  /OWNER_WRITE_SUCCESS:\s*true/.test(authz) &&
    /ACTUAL_WRITE_EXECUTED:\s*true/.test(authz) &&
    /CURRENT_TOTAL:\s*80/.test(authz),
);
assert(
  "apply-result post-oneshot",
  /ACTUAL_WRITE_EXECUTED:\s*true/.test(apply) &&
    /CURRENT_TOTAL:\s*80/.test(apply) &&
    /SCHEDULE_ROW_WRITE_AT_APPLY:\s*false/.test(apply),
);
assert(
  "AI context records success",
  /cms-core-v2-schedule-tbd-create-oneshot-success-recording/.test(ai0) &&
    /INSERTED_EXACT/.test(ai0) &&
    /CURRENT_TOTAL:\s*80/.test(ai3) &&
    /post-success-select-only-fingerprint/.test(hand),
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
