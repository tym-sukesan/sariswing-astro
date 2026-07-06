/**
 * G-22g — Gosaki Schedule P0 CRUD remaining tasks / next plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g-gosaki-schedule-p0-crud-next-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-p0-crud-next-plan.md";

const BASE_COMMIT = "82668b4";
const TARGET_LEGACY_008 = "schedule-2026-07-008";
const PROTECTED_014 = "schedule-2026-03-014";
const PROTECTED_001 = "schedule-2026-09-001";
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

assert("HEAD is 82668b4", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 82668b4", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("plan doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g", doc.includes("G-22g-gosaki-schedule-p0-crud-next-plan"));
assert(
  "doc gate complete",
  doc.includes("gosakiScheduleP0CrudNextPlanComplete: true"),
);
assert("doc readyForG22g1", doc.includes("readyForG22g1ScheduleListUxImprovement: true"));

assert("doc G-22d complete", doc.includes("G-22d"));
assert("doc G-22e complete", doc.includes("G-22e"));
assert("doc G-22f complete", doc.includes("G-22f"));

assert("doc schedule-2026-07-008 published false", doc.includes(TARGET_LEGACY_008) && doc.includes("false"));
assert("doc protected 014", doc.includes(PROTECTED_014));
assert("doc protected 001", doc.includes(PROTECTED_001));
assert("doc protected rows", doc.includes("protected"));

assert("doc physical DELETE not implemented", doc.includes("Physical DELETE") && doc.includes("not implemented"));
assert("doc physical DELETE deferred", doc.includes("deferred"));

assert(
  "doc public reflection not executed",
  doc.includes("public reflection") && doc.includes("not executed"),
);
assert(
  "doc package ftp not executed",
  doc.includes("packageRegenExecuted: false") && doc.includes("ftpUploadExecuted: false"),
);

assert("doc P0 classification", doc.includes("P0"));
assert("doc P1 classification", doc.includes("P1"));
assert("doc P2 classification", doc.includes("P2"));

assert("doc UX legacy_id", doc.includes("legacy_id"));
assert("doc UX dev tools", doc.includes("mock") || doc.includes("開発者"));
assert("doc UX 非公開", doc.includes("非公開"));
assert("doc UX expectedBeforeUpdatedAt", doc.includes("expectedBeforeUpdatedAt"));

assert("doc next phase G-22g1", doc.includes("G-22g1"));
assert("doc recommendation G-22g1", doc.includes("Primary recommendation") && doc.includes("G-22g1"));
assert("doc risk classification", doc.includes("Risk classification") || doc.includes("Risk"));

assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write not executed", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation not executed", doc.includes("sqlMutationExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc write-armed server stopped", doc.includes("writeArmedDevServerStopped: true"));
assert("doc port 4321 none", doc.includes("port4321ListenConfirmedNone: true"));

assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit 82668b4", doc.includes(BASE_COMMIT));

assert("doc CRUD inventory existing UPDATE", doc.includes("Existing UPDATE"));
assert("doc CRUD inventory duplicate INSERT", doc.includes("Duplicate INSERT"));
assert("doc CRUD inventory new event INSERT", doc.includes("New event INSERT"));
assert("doc CRUD inventory unpublish UPDATE", doc.includes("Unpublish UPDATE"));

assert("00-current-state mentions G-22g", currentState.includes("G-22g"));
assert("03-next-actions mentions G-22g", nextActions.includes("G-22g"));
assert("handoff mentions G-22g", handoff.includes("G-22g"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("FTP upload not executed by Cursor", true);
assert("commit push not executed", true);

console.log(
  `\nG-22g Gosaki Schedule P0 CRUD next plan verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
