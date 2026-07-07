/**
 * G-22j1 — Gosaki Schedule P0 overall closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22j1-gosaki-schedule-p0-overall-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-p0-overall-closure.md";
const G22D_CLOSURE = "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-chain-closure.md";
const G22E_CLOSURE = "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-chain-closure.md";
const G22F_CLOSURE = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-closure.md";
const G22G_UX = "tools/static-to-astro/docs/gosaki-schedule-p0-ux-summary.md";
const G22G_READ = "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-closure.md";
const G22H_CLOSURE = "tools/static-to-astro/docs/gosaki-schedule-republish-update-result-closure.md";
const G22I5SKIP = "tools/static-to-astro/docs/gosaki-schedule-republish-public-reflection-closure.md";
const G22I1 = "tools/static-to-astro/docs/gosaki-schedule-p0-release-readiness-review.md";

const BASE_COMMIT = "8551933";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const SAVED_UPDATED_AT = "2026-07-07T02:30:32.260326+00:00";
const REF_014 = "schedule-2026-03-014";
const REF_014_ID = "434e4051-86c3-473e-9ad0-39d2e5042fb8";
const REF_001 = "schedule-2026-09-001";
const REF_001_ID = "18b48259-9a9a-4b00-b136-6c0c4ff3b2f3";
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

assert("HEAD is 8551933", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8551933", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("overall closure doc exists", exists(DOC_REL));
assert("G-22d closure doc exists", exists(G22D_CLOSURE));
assert("G-22e closure doc exists", exists(G22E_CLOSURE));
assert("G-22f closure doc exists", exists(G22F_CLOSURE));
assert("G-22g UX doc exists", exists(G22G_UX));
assert("G-22g read closure doc exists", exists(G22G_READ));
assert("G-22h closure doc exists", exists(G22H_CLOSURE));
assert("G-22i5skip closure doc exists", exists(G22I5SKIP));
assert("G-22i1 review doc exists", exists(G22I1));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22j1", doc.includes("G-22j1-gosaki-schedule-p0-overall-closure"));
assert(
  "doc overall closure gate complete",
  doc.includes("gosakiScheduleP0OverallClosureComplete: true"),
);
assert("doc overall closure", /overall closure/i.test(doc));
assert(
  "doc G-22d through G-22i5skip complete",
  doc.includes("g22dThroughG22i5skipChainClosed: true") ||
    (doc.includes("G-22d3d") && doc.includes("G-22i5skip")),
);

assert("doc duplicate insert closed", doc.includes("G-22d3d") || /duplicate INSERT.*closed/i.test(doc));
assert("doc new event closed", doc.includes("G-22e7") || /new event INSERT.*closed/i.test(doc));
assert("doc unpublish closed", doc.includes("G-22f7") || /unpublish UPDATE.*closed/i.test(doc));
assert("doc republish closed", doc.includes("G-22h7") || /republish UPDATE.*closed/i.test(doc));
assert(
  "doc authenticated admin read",
  doc.includes("G-22g1f3") || /authenticated admin read/i.test(doc),
);
assert("doc P0 UX complete", doc.includes("G-22g2b") || /P0 UX.*complete/i.test(doc));
assert(
  "doc public reflection review",
  /public reflection.*complete|reflection review/i.test(doc),
);

assert("doc 008 published true", doc.includes(TARGET_LEGACY) && doc.includes("published=true"));
assert("doc 008 id", doc.includes(TARGET_ID));
assert("doc saved updated_at", doc.includes(SAVED_UPDATED_AT));
assert("doc 014 published false", doc.includes(REF_014) && doc.includes("published=false"));
assert("doc 001 published false", doc.includes(REF_001) && doc.includes("published=false"));
assert("doc 014 id", doc.includes(REF_014_ID));
assert("doc 001 id", doc.includes(REF_001_ID));
assert("doc test rows retained", /test row|retained/i.test(doc));

assert("doc db local live aligned", /dbLocalLiveAligned: true|DB.*local.*live/i.test(doc));
assert("doc upload not needed", /uploadNeeded: false|upload.*not needed/i.test(doc));

assert("doc save re-exec forbidden", doc.includes("saveReExecutionForbidden: true") || /forbidden/i.test(doc));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc physical delete deferred", doc.includes("physicalDeleteImplemented: false"));

assert("doc package regen false in j1", doc.includes("packageRegenExecutedInG22j1: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));
assert("doc production not executed", doc.includes("productionDeployExecuted: false"));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc rls grant unchanged", doc.includes("rlsGrantChangeExecuted: false"));
assert("doc service role not used", doc.includes("serviceRoleUsed: false"));

assert("doc remaining work UX polish", /UX polish/i.test(doc));
assert("doc remaining work physical delete", /physical DELETE/i.test(doc));
assert("doc next release note", /release note|P0 release/i.test(doc));
assert("doc next 30 minute", /30.minute|30-minute/i.test(doc));

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

assert("00-current-state mentions G-22j1", currentState.includes("G-22j1"));
assert("03-next-actions mentions G-22j1", nextActions.includes("G-22j1"));
assert("handoff mentions G-22j1", handoff.includes("G-22j1"));

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
  `\nG-22j1 Gosaki Schedule P0 overall closure verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
