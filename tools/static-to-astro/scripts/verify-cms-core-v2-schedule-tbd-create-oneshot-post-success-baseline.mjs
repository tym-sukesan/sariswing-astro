#!/usr/bin/env node
/**
 * Offline verifier — Schedule TBD CREATE oneshot post-success baseline recording.
 * npm: verify:cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline
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
  "docs/cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline.md",
);
const SUCCESS = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-create-oneshot-success-result.md",
);
const TBD_APPLY = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-staging-migration-apply-completion.md",
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

const SITE_SLUG_FP = "1d780b234483e3c860a66cec93311718";
const DATA_FP = "221256605d1501abc7cab3e044d54e2b";
const INDEX_FP = "cbaada6b44ae2cd07f4a0516f9d0f9b3";
const TRIGGER_FP = "2e9899f09421456307b3c96402574106";
const RLS_FP = "3f6c87dda8edf44159d939ec69fbcc2b";
const HIST_SITE = "a4ff22feb81e19789732525937f4be7e";
const HIST_DATA = "1910b4faa5b17344d63968dc25f89cd6";
const HEAD = "cef4de140de121f53331e3d87ff4de32b2565f78";

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
const tbdApply = fs.readFileSync(TBD_APPLY, "utf8");
const ai0 = fs.readFileSync(AI0, "utf8");
const ai3 = fs.readFileSync(AI3, "utf8");
const hand = fs.readFileSync(HAND, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");
const guards = fs.readFileSync(GUARDS, "utf8");

assert("baseline doc exists", fs.existsSync(DOC));
assert(
  "phase id",
  /cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline-recording/.test(
    doc,
  ),
);
assert(
  "POST_SUCCESS_BASELINE_RECORDED true",
  /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_POST_SUCCESS_BASELINE_RECORDED:\s*true/.test(
    doc,
  ) && /POST_SUCCESS_BASELINE_RECORDED:\s*true/.test(doc),
);
assert("HEAD recorded", new RegExp(HEAD).test(doc));
assert(
  "historical post-success total 80",
  /HISTORICAL_POST_SUCCESS_TOTAL:\s*80/.test(doc) ||
    (/schedules total[\s\S]*\*\*80\*\*/.test(doc) &&
      /HISTORICAL_POST_SUCCESS/.test(doc)),
);
assert(
  "historical post-success TBD 1",
  /HISTORICAL_POST_SUCCESS_TBD:\s*1/.test(doc) ||
    /TBD[\s\S]*\*\*1\*\*/.test(doc),
);
assert("TARGET_EXISTS true (historical)", /TARGET_EXISTS:\s*true/.test(doc));
assert(
  "cleanup at this phase false",
  /CLEANUP_EXECUTED_AT_THIS_PHASE:\s*false/.test(doc),
);
assert(
  "cleanup later recorded",
  /CLEANUP_LATER_RECORDED:\s*true/.test(doc) &&
    /POST_CLEANUP_CURRENT_TOTAL:\s*79/.test(doc),
);
assert(
  "target timestamps",
  /2026-08-08 11:25:17\.007763\+00/.test(doc),
);
assert(
  "POST_SUCCESS_SITE_SLUG_FP",
  new RegExp(`POST_SUCCESS_SITE_SLUG_FP:\\s*${SITE_SLUG_FP}`).test(doc),
);
assert(
  "POST_SUCCESS_DATA_FP",
  new RegExp(`POST_SUCCESS_DATA_FP:\\s*${DATA_FP}`).test(doc),
);
assert(
  "POST_SUCCESS_INDEX_FP",
  new RegExp(`POST_SUCCESS_INDEX_FP:\\s*${INDEX_FP}`).test(doc),
);
assert(
  "POST_SUCCESS_TRIGGER_FP",
  new RegExp(`POST_SUCCESS_TRIGGER_FP:\\s*${TRIGGER_FP}`).test(doc),
);
assert(
  "current RLS fp",
  new RegExp(
    `CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT:\\s*${RLS_FP}`,
  ).test(doc),
);
assert(
  "historical site_slug fp retained",
  new RegExp(`PRE_ONESHOT_SITE_SLUG_FP_HISTORICAL:\\s*${HIST_SITE}`).test(doc),
);
assert(
  "historical data fp retained",
  new RegExp(`PRE_ONESHOT_DATA_FP_HISTORICAL:\\s*${HIST_DATA}`).test(doc),
);
assert(
  "guard expected total remains 79",
  /ONESHOT_GUARD_EXPECTED_TOTAL_REMAINS:\s*79/.test(doc) &&
    /totalSchedules:\s*79/.test(guards) &&
    !/totalSchedules:\s*80/.test(guards),
);
assert(
  "TBD apply-completion keeps historical 79-row fps",
  tbdApply.includes(HIST_SITE) && tbdApply.includes(HIST_DATA),
);
assert(
  "success-result mirrors post-success fps",
  new RegExp(`POST_SUCCESS_SITE_SLUG_FP:\\s*${SITE_SLUG_FP}`).test(success) &&
    new RegExp(`POST_SUCCESS_DATA_FP:\\s*${DATA_FP}`).test(success) &&
    !/pending-select-only/.test(success),
);
assert(
  "AI context records baseline",
  /cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline-recording/.test(
    ai0,
  ) &&
    new RegExp(SITE_SLUG_FP).test(ai3) &&
    /POST_SUCCESS_BASELINE_RECORDED:\s*true/.test(hand),
);
assert(
  "npm script registered",
  /verify:cms-core-v2-schedule-tbd-create-oneshot-post-success-baseline/.test(
    pkg,
  ),
);
assert(
  "Safety Suite registers baseline",
  /schedule-tbd-create-oneshot-post-success-baseline/.test(suite),
);

console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
