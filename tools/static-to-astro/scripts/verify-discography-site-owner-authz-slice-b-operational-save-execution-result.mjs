#!/usr/bin/env node
/**
 * Offline verifier — Slice B operational Save execution result.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-execution-result
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
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-result.md",
);
const RESTORE = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-restoration-review.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const HEAD = "4d4e3548ec95199f900280930917231d0326de64";
const NEW_LOCK = "2026-08-16T16:47:01.44405+00:00";
const WRONG_LOCK = NEW_LOCK.replace("44405", "444405");
const PIN = "2026-08-15 14:12:36";
const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
const DESC_MARKER = "[CMS Kit staging] Slice B owner Save PoC";

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
  ["restoration", RESTORE],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const restore = read(RESTORE);
const pkg = read(PKG);
const suite = read(SUITE);

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-execution-result/.test(doc),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("SAVE_EXECUTED true", /SAVE_EXECUTED:\s*true/.test(doc));
assert("SAVE_SUCCESS true", /SAVE_SUCCESS:\s*true/.test(doc));
assert("OWNER_CAN_WRITE_SITE true", /OWNER_CAN_WRITE_SITE:\s*true/.test(doc));
assert("OWNER_IS_ADMIN false", /OWNER_IS_ADMIN:\s*false/.test(doc));
assert("HTTP_200 true", /HTTP_200:\s*true/.test(doc));
assert("DID_WRITE true", /DID_WRITE:\s*true/.test(doc));
assert("DB_WRITE true", /DB_WRITE:\s*true/.test(doc));
assert("RPC recorded", /RPC:\s*gosaki_discography_operational_save/.test(doc));
assert(
  "CHANGED_FIELDS_DESCRIPTION_ONLY true",
  /CHANGED_FIELDS_DESCRIPTION_ONLY:\s*true/.test(doc),
);
assert("ALBUM_FIELDS_OK true", /ALBUM_FIELDS_OK:\s*true/.test(doc));
assert("POST_WRITE_PASS true", /POST_WRITE_PASS:\s*true/.test(doc));
assert("albums 4", /ALBUMS:\s*4/.test(doc));
assert("tracks 34", /TRACKS:\s*34/.test(doc));
assert("NEW_LOCK", doc.includes(NEW_LOCK));
assert("LOCK_TRANSCRIPTION_CORRECTED true", /LOCK_TRANSCRIPTION_CORRECTED:\s*true/.test(doc));
assert("SECRET_UNSET_SAVE_NOT_ARMED true", /SECRET_UNSET_SAVE_NOT_ARMED:\s*true/.test(doc));
assert("LIVE_FUNCTION_VERSION 56", /LIVE_FUNCTION_VERSION:\s*56/.test(doc));
assert("UPDATED_AT pin", doc.includes(PIN));
assert("VERSION_54_TO_56_SECRET_REVISION true", /VERSION_54_TO_56_SECRET_REVISION:\s*true/.test(doc));
assert("PRODUCTION_UNTOUCHED true", /PRODUCTION_UNTOUCHED:\s*true/.test(doc));
assert("RESTORE_EXECUTED false", /RESTORE_EXECUTED:\s*false/.test(doc));
assert("READY_FOR_OPERATOR_RESTORE false", /READY_FOR_OPERATOR_RESTORE:\s*false/.test(doc));
assert("STOP_REASONS lock transcription", /STOP_REASONS:\s*restoration pre-restore lockOk=false/.test(doc));
assert("no wrong lock ISO in result", !doc.includes(WRONG_LOCK));
assert("transcription from the start", /from the start/.test(doc));
assert(
  "next restoration execution",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-restoration-execution/.test(
    doc,
  ),
);
assert("does not authorize Cursor", /does \*\*not\*\* authorize Cursor/.test(doc));
assert("current description has marker", doc.includes(DESC_MARKER));
assert("restore target original", doc.includes(DESC_BEFORE));
assert("HTTP 200 recorded", /HTTP \| \*\*200\*\*/.test(doc));
assert("changedFields description", /changedFields` \| `\["description"\]` exactly/.test(doc) || /`\["description"\]` exactly/.test(doc));
assert("403 save_not_armed", /save_not_armed/.test(doc));
assert("restoration SoT", /restoration-review/.test(doc));

assert("restore packet exists lock", restore.includes(NEW_LOCK));
assert("restore packet RESTORE_EXECUTED false", /RESTORE_EXECUTED:\s*false/.test(restore));
assert("restore packet READY false", /READY_FOR_OPERATOR_RESTORE:\s*false/.test(restore));
assert("no wrong lock ISO in restore packet", !restore.includes(WRONG_LOCK));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-operational-save-execution-result"/.test(pkg),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-execution-result/.test(suite) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-execution-result\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
