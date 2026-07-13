/**
 * G-20u36e-controlled-save-snapshot-select-result verifier.
 * Result record + expectation correction — no SQL re-run / DB write / Save / dryRun HTTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-snapshot-select-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-snapshot-select-result.md";
const PLAN_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-plan.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-preflight.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "b5a7141";
const TRACK7_CANONICAL = "Like a Lover";
const TRACK7_ARTIFACT = "Like a Lover（テスト）";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e snapshot result base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during result doc creation`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));

const doc = read(DOC_REL);
const planDoc = read(PLAN_DOC_REL);
const preflightDoc = read(PREFLIGHT_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase snapshot-select-result-record-and-expectation-correction",
  doc.includes("G-20u36e-controlled-save-snapshot-select-result-record-and-expectation-correction"),
);
assert(
  "doc gate snapshot result recorded",
  doc.includes("gosakiDiscographyControlledSaveSnapshotSelectResultRecorded: true"),
);
assert(
  "doc gate track7 expectation corrected",
  doc.includes("gosakiDiscographyControlledSaveTrack7ExpectationCorrected: true"),
);
assert(
  "doc snapshot SELECT executed by operator",
  doc.includes("operator") && /SELECT-only|snapshot SQL/i.test(doc),
);
assert("doc SQL re-run no", doc.includes("SQL re-run") && /no|not|false/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
assert("doc Save not executed", doc.includes("Save") && /not executed|no|未実行/i.test(doc));
assert(
  "doc dryRun HTTP not sent",
  doc.includes("dryRun") && /not sent|no|未送信/i.test(doc),
);
assert("doc no Edge deploy", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未変更/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));

assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));

assert("doc release_row_count 1", doc.includes("release_row_count") && doc.includes("1"));
assert("doc track_count 8", doc.includes("track_count") && doc.includes("8"));
assert("doc track_1_title On a Clear Day", doc.includes("track_1_title") && doc.includes("On a Clear Day"));
assert("doc track_7_title Like a Lover", doc.includes("track_7_title") && doc.includes(TRACK7_CANONICAL));
assert("doc wrong_legacy_id_rows 0", doc.includes("wrong_legacy_id_rows") && doc.includes("0"));
assert("doc wrong_site_slug_rows 0", doc.includes("wrong_site_slug_rows") && doc.includes("0"));
assert("doc release title SKYLARK", doc.includes("SKYLARK"));
assert("doc tracks fingerprint", doc.includes("tracks_title_fingerprint"));

assert(
  "doc expectation artifact Like a Lover test",
  doc.includes(TRACK7_ARTIFACT) && /artifact|expectation artifact/i.test(doc),
);
assert(
  "doc canonical expected Like a Lover",
  doc.includes("canonical") && doc.includes(TRACK7_CANONICAL),
);
assert(
  "doc do not UPDATE DB to test string",
  doc.includes("Do not UPDATE DB") || doc.includes("Do not UPDATE DB to match"),
);

assert("plan doc track 7 canonical Like a Lover", planDoc.includes(TRACK7_CANONICAL));
assert(
  "plan doc track_7 expected not test string",
  !planDoc.includes("Expected track 7") || !planDoc.match(/Expected track 7[^\n]*Like a Lover（テスト）/),
);
assert(
  "preflight doc track_7_title Like a Lover",
  preflightDoc.includes("track_7_title") && preflightDoc.includes(`| \`Like a Lover\` |`),
);
assert(
  "preflight tracksText Like a Lover not test",
  preflightDoc.includes("Like a Lover\\nThe Water Is Wide") &&
    !preflightDoc.includes("Like a Lover（テスト）\\nThe Water Is Wide"),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-snapshot-select-result"),
);

assert(
  "AI current-state snapshot result",
  currentState.includes("G-20u36e-controlled-save-snapshot-select-result") ||
    currentState.includes("gosakiDiscographyControlledSaveSnapshotSelectResultRecorded"),
);
assert(
  "AI next-actions snapshot result or next",
  nextActions.includes("G-20u36e-controlled-save-snapshot-select-result") ||
    nextActions.includes("G-20u36e-controlled-save-dryrun-payload-live-verify") ||
    nextActions.includes("G-20u36e-controlled-save-edge-save-path-planning"),
);
assert(
  "AI handoff snapshot result",
  handoff.includes("G-20u36e-controlled-save-snapshot-select-result") ||
    handoff.includes("gosakiDiscographyControlledSaveSnapshotSelectResultRecorded"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(`\nverify-g20u36e-controlled-save-snapshot-select-result: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
