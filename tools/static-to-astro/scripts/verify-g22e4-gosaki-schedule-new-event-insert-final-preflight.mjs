/**
 * G-22e4 — Gosaki Schedule new event INSERT final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22e4-gosaki-schedule-new-event-insert-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-final-preflight.md";
const G22E3_DOC = "tools/static-to-astro/docs/gosaki-schedule-new-event-insert-implementation.md";
const G22E3_VERIFIER =
  "tools/static-to-astro/scripts/verify-g22e3-gosaki-schedule-new-event-insert-implementation.mjs";
const BASE_COMMIT = "e566855";

const TARGET_DATE = "2026-09-12";
const TARGET_TITLE = "【G-22eテスト】新規追加テストイベント";
const TARGET_VENUE = "テスト会場";
const TARGET_OPEN = "18:30";
const TARGET_START = "19:30";
const TARGET_PRICE = "3,500円";
const TARGET_DESC_PREFIX = "CMS新規追加機能の動作確認用テストイベントです";
const APPROVAL_ID = "G-22e-gosaki-schedule-new-event-insert-non-dry-run-slice";
const PROTECTED_LEGACY = "schedule-2026-03-014";
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

assert("HEAD is e566855", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is e566855", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22e4 final preflight doc exists", exists(DOC_REL));
assert("G-22e3 implementation doc exists", exists(G22E3_DOC));
assert("G-22e3 verifier exists", exists(G22E3_VERIFIER));

const doc = read(DOC_REL);
const g22e3Doc = read(G22E3_DOC);

assert("doc phase G-22e4", doc.includes("G-22e4-gosaki-schedule-new-event-insert-final-preflight"));
assert(
  "doc final preflight gate complete",
  doc.includes("gosakiScheduleNewEventInsertFinalPreflightComplete: true"),
);
assert("doc ready for G-22e5", doc.includes("readyForG22e5ScheduleNewEventInsertOperatorExecution: true"));
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc no rollback executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc no sql mutation", doc.includes("sqlMutationExecuted: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));

assert("doc test event", doc.includes("test event") || doc.includes("テスト"));
assert("doc target date", doc.includes(TARGET_DATE));
assert("doc target title", doc.includes(TARGET_TITLE));
assert("doc target venue", doc.includes(TARGET_VENUE));
assert("doc target open_time", doc.includes(TARGET_OPEN));
assert("doc target start_time", doc.includes(TARGET_START));
assert("doc target price", doc.includes(TARGET_PRICE));
assert("doc target description", doc.includes(TARGET_DESC_PREFIX));
assert("doc approvalId", doc.includes(APPROVAL_ID));

assert("doc year 2026", doc.includes("| `year` | `2026`"));
assert("doc month 2026-09", doc.includes("2026-09"));
assert("doc source_route", doc.includes("/schedule/2026-09/"));
assert("doc source_file", doc.includes("schedule-2026-09.html"));
assert("doc published false", doc.includes("published") && doc.includes("false"));
assert("doc public reflection not required", doc.includes("public reflection") || doc.includes("Public reflection"));

assert("doc pending legacy_id", doc.includes("pending") && doc.includes("legacy_id"));
assert("doc pending sort_order", doc.includes("pending") && doc.includes("sort_order"));

assert("doc beforeVerification SQL", doc.includes("beforeVerification"));
assert("doc afterVerification SQL", doc.includes("afterVerification"));
assert("doc rollback SQL", doc.includes("rollback"));
assert(
  "doc rollback execution forbidden",
  doc.includes("rollback execution forbidden") || doc.includes("rollback execution forbidden"),
);
assert("doc rollback not executed G-22e4", doc.includes("not executed in G-22e4"));

assert("doc staging project ref", doc.includes(STAGING_REF));
assert("doc protected duplicate legacy", doc.includes(PROTECTED_LEGACY));
assert("doc G-22e5 operator Save once", doc.includes("G-22e5") && doc.includes("once"));

assert("doc grants check", doc.includes("information_schema.role_table_grants"));
assert("doc RLS check", doc.includes("relrowsecurity"));
assert("doc schedules_admin_all", doc.includes("schedules_admin_all"));
assert("doc target legacy_id count", doc.includes("target_legacy_id_count"));
assert("doc max_suffix", doc.includes("max_suffix"));
assert("doc target_month_max_sort_order", doc.includes("target_month_max_sort_order"));

assert("doc no prod ref", !doc.includes(PROD_REF));
assert("g22e3 doc exists prior", g22e3Doc.includes("G-22e3-gosaki-schedule-new-event-insert-implementation"));

const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { executeG22eScheduleNewEventDryRun } from './src/lib/admin/staging-write/gosaki-schedule-new-event-dry-run.ts';
import { deriveG22eSourceRoute, deriveG22eSourceFile } from './src/lib/admin/staging-write/gosaki-schedule-new-event-insert-guards.ts';

const formValues = {
  title: '${TARGET_TITLE}',
  venue: '${TARGET_VENUE}',
  open_time: '${TARGET_OPEN}',
  start_time: '${TARGET_START}',
  price: '${TARGET_PRICE}',
  description: '${TARGET_DESC_PREFIX}。公開サイトには反映しません。検証後は非公開維持または削除対象とします。',
};

const dryRun = executeG22eScheduleNewEventDryRun({
  formValues,
  date: '${TARGET_DATE}',
  published: false,
  signedIn: true,
  supabaseUrl: 'https://${STAGING_REF}.supabase.co',
});

const month = '2026-09';
const checks = [
  dryRun.operation === 'new',
  dryRun.dryRun === true,
  dryRun.actualWrite === false,
  dryRun.saveAllowed === false,
  dryRun.wouldInsert === true,
  dryRun.payload.site_slug === 'gosaki-piano',
  dryRun.payload.published === false,
  dryRun.derivedPreview?.recalculatedMonth === month,
  deriveG22eSourceRoute(month) === '/schedule/2026-09/',
  deriveG22eSourceFile(month) === 'schedule-2026-09.html',
];

if (!checks.every(Boolean)) {
  console.error(JSON.stringify({ dryRun, checks }));
  process.exit(1);
}
console.log('target-dry-run-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "target dry-run module smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("target-dry-run-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

console.log(
  `\nG-22e4 Gosaki Schedule new event INSERT final preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
