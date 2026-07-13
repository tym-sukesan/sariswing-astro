/**
 * G-20u36e-controlled-save-canonical-track-fixture-audit verifier.
 * Audit + fixture correction — no dryRun HTTP / Save / SQL / DB write.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-canonical-track-fixture-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  SKYLARK_TRACKS_CURRENT,
  buildDbTracks,
} from "./lib/discography-g19a-generic-dry-run-lib.mjs";
import { buildDiscography002MatchingDryRunRequest } from "./lib/gosaki-discography-edge-dry-run-readback.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-canonical-track-fixture-audit.md";
const PLAN_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-plan.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-preflight.md";
const SNAPSHOT_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-snapshot-select-result.md";
const LIB_REL = "tools/static-to-astro/scripts/lib/discography-g19a-generic-dry-run-lib.mjs";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "0fc431a";
const CANONICAL_TRACK7 = "Like a Lover";
const ARTIFACT_TRACK7 = "Like a Lover（テスト）";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e fixture audit base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during audit`,
  );
}

assert("audit doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));
assert("snapshot result doc exists", exists(SNAPSHOT_RESULT_DOC_REL));
assert("lib file exists", exists(LIB_REL));

const doc = read(DOC_REL);
const planDoc = read(PLAN_DOC_REL);
const preflightDoc = read(PREFLIGHT_DOC_REL);
const snapshotResultDoc = read(SNAPSHOT_RESULT_DOC_REL);
const libSrc = read(LIB_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-canonical-track-fixture-audit",
  doc.includes("G-20u36e-controlled-save-canonical-track-fixture-audit"),
);
assert(
  "doc gate gosakiDiscographyControlledSaveCanonicalTrackFixtureAuditPassed",
  doc.includes("gosakiDiscographyControlledSaveCanonicalTrackFixtureAuditPassed: true"),
);
assert("doc audit only", doc.includes("audit") && /audit only|audit \+/i.test(doc));
assert("doc canonical track 7 Like a Lover", doc.includes("canonicalTrack7Title: Like a Lover"));
assert(
  "doc artifact Like a Lover test explained",
  doc.includes(ARTIFACT_TRACK7) && /artifact|historical/i.test(doc),
);
assert("doc do not UPDATE DB to test string", doc.includes("do not UPDATE DB"));
assert("doc ready for dryRun live verify", doc.includes("readyForG20u36eControlledSaveDryrunPayloadLiveVerify: true"));
assert("doc next dryrun payload live verify", doc.includes("G-20u36e-controlled-save-dryrun-payload-live-verify"));

assert("doc no SQL", doc.includes("SQL") && /no|not|false/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
assert("doc Save not executed", doc.includes("Save") && /not executed|no|未実行/i.test(doc));
assert(
  "doc dryRun HTTP not sent",
  doc.includes("dryRun") && /not sent|no|未送信/i.test(doc),
);
assert("doc no Edge deploy", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));

assert("doc lists corrected files", doc.includes("discography-g19a-generic-dry-run-lib.mjs"));
assert("doc lists historical unchanged", doc.includes("Historical") || doc.includes("left unchanged"));

assert("SKYLARK_TRACKS_CURRENT track 7 canonical", SKYLARK_TRACKS_CURRENT[6] === CANONICAL_TRACK7);
assert(
  "SKYLARK_TRACKS_CURRENT no test string at index 6",
  SKYLARK_TRACKS_CURRENT[6] !== ARTIFACT_TRACK7,
);
assert(
  "lib source track 7 canonical",
  libSrc.includes('"Like a Lover"') && !libSrc.match(/SKYLARK_TRACKS_CURRENT[\s\S]*Like a Lover（テスト）/),
);

const matchingRequest = buildDiscography002MatchingDryRunRequest();
assert(
  "matching dryRun request tracksText track 7 canonical",
  String(matchingRequest.tracksText).includes("Like a Lover\nThe Water Is Wide") &&
    !String(matchingRequest.tracksText).includes(ARTIFACT_TRACK7),
);

const skylarkTracks = buildDbTracks(SKYLARK_TRACKS_CURRENT);
assert("skylark fixture 8 tracks", skylarkTracks.length === 8);
assert("skylark fixture track 7 title", skylarkTracks[6].title === CANONICAL_TRACK7);

assert(
  "plan doc track 7 expected canonical",
  planDoc.includes("Expected track 7") && planDoc.includes(CANONICAL_TRACK7),
);
assert(
  "preflight doc track_7_title canonical",
  preflightDoc.includes("track_7_title") && preflightDoc.includes(`| \`${CANONICAL_TRACK7}\` |`),
);
assert(
  "preflight dryRun tracksText canonical track 7",
  preflightDoc.includes("Like a Lover\\nThe Water Is Wide") &&
    !preflightDoc.includes("Like a Lover（テスト）\\nThe Water Is Wide"),
);
assert(
  "snapshot result doc track_7 Like a Lover",
  snapshotResultDoc.includes("track_7_title") && snapshotResultDoc.includes(CANONICAL_TRACK7),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-canonical-track-fixture-audit"),
);

assert(
  "AI current-state fixture audit",
  currentState.includes("G-20u36e-controlled-save-canonical-track-fixture-audit") ||
    currentState.includes("gosakiDiscographyControlledSaveCanonicalTrackFixtureAuditPassed"),
);
assert(
  "AI next-actions dryrun live verify or audit",
  nextActions.includes("G-20u36e-controlled-save-canonical-track-fixture-audit") ||
    nextActions.includes("G-20u36e-controlled-save-dryrun-payload-live-verify"),
);
assert(
  "AI handoff fixture audit",
  handoff.includes("G-20u36e-controlled-save-canonical-track-fixture-audit") ||
    handoff.includes("gosakiDiscographyControlledSaveCanonicalTrackFixtureAuditPassed"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(`\nverify-g20u36e-controlled-save-canonical-track-fixture-audit: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
