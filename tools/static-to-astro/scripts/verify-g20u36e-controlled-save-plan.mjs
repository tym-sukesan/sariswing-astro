/**
 * G-20u36e-controlled-save-planning verifier.
 * Planning-only — no SQL / DB write / Save / Edge deploy / admin UI / FTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-plan.md";
const RETRY3_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-3.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "58a57b8";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during plan doc creation`,
  );
}

assert("plan doc exists", exists(DOC_REL));
assert("retry-3 doc exists", exists(RETRY3_DOC_REL));

const doc = read(DOC_REL);
const retry3Doc = read(RETRY3_DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36e-controlled-save-planning", doc.includes("G-20u36e-controlled-save-planning"));
assert("doc gate gosakiDiscographyControlledSavePlanPrepared", doc.includes("gosakiDiscographyControlledSavePlanPrepared: true"));
assert("doc retry-3 PASS unlock", doc.includes("retry-3") && /PASS|Passed|unlock/i.test(doc));
assert("doc planning only", doc.includes("planning only") || doc.includes("planning doc"));
assert("doc Save not executed", doc.includes("Save") && /not executed|未実行|no.*Save|Save not/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|reject|400/i.test(doc),
);
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc no Edge deploy", doc.includes("Edge deploy") && /no|not|false|未実行/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未変更|not changed/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));

assert("doc staging ref recorded", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));

assert(
  "doc first controlled Save candidate",
  doc.includes("discography-002") && doc.includes("SKYLARK"),
);
assert(
  "doc G-20u36e1 slice",
  doc.includes("G-20u36e1") || doc.includes("track-1-title-staging-marker"),
);
assert("doc track 7 do not re-save", doc.includes("track 7") && /do not|closed|must not/i.test(doc));
assert("doc pre-save snapshot policy", doc.includes("snapshot") && /SELECT-only|SELECT only/i.test(doc));
assert("doc save execution conditions", doc.includes("expectedBefore") && doc.includes("expectedAfter"));
assert("doc post-save verification", doc.includes("verification") && /readBack|post-save|Save後/i.test(doc));
assert("doc rollback policy", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc STOP conditions", doc.includes("STOP") && doc.includes("service_role"));
assert("doc generalization note", doc.includes("Generalization") || doc.includes("CMS Kit"));
assert("doc next preflight phase", doc.includes("G-20u36e-controlled-save-preflight"));

assert(
  "retry-3 doc gate PASS",
  retry3Doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry3Passed: true"),
);
assert("retry-3 doc trackCount 8", retry3Doc.includes("trackCount") && retry3Doc.includes("8"));

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-plan"),
);

assert(
  "AI current-state G-20u36e",
  currentState.includes("G-20u36e-controlled-save-planning") ||
    currentState.includes("gosakiDiscographyControlledSavePlanPrepared"),
);
assert(
  "AI next-actions G-20u36e or preflight",
  nextActions.includes("G-20u36e-controlled-save-planning") ||
    nextActions.includes("G-20u36e-controlled-save-preflight"),
);
assert(
  "AI handoff G-20u36e",
  handoff.includes("G-20u36e-controlled-save-planning") ||
    handoff.includes("G-20u36e-controlled-save-preflight"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(`\nverify-g20u36e-controlled-save-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
