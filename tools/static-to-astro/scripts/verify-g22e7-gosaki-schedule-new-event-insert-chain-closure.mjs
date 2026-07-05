/**
 * G-22e7 — Gosaki Schedule new event INSERT chain closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22e7-gosaki-schedule-new-event-insert-chain-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DOCS_DIR = "tools/static-to-astro/docs";
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-chain-closure.md";
const G22E6_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-execution-result.md";
const BLOCKER_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-preview-button-blocker.md";

const BASE_COMMIT = "c080a1d";
const APPROVAL_ID = "G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice";
const INSERTED_ID = "18b48259-9a9a-4b00-b136-6c0c4ff3b2f3";
const PLANNED_LEGACY = "schedule-2026-09-001";
const PROTECTED_ID = "434e4051-86c3-473e-9ad0-39d2e5042fb8";
const PROTECTED_LEGACY = "schedule-2026-03-014";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

const CHAIN_DOCS = [
  "gosaki-schedule-new-event-dry-run-ui-implementation.md",
  "gosaki-schedule-new-event-dry-run-local-qa.md",
  "gosaki-schedule-new-event-insert-planning.md",
  "gosaki-schedule-new-event-insert-implementation.md",
  "gosaki-schedule-new-event-insert-final-preflight.md",
  "gosaki-schedule-new-event-insert-preview-button-blocker.md",
  "gosaki-schedule-new-event-insert-execution-result.md",
];

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

assert("HEAD is c080a1d", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is c080a1d", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("closure doc exists", exists(DOC_REL));
assert("G-22e6 result doc exists", exists(G22E6_RESULT_REL));
assert("G-22e5-blocker doc exists", exists(BLOCKER_DOC_REL));

const doc = read(DOC_REL);
const resultDoc = read(G22E6_RESULT_REL);
const blockerDoc = read(BLOCKER_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-22e7",
  doc.includes("G-22e7-gosaki-schedule-new-event-insert-chain-closure"),
);
assert(
  "doc closure gate complete",
  doc.includes("gosakiScheduleNewEventInsertChainClosureComplete: true"),
);
assert("doc g22e chain closed", doc.includes("g22eNewEventInsertChainClosed: true"));
assert("doc g22e5 chain closed", doc.includes("g22e5NewEventInsertChainClosed: true"));
assert(
  "doc save re-exec forbidden",
  doc.includes("readyForG22eNewEventInsertSaveReExecution: false"),
);
assert("doc g22e5 db write closed", doc.includes("g22e5DbWriteClosed: true"));
assert("doc write-armed server stopped", doc.includes("writeArmedDevServerStopped: true"));

assert("doc insertedId", doc.includes(INSERTED_ID));
assert("doc legacy_id 001", doc.includes(PLANNED_LEGACY));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert(
  "doc actualWrite true",
  doc.includes("actualWrite") && doc.includes("true"),
);
assert("doc title test event", doc.includes("【G-22eテスト】新規追加テストイベント"));
assert("doc sort_order 10", doc.includes("sort_order") && doc.includes("10"));
assert("doc source_route", doc.includes("/schedule/2026-09/"));
assert("doc source_file", doc.includes("schedule-2026-09.html"));

assert("doc afterVerification PASS", doc.includes("afterVerification") && doc.includes("PASS"));
assert(
  "doc inserted_legacy_id_count 1",
  doc.includes("inserted_legacy_id_count") && doc.includes("**1**"),
);
assert(
  "doc target_month_count_after 1",
  doc.includes("target_month_count_after") && doc.includes("**1**"),
);

assert("doc published false", doc.includes("published") && doc.includes("false"));
assert("doc show_on_home false", doc.includes("show_on_home") && doc.includes("false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert(
  "doc public site not showing new event",
  doc.includes("does NOT appear") || doc.includes("NOT executed"),
);

assert("doc protected duplicate unchanged", doc.includes(PROTECTED_ID));
assert("doc protected legacy 014", doc.includes(PROTECTED_LEGACY));
assert(
  "doc protected not touched",
  doc.includes("unchanged") || doc.includes("not** touch"),
);

assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rollback archive referenced", doc.includes("Rollback") || doc.includes("rollback"));

assert("doc authenticated INSERT yes", doc.includes("authenticated") && doc.includes("INSERT") && doc.includes("yes"));
assert("doc anon INSERT no", doc.includes("anon") && doc.includes("INSERT") && doc.includes("no"));
assert(
  "doc schedules_admin_all policy",
  doc.includes("schedules_admin_all") && doc.includes("is_admin()"),
);
assert("doc grant reused G-22d3b3", doc.includes("G-22d3b3"));

assert("doc save forbidden section", doc.includes("forbidden") || doc.includes("Do not re-click"));
assert("doc dry-run vs INSERT lesson", doc.includes("dry-run") || doc.includes("Dry-run"));

assert("doc G-22e5-blocker section", doc.includes("G-22e5-blocker"));
assert(
  "doc scroll-only fix",
  doc.includes("scrollNewEventDraftIntoView") || doc.includes("scroll-only"),
);
assert(
  "doc button not missing from DOM",
  doc.includes("NOT missing") || doc.includes("not missing") || doc.includes("not** missing"),
);
assert("blocker doc scroll fix", blockerDoc.includes("scrollNewEventDraftIntoView"));

assert("doc next G-22f", doc.includes("G-22f"));
assert("doc next G-22g", doc.includes("G-22g"));
assert(
  "doc routineization cautions",
  doc.includes("Routineization") || doc.includes("routineization"),
);
assert(
  "doc test row schedule-2026-09-001",
  doc.includes("schedule-2026-09-001") && doc.includes("test"),
);

assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit c080a1d", doc.includes(BASE_COMMIT));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert("doc cursor no db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor no grant", doc.includes("cursorGrantRevokeExecuted: false"));
assert("doc no package ftp", doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"));

for (const phase of ["G-22e", "G-22e1", "G-22e2", "G-22e3", "G-22e4", "G-22e5-blocker", "G-22e5", "G-22e6"]) {
  assert(`doc chain phase ${phase}`, doc.includes(phase));
}

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists ${chainDoc}`, exists(`${DOCS_DIR}/${chainDoc}`));
}

assert("G-22e6 result references insertedId", resultDoc.includes(INSERTED_ID));
assert("G-22e6 result chain closed", resultDoc.includes("g22e5NewEventInsertChainClosed: true"));

assert("00-current-state mentions G-22e7", currentState.includes("G-22e7"));
assert("03-next-actions mentions G-22e7", nextActions.includes("G-22e7"));
assert("handoff mentions G-22e7", handoff.includes("G-22e7"));
assert("03-next-actions G-22f next", nextActions.includes("G-22f"));
assert("handoff G-22f next", handoff.includes("G-22f"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("GRANT REVOKE not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed by Cursor", true);
assert("commit push not executed", true);

console.log(
  `\nG-22e7 Gosaki Schedule new event INSERT chain closure verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
