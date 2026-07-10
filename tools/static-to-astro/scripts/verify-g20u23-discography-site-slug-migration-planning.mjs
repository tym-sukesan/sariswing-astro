/**
 * G-20u23 — Discography site_slug migration planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u23-discography-site-slug-migration-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { TOOL_ROOT } from "./lib/site-registry.mjs";
import { DISCOGRAPHY_SITE_SLUG_COLUMN_READY } from "./lib/supabase-discography-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";
const DOC_REL = "tools/static-to-astro/docs/discography-site-slug-migration-planning.md";
const BASE_COMMIT = "668780d";

const SQL_DIR = "tools/static-to-astro/scripts/supabase";
const SQL_BEFORE = `${SQL_DIR}/gosaki-discography-g20u23-site-slug-before-verification.sql`;
const SQL_MIGRATION = `${SQL_DIR}/gosaki-discography-g20u23-site-slug-migration.sql`;
const SQL_AFTER = `${SQL_DIR}/gosaki-discography-g20u23-site-slug-after-verification.sql`;
const SQL_ROLLBACK = `${SQL_DIR}/gosaki-discography-g20u23-site-slug-rollback.sql`;

const READ_ONLY_FORBIDDEN = [
  /\binsert\b/i,
  /\bupdate\b/i,
  /\bdelete\b/i,
  /\balter\b/i,
  /\bdrop\b/i,
  /\btruncate\b/i,
  /\bgrant\b/i,
  /\brevoke\b/i,
  /\bcreate\b/i,
];

const MIGRATION_FORBIDDEN = [
  /\bdrop\s+table\b/i,
  /\bdelete\b/i,
  /\btruncate\b/i,
  /\bgrant\b/i,
  /\brevoke\b/i,
  /service_role/i,
];

const MIGRATION_REQUIRED = [
  /alter\s+table\s+public\.discography/i,
  /alter\s+table\s+public\.discography_tracks/i,
  /site_slug/i,
  /gosaki-piano/i,
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

function stripSqlComments(sql) {
  return sql
    .replace(/--[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

function activeSqlStatements(sql) {
  const stripped = stripSqlComments(sql);
  return stripped
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (head.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u23 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u23", doc.includes("G-20u23-discography-site-slug-migration-planning"));
assert("doc READ-ONLY vs WRITE", doc.includes("READ-ONLY") && doc.includes("WRITE"));
assert("doc 4 releases 34 tracks", doc.includes("4") && doc.includes("34"));
assert("doc gosaki-piano backfill", doc.includes("gosaki-piano"));
assert("doc no execution", doc.includes("no SQL execution") || doc.includes("Not executed"));
assert("doc loader flag unchanged", doc.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY"));

for (const rel of [SQL_BEFORE, SQL_MIGRATION, SQL_AFTER, SQL_ROLLBACK]) {
  assert(`sql file exists ${path.basename(rel)}`, exists(rel));
}

const beforeSql = read(SQL_BEFORE);
const migrationSql = read(SQL_MIGRATION);
const afterSql = read(SQL_AFTER);
const rollbackSql = read(SQL_ROLLBACK);

assert("before classified read-only in header", /READ-ONLY/i.test(beforeSql));
assert("migration classified write in header", /WRITE/i.test(migrationSql));
assert("after classified read-only in header", /READ-ONLY/i.test(afterSql));
assert("rollback classified write in header", /WRITE/i.test(rollbackSql));

const beforeActive = activeSqlStatements(beforeSql).join("\n");
const afterActive = activeSqlStatements(afterSql).join("\n");

for (const pattern of READ_ONLY_FORBIDDEN) {
  assert(`before sql no forbidden ${pattern}`, !pattern.test(beforeActive));
  assert(`after sql no forbidden ${pattern}`, !pattern.test(afterActive));
}

assert("before checks site_slug column", beforeSql.includes("column_name = 'site_slug'"));
assert("before checks discography count", beforeSql.includes("from public.discography"));
assert("before checks tracks count", beforeSql.includes("from public.discography_tracks"));
assert("before checks legacy_id relation", beforeSql.includes("discography_legacy_id"));

for (const pattern of MIGRATION_FORBIDDEN) {
  assert(`migration sql no forbidden ${pattern}`, !pattern.test(stripSqlComments(migrationSql)));
}

for (const pattern of MIGRATION_REQUIRED) {
  assert(`migration sql includes ${pattern}`, pattern.test(migrationSql));
}

assert("migration no NOT NULL constraint", !/site_slug\s+text\s+not\s+null/i.test(migrationSql));
assert("migration uses begin/commit", migrationSql.includes("begin;") && migrationSql.includes("commit;"));

assert("after verifies backfill", afterSql.includes("site_slug = 'gosaki-piano'"));
assert("after expects 4 discography", afterSql.includes("EXPECT: 4"));
assert("after expects 34 tracks", afterSql.includes("EXPECT: 34"));
assert("after sum track_count aggregation", afterSql.includes("sum(track_count)") && afterSql.includes("filtered_tracks"));
assert("after filtered album groups expect 4", afterSql.includes("filtered_album_groups 4"));

assert("rollback has option A clear", rollbackSql.includes("set site_slug = null"));
assert("rollback has option B drop column", rollbackSql.includes("drop column"));

assert("loader DISCOGRAPHY_SITE_SLUG_COLUMN_READY false", DISCOGRAPHY_SITE_SLUG_COLUMN_READY === false);
const discographyLib = read("tools/static-to-astro/scripts/lib/supabase-discography-read.mjs");
assert("code flag still false in source", discographyLib.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY = false"));

const readinessDoc = read("tools/static-to-astro/docs/discography-loader-multisite-readiness.md");
assert("G-20u22 prior doc exists", readinessDoc.includes("G-20u22"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u23", packageJson.includes("verify:g20u23-discography-site-slug-migration-planning"));

const regression = read("tools/static-to-astro/scripts/verify-current-active-regression-suite.mjs");
assert("regression includes G-20u23", regression.includes("G-20u23"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u23", currentState.includes("G-20u23"));
assert("AI next-actions G-20u23", nextActions.includes("G-20u23"));
assert("handoff G-20u23", handoff.includes("G-20u23"));

console.log(`\nG-20u23 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
