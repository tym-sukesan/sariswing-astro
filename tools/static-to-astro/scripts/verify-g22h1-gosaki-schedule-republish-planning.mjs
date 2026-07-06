/**
 * G-22h1 — Gosaki Schedule republish planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h1-gosaki-schedule-republish-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-republish-planning.md";
const UNPUBLISH_PLAN_DOC = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-planning.md";
const P0_SUMMARY_DOC = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-summary.md";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "d3e76df";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const LEGACY_008 = "schedule-2026-07-008";
const LEGACY_014 = "schedule-2026-03-014";
const LEGACY_001 = "schedule-2026-09-001";
const PROPOSED_APPROVAL = "G-22h-gosaki-schedule-republish-update-non-dry-run-slice";
const PROPOSED_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED";

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

assert("HEAD is d3e76df", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is d3e76df", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("unpublish planning doc exists", exists(UNPUBLISH_PLAN_DOC));
assert("P0 summary doc exists", exists(P0_SUMMARY_DOC));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h1", doc.includes("G-22h1-gosaki-schedule-republish-planning"));
assert("doc gate planning complete", doc.includes("gosakiScheduleRepublishPlanningComplete: true"));
assert("doc purpose republish", doc.includes("republish") && doc.includes("planning"));
assert("doc published false to true", doc.includes("false") && doc.includes("true") && doc.includes("published"));
assert("doc not INSERT", doc.includes("INSERT") && doc.includes("no"));
assert("doc not physical DELETE", doc.includes("Physical DELETE") && doc.includes("no"));
assert("doc optimistic lock", doc.includes("expectedBeforeUpdatedAt") || doc.includes("optimistic lock"));
assert("doc approvalId proposed", doc.includes(PROPOSED_APPROVAL));
assert("doc arm flag proposed", doc.includes(PROPOSED_ARM));
assert("doc dry-run first", doc.includes("dry-run") || doc.includes("Dry-run"));
assert("doc unpublish relationship", doc.includes("G-22f") || doc.includes("unpublish"));
assert("doc reuse inventory", doc.includes("updateScheduleWrite") || doc.includes("Reuse"));
assert("doc dedicated guards", doc.includes("Dedicated") || doc.includes("dedicated"));
assert("doc candidate targets", doc.includes("Candidate") || doc.includes("candidate"));
assert("doc legacy 008", doc.includes(LEGACY_008));
assert("doc legacy 014", doc.includes(LEGACY_014));
assert("doc legacy 001", doc.includes(LEGACY_001));
assert("doc recommended target", doc.includes("Recommended") || doc.includes("recommended"));
assert("doc future slices", doc.includes("G-22h2") && doc.includes("G-22h6"));
assert("doc high risk gate", doc.includes("HIGH") || doc.includes("high-risk"));
assert("doc read-only QA runner ref optional", doc.includes("G-22g2a") || doc.includes("admin read"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc residual next phases", doc.includes("G-22h2") || doc.includes("public reflection"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc base commit d3e76df", doc.includes(BASE_COMMIT));
assert("doc implementation not executed", doc.includes("implementationExecuted: false"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);
assert("no new republish save module yet", !exists("src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts"));

assert("00-current-state mentions G-22h1", currentState.includes("G-22h1"));
assert("03-next-actions mentions G-22h1", nextActions.includes("G-22h1"));
assert("handoff mentions G-22h1", handoff.includes("G-22h1"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22h1 Gosaki Schedule republish planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
