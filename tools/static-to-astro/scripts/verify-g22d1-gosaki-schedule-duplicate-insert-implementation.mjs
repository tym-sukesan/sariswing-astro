/**
 * G-22d1 — Gosaki Schedule duplicate INSERT implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d1-gosaki-schedule-duplicate-insert-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-implementation.md";
const PLAN_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-planning.md";
const BASE_COMMIT = "8d0f541";

const CONFIG = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts";
const GUARDS = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-guards.ts";
const SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const INSERT_ADAPTER = "src/lib/admin/staging-write/schedule-insert-write-adapter.ts";
const G22B = "src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G9K_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const WRITE_TYPES = "src/lib/admin/staging-write/schedule-write-types.ts";

const APPROVAL_ID = "G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice";
const ARM_ENV = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED";
const SOURCE_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const PLANNED_LEGACY = "schedule-2026-03-014";
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

function gitDiff(rel) {
  return spawnSync("git", ["diff", rel], { cwd: REPO_ROOT, encoding: "utf8" }).stdout;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 8d0f541", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

for (const rel of [CONFIG, GUARDS, SAVE, INSERT_ADAPTER, DOC_REL]) {
  assert(`exists ${path.basename(rel)}`, exists(rel));
}

const doc = read(DOC_REL);
const plan = read(PLAN_REL);
const config = read(CONFIG);
const guards = read(GUARDS);
const save = read(SAVE);
const insertAdapter = read(INSERT_ADAPTER);
const g22b = read(G22B);
const writeAdapter = read(WRITE_ADAPTER);
const g9kSave = read(G9K_SAVE);
const g9kConfig = read(G9K_CONFIG);
const operatorUi = read(OPERATOR_UI);
const scheduleUi = read(SCHEDULE_UI);
const writeTypes = read(WRITE_TYPES);

assert("doc phase G-22d1", doc.includes("G-22d1-gosaki-schedule-duplicate-insert-implementation"));
assert("doc implementation complete", doc.includes("gosakiScheduleDuplicateInsertImplementationComplete: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc ready G-22d2", doc.includes("readyForG22d2DuplicateInsertFinalPreflight: true"));
assert("doc G-22d3 not ready", doc.includes("readyForG22d3DuplicateInsertOperatorExecution: false"));
assert("doc default save disabled", doc.includes("disabled"));
assert("doc G-22d2/G-22d3 split", doc.includes("G-22d2") && doc.includes("G-22d3"));
assert("plan prior exists", plan.includes("G-22d-gosaki-schedule-duplicate-insert-planning"));

assert("approvalId in types", writeTypes.includes(APPROVAL_ID));
assert("approvalId in SCHEDULE_WRITE_APPROVAL_IDS", writeTypes.includes(`G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID`));
assert("config approvalId", config.includes("G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID"));
assert("config source id fixed", config.includes(SOURCE_ID));
assert("config planned legacy", config.includes(PLANNED_LEGACY));
assert("config dedicated arm env", config.includes(ARM_ENV));
assert("config default disabled reason", config.includes("routine dev safety"));
assert("config evaluateG22dDuplicateInsertUiGate", config.includes("evaluateG22dDuplicateInsertUiGate"));
assert("config saveEnabled from armed", config.includes("saveEnabled = armed"));

assert("guards buildG22dDuplicateInsertPayload", guards.includes("buildG22dDuplicateInsertPayload"));
assert("guards assert payload only", guards.includes("assertG22dDuplicateInsertPayloadOnly"));
assert("guards collect failures", guards.includes("collectG22dDuplicateInsertGuardFailures"));
assert("guards published false", guards.includes("published=false"));
assert("guards site_slug guard", guards.includes("STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG"));

assert("insert adapter insertScheduleWrite", insertAdapter.includes("insertScheduleWrite"));
assert("insert adapter operation duplicate-insert", insertAdapter.includes("duplicate-insert"));
assert("insert adapter uses .insert(", insertAdapter.includes(".insert(payload)"));
assert("insert adapter no update", !insertAdapter.includes(".update("));

assert("save executeG22dScheduleDuplicateInsertSave", save.includes("executeG22dScheduleDuplicateInsertSave"));
assert("save calls insertScheduleWrite", save.includes("insertScheduleWrite"));
assert("save guardReasons", save.includes("guardReasons"));

assert("write adapter unchanged no insert", !writeAdapter.includes("insertScheduleWrite") && !writeAdapter.includes(".insert("));
assert("g9k save unchanged no insert", !gitDiff(G9K_SAVE).includes(".insert(") && !g9kSave.includes("insertScheduleWrite"));
assert("g9k config mutual exclusion G-22d", g9kConfig.includes("collectG22dDuplicateInsertArmOffFailures"));

assert("g22b dry-run actualWrite false", g22b.includes("actualWrite: false"));
assert("g22b saveAllowed false", g22b.includes("saveAllowed: false"));
assert("g22b no insert call", !g22b.includes(".insert("));

assert("operator evaluateG22dDuplicateInsertUiGate", operatorUi.includes("evaluateG22dDuplicateInsertUiGate"));
assert("operator executeG22d save", operatorUi.includes("executeG22dScheduleDuplicateInsertSave"));
assert("operator duplicate save label disabled", operatorUi.includes("複製案を保存（現在は無効）"));
assert("operator duplicate save label armed", operatorUi.includes("複製案を保存"));
assert("operator g9k path preserved", operatorUi.includes("executeG9kExistingEventSaveButtonSave"));

assert("schedule ui add disabled", scheduleUi.includes('id="gosaki-schedule-add-btn"') && scheduleUi.includes("disabled"));
assert("schedule ui delete disabled", scheduleUi.includes('id="gosaki-schedule-delete-btn"') && scheduleUi.includes("disabled"));
assert("schedule ui duplicate enabled markup", scheduleUi.includes("複製案を作成"));

for (const rel of [CONFIG, GUARDS, SAVE, INSERT_ADAPTER, OPERATOR_UI, WRITE_TYPES, G9K_CONFIG]) {
  assert(`no prod ref in ${path.basename(rel)}`, !read(rel).includes(PROD_REF));
}

const moduleGuard = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { getG22dDuplicateInsertConfig } from './src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts';
import { collectG22dDuplicateInsertGuardFailures } from './src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-guards.ts';

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

const config = getG22dDuplicateInsertConfig(env);
const failures = collectG22dDuplicateInsertGuardFailures({
  duplicateMode: true,
  source: {
    id: '${SOURCE_ID}',
    legacy_id: 'schedule-2026-03-003',
    site_slug: 'gosaki-piano',
    date: '2026-03-08',
    title: '<Live & Session>',
  },
  duplicateDryRunOk: true,
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

console.log(`\nG-22d1 Gosaki Schedule duplicate INSERT implementation verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
