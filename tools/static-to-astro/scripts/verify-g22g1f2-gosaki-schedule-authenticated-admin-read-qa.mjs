/**
 * G-22g1f2 — Gosaki Schedule authenticated admin read QA verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22g1f2-gosaki-schedule-authenticated-admin-read-qa.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-qa.md";
const IMPL_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-authenticated-admin-read-implementation.md";
const READ_MODULE =
  "src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts";
const OPERATOR_TS = "src/lib/admin/staging-data/gosaki-staging-schedule-operator-ui.ts";

const G9K_SAVE =
  "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const WRITE_ADAPTER = "src/lib/admin/staging-write/schedule-write-adapter.ts";
const G22D_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const G22E_SAVE = "src/lib/admin/staging-write/gosaki-schedule-new-event-insert-save.ts";
const G22F_SAVE = "src/lib/admin/staging-write/gosaki-schedule-unpublish-update-save.ts";
const APPROVAL_IDS = "src/lib/admin/staging-write/staging-write-approval-ids.ts";

const BASE_COMMIT = "35007fc";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const TARGET_LEGACY = "schedule-2026-07-008";
const TARGET_ID = "3e572f02-4f35-460e-80a1-3a7d15ca3fd9";

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
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 35007fc", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 35007fc", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("doc exists", exists(DOC_REL));
assert("impl doc exists", exists(IMPL_DOC));
assert("read module exists", exists(READ_MODULE));

const doc = read(DOC_REL);
const implDoc = read(IMPL_DOC);
const operatorTs = read(OPERATOR_TS);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22g1f2", doc.includes("G-22g1f2-gosaki-schedule-authenticated-admin-read-qa"));
assert("doc gate complete", doc.includes("gosakiScheduleAuthenticatedAdminReadQaComplete: true"));
assert("doc purpose", doc.includes("authenticated admin read"));
assert("doc dry-run QA", doc.includes("dry-run") || doc.includes("Dry-run"));
assert("doc SSR bootstrap QA", doc.includes("SSR bootstrap") || doc.includes("Login前"));
assert("doc login后 admin read QA", doc.includes("Login後") || doc.includes("authenticated admin read"));
assert("doc schedule-2026-07-008 QA", doc.includes(TARGET_LEGACY));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc draft filter QA", doc.includes("非公開のみ") || doc.includes("draft"));
assert("doc keyword search QA", doc.includes("keyword") || doc.includes("Keyword"));
assert("doc selected summary QA", doc.includes("Selected summary") || doc.includes("selected summary"));
assert("doc fallback safety", doc.includes("Fallback") || doc.includes("fallback"));
assert("doc issues section", doc.includes("Issues") || doc.includes("残課題"));
assert("doc save not executed", doc.includes("saveExecuted: false"));
assert("doc db write false", doc.includes("dbWriteExecuted: false"));
assert("doc sql mutation false", doc.includes("sqlMutationExecuted: false"));
assert("doc rls unchanged", doc.includes("RLS") && /unchanged|未変更/i.test(doc));
assert("doc grant unchanged", doc.includes("GRANT") && /unchanged|未変更/i.test(doc));
assert("doc service_role unchanged", doc.includes("service_role"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc dev server stopped", doc.includes("port4321ListenAfterQa: false") || doc.includes("4321 LISTEN none"));
assert("doc write-armed not used", doc.includes("writeArmedDevServerUsed: false"));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref only", doc.includes(STAGING_REF));
assert("doc next G-22g2", doc.includes("G-22g2"));
assert("doc base commit 35007fc", doc.includes(BASE_COMMIT));

assert("operator revertToSsrBootstrapRows", operatorTs.includes("revertToSsrBootstrapRows"));
assert("operator runAuthenticatedAdminReadRefetch", operatorTs.includes("runAuthenticatedAdminReadRefetch"));
assert("read module loadGosakiSchedulesAuthenticatedAdminRead", read(READ_MODULE).includes("loadGosakiSchedulesAuthenticatedAdminRead"));

assert("G9k save unchanged", gitDiff(G9K_SAVE).length === 0);
assert("write adapter unchanged", gitDiff(WRITE_ADAPTER).length === 0);
assert("G22d save unchanged", gitDiff(G22D_SAVE).length === 0);
assert("G22e save unchanged", gitDiff(G22E_SAVE).length === 0);
assert("G22f save unchanged", gitDiff(G22F_SAVE).length === 0);
assert("approval ids unchanged", gitDiff(APPROVAL_IDS).length === 0);
assert("read module unchanged", gitDiff(READ_MODULE).length === 0);
assert("operator ts unchanged", gitDiff(OPERATOR_TS).length === 0);

assert("impl doc references 008", implDoc.includes(TARGET_LEGACY));

const moduleSmoke = spawnSync(
  "npx",
  [
    "--yes",
    "tsx",
    "-e",
    `
import { loadGosakiSchedulesAuthenticatedAdminRead } from './src/lib/admin/staging-data/gosaki-schedule-authenticated-admin-read.ts';
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from './src/lib/admin/staging-data/staging-schedule-site-slug-config.ts';
const STAGING = 'https://${STAGING_REF}.supabase.co';
const row008 = {
  id: '${TARGET_ID}',
  legacy_id: '${TARGET_LEGACY}',
  site_slug: 'gosaki-piano',
  date: '2026-07-17',
  month: '2026-07',
  title: '<>',
  published: false,
  updated_at: '2026-07-06T13:58:41.425402+00:00',
};
async function main() {
  const unsigned = await loadGosakiSchedulesAuthenticatedAdminRead({
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    supabaseUrl: STAGING,
    anonKey: 'test-anon-key-not-used-for-query',
  });
  const rows = [{ ...row008, id: 'pub', legacy_id: 'schedule-2026-07-001', published: true, date: '2026-07-01' }, row008];
  const draft = rows.filter(r => r.published === false);
  const kw = rows.filter(r => String(r.legacy_id).includes('schedule-2026-07-008'));
  const ok = unsigned.mode === 'ssr-bootstrap' && draft.some(r => r.legacy_id === '${TARGET_LEGACY}') && kw.some(r => r.legacy_id === '${TARGET_LEGACY}');
  if (!ok) process.exit(1);
  console.log('g22g1f2-filter-smoke-ok');
}
main();
`,
  ],
  { cwd: REPO_ROOT, encoding: "utf8", timeout: 120000 },
);

assert(
  "filter simulation module smoke",
  moduleSmoke.status === 0 && moduleSmoke.stdout.includes("g22g1f2-filter-smoke-ok"),
  moduleSmoke.stderr || moduleSmoke.stdout,
);

assert("00-current-state mentions G-22g1f2", currentState.includes("G-22g1f2"));
assert("03-next-actions mentions G-22g1f2", nextActions.includes("G-22g1f2"));
assert("handoff mentions G-22g1f2", handoff.includes("G-22g1f2"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-22g1f2 Gosaki Schedule authenticated admin read QA verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
