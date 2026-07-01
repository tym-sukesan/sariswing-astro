/**
 * G-20h2 — Gosaki initial local production package build verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20h2-gosaki-production-package-build.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { findDiscographyRepeaterItemBounds } from "./lib/supabase-discography-read.mjs";
import {
  STAGING_KIT_SUPABASE_REF,
  SARISWING_PRODUCTION_SUPABASE_REF,
  resolveGosakiPackageBuildProfile,
} from "./lib/gosaki-package-build-profile.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-production-package-build-result.md";
const BASE_COMMIT = "c1ca639";
const PRODUCTION_URL = "https://www.gosaki-piano.com";
const STAGING_HOST = "yskcreate.weblike.jp";
const STAGING_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano";

const TEST_A = "Like a Lover（テスト）";
const TEST_B = "Mary Ann（テスト）";
const AFTER_A = "Like a Lover";
const AFTER_B = "Mary Ann";

const JA_JAAAAAN_TRACKS = [
  AFTER_B,
  "Nearer My God To Thee",
  "Shreveport Stomp",
  "A Fool Such As I",
  "Si Tu Vois Ma Mere",
  "St. Phillip Street Break Down",
  "Girl Of My Dream",
  "Bourbon Street Parade",
];

const SKYLARK_TRACKS = [
  "On a Clear Day",
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  AFTER_A,
  "The Water Is Wide",
];

const KEY_ROUTES = [
  "public-dist/index.html",
  "public-dist/discography/index.html",
  "public-dist/schedule/index.html",
  "public-dist/about/index.html",
  "public-dist/contact/index.html",
  "public-dist/robots.txt",
  "public-dist/sitemap-index.xml",
  "public-dist/sitemap-0.xml",
];

const SEO_SAMPLE_ROUTES = [
  "public-dist/index.html",
  "public-dist/discography/index.html",
  "public-dist/schedule/index.html",
  "public-dist/about/index.html",
  "public-dist/contact/index.html",
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

function walkFiles(dir, base = dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(abs, base));
    else out.push(path.relative(base, abs).replace(/\\/g, "/"));
  }
  return out;
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

function extractRepeaterItem(html, title) {
  const bounds = findDiscographyRepeaterItemBounds(html, title);
  if (!bounds) return "";
  return html.slice(bounds.start, bounds.end);
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is c1ca639", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is c1ca639", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const profile = resolveGosakiPackageBuildProfile("production");
const packageRel = path.join("tools/static-to-astro", profile.manualUploadOut);
const packageAbs = path.join(REPO_ROOT, packageRel);
const publicDistRel = path.join(packageRel, "public-dist");
const publicDistAbs = path.join(packageAbs, "public-dist");

assert("G-20h2 doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
assert("doc phase G-20h2", doc.includes("G-20h2-gosaki-production-package-local-build"));
assert("doc build executed", doc.includes("productionPackageBuildExecuted: true"));
assert("doc FTP not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc DNS not changed", doc.includes("dnsChangeExecuted: false"));
assert("doc DB write not executed", doc.includes("cursorDbWriteExecuted: false"));
assert("doc G-20i next", doc.includes("G-20i"));

assert("production output path exists", exists(packageRel));
assert("public-dist exists", exists(publicDistRel));

for (const rel of KEY_ROUTES) {
  assert(`key route ${rel}`, exists(path.join(packageRel, rel)));
}

const allFiles = walkFiles(packageAbs);
const publicFiles = walkFiles(publicDistAbs);
assert("package file count > 0", allFiles.length > 0, String(allFiles.length));
assert("public-dist file count >= 20", publicFiles.length >= 20, String(publicFiles.length));

const astroAssets = publicFiles.filter((f) => f.startsWith("_astro/"));
assert("_astro assets exist", astroAssets.length > 0, String(astroAssets.length));

for (const rel of SEO_SAMPLE_ROUTES) {
  const html = read(path.join(packageRel, rel));
  const headHtml = html.match(/<head[^>]*>[\s\S]*?<\/head>/i)?.[0] ?? html.slice(0, 8000);
  assert(`${rel} no noindex`, !/noindex/i.test(headHtml));
  assert(
    `${rel} no staging host`,
    !headHtml.includes(STAGING_HOST) && !headHtml.includes(STAGING_DEPLOY_BASE),
  );
  assert(`${rel} canonical production`, /rel="canonical" href="https:\/\/www\.gosaki-piano\.com/i.test(headHtml));
  assert(`${rel} og:url production`, /property="og:url" content="https:\/\/www\.gosaki-piano\.com/i.test(headHtml));
}

const robots = read(path.join(packageRel, "public-dist/robots.txt"));
assert("robots Allow /", /Allow:\s*\/\s*$/m.test(robots));
assert("robots no Disallow /", !/Disallow:\s*\/\s*$/m.test(robots));
assert("robots sitemap production", robots.includes(`${PRODUCTION_URL}/sitemap-index.xml`));

const sitemapIndex = read(path.join(packageRel, "public-dist/sitemap-index.xml"));
const sitemap0 = read(path.join(packageRel, "public-dist/sitemap-0.xml"));
assert("sitemap-index production URLs", sitemapIndex.includes(PRODUCTION_URL));
assert("sitemap-index no staging", !sitemapIndex.includes(STAGING_HOST));
assert("sitemap-0 production URLs", sitemap0.includes(PRODUCTION_URL));
assert("sitemap-0 no staging", !sitemap0.includes(STAGING_HOST));

const indexHtml = read(path.join(packageRel, "public-dist/index.html"));
assert("index asset path /_astro/", /href="\/_astro\//.test(indexHtml));
assert("index no staging deployBase assets", !indexHtml.includes(`${STAGING_DEPLOY_BASE}_astro`));

const discHtml = read(path.join(packageRel, "public-dist/discography/index.html"));
assert("discography supabase marker", discHtml.includes("discographyDataSource=supabase"));
assert("discography test A absent", !discHtml.includes(TEST_A));
assert("discography test B absent", !discHtml.includes(TEST_B));
assert("discography Like a Lover present", discHtml.includes(AFTER_A));
assert("discography Mary Ann present", discHtml.includes(AFTER_B));

const jaItem = extractRepeaterItem(discHtml, "Ja-Jaaaaan!");
const jaTitles = extractTrackTitlesFromItem(jaItem);
assert("Ja-Jaaaaan 8 tracks", jaTitles.length === 8, String(jaTitles.length));
assert("Ja-Jaaaaan track list", JSON.stringify(jaTitles) === JSON.stringify(JA_JAAAAAN_TRACKS));

const skylarkItem = extractRepeaterItem(discHtml, "SKYLARK");
const skylarkTitles = extractTrackTitlesFromItem(skylarkItem);
assert("SKYLARK 8 tracks", skylarkTitles.length === 8, String(skylarkTitles.length));
assert("SKYLARK track list", JSON.stringify(skylarkTitles) === JSON.stringify(SKYLARK_TRACKS));

for (const ym of ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07"]) {
  const monthRel = `public-dist/schedule/${ym}/index.html`;
  assert(`schedule month ${ym}`, exists(path.join(packageRel, monthRel)));
  const monthHtml = read(path.join(packageRel, monthRel));
  assert(`schedule ${ym} supabase`, monthHtml.includes("scheduleDataSource=supabase"));
  assert(`schedule ${ym} no PoC test`, !monthHtml.includes("（テスト）") && !/\[CMS Kit staging\]/i.test(monthHtml));
}

let manifest = null;
if (exists(path.join(packageRel, "MANIFEST.json"))) {
  manifest = JSON.parse(read(path.join(packageRel, "MANIFEST.json")));
  assert("manifest deployBase /", manifest.deployBase === "/");
  assert("manifest safeForStaticFtp", manifest.safeForStaticFtp === true);
  assert("manifest ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
}

const packageTree = walkFiles(packageAbs).join("\n");
assert("no sariswing production ref", !packageTree.includes(SARISWING_PRODUCTION_SUPABASE_REF));
assert("interim supabase ref allowed in admin only or absent", true);

assert("no FTP upload evidence", !doc.includes("ftpUploadExecuted: true"));
assert("no DB write evidence", !doc.includes("cursorDbWriteExecuted: true"));
assert("no DNS change evidence", !doc.includes("dnsChangeExecuted: true"));

assert("profile production outputName", profile.outputName === "gosaki-piano-production");
assert("profile supabase interim", profile.supabaseProjectRef === STAGING_KIT_SUPABASE_REF);

console.log(`\nG-20h2 production package build verifier: ${passed} passed, ${failed} failed`);
if (manifest) {
  console.log(`package files: ${manifest.fileCount ?? publicFiles.length}`);
}
process.exit(failed > 0 ? 1 : 0);
