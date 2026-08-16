#!/usr/bin/env node
/**
 * Offline verifier — Slice B operational Save aborted attempt result.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result
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
  "docs/discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result.md",
);
const HARDEN = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-final-hardening.md",
);
const GUARD = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-version-guard-update.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const HEAD = "a21b6d71d80816a7150a63c208e22ab4d7f033fe";
const PIN = "2026-08-15 14:12:36";
const LOCK = "2026-07-10T05:59:35.138671+00:00";

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
  ["hardening", HARDEN],
  ["version-guard-update", GUARD],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const harden = read(HARDEN);
const guard = read(GUARD);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result/.test(
    doc,
  ),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("ABORTED_ATTEMPT_NO_WRITE true", /ABORTED_ATTEMPT_NO_WRITE:\s*true/.test(doc));
assert("ABORTED_ATTEMPT_PASS true", /ABORTED_ATTEMPT_PASS:\s*true/.test(doc));
assert("POST_EXECUTED false", /POST_EXECUTED:\s*false/.test(doc));
assert("SAVE_JS_PASTED false", /SAVE_JS_PASTED:\s*false/.test(doc));
assert("SECRET_SET_UNSET_ONCE true", /SECRET_SET_UNSET_ONCE:\s*true/.test(doc));
assert("SECRET_OFF_RECONFIRM", /SECRET_OFF_RECONFIRM:\s*save_not_armed/.test(doc));
assert("LIVE_FUNCTION_VERSION 52", /LIVE_FUNCTION_VERSION:\s*52/.test(doc));
assert("PRE_ARM_VERSION_GUARD 52", /PRE_ARM_VERSION_GUARD:\s*52/.test(doc));
assert("UPDATED_AT pin", doc.includes(PIN));
assert("UPDATED_AT_UNCHANGED true", /UPDATED_AT_UNCHANGED:\s*true/.test(doc));
assert("SELECT_ONLY_PASS true", /SELECT_ONLY_PASS:\s*true/.test(doc));
assert("lock recorded", doc.includes(LOCK));
assert("CONSOLE_STAGED_PASTE true", /CONSOLE_STAGED_PASTE:\s*true/.test(doc));
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("HISTORICAL_VERSION_47_PRESERVED true", /HISTORICAL_VERSION_47_PRESERVED:\s*true/.test(doc));
assert("HISTORICAL_VERSION_50_PRESERVED true", /HISTORICAL_VERSION_50_PRESERVED:\s*true/.test(doc));
assert("NO_REDEPLOY true", /NO_REDEPLOY:\s*true/.test(doc));
assert("READY_FOR_OPERATOR_SAVE true", /READY_FOR_OPERATOR_SAVE:\s*true/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "next execution",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-execution/.test(
    doc,
  ),
);
assert("does not authorize Cursor", /does \*\*not\*\* authorize Cursor/.test(doc));
assert("HTTP 403 save_not_armed", /HTTP \*\*403\*\*/.test(doc) && /save_not_armed/.test(doc));
assert("albums 4", /albums \| \*\*4\*\*/.test(doc));
assert("tracks 34", /tracks \| \*\*34\*\*/.test(doc));

assert("hardening PRE_ARM 52", /PRE_ARM_VERSION_GUARD:\s*52/.test(harden));
assert("hardening UPDATED_AT pin", harden.includes(PIN));
assert("hardening CONSOLE_STAGED_PASTE", /CONSOLE_STAGED_PASTE:\s*true/.test(harden));
assert("hardening no Enter before arm", /Do \*\*not\*\* press Enter/.test(harden));
assert("hardening Enter once", /press \*\*Enter once\*\*/.test(harden));
assert("hardening SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(harden));
assert("historical 47 in hardening", /Historical Slice A deploy VERSION was \*\*47\*\*/.test(harden));
assert("historical 50 in hardening", /prior checkpoint was \*\*50\*\*/.test(harden));

assert("guard-update historical PRE_ARM 50", /PRE_ARM_VERSION_GUARD:\s*50/.test(guard));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result/.test(
    suite,
  ) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
