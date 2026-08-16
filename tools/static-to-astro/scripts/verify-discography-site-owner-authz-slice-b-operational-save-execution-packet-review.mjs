#!/usr/bin/env node
/**
 * Offline verifier — Discography Slice B operational Save execution packet review.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-execution-packet-review
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
const TMP = path.join(TOOL_ROOT, "scripts/_tmp-slice-b-packet-review-select.mjs");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const HEAD = "8316f26d1f423f134a0189e4f3fcd7a2fdccd8fc";
const LOCK = "2026-07-10T05:59:35.138671+00:00";
const DESC_BEFORE = "後藤沙紀 / piano 鈴木梨花子 / drums 寺尾陽介 / bass";
const DESC_MARKER = "[CMS Kit staging] Slice B owner Save PoC";
const SECRET_ON =
  "npx supabase@2.114.0 secrets set GOSAKI_DISCOGRAPHY_SAVE_ARMED=true --project-ref kmjqppxjdnwwrtaeqjta";
const SECRET_OFF =
  "npx supabase@2.114.0 secrets unset GOSAKI_DISCOGRAPHY_SAVE_ARMED --project-ref kmjqppxjdnwwrtaeqjta";

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
  ["preflight", PRE],
  ["edge", EDGE],
  ["rpc", RPC],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const pre = read(PRE);
const edge = read(EDGE);
const rpc = read(RPC);
const pkg = read(PKG);
const suite = read(SUITE);

assert("phase id", /discography-site-owner-authz-slice-b-operational-save-execution-packet-review/.test(doc));
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("TARGET discography-003", /TARGET_RELEASE:\s*discography-003/.test(doc));
assert("lock candidate", doc.includes(LOCK));
assert("DESC_BEFORE", doc.includes(DESC_BEFORE));
assert("DESC_MARKER", doc.includes(DESC_MARKER));
assert(
  "TARGET_LOCK_RECONFIRM_PACKET_READY true",
  /TARGET_LOCK_RECONFIRM_PACKET_READY:\s*true/.test(doc),
);
assert("FULL_BEFORE_SNAPSHOT_READY true", /FULL_BEFORE_SNAPSHOT_READY:\s*true/.test(doc));
assert(
  "TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY true",
  /TRACK_DML_SKIPPED_ON_DESCRIPTION_ONLY:\s*true/.test(doc),
);
assert(
  "ONE_SHOT_SAVE_EXACT_PACKET_READY true",
  /ONE_SHOT_SAVE_EXACT_PACKET_READY:\s*true/.test(doc),
);
assert("SECRET_RESET_PACKET_READY true", /SECRET_RESET_PACKET_READY:\s*true/.test(doc));
assert(
  "POST_WRITE_VERIFICATION_READY true",
  /POST_WRITE_VERIFICATION_READY:\s*true/.test(doc),
);
assert(
  "RESTORATION_EXACT_PACKET_READY true",
  /RESTORATION_EXACT_PACKET_READY:\s*true/.test(doc),
);
assert("RESTORATION_USES_NEW_LOCK true", /RESTORATION_USES_NEW_LOCK:\s*true/.test(doc));
assert("DIRECT_SQL_WRITE false", /DIRECT_SQL_WRITE:\s*false/.test(doc));
assert("READY_FOR_OPERATOR_SAVE true", /READY_FOR_OPERATOR_SAVE:\s*true/.test(doc));
assert("SAVE_EXECUTED false", /SAVE_EXECUTED:\s*false/.test(doc));
assert("CURSOR_EXECUTED_PACKET false", /CURSOR_EXECUTED_PACKET:\s*false/.test(doc));
assert("STOP_REASONS none", /STOP_REASONS:\s*none/.test(doc));
assert(
  "next execution",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-execution/.test(
    doc,
  ),
);
assert("secret ON", doc.includes(SECRET_ON));
assert("secret OFF unset", doc.includes(SECRET_OFF));
assert("npx 2.114.0", /npx supabase@2\.114\.0/.test(doc));
assert("one-shot save flag", /__SLICE_B_OWNER_SAVE_FIRED/.test(doc));
assert("one-shot restore flag", /__SLICE_B_OWNER_RESTORE_FIRED/.test(doc));
assert("tracks_baseline_changed abort", /tracks_baseline_changed/.test(doc));
assert("restore_lock_not_new", /restore_lock_not_new/.test(doc));
assert("LOCK_AFTER placeholder", /REPLACE_WITH_POST_WRITE_UPDATED_AT/.test(doc));
assert("arm-off uses 999", /legacyId: "discography-999"/.test(doc));
assert("do not use 003 for arm-off", /Do \*\*not\*\* use `discography-003` for this check/.test(doc));
assert("owner fixture can_write_site", /can_write_site === true/.test(doc));
assert("owner fixture is_admin false", /is_admin === false/.test(doc));
assert("approval form", /承認します。この操作を1回だけ実行してください。/.test(doc));
assert("白玉Bluse preserved", doc.includes("白玉Bluse"));
assert("RPC DELETE gated", /DELETE` \/ `INSERT` `discography_tracks` run \*\*only\*\* `IF v_tracks_changed`/.test(doc) || /only\*\* `IF v_tracks_changed`/.test(doc));
assert("this phase no Save", /Cursor did not run Secret/.test(doc));
assert("does not authorize Cursor", /does \*\*not\*\* authorize Cursor/.test(doc));

assert("preflight target 003", /TARGET_RELEASE:\s*discography-003/.test(pre));
assert("preflight lock", pre.includes(LOCK));

assert("edge tracksChanged compare", /tracksChanged = beforeTitles\.join/.test(edge));
assert("edge rpc still called", /p_track_titles: afterTitles/.test(edge));
assert("rpc v_tracks_changed gate", /IF v_tracks_changed THEN/.test(rpc));
assert("rpc DELETE inside gate", /IF v_tracks_changed THEN[\s\S]*DELETE FROM public\.discography_tracks/.test(rpc));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-operational-save-execution-packet-review"/.test(
    pkg,
  ),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-execution-packet-review/.test(suite) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-execution-packet-review\.mjs/.test(
      suite,
    ),
);
assert("temp select script absent", !fs.existsSync(TMP));
assert(
  "no markdown url literal",
  !/\[https?:\/\/[^\]]+\]\(https?:\/\//.test(doc),
);
assert(
  "operator SoT is final-hardening",
  /discography-site-owner-authz-slice-b-operational-save-execution-final-hardening/.test(
    doc,
  ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
