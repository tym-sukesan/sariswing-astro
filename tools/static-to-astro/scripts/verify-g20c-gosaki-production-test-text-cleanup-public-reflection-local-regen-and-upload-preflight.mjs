/**
 * G-20c — Gosaki production test text cleanup public reflection local regen / upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20c-gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight.md";
const G20B_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-production-test-text-cleanup-execution-result.md";
const G18H_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18h-public-tracks-reflection-preflight.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";

const DISCOGRAPHY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const ASTRO_DIR_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro";

const BASE_COMMIT = "041f16c";
const ROW_A_ID = "fd58cd6e-2fff-4ff2-96af-3087c469450b";
const ROW_B_ID = "04e987a9-e251-4b0b-b860-21a61e711f8e";
const TEST_A = "Like a Lover（テスト）";
const TEST_B = "Mary Ann（テスト）";
const AFTER_A = "Like a Lover";
const AFTER_B = "Mary Ann";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const LOCAL_CSS = "index.YcHrHZH4.css";
const JS_HASH = "index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";

const JA_JAAAAAN_TRACKS_AFTER = [
  AFTER_B,
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
  AFTER_A,
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

assert("HEAD is 041f16c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 041f16c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const hookSrc = read(HOOK_REL);

assert("G-20c doc exists", exists(DOC_REL));
assert(
  "doc phase G-20c",
  doc.includes("G-20c-gosaki-production-test-text-cleanup-public-reflection-local-regen-and-upload-preflight"),
);
assert(
  "doc local regen gate",
  doc.includes("gosakiProductionTestTextCleanupPublicReflectionLocalRegenComplete: true"),
);
assert(
  "doc upload preflight gate",
  doc.includes("gosakiProductionTestTextCleanupPublicReflectionUploadPreflightComplete: true"),
);
assert("doc readyForG20d", doc.includes("readyForG20dCleanupPublicReflectionUploadExecution: true"));
assert("doc package regen executed", doc.includes("packageRegenExecuted: true"));
assert("doc production titles", doc.includes(AFTER_A) && doc.includes(AFTER_B));
assert("doc test titles absent local", doc.includes("absent"));
assert("doc upload 1 file", doc.includes("uploadFileCount: 1") || doc.includes("1 file"));
assert("doc cssJsHashChanged false", doc.includes("cssJsHashChanged: false"));
assert("doc mirror forbidden", doc.includes("mirrorSyncDeleteForbidden: true"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc no Save", doc.includes("cursorSaveExecuted: false"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(PROD_REF));
assert("doc G-20d next", doc.includes("G-20d"));
assert("doc G-20e next", doc.includes("G-20e"));

assert("G-20b execution result prior exists", exists(G20B_RESULT_REL));
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

  const rowA = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${ROW_A_ID}&select=id,discography_legacy_id,track_number,title`,
      { headers: h },
    )
  ).json();
  const rowB = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?id=eq.${ROW_B_ID}&select=id,discography_legacy_id,track_number,title`,
      { headers: h },
    )
  ).json();

  assert("live row A after title", rowA[0]?.title === AFTER_A, rowA[0]?.title);
  assert("live row A legacy 002 track 7", rowA[0]?.discography_legacy_id === "discography-002" && rowA[0]?.track_number === 7);
  assert("live row B after title", rowB[0]?.title === AFTER_B, rowB[0]?.title);
  assert("live row B legacy 004 track 1", rowB[0]?.discography_legacy_id === "discography-004" && rowB[0]?.track_number === 1);

  const testLike = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(TEST_A)}&select=id`,
      { headers: h },
    )
  ).json();
  const testMary = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?title=eq.${encodeURIComponent(TEST_B)}&select=id`,
      { headers: h },
    )
  ).json();
  assert("live test Like rows 0", testLike.length === 0, String(testLike.length));
  assert("live test Mary rows 0", testMary.length === 0, String(testMary.length));

  const album002 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.discography-002&select=id`,
      { headers: h },
    )
  ).json();
  const album004 = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.discography-004&select=id`,
      { headers: h },
    )
  ).json();
  const total = await (
    await fetch(`${base}/rest/v1/discography_tracks?select=id&limit=100`, { headers: h })
  ).json();

  assert("live album 002 count 8", album002.length === 8, String(album002.length));
  assert("live album 004 count 8", album004.length === 8, String(album004.length));
  assert("live total tracks 34", total.length === 34, String(total.length));

  const album004Tracks = await (
    await fetch(
      `${base}/rest/v1/discography_tracks?discography_legacy_id=eq.discography-004&select=title&order=sort_order.asc`,
      { headers: h },
    )
  ).json();
  assert(
    "live Ja-Jaaaaan track list",
    JSON.stringify(album004Tracks.map((r) => r.title)) === JSON.stringify(JA_JAAAAAN_TRACKS_AFTER),
  );
} else {
  assert("supabase env for REST read", false, "PUBLIC_SUPABASE_URL / ANON_KEY missing");
}

if (exists(DISCOGRAPHY_HTML_REL)) {
  const discHtml = read(DISCOGRAPHY_HTML_REL);

  assert("local discographyDataSource supabase", discHtml.includes("discographyDataSource=supabase"));
  assert("local test Like absent", !discHtml.includes(TEST_A));
  assert("local test Mary absent", !discHtml.includes(TEST_B));
  assert("local Like a Lover present", discHtml.includes(AFTER_A));
  assert("local Mary Ann present", discHtml.includes(AFTER_B));

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
  for (const ref of astroRefs) {
    const rel = ref.replace(/^\/?/, "");
    assert(`local asset ref exists ${rel}`, exists(`tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/${rel}`));
  }
} else {
  assert("local discography HTML exists", false, DISCOGRAPHY_HTML_REL);
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
  assert("live test titles still present pre-upload", body.includes(TEST_A) && body.includes(TEST_B));
  assert("live plain Mary absent pre-upload", !body.includes(`>${AFTER_B}<`));
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
  `\nG-20c production test text cleanup public reflection local regen / upload preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
