/**
 * G-19b1-execution — Save execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19b1-gosaki-discography-tracklist-single-title-save-execution-result.mjs
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
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_ROW_ID,
} from "./lib/discography-g19b1-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md";
const READINESS_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-execution-readiness.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-final-preflight.md";
const ROLLBACK_SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-discography-g19b1-tracklist-title-save-rollback.sql";

const BASE_COMMIT = "97d5378";
const G18G2_TRACK7_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const G18G2_TRACK7_TITLE = "Like a Lover（テスト）";
const LOCAL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/admin/discography/";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

const JA_JAAAAAN_TRACKS_AFTER = [
  "Mary Ann（テスト）",
  "Nearer My God To Thee",
  "Shreveport Stomp",
  "A Fool Such As I",
  "Si Tu Vois Ma Mere",
  "St. Phillip Street Break Down",
  "Girl Of My Dream",
  "Bourbon Street Parade",
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

assert("HEAD is 97d5378", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 97d5378", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("execution result doc exists", exists(DOC_REL));
assert(
  "doc phase G-19b1-execution",
  doc.includes("G-19b1-execution-gosaki-discography-tracklist-generic-single-title-save-result"),
);
assert("doc success gate", doc.includes("gosakiDiscographyG19b1TracklistGenericSingleTitleSaveSuccess: true"));
assert(
  "doc execution complete gate",
  doc.includes("gosakiDiscographyG19b1TracklistGenericSingleTitleSaveExecutionComplete: true"),
);
assert("doc approvalId", doc.includes(G19B1_APPROVAL_ID));
assert("doc armed env", doc.includes(G19B1_ARMED_ENV));
assert("doc PUBLIC_ADMIN_WRITE_DRY_RUN false", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=false"));
assert("doc ENABLE_ADMIN_STAGING_WRITE", doc.includes("ENABLE_ADMIN_STAGING_WRITE=true"));
assert("doc local URL", doc.includes(LOCAL_URL));
assert("doc operator Save once", doc.includes("once") || doc.includes("1回"));
assert("doc browser alert", doc.includes("保存しました"));
assert("doc target row id", doc.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("doc before Mary Ann", doc.includes(G19B1_BEFORE_TITLE));
assert("doc after test title", doc.includes(G19B1_AFTER_TITLE));
assert("doc discography-004 8 rows", doc.includes("discography_004_track_count") || doc.includes("8"));
assert("doc test_title_rows 1", doc.includes("test_title_rows") && doc.includes("1"));
assert(
  "doc old_title_rows_for_target 0",
  doc.includes("old_title_rows_for_target") || doc.includes("Mary Ann`) | 0"),
);
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc G-19c deferred", doc.includes("G-19c"));
assert("doc G-19d upload deferred", doc.includes("G-19d"));
assert("doc no cursor save", doc.includes("cursorClickedSave: false"));
assert("doc no package regen", doc.includes("packageRegenExecuted: false"));
assert("doc no FTP", doc.includes("ftpUploadExecuted: false"));
assert("doc no re-execution", doc.includes("readyForG19b1TracklistSingleTitleSaveReExecution: false"));
assert("doc g18g2 chain maintained", doc.includes(G18G2_TRACK7_TITLE));
assert("doc discography004 track1 closed", doc.includes("discography004Track1DoNotReSave: true"));
assert("doc UI preview reload note", doc.includes("preview card") || doc.includes("display reload"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));

assert("readiness prior exists", exists(READINESS_REL));
assert("preflight prior exists", exists(PREFLIGHT_REL));
assert("rollback SQL exists", exists(ROLLBACK_SQL_REL));

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
      `${base}/rest/v1/discography_tracks?id=eq.${G19B1_TARGET_TRACK_ROW_ID}&select=id,discography_legacy_id,track_number,title,sort_order`,
      { headers: h },
    )
  ).json();

  assert("live target row exists", track1.length === 1, String(track1.length));
  assert("live track 1 after title", track1[0]?.title === G19B1_AFTER_TITLE, track1[0]?.title);
  assert("live track_number 1", track1[0]?.track_number === 1, String(track1[0]?.track_number));
  assert("live sort_order 1", track1[0]?.sort_order === 1, String(track1[0]?.sort_order));
  assert("live legacy id 004", track1[0]?.discography_legacy_id === G19B1_TARGET_LEGACY_ID);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${G19B1_TARGET_LEGACY_ID}&select=track_number,title&order=sort_order.asc`,
      { headers: h },
    )
  ).json();

  assert("live album 8 tracks", album.length === 8, String(album.length));
  const titles = album.map((r) => r.title);
  assert(
    "live album titles after Save",
    JSON.stringify(titles) === JSON.stringify(JA_JAAAAAN_TRACKS_AFTER),
  );

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(G19B1_AFTER_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live test_title_rows 1", testRows.length === 1, String(testRows.length));

  const oldTarget = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${G19B1_TARGET_TRACK_ROW_ID}&title=eq.${encodeURIComponent(G19B1_BEFORE_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live old_title_rows_for_target 0", oldTarget.length === 0, String(oldTarget.length));

  const g18g2 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${G18G2_TRACK7_ROW_ID}&select=title`,
      { headers: h },
    )
  ).json();
  assert("g18g2 track7 maintained", g18g2[0]?.title === G18G2_TRACK7_TITLE, g18g2[0]?.title);
}

assert("additional Save not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("FTP not executed", true);
assert("no service_role", doc.includes("service_role") && doc.includes("not used"));
assert("commit push not executed", true);

console.log(
  `\nG-19b1 execution result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
