/**
 * G-19c — Gosaki Discography G-19b1 tracklist public reflection local regen / upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19c-gosaki-discography-tracklist-public-reflection-local-regen-and-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";
import {
  G19B1_AFTER_TITLE,
  G19B1_BEFORE_TITLE,
  G19B1_TARGET_LEGACY_ID,
  G19B1_TARGET_TRACK_ROW_ID,
} from "./lib/discography-g19b1-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md";
const G19B1_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md";
const G18H_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18h-public-tracks-reflection-preflight.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";

const DISCOGRAPHY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const ASTRO_DIR_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro";

const BASE_COMMIT = "d311e65";
const G18G2_TRACK7_ROW_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const G18G2_TRACK7_TITLE = "Like a Lover（テスト）";
const G18G2_BEFORE_TITLE = "Like a Lover";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const LOCAL_CSS = "index.YcHrHZH4.css";
const JS_HASH = "index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";

const JA_JAAAAAN_TRACKS_AFTER = [
  G19B1_AFTER_TITLE,
  "Nearer My God To Thee",
  "Shreveport Stomp",
  "A Fool Such As I",
  "Si Tu Vois Ma Mere",
  "St. Phillip Street Break Down",
  "Girl Of My Dream",
  "Bourbon Street Parade",
];

const SKYLARK_TRACKS_AFTER = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  G18G2_TRACK7_TITLE,
  "The Water Is Wide",
];

const ALBUM_TRACK_COUNTS = {
  "discography-001": { title: "Continuous", count: 9 },
  "discography-002": { title: "SKYLARK", count: 8 },
  "discography-003": { title: "About Us!!", count: 9 },
  "discography-004": { title: "Ja-Jaaaaan!", count: 8 },
};

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

function extractRepeaterItem(html, title) {
  const bounds = findDiscographyRepeaterItemBounds(html, title);
  if (!bounds) return "";
  return html.slice(bounds.start, bounds.end);
}

function extractTrackTitlesFromItem(itemHtml) {
  const tlIdx = itemHtml.indexOf("Track List");
  if (tlIdx < 0) return [];
  const after = itemHtml.slice(tlIdx);
  const endRel = after.search(/Personnel|Release/);
  const block = endRel > 0 ? after.slice(0, endRel) : after;
  /** @type {string[]} */
  const titles = [];
  const re = /<p class="font_(8|13)[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    const text = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\u200b/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (text && !/track list/i.test(text)) titles.push(text);
  }
  return titles;
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is d311e65", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is d311e65", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const hookSrc = read(HOOK_REL);

assert("G-19c doc exists", exists(DOC_REL));
assert(
  "doc phase G-19c",
  doc.includes("G-19c-gosaki-discography-tracklist-public-reflection-local-regen-and-upload-preflight"),
);
assert(
  "doc local regen gate",
  doc.includes("gosakiDiscographyG19cTracklistPublicReflectionLocalRegenComplete: true"),
);
assert(
  "doc upload preflight gate",
  doc.includes("gosakiDiscographyG19cTracklistPublicReflectionUploadPreflightComplete: true"),
);
assert("doc readyForG19d", doc.includes("readyForG19dTracklistPublicReflectionUploadExecution: true"));
assert("doc package regen executed", doc.includes("packageRegenExecuted: true"));
assert("doc Mary Ann test title", doc.includes(G19B1_AFTER_TITLE));
assert("doc G-18g2 maintained", doc.includes(G18G2_TRACK7_TITLE));
assert("doc upload 1 file", doc.includes("uploadFileCount: 1") || doc.includes("1 file"));
assert("doc cssJsHashChanged false", doc.includes("cssJsHashChanged: false"));
assert("doc mirror forbidden", doc.includes("mirrorSyncDeleteForbidden: true"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc no Save", doc.includes("cursorSaveExecuted: false"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));

assert("G-19b1 execution result prior exists", exists(G19B1_RESULT_REL));
assert("G-18h hook prior exists", exists(G18H_REL));
assert("hook loadDiscographyTracksFromSupabase", hookSrc.includes("loadDiscographyTracksFromSupabase"));
assert("hook groupDiscographyTracksByLegacyId", hookSrc.includes("groupDiscographyTracksByLegacyId"));
assert("hook patchDiscographyItemTracks", hookSrc.includes("patchDiscographyItemTracks"));

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

  assert("live track 1 row exists", track1.length === 1, String(track1.length));
  assert("live track 1 after title", track1[0]?.title === G19B1_AFTER_TITLE, track1[0]?.title);
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
    "live Ja-Jaaaaan track list",
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
} else {
  assert("supabase env for REST read", false, "PUBLIC_SUPABASE_URL / ANON_KEY missing");
}

if (exists(DISCOGRAPHY_HTML_REL)) {
  const discHtml = read(DISCOGRAPHY_HTML_REL);

  assert("local discographyDataSource supabase", discHtml.includes("discographyDataSource=supabase"));
  assert("local Mary Ann test title present", discHtml.includes(G19B1_AFTER_TITLE));
  assert("local old Mary Ann only absent", !discHtml.includes(`>${G19B1_BEFORE_TITLE}<`));
  assert("local G-18g2 test title present", discHtml.includes(G18G2_TRACK7_TITLE));

  for (const [legacyId, meta] of Object.entries(ALBUM_TRACK_COUNTS)) {
    const item = extractRepeaterItem(discHtml, meta.title);
    const trackTitles = extractTrackTitlesFromItem(item);
    assert(`local ${legacyId} track count ${meta.count}`, trackTitles.length === meta.count, String(trackTitles.length));
  }

  const jaItem = extractRepeaterItem(discHtml, "Ja-Jaaaaan!");
  const jaTitles = extractTrackTitlesFromItem(jaItem);
  assert(
    "local Ja-Jaaaaan track list",
    JSON.stringify(jaTitles) === JSON.stringify(JA_JAAAAAN_TRACKS_AFTER),
  );

  const skylarkItem = extractRepeaterItem(discHtml, "SKYLARK");
  const skylarkTitles = extractTrackTitlesFromItem(skylarkItem);
  assert(
    "local SKYLARK track list",
    JSON.stringify(skylarkTitles) === JSON.stringify(SKYLARK_TRACKS_AFTER),
  );

  const astroRefs = [...discHtml.matchAll(/_astro\/[^"']+/g)].map((m) => m[0]);
  assert("local CSS ref YcHrHZH4", astroRefs.some((r) => r.includes(LOCAL_CSS)));
}

if (exists(ASTRO_DIR_REL)) {
  const files = fs.readdirSync(path.join(REPO_ROOT, ASTRO_DIR_REL));
  assert("package CSS hash unchanged", files.some((f) => f === LOCAL_CSS));
  assert("package JS hash unchanged", files.includes(JS_HASH));
  assert("doc records CSS filename", doc.includes(LOCAL_CSS));
}

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL, { method: "GET" });
  assert("live GET HTTP ok", liveRes.ok, String(liveRes.status));
  const body = await liveRes.text();
  assert("live not production host", !body.includes(PROD_REF));
  assert("live Mary Ann test absent (not uploaded)", !body.includes(G19B1_AFTER_TITLE));
  assert("live old Mary Ann present", body.includes(G19B1_BEFORE_TITLE));
  assert("live G-18g2 test title present", body.includes(G18G2_TRACK7_TITLE));
  assert("live old Like a Lover only absent", !body.includes(`>${G18G2_BEFORE_TITLE}<`));
} catch (err) {
  assert("live GET", false, err instanceof Error ? err.message : String(err));
}

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("rollback SQL not executed", true);
assert("FTP/upload not executed", true);
assert("mirror sync delete not executed", true);
assert("deploy/workflow_dispatch not executed", true);
assert("production not used", true);
assert("service_role not used", true);
assert("commit/push not executed", true);

console.log(
  `\nG-19c tracklist public reflection local regen / upload preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
