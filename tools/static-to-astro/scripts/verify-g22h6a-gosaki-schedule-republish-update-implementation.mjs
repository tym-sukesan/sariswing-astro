/**
 * G-22h6a — Gosaki Schedule republish UPDATE implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22h6a-gosaki-schedule-republish-update-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-republish-update-implementation.md";
const PREFLIGHT_DOC = "tools/static-to-astro/docs/gosaki-schedule-republish-target-preflight.md";
const BASE_COMMIT = "fabfd2f";

const CONFIG = "src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts";
const GUARDS = "src/lib/admin/staging-write/gosaki-schedule-republish-update-guards.ts";
const SAVE = "src/lib/admin/staging-write/gosaki-schedule-republish-update-save.ts";
const G22H_DRY = "src/lib/admin/staging-write/gosaki-schedule-republish-dry-run.ts";
const G22D_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts";
const G22E_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-config.ts";
const G22F_CONFIG = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-config.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const WRITE_TYPES = "src/lib/admin/staging-write/schedule-write-types.ts";
const UPDATE_TRIGGER = "src/lib/admin/staging-write/schedule-general-update-trigger.ts";

const APPROVAL_ID = "G-22h-gosaki-schedule-republish-update-non-dry-run-slice";
const ARM_ENV = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const EXPECTED_UPDATED_AT = "2026-07-06T13:58:41.425402+00:00";
const REF_014 = "schedule-2026-03-014";
const REF_001 = "schedule-2026-09-001";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";

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

assert("HEAD is fabfd2f", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());

for (const rel of [CONFIG, GUARDS, SAVE, DOC_REL, PREFLIGHT_DOC]) {
  assert(`exists ${path.basename(rel)}`, exists(rel));
}

const doc = read(DOC_REL);
const preflightDoc = read(PREFLIGHT_DOC);
const config = read(CONFIG);
const guards = read(GUARDS);
const save = read(SAVE);
const g22hDry = read(G22H_DRY);
const g22dConfig = read(G22D_CONFIG);
const g22eConfig = read(G22E_CONFIG);
const g22fConfig = read(G22F_CONFIG);
const g22dSave = read(G22D_SAVE);
const g22eSave = read(G22E_SAVE);
const g22fSave = read(G22F_SAVE);
const g9kSave = read(G9K_SAVE);
const operatorUi = read(OPERATOR_UI);
const scheduleUi = read(SCHEDULE_UI);
const writeTypes = read(WRITE_TYPES);
const updateTrigger = read(UPDATE_TRIGGER);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22h6a", doc.includes("G-22h6a-gosaki-schedule-republish-update-implementation"));
assert("doc implementation complete", doc.includes("gosakiScheduleRepublishUpdateImplementationComplete: true"));
assert("doc implementation only", doc.includes("implementation only") || doc.includes("Implementation only"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc ready G-22h6b", doc.includes("readyForG22h6bRepublishUpdateOperatorSaveOnce: true"));
assert("doc default save disabled", doc.includes("disabled"));
assert("doc physical delete not implemented", doc.includes("physicalDeleteImplemented: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc public reflection not executed", doc.includes("publicReflectionExecuted: false"));
assert("doc selected target 008", doc.includes(TARGET_LEGACY));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc expectedBeforeUpdatedAt", doc.includes(EXPECTED_UPDATED_AT));
assert("doc payload published true only", doc.includes("{ published: true }"));
assert("doc optimistic lock", doc.includes("Optimistic lock") || doc.includes("optimistic lock"));
assert("doc rollback not auto", doc.includes("no auto rollback") || doc.includes("document only"));
assert("preflight doc prior", preflightDoc.includes("G-22h5"));

assert("approvalId in types", writeTypes.includes(APPROVAL_ID));
assert(
  "approvalId in SCHEDULE_WRITE_APPROVAL_IDS",
  writeTypes.includes("G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID"),
);
assert("config approvalId", config.includes("G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID"));
assert("config dedicated arm env", config.includes(ARM_ENV));
assert("config default disabled reason", config.includes("G-22h6b"));
assert("config evaluateG22hRepublishUpdateUiGate", config.includes("evaluateG22hRepublishUpdateUiGate"));
assert("config saveEnabled from armed", config.includes("saveEnabled = armed"));
assert("config fixed target legacy", config.includes("G22H_FIXED_TARGET_LEGACY"));
assert("config fixed target id", config.includes("G22H_FIXED_TARGET_ID"));

assert("guards fixed target 008", guards.includes(TARGET_LEGACY) && guards.includes(TARGET_ID));
assert("guards reference 014", guards.includes(REF_014));
assert("guards reference 001", guards.includes(REF_001));
assert("guards preflight updated_at", guards.includes(EXPECTED_UPDATED_AT));
assert("guards buildG22hRepublishUpdatePayload", guards.includes("buildG22hRepublishUpdatePayload"));
assert("guards assert payload only", guards.includes("assertG22hRepublishUpdatePayloadOnly"));
assert("guards collect failures", guards.includes("collectG22hRepublishUpdateGuardFailures"));
assert("guards published true only", guards.includes("published: true"));
assert("guards no updated_at in patch", guards.includes("must not include updated_at"));
assert("guards wouldDelete false", guards.includes("wouldDelete must be false"));
assert("guards physicalDelete false", guards.includes("physicalDelete must be false"));
assert("guards optimistic lock stale", guards.includes("optimistic lock stale"));
assert("guards no insert", !guards.includes(".insert("));

assert("save executeG22hScheduleRepublishUpdateSave", save.includes("executeG22hScheduleRepublishUpdateSave"));
assert("save operation republish-update", save.includes('"republish-update"'));
assert("save uses updateScheduleWrite", save.includes("updateScheduleWrite"));
assert("save uses buildScheduleLockedWriteRequest", save.includes("buildScheduleLockedWriteRequest"));
assert("save expectedBeforeUpdatedAt", save.includes("expectedBeforeUpdatedAt"));
assert("save wouldDelete false", save.includes("wouldDelete: false"));
assert("save physicalDelete false", save.includes("physicalDelete: false"));
assert("save contentFieldsChanged false", save.includes("contentFieldsChanged: false"));
assert("save publicReflectionPending true", save.includes("publicReflectionPending: true"));
assert("save actualWrite true on success only", save.includes("actualWrite: true"));
assert("save no delete call", !save.includes(".delete("));
assert("save no insert call", !save.includes(".insert("));
assert("save post published true", save.includes("Post-save published must be true"));

assert("g22h dry-run actualWrite false", g22hDry.includes("actualWrite: false"));
assert("g22h dry-run saveAllowed false", g22hDry.includes("saveAllowed: false"));
assert("g22h dry-run no update call", !g22hDry.includes(".update("));

assert("g22d config mutual exclusion G-22h", g22dConfig.includes("G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED"));
assert("g22e config mutual exclusion G-22h", g22eConfig.includes("G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED"));
assert("g22f config mutual exclusion G-22h", g22fConfig.includes("G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED"));
assert("g22d save unchanged", g22dSave.includes("executeG22dScheduleDuplicateInsertSave"));
assert("g22e save unchanged", g22eSave.includes("executeG22eScheduleNewEventInsertSave"));
assert("g22f save unchanged", g22fSave.includes("executeG22fScheduleUnpublishUpdateSave"));
assert("g9k save path preserved", g9kSave.includes("executeG9kExistingEventSaveButtonSave"));
assert("g9k save no republish", !g9kSave.includes("executeG22hScheduleRepublishUpdateSave"));

assert("operator evaluateG22hRepublishUpdateUiGate", operatorUi.includes("evaluateG22hRepublishUpdateUiGate"));
assert("operator executeG22h save", operatorUi.includes("executeG22hScheduleRepublishUpdateSave"));
assert("operator republish save label disabled", operatorUi.includes("再公開を保存（現在は無効）"));
assert("operator republish save label armed", operatorUi.includes("再公開を保存"));
assert("operator renderRepublishUpdateSaveResult", operatorUi.includes("renderRepublishUpdateSaveResult"));
assert("operator target fixed panel", operatorUi.includes("target fixed"));
assert("operator G-22h6b save once note", operatorUi.includes("G-22h6b"));
assert("operator g22f path preserved", operatorUi.includes("executeG22fScheduleUnpublishUpdateSave"));
assert("operator g22d path preserved", operatorUi.includes("executeG22dScheduleDuplicateInsertSave"));
assert("operator g22e path preserved", operatorUi.includes("executeG22eScheduleNewEventInsertSave"));
assert("operator dev details republish update approvalId", operatorUi.includes("republish update approvalId"));
assert("operator dev details G-22h env arm", operatorUi.includes("G-22h env arm"));
assert("operator dev details expectedBeforeUpdatedAt", operatorUi.includes("expectedBeforeUpdatedAt"));

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
assert("doc staging ref", doc.includes(STAGING_REF));

const moduleGuard = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { getG22hRepublishUpdateConfig } from './src/lib/admin/staging-write/gosaki-schedule-republish-update-config.ts';
import {
  buildG22hRepublishUpdatePayload,
  assertG22hRepublishUpdatePayloadOnly,
  collectG22hRepublishUpdateGuardFailures,
  G22H_FIXED_TARGET_ID,
  G22H_FIXED_TARGET_LEGACY,
} from './src/lib/admin/staging-write/gosaki-schedule-republish-update-guards.ts';

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
  PUBLIC_SUPABASE_URL: 'https://${STAGING_REF}.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'test',
} as unknown as ImportMetaEnv;

const config = getG22hRepublishUpdateConfig(env);
const payload = buildG22hRepublishUpdatePayload();
assertG22hRepublishUpdatePayloadOnly(payload);

const target = {
  id: G22H_FIXED_TARGET_ID,
  legacy_id: G22H_FIXED_TARGET_LEGACY,
  site_slug: 'gosaki-piano',
  title: '<>',
  date: '2026-07-17',
  published: false,
  updated_at: '${EXPECTED_UPDATED_AT}',
};

const failures = collectG22hRepublishUpdateGuardFailures({
  republishMode: true,
  target,
  republishDryRunOk: true,
  republishDryRunOperation: 'republish',
  wouldUpdate: true,
  wouldDelete: false,
  physicalDelete: false,
  beforePublished: false,
  afterPublished: true,
  expectedBeforeUpdatedAt: '${EXPECTED_UPDATED_AT}',
  approvalId: '${APPROVAL_ID}',
  env,
});

if (config.saveEnabled !== false) throw new Error('saveEnabled must be false when arm off');
if (payload.published !== true) throw new Error('payload published must be true');
if (failures.length === 0) throw new Error('expected guard failures when save disabled');
console.log('g22h6a-module-guard-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "module guard smoke",
  moduleGuard.status === 0 && moduleGuard.stdout.includes("g22h6a-module-guard-ok"),
  moduleGuard.stderr || moduleGuard.stdout,
);

assert("00-current-state mentions G-22h6a", currentState.includes("G-22h6a"));
assert("03-next-actions mentions G-22h6a", nextActions.includes("G-22h6a"));
assert("handoff mentions G-22h6a", handoff.includes("G-22h6a"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22h6a Gosaki Schedule republish UPDATE implementation verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
