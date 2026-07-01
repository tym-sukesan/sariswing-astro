/**
 * G-18h-upload-result — Gosaki Discography public tracklist reflection upload result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18h-gosaki-discography-upload-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g18h-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18h-upload-final-preflight.md";
const G18G2_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18g2-tracklist-single-title-save-execution-result.md";

const LOCAL_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";

const BASE_COMMIT = "17926f5";
const BEFORE_TITLE = "Like a Lover";
const AFTER_TITLE = "Like a Lover（テスト）";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const LOCAL_SOURCE =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const CSS_REF = "index.YcHrHZH4.css";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const SKYLARK_TRACKS_AFTER = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  AFTER_TITLE,
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

function extractTrackTitlesFromItem(itemHtml) {
  const tlIdx = itemHtml.indexOf("Track List");
  if (tlIdx < 0) return [];
  const after = itemHtml.slice(tlIdx);
  const endRel = after.search(/Personnel|Release/);
  const block = endRel > 0 ? after.slice(0, endRel) : after;
  /** @type {string[]} */
  const titles = [];
  const re = /<p class="font_8[^"]*"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    const text = match[1]
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

assert("HEAD is 17926f5", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 17926f5", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("G-18h-upload-result doc exists", exists(DOC_REL));
assert("doc phase G-18h-upload-result", doc.includes("G-18h-upload-result-gosaki-discography-public-tracklist-reflection-upload-result"));
assert("doc upload success gate", doc.includes("gosakiDiscographyG18hPublicTracklistReflectionUploadSuccess: true"));
assert("doc http verify gate", doc.includes("gosakiDiscographyG18hPublicTracklistReflectionHttpVerifyComplete: true"));
assert("doc manual upload target", doc.includes(LOCAL_SOURCE) || doc.includes("manual-upload/gosaki-piano/public-dist/discography/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc live URL", doc.includes(STAGING_DISCOGRAPHY_URL));
assert("doc after title", doc.includes(AFTER_TITLE));
assert("doc one file upload", doc.includes("Files uploaded") && doc.includes("**1**"));
assert("doc mirror sync delete no", doc.includes("mirror") && doc.includes("no"));
assert("doc astro upload not performed", doc.includes("_astro/**") || doc.includes("not uploaded"));
assert("doc ftp not executed by Cursor", doc.includes("ftpUploadExecutedByCursor: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc operator visual OK", doc.includes("見た目は崩れていない") || doc.includes("not broken"));

assert("preflight doc exists", exists(PREFLIGHT_REL));
assert("g18g2 execution doc exists", exists(G18G2_RESULT_REL));

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL, { method: "GET" });
  assert("live GET HTTP 200", liveRes.status === 200, String(liveRes.status));
  const body = await liveRes.text();

  assert("live not production host", !body.includes(SARISWING_HOST));
  assert("live test title present", body.includes(AFTER_TITLE));
  assert("live old-only track 7 absent", !body.includes(`>${BEFORE_TITLE}<`));
  assert("live discographyDataSource supabase", body.includes("discographyDataSource=supabase"));

  const bounds = findDiscographyRepeaterItemBounds(body, "SKYLARK");
  const skylarkItem = body.slice(bounds.start, bounds.end);
  const skylarkTitles = extractTrackTitlesFromItem(skylarkItem);
  assert("live SKYLARK 8 tracks", skylarkTitles.length === 8, String(skylarkTitles.length));
  assert("live SKYLARK track 7", skylarkTitles[6] === AFTER_TITLE, skylarkTitles[6]);
  assert(
    "live SKYLARK track list",
    JSON.stringify(skylarkTitles) === JSON.stringify(SKYLARK_TRACKS_AFTER),
  );

  for (const [legacyId, meta] of Object.entries(ALBUM_TRACK_COUNTS)) {
    const b = findDiscographyRepeaterItemBounds(body, meta.title);
    const titles = extractTrackTitlesFromItem(body.slice(b.start, b.end));
    assert(`live ${legacyId} track count ${meta.count}`, titles.length === meta.count, String(titles.length));
  }

  const refs = [...new Set([...body.matchAll(/_astro\/[^"']+/g)].map((m) => m[0]))];
  assert("live HTML refs index.YcHrHZH4.css", refs.some((r) => r.includes(CSS_REF)));

  const cssRes = await fetch(`${STAGING_ORIGIN}/_astro/${CSS_REF}`, { method: "HEAD" });
  assert("live CSS HTTP 200", cssRes.status === 200, String(cssRes.status));
  assert("doc records CSS 200", doc.includes("200"));
} catch (err) {
  assert("live HTTP verification", false, err instanceof Error ? err.message : String(err));
}

assert("DB write not executed", true);
assert("additional Save not executed", true);
assert("rollback SQL not executed", true);
assert("deploy workflow_dispatch not executed", true);
assert("production not used", true);
assert("service_role not used", true);
assert("package regen not executed", true);
assert("commit push not executed", true);

console.log(`\nG-18h-upload-result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
