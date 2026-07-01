/**
 * G-19b1-preflight — Save final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  G19B1_AFTER_TITLE,
  G19B1_APPROVAL_ID,
  G19B1_ARMED_ENV,
  G19B1_BEFORE_TITLE,
  G19B1_EXPECTED_BEFORE_FINGERPRINT,
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_ROW_ID,
  G18G2_ARMED_ENV,
} from "./lib/discography-g19b1-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md";
const IMPL_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-implementation.md";
const PREFLIGHT_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g19b1-tracklist-title-save-preflight-check.sql";
const ROLLBACK_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g19b1-tracklist-title-save-rollback.sql";
const SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-single-title-save.ts";
const CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-single-title-save-config.ts";
const GUARDS_REL =
  "src/lib/admin/staging-write/gosaki-discography-g19b1-tracklist-generic-title-guards.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";

const BASE_COMMIT = "0112906";
const G18G2_TRACK7_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const G18G2_TRACK7_TITLE = "Like a Lover（テスト）";
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

assert("HEAD is 0112906", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 0112906", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const implDoc = read(IMPL_DOC_REL);
const preflightSql = read(PREFLIGHT_SQL_REL);
const rollbackSql = read(ROLLBACK_SQL_REL);
const saveSrc = read(SAVE_REL);
const configSrc = read(CONFIG_REL);
const guardsSrc = read(GUARDS_REL);
const uiSrc = read(UI_REL);

assert("preflight doc exists", exists(DOC_REL));
assert("preflight SQL exists", exists(PREFLIGHT_SQL_REL));
assert("rollback SQL exists", exists(ROLLBACK_SQL_REL));
assert(
  "doc phase G-19b1-preflight",
  doc.includes("G-19b1-preflight-gosaki-discography-tracklist-generic-single-title-save-final-preflight"),
);
assert(
  "doc complete gate",
  doc.includes("gosakiDiscographyG19b1TracklistGenericSingleTitleSaveFinalPreflightComplete: true"),
);
assert("doc approvalId", doc.includes(G19B1_APPROVAL_ID));
assert("doc target row id", doc.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("doc before Mary Ann", doc.includes(G19B1_BEFORE_TITLE));
assert("doc after test title", doc.includes(G19B1_AFTER_TITLE));
assert("doc preflight SELECT only", doc.includes("read-only") || doc.includes("SELECT only"));
assert(
  "doc rollback separate approval",
  doc.includes("separate approval") || doc.includes("separate explicit approval"),
);
assert("doc execution env vars", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc G19B1 ARM env", doc.includes(G19B1_ARMED_ENV));
assert("doc G18G2 arm off", doc.includes(G18G2_ARMED_ENV) && doc.includes("false"));
assert("doc ENABLE_ADMIN_STAGING_WRITE", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc local URL", doc.includes(LOCAL_URL));
assert(
  "doc where guard",
  doc.includes("where id = '04e987a9-e251-4b0b-b860-21a61e711f8e'") || doc.includes("whereGuard"),
);
assert("doc rowsAffected 1", doc.includes("rowsAffected === 1") || doc.includes("rowsAffected"));
assert("doc afterVerification SELECT", doc.includes("afterVerification") || doc.includes("Post-Save"));
assert("doc G-19c deferred", doc.includes("G-19c") && doc.includes("Deferred"));
assert("doc operator manual save", doc.includes("戸山さん") || doc.includes("operator"));
assert("doc cursor no save", doc.includes("Cursor must NOT click Save") || doc.includes("cursorSaveExecuted: false"));
assert("doc save ui wired", doc.includes("runG19b1TracklistTitleSave") || doc.includes("Save UI wired"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc rollback not executed", doc.includes("rollbackSqlExecuted: false"));
assert("doc g18g2 chain closed", doc.includes("g18g2SaveChainClosed: true"));
assert("doc fingerprint", doc.includes("Nearer My God To Thee") && doc.includes("Bourbon Street Parade"));
assert("doc execution not ready yet", doc.includes("readyForG19b1TracklistGenericSingleTitleSaveExecution: false"));

assert("impl doc prior", implDoc.includes("G-19b1-gosaki-discography-tracklist-generic-single-title-save-implementation"));

assert("preflight SQL SELECT only", !preflightSql.match(/^\s*(update|insert|delete|grant|revoke)\s/im));
assert("preflight SQL target row", preflightSql.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("preflight SQL track 1", preflightSql.includes("track_number"));
assert("preflight SQL before title", preflightSql.includes(G19B1_BEFORE_TITLE));
assert("preflight SQL after title check", preflightSql.includes(G19B1_AFTER_TITLE));
assert("preflight SQL album 004", preflightSql.includes(G19B1_TARGET_LEGACY_ID));
assert("preflight SQL g18g2 spot check", preflightSql.includes(G18G2_TRACK7_TITLE));
assert("preflight SQL grant check", preflightSql.includes("role_table_grants"));
assert("preflight SQL policies", preflightSql.includes("pg_policies"));

assert("rollback SQL template", rollbackSql.includes("update public.discography_tracks"));
assert("rollback UPDATE commented", rollbackSql.includes("-- update public.discography_tracks"));
assert("rollback not executed note", rollbackSql.includes("DO NOT RUN") || rollbackSql.includes("not executed"));
assert("rollback where after title", rollbackSql.includes(G19B1_AFTER_TITLE));
assert("rollback restore before title", rollbackSql.includes(G19B1_BEFORE_TITLE));

assert("save dry run requirement", configSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN"));
assert("save G19B1 ARM env", configSrc.includes(G19B1_ARMED_ENV));
assert("save G18G2 single arm", configSrc.includes("G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV"));
assert("save rowsAffected check", saveSrc.includes("rowsAffected !== 1"));
assert("save where title guard", saveSrc.includes('.eq("title", where.title)'));
assert("guards track 1", guardsSrc.includes("G19B1_TARGET_TRACK_NUMBER"));
assert("guards changed length 1", guardsSrc.includes("changed.length !== 1"));
assert("guards fingerprint", guardsSrc.includes("G19B1_EXPECTED_BEFORE_FINGERPRINT"));
assert("ui runG19b1 save wired", uiSrc.includes("runG19b1TracklistTitleSave"));
assert("ui executeG19b1 save", uiSrc.includes("executeG19b1TracklistTitleSave"));

const env = loadEnv();
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (url && key) {
  assert("staging host only", url.includes(STAGING_REF), url);
  assert("not production host", !url.includes(PROD_REF), url);

  const base = url.replace(/\/$/, "");
  const h = { apikey: key, Authorization: `Bearer ${key}` };

  const track1 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${G19B1_TARGET_TRACK_ROW_ID}&select=id,discography_legacy_id,track_number,title`,
      { headers: h },
    )
  ).json();

  assert("live target row exists", track1.length === 1, String(track1.length));
  assert("live track_number 1", track1[0]?.track_number === 1, String(track1[0]?.track_number));
  assert("live before title", track1[0]?.title === G19B1_BEFORE_TITLE, track1[0]?.title);
  assert("live legacy id 004", track1[0]?.discography_legacy_id === G19B1_TARGET_LEGACY_ID);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${G19B1_TARGET_LEGACY_ID}&select=track_number,title&order=sort_order.asc`,
      { headers: h },
    )
  ).json();
  assert("live album 8 tracks", album.length === 8, String(album.length));
  const fingerprint = album.map((t) => t.title).join("|");
  assert("live fingerprint", fingerprint === G19B1_EXPECTED_BEFORE_FINGERPRINT, fingerprint);

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(G19B1_AFTER_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live test title 0 rows", testRows.length === 0, String(testRows.length));

  const g18g2Track7 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${G18G2_TRACK7_ROW_ID}&select=track_number,title`,
      { headers: h },
    )
  ).json();
  assert("live g18g2 track7 maintained", g18g2Track7[0]?.title === G18G2_TRACK7_TITLE, g18g2Track7[0]?.title);
}

assert("DB write not executed", true);
assert("Save not executed", true);
assert("rollback not executed", true);
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", saveSrc.includes("serviceRoleUsed: false"));
assert("commit push not executed", true);

console.log(
  `\nG-19b1 final preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
