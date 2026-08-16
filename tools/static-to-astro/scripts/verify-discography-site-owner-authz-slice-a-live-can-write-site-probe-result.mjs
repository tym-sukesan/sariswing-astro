#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A live Edge can_write_site probe result.
 * npm: verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-result
 *
 * No network / Secrets / POST / DB write / Edge deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-result.md",
);
const HARDENING = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening.md",
);
const PREFLIGHT = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");
const OPERATOR_PAGE = path.join(
  TOOL_ROOT,
  "templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro",
);

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

function read(p) {
  return fs.readFileSync(p, "utf8");
}

const doc = read(DOC);
const hardening = read(HARDENING);
const pre = read(PREFLIGHT);
const pkg = read(PKG);
const suite = read(SUITE);
const operatorPage = read(OPERATOR_PAGE);

assert("result doc exists", fs.existsSync(DOC));
assert("hardening exists", fs.existsSync(HARDENING));
assert("execution preflight exists", fs.existsSync(PREFLIGHT));
assert("package.json exists", fs.existsSync(PKG));
assert("safety suite exists", fs.existsSync(SUITE));
assert(
  "phase id",
  /discography-site-owner-authz-slice-a-live-can-write-site-probe-result/.test(
    doc,
  ),
);
assert(
  "SLICE_A_RESULT_RECORDED true",
  /SLICE_A_RESULT_RECORDED:\s*true/.test(doc),
);
assert("PROBE_EXECUTED true", /PROBE_EXECUTED:\s*true/.test(doc));
assert(
  "PROBE_RERUN_FORBIDDEN true",
  /PROBE_RERUN_FORBIDDEN:\s*true/.test(doc),
);
assert(
  "LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED true",
  /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*true/.test(doc),
);
assert("RPC_REACHED false", /RPC_REACHED:\s*false/.test(doc));
assert("DATA_WRITE false", /DATA_WRITE:\s*false/.test(doc));
assert(
  "DISCOGRAPHY_DATA_WRITE_EXECUTED false",
  /DISCOGRAPHY_DATA_WRITE_EXECUTED:\s*false/.test(doc),
);
assert("REAL_SAVE_EXECUTED false", /REAL_SAVE_EXECUTED:\s*false/.test(doc));
assert("SECRET_RESET true", /SECRET_RESET:\s*true/.test(doc));
assert(
  "POST_ARM_OFF_CONFIRMED true",
  /POST_ARM_OFF_CONFIRMED:\s*true/.test(doc),
);
assert("DATA_UNCHANGED true", /DATA_UNCHANGED:\s*true/.test(doc));
assert("ALBUMS_CURRENT 4", /ALBUMS_CURRENT:\s*4/.test(doc));
assert("TRACKS_CURRENT 34", /TRACKS_CURRENT:\s*34/.test(doc));
assert("DISCOGRAPHY_999_COUNT 0", /DISCOGRAPHY_999_COUNT:\s*0/.test(doc));
assert("TARGET_999_LOCKED true", /TARGET_999_LOCKED:\s*true/.test(doc));
assert("REAL_LEGACY_ID_USED false", /REAL_LEGACY_ID_USED:\s*false/.test(doc));
assert("NO_RETRY true", /NO_RETRY:\s*true/.test(doc));
assert("SECRET_OFF_METHOD unset", /SECRET_OFF_METHOD:\s*unset/.test(doc));
assert("STAGING_REF_HARD_FIXED true", /STAGING_REF_HARD_FIXED:\s*true/.test(doc));
assert(
  "LIVE_STAGING_FUNCTION_VERSION 47",
  /LIVE_STAGING_FUNCTION_VERSION:\s*47/.test(doc),
);
assert(
  "EXPECTED_SAFE_STOP release_read_failed",
  /EXPECTED_SAFE_STOP:\s*release_read_failed/.test(doc),
);
assert(
  "OWNER_FIXTURE_RECHECK_PASS true",
  /OWNER_FIXTURE_RECHECK_PASS:\s*true/.test(doc),
);
assert("OWNER_CAN_WRITE_SITE true", /OWNER_CAN_WRITE_SITE:\s*true/.test(doc));
assert("OWNER_IS_ADMIN false", /OWNER_IS_ADMIN:\s*false/.test(doc));
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert(
  "PRODUCTION_SECRETS_CHANGED false",
  /PRODUCTION_SECRETS_CHANGED:\s*false/.test(doc),
);
assert(
  "OWNER_ADDED_TO_ADMIN_USERS false",
  /OWNER_ADDED_TO_ADMIN_USERS:\s*false/.test(doc),
);
assert("UI_SAVE_CLICKED false", /UI_SAVE_CLICKED:\s*false/.test(doc));
assert(
  "UI_READ_WIRING_FINDING_RECORDED true",
  /UI_READ_WIRING_FINDING_RECORDED:\s*true/.test(doc),
);
assert("UI_READ_WIRING_FIXED false", /UI_READ_WIRING_FIXED:\s*false/.test(doc));
assert("PAT_VALUE_RECORDED false", /PAT_VALUE_RECORDED:\s*false/.test(doc));
assert("JWT_LOGGED false", /JWT_LOGGED:\s*false/.test(doc));
assert(
  "SECRETS_VALUES_LOGGED false",
  /SECRETS_VALUES_LOGGED:\s*false/.test(doc),
);
assert("COMMIT_READY true", /COMMIT_READY:\s*true/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "next slice B planning",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-planning/.test(
    doc,
  ),
);
assert(
  "deferred UI wiring",
  /DEFERRED_FINDING:\s*discography-musician-basic-live-read-wiring-fix/.test(
    doc,
  ),
);
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP named", doc.includes(PROD_REF));
assert("function name", /gosaki-discography-save-dry-run/.test(doc));
assert("HTTP 403 owner POST", /HTTP \| \*\*403\*\*/.test(doc));
assert("reasonCode release_read_failed", /release_read_failed/.test(doc));
assert("arm off save_not_armed", /save_not_armed/.test(doc));
assert("rpcKeyPresent false", /rpcKeyPresent` \| \*\*false\*\*/.test(doc));
assert("didWrite false", /didWrite` \| \*\*false\*\*/.test(doc));
assert("dbWrite false", /dbWrite` \| \*\*false\*\*/.test(doc));
assert("exactly one POST", /Exactly \*\*one\*\* POST/.test(doc));
assert("legacy 999", /discography-999/.test(doc));
assert("sentinel lock", /1970-01-01T00:00:00\.000Z/.test(doc));
assert("unset OFF", /secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED/.test(doc));
assert("CLI 2.102.0 noted", /2\.102\.0/.test(doc));
assert("npx supabase 2.114.0", /npx supabase@2\.114\.0/.test(doc));
assert("process-scoped PAT", /process-scoped/.test(doc) && /SUPABASE_ACCESS_TOKEN/.test(doc));
assert("PAT not recorded", /value \*\*not\*\* recorded/.test(doc));
assert("linked production omit forbidden", /linked-project\.json/.test(doc) && /omit/.test(doc));
assert("do not re-arm", /Do \*\*not\*\* re-arm/.test(doc));
assert("do not re-POST", /Do \*\*not\*\* re-POST/.test(doc));
assert(
  "UI finding operator page",
  /AdminGosakiStagingDiscographyOperatorPage\.astro/.test(doc),
);
assert("UI finding missing deps", /without `supabaseUrl`/.test(doc));
assert("UI not fixed this phase", /Do \*\*not\*\* fix in this recording phase/.test(doc));
assert("Cursor did not run probe", /Cursor did \*\*not\*\* run Secret/.test(doc));
assert("no service_role", /No `service_role`/.test(doc));
assert("HEAD recorded", /c7841fb001a560322e409ac831aabd2406423efd/.test(doc));
assert(
  "no JWT dump",
  !/eyJ[A-Za-z0-9_-]{20,}/.test(doc) && !/sbp_/.test(doc),
);

assert(
  "hardening still packet snapshot executed false",
  /PROBE_EXECUTED:\s*false/.test(hardening),
);
assert(
  "hardening still CONFIRMED false in packet gates",
  /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*false/.test(hardening),
);
assert(
  "hardening points at result",
  /discography-site-owner-authz-slice-a-live-can-write-site-probe-result\.md/.test(
    hardening,
  ),
);
assert(
  "preflight still packet snapshot executed false",
  /PROBE_EXECUTED:\s*false/.test(pre),
);
assert(
  "preflight points at result",
  /discography-site-owner-authz-slice-a-live-can-write-site-probe-result\.md/.test(
    pre,
  ),
);

assert(
  "operator page still missing live-read deps (unfixed)",
  /initGosakiDiscographyOperationalEdit/.test(operatorPage) &&
    !/supabaseUrl:\s*\(body\?\.dataset\.gosakiSupabaseUrl/.test(operatorPage),
);

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-result"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-a-live-can-write-site-probe-result/.test(
    suite,
  ) &&
    /verify-discography-site-owner-authz-slice-a-live-can-write-site-probe-result\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
