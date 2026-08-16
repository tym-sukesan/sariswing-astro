#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice B operational Save preflight.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-preflight
 *
 * No network / SQL apply / DB write / arm / Save / Edge deploy / Secrets mutate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-preflight.md",
);
const PLAN = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-planning.md",
);
const EDGE = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");
const TMP = path.join(
  TOOL_ROOT,
  "scripts/_tmp-slice-b-select-only-snapshot.mjs",
);

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const SECRET_ON =
  "npx supabase@2.114.0 secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta";
const SECRET_OFF =
  "npx supabase@2.114.0 secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta";
const LOCK = "2026-07-10T05:59:35.138671+00:00";
const DESC_BEFORE =
  "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
const DESC_MARKER = "[CMS Kit staging] Slice B owner Save PoC";
const HEAD = "b025eac964a34b660d7894dbfff32f7990c53d6e";

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

for (const [label, p] of [
  ["doc", DOC],
  ["plan", PLAN],
  ["edge", EDGE],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const plan = read(PLAN);
const edge = read(EDGE);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-preflight/.test(doc),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("TARGET_RELEASE 003", /TARGET_RELEASE:\s*discography-003/.test(doc));
assert("not 999 target", /discography-999/.test(doc) && /absent by design/.test(doc));
assert(
  "BEFORE_SNAPSHOT_READY true",
  /BEFORE_SNAPSHOT_READY:\s*true/.test(doc),
);
assert(
  "MINIMAL_MUTATION description_append_only",
  /MINIMAL_MUTATION:\s*description_append_only/.test(doc),
);
assert(
  "REAL_DATA_WRITE_REQUIRED true",
  /REAL_DATA_WRITE_REQUIRED:\s*true/.test(doc),
);
assert(
  "OPTIMISTIC_LOCK_READY true",
  /OPTIMISTIC_LOCK_READY:\s*true/.test(doc),
);
assert(
  "OWNER_FIXTURE_RECHECK_READY true",
  /OWNER_FIXTURE_RECHECK_READY:\s*true/.test(doc),
);
assert(
  "SECRET_ON_OFF_PACKET_READY true",
  /SECRET_ON_OFF_PACKET_READY:\s*true/.test(doc),
);
assert(
  "ONE_SHOT_SAVE_PACKET_READY true",
  /ONE_SHOT_SAVE_PACKET_READY:\s*true/.test(doc),
);
assert(
  "EXPECTED_WRITE_RESULT",
  /EXPECTED_WRITE_RESULT:\s*http_200_ok_description_only/.test(doc),
);
assert(
  "POST_WRITE_VERIFICATION_READY true",
  /POST_WRITE_VERIFICATION_READY:\s*true/.test(doc),
);
assert(
  "RESTORATION_REQUIRED true",
  /RESTORATION_REQUIRED:\s*true/.test(doc),
);
assert(
  "RESTORATION_PACKET_READY true",
  /RESTORATION_PACKET_READY:\s*true/.test(doc),
);
assert(
  "DIRECT_TABLE_WRITE_USED false",
  /DIRECT_TABLE_WRITE_USED:\s*false/.test(doc),
);
assert(
  "RLS_CHANGE_REQUIRED false",
  /RLS_CHANGE_REQUIRED:\s*false/.test(doc),
);
assert(
  "GRANT_CHANGE_REQUIRED false",
  /GRANT_CHANGE_REQUIRED:\s*false/.test(doc),
);
assert(
  "RPC_CHANGE_REQUIRED false",
  /RPC_CHANGE_REQUIRED:\s*false/.test(doc),
);
assert("PRODUCTION_BLOCKED true", /PRODUCTION_BLOCKED:\s*true/.test(doc));
assert(
  "READY_FOR_OPERATOR_SAVE true",
  /READY_FOR_OPERATOR_SAVE:\s*true/.test(doc),
);
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("SECRETS_CHANGED false", /SECRETS_CHANGED:\s*false/.test(doc));
assert(
  "DISCOGRAPHY_DATA_WRITE_EXECUTED false",
  /DISCOGRAPHY_DATA_WRITE_EXECUTED:\s*false/.test(doc),
);
assert("RPC_REACHED false this phase", /RPC_REACHED:\s*false/.test(doc));
assert("DATA_WRITE false this phase", /DATA_WRITE:\s*false/.test(doc));
assert("UI_READ_WIRING_IN_SCOPE false", /UI_READ_WIRING_IN_SCOPE:\s*false/.test(doc));
assert(
  "owner admin_users forbidden",
  /OWNER_TO_ADMIN_USERS_FORBIDDEN:\s*true/.test(doc),
);
assert("NO_RETRY_RULE_FIXED true", /NO_RETRY_RULE_FIXED:\s*true/.test(doc));
assert("SECRET_OFF_METHOD unset", /SECRET_OFF_METHOD:\s*unset/.test(doc));
assert("STAGING_REF_HARD_FIXED true", /STAGING_REF_HARD_FIXED:\s*true/.test(doc));
assert("VERSION_47_REQUIRED true", /VERSION_47_REQUIRED:\s*true/.test(doc));
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert("COMMIT_READY true", /COMMIT_READY:\s*true/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "next execution",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-execution/.test(
    doc,
  ),
);
assert(
  "deferred UI wiring",
  /DEFERRED_FINDING:\s*discography-musician-basic-live-read-wiring-fix/.test(
    doc,
  ),
);

assert("lock timestamp", doc.includes(LOCK));
assert("description before", doc.includes(DESC_BEFORE));
assert("description marker", doc.includes(DESC_MARKER));
assert("album uuid", doc.includes("d17653b4-f83d-4548-9936-d3fcc218906e"));
assert("track 1 uuid", doc.includes("f19cb2e2-8f73-4441-9a4c-463b0e7688d7"));
assert("do not fix Bluse", /Do \*\*not\*\* “fix” `白玉Bluse`/.test(doc) || /Do \*\*not\*\* "fix" `白玉Bluse`/.test(doc) || /Do \*\*not\*\* .fix. `白玉Bluse`/.test(doc));
assert("白玉Bluse preserved", doc.includes("白玉Bluse"));
assert("frozen catalog_number in payload", /catalog_number: "GSRT-0001"/.test(doc));
assert("frozen published in payload", /published: true/.test(doc));
assert(
  "no markdown url literal",
  !/\[https?:\/\/[^\]]+\]\(https?:\/\//.test(doc),
);
assert("one-shot flag", /__SLICE_B_OWNER_SAVE_FIRED/.test(doc));
assert("legacy abort 003", /legacy_id_not_003/.test(doc));
assert("lock reselect abort", /optimistic_lock_changed/.test(doc));
assert("approvalId operational", /gosaki-discography-operational-save/.test(doc));
assert("secret ON command", doc.includes(SECRET_ON));
assert("secret OFF command", doc.includes(SECRET_OFF));
assert("npx supabase 2.114.0", /npx supabase@2\.114\.0/.test(doc));
assert("process-scoped PAT", /process-scoped `SUPABASE_ACCESS_TOKEN`/.test(doc));
assert("PAT not recorded", /not recorded/.test(doc));
assert("no secrets list", /Do not run `secrets list`/.test(doc));
assert("Vite auth path", /getStagingAuthConfig/.test(doc));
assert("not DOM dataset", /Not\*\* DOM dataset/.test(doc) || /Not DOM dataset/.test(doc));
assert("no UI Save", /Do \*\*not\*\* click Save/.test(doc) || /No UI Save/.test(doc));
assert("RPC_REACHED judgement", /RPC_REACHED=true/.test(doc));
assert("DATA_WRITE judgement", /DATA_WRITE=true/.test(doc));
assert("changedFields description only", /changedFields` \| `\[\"description\"\]` only/.test(doc) || /\["description"\]` only/.test(doc));
assert("restore separate approval", /New explicit approval/.test(doc));
assert("restore via RPC", /same\*\* Edge → DEFINER RPC path/.test(doc) || /same Edge → DEFINER RPC/.test(doc));
assert("no PostgREST restore", /Do \*\*not\*\* use PostgREST/.test(doc));
assert("restore fail STOP", /do not run SQL/.test(doc));
assert("emergency SQL not now", /DO NOT RUN NOW/.test(doc));
assert("approval form", /承認します。この操作を1回だけ実行してください。/.test(doc));
assert("this phase no Save", /No Secret set\/unset · no owner POST/.test(doc));
assert("does not authorize Cursor", /does \*\*not\*\* authorize Cursor/.test(doc));

assert(
  "planning complete prior",
  /DISCOGRAPHY_SITE_OWNER_AUTHZ_SLICE_B_PLANNING_COMPLETE:\s*true/.test(plan),
);
assert(
  "planning next was this phase",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-preflight/.test(
    plan,
  ),
);

assert("edge no_change short-circuit", /reasonCode: "no_change"/.test(edge));
assert("edge operational rpc", /client\.rpc\(OPERATIONAL_SAVE_RPC_NAME/.test(edge));
assert("edge frozen fields", /OPERATIONAL_FROZEN_RELEASE_FIELDS/.test(edge));
assert("edge description editable", /"description"/.test(edge));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-operational-save-preflight"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-preflight/.test(suite) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-preflight\.mjs/.test(
      suite,
    ),
);
assert("temp snapshot script not committed", !fs.existsSync(TMP));

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
