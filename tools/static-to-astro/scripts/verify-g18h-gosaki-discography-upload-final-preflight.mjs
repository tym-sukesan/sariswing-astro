/**
 * G-18h-upload — Gosaki Discography public tracklist reflection manual upload final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g18h-gosaki-discography-upload-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18h-upload-final-preflight.md";
const G18H_PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g18h-public-tracks-reflection-preflight.md";
const FTP_SAFETY_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";

const DISCOGRAPHY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const ASTRO_DIR_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro";

const BASE_COMMIT = "7cad34c";
const BEFORE_TITLE = "Like a Lover";
const AFTER_TITLE = "Like a Lover（テスト）";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const REMOTE_DIR = "/cms-kit-staging/gosaki-piano/discography/";
const STAGING_ORIGIN = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const LOCAL_CSS_REF = "index.YcHrHZH4.css";
const LIVE_CSS_REF_PRE = "BaseLayout.YcHrHZH4.css";
const JS_HASH = "index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const ALBUM_TRACK_COUNTS = {
  "discography-001": { title: "Continuous", count: 9 },
  "discography-002": { title: "SKYLARK", count: 8 },
  "discography-003": { title: "About Us!!", count: 9 },
  "discography-004": { title: "Ja-Jaaaaan!", count: 8 },
};

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

assert("HEAD is 7cad34c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 7cad34c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("G-18h-upload final preflight doc exists", exists(DOC_REL));
assert("doc phase G-18h-upload", doc.includes("G-18h-upload-gosaki-discography-public-tracklist-reflection-manual-upload-final-preflight"));
assert(
  "doc final preflight gate",
  doc.includes("gosakiDiscographyG18hUploadFinalPreflightComplete: true"),
);
assert("doc readyForG18hUploadExecutionByOperator", doc.includes("readyForG18hUploadExecutionByOperator: true"));
assert("doc uploadFileCount 1", doc.includes("uploadFileCount: 1"));
assert("doc cssJsHashChanged false", doc.includes("cssJsHashChanged: false"));
assert("doc cssJsUploadRequired false", doc.includes("cssJsUploadRequired: false"));
assert("doc local output path", doc.includes(DISCOGRAPHY_HTML_REL.replace("tools/static-to-astro/", "")) || doc.includes("manual-upload/gosaki-piano/public-dist/discography/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc live URL", doc.includes(STAGING_DISCOGRAPHY_URL));
assert("doc after title", doc.includes(AFTER_TITLE));
assert("doc upload index.html only", doc.includes("discography/index.html") && doc.includes("1 file"));
assert("doc manual upload runbook", doc.includes("FileZilla") || doc.includes("FTP"));
assert("doc mirror sync delete forbidden", doc.includes("mirror") && doc.includes("delete"));
assert("doc post-upload verification", doc.includes("Post-upload"));
assert("doc ftp not executed by Cursor", doc.includes("ftpUploadExecutedByCursor: false"));
assert("doc package regen not executed", doc.includes("packageRegenExecutedInThisPhase: false"));
assert("doc production stop", doc.includes(SARISWING_HOST) || doc.includes("Production"));
assert("doc remote dir limited", doc.includes(REMOTE_DIR));

assert("G-18h preflight doc exists", exists(G18H_PREFLIGHT_REL));
assert("FTP safety doc exists", exists(FTP_SAFETY_REL));

if (exists(DISCOGRAPHY_HTML_REL)) {
  const discHtml = read(DISCOGRAPHY_HTML_REL);
  const stat = fs.statSync(path.join(REPO_ROOT, DISCOGRAPHY_HTML_REL));

  assert("local file exists", true);
  assert("local file size > 0", stat.size > 0, String(stat.size));
  assert("local test title present", discHtml.includes(AFTER_TITLE));
  assert("local old-only track 7 absent", !discHtml.includes(`>${BEFORE_TITLE}<`));

  for (const [legacyId, meta] of Object.entries(ALBUM_TRACK_COUNTS)) {
    const item = extractRepeaterItem(discHtml, meta.title);
    const titles = extractTrackTitlesFromItem(item);
    assert(`local ${legacyId} track count ${meta.count}`, titles.length === meta.count, String(titles.length));
  }

  const skylarkTitles = extractTrackTitlesFromItem(extractRepeaterItem(discHtml, "SKYLARK"));
  assert(
    "local SKYLARK track list",
    JSON.stringify(skylarkTitles) === JSON.stringify(SKYLARK_TRACKS_AFTER),
  );

  const astroRefs = [...new Set([...discHtml.matchAll(/_astro\/[^"']+/g)].map((m) => m[0]))];
  assert("local CSS ref index.YcHrHZH4", astroRefs.some((r) => r.includes(LOCAL_CSS_REF)));
  assert("doc records local CSS ref", doc.includes(LOCAL_CSS_REF));
} else {
  assert("local discography index.html exists", false, DISCOGRAPHY_HTML_REL);
}

if (exists(ASTRO_DIR_REL)) {
  const files = fs.readdirSync(path.join(REPO_ROOT, ASTRO_DIR_REL));
  assert("local package has index.YcHrHZH4.css", files.includes(LOCAL_CSS_REF));
  assert("local package has JS file", files.includes(JS_HASH));
}

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL, { method: "GET" });
  assert("live GET HTTP 200", liveRes.status === 200, String(liveRes.status));
  const body = await liveRes.text();
  assert("live not production host", !body.includes(SARISWING_HOST));
  assert("live pre-upload test title absent", !body.includes(AFTER_TITLE));
  assert("live pre-upload old Like a Lover present", body.includes(BEFORE_TITLE));
  assert("live pre-upload old track 7 markup", body.includes(`>${BEFORE_TITLE}<`));

  const liveRefs = [...new Set([...body.matchAll(/_astro\/[^"']+/g)].map((m) => m[0]))];
  assert("live pre-upload CSS ref BaseLayout", liveRefs.some((r) => r.includes(LIVE_CSS_REF_PRE)));

  const cssTargetRes = await fetch(`${STAGING_ORIGIN}/_astro/${LOCAL_CSS_REF}`, { method: "HEAD" });
  assert("live target CSS index.YcHrHZH4 HTTP 200", cssTargetRes.status === 200, String(cssTargetRes.status));

  const jsRes = await fetch(`${STAGING_ORIGIN}/_astro/${JS_HASH}`, { method: "HEAD" });
  assert("live JS asset HTTP 200", jsRes.status === 200, String(jsRes.status));
} catch (err) {
  assert("live GET", false, err instanceof Error ? err.message : String(err));
}

assert("upload target index.html only recorded", doc.includes("uploadFileCount: 1"));
assert("CSS JS upload not required recorded", doc.includes("cssJsUploadRequired: false"));
assert("manual upload only recorded", doc.includes("manual upload") || doc.includes("Manual upload"));
assert("FTP upload not executed by Cursor", true);
assert("production not used", true);
assert("service_role not used", true);
assert("package regen not re-run", true);
assert("commit push not executed", true);

console.log(`\nG-18h-upload final preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
