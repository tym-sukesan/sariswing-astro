#!/usr/bin/env node
/**
 * Offline verifier — Schedule TBD CREATE oneshot cleanup recording.
 * npm: verify:cms-core-v2-schedule-tbd-create-oneshot-cleanup-result
 *
 * No network / SQL / DB write / arm / Save / cleanup re-run.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-create-oneshot-cleanup-result.md",
);
const SUCCESS = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-create-oneshot-success-result.md",
);
const POST = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md",
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

const RESTORED_SITE = "a4ff22feb81e19789732525937f4be7e";
const RESTORED_DATA = "1910b4faa5b17344d63968dc25f89cd6";
const POST_SITE = "1d780b234483e3c860a66cec93311718";
const POST_DATA = "221256605d1501abc7cab3e044d54e2b";
const RLS = "3f6c87dda8edf44159d939ec69fbcc2b";

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
const success = fs.readFileSync(SUCCESS, "utf8");
const post = fs.readFileSync(POST, "utf8");
const ai0 = fs.readFileSync(AI0, "utf8");
const ai3 = fs.readFileSync(AI3, "utf8");
const hand = fs.readFileSync(HAND, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");
const guards = fs.readFileSync(GUARDS, "utf8");

assert("cleanup doc exists", fs.existsSync(DOC));
assert(
  "phase id",
  /cms-core-v2-schedule-tbd-create-oneshot-cleanup-recording/.test(doc),
);
assert(
  "CLEANUP_RECORDED true",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_CLEANUP_RECORDED:\s*true/.test(
    doc,
  ) && /CLEANUP_RECORDED:\s*true/.test(doc),
);
assert("CLEANUP_EXECUTED true", /CLEANUP_EXECUTED:\s*true/.test(doc));
assert("DELETED_EXACT", /CLEANUP_DELETE_OUTCOME:\s*DELETED_EXACT/.test(doc));
assert("candidate/deleted 1", /CANDIDATE_ROWS:\s*1/.test(doc) && /DELETED_ROWS:\s*1/.test(doc));
assert("TARGET_EXISTS false", /TARGET_EXISTS:\s*false/.test(doc));
assert("CURRENT_TOTAL 79", /CURRENT_TOTAL:\s*79/.test(doc));
assert("CURRENT_TBD 0", /CURRENT_TBD:\s*0/.test(doc));
assert("DATA_BASELINE_RESTORED true", /DATA_BASELINE_RESTORED:\s*true/.test(doc));
assert(
  "SITE_SLUG_BASELINE_RESTORED true",
  /SITE_SLUG_BASELINE_RESTORED:\s*true/.test(doc),
);
assert(
  "restored site_slug fp",
  new RegExp(`POST_CLEANUP_SITE_SLUG_FP:\\s*${RESTORED_SITE}`).test(doc),
);
assert(
  "restored data fp",
  new RegExp(`POST_CLEANUP_DATA_FP:\\s*${RESTORED_DATA}`).test(doc),
);
assert("SITE_WRITER_RLS_RETAINED true", /SITE_WRITER_RLS_RETAINED:\s*true/.test(doc));
assert("RLS_ROLLBACK false", /RLS_ROLLBACK_EXECUTED:\s*false/.test(doc));
assert("current RLS retained", new RegExp(RLS).test(doc));
assert("POC_CLOSE_READY true", /POC_CLOSE_READY:\s*true/.test(doc));
assert("RETRY_REDELETE false", /RETRY_REDELETE:\s*false/.test(doc));
assert(
  "observed at",
  /2026-08-10 00:33:33\.416919\+00/.test(doc),
);
assert(
  "80-row history retained note",
  /POST_SUCCESS_80_ROW_BASELINE_RETAINED:\s*true/.test(doc) &&
    new RegExp(POST_SITE).test(doc) &&
    new RegExp(POST_DATA).test(doc),
);
assert(
  "post-success doc still has 80-row historical fps",
  new RegExp(`POST_SUCCESS_SITE_SLUG_FP:\\s*${POST_SITE}`).test(post) &&
    /HISTORICAL_POST_SUCCESS_TOTAL:\s*80/.test(post),
);
assert(
  "success-result current post-cleanup",
  /CLEANUP_EXECUTED:\s*true/.test(success) &&
    /CURRENT_TOTAL:\s*79/.test(success) &&
    /TARGET_ROW_EXISTS:\s*false/.test(success) &&
    /POC_CLOSE_READY:\s*true/.test(success),
);
assert(
  "guards still baseline 79",
  /totalSchedules:\s*79/.test(guards) && !/totalSchedules:\s*80/.test(guards),
);
assert(
  "AI context cleanup",
  /cms-core-v2-schedule-tbd-create-oneshot-cleanup-recording/.test(ai0) &&
    /POC_CLOSE_READY:\s*true/.test(ai3) &&
    /DELETED_EXACT/.test(hand),
);
assert(
  "npm script registered",
  /verify:cms-core-v2-schedule-tbd-create-oneshot-cleanup-result/.test(pkg),
);
assert(
  "Safety Suite registers cleanup",
  /schedule-tbd-create-oneshot-cleanup-result/.test(suite),
);

console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
