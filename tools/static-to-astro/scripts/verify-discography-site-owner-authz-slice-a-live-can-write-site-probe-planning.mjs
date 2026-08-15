#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A live Edge can_write_site probe planning.
 * npm: verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-planning
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
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-planning.md",
);
const POST = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-edge-post-deploy-verification.md",
);
const EDGE = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");

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
  ["post-deploy", POST],
  ["edge handler", EDGE],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const post = read(POST);
const handler = read(EDGE);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-a-live-can-write-site-probe-planning/.test(
    doc,
  ),
);
assert(
  "LIVE_EDGE_AUTHZ_PROBE_POSSIBLE true",
  /LIVE_EDGE_AUTHZ_PROBE_POSSIBLE:\s*true/.test(doc),
);
assert("ARM_ON_REQUIRED true", /ARM_ON_REQUIRED:\s*true/.test(doc));
assert(
  "EDGE_PROCESS_ORDER arm first",
  /EDGE_PROCESS_ORDER:\s*arm → payload_validation → JWT_client → can_write_site → SELECT_row → lock\/frozen\/no_change → operational_RPC/.test(
    doc,
  ),
);
assert(
  "SAFE_STOP_POINT release_read_failed",
  /SAFE_STOP_POINT:\s*release_read_failed after can_write_site/.test(doc),
);
assert("RPC_REACHED false", /RPC_REACHED:\s*false/.test(doc));
assert(
  "DATA_WRITE_REACHABLE false",
  /DATA_WRITE_REACHABLE:\s*false/.test(doc),
);
assert(
  "READY_FOR_OPERATOR_PROBE false",
  /READY_FOR_OPERATOR_PROBE:\s*false/.test(doc),
);
assert(
  "LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED false",
  /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*false/.test(doc),
);
assert("PROBE_EXECUTED false", /PROBE_EXECUTED:\s*false/.test(doc));
assert("ARM_CHANGED false", /ARM_CHANGED:\s*false/.test(doc));
assert("SECRETS_CHANGED false", /SECRETS_CHANGED:\s*false/.test(doc));
assert("REAL_SAVE_EXECUTED false", /REAL_SAVE_EXECUTED:\s*false/.test(doc));
assert(
  "DISCOGRAPHY_DATA_WRITE_EXECUTED false",
  /DISCOGRAPHY_DATA_WRITE_EXECUTED:\s*false/.test(doc),
);
assert(
  "DB RPC is not live Edge proof",
  /DB_RPC_PROBE_IS_NOT_LIVE_EDGE_PROOF:\s*true/.test(doc),
);
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert(
  "OWNER_ADDED_TO_ADMIN_USERS false",
  /OWNER_ADDED_TO_ADMIN_USERS:\s*false/.test(doc),
);
assert(
  "next preflight",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-live-can-write-site-probe-preflight/.test(
    doc,
  ),
);
assert("HEAD recorded", /cdcdff7ddf86d30e5126c697e53f2ecb12571c3a/.test(doc));
assert("discography-999", /discography-999/.test(doc));
assert("sentinel lock", /1970-01-01T00:00:00\.000Z/.test(doc));
assert("no retry policy", /do not retry/.test(doc));
assert("UI arm stays off", /UI arm stays off/.test(doc) || /must stay unset\/false/.test(doc));
assert("no redeploy for arm", /re-deploy is not/.test(doc) || /no redeploy/.test(doc));
assert("rejected existing album lock plan", /WRITE reachable/.test(doc));
assert("staging ref", /kmjqppxjdnwwrtaeqjta/.test(doc));
assert("production STOP", /vsbvndwuajjhnzpohghh/.test(doc));

assert(
  "post-deploy still unconfirmed",
  /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*false/.test(post),
);

const opStart = handler.indexOf("export async function handleOperationalDiscographySaveHttp");
const opSlice = opStart >= 0 ? handler.slice(opStart) : "";
assert("handler operational function present", opStart >= 0);
assert(
  "handler arm before payload in operational",
  /isDiscographySaveArmed[\s\S]*assertOperationalNoUnexpectedPayloadKeys/.test(opSlice),
);
assert(
  "handler JWT after payload in operational",
  /assertOperationalNoUnexpectedPayloadKeys[\s\S]*createUserJwtSupabaseClient/.test(opSlice),
);
assert(
  "handler can_write_site after JWT in operational",
  /createUserJwtSupabaseClient[\s\S]*assertCanWriteSiteForSiteSlug/.test(opSlice),
);
assert(
  "handler SELECT after can_write_site in operational",
  /assertCanWriteSiteForSiteSlug[\s\S]*from\("discography"\)[\s\S]*release_read_failed/.test(
    opSlice,
  ),
);
assert(
  "handler operational RPC after release_read_failed",
  /release_read_failed[\s\S]*client\.rpc\(OPERATIONAL_SAVE_RPC_NAME/.test(opSlice),
);
assert(
  "handler format legacy_id before JWT in operational",
  /handleOperationalDiscographySaveHttp[\s\S]*discography-\\d\{3\}[\s\S]*createUserJwtSupabaseClient/.test(
    handler,
  ),
);
assert("handler no trim on arm", /getEnv\(SAVE_ARMED_ENV\) === "true"/.test(handler));

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-a-live-can-write-site-probe-planning"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /verify-discography-site-owner-authz-slice-a-live-can-write-site-probe-planning\.mjs/.test(
    suite,
  ),
);

if (failed > 0) {
  console.error(`\nFAILED ${failed} / ${passed + failed}`);
  process.exit(1);
}
console.log(`\nALL PASS ${passed}`);
