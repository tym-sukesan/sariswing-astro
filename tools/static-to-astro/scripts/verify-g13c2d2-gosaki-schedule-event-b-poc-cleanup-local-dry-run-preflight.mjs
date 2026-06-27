/**
 * G-13c2d2 — Gosaki Event B PoC cleanup local dry-run Preview preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g13c2d2-gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight.md";
const G13C2D1_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-slice-implementation.md";
const G13C2_PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-event-b-poc-cleanup-preflight.md";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-config.ts";
const DRY_RUN_REL = "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-dry-run.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-schedule-event-b-poc-cleanup-ui.ts";
const OPERATOR_ASTRO_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SCHEDULE_ROUTE_REL =
  "src/pages/__admin-staging-shell/musician-basic/admin/schedule/index.astro";
const EVENT_A_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const EVENT_B_LEGACY = "schedule-2026-07-010";
const EVENT_B_DATE = "2026-07-19";
const APPROVAL_ID = "G-13c2-gosaki-schedule-event-b-poc-audit-cleanup-non-dry-run";
const ENV_ARM = "PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED";
const SAVE_ENV = "PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED";

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

const doc = read(DOC_REL);
const g13c2d1Doc = read(G13C2D1_DOC_REL);
const g13c2PreflightDoc = read(G13C2_PREFLIGHT_DOC_REL);
const configSrc = read(CONFIG_REL);
const dryRunSrc = read(DRY_RUN_REL);
const uiSrc = read(UI_REL);
const operatorAstro = read(OPERATOR_ASTRO_REL);
const scheduleRoute = read(SCHEDULE_ROUTE_REL);
const eventAConfigSrc = read(EVENT_A_CONFIG_REL);

assert("G-13c2d2 doc exists", exists(DOC_REL));
assert(
  "doc phase G-13c2d2",
  doc.includes("G-13c2d2-gosaki-schedule-event-b-poc-cleanup-local-dry-run-preflight"),
);
assert("doc references G-13c2d1", doc.includes("G-13c2d1") && exists(G13C2D1_DOC_REL));
assert("doc Event B id", doc.includes(EVENT_B_ID));
assert("doc Event B legacy", doc.includes(EVENT_B_LEGACY));
assert("doc Event B date", doc.includes(EVENT_B_DATE));
assert("doc staging shell route", doc.includes("__admin-staging-shell/musician-basic/admin/schedule"));
assert("doc local dev procedure", doc.includes("npm run dev"));
assert("doc preview button label", doc.includes("G-13c2 変更を確認（dry-run）"));
assert("doc expected dryRun true", doc.includes("dryRun: true"));
assert("doc expected actualWrite false", doc.includes("actualWrite: false"));
assert(
  "doc expected saveReadiness",
  doc.includes("ready_but_save_disabled") && doc.includes("ready_to_save"),
);
assert("doc expected 6 changedFields", doc.includes("title") && doc.includes("description"));
assert("doc expected title <>", doc.includes("title` | `<>`") || doc.includes("title` | `<>`"));
assert("doc expected venue null", doc.includes("venue` | **DB null**") || doc.includes("venue: null"));
assert("doc expected description", doc.includes("出演："));
assert("doc null UI vs payload", doc.includes("null") && doc.includes("payload"));
assert("doc save gate off", doc.includes("saveEnabled") && doc.includes("false"));
assert("doc env arm off", doc.includes(ENV_ARM) && doc.includes("unset / false"));
assert("doc save compile gate off", doc.includes(SAVE_ENV) && doc.includes("unset / false"));
assert("doc do not click Save", doc.includes("Do not click Save") || doc.includes("Do NOT click"));
assert("doc do not click G-13c1 Save", doc.includes("G-13c1"));
assert("doc no package regen", doc.includes("packageRegenExecuted") && doc.includes("**false**"));
assert("doc no Preview this phase", doc.includes("cursorPreviewButtonClicked") && doc.includes("**false**"));
assert("doc no Save this phase", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc event A untouched", doc.includes("eventATouched") && doc.includes("**false**"));
assert("doc next final preflight", doc.includes("G-13c2 final preflight") || doc.includes("final preflight"));
assert("doc ENABLE_ADMIN_STAGING_DATA_READ", doc.includes("ENABLE_ADMIN_STAGING_DATA_READ"));
assert("doc PUBLIC_ADMIN_WRITE_DRY_RUN true", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN` | `true`") || doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));

assert("G-13c2d1 doc exists", exists(G13C2D1_DOC_REL));
assert("G-13c2 preflight doc exists", exists(G13C2_PREFLIGHT_DOC_REL));
assert("g13c2d1 verifier script exists", exists(
  "tools/static-to-astro/scripts/verify-g13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation.mjs",
));

assert("config Event B target", configSrc.includes(EVENT_B_ID));
assert(
  "config approval id import",
  configSrc.includes("G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID"),
);
assert("dry-run actualWrite false", dryRunSrc.includes("actualWrite: false"));
assert("dry-run no updateScheduleWrite", !dryRunSrc.includes("updateScheduleWrite("));
assert("UI format null display", uiSrc.includes('if (value === null) return "null"'));
assert("UI preview handler", uiSrc.includes("runG13c2Preview"));
assert("UI save disabled default", uiSrc.includes("Event B cleanup 保存（無効）"));

assert("operator astro G-13c2 panel", operatorAstro.includes("gosaki-schedule-g13c2-event-b-poc-cleanup"));
assert("operator astro imports G-13c2 ui", operatorAstro.includes("gosaki-schedule-event-b-poc-cleanup-ui.ts"));
assert(
  "schedule route DEV + ENABLE_ADMIN_STAGING_SHELL gate",
  scheduleRoute.includes("ENABLE_ADMIN_STAGING_SHELL") && scheduleRoute.includes("isDev"),
);

assert("Event A config id unchanged", eventAConfigSrc.includes(EVENT_A_ID));
assert("Event A config not replaced by Event B", !eventAConfigSrc.includes(`G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID =\n  "${EVENT_B_ID}"`));

const g13c2d1Verifier = spawnSync(
  "node",
  ["tools/static-to-astro/scripts/verify-g13c2d1-gosaki-schedule-event-b-poc-cleanup-slice-implementation.mjs"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("G-13c2d1 verifier still passes", g13c2d1Verifier.status === 0, g13c2d1Verifier.stderr?.slice(0, 200));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "doc no March reupload",
  !doc.includes("schedule/2026-03/index.html") || doc.includes("do not re-upload March"),
);

console.log(`\nG-13c2d2 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
