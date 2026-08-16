#!/usr/bin/env node
/**
 * Offline verifier — Slice B VERSION 47→50 secret-revision investigation.
 * npm: verify:discography-site-owner-authz-slice-b-version-50-secret-revision-investigation
 *
 * No network / SQL / DB write / arm / Save / Edge deploy / Secrets mutate.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DOC = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-version-50-secret-revision-investigation.md",
);
const HARDEN = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-final-hardening.md",
);
const HANDLER = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const SLICE_A_SRC = "266f7b00a665d9356533975e6cfefea31a80594d";
const UPDATED_AT = "2026-08-15 14:12:36";

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
  ["handler", HANDLER],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const harden = read(HARDEN);
const handler = read(HANDLER);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-version-50-secret-revision-investigation/.test(
    doc,
  ),
);
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert(
  "VERSION_50_CAUSED_BY_SECRET_REVISION true",
  /VERSION_50_CAUSED_BY_SECRET_REVISION:\s*true/.test(doc),
);
assert(
  "LIVE_CODE_UNCHANGED_FROM_V47 true",
  /LIVE_CODE_UNCHANGED_FROM_V47:\s*true/.test(doc),
);
assert(
  "LIVE_CAN_WRITE_SITE_AUTHZ_STILL_PRESENT true",
  /LIVE_CAN_WRITE_SITE_AUTHZ_STILL_PRESENT:\s*true/.test(doc),
);
assert(
  "VERSION_GUARD_SHOULD_NOW_BE_50 true",
  /VERSION_GUARD_SHOULD_NOW_BE_50:\s*true/.test(doc),
);
assert(
  "SAFE_TO_RESUME_SLICE_B_PREFLIGHT false",
  /SAFE_TO_RESUME_SLICE_B_PREFLIGHT:\s*false/.test(doc),
);
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("EDGE_DEPLOY_EXECUTED false", /EDGE_DEPLOY_EXECUTED:\s*false/.test(doc));
assert("SECRETS_CHANGED false", /SECRETS_CHANGED:\s*false/.test(doc));
assert("REMOTE_ESZIP_DOWNLOADED false", /REMOTE_ESZIP_DOWNLOADED:\s*false/.test(doc));
assert("UPDATED_AT pin", doc.includes(UPDATED_AT));
assert("uniform +3", /47 → \*\*50\*\*/.test(doc));
assert("three secret ops", /unset[\s\S]*set[\s\S]*unset/.test(doc));
assert("no redeploy to restore 47", /Do \*\*not\*\* redeploy to “restore VERSION 47”/.test(doc) || /Do \*\*not\*\* redeploy to "restore VERSION 47"/.test(doc));
assert(
  "next version-guard-update",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-version-guard-update/.test(
    doc,
  ),
);
assert("this phase no deploy", /No `functions deploy`/.test(doc));
assert("this phase no secrets mutate", /No `secrets set`/.test(doc));

assert("investigation recorded stale 47 lock", /VERSION_47_REQUIRED:\s*true/.test(doc));
assert("hardening SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(harden));

assert("handler can_write_site helper", /assertCanWriteSiteForSiteSlug/.test(handler));
assert("handler rpc can_write_site", /rpc\("can_write_site"/.test(handler));
assert("handler no is_admin rpc", !/rpc\("is_admin"/.test(handler));
assert("handler no assertOperatorIsAdmin", !/assertOperatorIsAdmin/.test(handler));

let gitDiff = "";
try {
  gitDiff = execSync(
    `git -C "${REPO_ROOT}" diff --stat ${SLICE_A_SRC} HEAD -- supabase/functions/gosaki-discography-save-dry-run/`,
    { encoding: "utf8" },
  ).trim();
} catch (e) {
  gitDiff = `ERROR:${e && e.message ? e.message : e}`;
}
assert("git function dir unchanged since Slice A source", gitDiff === "", gitDiff);

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-version-50-secret-revision-investigation"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-version-50-secret-revision-investigation/.test(
    suite,
  ) &&
    /verify-discography-site-owner-authz-slice-b-version-50-secret-revision-investigation\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
