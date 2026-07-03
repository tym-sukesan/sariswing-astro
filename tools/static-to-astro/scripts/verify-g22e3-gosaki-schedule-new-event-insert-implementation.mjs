/**
 * G-22e3 — Gosaki Schedule new event INSERT implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22e3-gosaki-schedule-new-event-insert-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-implementation.md";
const PLAN_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-planning.md";
const BASE_COMMIT = "c6e48e5";

const CONFIG = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-config.ts";
const GUARDS = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-guards.ts";
const SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const INSERT_ADAPTER = "src/lib/admin/staging-write/schedule-insert-write-adapter.ts";
const G22E_DRY = "src/lib/admin/staging-write/gosaki-schedule-new-event-dry-run.ts";
const G22D_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G9K_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const WRITE_TYPES = "src/lib/admin/staging-write/schedule-write-types.ts";

const APPROVAL_ID = "G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice";
const ARM_ENV = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED";
const PROTECTED_LEGACY = "schedule-2026-03-014";
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

assert("HEAD is c6e48e5", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

for (const rel of [CONFIG, GUARDS, SAVE, INSERT_ADAPTER, DOC_REL]) {
  assert(`exists ${path.basename(rel)}`, exists(rel));
}

const doc = read(DOC_REL);
const plan = read(PLAN_REL);
const config = read(CONFIG);
const guards = read(GUARDS);
const save = read(SAVE);
const insertAdapter = read(INSERT_ADAPTER);
const g22eDry = read(G22E_DRY);
const g22dConfig = read(G22D_CONFIG);
const g22dSave = read(G22D_SAVE);
const g9kSave = read(G9K_SAVE);
const g9kConfig = read(G9K_CONFIG);
const operatorUi = read(OPERATOR_UI);
const scheduleUi = read(SCHEDULE_UI);
const writeTypes = read(WRITE_TYPES);

assert("doc phase G-22e3", doc.includes("G-22e3-gosaki-schedule-new-event-insert-implementation"));
assert("doc implementation complete", doc.includes("gosakiScheduleNewEventInsertImplementationComplete: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc ready G-22e4", doc.includes("readyForG22e4ScheduleNewEventInsertFinalPreflight: true"));
assert("doc G-22e5 not ready", doc.includes("readyForG22e5ScheduleNewEventInsertOperatorExecution: false"));
assert("doc default save disabled", doc.includes("disabled"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("plan prior exists", plan.includes("G-22e2-gosaki-schedule-new-event-insert-planning"));

assert("approvalId in types", writeTypes.includes(APPROVAL_ID));
assert(
  "approvalId in SCHEDULE_WRITE_APPROVAL_IDS",
  writeTypes.includes("G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID"),
);
assert("config approvalId", config.includes("G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID"));
assert("config dedicated arm env", config.includes(ARM_ENV));
assert("config default disabled reason", config.includes("routine dev safety"));
assert("config evaluateG22eNewEventInsertUiGate", config.includes("evaluateG22eNewEventInsertUiGate"));
assert("config saveEnabled from armed", config.includes("saveEnabled = armed"));
assert("config protected legacy_id", config.includes(PROTECTED_LEGACY));

assert("guards buildG22eNewEventInsertPayload", guards.includes("buildG22eNewEventInsertPayload"));
assert("guards assert payload only", guards.includes("assertG22eNewEventInsertPayloadOnly"));
assert("guards collect failures", guards.includes("collectG22eNewEventInsertGuardFailures"));
assert("guards published false", guards.includes("published=false"));
assert("guards show_on_home false", guards.includes("show_on_home=false"));
assert("guards home_order null", guards.includes("home_order=null"));
assert("guards legacy_id rule", guards.includes("computeNextLegacyIdFromRows"));
assert("guards sort_order rule", guards.includes("computeSortOrderFromRows"));
assert("guards source_route rule", guards.includes("deriveG22eSourceRoute"));
assert("guards source_file rule", guards.includes("deriveG22eSourceFile"));
assert("guards no explicit id", guards.includes("must not specify id"));
assert("guards protected duplicate legacy", guards.includes("G22E_PROTECTED_DUPLICATE_INSERT_LEGACY_ID"));

assert("insert adapter insertNewEventScheduleWrite", insertAdapter.includes("insertNewEventScheduleWrite"));
assert("insert adapter operation new-event-insert", insertAdapter.includes("new-event-insert"));
assert("insert adapter uses .insert(", insertAdapter.includes(".insert(payload)"));
assert("insert adapter duplicate path preserved", insertAdapter.includes("insertScheduleWrite"));

assert("save executeG22eScheduleNewEventInsertSave", save.includes("executeG22eScheduleNewEventInsertSave"));
assert("save calls insertNewEventScheduleWrite", save.includes("insertNewEventScheduleWrite"));
assert("save operation new-event-insert", save.includes('"new-event-insert"'));
assert("save guardReasons", save.includes("guardReasons"));

assert("g22e dry-run actualWrite false", g22eDry.includes("actualWrite: false"));
assert("g22e dry-run saveAllowed false", g22eDry.includes("saveAllowed: false"));
assert("g22e dry-run no insert call", !g22eDry.includes(".insert("));

assert("g22d config mutual exclusion G-22e", g22dConfig.includes("G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED"));
assert("g22d save unchanged", g22dSave.includes("executeG22dScheduleDuplicateInsertSave"));
assert("g9k save unchanged no new insert", !g9kSave.includes("insertNewEventScheduleWrite"));
assert("g9k config mutual exclusion G-22e", g9kConfig.includes("collectG22eNewEventInsertArmOffFailures"));

assert("operator evaluateG22eNewEventInsertUiGate", operatorUi.includes("evaluateG22eNewEventInsertUiGate"));
assert("operator executeG22e save", operatorUi.includes("executeG22eScheduleNewEventInsertSave"));
assert("operator new save label disabled", operatorUi.includes("保存（現在は無効）"));
assert("operator new save label armed", operatorUi.includes("新規追加を保存"));
assert("operator g9k path preserved", operatorUi.includes("executeG9kExistingEventSaveButtonSave"));
assert("operator g22d path preserved", operatorUi.includes("executeG22dScheduleDuplicateInsertSave"));
assert("operator dev details planned legacy_id", operatorUi.includes("planned legacy_id"));
assert("operator dev details G-22e env arm", operatorUi.includes("G-22e env arm"));

assert("schedule ui add enabled", scheduleUi.includes('id="gosaki-schedule-add-btn"'));
assert("schedule ui delete disabled", scheduleUi.includes('id="gosaki-schedule-delete-btn"') && scheduleUi.includes("disabled"));

for (const rel of [CONFIG, GUARDS, SAVE, INSERT_ADAPTER, OPERATOR_UI, WRITE_TYPES, DOC_REL]) {
  assert(`no prod ref in ${path.basename(rel)}`, !read(rel).includes(PROD_REF));
}

const moduleGuard = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { getG22eNewEventInsertConfig } from './src/lib/admin/staging-write/gosaki-schedule-new-event-insert-config.ts';
import { collectG22eNewEventInsertGuardFailures } from './src/lib/admin/staging-write/gosaki-schedule-new-event-insert-guards.ts';

const env = {
  DEV: true,
  ENABLE_ADMIN_STAGING_SHELL: 'true',
  ENABLE_ADMIN_STAGING_WRITE: 'false',
  PUBLIC_ADMIN_WRITE_DRY_RUN: 'true',
  PUBLIC_ADMIN_AUTH_PROVIDER: 'supabase',
  PUBLIC_ADMIN_DATA_PROVIDER: 'supabase',
  PUBLIC_ADMIN_WRITE_PROVIDER: 'supabase',
  PUBLIC_ADMIN_WRITE_MODULE: 'schedule',
  PUBLIC_ADMIN_WRITE_APPROVAL_ID: '${APPROVAL_ID}',
  PUBLIC_SUPABASE_URL: 'https://kmjqppxjdnwwrtaeqjta.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'test',
} as unknown as ImportMetaEnv;

const config = getG22eNewEventInsertConfig(env);
const failures = collectG22eNewEventInsertGuardFailures({
  newEventMode: true,
  newEventDryRunOk: true,
  newEventDryRunOperation: 'new',
  hasExistingScheduleId: false,
  hasDuplicateSourceId: false,
  env,
});

if (config.saveEnabled || config.saveAllowed || failures.length === 0) {
  console.error(JSON.stringify({ config, failures }));
  process.exit(1);
}
console.log('default-guards-fail-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "default env guards fail (no save)",
  moduleGuard.status === 0 && moduleGuard.stdout.includes("default-guards-fail-ok"),
  moduleGuard.stderr || moduleGuard.stdout,
);

const allocationSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import {
  computeG22ePlannedAllocation,
  buildG22eNewEventInsertPayload,
  assertG22eNewEventInsertPayloadOnly,
} from './src/lib/admin/staging-write/gosaki-schedule-new-event-insert-guards.ts';

const monthRows = [
  { legacy_id: 'schedule-2026-09-005', sort_order: 50, month: '2026-09' },
];
const planned = computeG22ePlannedAllocation({ date: '2026-09-15', monthRows });
if (planned.legacy_id !== 'schedule-2026-09-006') throw new Error('legacy_id');
if (planned.sort_order !== 60) throw new Error('sort_order');
if (planned.source_route !== '/schedule/2026-09/') throw new Error('source_route');
if (planned.source_file !== 'schedule-2026-09.html') throw new Error('source_file');

const payload = buildG22eNewEventInsertPayload({
  formValues: { title: 'Test', venue: '', open_time: '', start_time: '', price: '', description: '' },
  date: '2026-09-15',
  monthRows,
});
assertG22eNewEventInsertPayloadOnly(payload);
if (payload.published !== false || payload.show_on_home !== false || payload.home_order !== null) {
  throw new Error('fixed flags');
}
console.log('allocation-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "allocation smoke test",
  allocationSmoke.status === 0 && allocationSmoke.stdout.includes("allocation-smoke-ok"),
  allocationSmoke.stderr || allocationSmoke.stdout,
);

console.log(
  `\nG-22e3 Gosaki Schedule new event INSERT implementation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
