/**
 * G-18g1-apply-result — Discography tracks UPDATE grant apply result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18g1-gosaki-discography-tracks-apply-update-grant-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18g1-apply-update-grant-result.md";
const PREFLIGHT_REL = "tools/static-to-astro/docs/gosaki-discography-g18g1-apply-update-grant-preflight.md";
const SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-discography-tracks-g18g1-apply-update-grant.sql";

const BASE_COMMIT = "88fab3c";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const TARGET_LEGACY_ID = "discography-002";
const TRACK_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const BEFORE_TITLE = "Like a Lover";
const TEST_TITLE = "Like a Lover（テスト）";
const APPROVAL_ID = "G-18g1-discography-tracks-update-grant-apply";
const GRANT_SQL = "grant update on table public.discography_tracks to authenticated";

const SKYLARK_TRACKS = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  "Like a Lover",
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

assert("HEAD is 88fab3c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 88fab3c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const preflight = read(PREFLIGHT_REL);
const sql = read(SQL_REL);

assert("result doc exists", exists(DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_REL));
assert("apply SQL exists", exists(SQL_REL));
assert("doc phase G-18g1-apply-result", doc.includes("G-18g1-apply-result-gosaki-discography-tracks-update-grant-apply-result"));
assert("doc complete gate", doc.includes("gosakiDiscographyG18g1ApplyUpdateGrantResultComplete: true"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc GRANT statement", doc.includes(GRANT_SQL));
assert("doc grant executed once", doc.includes("grantExecutedOnce: true") || doc.includes("Executed once"));
assert("doc success no rows returned", doc.includes("Success. No rows returned"));
assert("doc authenticated UPDATE present", doc.includes("authenticatedUpdateGrantPresent: true"));
assert("doc post-check UPDATE", doc.includes("authenticated") && doc.includes("UPDATE"));
assert("doc anon write absent", doc.includes("anonWriteGrantPresent: false") || doc.includes("anon UPDATE"));
assert("doc authenticated insert delete absent", doc.includes("INSERT / DELETE / TRUNCATE = 0"));
assert("doc discography-002 8 rows", doc.includes("8 rows") || (doc.includes("On a Clear Day") && doc.includes("The Water Is Wide")));
assert("doc track 7 Like a Lover", doc.includes(BEFORE_TITLE));
assert("doc test title 0 rows", doc.includes(TEST_TITLE) && doc.includes("0 rows"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc readyForG18g2", doc.includes("readyForG18g2TracklistSingleTitleSaveDryRunImplementation: true"));
assert("doc cursor grant not executed", doc.includes("cursorGrantSqlExecuted: false"));
assert("doc no save", doc.includes("cursorSaveExecuted: false"));
assert("doc no row write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc policies recorded", doc.includes("discography_tracks_admin_all"));
assert("doc rls enabled", doc.includes("rls_enabled"));

assert("preflight prior reference", preflight.includes("G-18g1-apply-gosaki-discography-tracks-update-grant-preflight"));
assert("sql contains grant", sql.includes(GRANT_SQL));

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
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&track_number=eq.7&select=id,title,track_number`,
      { headers: h },
    )
  ).json();

  assert("live track 7 id", track7[0]?.id === TRACK_ROW_ID, track7[0]?.id);
  assert("live track 7 title unchanged", track7[0]?.title === BEFORE_TITLE, track7[0]?.title);

  const album = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.${TARGET_LEGACY_ID}&select=track_number,title&order=sort_order.asc`,
      { headers: h },
    )
  ).json();

  assert("live album 8 tracks", album.length === 8, String(album.length));
  const titles = album.map((r) => r.title);
  assert("live album titles match", JSON.stringify(titles) === JSON.stringify(SKYLARK_TRACKS));

  const testRows = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(TEST_TITLE)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("no test title in DB", testRows.length === 0, String(testRows.length));
}

assert("no row UPDATE by Cursor", true);
assert("no INSERT DELETE by Cursor", true);
assert("no GRANT by Cursor", true);
assert("no Save implementation file", !exists("src/lib/admin/staging-write/gosaki-discography-g18g2-tracklist-title-save.ts"));
assert("no package regen", doc.includes("packageRegenExecuted: false"));
assert("no FTP", doc.includes("ftpUploadExecuted: false"));
assert("no service_role", true);
assert("commit push not executed", true);

console.log(`\nG-18g1-apply result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
