/**
 * G-22e6 — Gosaki Schedule new event INSERT execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22e6-gosaki-schedule-new-event-insert-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-execution-result.md";
const PREFLIGHT_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-final-preflight.md";

const APPROVAL_ID = "G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice";
const INSERTED_ID = "18b48259-9a9a-4b00-b136-6c0c4ff3b2f3";
const PLANNED_LEGACY = "schedule-2026-09-001";
const PROTECTED_ID = "434e4051-86c3-473e-9ad0-39d2e5042fb8";
const PROTECTED_LEGACY = "schedule-2026-03-014";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "82d06bc";

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

assert("HEAD is 82d06bc", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 82d06bc", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("execution result doc exists", exists(DOC_REL));
assert("prior preflight doc exists", exists(PREFLIGHT_DOC));

const doc = read(DOC_REL);

assert("doc phase G-22e6", doc.includes("G-22e6-gosaki-schedule-new-event-insert-execution-result"));
assert(
  "doc execution result gate complete",
  doc.includes("gosakiScheduleNewEventInsertExecutionResultComplete: true"),
);
assert("doc g22e5 chain closed", doc.includes("g22e5NewEventInsertChainClosed: true"));
assert(
  "doc save re-exec forbidden",
  doc.includes("readyForG22eNewEventInsertSaveReExecution: false"),
);
assert("doc g22e5 db write closed", doc.includes("g22e5DbWriteClosed: true"));
assert("doc write-armed server stopped", doc.includes("writeArmedDevServerStopped: true"));

assert("doc insertedId recorded", doc.includes(INSERTED_ID));
assert("doc legacy_id 001", doc.includes(PLANNED_LEGACY));
assert(
  "doc actualWrite true",
  doc.includes("actualWrite: true") || doc.includes("actualWrite` | `true"),
);
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc operation new-event-insert", doc.includes("new-event-insert"));

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
assert("doc home_order null", doc.includes("home_order") && doc.includes("null"));
assert("doc sort_order 10", doc.includes("sort_order") && doc.includes("10"));
assert("doc source_route", doc.includes("/schedule/2026-09/"));
assert("doc source_file", doc.includes("schedule-2026-09.html"));

assert("doc protected duplicate unchanged", doc.includes(PROTECTED_ID));
assert("doc protected legacy 014", doc.includes(PROTECTED_LEGACY));
assert(
  "doc protected title copy",
  doc.includes("<Live & Session>（コピー）") && doc.includes("unchanged"),
);

assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert(
  "doc no public reflection section",
  doc.includes("Public reflection") && doc.includes("NOT executed"),
);

assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rollback archive only", doc.includes("NOT executed"));

assert("doc no save re-click", doc.includes("Do not re-click"));
assert("doc cursor save not executed", doc.includes("cursorSaveExecuted: false"));
assert(
  "doc no package ftp",
  doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"),
);

assert("doc title test event", doc.includes("【G-22eテスト】新規追加テストイベント"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit 82d06bc", doc.includes(BASE_COMMIT));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert(
  "doc mentions prod ref only as never",
  doc.includes(PROD_REF) && /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

// AI context
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("00-current-state mentions G-22e6", currentState.includes("G-22e6"));
assert("03-next-actions mentions G-22e6", nextActions.includes("G-22e6"));
assert("handoff mentions G-22e6", handoff.includes("G-22e6"));

console.log(
  `\nG-22e6 Gosaki Schedule new event INSERT execution result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
