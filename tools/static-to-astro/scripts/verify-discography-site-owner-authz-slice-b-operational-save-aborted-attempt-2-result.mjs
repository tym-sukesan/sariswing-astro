#!/usr/bin/env node
/**
 * Offline verifier — Slice B operational Save aborted attempt 2 result.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-aborted-attempt-2-result
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
  "docs/discography-site-owner-authz-slice-b-operational-save-aborted-attempt-2-result.md",
);
const HARDEN = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-final-hardening.md",
);
const ABORT1 = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-aborted-attempt-result.md",
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
const HEAD = "282586a6bbcebd9c734eabfad971bf6453a9c828";
const PIN = "2026-08-15 14:12:36";

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
  ["abort-1", ABORT1],
  ["version-guard-update", GUARD],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const harden = read(HARDEN);
const abort1 = read(ABORT1);
const guard = read(GUARD);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-aborted-attempt-2-result/.test(
    doc,
  ),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("ABORTED_ATTEMPT_2_NO_WRITE true", /ABORTED_ATTEMPT_2_NO_WRITE:\s*true/.test(doc));
assert("ABORTED_ATTEMPT_2_PASS true", /ABORTED_ATTEMPT_2_PASS:\s*true/.test(doc));
assert("PRE_ARM_WAS_52_PASS true", /PRE_ARM_WAS_52_PASS:\s*true/.test(doc));
assert("save_not_armed accidental", /save_not_armed/.test(doc));
assert("already_fired", /already_fired_no_retry/.test(doc));
assert("RPC_REACHED false", /RPC_REACHED:\s*false/.test(doc));
assert("DATA_WRITE false", /DATA_WRITE:\s*false/.test(doc));
assert("LIVE_FUNCTION_VERSION 54", /LIVE_FUNCTION_VERSION:\s*54/.test(doc));
assert("PRE_ARM_VERSION_GUARD 54", /PRE_ARM_VERSION_GUARD:\s*54/.test(doc));
assert("UPDATED_AT pin", doc.includes(PIN));
assert("FLAG_RESET_GATE true", /FLAG_RESET_GATE:\s*true/.test(doc));
assert(
  "flag typeof undefined",
  /typeof window\.__SLICE_B_OWNER_SAVE_FIRED === "undefined"/.test(doc),
);
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("HISTORICAL_VERSION_47_PRESERVED true", /HISTORICAL_VERSION_47_PRESERVED:\s*true/.test(doc));
assert("HISTORICAL_VERSION_50_PRESERVED true", /HISTORICAL_VERSION_50_PRESERVED:\s*true/.test(doc));
assert("HISTORICAL_VERSION_52_PRESERVED true", /HISTORICAL_VERSION_52_PRESERVED:\s*true/.test(doc));
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

assert("hardening PRE_ARM 54", /PRE_ARM_VERSION_GUARD:\s*54/.test(harden));
assert("hardening FLAG_RESET_GATE", /FLAG_RESET_GATE:\s*true/.test(harden));
assert(
  "hardening flag typeof undefined",
  /typeof window\.__SLICE_B_OWNER_SAVE_FIRED === "undefined"/.test(harden),
);
assert("hardening flagUndefined true", /flagUndefined === true/.test(harden));
assert("hardening SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(harden));
assert("hardening historical 47", /Historical Slice A deploy VERSION was \*\*47\*\*/.test(harden));
assert("hardening historical 50/52", /\*\*50\*\* \/ \*\*52\*\*/.test(harden));

assert("abort-1 historical PRE_ARM 52", /PRE_ARM_VERSION_GUARD:\s*52/.test(abort1));
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
  /"verify:discography-site-owner-authz-slice-b-operational-save-aborted-attempt-2-result"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-aborted-attempt-2-result/.test(
    suite,
  ) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-aborted-attempt-2-result\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
