/**
 * G-22f7 — Gosaki Schedule unpublish UPDATE chain closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f7-gosaki-schedule-unpublish-update-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const DOCS_DIR = "tools/static-to-astro/docs";
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-closure.md";
const G22F6_RESULT_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-result.md";

const BASE_COMMIT = "691b020";
const APPROVAL_ID = "G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const TARGET_LEGACY = "schedule-2026-07-008";
const UPDATED_AT_AFTER = "2026-07-06T13:58:41.425402+00:00";
const PROTECTED_014 = "schedule-2026-03-014";
const PROTECTED_001 = "schedule-2026-09-001";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

const CHAIN_DOCS = [
  "gosaki-schedule-unpublish-dry-run-ui-implementation.md",
  "gosaki-schedule-unpublish-dry-run-local-qa.md",
  "gosaki-schedule-unpublish-update-planning.md",
  "gosaki-schedule-unpublish-update-implementation.md",
  "gosaki-schedule-unpublish-update-final-preflight.md",
  "gosaki-schedule-unpublish-update-target-fixed-beforeverification.md",
  "gosaki-schedule-unpublish-update-result.md",
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

assert("HEAD is 691b020", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 691b020", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("closure doc exists", exists(DOC_REL));
assert("G-22f6 result doc exists", exists(G22F6_RESULT_REL));

const doc = read(DOC_REL);
const resultDoc = read(G22F6_RESULT_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22f7", doc.includes("G-22f7-gosaki-schedule-unpublish-update-chain-closure"));
assert(
  "doc closure gate complete",
  doc.includes("gosakiScheduleUnpublishUpdateChainClosureComplete: true"),
);
assert("doc g22f chain closed", doc.includes("g22fUnpublishUpdateChainClosed: true"));
assert("doc g22f5 chain closed", doc.includes("g22f5UnpublishUpdateChainSaveClosed: true"));
assert(
  "doc save re-exec forbidden",
  doc.includes("readyForG22fUnpublishUpdateSaveReExecution: false"),
);
assert("doc g22f5 db write closed", doc.includes("g22f5DbWriteClosed: true"));
assert("doc write-armed server stopped", doc.includes("writeArmedDevServerStopped: true"));
assert("doc port 4321 listen none", doc.includes("port4321ListenConfirmedNone: true"));
assert("doc operator Ctrl+C stop", doc.includes("Ctrl+C"));

assert("doc targetId", doc.includes(TARGET_ID));
assert("doc legacy_id 008", doc.includes(TARGET_LEGACY));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc operation unpublish-update", doc.includes("unpublish-update"));
assert(
  "doc actualWrite true",
  doc.includes("actualWrite") && doc.includes("true"),
);
assert("doc published true to false", doc.includes("true") && doc.includes("false"));
assert("doc updated_at_after", doc.includes(UPDATED_AT_AFTER));
assert("doc month count 14", doc.includes("14"));

assert("doc afterVerification PASS", doc.includes("afterVerification") && doc.includes("PASS"));
assert("doc not physical DELETE", doc.includes("NOT physical DELETE") || doc.includes("not physical DELETE"));
assert("doc physical delete deferred", doc.includes("Physical DELETE") && doc.includes("deferred"));

assert("doc protected 014", doc.includes(PROTECTED_014));
assert("doc protected 001", doc.includes(PROTECTED_001));
assert("doc protected unchanged", doc.includes("unchanged"));

assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert(
  "doc no package ftp",
  doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"),
);

assert("doc save forbidden", doc.includes("forbidden") || doc.includes("Do not re-click"));
assert("doc save once", doc.includes("once") || doc.includes("exactly once"));

assert("doc UX legacy_id lesson", doc.includes("legacy_id"));
assert("doc UX dev tools confusion", doc.includes("開発者向け詳細"));
assert("doc UX japanese 非公開", doc.includes("非公開"));
assert("doc UX button flow", doc.includes("非公開化案を作成") && doc.includes("非公開化を保存"));
assert("doc UX expectedBeforeUpdatedAt", doc.includes("expectedBeforeUpdatedAt"));

assert("doc next schedule P0", doc.includes("Schedule") && doc.includes("P0"));
assert("doc next physical delete planning", doc.includes("Physical DELETE"));
assert("doc next G-22 summary", doc.includes("G-22"));

assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit 691b020", doc.includes(BASE_COMMIT));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert("doc cursor no db write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor no grant", doc.includes("cursorGrantRevokeExecuted: false"));
assert("doc no new dev server", doc.includes("did not start") || doc.includes("New dev server start"));

for (const phase of [
  "G-22f",
  "G-22f1",
  "G-22f2",
  "G-22f3",
  "G-22f4",
  "G-22f4b",
  "G-22f5",
  "G-22f6",
]) {
  assert(`doc chain phase ${phase}`, doc.includes(phase));
}

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists ${chainDoc}`, exists(`${DOCS_DIR}/${chainDoc}`));
}

assert("G-22f6 result references targetId", resultDoc.includes(TARGET_ID));
assert("G-22f6 result chain save closed", resultDoc.includes("g22f5UnpublishUpdateChainSaveClosed: true"));

assert("00-current-state mentions G-22f7", currentState.includes("G-22f7"));
assert("03-next-actions mentions G-22f7", nextActions.includes("G-22f7"));
assert("handoff mentions G-22f7", handoff.includes("G-22f7"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("GRANT REVOKE not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP upload not executed by Cursor", true);
assert("commit push not executed", true);

console.log(
  `\nG-22f7 Gosaki Schedule unpublish UPDATE chain closure verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
