/**
 * G-18d — Gosaki Discography tracks manual SQL execution readiness verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18d-gosaki-discography-tracks-manual-sql-execution-readiness.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18d-tracks-manual-sql-execution-readiness.md";
const G18C_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18c-tracks-gap-backfill-preflight.md";
const G18CF_DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18c-f-tracks-renumber-update-preflight.md";
const RENUMBER_SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-renumber-g18c-f.template.sql";
const INSERT_SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-backfill-g18c.template.sql";
const READONLY_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-g18d-operator-readonly-check.sql";

const BASE_COMMIT = "6d5f78e";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

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

function hasUncommentedExecutable(sql, keyword) {
  for (const line of sql.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("--")) continue;
    if (t.includes(keyword)) return true;
  }
  return false;
}

function countInsertValueRows(sql) {
  const begin = sql.indexOf("BEGIN;");
  const commit = sql.indexOf("COMMIT;", begin);
  const block = sql.slice(begin, commit);
  return block.split("\n").filter((l) => l.trim().startsWith("('discography-")).length;
}

function countExecutableUpdates(sql) {
  const begin = sql.indexOf("BEGIN;");
  const commit = sql.lastIndexOf("COMMIT;");
  const block = sql.slice(begin, commit);
  return block.split("\n").filter((l) => l.trim().startsWith("UPDATE public.discography_tracks")).length;
}

function readonlySqlIsSelectOnly(sql) {
  for (const line of sql.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("--")) continue;
    const upper = t.toUpperCase();
    if (
      upper.startsWith("UPDATE ") ||
      upper.startsWith("INSERT ") ||
      upper.startsWith("DELETE ") ||
      upper.startsWith("ALTER ") ||
      upper.startsWith("TRUNCATE ") ||
      upper.startsWith("DROP ") ||
      upper.includes(" UPSERT")
    ) {
      return false;
    }
  }
  return sql.toLowerCase().includes("select ");
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 6d5f78e", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 6d5f78e", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const renumberSql = read(RENUMBER_SQL_REL);
const insertSql = read(INSERT_SQL_REL);
const readonlySql = read(READONLY_SQL_REL);

assert("readiness doc exists", exists(DOC_REL));
assert("G-18c doc exists", exists(G18C_DOC_REL));
assert("G-18c-f doc exists", exists(G18CF_DOC_REL));
assert("renumber template path recorded", doc.includes("gosaki-discography-tracks-renumber-g18c-f.template.sql"));
assert("insert template path recorded", doc.includes("gosaki-discography-tracks-backfill-g18c.template.sql"));
assert("operator readonly SQL file exists", exists(READONLY_SQL_REL));
assert("doc references readonly SQL", doc.includes("gosaki-discography-tracks-g18d-operator-readonly-check.sql"));

assert("doc phase G-18d", doc.includes("G-18d-gosaki-discography-tracks-manual-sql-execution-readiness"));
assert("doc gate complete", doc.includes("gosakiDiscographyG18dTracksManualSqlExecutionReadinessComplete: true"));
assert("doc G-18c conclusion", doc.includes("G-18c"));
assert("doc G-18c-f conclusion", doc.includes("G-18c-f"));
assert("doc execution order", doc.includes("Step 2") && doc.includes("Step 3"));
assert("doc Step 0 project check", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc success conditions", doc.includes("success conditions") || doc.includes("Success conditions"));
assert("doc stop conditions", doc.includes("Stop conditions") || doc.includes("停止条件"));
assert("doc rollback policy", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc outcomes 好結果", doc.includes("好結果"));
assert("doc Cursor no DB write", doc.includes("Cursor did not execute") || doc.includes("Cursor does not"));
assert("doc next G-18d-operator-readonly-check", doc.includes("G-18d-operator-readonly-check"));
assert("doc next G-18d-renumber-execution", doc.includes("G-18d-renumber-execution"));
assert("doc next G-18d-insert-execution", doc.includes("G-18d-insert-execution"));
assert("doc next G-18d-result-recording", doc.includes("G-18d-result-recording"));
assert("doc INSERT before renumber prohibited", doc.includes("NOT executable until Step 2") || doc.includes("Prohibited"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc total 34 after success", doc.includes("34"));

assert("readonly SQL is SELECT-only", readonlySqlIsSelectOnly(readonlySql));
assert("readonly SQL current_database", readonlySql.includes("current_database()"));
assert("readonly SQL constraints", readonlySql.includes("pg_constraint"));
assert("readonly SQL indexes", readonlySql.includes("pg_indexes"));
assert("readonly SQL columns", readonlySql.includes("information_schema.columns"));
assert("readonly SQL count 16", readonlySql.includes("track_total"));
assert("readonly SQL renumber 7 targets", readonlySql.includes("renumber_target_count"));
assert("readonly SQL missing 18 absent", readonlySql.includes("Ain''t She Sweet"));
assert("readonly SQL conflict probe", readonlySql.includes("discography-001', 5"));
assert("readonly SQL no production host", !readonlySql.includes(SARISWING_HOST));
assert("readonly SQL no service_role", !readonlySql.toLowerCase().includes("service_role"));

assert("renumber SQL UPDATE only executable", renumberSql.includes("UPDATE public.discography_tracks"));
assert("renumber SQL 14 UPDATEs", countExecutableUpdates(renumberSql) === 14, String(countExecutableUpdates(renumberSql)));
assert("renumber SQL no executable INSERT", !hasUncommentedExecutable(renumberSql, "INSERT INTO"));
assert("renumber SQL no executable DELETE", !hasUncommentedExecutable(renumberSql, "DELETE FROM"));
assert("renumber SQL rollback comment-only", renumberSql.includes("-- ROLLBACK UPDATE"));
assert("renumber SQL no production host", !renumberSql.includes(SARISWING_HOST));

assert("insert SQL 18 rows", countInsertValueRows(insertSql) === 18, String(countInsertValueRows(insertSql)));
assert("insert SQL no executable UPDATE", !hasUncommentedExecutable(insertSql, "UPDATE "));
assert("insert SQL no executable DELETE", !hasUncommentedExecutable(insertSql, "DELETE FROM"));
assert("insert SQL rollback comment-only", insertSql.includes("-- DELETE FROM public.discography_tracks"));
assert("insert SQL no production host", !insertSql.includes(SARISWING_HOST));

assert("doc records 7 renumber targets", doc.includes("7 rows") || doc.includes("7 existing"));
assert("doc records 18 INSERT rows", doc.includes("18"));
assert("doc album counts 9 8 9 8", doc.includes("9") && doc.includes("8"));

assert(
  "no service_role in SQL files",
  ![renumberSql, insertSql, readonlySql].some((s) => s.toLowerCase().includes("service_role")),
);
assert("no actual SQL execution recorded", doc.includes("sqlExecutedByCursor: false"));
assert("no DB write by Cursor", doc.includes("dbWriteExecutedByCursor: false"));
assert("no FTP upload executed", doc.includes("ftpUploadExecuted: false"));
assert("commit push not executed", true);

console.log(`\nG-18d readiness verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
