#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A live Edge can_write_site probe final hardening.
 * npm: verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening
 *
 * No network / SQL / DB write / arm / Save / Edge deploy / Secrets mutate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening.md",
);
const PRE = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight.md",
);
const PLAN = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-planning.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const SECRET_ON =
  "supabase secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta";
const SECRET_OFF =
  "supabase secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta";
const HTTP_STATUS_W = "-w '\\nHTTP_STATUS=%{http_code}\\n'";

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
  ["hardening doc", DOC],
  ["execution preflight", PRE],
  ["planning", PLAN],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const pre = read(PRE);
const plan = read(PLAN);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening/.test(
    doc,
  ),
);
assert("FINAL_HARDENING_COMPLETE true", /FINAL_HARDENING_COMPLETE:\s*true/.test(doc));
assert(
  "OWNER_FIXTURE_RECHECK_ADDED true",
  /OWNER_FIXTURE_RECHECK_ADDED:\s*true/.test(doc),
);
assert(
  "OWNER_FIXTURE_RECHECK_BEFORE_SECRET_ON true",
  /OWNER_FIXTURE_RECHECK_BEFORE_SECRET_ON:\s*true/.test(doc),
);
assert(
  "ARM_OFF_HTTP_STATUS_CAPTURED true",
  /ARM_OFF_HTTP_STATUS_CAPTURED:\s*true/.test(doc),
);
assert("TARGET_999_LOCKED true", /TARGET_999_LOCKED:\s*true/.test(doc));
assert("REAL_LEGACY_ID_PRESENT false", /REAL_LEGACY_ID_PRESENT:\s*false/.test(doc));
assert("NO_RETRY_RULE_FIXED true", /NO_RETRY_RULE_FIXED:\s*true/.test(doc));
assert("SECRET_OFF_METHOD unset", /SECRET_OFF_METHOD:\s*unset/.test(doc));
assert("STAGING_REF_HARD_FIXED true", /STAGING_REF_HARD_FIXED:\s*true/.test(doc));
assert("DATA_WRITE_REACHABLE false", /DATA_WRITE_REACHABLE:\s*false/.test(doc));
assert("RPC_REACHED_EXPECTED false", /RPC_REACHED_EXPECTED:\s*false/.test(doc));
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert("READY_FOR_OPERATOR_PROBE true", /READY_FOR_OPERATOR_PROBE:\s*true/.test(doc));
assert("COMMIT_READY true", /COMMIT_READY:\s*true/.test(doc));
assert("PROBE_EXECUTED false", /PROBE_EXECUTED:\s*false/.test(doc));
assert("SECRETS_CHANGED false", /SECRETS_CHANGED:\s*false/.test(doc));
assert("ARM_CHANGED false", /ARM_CHANGED:\s*false/.test(doc));
assert(
  "LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED false",
  /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*false/.test(doc),
);
assert(
  "OWNER_FIXTURE_RECHECK_EXECUTED false",
  /OWNER_FIXTURE_RECHECK_EXECUTED:\s*false/.test(doc),
);
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert("SECRET_ON_COMMAND exact", doc.includes(`SECRET_ON_COMMAND: ${SECRET_ON}`));
assert("SECRET_OFF_COMMAND exact", doc.includes(`SECRET_OFF_COMMAND: ${SECRET_OFF}`));
assert("ON command in packet", doc.includes(SECRET_ON));
assert("OFF command in packet", doc.includes(SECRET_OFF));
assert("OFF is unset not set false", SECRET_OFF.startsWith("supabase secrets unset "));
assert("OFF is not set false", !/GOSAKI_DISCOGRAPHY_SAVE_ARMED=false/.test(SECRET_OFF));
assert("ON has staging ref", SECRET_ON.includes(STAGING_REF));
assert("OFF has staging ref", SECRET_OFF.includes(STAGING_REF));
assert("ON has no production ref", !SECRET_ON.includes(PROD_REF));
assert("OFF has no production ref", !SECRET_OFF.includes(PROD_REF));
assert("EXPECTED_SAFE_STOP release_read_failed", /EXPECTED_SAFE_STOP:\s*release_read_failed/.test(doc));
assert("VERSION 47 required", /VERSION \*\*47\*\*/.test(doc) || /VERSION_REQUIRED/.test(doc));
assert("target 999 locked", /legacyId=discography-999/.test(doc));
assert("sentinel lock", /1970-01-01T00:00:00\.000Z/.test(doc));
assert("POST body legacy 999", /legacyId: LEGACY/.test(doc) && /const LEGACY = "discography-999"/.test(doc));
assert(
  "no real legacyId JSON in hardening packet",
  !/"legacyId": "discography-00[1-4]"/.test(doc),
);
assert("arm OFF uses 999", /arm OFF verification[\s\S]*legacyId: "discography-999"/.test(doc));
assert("HTTP_STATUS captured on arm OFF", /HTTP_STATUS:\s*res\.status/.test(doc));
assert("HTTP_STATUS=403 pass", /HTTP_STATUS=403/.test(doc));
assert("save_not_armed pass", /reasonCode=save_not_armed/.test(doc));
assert("KNOWN_DATASET_REGRESSION_FIXED true", /KNOWN_DATASET_REGRESSION_FIXED:\s*true/.test(doc));
assert("PAST_WORKING_PROBE_REUSED true", /PAST_WORKING_PROBE_REUSED:\s*true/.test(doc));
assert(
  "OWNER_FIXTURE_RECHECK_WORKING_PATH true",
  /OWNER_FIXTURE_RECHECK_WORKING_PATH:\s*true/.test(doc),
);
assert("OWNER_POST_WORKING_PATH true", /OWNER_POST_WORKING_PATH:\s*true/.test(doc));
assert(
  "TERMINAL_ENV_ASSUMPTION_VALID true",
  /TERMINAL_ENV_ASSUMPTION_VALID:\s*true/.test(doc),
);
assert(
  "CONSOLE_PREPARATION_UNAMBIGUOUS true",
  /CONSOLE_PREPARATION_UNAMBIGUOUS:\s*true/.test(doc),
);

const recheckIdx = doc.indexOf("### 3. owner fixture recheck");
const secretOnIdx = doc.indexOf("### 5. Secret ON");
const ownerPostIdx = doc.indexOf("### 6. owner browser session");
assert("recheck section present", recheckIdx >= 0);
assert("Secret ON after recheck", recheckIdx >= 0 && secretOnIdx > recheckIdx);
assert("owner POST after Secret ON", secretOnIdx >= 0 && ownerPostIdx > secretOnIdx);
assert("working path getStagingAuthConfig", /getStagingAuthConfig\(\)/.test(doc));
assert("working path getStagingSupabaseClient", /getStagingSupabaseClient\(url, anonKey\)/.test(doc));
assert(
  "vite module import auth config",
  /import\("\/src\/lib\/admin\/staging-auth\/staging-auth-config\.ts"\)/.test(doc),
);
assert(
  "vite module import auth client",
  /import\("\/src\/lib\/admin\/staging-auth\/supabase-staging-auth-client\.ts"\)/.test(doc),
);
const recheckSlice = doc.slice(recheckIdx, secretOnIdx);
const postSlice = doc.slice(ownerPostIdx, doc.indexOf("### 7. response check"));
assert(
  "recheck IIFE has no DOM dataset",
  !/dataset\.gosakiSupabase/.test(recheckSlice),
);
assert(
  "owner POST IIFE has no DOM dataset",
  !/dataset\.gosakiSupabase/.test(postSlice),
);
assert("recheck uses can_write_site RPC", /rpc\("can_write_site"/.test(recheckSlice));
assert("recheck uses is_admin RPC", /rpc\("is_admin"\)/.test(recheckSlice));
assert("recheck sites select", /\.from\("sites"\)/.test(recheckSlice) && /id,site_slug,status/.test(recheckSlice));
assert("recheck site_slug gosaki-piano", /SITE_SLUG = "gosaki-piano"/.test(recheckSlice));
assert("recheck singleton", /siteSingletonOk/.test(recheckSlice) && /rows\.length === 1/.test(recheckSlice));
assert("recheck can_write_site true", /out\.can_write_site === true/.test(recheckSlice));
assert("recheck is_admin false", /out\.is_admin === false/.test(recheckSlice));
assert("recheck ownerJwtProbePass", /ownerJwtProbePass/.test(recheckSlice));
assert(
  "recheck fail blocks Secret ON",
  /Secret ON forbidden/.test(doc) && /owner POST forbidden/.test(doc),
);
assert("recheck is not functions Save", /Not\*\* a functions Save/.test(doc) || /Not a functions Save/.test(doc));
assert(
  "recheck IIFE has no functions Save URL",
  !/gosaki-discography-save-dry-run/.test(recheckSlice),
);
assert("recheck not live Edge proof", /not\*\* live Edge/.test(doc) || /Not\*\* live Edge/.test(doc) || /not live Edge/.test(doc));
assert("no JWT log", /Do not log site UUID \/ JWT/.test(doc) || /Do not print JWT/.test(doc));
assert("do not paste §3 and §6 together", /do \*\*not\*\* paste §3 and §6 together/.test(doc));
assert("§3 while Secret OFF", /Secret still OFF/.test(doc) || /while Secret is still OFF/.test(doc));
assert(
  "OWNER_POST_PREPARED_BEFORE_SECRET_ON true",
  /OWNER_POST_PREPARED_BEFORE_SECRET_ON:\s*true/.test(doc),
);
assert(
  "NO_POST_ARM_RESEARCH_OR_COPY true",
  /NO_POST_ARM_RESEARCH_OR_COPY:\s*true/.test(doc),
);
assert(
  "§6 prepared before Secret ON",
  /Before Secret ON[\s\S]*exact §6 snippet/.test(doc) && /clipboard/.test(doc),
);
assert(
  "after Secret ON no doc copy",
  /do \*\*not\*\* open, search, edit, or copy from the doc/.test(doc),
);
assert("§6 after Secret ON no edits", /After Secret ON[\s\S]*No new code edits/.test(doc));
assert("terminal env not assumed exported", /not\*\* assumed exported/.test(doc) || /not assumed exported/.test(doc));
assert("no JWT copy to terminal", /no JWT copy to terminal/.test(doc) || /Do \*\*not\*\* copy JWT/.test(doc));
assert("UI Save forbidden", /UI Save \/ Dry-run/.test(doc));
assert("do not retry", /do not retry/.test(doc));
assert("unset regardless", /immediate Secret unset \(any outcome\)/.test(doc));
assert("no service_role", /service_role` \| \*\*forbidden\*\*/.test(doc) || /`service_role`/.test(doc));
assert("owner not added to admin_users", /OWNER_ADDED_TO_ADMIN_USERS:\s*false/.test(doc));
assert("next execution phase", /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-live-can-write-site-probe-execution/.test(doc));
assert("HEAD baseline recorded", /7d0434b5ffba905a70136870dbedb7ea77da5dd9/.test(doc));
assert("Cursor must not run", /Cursor must \*\*not\*\* run/.test(doc));
assert("preflight still unexecuted", /PROBE_EXECUTED:\s*false/.test(pre));
assert("planning still unexecuted", /PROBE_EXECUTED:\s*false/.test(plan));
assert("preflight notes hardening", /final-hardening/.test(pre));
assert("planning notes hardening", /final-hardening/.test(plan));
assert("preflight HTTP_STATUS historical", pre.includes(HTTP_STATUS_W));
assert("preflight owner fixture recheck before ON", /[Oo]wner fixture recheck/.test(pre));
assert("preflight notes dataset regression", /dataset/.test(pre) || /getStagingAuthConfig/.test(pre));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
  assert("doc records omit forbidden", /omit/.test(doc) && /linked project is production/.test(doc));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /verify-discography-site-owner-authz-slice-a-live-can-write-site-probe-final-hardening\.mjs/.test(
    suite,
  ),
);

if (failed > 0) {
  console.error(`\nFAILED ${failed} / ${passed + failed}`);
  process.exit(1);
}
console.log(`\nALL PASS ${passed}`);
