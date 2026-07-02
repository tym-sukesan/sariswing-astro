/**
 * G-22d3b-blocker — Gosaki Schedule duplicate INSERT permission denied audit verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d3b-blocker-gosaki-schedule-duplicate-insert-permission-denied-audit.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const BASE_COMMIT = "974738c";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-permission-denied-audit.md";
const SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-schedules-g22d3b-insert-permission-readonly-audit.sql";
const INSERT_SAVE = "src/lib/admin/staging-write/gosaki-schedule-duplicate-insert-save.ts";
const INSERT_ADAPTER = "src/lib/admin/staging-write/schedule-insert-write-adapter.ts";
const G9K_SAVE = "src/lib/admin/staging-write/gosaki-schedule-existing-event-save-button-save.ts";
const AUTH_CLIENT = "src/lib/admin/staging-auth/supabase-staging-auth-client.ts";
const GRANT_RESULT = "tools/static-to-astro/docs/schedule-update-grant-manual-apply-result.md";

const APPROVAL_ID = "G-22d-gosaki-schedule-duplicate-insert-non-dry-run-slice";
const SOURCE_ID = "eb1f1898-5107-4deb-a6d5-a792e0ec3f69";
const PLANNED_LEGACY = "schedule-2026-03-014";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
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

assert("HEAD is 974738c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("audit doc exists", exists(DOC_REL));
assert("readonly SQL template exists", exists(SQL_REL));

const doc = read(DOC_REL);
const sql = read(SQL_REL);
const insertSave = read(INSERT_SAVE);
const insertAdapter = read(INSERT_ADAPTER);
const g9kSave = read(G9K_SAVE);
const authClient = read(AUTH_CLIENT);
const grantResult = read(GRANT_RESULT);

assert("doc phase G-22d3b-blocker", doc.includes("G-22d3b-blocker-gosaki-schedule-duplicate-insert-permission-denied-audit"));
assert("doc audit gate complete", doc.includes("gosakiScheduleDuplicateInsertPermissionDeniedAuditComplete: true"));
assert("doc ready G-22d3b2", doc.includes("readyForG22d3b2InsertGrantFinalPreflight: true"));
assert("doc save retry blocked", doc.includes("readyForG22d3bSaveRetry: false"));
assert("doc permission denied error", doc.includes("permission denied for table schedules"));
assert("doc no grant executed", doc.includes("grantSqlExecuted: false"));
assert("doc no save retry", doc.includes("Save retry") && doc.includes("**no**"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc source id", doc.includes(SOURCE_ID));
assert("doc planned legacy", doc.includes(PLANNED_LEGACY));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc root cause INSERT grant", doc.includes("authenticated INSERT"));
assert("doc G-6-e4 UPDATE precedent", doc.includes("G-6-e4"));
assert("doc option A recommended", doc.includes("Option A") && doc.includes("recommended"));
assert("doc option B not recommended", doc.includes("service_role") && doc.includes("Not recommended"));
assert("doc phase split G-22d3b2", doc.includes("G-22d3b2"));
assert("doc phase split G-22d3b4", doc.includes("G-22d3b4"));
assert("doc fix required yes", doc.includes("Fix required?") && doc.includes("**Yes"));

assert("sql SELECT only header", sql.includes("SELECT ONLY"));
assert("sql no-write verification", sql.includes("schedule-2026-03-014"));
assert("sql pg_policies schedules", sql.includes("pg_policies") && sql.includes("schedules"));
assert("sql role_table_grants", sql.includes("role_table_grants"));
assert("sql is_admin", sql.includes("is_admin"));
assert("sql no grant statement", !sql.match(/^\s*grant\s+/im));
assert("sql no insert mutation", !sql.match(/^\s*insert\s+into\s+public\.schedules/im));

assert("insert save uses getStagingSupabaseClient", insertSave.includes("getStagingSupabaseClient"));
assert("insert save calls insertScheduleWrite", insertSave.includes("insertScheduleWrite"));
assert("insert adapter uses .insert(", insertAdapter.includes(".insert(payload)"));
assert("g9k uses update not insert", g9kSave.includes("updateScheduleWrite") && !g9kSave.includes("insertScheduleWrite"));
assert("auth client anon only comment", authClient.includes("anon key only"));
assert("auth client no service_role", !authClient.includes("service_role"));
assert("G-6-e4 grant result INSERT absent", grantResult.includes("INSERT: absent"));

for (const rel of [INSERT_SAVE, INSERT_ADAPTER]) {
  assert(`no prod ref in ${path.basename(rel)}`, !read(rel).includes(PROD_REF));
}
assert(
  "doc mentions prod ref only as never",
  doc.includes(PROD_REF) && /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);
assert(
  "sql mentions prod ref only as stop",
  sql.includes(PROD_REF) && sql.includes("STOP if"),
);

console.log(
  `\nG-22d3b-blocker Gosaki Schedule duplicate INSERT permission denied audit verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
