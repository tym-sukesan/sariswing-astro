#!/usr/bin/env node
/**
 * Offline verifier — Slice B operational Save restoration review.
 * npm: verify:discography-site-owner-authz-slice-b-operational-save-restoration-review
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
  "docs/discography-site-owner-authz-slice-b-operational-save-restoration-review.md",
);
const RESULT = path.join(
  TOOL_ROOT,
  "docs/discography-site-owner-authz-slice-b-operational-save-execution-result.md",
);
const PKG = path.join(TOOL_ROOT, "package.json");
const SUITE = path.join(TOOL_ROOT, "scripts/run-cms-core-v2-safety-suite.mjs");
const LINKED = path.join(REPO_ROOT, "supabase/.temp/linked-project.json");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const HEAD = "4d4e3548ec95199f900280930917231d0326de64";
const NEW_LOCK = "2026-08-16T16:47:01.44405+00:00";
const WRONG_LOCK = NEW_LOCK.replace("44405", "444405");
const OLD_LOCK = "2026-07-10T05:59:35.138671+00:00";
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
  ["execution-result", RESULT],
  ["package.json", PKG],
  ["safety suite", SUITE],
]) {
  assert(`${label} exists`, fs.existsSync(p));
}

const doc = read(DOC);
const result = read(RESULT);
const pkg = read(PKG);
const suite = read(SUITE);
const restoreIife = (doc.split("### 3.7")[1] || "").split("### 3.8")[0] || "";
const postRestore = (doc.split("### 3.10")[1] || "").split("## 4.")[0] || "";

assert(
  "phase id",
  /discography-site-owner-authz-slice-b-operational-save-restoration-review/.test(doc),
);
assert("HEAD recorded", doc.includes(HEAD));
assert("staging ref", doc.includes(STAGING_REF));
assert("production STOP", doc.includes(PROD_REF));
assert("RESTORE_DESCRIPTION_ONLY true", /RESTORE_DESCRIPTION_ONLY:\s*true/.test(doc));
assert("EXPECTED_BEFORE_UPDATED_AT newLock", doc.includes(`EXPECTED_BEFORE_UPDATED_AT: ${NEW_LOCK}`));
assert("OLD_SAVE_LOCK_FORBIDDEN true", /OLD_SAVE_LOCK_FORBIDDEN:\s*true/.test(doc));
assert("FULL_ALBUM_BASELINE_GATE true", /FULL_ALBUM_BASELINE_GATE:\s*true/.test(doc));
assert("TRACKS_UNCHANGED_REQUIRED true", /TRACKS_UNCHANGED_REQUIRED:\s*true/.test(doc));
assert(
  "ALBUM_OTHER_FIELDS_UNCHANGED_REQUIRED true",
  /ALBUM_OTHER_FIELDS_UNCHANGED_REQUIRED:\s*true/.test(doc),
);
assert("PRE_ARM_VERSION_GUARD 56", /PRE_ARM_VERSION_GUARD:\s*56/.test(doc));
assert("PRE_ARM_UPDATED_AT_PIN", doc.includes(PIN));
assert("POST_ARM_VERSION_FIXED false", /POST_ARM_VERSION_FIXED:\s*false/.test(doc));
assert("FLAG_RESET_GATE true", /FLAG_RESET_GATE:\s*true/.test(doc));
assert("CONSOLE_STAGED_PASTE true", /CONSOLE_STAGED_PASTE:\s*true/.test(doc));
assert("LOCK_TRANSCRIPTION_CORRECTED true", /LOCK_TRANSCRIPTION_CORRECTED:\s*true/.test(doc));
assert("PRE_RESTORE_LOCK_MISMATCH_STOP true", /PRE_RESTORE_LOCK_MISMATCH_STOP:\s*true/.test(doc));
assert("READY_FOR_OPERATOR_RESTORE false", /READY_FOR_OPERATOR_RESTORE:\s*false/.test(doc));
assert("RESTORE_EXECUTED false", /RESTORE_EXECUTED:\s*false/.test(doc));
assert("UPDATED_AT_NOT_REVERTED_TO_JULY_10 true", /UPDATED_AT_NOT_REVERTED_TO_JULY_10:\s*true/.test(doc));
assert("STOP_REASONS lockOk false", /STOP_REASONS:\s*pre-restore lockOk=false/.test(doc));
assert("no wrong lock ISO in restore SoT", !doc.includes(WRONG_LOCK));
assert("live lockOk false recorded", /`lockOk` \| \*\*false\*\*/.test(doc));
assert("live pass false recorded", /`pass` \| \*\*false\*\*/.test(doc));
assert("descriptionOk still true", /`descriptionOk` \| \*\*true\*\*/.test(doc));
assert(
  "next restoration execution",
  /RECOMMENDED_NEXT_PHASE:\s*discography-site-owner-authz-slice-b-operational-save-restoration-execution/.test(
    doc,
  ),
);
assert("does not authorize Cursor", /does \*\*not\*\* authorize Cursor/.test(doc));
assert("approval form", /承認します。この操作を1回だけ実行してください。/.test(doc));
assert("pre-arm VERSION 56", /VERSION \| \*\*56\*\*/.test(doc));
assert("pre-arm UPDATED_AT pin", /UPDATED_AT \(UTC\) \| \*\*2026-08-15 14:12:36\*\*/.test(doc));
assert(
  "no post-arm VERSION 56 requirement",
  /Do \*\*not\*\* require VERSION \*\*56\*\* after this command/.test(doc),
);
assert(
  "flag typeof undefined",
  /typeof window\.__SLICE_B_OWNER_RESTORE_FIRED === "undefined"/.test(doc),
);
assert("flagUndefined required", /flagUndefined === true/.test(doc));
assert("console staged paste", /Paste §3\.7 into the DevTools Console/.test(doc));
assert("no Enter before Secret ON", /Do \*\*not\*\* press Enter/.test(doc));
assert("Enter once after Secret ON", /press \*\*Enter once\*\*/.test(doc));
assert("owner can_write_site true", /can_write_site=true/.test(doc));
assert("owner is_admin false", /is_admin=false/.test(doc));
assert("999 save_not_armed", /discography-999/.test(doc) && /save_not_armed/.test(doc));
assert("DESC_BEFORE present", doc.includes(DESC_BEFORE));
assert("DESC_MARKER present", doc.includes(DESC_MARKER));
assert("no placeholder lock", !/REPLACE_WITH_POST_WRITE_UPDATED_AT/.test(doc));
assert("restore flag", /__SLICE_B_OWNER_RESTORE_FIRED/.test(restoreIife));
assert("restore IIFE newLock const", restoreIife.includes(`const LOCK = "${NEW_LOCK}"`));
assert("restore IIFE expectedBeforeUpdatedAt LOCK", /expectedBeforeUpdatedAt: LOCK/.test(restoreIife));
assert(
  "restore IIFE literal newLock guard",
  restoreIife.includes(`body.expectedBeforeUpdatedAt !== "${NEW_LOCK}"`),
);
assert("restore IIFE description DESC_BEFORE", /description: DESC_BEFORE/.test(restoreIife));
assert("restore IIFE EXPECTED DESC_AFTER", /description: DESC_AFTER/.test(restoreIife));
assert("restore IIFE tracksText TRACKS", /tracksText: TRACKS/.test(restoreIife));
assert("restore IIFE albumFieldsOk", /albumFieldsOk/.test(restoreIife));
assert("restore IIFE no old lock as expectedBefore", !restoreIife.includes(`expectedBeforeUpdatedAt: "${OLD_LOCK}"`));
assert("changedFields description only", /cf\[0\] === "description"/.test(restoreIife));
assert("post-restore description DESC_BEFORE", /descriptionOk = row && String\(row.description\) === DESC_BEFORE/.test(postRestore));
assert("post-restore lockAdvanced from newLock", /lockAdvanced = row && String\(row.updated_at\) !== LOCK/.test(postRestore));
assert("post-restore not July 10", /notRevertedToJuly10/.test(postRestore));
assert("post-restore albums 4 tracks 34", /albums.count === 4/.test(postRestore) && /tracks.count === 34/.test(postRestore));
assert("白玉Bluse preserved", /白玉Bluse/.test(doc));
assert("npx -y secrets set", /npx -y supabase@2\.114\.0 secrets set/.test(doc));
assert("npx -y secrets unset", /npx -y supabase@2\.114\.0 secrets unset/.test(doc));
assert("COVER_URL concat STG", /"https:\/\/" \+\s*\n\s*STG/.test(doc) || /"https:\/\/" \+\s*STG/.test(doc));

assert("execution-result SAVE_SUCCESS", /SAVE_SUCCESS:\s*true/.test(result));
assert("execution-result NEW_LOCK", result.includes(NEW_LOCK));
assert("execution-result RESTORE_EXECUTED false", /RESTORE_EXECUTED:\s*false/.test(result));
assert("no wrong lock ISO in execution-result", !result.includes(WRONG_LOCK));

if (fs.existsSync(LINKED)) {
  const linked = read(LINKED);
  assert("linked is production", linked.includes(PROD_REF));
  assert("linked is not staging", !linked.includes(STAGING_REF));
} else {
  assert("linked-project exists", false);
}

assert(
  "npm script",
  /"verify:discography-site-owner-authz-slice-b-operational-save-restoration-review"/.test(pkg),
);
assert(
  "safety suite step",
  /discography-site-owner-authz-slice-b-operational-save-restoration-review/.test(suite) &&
    /verify-discography-site-owner-authz-slice-b-operational-save-restoration-review\.mjs/.test(
      suite,
    ),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
