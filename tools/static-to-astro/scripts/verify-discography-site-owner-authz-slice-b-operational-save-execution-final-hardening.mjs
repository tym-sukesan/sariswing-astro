#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice B operational Save execution final hardening.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-execution-final-hardening
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
const EDGE = path.join(
  REPO_ROOT,
  "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
);
const RPC = path.join(
  TOOL_ROOT,
  "scripts/supabase/gosaki-discography-operational-save-rpc-can-write-site.template.sql",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const HEAD = "8316f26d1f423f134a0189e4f3fcd7a2fdccd8fc";
const MD_URL = /\[https?:\/\/[^\]]+\]\(https?:\/\//;

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
  ["review", REVIEW],
  ["preflight", PRE],
  ["edge", EDGE],
  ["rpc", RPC],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const review = read(REVIEW);
const pre = read(PRE);
const edge = read(EDGE);
const rpc = read(RPC);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-execution-final-hardening/.test(
    doc,
  ),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("TARGET 003", /TARGET_RELEASE:\s*discography-003/.test(doc));
assert(
  "RAW_URL_LITERALS_CONFIRMED true",
  /RAW_URL_LITERALS_CONFIRMED:\s*true/.test(doc),
);
assert(
  "MARKDOWN_URL_LITERAL_PRESENT false",
  /MARKDOWN_URL_LITERAL_PRESENT:\s*false/.test(doc),
);
assert("FULL_ALBUM_BASELINE_GATE true", /FULL_ALBUM_BASELINE_GATE:\s*true/.test(doc));
assert(
  "ALBUM_FIELDS_MATCH_REQUIRED true",
  /ALBUM_FIELDS_MATCH_REQUIRED:\s*true/.test(doc),
);
assert(
  "POST_ONLY_DESCRIPTION_CHANGE_VERIFIED true",
  /POST_ONLY_DESCRIPTION_CHANGE_VERIFIED:\s*true/.test(doc),
);
assert(
  "PROCESS_SCOPED_PAT_READINESS_ADDED true",
  /PROCESS_SCOPED_PAT_READINESS_ADDED:\s*true/.test(doc),
);
assert(
  "AUTH_ENABLED_DEV_START_ADDED true",
  /AUTH_ENABLED_DEV_START_ADDED:\s*true/.test(doc),
);
assert(
  "RESTORATION_DEFERRED_UNTIL_NEW_LOCK true",
  /RESTORATION_DEFERRED_UNTIL_NEW_LOCK:\s*true/.test(doc),
);
assert(
  "TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY true",
  /TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY:\s*true/.test(doc),
);
assert("READY_FOR_OPERATOR_SAVE true", /READY_FOR_OPERATOR_SAVE:\s*true/.test(doc));
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("RESTORATION_IN_SAVE_PACKET false", /RESTORATION_IN_SAVE_PACKET:\s*false/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "next execution",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-execution/.test(
    doc,
  ),
);
assert(
  "deferred restoration phase",
  /DEFERRED_RESTORATION:\s*discography-site-owner-authz-slice-b-operational-save-restoration-review/.test(
    doc,
  ),
);

assert("no markdown url in hardening", !MD_URL.test(doc));
assert("no markdown url in review", !MD_URL.test(review));
assert("no markdown url in preflight", !MD_URL.test(pre));
assert("COVER_URL concat STG", /COVER_URL[\s\S]*"https:\/\/" \+[\s\S]*STG/.test(doc));
assert("STREAMING_URL quoted string", /STREAMING_URL =[\s\S]*"https:\/\/www\.tunecore\.co\.jp/.test(doc));
assert("markdown_url_literal abort", /markdown_url_literal/.test(doc));
assert("albumFieldsOk gate", /albumFieldsOk/.test(doc));
assert("album_baseline_mismatch abort", /album_baseline_mismatch/.test(doc));
assert("sort_order expected 3", /sort_order: 3/.test(doc));
assert("changedFieldsOk description only", /cf\[0\] === "description"/.test(doc));
assert("post-write othersOk", /othersOk/.test(doc));
assert("read -s PAT", /read -s SUPABASE_ACCESS_TOKEN/.test(doc));
assert("npx -y projects list", /npx -y supabase@2\.114\.0 projects list/.test(doc));
assert("Auth enabled dev", /ENABLE_ADMIN_STAGING_AUTH=true/.test(doc));
assert("PUBLIC_ADMIN_AUTH_PROVIDER supabase", /PUBLIC_ADMIN_AUTH_PROVIDER=supabase/.test(doc));
assert("WRITE_DRY_RUN true", /PUBLIC_ADMIN_WRITE_DRY_RUN=true/.test(doc));
assert("no root env edit", /Do \*\*not\*\* edit root `\.env\.local`/.test(doc));
assert(
  "no tool env source",
  /Do \*\*not\*\* `source tools\/static-to-astro\/\.env\.local`/.test(doc),
);
const saveIife = (doc.split("### 3.6")[1] || "").split("### 3.7")[0] || "";
assert("no LOCK_AFTER in save IIFE", !/LOCK_AFTER/.test(saveIife));
assert(
  "no restore placeholder in save IIFE",
  !/REPLACE_WITH_POST_WRITE_UPDATED_AT/.test(saveIife),
);
assert("restore deferred section", /Restoration deferred/.test(doc));
assert("one-shot save flag", /__SLICE_B_OWNER_SAVE_FIRED/.test(doc));
assert("no restore flag in save packet", !/__SLICE_B_OWNER_RESTORE_FIRED/.test(doc));
assert("npx -y secrets set", /npx -y supabase@2\.114\.0 secrets set/.test(doc));
assert("npx -y secrets unset", /npx -y supabase@2\.114\.0 secrets unset/.test(doc));
assert("does not authorize Cursor", /does \*\*not\*\* authorize Cursor/.test(doc));
assert("approval form", /承認します。この操作を1回だけ実行してください。/.test(doc));

assert("VERSION_47_REQUIRED false", /VERSION_47_REQUIRED:\s*false/.test(doc));
assert("PRE_ARM_VERSION_GUARD 54", /PRE_ARM_VERSION_GUARD:\s*54/.test(doc));
assert(
  "PRE_ARM_UPDATED_AT_PIN",
  /PRE_ARM_UPDATED_AT_PIN:\s*2026-08-15 14:12:36/.test(doc),
);
assert("POST_ARM_VERSION_FIXED false", /POST_ARM_VERSION_FIXED:\s*false/.test(doc));
assert(
  "UPDATED_AT_CODE_IDENTITY_PIN true",
  /UPDATED_AT_CODE_IDENTITY_PIN:\s*true/.test(doc),
);
assert("CONSOLE_STAGED_PASTE true", /CONSOLE_STAGED_PASTE:\s*true/.test(doc));
assert("FLAG_RESET_GATE true", /FLAG_RESET_GATE:\s*true/.test(doc));
assert("pre-arm VERSION 54 required", /VERSION \| \*\*54\*\*/.test(doc));
assert("pre-arm UPDATED_AT pin", /UPDATED_AT \(UTC\) \| \*\*2026-08-15 14:12:36\*\*/.test(doc));
assert(
  "no execution STOP on VERSION 47",
  !/VERSION \*\*47\*\*\. Else \*\*STOP\*\*/.test(doc),
);
assert(
  "no post-arm VERSION 54 requirement",
  /Do \*\*not\*\* require VERSION \*\*54\*\* after this command/.test(doc),
);
assert(
  "post-write VERSION not success",
  /Do \*\*not\*\* use function VERSION as a post-write success condition/.test(doc),
);
assert("historical 47 preserved", /Historical Slice A deploy VERSION was \*\*47\*\*/.test(doc));
assert("historical 50 and 52 preserved", /\*\*50\*\* \/ \*\*52\*\*/.test(doc));
assert("console staged paste", /Paste §3\.6 into the DevTools Console/.test(doc));
assert("no Enter before Secret ON", /Do \*\*not\*\* press Enter/.test(doc));
assert("Enter once after Secret ON", /press \*\*Enter once\*\*/.test(doc));
assert(
  "flag reset typeof undefined",
  /typeof window\.__SLICE_B_OWNER_SAVE_FIRED === "undefined"/.test(doc),
);
assert("flagUndefined required", /flagUndefined === true/.test(doc));

assert("review points to hardening", /execution-final-hardening/.test(review));
assert("edge tracksChanged", /tracksChanged = beforeTitles\.join/.test(edge));
assert("rpc track DML gated", /IF v_tracks_changed THEN/.test(rpc));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-operational-save-execution-final-hardening"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-execution-final-hardening/.test(
    suite,
  ) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-execution-final-hardening\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
