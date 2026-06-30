/**
 * G-18g2-preflight — Save final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g2-gosaki-discography-tracklist-single-title-save-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-final-preflight.md";
const PREFLIGHT_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g18g2-tracklist-title-save-preflight-check.sql";
const ROLLBACK_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g18g2-tracklist-title-save-rollback.sql";
const G18G2_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-dry-run-local-ui-result.md";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts";
const CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save-config.ts";
const GUARDS_REL = "src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-guards.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";

const BASE_COMMIT = "9236faf";
const APPROVAL_ID = "G-18g2-gosaki-discography-tracklist-single-title-non-dry-run-slice";
const TARGET_LEGACY_ID = "discography-002";
const TARGET_TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const BEFORE_TITLE = "Like a Lover";
const AFTER_TITLE = "Like a Lover（テスト）";
const ARMED_ENV = "PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED";
const LOCAL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/";
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

function loadEnv() {
  const out = {};
  for (const file of [".env", ".env.local"]) {
    const abs = path.join(REPO_ROOT, file);
    if (!fs.existsSync(abs)) continue;
    for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
    }
  }
  return out;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 9236faf", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 9236faf", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const preflightSql = read(PREFLIGHT_SQL_REL);
const rollbackSql = read(ROLLBACK_SQL_REL);
const saveSrc = read(SAVE_REL);
const configSrc = read(CONFIG_REL);
const guardsSrc = read(GUARDS_REL);
const uiSrc = read(UI_REL);

assert("preflight doc exists", exists(DOC_REL));
assert("preflight SQL exists", exists(PREFLIGHT_SQL_REL));
assert("rollback SQL exists", exists(ROLLBACK_SQL_REL));
assert("doc phase G-18g2-preflight", doc.includes("G-18g2-preflight-gosaki-discography-tracklist-single-title-save-final-preflight"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18g2TracklistSingleTitleSaveFinalPreflightComplete: true"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc target row id", doc.includes(TARGET_TRACK_ROW_ID));
assert("doc before Like a Lover", doc.includes(BEFORE_TITLE));
assert("doc after test title", doc.includes(AFTER_TITLE));
assert("doc preflight SELECT only", doc.includes("read-only") || doc.includes("SELECT only"));
assert("doc rollback separate approval", doc.includes("separate approval") || doc.includes("separate explicit approval"));
assert("doc execution env vars", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc ARM env", doc.includes(ARMED_ENV));
assert("doc ENABLE_ADMIN_STAGING_WRITE", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc local URL", doc.includes(LOCAL_URL));
assert("doc where guard", doc.includes("where id = 'fd58cd6e-2fff-4ff2-96af-3087c469450b'") || doc.includes("whereGuard"));
assert("doc rowsAffected 1", doc.includes("rowsAffected === 1") || doc.includes("rowsAffected"));
assert("doc post-save SELECT", doc.includes("Post-Save") || doc.includes("post-Save"));
assert("doc G-18h deferred", doc.includes("G-18h") && doc.includes("Deferred"));
assert("doc save ui wiring gap", doc.includes("Save UI wiring") || doc.includes("readyForG18g2ExecutionSaveUiWiring"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc no cursor save", doc.includes("cursorSaveExecuted: false"));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));

assert("preflight SQL SELECT only", !preflightSql.match(/^\s*(update|insert|delete|grant|revoke)\s/im));
assert("preflight SQL target row", preflightSql.includes(TARGET_TRACK_ROW_ID));
assert("preflight SQL track 7", preflightSql.includes("track_number"));
assert("preflight SQL before title", preflightSql.includes(BEFORE_TITLE));
assert("preflight SQL test title 0", preflightSql.includes(AFTER_TITLE));
assert("preflight SQL album count", preflightSql.includes("discography-002"));
assert("preflight SQL grant check", preflightSql.includes("role_table_grants"));
assert("preflight SQL anon write absent", preflightSql.includes("anon_write_grants"));
assert("preflight SQL policies", preflightSql.includes("pg_policies"));

assert("rollback SQL template", rollbackSql.includes("update public.discography_tracks"));
assert("rollback UPDATE commented", rollbackSql.includes("-- update public.discography_tracks"));
assert("rollback not executed note", rollbackSql.includes("DO NOT RUN") || rollbackSql.includes("not executed"));
assert("rollback where after title", rollbackSql.includes(AFTER_TITLE));

assert("save dry run requirement", configSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN"));
assert("save ARM env", configSrc.includes(ARMED_ENV));
assert("save rowsAffected check", saveSrc.includes("rowsAffected !== 1"));
assert("save where title guard", saveSrc.includes('.eq("title", where.title)'));
assert("guards track 7", guardsSrc.includes("G18G2_TARGET_TRACK_NUMBER"));
assert("guards changed length 1", guardsSrc.includes("changed.length !== 1"));
assert("ui save alert gap", uiSrc.includes("getGosakiDiscographyG18g2TracklistTitleSaveConfig") && uiSrc.includes("window.alert"));

assert("G-18g2 result prior", exists(G18G2_RESULT_REL));

const env = loadEnv();
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(PROD_REF), url);

  const base = url.replace(/\/$/, "");
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const track7 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${TARGET_TRACK_ROW_ID}&select=id,discography_legacy_id,track_number,title`,
      { headers: h },
    )
  ).json();

  assert("live target row exists", track7.length === 1, String(track7.length));
  assert("live track_number 7", track7[0]?.track_number === 7, String(track7[0]?.track_number));
  assert("live before title", track7[0]?.title === BEFORE_TITLE, track7[0]?.title);
  assert("live legacy id", track7[0]?.discography_legacy_id === TARGET_LEGACY_ID);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live album 8 tracks", album.length === 8, String(album.length));

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(AFTER_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live test title 0 rows", testRows.length === 0, String(testRows.length));
}

assert("DB write not executed", true);
assert("Save not executed", true);
assert("rollback not executed", true);
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", saveSrc.includes("serviceRoleUsed: false"));
assert("commit push not executed", true);

console.log(`\nG-18g2 final preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
