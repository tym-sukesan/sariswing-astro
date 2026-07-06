/**
 * G-22f3 — Gosaki Schedule unpublish UPDATE implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f3-gosaki-schedule-unpublish-update-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-implementation.md";
const PLAN_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-planning.md";
const BASE_COMMIT = "56316a6";

const CONFIG = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-config.ts";
const GUARDS = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-guards.ts";
const SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const G22F_DRY = "src/lib/admin/staging-write/gosaki-schedule-unpublish-dry-run.ts";
const G22D_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-config.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G9K_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const WRITE_TYPES = "src/lib/admin/staging-write/schedule-write-types.ts";
const UPDATE_TRIGGER = "src/lib/admin/staging-write/schedule-general-update-trigger.ts";

const APPROVAL_ID = "G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice";
const ARM_ENV = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED";
const PROTECTED_014 = "schedule-2026-03-014";
const PROTECTED_001 = "schedule-2026-09-001";
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

assert("HEAD is 56316a6", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

for (const rel of [CONFIG, GUARDS, SAVE, DOC_REL, PLAN_REL]) {
  assert(`exists ${path.basename(rel)}`, exists(rel));
}

const doc = read(DOC_REL);
const plan = read(PLAN_REL);
const config = read(CONFIG);
const guards = read(GUARDS);
const save = read(SAVE);
const g22fDry = read(G22F_DRY);
const g22dConfig = read(G22D_CONFIG);
const g22dSave = read(G22D_SAVE);
const g22eConfig = read(G22E_CONFIG);
const g22eSave = read(G22E_SAVE);
const g9kSave = read(G9K_SAVE);
const operatorUi = read(OPERATOR_UI);
const scheduleUi = read(SCHEDULE_UI);
const writeTypes = read(WRITE_TYPES);
const updateTrigger = read(UPDATE_TRIGGER);

assert("doc phase G-22f3", doc.includes("G-22f3-gosaki-schedule-unpublish-update-implementation"));
assert("doc implementation complete", doc.includes("gosakiScheduleUnpublishUpdateImplementationComplete: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc ready G-22f4", doc.includes("readyForG22f4ScheduleUnpublishUpdateFinalPreflight: true"));
assert("doc G-22f5 not ready", doc.includes("readyForG22f5ScheduleUnpublishUpdateOperatorExecution: false"));
assert("doc default save disabled", doc.includes("disabled"));
assert("doc physical delete not implemented", doc.includes("physicalDeleteImplemented: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("plan prior exists", plan.includes("G-22f2-gosaki-schedule-unpublish-update-planning"));

assert("approvalId in types", writeTypes.includes(APPROVAL_ID));
assert(
  "approvalId in SCHEDULE_WRITE_APPROVAL_IDS",
  writeTypes.includes("G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID"),
);
assert("config approvalId", config.includes("G22F_SCHEDULE_UNPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID"));
assert("config dedicated arm env", config.includes(ARM_ENV));
assert("config default disabled reason", config.includes("routine dev safety"));
assert("config evaluateG22fUnpublishUpdateUiGate", config.includes("evaluateG22fUnpublishUpdateUiGate"));
assert("config saveEnabled from armed", config.includes("saveEnabled = armed"));
assert("guards protected legacy ids", guards.includes(PROTECTED_014) && guards.includes(PROTECTED_001));

assert("guards buildG22fUnpublishUpdatePayload", guards.includes("buildG22fUnpublishUpdatePayload"));
assert("guards assert payload only", guards.includes("assertG22fUnpublishUpdatePayloadOnly"));
assert("guards collect failures", guards.includes("collectG22fUnpublishUpdateGuardFailures"));
assert("guards published false only", guards.includes("published: false"));
assert("guards no updated_at in patch", guards.includes("must not include updated_at"));
assert("guards wouldDelete false", guards.includes("wouldDelete must be false"));
assert("guards physicalDelete false", guards.includes("physicalDelete must be false"));
assert("guards protected 014", guards.includes(PROTECTED_014));
assert("guards protected 001", guards.includes(PROTECTED_001));
assert("guards no insert", !guards.includes(".insert("));

assert("save executeG22fScheduleUnpublishUpdateSave", save.includes("executeG22fScheduleUnpublishUpdateSave"));
assert("save operation unpublish-update", save.includes('"unpublish-update"'));
assert("save uses updateScheduleWrite", save.includes("updateScheduleWrite"));
assert("save uses buildScheduleLockedWriteRequest", save.includes("buildScheduleLockedWriteRequest"));
assert("save expectedBeforeUpdatedAt", save.includes("expectedBeforeUpdatedAt"));
assert("save wouldDelete false", save.includes("wouldDelete: false"));
assert("save physicalDelete false", save.includes("physicalDelete: false"));
assert("save no delete call", !save.includes(".delete("));
assert("save no insert call", !save.includes(".insert("));

assert("g22f dry-run actualWrite false", g22fDry.includes("actualWrite: false"));
assert("g22f dry-run saveAllowed false", g22fDry.includes("saveAllowed: false"));
assert("g22f dry-run no update call", !g22fDry.includes(".update("));

assert("g22d config mutual exclusion G-22f", g22dConfig.includes("G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED"));
assert("g22e config mutual exclusion G-22f", g22eConfig.includes("G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED"));
assert("g22d save unchanged", g22dSave.includes("executeG22dScheduleDuplicateInsertSave"));
assert("g22e save unchanged", g22eSave.includes("executeG22eScheduleNewEventInsertSave"));
assert("g9k save unchanged no unpublish", !g9kSave.includes("executeG22fScheduleUnpublishUpdateSave"));
assert("g9k save path preserved", g9kSave.includes("executeG9kExistingEventSaveButtonSave"));

assert("operator evaluateG22fUnpublishUpdateUiGate", operatorUi.includes("evaluateG22fUnpublishUpdateUiGate"));
assert("operator executeG22f save", operatorUi.includes("executeG22fScheduleUnpublishUpdateSave"));
assert("operator unpublish save label disabled", operatorUi.includes("非公開化を保存（現在は無効）"));
assert("operator unpublish save label armed", operatorUi.includes("非公開化を保存"));
assert("operator g9k path preserved", operatorUi.includes("executeG9kExistingEventSaveButtonSave"));
assert("operator g22d path preserved", operatorUi.includes("executeG22dScheduleDuplicateInsertSave"));
assert("operator g22e path preserved", operatorUi.includes("executeG22eScheduleNewEventInsertSave"));
assert("operator dev details update approvalId", operatorUi.includes("unpublish update approvalId"));
assert("operator dev details G-22f env arm", operatorUi.includes("G-22f env arm"));
assert("operator dev details expectedBeforeUpdatedAt", operatorUi.includes("expectedBeforeUpdatedAt"));
assert("operator dev details protected rows", operatorUi.includes("non-touch"));

assert("schedule ui delete disabled", scheduleUi.includes('id="gosaki-schedule-delete-btn"') && scheduleUi.includes("disabled"));
assert("schedule ui delete 準備中", scheduleUi.includes("削除（準備中）"));
assert("update trigger buildScheduleLockedWriteRequest", updateTrigger.includes("buildScheduleLockedWriteRequest"));

for (const rel of [CONFIG, GUARDS, SAVE, OPERATOR_UI, WRITE_TYPES]) {
  assert(`no prod ref in ${path.basename(rel)}`, !read(rel).includes(PROD_REF));
}
assert(
  "doc prod ref only as never/stop",
  doc.includes(PROD_REF) && /Never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

const moduleGuard = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { getG22fUnpublishUpdateConfig } from './src/lib/admin/staging-write/gosaki-schedule-unpublish-update-config.ts';
import {
  buildG22fUnpublishUpdatePayload,
  assertG22fUnpublishUpdatePayloadOnly,
  collectG22fUnpublishUpdateGuardFailures,
} from './src/lib/admin/staging-write/gosaki-schedule-unpublish-update-guards.ts';

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

const config = getG22fUnpublishUpdateConfig(env);
const payload = buildG22fUnpublishUpdatePayload();
assertG22fUnpublishUpdatePayloadOnly(payload);

const target = {
  id: 'sample-id',
  legacy_id: 'schedule-2026-07-001',
  site_slug: 'gosaki-piano',
  published: true,
  updated_at: '2026-07-01T00:00:00+00:00',
  date: '2026-07-15',
  title: 'test',
};

const failures = collectG22fUnpublishUpdateGuardFailures({
  unpublishMode: true,
  target,
  unpublishDryRunOk: true,
  unpublishDryRunOperation: 'unpublish',
  wouldUpdate: true,
  wouldDelete: false,
  physicalDelete: false,
  beforePublished: true,
  afterPublished: false,
  env,
});

const blocked = collectG22fUnpublishUpdateGuardFailures({
  unpublishMode: true,
  target: { ...target, legacy_id: '${PROTECTED_014}', published: false },
  unpublishDryRunOk: true,
  env,
});

if (
  config.saveEnabled ||
  config.saveAllowed ||
  failures.length === 0 ||
  blocked.length === 0 ||
  Object.keys(payload).length !== 1 ||
  payload.published !== false
) {
  console.error(JSON.stringify({ config, payload, failures, blocked }));
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

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("00-current-state mentions G-22f3", currentState.includes("G-22f3"));
assert("03-next-actions mentions G-22f3", nextActions.includes("G-22f3"));
assert("handoff mentions G-22f3", handoff.includes("G-22f3"));
assert("03-next-actions G-22f4 next", nextActions.includes("G-22f4"));
assert("handoff G-22f4 next", handoff.includes("G-22f4"));

console.log(
  `\nG-22f3 Gosaki Schedule unpublish UPDATE implementation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
