/**
 * G-22d3c — Gosaki Schedule duplicate INSERT execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d3c-gosaki-schedule-duplicate-insert-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const BASE_COMMIT = "a3c8f7c";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-execution-result.md";
const PREFLIGHT_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-final-preflight.md";

const APPROVAL_ID = "G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice";
const SOURCE_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const INSERTED_ID = "434e4051-86c3-473e-9ad0-39d2e5042fb8";
const PLANNED_LEGACY = "schedule-2026-03-014";
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

assert("HEAD is a3c8f7c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is a3c8f7c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert("execution result doc exists", exists(DOC_REL));
assert("prior preflight doc exists", exists(PREFLIGHT_DOC));

const doc = read(DOC_REL);

assert("doc phase G-22d3c", doc.includes("G-22d3c-gosaki-schedule-duplicate-insert-execution-result"));
assert("doc execution result gate complete", doc.includes("gosakiScheduleDuplicateInsertExecutionResultComplete: true"));
assert("doc chain closed", doc.includes("g22d3DuplicateInsertChainClosed: true"));
assert("doc save re-exec forbidden", doc.includes("readyForG22dDuplicateInsertSaveReExecution: false"));
assert("doc g22d3 db write closed", doc.includes("g22d3DbWriteClosed: true"));

assert("doc insertedId recorded", doc.includes(INSERTED_ID));
assert("doc legacy_id 014", doc.includes(PLANNED_LEGACY));
assert("doc actualWrite true", doc.includes("actualWrite: true") || doc.includes("actualWrite` | `true"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc sourceId", doc.includes(SOURCE_ID));

assert("doc afterVerification PASS", doc.includes("afterVerification") && doc.includes("PASS"));
assert("doc source unchanged", doc.includes("source row **not mutated**") || doc.includes("Source row unchanged"));
assert("doc march_count 14", doc.includes("march_count") && doc.includes("14"));
assert("doc inserted_legacy_count 1", doc.includes("inserted_legacy_count") || doc.includes("**1**"));

assert("doc published false", doc.includes("published") && doc.includes("false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc no public reflection section", doc.includes("Public reflection") && doc.includes("NOT executed"));

assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rollback archive only", doc.includes("NOT executed"));

assert("doc no save re-click", doc.includes("Do not re-click"));
assert("doc cursor save not executed", doc.includes("cursorSaveExecuted: false"));
assert("doc no package ftp", doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"));

assert("doc sort_order 70", doc.includes("sort_order") && doc.includes("70"));
assert("doc title copy suffix", doc.includes("<Live & Session>（コピー）"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit a3c8f7c", doc.includes(BASE_COMMIT));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert(
  "doc mentions prod ref only as never",
  doc.includes(PROD_REF) && /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

console.log(
  `\nG-22d3c Gosaki Schedule duplicate INSERT execution result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
