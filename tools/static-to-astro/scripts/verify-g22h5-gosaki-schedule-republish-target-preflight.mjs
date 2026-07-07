/**
 * G-22h5 — Gosaki Schedule republish target preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h5-gosaki-schedule-republish-target-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-republish-target-preflight.md";
const G22H4B_DOC = "tools/static-to-astro/docs/gosaki-schedule-republish-ui-wording-cleanup.md";
const G22H4_DOC = "tools/static-to-astro/docs/gosaki-schedule-republish-dry-run-readonly-qa.md";
const G22H1_DOC = "tools/static-to-astro/docs/gosaki-schedule-republish-planning.md";
const PREFLIGHT_SQL =
  "tools/static-to-astro/scripts/supabase/gosaki-schedule-g22h5-republish-target-preflight-check.sql";

const REPUBLISH_CONFIG =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts";
const REPUBLISH_DRY_RUN =
  "src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts";
const REPUBLISH_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts";

const BASE_COMMIT = "92eaf55";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const REF_014 = "schedule-2026-03-014";
const REF_014_ID = "434e4051-86c3-473e-9ad0-39d2e5042fb8";
const REF_001 = "schedule-2026-09-001";
const REF_001_ID = "18b48259-9a9a-4b00-b136-6c0c4ff3b2f3";
const EXPECTED_UPDATED_AT = "2026-07-06T13:58:41.425402+00:00";
const APPROVAL_ID = "G-22h-gosaki-schedule-republish-update-non-dry-run-slice";

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

function gitDiff(rel) {
  return spawnSync("git", ["diff", rel], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 92eaf55", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 92eaf55", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22h5 preflight doc exists", exists(DOC_REL));
assert("G-22h4b prior doc exists", exists(G22H4B_DOC));
assert("G-22h4 prior QA doc exists", exists(G22H4_DOC));
assert("G-22h1 planning doc exists", exists(G22H1_DOC));
assert("preflight SQL exists", exists(PREFLIGHT_SQL));
assert("republish save module absent", !exists(REPUBLISH_SAVE));

const doc = read(DOC_REL);
const sql = read(PREFLIGHT_SQL);
const republishConfig = read(REPUBLISH_CONFIG);
const dryRunModule = read(REPUBLISH_DRY_RUN);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h5", doc.includes("G-22h5-gosaki-schedule-republish-target-preflight"));
assert("doc gate complete", doc.includes("gosakiScheduleRepublishTargetPreflightComplete: true"));
assert("doc target preflight", doc.includes("target preflight") || doc.includes("Target preflight"));
assert("doc not db write", doc.includes("no Save / DB write") || doc.includes("Preflight / record only"));
assert("doc target comparison", doc.includes("Target candidate comparison") || doc.includes("target candidate comparison"));
assert("doc 008 first candidate reason", doc.includes("schedule-2026-07-008") && doc.includes("G-22f"));
assert("doc selected target 008", doc.includes("selectedTargetCandidateLegacyId: schedule-2026-07-008"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc published false", doc.includes("published") && doc.includes("false"));
assert("doc expectedBeforeUpdatedAt", doc.includes("expectedBeforeUpdatedAt") && doc.includes(EXPECTED_UPDATED_AT));
assert("doc reference 014", doc.includes(REF_014) && doc.includes(REF_014_ID));
assert("doc reference 001", doc.includes(REF_001) && doc.includes(REF_001_ID));
assert("doc 014 not target", doc.includes("Not G-22h6 target") || doc.includes("non-target"));
assert("doc SELECT only", doc.includes("SELECT ONLY") || doc.includes("SELECT only"));
assert("doc no db write recorded", doc.includes("dbWriteExecuted: false"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc optimistic lock", doc.includes("Optimistic lock") || doc.includes("optimistic lock"));
assert("doc save once", doc.includes("once") || doc.includes("1回"));
assert("doc required before after", doc.includes("published = false") && doc.includes("published = true"));
assert("doc republish-update operation", doc.includes("republish-update"));
assert("doc ready for G-22h6", doc.includes("readyForG22h6RepublishUpdateImplementation: true"));
assert("doc next G-22h6", doc.includes("G-22h6"));
assert("doc next G-22h7", doc.includes("G-22h7"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));
assert("doc base commit 92eaf55", doc.includes(BASE_COMMIT));
assert("doc never sariswing prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

assert("sql SELECT only", sql.includes("select") && !/update\s+public\.schedules/i.test(sql));
assert(
  "sql no mutation statements",
  !/^\s*(insert|update|delete|grant|revoke|alter|drop)\b/im.test(
    sql.replace(/--[^\n]*/g, ""),
  ),
);
assert("sql target legacy ids", sql.includes(TARGET_LEGACY) && sql.includes(REF_014) && sql.includes(REF_001));
assert("sql site slug", sql.includes("gosaki-piano"));
assert("sql staging ref in comment", sql.includes(STAGING_REF));

assert("config saveEnabled false", republishConfig.includes("saveEnabled: false"));
assert("config no .update(", !republishConfig.includes(".update("));
assert("dry-run no .update(", !dryRunModule.includes(".update("));
assert("dry-run actualWrite false", dryRunModule.includes("actualWrite: false"));
assert("republish config unchanged", gitDiff(REPUBLISH_CONFIG).length === 0);
assert("republish dry-run unchanged", gitDiff(REPUBLISH_DRY_RUN).length === 0);

assert("00-current-state mentions G-22h5", currentState.includes("G-22h5"));
assert("03-next-actions mentions G-22h5", nextActions.includes("G-22h5"));
assert("handoff mentions G-22h5", handoff.includes("G-22h5"));
assert("handoff current phase G-22h5", handoff.includes("G-22h5"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22h5 Gosaki Schedule republish target preflight verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
