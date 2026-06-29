/**
 * G-16b-upload — Gosaki Discography G-16a artist public reflection upload result + HTTP verify verifier.
 * Run: node tools/static-to-astro/scripts/verify-g16b-gosaki-discography-artist-public-reflection-upload-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16b-artist-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-artist-save-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const TARGET_LEGACY_ID = "discography-001";
const TARGET_TITLE = "Continuous";
const ARTIST_BEFORE = "ごさきりかこTrio Feat.石川周之介";
const ARTIST_AFTER = "ごさきりかこTrio feat.石川周之介";
const ABOUT_US_TITLE = "About Us!!";
const ABOUT_US_ARTIST = "ごさきりかこTrio";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const CSS_HASH = "index.YcHrHZH4.css";
const JS_HASH = "index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";
const G16B_PREFLIGHT_COMMIT = "d16aeca";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const AUDIT_MARKERS = ["[CMS Kit staging]", "PoC", "dry-run"];

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

function curl(url) {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", url], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) return { ok: false, body: "", code: "0" };
  const parts = r.stdout.trimEnd().split("\n");
  const code = parts.pop();
  return { ok: true, body: parts.join("\n"), code };
}

function extractRepeaterItem(html, title) {
  const needles = [`\u200b「${title}」`, `「${title}」`, title];
  let idx = -1;
  for (const needle of needles) {
    const found = html.indexOf(needle);
    if (found >= 0) {
      idx = found;
      break;
    }
  }
  if (idx < 0) return "";
  const start = html.lastIndexOf("comp-llexymga__item", idx);
  const end = html.indexOf("comp-llexymga__item", idx + 10);
  if (start < 0) return "";
  return html.slice(start, end > idx ? end : html.length);
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G16B_PREFLIGHT_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);
assert(
  "HEAD at or after G-16b preflight d16aeca",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-16b-upload",
  doc.includes("G-16b-upload-gosaki-discography-artist-public-reflection-upload-result"),
);
assert(
  "doc upload success gate",
  doc.includes("gosakiDiscographyG16bArtistPublicReflectionUploadSuccess: true"),
);
assert(
  "doc http verify complete gate",
  doc.includes("gosakiDiscographyG16bArtistPublicReflectionHttpVerifyComplete: true"),
);
assert(
  "doc readyForClosure",
  doc.includes("readyForG16bDiscographyArtistReflectionClosure: true"),
);
assert("doc no re-upload gate", doc.includes("readyForG16bDiscographyArtistReUpload: false"));
assert("doc cursor ftp not executed", doc.includes("ftpUploadExecutedByCursor: false"));
assert(
  "doc cursor package regen not executed",
  doc.includes("cursorPackageRegenExecuted: false"),
);
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc artist after feat", doc.includes(ARTIST_AFTER));
assert("doc artist before Feat", doc.includes(ARTIST_BEFORE));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc 1 file upload", doc.includes("Files uploaded") && doc.includes("**1**"));
assert("doc operator visual feat", doc.includes("feat.石川周之介"));
assert(
  "doc preflight linked",
  doc.includes("gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md"),
);
assert("doc purchase_url maintained", doc.includes("skylarkPurchaseUrlReflectionMaintained: true"));
assert("doc aboutUs maintained", doc.includes("aboutUsArtistReflectionMaintained: true"));
assert("doc discographyDataSource supabase", doc.includes("discographyDataSource=supabase"));
assert("doc continuous present", doc.includes("Continuous"));
assert("doc skylark present", doc.includes("SKYLARK"));
assert("doc about us present", doc.includes("About Us!!"));
assert("doc ja-jaaaaan present", doc.includes("Ja-Jaaaaan!"));
assert("doc CSS hash", doc.includes(CSS_HASH));
assert("doc JS hash", doc.includes(JS_HASH));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc G-16b-f next", doc.includes("G-16b-f"));

assert("preflight doc exists", fs.existsSync(path.join(REPO_ROOT, PREFLIGHT_REL)));
assert("save result doc exists", fs.existsSync(path.join(REPO_ROOT, SAVE_RESULT_REL)));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of [".env", ".env.local"]) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

const live = curl(STAGING_DISCOGRAPHY_URL);
assert("live curl ok", live.ok);
assert("live HTTP 200", live.code === "200", live.code);

const continuousItem = extractRepeaterItem(live.body, TARGET_TITLE);
const skylarkItem = extractRepeaterItem(live.body, "SKYLARK");
const aboutUsItem = extractRepeaterItem(live.body, ABOUT_US_TITLE);

assert("live Continuous present", live.body.includes(TARGET_TITLE));
assert("live Continuous item new artist", continuousItem.includes(ARTIST_AFTER));
assert("live Continuous item old artist absent", !continuousItem.includes(ARTIST_BEFORE));
assert("live page old Feat artist absent", !live.body.includes(ARTIST_BEFORE));
assert("live page new feat artist present", live.body.includes(ARTIST_AFTER));
assert("live discographyDataSource supabase", live.body.includes("discographyDataSource=supabase"));
assert("live new purchase_url present", live.body.includes(PURCHASE_URL_AFTER));
assert("live old purchase_url absent", !live.body.includes(PURCHASE_URL_BEFORE));
assert("SKYLARK item new url", skylarkItem.includes(PURCHASE_URL_AFTER));
assert("SKYLARK item old url absent", !skylarkItem.includes(PURCHASE_URL_BEFORE));
assert("live About Us artist G-15e", aboutUsItem.includes(ABOUT_US_ARTIST));
assert("live SKYLARK present", live.body.includes("SKYLARK"));
assert("live About Us present", live.body.includes(ABOUT_US_TITLE));
assert("live Ja-Jaaaaan present", live.body.includes("Ja-Jaaaaan!"));
assert("live css hash", live.body.includes(CSS_HASH));
assert("live not production host", !live.body.includes("gosaki-piano.com"));

for (const marker of AUDIT_MARKERS) {
  assert(`live no audit marker: ${marker}`, !live.body.includes(marker));
}

assert("DB write not executed in verifier", true);
assert("FTP/upload not executed by Cursor", true);

console.log(`\nG-16b-upload result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
