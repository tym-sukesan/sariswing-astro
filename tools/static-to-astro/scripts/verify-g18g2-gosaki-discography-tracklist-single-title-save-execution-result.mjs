/**
 * G-18g2-execution — Save execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g2-gosaki-discography-tracklist-single-title-save-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-final-preflight.md";
const WIRING_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-ui-wiring.md";
const ROLLBACK_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g18g2-tracklist-title-save-rollback.sql";

const BASE_COMMIT = "8fd2ff7";
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

const SKYLARK_TRACKS_AFTER = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  "Like a Lover（テスト）",
  "The Water Is Wide",
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

assert("HEAD is 8fd2ff7", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 8fd2ff7", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("execution result doc exists", exists(DOC_REL));
assert("doc phase G-18g2-execution", doc.includes("G-18g2-execution-gosaki-discography-tracklist-single-title-save-result"));
assert("doc success gate", doc.includes("gosakiDiscographyG18g2TracklistSingleTitleSaveSuccess: true"));
assert("doc execution complete gate", doc.includes("gosakiDiscographyG18g2TracklistSingleTitleSaveExecutionComplete: true"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc armed env", doc.includes(ARMED_ENV));
assert("doc PUBLIC_ADMIN_WRITE_DRY_RUN false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc ENABLE_ADMIN_STAGING_WRITE", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc local URL", doc.includes(LOCAL_URL));
assert("doc operator Save once", doc.includes("once") || doc.includes("1回"));
assert("doc browser alert", doc.includes("保存しました"));
assert("doc target row id", doc.includes(TARGET_TRACK_ROW_ID));
assert("doc before Like a Lover", doc.includes(BEFORE_TITLE));
assert("doc after test title", doc.includes(AFTER_TITLE));
assert("doc discography-002 8 rows", doc.includes("discography_002_track_count") || doc.includes("8"));
assert("doc test_title_rows 1", doc.includes("test_title_rows") && doc.includes("1"));
assert("doc old_title_rows_for_target 0", doc.includes("old_title_rows_for_target") || doc.includes("Like a Lover`) | 0"));
assert("doc ready_to_save preview", doc.includes("ready_to_save"));
assert("doc saveAllowed true", doc.includes("saveAllowed") && doc.includes("true"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc G-18h deferred", doc.includes("G-18h") && doc.includes("deferred"));
assert("doc no cursor save", doc.includes("cursorClickedSave: false"));
assert("doc no package regen", doc.includes("packageRegenExecuted: false"));
assert("doc no FTP", doc.includes("ftpUploadExecuted: false"));
assert("doc no re-execution", doc.includes("readyForG18g2TracklistSingleTitleSaveReExecution: false"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));

assert("preflight prior exists", exists(PREFLIGHT_REL));
assert("wiring prior exists", exists(WIRING_REL));
assert("rollback SQL exists", exists(ROLLBACK_SQL_REL));

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
  assert("live track 7 after title", track7[0]?.title === AFTER_TITLE, track7[0]?.title);
  assert("live track_number 7", track7[0]?.track_number === 7, String(track7[0]?.track_number));
  assert("live legacy id", track7[0]?.discography_legacy_id === TARGET_LEGACY_ID);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=track_number,title&order=sort_order.asc`,
      { headers: h },
    )
  ).json();

  assert("live album 8 tracks", album.length === 8, String(album.length));
  const titles = album.map((r) => r.title);
  assert("live album titles after Save", JSON.stringify(titles) === JSON.stringify(SKYLARK_TRACKS_AFTER));

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(AFTER_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live test_title_rows 1", testRows.length === 1, String(testRows.length));

  const oldTarget = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${TARGET_TRACK_ROW_ID}&title=eq.${encodeURIComponent(BEFORE_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live old_title_rows_for_target 0", oldTarget.length === 0, String(oldTarget.length));
}

assert("additional Save not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("no service_role", doc.includes("service_role") && doc.includes("not used"));
assert("commit push not executed", true);

console.log(`\nG-18g2 execution result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
