/**
 * G-13c2 — Gosaki Event B PoC cleanup execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2-gosaki-schedule-event-b-poc-cleanup-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-execution-result.md";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-config.ts";
const FINAL_PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-final-preflight.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-07-010";
const APPROVAL_ID = "G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run";
const OPERATION_ID = "gosaki-schedule-event-b-poc-cleanup";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

const BEFORE_UPDATED_AT = "2026-06-18T01:04:51.312817+00:00";
const AFTER_UPDATED_AT = "2026-06-27T10:17:42.60691+00:00";

const CHANGED_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
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

const doc = read(DOC_REL);
const configSrc = read(CONFIG_REL);

assert("execution result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13c2 execution result",
  doc.includes("G-13c2-gosaki-schedule-event-b-poc-cleanup-execution-result"),
);
assert("doc operator manual save once", doc.includes("operator manual") && doc.includes("once"));
assert("doc errorCode none", doc.includes("errorCode: (none)"));
assert("doc save clicks 1", doc.includes("Save clicks") && doc.includes("**1**"));
assert("doc no cursor save", doc.includes("cursorClickedSave: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc Event A not touched", doc.includes("not touched") && doc.includes(EVENT_A_ID));
assert("doc march not reuploaded", doc.includes("marchReuploadTriggered: false"));
assert("doc Event B id", doc.includes(EVENT_B_ID));
assert("doc legacy id", doc.includes(LEGACY_ID));
assert("doc date 2026-07-19", doc.includes("2026-07-19"));
assert("doc approval id", doc.includes(APPROVAL_ID));
assert("doc operation id", doc.includes(OPERATION_ID));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc before updated_at", doc.includes(BEFORE_UPDATED_AT));
assert("doc after updated_at", doc.includes(AFTER_UPDATED_AT));
assert("doc ready_to_save preview", doc.includes("ready_to_save"));
assert("doc G-13c2e next phase", doc.includes("G-13c2e-gosaki-schedule-event-b-poc-cleanup-public-reflection"));
assert("doc ready for G-13c2e gate", doc.includes("readyForG13c2ePublicReflection: true"));
assert("doc no re-execution", doc.includes("readyForG13c2EventBPocCleanupReExecution: false"));
assert("doc no FTP this phase", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc schedule/2026-07 upload path", doc.includes("schedule/2026-07/index.html"));

assert("doc after title <>", doc.includes("title` | `<>`") || doc.includes("**title** | `<>`"));
assert("doc after venue null", doc.includes("venue") && doc.includes("**null**"));
assert("doc after description 出演", doc.includes("description` | `出演：`") || doc.includes("**description** | `出演：`"));
assert("doc null not empty string", doc.includes("not `''`") || doc.includes("DB null"));
assert("doc G-9g PoC removal", doc.includes("G-9g2") && doc.includes("G-9g3b"));

assert("config Event B target", configSrc.includes(EVENT_B_ID));
assert("config expected title <>", configSrc.includes('G13C2_EVENT_B_POC_CLEANUP_EXPECTED_TITLE = "<>"'));
assert("config expected description", configSrc.includes('G13C2_EVENT_B_POC_CLEANUP_EXPECTED_DESCRIPTION = "出演："'));
assert("config 6 changed fields", CHANGED_FIELDS.every((f) => configSrc.includes(`"${f}"`)));
assert("config no Event A as target", !configSrc.includes(`G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID =\n  "${EVENT_A_ID}"`));

assert(
  "after updated_at newer than before",
  new Date(AFTER_UPDATED_AT).getTime() > new Date(BEFORE_UPDATED_AT).getTime(),
);

assert(
  "final preflight links exist",
  fs.existsSync(path.join(REPO_ROOT, FINAL_PREFLIGHT_REL)),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13c2 Event B cleanup execution result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
