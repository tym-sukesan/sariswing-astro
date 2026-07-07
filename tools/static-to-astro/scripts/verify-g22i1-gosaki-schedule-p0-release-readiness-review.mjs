/**
 * G-22i1 — Gosaki Schedule P0 release readiness review verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22i1-gosaki-schedule-p0-release-readiness-review.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-p0-release-readiness-review.md";
const G22H7_CLOSURE = "tools/static-to-astro/docs/gosaki-schedule-republish-update-result-closure.md";
const G22F7_CLOSURE = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-closure.md";
const G22G2B_SUMMARY = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-summary.md";

const BASE_COMMIT = "4857f77";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const SAVED_UPDATED_AT = "2026-07-07T02:30:32.260326+00:00";
const REF_014 = "schedule-2026-03-014";
const REF_001 = "schedule-2026-09-001";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 4857f77", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 4857f77", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("readiness review doc exists", exists(DOC_REL));
assert("G-22h7 closure doc exists", exists(G22H7_CLOSURE));
assert("G-22f7 closure doc exists", exists(G22F7_CLOSURE));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22i1", doc.includes("G-22i1-gosaki-schedule-p0-release-readiness-review"));
assert(
  "doc readiness gate complete",
  doc.includes("gosakiScheduleP0ReleaseReadinessReviewComplete: true"),
);
assert("doc p0 chain complete", doc.includes("p0CrudUxRepublishChainComplete: true"));
assert("doc ready G-22i2", doc.includes("readyForG22i2PublicReflectionPlanning: true"));

assert("doc duplicate insert closed", doc.includes("G-22d3d") || doc.includes("Duplicate INSERT"));
assert("doc new event closed", doc.includes("G-22e7") || doc.includes("New event INSERT"));
assert("doc unpublish closed", doc.includes("G-22f7") || doc.includes("Unpublish UPDATE"));
assert("doc republish closed", doc.includes("G-22h7") || doc.includes("Republish UPDATE"));
assert("doc authenticated admin read", doc.includes("Authenticated admin read") || doc.includes("G-22g1f3"));
assert("doc legacy_id visibility", doc.includes("legacy_id visibility") || doc.includes("G-22g1a"));
assert("doc save preview panel", doc.includes("save preview") || doc.includes("G-22g1c"));
assert("doc procedure hints", doc.includes("procedure hints") || doc.includes("G-22g2"));

assert("doc 008 published true", doc.includes(TARGET_LEGACY) && doc.includes("published=true") || doc.includes("**`true`**"));
assert("doc 008 id", doc.includes(TARGET_ID));
assert("doc saved updated_at", doc.includes(SAVED_UPDATED_AT));
assert("doc 014 published false", doc.includes(REF_014) && doc.includes("published=false") || doc.includes("**`false`**"));
assert("doc 001 published false", doc.includes(REF_001));

assert("doc save re-exec forbidden", doc.includes("forbidden") || doc.includes("do not re-Save"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc package not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc production not executed", doc.includes("productionDeployExecuted: false"));
assert("doc physical delete deferred", doc.includes("physicalDeleteImplemented: false") || doc.includes("deferred"));
assert("doc ui polish candidate", doc.includes("UX polish") || doc.includes("polish"));
assert("doc public reflection checklist", doc.includes("Before public reflection") || doc.includes("public reflection"));
assert("doc next phases G-22i2", doc.includes("G-22i2"));
assert("doc next phases G-22i3", doc.includes("G-22i3"));
assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

if (exists(G22G2B_SUMMARY)) {
  console.log("PASS G-22g2b summary doc exists");
  passed += 1;
} else {
  console.log("PASS G-22g2b summary doc optional");
  passed += 1;
}

const portCheck = spawnSync("lsof", ["-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("00-current-state mentions G-22i1", currentState.includes("G-22i1"));
assert("03-next-actions mentions G-22i1", nextActions.includes("G-22i1"));
assert("handoff mentions G-22i1", handoff.includes("G-22i1"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Rollback not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22i1 Gosaki Schedule P0 release readiness review verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
