/**
 * G-14b1a — Gosaki routine edit practical Save enablement implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g14b1a-gosaki-schedule-routine-edit-practical-save-enablement-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const IMPL_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-practical-save-enablement-implementation.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-routine-edit-flow-next-poc-planning.md";
const G14B1A_MODULE_REL =
  "src/lib/admin/staging-write/gosaki-schedule-routine-edit-practical-save-enablement-config.ts";
const G9K_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-config.ts";
const PAGE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-save-button-page-config.ts";
const G9K_SAVE_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const G9K_GUARDS_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-guards.ts";
const G13C1_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-a-poc-cleanup-config.ts";
const G13C2_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-event-b-poc-cleanup-config.ts";
const G9J_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-update-config.ts";
const OPERATOR_PAGE_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

const PRACTICAL_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED";
const LEGACY_G9K_ARM = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";
const G9K_APPROVAL = "G-9k-gosaki-schedule-existing-event-save-button-non-dry-run";
const OPT_LOCK_ENV = "PUBLIC_ADMIN_SCHEDULE_OPTIMISTIC_LOCK";
const STAGING_HOST = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh";
const EVENT_A_ID = "f687ebf3-407c-49d0-9ab8-58040c499b8e";
const EVENT_B_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";

const SAFE_FIELDS = [
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

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

const implDoc = read(IMPL_DOC_REL);
const g14b1a = read(G14B1A_MODULE_REL);
const g9kConfig = read(G9K_CONFIG_REL);
const pageConfig = read(PAGE_CONFIG_REL);
const g13c1 = read(G13C1_CONFIG_REL);
const g13c2 = read(G13C2_CONFIG_REL);
const g9j = read(G9J_CONFIG_REL);
const operatorPage = read(OPERATOR_PAGE_REL);

assert("G-14b1a implementation doc exists", exists(IMPL_DOC_REL));
assert(
  "impl doc phase G-14b1a",
  implDoc.includes("G-14b1a-gosaki-schedule-routine-edit-practical-save-enablement-implementation"),
);
assert(
  "impl doc complete gate",
  implDoc.includes("gosakiScheduleRoutineEditPracticalSaveEnablementImplementationComplete: true"),
);
assert("impl doc readyForG14b1b", implDoc.includes("readyForG14b1bLocalDryRunPreflight: true"));
assert("impl doc readyForAnyDbWrite false", implDoc.includes("readyForAnyDbWrite: false"));
assert("impl doc practical arm env", implDoc.includes(PRACTICAL_ARM));
assert("impl doc optimistic lock", implDoc.includes(`${OPT_LOCK_ENV}=true`));
assert("impl doc no hardcoded PoC values", implDoc.includes("No hardcoded"));
assert("impl doc G-13 unchanged panels", implDoc.includes("not modified"));
assert("impl doc staging host", implDoc.includes(STAGING_HOST));
assert("impl doc production stop", implDoc.includes(PRODUCTION_HOST));

assert("G-14b1a module exists", exists(G14B1A_MODULE_REL));
assert("module practical arm constant", g14b1a.includes(PRACTICAL_ARM));
assert("module collectG14b1aRoutineEditArmFailures", g14b1a.includes("collectG14b1aRoutineEditArmFailures"));
assert("module collectG14b1aPracticalEditArmOffFailures", g14b1a.includes("collectG14b1aPracticalEditArmOffFailures"));
assert("module single-arm policy", g14b1a.includes("only one routine edit arm"));
assert("module optimistic lock check", g14b1a.includes("getScheduleOptimisticLockConfig"));
assert(
  "module no hardcoded event ids",
  !g14b1a.includes(EVENT_A_ID) && !g14b1a.includes(EVENT_B_ID),
);
assert(
  "module no audit marker strings",
  !g14b1a.includes("[CMS Kit staging]") && !g14b1a.includes("[G-14b1 routine PoC]"),
);

assert("G-9k config imports G-14b1a", g9kConfig.includes("gosaki-schedule-routine-edit-practical-save-enablement-config"));
assert("G-9k config uses collectG14b1aRoutineEditArmFailures", g9kConfig.includes("collectG14b1aRoutineEditArmFailures"));
assert("G-9k config practicalEditArmed field", g9kConfig.includes("practicalEditArmed"));
assert("G-9k config routineEditArmSatisfied field", g9kConfig.includes("routineEditArmSatisfied"));
assert("G-9k compile gate still false default", g9kConfig.includes("G9K_SAVE_BUTTON_SAVE_ENABLED = false"));
assert("G-9k config still blocks G-13c1 arm", g9kConfig.includes("collectG13c1EventAPocCleanupArmOffFailures"));
assert("G-9k config still blocks G-13c2 arm", g9kConfig.includes("collectG13c2EventBPocCleanupArmOffFailures"));

assert("page config practical arm bridge", pageConfig.includes("practicalEditEnvArmArmed"));
assert("page config legacy arm bridge", pageConfig.includes("legacyG9kEnvArmArmed"));
assert("page config optimistic lock bridge", pageConfig.includes("optimisticLockEnabled"));
assert(
  "page config applies practical arm env",
  pageConfig.includes("GOSAKI_SCHEDULE_PRACTICAL_EDIT_NON_DRY_RUN_ARMED_ENV"),
);

assert("operator page practical data attr", operatorPage.includes("data-g9k-practical-edit-env-arm-armed"));
assert("operator page legacy data attr", operatorPage.includes("data-g9k-legacy-env-arm-armed"));
assert("operator page optimistic lock data attr", operatorPage.includes("data-g9k-optimistic-lock-enabled"));
assert("G-13c1 panel still present", operatorPage.includes("gosaki-schedule-g13c1-event-a-poc-cleanup"));
assert("G-13c2 panel still present", operatorPage.includes("gosaki-schedule-g13c2-event-b-poc-cleanup"));

assert("G-13c1 blocks practical arm", g13c1.includes("collectG14b1aPracticalEditArmOffFailures"));
assert("G-13c2 blocks practical arm", g13c2.includes("collectG14b1aPracticalEditArmOffFailures"));
assert("G-9j blocks practical arm", g9j.includes("collectG14b1aPracticalEditArmOffFailures"));
assert("G-13c1 target row unchanged", g13c1.includes(EVENT_A_ID));
assert("G-13c2 target row unchanged", g13c2.includes(EVENT_B_ID));

assert("G-9k save module exists", exists(G9K_SAVE_REL));
assert("G-9k guards exist", exists(G9K_GUARDS_REL));
assert("save uses getG9kExistingEventSaveButtonConfig", read(G9K_SAVE_REL).includes("getG9kExistingEventSaveButtonConfig"));

const g9kGuards = read(G9K_GUARDS_REL);
assert("guards reuse G9J safe fields", g9kGuards.includes("G9J_EXISTING_EVENT_UPDATE_SAFE_FIELDS"));
assert("guards G9K safe fields alias", g9kGuards.includes("G9K_EXISTING_EVENT_SAVE_BUTTON_SAFE_FIELDS"));

for (const field of SAFE_FIELDS) {
  assert(`plan doc safe field ${field}`, read(PLAN_DOC_REL).includes(field));
}

assert("plan doc exists", exists(PLAN_DOC_REL));
assert("plan recommends practical arm", read(PLAN_DOC_REL).includes(PRACTICAL_ARM));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

console.log(`\nG-14b1a implementation verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
