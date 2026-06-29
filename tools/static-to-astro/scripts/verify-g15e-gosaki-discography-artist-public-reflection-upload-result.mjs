/**
 * G-15e-upload — Gosaki Discography artist public reflection upload result + HTTP verify verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15e-gosaki-discography-artist-public-reflection-upload-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-save-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const TARGET_LEGACY_ID = "discography-003";
const TARGET_TITLE = "About Us!!";
const ARTIST_BEFORE = "ごさきりかこtrio";
const ARTIST_AFTER = "ごさきりかこTrio";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const G15E_UPLOAD_BASE_COMMIT = "566d714";

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

const REPEATER_ITEM_START_RE =
  /<div id="comp-llexymga__item-[^"]+" class="[^"]*wixui-repeater__item"/g;

function extractRepeaterItem(html, title) {
  const titleIdx = html.indexOf(title);
  if (titleIdx < 0) return "";

  /** @type {number[]} */
  const starts = [];
  REPEATER_ITEM_START_RE.lastIndex = 0;
  let match;
  while ((match = REPEATER_ITEM_START_RE.exec(html)) !== null) {
    starts.push(match.index);
  }
  if (!starts.length) return "";

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = starts[i + 1] ?? html.length;
    if (titleIdx >= start && titleIdx < end) {
      return html.slice(start, end);
    }
  }
  return "";
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
  ["merge-base", "--is-ancestor", G15E_UPLOAD_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("HEAD is 566d714", head.stdout.trim() === G15E_UPLOAD_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is 566d714",
  origin.stdout.trim() === G15E_UPLOAD_BASE_COMMIT,
  origin.stdout.trim(),
);
assert(
  "HEAD at or after G-15e preflight baseline 566d714",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert(
  "doc phase G-15e-upload",
  doc.includes("G-15e-upload-gosaki-discography-artist-public-reflection-upload-result"),
);
assert(
  "doc upload success gate",
  doc.includes("gosakiDiscographyArtistPublicReflectionUploadSuccess: true"),
);
assert(
  "doc http verify complete gate",
  doc.includes("gosakiDiscographyArtistPublicReflectionHttpVerifyComplete: true"),
);
assert(
  "doc readyForClosure",
  doc.includes("readyForG15eDiscographyArtistReflectionClosure: true"),
);
assert("doc no re-upload gate", doc.includes("readyForG15eDiscographyArtistReUpload: false"));
assert("doc cursor ftp not executed", doc.includes("ftpUploadExecutedByCursor: false"));
assert(
  "doc cursor package regen not executed",
  doc.includes("cursorPackageRegenExecuted: false"),
);
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc artist after Trio", doc.includes(ARTIST_AFTER));
assert("doc artist before", doc.includes(ARTIST_BEFORE));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc 1 file upload", doc.includes("Files uploaded") && doc.includes("**1**"));
assert("doc operator visual", doc.includes("ごさきりかこTrio"));
assert(
  "doc preflight linked",
  doc.includes("gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.md"),
);
assert("doc purchase_url maintained", doc.includes("skylarkPurchaseUrlReflectionMaintained: true"));
assert("doc discographyDataSource supabase", doc.includes("discographyDataSource=supabase"));
assert("doc continuous present", doc.includes("Continuous"));
assert("doc skylark present", doc.includes("SKYLARK"));
assert("doc ja-jaaaaan present", doc.includes("Ja-Jaaaaan!"));
assert("doc staging host", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production stop", doc.includes("vsbvndwuajjhnzpohghh"));

assert("preflight doc exists", fs.existsSync(path.join(REPO_ROOT, PREFLIGHT_REL)));
assert("save result doc exists", fs.existsSync(path.join(REPO_ROOT, SAVE_RESULT_REL)));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const live = curl(STAGING_DISCOGRAPHY_URL);
assert("live curl ok", live.ok);
assert("live HTTP 200", live.code === "200", live.code);

const aboutUsItem = extractRepeaterItem(live.body, TARGET_TITLE);
const skylarkItem = extractRepeaterItem(live.body, "SKYLARK");

assert("live About Us present", live.body.includes(TARGET_TITLE));
assert("live About Us item new artist", aboutUsItem.includes(ARTIST_AFTER));
assert("live About Us item old artist absent", !aboutUsItem.includes(ARTIST_BEFORE));
assert("live page old artist absent", !live.body.includes(ARTIST_BEFORE));
assert("live discographyDataSource supabase", live.body.includes("discographyDataSource=supabase"));
assert("live new purchase_url present", live.body.includes(PURCHASE_URL_AFTER));
assert("live old purchase_url absent", !live.body.includes(PURCHASE_URL_BEFORE));
assert("SKYLARK item new url", skylarkItem.includes(PURCHASE_URL_AFTER));
assert("SKYLARK item old url absent", !skylarkItem.includes(PURCHASE_URL_BEFORE));
assert("live Continuous present", live.body.includes("Continuous"));
assert("live SKYLARK present", live.body.includes("SKYLARK"));
assert("live Ja-Jaaaaan present", live.body.includes("Ja-Jaaaaan!"));
assert("live not production host", !live.body.includes("gosaki-piano.com"));

for (const marker of AUDIT_MARKERS) {
  assert(`live no audit marker: ${marker}`, !live.body.includes(marker));
}

console.log(`\nG-15e-upload result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
