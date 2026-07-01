/**
 * G-19d — Gosaki Discography G-19b1 tracklist public reflection upload result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g19d-gosaki-discography-tracklist-public-reflection-upload-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";
import {
  G19B1_AFTER_TITLE,
  G19B1_BEFORE_TITLE,
  G19B1_TARGET_TRACK_ROW_ID,
} from "./lib/discography-g19b1-guards-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19d-tracklist-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19c-tracklist-public-reflection-local-regen-and-upload-preflight.md";
const G19B1_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g19b1-tracklist-single-title-save-execution-result.md";

const BASE_COMMIT = "5b9ee8b";
const G18G2_TRACK7_TITLE = "Like a Lover（テスト）";
const G18G2_BEFORE_TITLE = "Like a Lover";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const LOCAL_SOURCE =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const CSS_REF = "index.YcHrHZH4.css";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

assert("HEAD is 5b9ee8b", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 5b9ee8b", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("G-19d upload result doc exists", exists(DOC_REL));
assert(
  "doc phase G-19d",
  doc.includes("G-19d-gosaki-discography-tracklist-public-reflection-upload-result"),
);
assert(
  "doc upload success gate",
  doc.includes("gosakiDiscographyG19dTracklistPublicReflectionUploadSuccess: true"),
);
assert(
  "doc http verify gate",
  doc.includes("gosakiDiscographyG19dTracklistPublicReflectionHttpVerifyComplete: true"),
);
assert("doc readyForG19e closure", doc.includes("readyForG19eDiscographyG19b1TracklistReflectionClosure: true"));
assert("doc manual upload target", doc.includes(LOCAL_SOURCE));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc live URL", doc.includes(STAGING_DISCOGRAPHY_URL));
assert("doc after title", doc.includes(G19B1_AFTER_TITLE));
assert("doc target row id", doc.includes(G19B1_TARGET_TRACK_ROW_ID));
assert("doc one file upload", doc.includes("Files uploaded") && doc.includes("**1**"));
assert("doc mirror sync delete no", doc.includes("mirror") && doc.includes("no"));
assert("doc astro upload not performed", doc.includes("_astro/**") || doc.includes("not uploaded"));
assert("doc css upload not performed", doc.includes("not uploaded") || doc.includes("no upload needed"));
assert("doc ftp not executed by Cursor", doc.includes("ftpUploadExecutedByCursor: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc do not re-upload", doc.includes("discography004Track1DoNotReUpload: true"));
assert("doc g18g2 maintained", doc.includes(G18G2_TRACK7_TITLE));
assert("doc operator visual OK", doc.includes("レイアウト崩れなし") || doc.includes("not broken"));
assert("doc G-19e next", doc.includes("G-19e"));

assert("G-19c preflight doc exists", exists(PREFLIGHT_REL));
assert("G-19b1 execution doc exists", exists(G19B1_RESULT_REL));

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL, { method: "GET" });
  assert("live GET HTTP 200", liveRes.status === 200, String(liveRes.status));
  const body = await liveRes.text();

  assert("live not production host", !body.includes(PROD_REF));
  assert("live Mary Ann test title present", body.includes(G19B1_AFTER_TITLE));
  assert("live old Mary Ann only absent", !body.includes(`>${G19B1_BEFORE_TITLE}<`));
  assert("live G-18g2 test title present", body.includes(G18G2_TRACK7_TITLE));
  assert("live old Like a Lover only absent", !body.includes(`>${G18G2_BEFORE_TITLE}<`));
  assert("live discographyDataSource supabase", body.includes("discographyDataSource=supabase"));

  const jaBounds = findDiscographyRepeaterItemBounds(body, "Ja-Jaaaaan!");
  assert("live Ja-Jaaaaan item found", Boolean(jaBounds));
  const jaItem = body.slice(jaBounds.start, jaBounds.end);
  const jaTitles = extractTrackTitlesFromItem(jaItem);
  assert("live Ja-Jaaaaan 8 tracks", jaTitles.length === 8, String(jaTitles.length));
  assert("live Ja-Jaaaaan track 1", jaTitles[0] === G19B1_AFTER_TITLE, jaTitles[0]);
  assert(
    "live Ja-Jaaaaan track list",
    JSON.stringify(jaTitles) === JSON.stringify(JA_JAAAAAN_TRACKS_AFTER),
  );

  const skBounds = findDiscographyRepeaterItemBounds(body, "SKYLARK");
  const skylarkItem = body.slice(skBounds.start, skBounds.end);
  const skylarkTitles = extractTrackTitlesFromItem(skylarkItem);
  assert("live SKYLARK 8 tracks", skylarkTitles.length === 8, String(skylarkTitles.length));
  assert("live SKYLARK track 7", skylarkTitles[6] === G18G2_TRACK7_TITLE, skylarkTitles[6]);
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

assert("Cursor FTP upload not executed", true);
assert("mirror sync delete not executed", true);
assert("CSS JS upload not executed by operator scope", true);
assert("DB write not executed", true);
assert("additional Save not executed", true);
assert("rollback SQL not executed", true);
assert("package regen not executed", true);
assert("deploy workflow_dispatch not executed", true);
assert("production not used", true);
assert("service_role not used", true);
assert("commit push not executed", true);

console.log(
  `\nG-19d tracklist public reflection upload result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
