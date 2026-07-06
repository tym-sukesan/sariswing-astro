/**
 * G-22f4 — Gosaki Schedule unpublish UPDATE final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22f4-gosaki-schedule-unpublish-update-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-final-preflight.md";
const G22F3_DOC = "tools/static-to-astro/docs/gosaki-schedule-unpublish-update-implementation.md";
const G22F3_VERIFIER =
  "tools/static-to-astro/scripts/verify-g22f3-gosaki-schedule-unpublish-update-implementation.mjs";
const BASE_COMMIT = "953be40";
const AI_DIR = "tools/static-to-astro/docs/ai";

const APPROVAL_ID = "G-22f-gosaki-schedule-unpublish-update-non-dry-run-slice";
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

assert("HEAD is 953be40", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 953be40", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("G-22f4 final preflight doc exists", exists(DOC_REL));
assert("G-22f3 implementation doc exists", exists(G22F3_DOC));
assert("G-22f3 verifier exists", exists(G22F3_VERIFIER));

const doc = read(DOC_REL);
const g22f3Doc = read(G22F3_DOC);

assert("doc phase G-22f4", doc.includes("G-22f4-gosaki-schedule-unpublish-update-final-preflight"));
assert(
  "doc final preflight gate complete",
  doc.includes("gosakiScheduleUnpublishUpdateFinalPreflightComplete: true"),
);
assert(
  "doc ready for G-22f5",
  doc.includes("readyForG22f5ScheduleUnpublishUpdateOperatorExecution: true"),
);
assert("doc no save executed", doc.includes("saveExecuted: false"));
assert("doc no db write", doc.includes("dbWriteExecuted: false"));
assert("doc no rollback executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc no sql mutation", doc.includes("sqlMutationExecuted: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));

assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc not physical DELETE", doc.includes("NOT physical DELETE") || doc.includes("not physical DELETE"));
assert(
  "doc physicalDeleteImplemented false",
  doc.includes("physicalDeleteImplemented: false"),
);
assert(
  "doc cursor must not auto-select target",
  doc.includes("Must not") &&
    (doc.includes("auto-fix target") || doc.includes("auto-select") || doc.includes("does **not** auto-select")),
);
assert("doc target pending", doc.includes("pending") && doc.includes(":target_id"));
assert("doc published=true candidates", doc.includes("published = true"));

assert("doc candidate list SQL", doc.includes("Candidate list SQL"));
assert("doc beforeVerification SQL", doc.includes("beforeVerification"));
assert("doc afterVerification SQL", doc.includes("afterVerification"));
assert("doc rollback SQL", doc.includes("rollback"));
assert(
  "doc rollback execution forbidden",
  doc.includes("rollback execution forbidden") ||
    doc.includes("DO NOT EXECUTE IN G-22f4") ||
    doc.includes("DO NOT EXECUTE in G-22f4"),
);
assert("doc rollback not executed G-22f4", doc.includes("not executed in G-22f4") || doc.includes("Not executed in G-22f4"));

assert("doc staging project ref", doc.includes(STAGING_REF));
assert("doc protected legacy 014", doc.includes(PROTECTED_014));
assert("doc protected legacy 001", doc.includes(PROTECTED_001));
assert("doc G-22f5 operator Save once", doc.includes("G-22f5") && doc.includes("once"));

assert("doc grants check", doc.includes("information_schema.role_table_grants"));
assert("doc RLS check", doc.includes("relrowsecurity"));
assert("doc schedules_admin_all", doc.includes("schedules_admin_all"));
assert("doc target_id_count", doc.includes("target_id_count"));
assert("doc target_legacy_id_count", doc.includes("target_legacy_id_count"));
assert("doc target_month_count", doc.includes("target_month_count"));
assert("doc expectedBeforeUpdatedAt", doc.includes("expectedBeforeUpdatedAt"));
assert("doc wouldDelete false", doc.includes("wouldDelete") && doc.includes("false"));
assert("doc physicalDelete false", doc.includes("physicalDelete") && doc.includes("false"));

assert(
  "doc prod ref only as never/stop",
  doc.includes(PROD_REF) && /Never.*vsbvndwuajjhnzpohghh/i.test(doc),
);
assert("g22f3 doc exists prior", g22f3Doc.includes("G-22f3-gosaki-schedule-unpublish-update-implementation"));

const moduleSmoke = spawnSync(
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
  assertG22fUnpublishUpdateWritableTarget,
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
  PUBLIC_SUPABASE_URL: 'https://${STAGING_REF}.supabase.co',
  PUBLIC_SUPABASE_ANON_KEY: 'test',
} as unknown as ImportMetaEnv;

const config = getG22fUnpublishUpdateConfig(env);
const payload = buildG22fUnpublishUpdatePayload();
assertG22fUnpublishUpdatePayloadOnly(payload);

const target = {
  id: 'sample-published-target-id',
  legacy_id: 'schedule-2026-07-001',
  site_slug: 'gosaki-piano',
  published: true,
  updated_at: '2026-07-01T00:00:00+00:00',
  date: '2026-07-15',
  title: 'published test row',
};

assertG22fUnpublishUpdateWritableTarget(target);

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

const protectedBlocked = collectG22fUnpublishUpdateGuardFailures({
  unpublishMode: true,
  target: { ...target, legacy_id: '${PROTECTED_014}', published: false },
  unpublishDryRunOk: true,
  env,
});

const alreadyUnpublished = collectG22fUnpublishUpdateGuardFailures({
  unpublishMode: true,
  target: { ...target, published: false },
  unpublishDryRunOk: true,
  env,
});

if (
  config.saveEnabled ||
  Object.keys(payload).length !== 1 ||
  payload.published !== false ||
  'updated_at' in payload ||
  failures.length === 0 ||
  protectedBlocked.length === 0 ||
  alreadyUnpublished.length === 0
) {
  console.error(JSON.stringify({ config, payload, failures, protectedBlocked, alreadyUnpublished }));
  process.exit(1);
}
console.log('unpublish-update-preflight-smoke-ok');
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "unpublish UPDATE payload module smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("unpublish-update-preflight-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("00-current-state mentions G-22f4", currentState.includes("G-22f4"));
assert("03-next-actions mentions G-22f4", nextActions.includes("G-22f4"));
assert("handoff mentions G-22f4", handoff.includes("G-22f4"));
assert("03-next-actions G-22f5 next", nextActions.includes("G-22f5"));
assert("handoff G-22f5 next", handoff.includes("G-22f5"));

console.log(
  `\nG-22f4 Gosaki Schedule unpublish UPDATE final preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
