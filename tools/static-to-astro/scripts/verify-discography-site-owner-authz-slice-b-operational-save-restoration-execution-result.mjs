#!/usr/bin/env node
/**
 * Offline verifier — Slice B restoration execution result.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-restoration-execution-result
 *
 * No network / SQL / DB write / arm / Save / restore / Edge deploy / Secrets mutate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-restoration-execution-result.md",
);
const CLOSE = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-close.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const HEAD = "30353d738df06c74d6b2c3bfb31d52b65f6f3d7b";
const SAVE_LOCK = "2026-08-16T16:47:01.44405+00:00";
const RESTORED_LOCK = "2026-08-17T16:33:38.259361+00:00";
const PIN = "2026-08-15 14:12:36";
const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
const WRONG_LOCK = SAVE_LOCK.replace("44405", "444405");

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
  ["close", CLOSE],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const close = read(CLOSE);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-restoration-execution-result/.test(
    doc,
  ),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("RESTORE_EXECUTED true", /RESTORE_EXECUTED:\s*true/.test(doc));
assert("RESTORE_SUCCESS true", /RESTORE_SUCCESS:\s*true/.test(doc));
assert("RESTORE_DESCRIPTION_ONLY true", /RESTORE_DESCRIPTION_ONLY:\s*true/.test(doc));
assert("EXPECTED_BEFORE_UPDATED_AT save lock", doc.includes(`EXPECTED_BEFORE_UPDATED_AT: ${SAVE_LOCK}`));
assert("LOCK_TRANSCRIPTION_CORRECTED true", /LOCK_TRANSCRIPTION_CORRECTED:\s*true/.test(doc));
assert("PRE_RESTORE_BASELINE_PASS true", /PRE_RESTORE_BASELINE_PASS:\s*true/.test(doc));
assert("HTTP_200 true", /HTTP_200:\s*true/.test(doc));
assert("DID_WRITE true", /DID_WRITE:\s*true/.test(doc));
assert("DB_WRITE true", /DB_WRITE:\s*true/.test(doc));
assert("RPC recorded", /RPC:\s*gosaki_discography_operational_save/.test(doc));
assert("CHANGED_FIELDS_DESCRIPTION_ONLY true", /CHANGED_FIELDS_DESCRIPTION_ONLY:\s*true/.test(doc));
assert("POST_RESTORE_PASS true", /POST_RESTORE_PASS:\s*true/.test(doc));
assert("albums 4", /ALBUMS:\s*4/.test(doc));
assert("tracks 34", /TRACKS:\s*34/.test(doc));
assert("DESCRIPTION_RESTORED true", /DESCRIPTION_RESTORED:\s*true/.test(doc));
assert("RESTORED_LOCK", doc.includes(RESTORED_LOCK));
assert("LOCK_ADVANCED true", /LOCK_ADVANCED:\s*true/.test(doc));
assert("NOT_REVERTED_TO_JULY_10 true", /NOT_REVERTED_TO_JULY_10:\s*true/.test(doc));
assert("SECRET_UNSET_SAVE_NOT_ARMED true", /SECRET_UNSET_SAVE_NOT_ARMED:\s*true/.test(doc));
assert("LIVE_FUNCTION_VERSION 58", /LIVE_FUNCTION_VERSION:\s*58/.test(doc));
assert("UPDATED_AT pin", doc.includes(PIN));
assert("VERSION_56_TO_58_SECRET_REVISION true", /VERSION_56_TO_58_SECRET_REVISION:\s*true/.test(doc));
assert("PRODUCTION_UNTOUCHED true", /PRODUCTION_UNTOUCHED:\s*true/.test(doc));
assert("READY_FOR_OPERATOR_RESTORE false", /READY_FOR_OPERATOR_RESTORE:\s*false/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert("pre-restore lockOk true", /`lockOk` \| \*\*true\*\*/.test(doc));
assert("HTTP 200 restore", /HTTP \| \*\*200\*\*/.test(doc));
assert("403 save_not_armed", /save_not_armed/.test(doc));
assert("restored description", doc.includes(DESC_BEFORE));
assert("no wrong lock ISO", !doc.includes(WRONG_LOCK));
assert("close doc exists SLICE_B_PASS", /SLICE_B_PASS:\s*true/.test(close));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-operational-save-restoration-execution-result"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-restoration-execution-result/.test(
    suite,
  ) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-restoration-execution-result\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
