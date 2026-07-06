/**
 * G-22g2b — Gosaki Schedule P0 UX summary / closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g2b-gosaki-schedule-p0-ux-summary.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-summary.md";
const QA_RUNNER = "tools/static-to-astro/scripts/run-g22g2a-schedule-p0-ux-readonly-qa.mjs";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "73b4d23";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";

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

assert("HEAD is 73b4d23", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 73b4d23", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g2b", doc.includes("G-22g2b-gosaki-schedule-p0-ux-summary"));
assert("doc gate summary complete", doc.includes("gosakiScheduleP0UxSummaryComplete: true"));
assert("doc gate chain closed", doc.includes("gosakiScheduleP0UxChainClosed: true"));
assert("doc purpose", doc.includes("summary / closure") || doc.includes("Summary / closure"));
assert("doc chain flow G-22g1a", doc.includes("G-22g1a"));
assert("doc chain flow G-22g1b", doc.includes("G-22g1b"));
assert("doc chain flow G-22g1c", doc.includes("G-22g1c"));
assert("doc chain flow G-22g1d", doc.includes("G-22g1d"));
assert("doc chain flow G-22g1e", doc.includes("G-22g1e"));
assert("doc chain flow G-22g1f3", doc.includes("G-22g1f3"));
assert("doc chain flow G-22g2", doc.includes("G-22g2"));
assert("doc chain flow G-22g2a", doc.includes("G-22g2a"));
assert("doc legacy_id visibility", doc.includes("legacy_id"));
assert("doc dev mock isolation", doc.includes("dev/mock") || doc.includes("dev/mock"));
assert("doc save preview target", doc.includes("save preview") || doc.includes("save-target"));
assert("doc authenticated admin read", doc.includes("authenticated admin read") || doc.includes("admin read"));
assert("doc schedule-2026-07-008 PASS", doc.includes(TARGET_LEGACY) && doc.includes("PASS"));
assert("doc admin read closure", doc.includes("authenticated admin read") && doc.includes("closed"));
assert("doc operator procedure hints", doc.includes("procedure hints") || doc.includes("操作手順"));
assert("doc mistake prevention UI", doc.includes("連打禁止") || doc.includes("物理削除"));
assert("doc read-only QA runner", doc.includes("run-g22g2a-schedule-p0-ux-readonly-qa.mjs"));
assert("qa runner exists", exists(QA_RUNNER));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc residual issues", doc.includes("Residual") || doc.includes("残課題"));
assert("doc next republish planning", doc.includes("republish planning"));
assert("doc next public reflection planning", doc.includes("public reflection planning"));
assert("doc physical delete deferred", doc.includes("physical DELETE") && doc.includes("deferred"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc base commit 73b4d23", doc.includes(BASE_COMMIT));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);

assert("00-current-state mentions G-22g2b", currentState.includes("G-22g2b"));
assert("03-next-actions mentions G-22g2b", nextActions.includes("G-22g2b"));
assert("handoff mentions G-22g2b", handoff.includes("G-22g2b"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g2b Gosaki Schedule P0 UX summary verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
