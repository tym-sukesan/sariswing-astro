#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice A Edge post-deploy verification recording.
 * npm: verify:discography-site-owner-authz-slice-a-edge-post-deploy-verification
 *
 * No network / SQL / DB write / arm / Save / Edge deploy / Secrets mutate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-edge-post-deploy-verification.md",
);
const PREFLIGHT = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-edge-deploy-preflight.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");

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

assert("doc exists", fs.existsSync(DOC));
assert("preflight exists", fs.existsSync(PREFLIGHT));
assert("package.json exists", fs.existsSync(PKG));
assert("safety suite exists", fs.existsSync(SUITE));

const doc = read(DOC);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-a-edge-post-deploy-verification/.test(doc),
);
assert(
  "EDGE_POST_DEPLOY_RESPONDS true",
  /EDGE_POST_DEPLOY_RESPONDS:\s*true/.test(doc),
);
assert("OPTIONS_PASS true", /OPTIONS_PASS:\s*true/.test(doc));
assert(
  "UNAUTH_SAVE_REJECT_PASS true",
  /UNAUTH_SAVE_REJECT_PASS:\s*true/.test(doc),
);
assert("DRY_RUN_PASS true", /DRY_RUN_PASS:\s*true/.test(doc));
assert("NOT_ARMED_PASS true", /NOT_ARMED_PASS:\s*true/.test(doc));
assert("DATA_UNCHANGED true", /DATA_UNCHANGED:\s*true/.test(doc));
assert("ALBUMS_CURRENT 4", /ALBUMS_CURRENT:\s*4/.test(doc));
assert("TRACKS_CURRENT 34", /TRACKS_CURRENT:\s*34/.test(doc));
assert(
  "LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED false",
  /LIVE_EDGE_CAN_WRITE_SITE_CONFIRMED:\s*false/.test(doc),
);
assert(
  "LIVE_EDGE_CAN_WRITE_SITE_UNCONFIRMED true",
  /LIVE_EDGE_CAN_WRITE_SITE_UNCONFIRMED:\s*true/.test(doc),
);
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "POST_DEPLOY_VERIFICATION_PASS true",
  /POST_DEPLOY_VERIFICATION_PASS:\s*true/.test(doc),
);
assert("EDGE_DEPLOY_EXECUTED true", /EDGE_DEPLOY_EXECUTED:\s*true/.test(doc));
assert("LIVE VERSION 47", /LIVE_STAGING_FUNCTION_VERSION:\s*47/.test(doc));
assert("RPC_WRITE_REACHED false", /RPC_WRITE_REACHED:\s*false/.test(doc));
assert("REAL_SAVE_EXECUTED false", /REAL_SAVE_EXECUTED:\s*false/.test(doc));
assert(
  "DISCOGRAPHY_DATA_WRITE_EXECUTED false",
  /DISCOGRAPHY_DATA_WRITE_EXECUTED:\s*false/.test(doc),
);
assert("ARMS_OFF true", /ARMS_OFF:\s*true/.test(doc));
assert("SECRETS_CHANGED false", /SECRETS_CHANGED:\s*false/.test(doc));
assert("SECRETS_VALUES_LOGGED false", /SECRETS_VALUES_LOGGED:\s*false/.test(doc));
assert("JWT_LOGGED false", /JWT_LOGGED:\s*false/.test(doc));
assert("PRODUCTION_UNCHANGED true", /PRODUCTION_UNCHANGED:\s*true/.test(doc));
assert(
  "OWNER_ADDED_TO_ADMIN_USERS false",
  /OWNER_ADDED_TO_ADMIN_USERS:\s*false/.test(doc),
);
assert(
  "policy fp retained",
  /CURRENT_POLICY_FP:\s*fa62157c08cffc8b49c38256ad8dfe26/.test(doc),
);
assert(
  "grants fp retained",
  /CURRENT_GRANTS_FP:\s*88986aa562aad21b7defa89648288083/.test(doc),
);
assert(
  "RPC fp retained",
  /CURRENT_RPC_FP:\s*f4d50563f2e08abcfcded8e8ade7fb3b/.test(doc),
);
assert(
  "next planning phase",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-a-live-can-write-site-probe-planning/.test(
    doc,
  ),
);
assert("HEAD recorded", /ee686db10e78f5c983dbf4a68b0e9c25933845db/.test(doc));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP named", doc.includes(PROD_REF));
assert("OPTIONS 200", /\*\*200\*\*/.test(doc) && /OPTIONS/.test(doc));
assert("unauth 401", /\*\*401\*\*/.test(doc) && /Missing authorization header/.test(doc));
assert("dryRun ok true", /ok: true/.test(doc) && /operation: dryRun/.test(doc));
assert("save_not_armed", /reasonCode: save_not_armed/.test(doc));
assert("do not prove can_write_site", /does not\*\* prove live Edge `can_write_site`/.test(doc) || /does \*\*not\*\* prove live Edge `can_write_site`/.test(doc));
assert("no owner JWT in packet", /Do \*\*not\*\* send owner JWT/.test(doc));
assert("no arm ON in packet", /Do \*\*not\*\* set arm ON/.test(doc));
assert("npm script", /"verify:discography-site-owner-authz-slice-a-edge-post-deploy-verification"/.test(pkg));
assert(
  "safety suite step",
  /verify-discography-site-owner-authz-slice-a-edge-post-deploy-verification\.mjs/.test(
    suite,
  ),
);

if (failed > 0) {
  console.error(`\nFAILED ${failed} / ${passed + failed}`);
  process.exit(1);
}
console.log(`\nALL PASS ${passed}`);
