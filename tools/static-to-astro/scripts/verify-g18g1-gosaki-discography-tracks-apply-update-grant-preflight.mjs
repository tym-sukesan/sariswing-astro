/**
 * G-18g1-apply — Discography tracks UPDATE grant apply preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g1-gosaki-discography-tracks-apply-update-grant-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18g1-apply-update-grant-preflight.md";
const SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-g18g1-apply-update-grant.sql";
const G18G1_REL = "tools/static-to-astro/docs/gosaki-discography-g18g1-tracks-grant-rls-readonly-check.md";

const BASE_COMMIT = "418c2bd";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const TARGET_TABLE = "discography_tracks";
const TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const BEFORE_TITLE = "Like a Lover";
const TEST_TITLE = "Like a Lover（テスト）";
const APPROVAL_ID = "G-18g1-discography-tracks-update-grant-apply";

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

assert("HEAD is 418c2bd", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 418c2bd", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const sql = read(SQL_REL);
const g18g1 = read(G18G1_REL);

assert("preflight doc exists", exists(DOC_REL));
assert("apply SQL exists", exists(SQL_REL));
assert("G-18g1 check doc exists", exists(G18G1_REL));
assert("doc phase G-18g1-apply-preflight", doc.includes("G-18g1-apply-gosaki-discography-tracks-update-grant-preflight"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18g1ApplyUpdateGrantPreflightComplete: true"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc target table", doc.includes(`public.${TARGET_TABLE}`));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc why grant needed", doc.includes("permission denied") || doc.includes("missing"));
assert("doc what changes", doc.includes("What changes") || doc.includes("What changes"));
assert("doc what not changes", doc.includes("What does NOT change"));
assert("doc success outcome", doc.includes("Success") || doc.includes("good result"));
assert("doc failure modes", doc.includes("Failure"));
assert("doc worst case", doc.includes("Worst case") || doc.includes("production"));
assert("doc rollback revoke", doc.includes("revoke update on table public.discography_tracks"));
assert("doc rollback not executed", doc.includes("not executed") || doc.includes("Do not execute"));
assert("doc anon write not granted", doc.includes("anon") && doc.includes("SELECT only"));
assert("doc service_role not required", doc.includes("service_role") && doc.includes("not used"));
assert("doc ready for execution", doc.includes("readyForG18g1ApplyUpdateGrantExecution: true"));
assert("doc grant not executed", doc.includes("grantExecutedInThisPhase: false"));
assert("doc cursor grant not executed", doc.includes("grantExecutedByCursor: false"));
assert("doc no policy change", doc.includes("policyChangeExecutedInThisPhase: false"));
assert("doc no save", doc.includes("cursorSaveExecuted: false"));

assert("sql step 0 confirmation", sql.includes("Step 0") && sql.includes(STAGING_REF));
assert("sql step 1 pre-check", sql.includes("Step 1"));
assert("sql step 2 grant", sql.includes("Step 2"));
assert("sql step 3 post-check", sql.includes("Step 3"));
assert("sql step 4 target row", sql.includes("Step 4"));
assert("sql grant update authenticated", sql.includes("grant update on table public.discography_tracks to authenticated"));
assert("sql no grant insert delete", !/grant\s+(insert|delete)/i.test(sql));
assert("sql no alter table", !/alter\s+table/i.test(sql));
assert("sql no create policy", !/create\s+policy/i.test(sql));
assert("sql no drop policy", !/drop\s+policy/i.test(sql));
assert("sql no data update", !/(^|\n)\s*update\s+public\.discography_tracks/i.test(sql));
assert("sql pre-check grants", sql.includes("role_table_grants"));
assert("sql post-check anon write", sql.includes("UPDATE', 'INSERT', 'DELETE'"));
assert("sql target row id", sql.includes(TRACK_ROW_ID));
assert("sql track 7 title check", sql.includes(BEFORE_TITLE));
assert("sql test title check", sql.includes(TEST_TITLE));
assert("sql rollback commented", sql.includes("revoke update on table public.discography_tracks"));
assert("sql stop production", sql.includes(PROD_REF));

assert("G-18g1 prior missing grant", g18g1.includes("authenticatedUpdateGrantPresent: false"));

assert("no Save implementation file", !exists("src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts"));
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("commit push not executed", true);

console.log(`\nG-18g1-apply preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
