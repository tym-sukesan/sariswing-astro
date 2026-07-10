/**
 * G-20u24d — Discography site_slug migration execution record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u24d-discography-site-slug-migration-execution-record.mjs
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
const DOC_REL = "tools/static-to-astro/docs/discography-site-slug-migration-execution-result.md";
const PLANNING_DOC = "tools/static-to-astro/docs/discography-site-slug-migration-planning.md";
const BASE_COMMIT = "fba8a65";

const SQL_DIR = "tools/static-to-astro/scripts/supabase";
const SQL_BEFORE = `${SQL_DIR}/gosaki-discography-g20u23-site-slug-before-verification.sql`;
const SQL_MIGRATION = `${SQL_DIR}/gosaki-discography-g20u23-site-slug-migration.sql`;
const SQL_AFTER = `${SQL_DIR}/gosaki-discography-g20u23-site-slug-after-verification.sql`;

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
  console.log(`NOTE HEAD is ${head.stdout.trim()} (G-20u24d base ${BASE_COMMIT}) — non-blocking`);
}

assert("execution record doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20u24d", doc.includes("G-20u24d-discography-site-slug-migration-execution-record"));
assert("doc G-20u24a before PASS", doc.includes("G-20u24a") && doc.includes("PASS"));
assert("doc G-20u24b migration PASS", doc.includes("G-20u24b") && doc.includes("PASS"));
assert("doc G-20u24c after corrected PASS", doc.includes("G-20u24c"));
assert("doc rollback not needed", doc.includes("not needed") || doc.includes("Not executed"));
assert("doc aggregation bug", doc.includes("count(*)") && doc.includes("sum(track_count)"));
assert("doc 34 tracks 4 album groups", doc.includes("34") && doc.includes("4 album"));
assert("doc loader flag unchanged", doc.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY = false"));
assert("doc staging project", doc.includes("kmjqppxjdnwwrtaeqjta") || doc.includes("static-to-astro-cms-staging"));
assert("doc no new SQL execution", doc.includes("No new SQL execution") || doc.includes("no new SQL"));

assert("planning doc exists", exists(PLANNING_DOC));

const afterSql = read(SQL_AFTER);
const beforeSql = read(SQL_BEFORE);
const migrationSql = read(SQL_MIGRATION);

assert("after sql sum(track_count) fix", afterSql.includes("sum(track_count)"));
assert("after sql filtered_album_groups", afterSql.includes("filtered_album_groups"));
assert("after sql filtered_tracks", afterSql.includes("filtered_tracks"));
assert("after sql G-20u24c bug note", afterSql.includes("G-20u24c bug"));
assert("after expects 34 filtered_tracks", afterSql.includes("filtered_tracks 34"));
assert("after expects 4 album groups", afterSql.includes("filtered_album_groups 4"));
assert("after orphan tracks check", afterSql.includes("orphan_tracks"));
assert("after RLS check", afterSql.includes("rls_enabled"));

const beforeActive = activeSqlStatements(beforeSql).join("\n");
const afterActive = activeSqlStatements(afterSql).join("\n");

for (const pattern of READ_ONLY_FORBIDDEN) {
  assert(`before sql no forbidden ${pattern}`, !pattern.test(beforeActive));
  assert(`after sql no forbidden ${pattern}`, !pattern.test(afterActive));
}

for (const pattern of MIGRATION_FORBIDDEN) {
  assert(`migration sql no forbidden ${pattern}`, !pattern.test(stripSqlComments(migrationSql)));
}

assert("loader DISCOGRAPHY_SITE_SLUG_COLUMN_READY false", DISCOGRAPHY_SITE_SLUG_COLUMN_READY === false);
const discographyLib = read("tools/static-to-astro/scripts/lib/supabase-discography-read.mjs");
assert("code flag still false", discographyLib.includes("DISCOGRAPHY_SITE_SLUG_COLUMN_READY = false"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u24d", packageJson.includes("verify:g20u24d-discography-site-slug-migration-execution-record"));

const regression = read("tools/static-to-astro/scripts/verify-current-active-regression-suite.mjs");
assert("regression includes G-20u24d", regression.includes("G-20u24d"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert("AI current-state G-20u24d", currentState.includes("G-20u24d"));
assert("AI next-actions G-20u24d", nextActions.includes("G-20u24d"));
assert("handoff G-20u24d", handoff.includes("G-20u24d"));

console.log(`\nG-20u24d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
