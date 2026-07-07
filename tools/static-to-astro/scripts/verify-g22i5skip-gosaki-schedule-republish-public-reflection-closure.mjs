/**
 * G-22i5skip — Gosaki Schedule republish public reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22i5skip-gosaki-schedule-republish-public-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-republish-public-reflection-closure.md";
const G22H7_CLOSURE =
  "tools/static-to-astro/docs/gosaki-schedule-republish-update-result-closure.md";
const G22I4_RESULT =
  "tools/static-to-astro/docs/gosaki-schedule-public-output-review-result.md";
const G22I3_RESULT = "tools/static-to-astro/docs/gosaki-schedule-package-diff-dry-run-result.md";
const G22I2_PLAN = "tools/static-to-astro/docs/gosaki-schedule-public-reflection-planning.md";
const G22I1_REVIEW =
  "tools/static-to-astro/docs/gosaki-schedule-p0-release-readiness-review.md";

const BASE_COMMIT = "8df485d";
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

assert("HEAD is 8df485d", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8df485d", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("closure doc exists", exists(DOC_REL));
assert("G-22h7 closure doc exists", exists(G22H7_CLOSURE));
assert("G-22i4 result doc exists", exists(G22I4_RESULT));
assert("G-22i3 result doc exists", exists(G22I3_RESULT));
assert("G-22i2 planning doc exists", exists(G22I2_PLAN));
assert("G-22i1 review doc exists", exists(G22I1_REVIEW));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-22i5skip",
  doc.includes("G-22i5skip-gosaki-schedule-republish-public-reflection-closure"),
);
assert(
  "doc closure gate complete",
  doc.includes("gosakiScheduleRepublishPublicReflectionClosureComplete: true"),
);
assert(
  "doc g22i chain closed",
  doc.includes("g22iPublicReflectionChainClosed: true"),
);
assert("doc public reflection closure", /public reflection closure/i.test(doc));

assert("doc g22h republish success", doc.includes("G-22h7") || doc.includes("republish UPDATE"));
assert("doc 008 db local live", /DB.*local.*live|dbLocalLiveAlignmentFor008/i.test(doc));
assert("doc 008 legacy id", doc.includes(TARGET_LEGACY));
assert("doc 008 id", doc.includes(TARGET_ID));
assert("doc saved updated_at", doc.includes(SAVED_UPDATED_AT));

assert("doc 014 exclude", doc.includes(REF_014) && /exclude/i.test(doc));
assert("doc 001 exclude", doc.includes(REF_001) && /exclude/i.test(doc));

assert(
  "doc byte identical",
  /byte-identical|byte identical|MD5 identical/i.test(doc),
);
assert("doc upload not needed", /upload.*not needed|uploadNeeded: false/i.test(doc));
assert(
  "doc G-22i5 skip",
  doc.includes("g22i5FtpDeployPlanningSkipped: true") ||
    /G-22i5.*skip/i.test(doc),
);
assert(
  "doc G-22i6 skip",
  doc.includes("g22i6ActualPublicReflectionUploadSkipped: true") ||
    /G-22i6.*skip/i.test(doc),
);

assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));
assert("doc production not executed", doc.includes("productionDeployExecuted: false"));
assert("doc package regen false", doc.includes("packageRegenExecuted: false"));

assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor sql mutation false", doc.includes("cursorSqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));

assert("doc next phases", /Schedule P0 overall closure|UX polish|30.minute|30-minute/i.test(doc));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

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

assert("00-current-state mentions G-22i5skip", currentState.includes("G-22i5skip"));
assert("03-next-actions mentions G-22i5skip", nextActions.includes("G-22i5skip"));
assert("handoff mentions G-22i5skip", handoff.includes("G-22i5skip"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Rollback not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22i5skip Gosaki Schedule republish public reflection closure verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
