#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A live Edge can_write_site probe execution preflight.
 * npm: verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight
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
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight.md",
);
const PLAN = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-planning.md",
);
const EDGE = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
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
const handler = read(EDGE);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight/.test(
    doc,
  ),
);
assert(
  "EXECUTION_PREFLIGHT_PASS true",
  /EXECUTION_PREFLIGHT_PASS:\s*true/.test(doc),
);
assert(
  "STAGING_REF_HARD_FIXED true",
  /STAGING_REF_HARD_FIXED:\s*true/.test(doc),
);
assert(
  "VERSION_47_CONFIRMED true",
  /VERSION_47_CONFIRMED:\s*true/.test(doc),
);
assert("TARGET_999_ABSENT true", /TARGET_999_ABSENT:\s*true/.test(doc));
assert("PRE_BASELINE_PASS true", /PRE_BASELINE_PASS:\s*true/.test(doc));
assert("SECRET_ON_COMMAND exact", doc.includes(`SECRET_ON_COMMAND: ${SECRET_ON}`));
assert(
  "SECRET_OFF_COMMAND exact",
  doc.includes(`SECRET_OFF_COMMAND: ${SECRET_OFF}`),
);
assert("SECRET_OFF_METHOD unset", /SECRET_OFF_METHOD:\s*unset/.test(doc));
assert(
  "SECRET_OFF_VERIFICATION save_not_armed",
  /SECRET_OFF_VERIFICATION:[\s\S]*save_not_armed/.test(doc),
);
assert(
  "OWNER_PROBE_PACKET_READY true",
  /OWNER_PROBE_PACKET_READY:\s*true/.test(doc),
);
assert(
  "EXPECTED_SAFE_STOP release_read_failed",
  /EXPECTED_SAFE_STOP:\s*release_read_failed/.test(doc),
);
assert(
  "RPC_REACHED_EXPECTED false",
  /RPC_REACHED_EXPECTED:\s*false/.test(doc),
);
assert(
  "DATA_WRITE_REACHABLE false",
  /DATA_WRITE_REACHABLE:\s*false/.test(doc),
);
assert(
  "NO_RETRY_RULE_FIXED true",
  /NO_RETRY_RULE_FIXED:\s*true/.test(doc),
);
assert(
  "POST_BASELINE_PACKET_READY true",
  /POST_BASELINE_PACKET_READY:\s*true/.test(doc),
);
assert(
  "READY_FOR_OPERATOR_PROBE true",
  /READY_FOR_OPERATOR_PROBE:\s*true/.test(doc),
);
assert("PROBE_EXECUTED false", /PROBE_EXECUTED:\s*false/.test(doc));
assert("SECRETS_CHANGED false", /SECRETS_CHANGED:\s*false/.test(doc));
assert("ARM_CHANGED false", /ARM_CHANGED:\s*false/.test(doc));
assert("REAL_SAVE_EXECUTED false", /REAL_SAVE_EXECUTED:\s*false/.test(doc));
assert(
  "LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED false",
  /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*false/.test(doc),
);
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert("CLI 2.102.0", /2\.102\.0/.test(doc));
assert("HEAD recorded", /7d0434b5ffba905a70136870dbedb7ea77da5dd9/.test(doc));
assert("ON has staging ref", SECRET_ON.includes(STAGING_REF));
assert("OFF has staging ref", SECRET_OFF.includes(STAGING_REF));
assert("ON has no production ref", !SECRET_ON.includes(PROD_REF));
assert("OFF has no production ref", !SECRET_OFF.includes(PROD_REF));
assert("ON is set not unset", SECRET_ON.startsWith("supabase secrets set "));
assert("OFF is unset not set false", SECRET_OFF.startsWith("supabase secrets unset "));
assert("OFF is not set false", !/GOSAKI_DISCOGRAPHY_SAVE_ARMED=false/.test(SECRET_OFF));
assert("packet legacyId 999", /"legacyId": "discography-999"/.test(doc));
assert(
  "packet forbids real ids in curl body",
  !/"legacyId": "discography-00[1-4]"/.test(doc),
);
assert("sentinel lock in packet", /1970-01-01T00:00:00\.000Z/.test(doc));
assert("exactly one POST", /exactly one POST/.test(doc));
assert("do not retry", /do not retry/.test(doc));
assert("OFF even on timeout", /even if curl failed\/timed out/.test(doc) || /regardless of outcome/.test(doc));
assert("no secrets list in packet", /Do \*\*not\*\* run `secrets list`/.test(doc));
assert("no redeploy", /does \*\*not\*\* require Edge redeploy/.test(doc));
assert("UI arm off", /UI_CLIENT_WRITE_ARM_OFF:\s*true/.test(doc));
assert("Cursor must not run", /Cursor must \*\*not\*\* run/.test(doc));
assert("next execution phase", /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-live-can-write-site-probe-execution/.test(doc));
assert("albums 4", /albums[\s\S]*\*\*4\*\*/.test(doc) || /ALBUMS|albums `site_slug[\s\S]*\*\*4\*\*/.test(doc));
assert("tracks 34", /\*\*34\*\*/.test(doc));
assert("999 count 0", /discography-999` \| \*\*0\*\*/.test(doc));
assert("planning still unexecuted", /PROBE_EXECUTED:\s*false/.test(plan));
assert("handler arm exact true", /getEnv\(SAVE_ARMED_ENV\) === "true"/.test(handler));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
  assert("doc records linked production", /linked-project\.json/.test(doc));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /verify-discography-site-owner-authz-slice-a-live-can-write-site-probe-execution-preflight\.mjs/.test(
    suite,
  ),
);

if (failed > 0) {
  console.error(`\nFAILED ${failed} / ${passed + failed}`);
  process.exit(1);
}
console.log(`\nALL PASS ${passed}`);
