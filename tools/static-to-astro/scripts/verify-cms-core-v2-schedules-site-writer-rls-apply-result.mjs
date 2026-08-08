#!/usr/bin/env node
/**
 * Offline verifier — schedules site-writer RLS staging apply result recording.
 * npm: verify:cms-core-v2-schedules-site-writer-rls-apply-result
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedules-site-writer-rls-apply-result.md",
);
const AUTH_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-site-owner-authz-rls-implementation.md",
);
const TBD_APPLY = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-staging-migration-apply-completion.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");

const CURRENT_FP = "3f6c87dda8edf44159d939ec69fbcc2b";
const HISTORICAL_FP = "e7344ff0de1d5e2862965ffc0e4e72cf";

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
const authDoc = fs.readFileSync(AUTH_DOC, "utf8");
const tbdApply = fs.readFileSync(TBD_APPLY, "utf8");
const pkg = fs.readFileSync(PKG, "utf8");
const suite = fs.readFileSync(SUITE, "utf8");

assert("apply-result doc exists", fs.existsSync(DOC));
assert(
  "phase id",
  /cms-core-v2-schedules-site-writer-rls-apply-result-recording/.test(doc),
);
assert("RLS_MIGRATION_EXECUTED true", /RLS_MIGRATION_EXECUTED:\s*true/.test(doc));
assert("RLS_POSTCHECK_PASS true", /RLS_POSTCHECK_PASS:\s*true/.test(doc));
assert("OWNER_VISIBILITY_PASS true", /OWNER_VISIBILITY_PASS:\s*true/.test(doc));
assert("ANON_VISIBILITY_PASS true", /ANON_VISIBILITY_PASS:\s*true/.test(doc));
assert("CAN_WRITE_SITE_PASS true", /CAN_WRITE_SITE_PASS:\s*true/.test(doc));
assert("SITE_WRITER_RLS_APPLIED true", /SITE_WRITER_RLS_APPLIED:\s*true/.test(doc));
assert(
  "current fingerprint gate",
  new RegExp(`CURRENT_STAGING_SCHEDULES_RLS_FINGERPRINT:\\s*${CURRENT_FP}`).test(
    doc,
  ),
);
assert(
  "historical fingerprint retained",
  new RegExp(
    `PRE_SITE_WRITER_RLS_FINGERPRINT_HISTORICAL:\\s*${HISTORICAL_FP}`,
  ).test(doc),
);
assert("POLICY_COUNT 4", /POLICY_COUNT:\s*4/.test(doc));
assert("applied at timestamp", /2026-08-06 01:28:23\.744153\+00/.test(doc));
assert(
  "writer policies named",
  /schedules_site_writer_select/.test(doc) &&
    /schedules_site_writer_insert/.test(doc),
);
assert(
  "legacy policies retained",
  /schedules_public_select/.test(doc) && /schedules_admin_all/.test(doc),
);
assert("owner 79", /owner schedules total[\s\S]*\*\*79\*\*/.test(doc) || /owner\s*\*\*79\*\*/.test(doc));
assert("anon 74", /anon schedules total[\s\S]*\*\*74\*\*/.test(doc) || /anon\s*\*\*74\*\*/.test(doc));
assert(
  "historical apply data 79/74",
  /Data baseline at RLS apply[\s\S]*schedules total[\s\S]*\*\*79\*\*/.test(doc) &&
    /Data baseline at RLS apply[\s\S]*published[\s\S]*\*\*74\*\*/.test(doc),
);
assert(
  "historical TBD 0 / target 0 at apply",
  /Data baseline at RLS apply[\s\S]*TBD[\s\S]*\*\*0\*\*/.test(doc) &&
    /Data baseline at RLS apply[\s\S]*target[\s\S]*\*\*0\*\*/.test(doc),
);
assert(
  "post-oneshot current 80/1",
  /CURRENT_TOTAL:\s*80/.test(doc) &&
    /CURRENT_TBD:\s*1/.test(doc) &&
    /CURRENT_TARGET:\s*1/.test(doc) &&
    /post-oneshot baseline[\s\S]*\*\*80\*\*/.test(doc),
);
assert("SCHEDULE_ROW_WRITE_AT_APPLY false", /SCHEDULE_ROW_WRITE_AT_APPLY:\s*false/.test(doc));
assert("SCHEDULE_ROW_WRITE_EXECUTED true", /SCHEDULE_ROW_WRITE_EXECUTED:\s*true/.test(doc));
assert("TARGET_ROW_EXISTS true", /TARGET_ROW_EXISTS:\s*true/.test(doc));
assert("ACTUAL_WRITE_EXECUTED true", /ACTUAL_WRITE_EXECUTED:\s*true/.test(doc));
assert("oneshot success recorded", /CMS_CORE_V2_SCHEDULE_TBD_CREATE_ONESHOT_SUCCESS_RECORDED:\s*true/.test(doc));
assert("READY_FOR_RETRY false", /READY_FOR_RETRY:\s*false/.test(doc));
assert("ROLLBACK_EXECUTED false", /ROLLBACK_EXECUTED:\s*false/.test(doc));
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert("no UPDATE/DELETE writer policies", /No UPDATE\/DELETE writer policies/.test(doc));

assert(
  "authz doc current fp",
  new RegExp(CURRENT_FP).test(authDoc) &&
    /SITE_WRITER_RLS_APPLIED:\s*true/.test(authDoc),
);
assert(
  "authz doc historical fp",
  new RegExp(HISTORICAL_FP).test(authDoc),
);

assert(
  "TBD apply-completion keeps historical RLS fp value",
  new RegExp(`RLS \\| \`${HISTORICAL_FP}\``).test(tbdApply) ||
    tbdApply.includes(HISTORICAL_FP),
);
assert(
  "TBD apply-completion notes current fp without rewriting history",
  tbdApply.includes(CURRENT_FP) && /Historical note|pre site-writer/i.test(tbdApply),
);
assert(
  "current fp not used as TBD-migration measured value rewrite",
  !new RegExp(`\\| RLS \\| \`${CURRENT_FP}\``).test(tbdApply),
);

assert(
  "npm script registered",
  /verify:cms-core-v2-schedules-site-writer-rls-apply-result/.test(pkg),
);
assert(
  "Safety Suite registers apply-result",
  /schedules-site-writer-rls-apply-result/.test(suite),
);

console.log(`RESULT ${failed === 0 ? "PASS" : "FAIL"} passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
