/**
 * G-22d2 — Gosaki Schedule duplicate INSERT final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d2-gosaki-schedule-duplicate-insert-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-final-preflight.md";
const G22D1_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-implementation.md";
const G22D1_VERIFIER =
  "tools/static-to-astro/scripts/verify-g22d1-gosaki-schedule-duplicate-insert-implementation.mjs";
const BEFOREVERIF_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-beforeverification.md";
const BASE_COMMIT = "428ed61";

const CONFIG = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts";
const GUARDS = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-guards.ts";
const SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const INSERT_ADAPTER = "src/lib/admin/staging-write/schedule-insert-write-adapter.ts";
const G22B = "src/lib/admin/staging-write/gosaki-schedule-duplicate-dry-run.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const OPERATOR_UI = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";
const SCHEDULE_UI =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";

const APPROVAL_ID = "G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice";
const ARM_ENV = "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED";
const SOURCE_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const SOURCE_LEGACY = "schedule-2026-03-003";
const PLANNED_LEGACY = "schedule-2026-03-014";
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
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 428ed61", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 428ed61", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22d2 final preflight doc exists", exists(DOC_REL));
assert("G-22d1 implementation doc exists", exists(G22D1_DOC_REL));
assert("G-22d1 verifier exists", exists(G22D1_VERIFIER));

assert("G-22d3a beforeVerification doc exists", exists(BEFOREVERIF_DOC));

const doc = read(DOC_REL);
const g22d1Doc = read(G22D1_DOC_REL);
const beforeVerifDoc = read(BEFOREVERIF_DOC);
const config = read(CONFIG);
const guards = read(GUARDS);
const save = read(SAVE);
const insertAdapter = read(INSERT_ADAPTER);
const g22b = read(G22B);
const writeAdapter = read(WRITE_ADAPTER);
const g9kSave = read(G9K_SAVE);
const operatorUi = read(OPERATOR_UI);
const scheduleUi = read(SCHEDULE_UI);

assert("doc phase G-22d2", doc.includes("G-22d2-gosaki-schedule-duplicate-insert-final-preflight"));
assert("doc final preflight gate complete", doc.includes("gosakiScheduleDuplicateInsertFinalPreflightComplete: true"));
assert("doc ready for G-22d3", doc.includes("readyForG22d3DuplicateInsertOperatorExecution: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc no rollback executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc fix not required", doc.includes("Fix required?") && doc.includes("**No.**"));

assert("doc beforeVerification SQL", doc.includes("beforeVerification"));
assert("doc afterVerification SQL", doc.includes("afterVerification"));
assert("doc rollback SQL", doc.includes("rollback"));
assert("doc STOP conditions", doc.includes("STOP"));
assert("doc G-22d3 procedure", doc.includes("G-22d3"));
assert("doc env stack", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc dry run false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc G-22d arm", doc.includes(ARM_ENV));

assert("doc source id", doc.includes(SOURCE_ID));
assert("doc source legacy", doc.includes(SOURCE_LEGACY));
assert("doc planned legacy", doc.includes(PLANNED_LEGACY));
assert("doc copy title", doc.includes("<Live & Session>（コピー）"));
assert("doc venue", doc.includes("学芸大学 珈琲美学"));
assert("doc sort_order 70", doc.includes("sort_order") && doc.includes("| `70`"));
assert("doc source_file schedule-2026-03", doc.includes("schedule-2026-03.html"));
assert("doc max sort_order 60 baseline", doc.includes("max_sort_order = 60"));
assert("doc no stale insert sort_order 140", !doc.match(/\| `sort_order` \| `140`/));
assert("doc no stale source_file 2026-03.html slice", !doc.includes("| `source_file` | `2026-03.html` |"));
assert("doc published false", doc.includes("published") && doc.includes("false"));
assert("doc march count 14", doc.includes("march_count = 14"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod ref", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc base commit 428ed61 or drift note", doc.includes("G-22d2b") || doc.includes(BASE_COMMIT));
assert("beforeVerif check 07 max 60", beforeVerifDoc.includes("07_march_max_sort_order_60"));
assert("beforeVerif source_file schedule-2026-03", beforeVerifDoc.includes("'schedule-2026-03.html'"));
assert("beforeVerif insert sort_order 70", beforeVerifDoc.includes("sort_order=70"));
assert("config sort_order 70", config.includes("G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER = 70"));
assert("doc approvalId", doc.includes(APPROVAL_ID));

assert("G-22d1 doc prior", g22d1Doc.includes("G-22d1-gosaki-schedule-duplicate-insert-implementation"));

assert("g22d1 config present", config.includes("G22D_DUPLICATE_INSERT_SOURCE_ID"));
assert("g22d1 guards payload", guards.includes("buildG22dDuplicateInsertPayload"));
assert("g22d1 insert adapter", insertAdapter.includes("insertScheduleWrite"));
assert("g22d1 save wrapper", save.includes("executeG22dScheduleDuplicateInsertSave"));
assert("write adapter no insert", !writeAdapter.includes(".insert("));
assert("g9k save no insert adapter", !g9kSave.includes("insertScheduleWrite"));
assert("g22b dry-run only", g22b.includes("actualWrite: false") && !g22b.includes(".insert("));
assert("operator duplicate gate", operatorUi.includes("evaluateG22dDuplicateInsertUiGate"));
assert("operator default disabled label", operatorUi.includes("複製案を保存（現在は無効）"));
assert("schedule add delete disabled", scheduleUi.includes('id="gosaki-schedule-add-btn"') && scheduleUi.includes("disabled"));

const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { getG22dDuplicateInsertConfig } from './src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-config.ts';

const env = {
  DEV: true,
  ENABLE_ADMIN_STAGING_SHELL: 'true',
  ENABLE_ADMIN_STAGING_WRITE: 'false',
  PUBLIC_ADMIN_WRITE_DRY_RUN: 'true',
  PUBLIC_SUPABASE_URL: 'https://${STAGING_REF}.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'test',
} as unknown as ImportMetaEnv;

const config = getG22dDuplicateInsertConfig(env);
if (config.saveEnabled) process.exit(1);
console.log('default-disabled-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "default env save disabled smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("default-disabled-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

for (const rel of [CONFIG, GUARDS, SAVE, INSERT_ADAPTER]) {
  assert(`no prod ref in ${path.basename(rel)}`, !read(rel).includes(PROD_REF));
}
assert(
  "doc mentions prod ref only as never",
  doc.includes(PROD_REF) && /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

console.log(`\nG-22d2 Gosaki Schedule duplicate INSERT final preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
