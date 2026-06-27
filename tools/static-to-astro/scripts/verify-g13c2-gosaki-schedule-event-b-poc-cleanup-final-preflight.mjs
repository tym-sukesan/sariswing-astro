/**
 * G-13c2 — Gosaki Event B PoC cleanup final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-final-preflight.md";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-config.ts";
const WRITE_TYPES_REL = "src/lib/admin/staging-write/schedule-write-types.ts";
const DRY_RUN_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-local-dry-run-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const LEGACY_ID = "schedule-2026-07-010";
const APPROVAL_ID = "G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run";
const OPERATION_ID = "gosaki-schedule-event-b-poc-cleanup";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED";
const SAVE_ENABLED_ENV = "PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED";

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
const writeTypesSrc = read(WRITE_TYPES_REL);
const dryRunResultDoc = read(DRY_RUN_RESULT_REL);

assert("G-13c2 final preflight doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13c2-final-preflight",
  doc.includes("G-13c2-gosaki-schedule-event-b-poc-cleanup-final-preflight"),
);
assert("doc final preflight complete", doc.includes("final preflight complete"));
assert("doc Event B id", doc.includes(EVENT_B_ID));
assert("doc legacy_id schedule-2026-07-010", doc.includes(LEGACY_ID));
assert("doc date 2026-07-19", doc.includes("2026-07-19"));
assert("doc site_slug gosaki-piano", doc.includes("gosaki-piano"));
assert("doc Event A out of scope", doc.includes("Event A") && doc.includes("not in scope"));
assert("doc no Event A as target row", !doc.includes(`**id** | \`${EVENT_A_ID}\``));
assert("doc beforeSnapshot SELECT", doc.includes("beforeSnapshot") && doc.includes("select"));
assert("doc G-9g2 reference title", doc.includes("G-9g2 title PoC"));
assert("doc updated_at baseline", doc.includes("2026-06-18T01:04:51.312817+00:00"));
assert("doc expected title <>", doc.includes("title` | `<>`") || doc.includes("title = '<>'"));
assert("doc expected venue null", doc.includes("venue") && doc.includes("DB null"));
assert("doc expected description 出演", doc.includes("出演："));
assert("doc six changedFields", doc.includes("open_time") && doc.includes("description"));
assert("doc null not empty string", doc.includes('not empty string') || doc.includes("IS NULL"));
assert("doc rollback policy", doc.includes("Rollback policy") || doc.includes("rollback"));
assert("doc rollback SQL template", doc.includes("rollback template") && doc.includes("DOCUMENTATION ONLY"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted") && doc.includes("**false**"));
assert("doc separate rollback approval", doc.includes("Separate") && doc.includes("rollback"));
assert("doc approval phrase", doc.includes("承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。"));
assert("doc approval_id", doc.includes(APPROVAL_ID));
assert("doc operation_id", doc.includes(OPERATION_ID));
assert("doc env arm", doc.includes(ENV_ARM));
assert("doc save enabled env", doc.includes(SAVE_ENABLED_ENV));
assert("doc execution env stack", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc pre-Save ready_to_save", doc.includes("ready_to_save"));
assert("doc pre-Save payload null", doc.includes("payload venue: null"));
assert("doc operator Save procedure", doc.includes("Operator Save procedure"));
assert("doc afterVerification SELECT", doc.includes("afterVerification") && doc.includes("aa440e29"));
assert("doc staging shell route", doc.includes("__admin-staging-shell/musician-basic/admin/schedule"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no SQL execution", doc.includes("cursorSqlExecuted") && doc.includes("**false**"));
assert("doc next execution phase", doc.includes("G-13c2-gosaki-schedule-event-b-poc-cleanup-execution"));
assert("doc readyForExecution gate", doc.includes("readyForG13c2EventBPocCleanupExecution"));
assert("doc do not reuse G-13c1", doc.includes("G-13c1"));
assert("doc G-13c1 arm off", doc.includes("G13C1") || doc.includes("G-13c1 arm"));
assert("doc failure stop conditions", doc.includes("Failure stop conditions"));
assert("doc target mismatch stop", doc.includes("target mismatch"));
assert("doc stale updated_at stop", doc.includes("updated_at conflict") || doc.includes("stale"));
assert("doc payload null empty string stop", doc.includes("payload null"));
assert("doc afterVerification mismatch stop", doc.includes("afterVerification mismatch"));
assert("doc G-14c reflection", doc.includes("G-14c") || doc.includes("public reflection"));
assert("doc schedule/2026-07 upload", doc.includes("schedule/2026-07/index.html"));
assert("doc march untouched", doc.includes("marchReuploadTriggered") && doc.includes("**false**"));

assert("write-types matches approval_id", writeTypesSrc.includes(APPROVAL_ID));
assert("config matches env arm", configSrc.includes(ENV_ARM));
assert("config expected description", configSrc.includes('G13C2_EVENT_B_POC_CLEANUP_EXPECTED_DESCRIPTION = "出演："'));
assert("dry-run result doc referenced", dryRunResultDoc.includes("G-13c2d2-result"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

console.log(`\nG-13c2 final preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
