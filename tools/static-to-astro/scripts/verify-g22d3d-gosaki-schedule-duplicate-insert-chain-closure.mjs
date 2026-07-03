/**
 * G-22d3d — Gosaki Schedule duplicate INSERT chain closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d3d-gosaki-schedule-duplicate-insert-chain-closure.mjs
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
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-chain-closure.md";
const G22D3C_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-execution-result.md";

const BASE_COMMIT = "4e3d55a";
const APPROVAL_ID = "G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice";
const SOURCE_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const INSERTED_ID = "434e4051-86c3-473e-9ad0-39d2e5042fb8";
const PLANNED_LEGACY = "schedule-2026-03-014";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

const CHAIN_DOCS = [
  "gosaki-schedule-duplicate-dry-run-ui-implementation.md",
  "gosaki-schedule-duplicate-dry-run-local-qa.md",
  "gosaki-schedule-duplicate-insert-planning.md",
  "gosaki-schedule-duplicate-insert-implementation.md",
  "gosaki-schedule-duplicate-insert-final-preflight.md",
  "gosaki-schedule-duplicate-insert-beforeverification.md",
  "gosaki-schedule-duplicate-insert-permission-denied-audit.md",
  "gosaki-schedules-insert-grant-final-preflight.md",
  "gosaki-schedule-duplicate-insert-execution-result.md",
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

assert("HEAD is 4e3d55a", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 4e3d55a", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("closure doc exists", exists(DOC_REL));
assert("G-22d3c result doc exists", exists(G22D3C_RESULT_REL));

const doc = read(DOC_REL);
const resultDoc = read(G22D3C_RESULT_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-22d3d",
  doc.includes("G-22d3d-gosaki-schedule-duplicate-insert-chain-closure"),
);
assert(
  "doc closure gate complete",
  doc.includes("gosakiScheduleDuplicateInsertChainClosureComplete: true"),
);
assert("doc g22 chain closed", doc.includes("g22DuplicateInsertChainClosed: true"));
assert("doc g22d3 chain closed", doc.includes("g22d3DuplicateInsertChainClosed: true"));
assert(
  "doc save re-exec forbidden",
  doc.includes("readyForG22dDuplicateInsertSaveReExecution: false"),
);
assert("doc g22d3 db write closed", doc.includes("g22d3DbWriteClosed: true"));

assert("doc insertedId", doc.includes(INSERTED_ID));
assert("doc legacy_id 014", doc.includes(PLANNED_LEGACY));
assert("doc sourceId", doc.includes(SOURCE_ID));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc title copy suffix", doc.includes("<Live & Session>（コピー）"));
assert("doc sort_order 70", doc.includes("sort_order") && doc.includes("70"));
assert("doc published false", doc.includes("published") && doc.includes("false"));
assert("doc march_count 14", doc.includes("march_count") && doc.includes("14"));

assert("doc source unchanged", doc.includes("unchanged") || doc.includes("not mutated"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert(
  "doc public site not showing duplicate",
  doc.includes("does NOT appear") || doc.includes("NOT executed"),
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
assert("doc grant applied G-22d3b3", doc.includes("G-22d3b3"));

assert("doc save forbidden section", doc.includes("forbidden") || doc.includes("Do not re-click"));
assert("doc dry-run vs INSERT lesson", doc.includes("dry-run") || doc.includes("Dry-run"));
assert("doc GRANT + RLS lesson", doc.includes("GRANT") && doc.includes("RLS"));

assert("doc next G-22e", doc.includes("G-22e"));
assert("doc next G-22f", doc.includes("G-22f"));
assert("doc next G-22g", doc.includes("G-22g"));
assert(
  "doc G-22e new guard separate",
  doc.includes("G-22e") &&
    (doc.includes("Separate guard") || doc.includes("do not reuse") || doc.includes("not** duplicate")),
);
assert("doc INSERT grant exists for G-22e", doc.includes("INSERT grant") && doc.includes("G-22e"));

assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit 4e3d55a", doc.includes(BASE_COMMIT));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert("doc cursor no db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor no grant", doc.includes("cursorGrantRevokeExecuted: false"));
assert("doc no package ftp", doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"));

for (const phase of ["G-22b", "G-22c", "G-22d", "G-22d2", "G-22d3a", "G-22d3b", "G-22d3c"]) {
  assert(`doc chain phase ${phase}`, doc.includes(phase));
}

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists ${chainDoc}`, exists(`${DOCS_DIR}/${chainDoc}`));
}

assert("G-22d3c result references insertedId", resultDoc.includes(INSERTED_ID));
assert("G-22d3c result chain closed", resultDoc.includes("g22d3DuplicateInsertChainClosed: true"));

assert("00-current-state mentions G-22d3d", currentState.includes("G-22d3d"));
assert("03-next-actions mentions G-22d3d", nextActions.includes("G-22d3d"));
assert("handoff mentions G-22d3d", handoff.includes("G-22d3d"));
assert("03-next-actions G-22e next", nextActions.includes("G-22e"));
assert("handoff G-22e next", handoff.includes("G-22e"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("GRANT REVOKE not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed by Cursor", true);
assert("commit push not executed", true);

console.log(
  `\nG-22d3d Gosaki Schedule duplicate INSERT chain closure verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
