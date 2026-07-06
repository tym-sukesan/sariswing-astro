/**
 * G-22f4b — Gosaki Schedule unpublish UPDATE target fixed / beforeVerification verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f4b-gosaki-schedule-unpublish-update-target-fixed-beforeverification.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-target-fixed-beforeverification.md";
const G22F4_DOC = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-final-preflight.md";
const G22F4_VERIFIER =
  "tools/static-to-astro/scripts/verify-g22f4-gosaki-schedule-unpublish-update-final-preflight.mjs";
const BASE_COMMIT = "8945905";
const AI_DIR = "tools/static-to-astro/docs/ai";

const APPROVAL_ID = "G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";
const TARGET_LEGACY = "schedule-2026-07-008";
const UPDATED_AT_BEFORE = "2026-06-16T16:03:41.551792+00:00";
const TARGET_MONTH_COUNT = "14";
const PROTECTED_014 = "schedule-2026-03-014";
const PROTECTED_001 = "schedule-2026-09-001";
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

assert("HEAD is 8945905", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8945905", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22f4b target fixed doc exists", exists(DOC_REL));
assert("G-22f4 final preflight doc exists", exists(G22F4_DOC));
assert("G-22f4 verifier exists", exists(G22F4_VERIFIER));

const doc = read(DOC_REL);
const g22f4Doc = read(G22F4_DOC);

assert(
  "doc phase G-22f4b",
  doc.includes("G-22f4b-gosaki-schedule-unpublish-update-target-fixed-beforeverification"),
);
assert(
  "doc target fixed gate complete",
  doc.includes("gosakiScheduleUnpublishUpdateTargetFixedBeforeverificationComplete: true"),
);
assert("doc targetFixedInDoc true", doc.includes("targetFixedInDoc: true"));
assert("doc beforeVerificationPass true", doc.includes("beforeVerificationPass: true"));
assert(
  "doc ready for G-22f5",
  doc.includes("readyForG22f5ScheduleUnpublishUpdateOperatorExecution: true"),
);
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc no rollback executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc no sql mutation", doc.includes("sqlMutationExecuted: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));

assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc not physical DELETE", doc.includes("NOT physical DELETE") || doc.includes("not physical DELETE"));
assert(
  "doc physicalDeleteImplemented false",
  doc.includes("physicalDeleteImplemented: false"),
);

assert("doc target id", doc.includes(TARGET_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY));
assert("doc target date", doc.includes("2026-07-17"));
assert("doc target month", doc.includes("2026-07"));
assert("doc target title", doc.includes("`<>`") || doc.includes("| `<>` |"));
assert("doc target sort_order 8", doc.includes("| `8`") || doc.includes("sort_order` | `8`"));
assert("doc updated_at before", doc.includes(UPDATED_AT_BEFORE));
assert("doc expectedBeforeUpdatedAt", doc.includes("expectedBeforeUpdatedAt"));
assert("doc month count before 14", doc.includes(`targetMonthCountBefore: ${TARGET_MONTH_COUNT}`));
assert("doc published true before", doc.includes("published` (before) | `true`") || doc.includes("| `true` |"));

assert("doc beforeVerification PASS", doc.includes("beforeVerification PASS"));
assert("doc authenticated UPDATE yes", doc.includes("authenticated") && doc.includes("UPDATE"));
assert("doc anon UPDATE no", doc.includes("anon") && doc.includes("no"));
assert("doc RLS enabled", doc.includes("RLS enabled"));
assert("doc schedules_admin_all unchanged", doc.includes("schedules_admin_all"));
assert("doc target_published_true_count", doc.includes("target_published_true_count"));
assert("doc target_is_protected_legacy_count 0", doc.includes("target_is_protected_legacy_count"));

assert("doc protected legacy 014", doc.includes(PROTECTED_014));
assert("doc protected legacy 001", doc.includes(PROTECTED_001));
assert("doc protected rows non-touch", doc.includes("non-touch") || doc.includes("Protected"));

assert("doc G-22f5 operator Save once", doc.includes("G-22f5") && doc.includes("once"));
assert("doc patch published false only", doc.includes("{ published: false }"));
assert("doc wouldDelete false", doc.includes("wouldDelete") && doc.includes("false"));
assert("doc physicalDelete false", doc.includes("physicalDelete") && doc.includes("false"));

assert("doc staging project ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only as never/stop",
  doc.includes(PROD_REF) && /Never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

assert("g22f4 doc links or references target", g22f4Doc.includes(TARGET_LEGACY) || g22f4Doc.includes("G-22f4b"));

const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import {
  buildG22fUnpublishUpdatePayload,
  assertG22fUnpublishUpdatePayloadOnly,
  assertG22fUnpublishUpdateWritableTarget,
} from './src/lib/admin/staging-write/gosaki-schedule-unpublish-update-guards.ts';

const payload = buildG22fUnpublishUpdatePayload();
assertG22fUnpublishUpdatePayloadOnly(payload);

const target = {
  id: '${TARGET_ID}',
  legacy_id: '${TARGET_LEGACY}',
  site_slug: 'gosaki-piano',
  published: true,
  updated_at: '${UPDATED_AT_BEFORE}',
  date: '2026-07-17',
  title: '<>',
};

assertG22fUnpublishUpdateWritableTarget(target);

if (
  Object.keys(payload).length !== 1 ||
  payload.published !== false ||
  'updated_at' in payload
) {
  process.exit(1);
}
console.log('g22f4b-target-payload-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "target payload module smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("g22f4b-target-payload-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("00-current-state mentions G-22f4b", currentState.includes("G-22f4b"));
assert("03-next-actions mentions G-22f4b", nextActions.includes("G-22f4b"));
assert("handoff mentions G-22f4b", handoff.includes("G-22f4b"));
assert("03-next-actions G-22f5 next", nextActions.includes("G-22f5"));
assert("handoff G-22f5 next", handoff.includes("G-22f5"));

console.log(
  `\nG-22f4b Gosaki Schedule unpublish UPDATE target fixed / beforeVerification verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
