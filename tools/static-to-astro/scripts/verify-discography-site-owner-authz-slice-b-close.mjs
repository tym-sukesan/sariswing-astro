#!/usr/bin/env node
/**
 * Offline verifier — Discography site-owner authz Slice B close.
 * npm: verify:discography-site-owner-authz-slice-b-close
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
  "docs/discography-site-owner-authz-slice-b-close.md",
);
const RESTORE = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-restoration-execution-result.md",
);
const SAVE = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-result.md",
);
const AUDIT = path.join(
  TOOL_ROOT,
  "docs/cross-module-owner-authz-consistency-audit.md",
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
  ["restore result", RESTORE],
  ["save result", SAVE],
  ["audit", AUDIT],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const restore = read(RESTORE);
const save = read(SAVE);
const audit = read(AUDIT);
const pkg = read(PKG);
const suite = read(SUITE);

assert("phase id", /discography-site-owner-authz-slice-b-close/.test(doc));
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("SLICE_B_CLOSED true", /SLICE_B_CLOSED:\s*true/.test(doc));
assert("SLICE_B_COMPLETE true", /SLICE_B_COMPLETE:\s*true/.test(doc));
assert("SLICE_B_PASS true", /SLICE_B_PASS:\s*true/.test(doc));
assert("SAVE_SUCCESS true", /SAVE_SUCCESS:\s*true/.test(doc));
assert("RESTORE_SUCCESS true", /RESTORE_SUCCESS:\s*true/.test(doc));
assert("DESCRIPTION_RESTORED true", /DESCRIPTION_RESTORED:\s*true/.test(doc));
assert("STAGING_CONTENT_RESTORED true", /STAGING_CONTENT_RESTORED:\s*true/.test(doc));
assert("corrected Save lock", doc.includes(`CORRECTED_SAVE_LOCK: ${SAVE_LOCK}`));
assert("RESTORED_LOCK", doc.includes(RESTORED_LOCK));
assert("LOCK_ADVANCED_NOT_REVERTED true", /LOCK_ADVANCED_NOT_REVERTED:\s*true/.test(doc));
assert("LIVE_FUNCTION_VERSION 58", /LIVE_FUNCTION_VERSION:\s*58/.test(doc));
assert("UPDATED_AT pin", doc.includes(PIN));
assert("PRODUCTION_UNTOUCHED true", /PRODUCTION_UNTOUCHED:\s*true/.test(doc));
assert("READY_FOR_OPERATOR_RESTORE false", /READY_FOR_OPERATOR_RESTORE:\s*false/.test(doc));
assert("READY_FOR_OPERATOR_SAVE false", /READY_FOR_OPERATOR_SAVE:\s*false/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "Next Primary schedule UPDATE",
  /RECOMMENDED_NEXT_PRIMARY:\s*schedule-update-site-writer-rls-planning/.test(doc),
);
assert(
  "live-read deferred",
  /DEFERRED_SLICE:\s*discography-musician-basic-live-read-wiring-fix/.test(doc),
);
assert(
  "contents later",
  /LATER_ROADMAP:\s*contents-strategy-and-shell-alignment/.test(doc),
);
assert(
  "freeze still false",
  /REFERENCE_IMPLEMENTATION_FREEZE_READY:\s*false/.test(doc),
);
assert("restored description", doc.includes(DESC_BEFORE));
assert("no wrong lock ISO in close", !doc.includes(WRONG_LOCK));
assert("do not re-arm", /Do \*\*not\*\* re-arm Discography Save/.test(doc));

assert("restore result SUCCESS", /RESTORE_SUCCESS:\s*true/.test(restore));
assert("restore result RESTORED_LOCK", restore.includes(RESTORED_LOCK));
assert("restore result save lock", restore.includes(SAVE_LOCK));
assert("restore result VERSION 58", /LIVE_FUNCTION_VERSION:\s*58/.test(restore));
assert("no wrong lock ISO in restore result", !restore.includes(WRONG_LOCK));

assert("save result SUCCESS", /SAVE_SUCCESS:\s*true/.test(save));
assert("save result corrected lock", save.includes(SAVE_LOCK));
assert("no wrong lock ISO in save result", !save.includes(WRONG_LOCK));

assert(
  "audit alternate after Discography",
  /schedule-update-site-writer-rls-planning/.test(audit),
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
  /"verify:discography-site-owner-authz-slice-b-close"/.test(pkg),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-close/.test(suite) &&
    /verify-discography-site-owner-authz-slice-b-close\.mjs/.test(suite),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
