/**
 * G-13d1 — Gosaki Event A PoC cleanup final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13d1-final-preflight-gosaki-schedule-event-a-poc-cleanup.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-event-a-poc-cleanup-final-preflight.md";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const WRITE_TYPES_REL = "src/lib/admin/staging-write/schedule-write-types.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const APPROVAL_ID = "G-13c1-gosaki-schedule-event-a-poc-text-cleanup-non-dry-run";
const OPERATION_ID = "gosaki-schedule-event-a-poc-cleanup";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED";
const SAVE_ENABLED_ENV = "PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED";

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

assert("G-13d1 final preflight doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-13d1-final-preflight",
  doc.includes("G-13d1-final-preflight-gosaki-schedule-event-a-poc-cleanup"),
);
assert("doc final preflight complete", doc.includes("final preflight complete"));
assert("doc Event A id", doc.includes(EVENT_A_ID));
assert("doc legacy_id schedule-2026-03-007", doc.includes("schedule-2026-03-007"));
assert("doc date 2026-03-15", doc.includes("2026-03-15"));
assert("doc site_slug gosaki-piano", doc.includes("gosaki-piano"));
assert("doc no Event B", !doc.includes(EVENT_B_ID));
assert("doc beforeSnapshot SELECT", doc.includes("beforeSnapshot") && doc.includes("select"));
assert("doc G-9k6 reference markers", doc.includes("G-9k6"));
assert("doc cleanup expected Duo title", doc.includes("<Duo>") && doc.includes("15:00"));
assert("doc description seed", doc.includes("会場website: http://pubhpp.com/"));
assert("doc six changedFields", doc.includes("description") && doc.includes("open_time"));
assert("doc rollback policy", doc.includes("Rollback policy") || doc.includes("rollback"));
assert("doc rollback SQL template", doc.includes("rollback template") && doc.includes("DOCUMENTATION ONLY"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted") && doc.includes("**false**"));
assert("doc approval phrase", doc.includes("承認します。このSchedule CMS非dry-run操作を1回だけ実行してください。"));
assert("doc approval_id", doc.includes(APPROVAL_ID));
assert("doc operation_id", doc.includes(OPERATION_ID));
assert("doc env arm", doc.includes(ENV_ARM));
assert("doc save enabled env", doc.includes(SAVE_ENABLED_ENV));
assert("doc execution env stack", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc operator Save procedure", doc.includes("Operator Save procedure"));
assert("doc staging shell route", doc.includes("__admin-staging-shell/musician-basic/admin/schedule"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no SQL execution", doc.includes("cursorSqlExecuted") && doc.includes("**false**"));
assert("doc next execution phase", doc.includes("G-13d1-event-a-poc-cleanup-execution"));
assert("doc readyForExecution gate", doc.includes("readyForG13d1EventAPocCleanupExecution"));
assert("doc do not reuse G-9k approval", doc.includes("G-9k-gosaki-schedule-existing-event-save-button-non-dry-run"));

assert("write-types matches approval_id", writeTypesSrc.includes(APPROVAL_ID));
assert("config matches env arm", configSrc.includes(ENV_ARM));
assert("config expected description", configSrc.includes("会場website: http://pubhpp.com/"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-13d1 final preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
