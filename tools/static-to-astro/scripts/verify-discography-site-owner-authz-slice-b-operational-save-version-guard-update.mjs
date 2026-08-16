#!/usr/bin/env node
/**
 * Offline verifier — Slice B operational Save VERSION guard update.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-version-guard-update
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
  "docs/discography-site-owner-authz-slice-b-operational-save-version-guard-update.md",
);
const HARDEN = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-final-hardening.md",
);
const REVIEW = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-packet-review.md",
);
const PRE = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-preflight.md",
);
const SLICE_A = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-a-live-can-write-site-probe-result.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const HEAD = "5d256e5dace06736b59e157492c6f3f33046681d";
const PIN = "2026-08-15 14:12:36";
const EXEC_STOP_47 = /VERSION \*\*47\*\*[^.]*Else \*\*STOP\*\*/;

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
  ["review", REVIEW],
  ["preflight", PRE],
  ["slice A result", SLICE_A],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const harden = read(HARDEN);
const review = read(REVIEW);
const pre = read(PRE);
const sliceA = read(SLICE_A);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-version-guard-update/.test(
    doc,
  ),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("PRE_ARM_VERSION_GUARD 50", /PRE_ARM_VERSION_GUARD:\s*50/.test(doc));
assert(
  "PRE_ARM_UPDATED_AT_PIN",
  /PRE_ARM_UPDATED_AT_PIN:\s*2026-08-15 14:12:36/.test(doc),
);
assert("POST_ARM_VERSION_FIXED false", /POST_ARM_VERSION_FIXED:\s*false/.test(doc));
assert(
  "UPDATED_AT_CODE_IDENTITY_PIN true",
  /UPDATED_AT_CODE_IDENTITY_PIN:\s*true/.test(doc),
);
assert(
  "OLD_EXECUTION_VERSION_47_REMOVED true",
  /OLD_EXECUTION_VERSION_47_REMOVED:\s*true/.test(doc),
);
assert(
  "HISTORICAL_VERSION_47_PRESERVED true",
  /HISTORICAL_VERSION_47_PRESERVED:\s*true/.test(doc),
);
assert("NO_REDEPLOY true", /NO_REDEPLOY:\s*true/.test(doc));
assert("READY_FOR_OPERATOR_SAVE true", /READY_FOR_OPERATOR_SAVE:\s*true/.test(doc));
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "next execution",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-execution/.test(
    doc,
  ),
);
assert("does not authorize Cursor", /does \*\*not\*\* authorize Cursor/.test(doc));
assert("no redeploy", /Do \*\*not\*\* redeploy to restore 47/.test(doc));
assert("target 003 unchanged", /target `discography-003`/.test(doc));
assert("description-only unchanged", /description-only mutation/.test(doc));

assert("hardening VERSION_47_REQUIRED false", /VERSION_47_REQUIRED:\s*false/.test(harden));
assert("hardening PRE_ARM_VERSION_GUARD 50", /PRE_ARM_VERSION_GUARD:\s*50/.test(harden));
assert("hardening UPDATED_AT pin", harden.includes(PIN));
assert("hardening POST_ARM_VERSION_FIXED false", /POST_ARM_VERSION_FIXED:\s*false/.test(harden));
assert(
  "hardening UPDATED_AT_CODE_IDENTITY_PIN",
  /UPDATED_AT_CODE_IDENTITY_PIN:\s*true/.test(harden),
);
assert("hardening no exec STOP 47", !EXEC_STOP_47.test(harden));
assert(
  "hardening no post-arm VERSION 50 req",
  /Do \*\*not\*\* require VERSION \*\*50\*\* after this command/.test(harden),
);
assert(
  "hardening post-write VERSION not success",
  /Do \*\*not\*\* use function VERSION as a post-write success condition/.test(
    harden,
  ),
);
assert("hardening historical 47", /Historical Slice A deploy VERSION was \*\*47\*\*/.test(harden));
assert("hardening still 003", /TARGET_RELEASE:\s*discography-003/.test(harden));
assert(
  "hardening tracks skip",
  /TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY:\s*true/.test(harden),
);
assert("hardening restore deferred", /RESTORATION_DEFERRED_UNTIL_NEW_LOCK:\s*true/.test(harden));
assert("hardening SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(harden));

assert("review VERSION_47_REQUIRED false", /VERSION_47_REQUIRED:\s*false/.test(review));
assert("review PRE_ARM_VERSION_GUARD 50", /PRE_ARM_VERSION_GUARD:\s*50/.test(review));
assert("review no exec STOP 47", !EXEC_STOP_47.test(review));
assert("review UPDATED_AT pin", review.includes(PIN));
assert(
  "review no post-arm VERSION 50 req",
  /Do \*\*not\*\* require VERSION \*\*50\*\* after this command/.test(review),
);

assert("preflight VERSION_47_REQUIRED true historical", /VERSION_47_REQUIRED:\s*true/.test(pre));
assert("preflight points to version-guard-update", /version-guard-update/.test(pre));
assert(
  "slice A historical VERSION 47",
  /LIVE_STAGING_FUNCTION_VERSION:\s*47/.test(sliceA),
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
  /"verify:discography-site-owner-authz-slice-b-operational-save-version-guard-update"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-version-guard-update/.test(
    suite,
  ) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-version-guard-update\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
