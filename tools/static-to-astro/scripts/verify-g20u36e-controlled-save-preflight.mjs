/**
 * G-20u36e-controlled-save-preflight verifier.
 * Preflight-only — no SQL / DB write / Save / dryRun HTTP / Edge deploy / admin UI / FTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-preflight.md";
const PLAN_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-plan.md";
const RETRY3_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-3.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "df580a7";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e preflight base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during preflight doc creation`,
  );
}

assert("preflight doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("retry-3 doc exists", exists(RETRY3_DOC_REL));

const doc = read(DOC_REL);
const planDoc = read(PLAN_DOC_REL);
const retry3Doc = read(RETRY3_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36e-controlled-save-preflight", doc.includes("G-20u36e-controlled-save-preflight"));
assert(
  "doc gate gosakiDiscographyControlledSavePreflightReady",
  doc.includes("gosakiDiscographyControlledSavePreflightReady: true"),
);
assert("doc preflight only", doc.includes("preflight only") || doc.includes("Preflight only"));
assert("doc Save not executed", doc.includes("Save") && /not executed|未実行|no.*Save|Save not/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|reject|400/i.test(doc),
);
assert(
  "doc SQL not executed",
  doc.includes("SQL") && /not executed|未実行|NOT EXECUTED/i.test(doc),
);
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc no Edge deploy", doc.includes("Edge deploy") && /no|not|false|未実行/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未変更|not changed/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));

assert("doc staging ref recorded", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));

assert(
  "doc target slice G-20u36e1",
  doc.includes("G-20u36e1-discography-002-track-1-title-staging-marker"),
);
assert("doc discography-002 SKYLARK", doc.includes("discography-002") && doc.includes("SKYLARK"));
assert("doc track 1 before On a Clear Day", doc.includes("On a Clear Day"));
assert(
  "doc track 1 after staging marker",
  doc.includes("On a Clear Day [CMS Kit staging G-20u36e]"),
);
assert("doc track count 8 to 8", doc.includes("8 → 8") || (doc.includes("8") && /8.*8|track count/i.test(doc)));
assert(
  "doc no track add delete",
  doc.includes("tracksAdded") && doc.includes("0") && /no INSERT|DELETE|tracksRemoved/i.test(doc),
);
assert("doc track 7 must not change", doc.includes("track 7") && /must not|do not|closed/i.test(doc));
assert(
  "doc release scalar unchanged",
  doc.includes("release scalar") && /unchanged|must not|Do not mutate/i.test(doc),
);
assert(
  "doc SELECT-only snapshot SQL",
  doc.includes("SELECT-ONLY") && doc.includes("g20u36e_before_snapshot"),
);
assert(
  "doc rollback SQL documented",
  doc.includes("Rollback") && doc.includes("UPDATE public.discography_tracks"),
);
assert(
  "doc rollback SQL execution forbidden in preflight",
  doc.includes("rollback") && /forbidden|NOT EXECUTED|not executed/i.test(doc),
);
assert(
  "doc dryRun payload locked",
  doc.includes("dryRun payload") && doc.includes("operation") && doc.includes("tracksText"),
);
assert(
  "doc dryRun wouldWrite true slice",
  doc.includes("wouldWrite") && doc.includes("true") && doc.includes("tracksAdded"),
);
assert("doc save execution conditions", doc.includes("Save execution conditions"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP if"));
assert(
  "doc next snapshot or edge save path",
  doc.includes("G-20u36e-controlled-save-snapshot-select-execution") ||
    doc.includes("G-20u36e-controlled-save-edge-save-path-planning"),
);

assert("plan doc gate prepared", planDoc.includes("gosakiDiscographyControlledSavePlanPrepared: true"));
assert(
  "retry-3 doc gate PASS",
  retry3Doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry3Passed: true"),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-preflight"),
);

assert(
  "AI current-state G-20u36e preflight",
  currentState.includes("G-20u36e-controlled-save-preflight") ||
    currentState.includes("gosakiDiscographyControlledSavePreflightReady"),
);
assert(
  "AI next-actions G-20u36e preflight or next",
  nextActions.includes("G-20u36e-controlled-save-preflight") ||
    nextActions.includes("G-20u36e-controlled-save-snapshot-select-execution") ||
    nextActions.includes("G-20u36e-controlled-save-edge-save-path-planning"),
);
assert(
  "AI handoff G-20u36e preflight",
  handoff.includes("G-20u36e-controlled-save-preflight") ||
    handoff.includes("gosakiDiscographyControlledSavePreflightReady"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(`\nverify-g20u36e-controlled-save-preflight: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
