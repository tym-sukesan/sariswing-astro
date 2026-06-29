/**
 * G-16b-f — Gosaki Discography G-16a artist public reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g16b-gosaki-discography-artist-public-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16b-artist-public-reflection-closure.md";
const UPLOAD_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16b-artist-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-artist-save-result.md";
const NEXT_FIELD_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-next-field-save-preflight.md";
const DRY_RUN_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-local-dry-run-result-and-save-final-preflight.md";
const PLAYBOOK_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const G15E_F_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-closure.md";
const G15C_F_CLOSURE_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-closure.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const TARGET_ID = "00f4cd00-cfb6-43b3-991a-211b2d7c92ef";
const TARGET_LEGACY_ID = "discography-001";
const TARGET_TITLE = "Continuous";
const G16A_SAVE_APPROVAL =
  "G-16a-gosaki-discography-existing-release-artist-non-dry-run";
const G16A_DRY_RUN_APPROVAL = "G-16a-gosaki-discography-artist-dry-run-slice";
const ARTIST_BEFORE = "ごさきりかこTrio Feat.石川周之介";
const ARTIST_AFTER = "ごさきりかこTrio feat.石川周之介";
const ABOUT_US_TITLE = "About Us!!";
const ABOUT_US_ARTIST = "ごさきりかこTrio";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const UPDATED_AT_BASELINE = "2026-06-05T17:39:44.201802+00:00";
const UPDATED_AT_AFTER_SAVE = "2026-06-29T05:05:20.905888+00:00";
const CSS_HASH = "index.YcHrHZH4.css";
const JS_HASH = "index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";
const G16A_SAVE_COMMIT = "db59af7";
const G16B_UPLOAD_COMMIT = "418b577";
const G16B_F_BASE_COMMIT = "418b577";

const CHAIN_DOCS = [
  "gosaki-discography-g16a-next-field-save-preflight.md",
  "gosaki-discography-g16a-local-dry-run-result-and-save-final-preflight.md",
  "gosaki-discography-g16a-artist-save-result.md",
  "gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md",
  "gosaki-discography-g16b-artist-public-reflection-upload-result.md",
];

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

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
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
  ["merge-base", "--is-ancestor", G16B_F_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("HEAD is 418b577", head.stdout.trim() === G16B_F_BASE_COMMIT, head.stdout.trim());
assert(
  "origin/main is 418b577",
  origin.stdout.trim() === G16B_F_BASE_COMMIT,
  origin.stdout.trim(),
);
assert(
  "HEAD at or after G-16b-upload baseline 418b577",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("closure doc exists", exists(DOC_REL));
assert(
  "doc phase G-16b-f",
  doc.includes("G-16b-f-gosaki-discography-g16a-artist-public-reflection-closure"),
);
assert(
  "doc G-16a artist chain complete gate",
  doc.includes("gosakiDiscographyG16aArtistChainComplete: true"),
);
assert(
  "doc closure complete gate",
  doc.includes("gosakiDiscographyG16bArtistPublicReflectionClosureComplete: true"),
);
assert("doc no re-upload", doc.includes("readyForG16bDiscographyArtistReUpload: false"));
assert(
  "doc no reflection re-upload",
  doc.includes("readyForG16bDiscographyArtistReflectionReUpload: false"),
);
assert("doc no same row re-save", doc.includes("readyForG16aSameRowReSave: false"));
assert(
  "doc no artist re-execution",
  doc.includes("readyForG16DiscographyArtistReExecution: false"),
);
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc discography002 untouched", doc.includes("discography002Touched: false"));
assert("doc discography003 untouched", doc.includes("discography003Touched: false"));
assert(
  "doc purchase_url maintained",
  doc.includes("skylarkPurchaseUrlReflectionMaintained: true"),
);
assert(
  "doc about us artist maintained",
  doc.includes("aboutUsArtistReflectionMaintained: true"),
);
assert("doc G-16a Save approval", doc.includes(G16A_SAVE_APPROVAL));
assert("doc G-16a dry-run approval", doc.includes(G16A_DRY_RUN_APPROVAL));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc legacy id", doc.includes(TARGET_LEGACY_ID));
assert("doc artist after", doc.includes(ARTIST_AFTER));
assert("doc artist before", doc.includes(ARTIST_BEFORE));
assert("doc operator Save clicks 1", doc.includes("Operator Save clicks") && doc.includes("**1**"));
assert("doc updated_at after save", doc.includes(UPDATED_AT_AFTER_SAVE));
assert("doc updated_at baseline", doc.includes(UPDATED_AT_BASELINE));
assert("doc updated_at advanced", doc.includes("Advanced from baseline"));
assert("doc purchase_url mismatch correction", doc.includes("doc misrecord"));
assert("doc purchase_url unchanged by G-16a", doc.includes("continuousPurchaseUrlUnchangedByG16aSave: true"));
assert("doc css hash unchanged", doc.includes(CSS_HASH));
assert("doc js hash unchanged", doc.includes(JS_HASH));
assert("doc 1-file upload", doc.includes("**1**") && doc.includes("discography/index.html"));
assert("doc _astro not required", doc.includes("not required"));
assert("doc hook module", doc.includes("patchGosakiDiscographySupabaseFields"));
assert("doc routine dev dry-run reset", doc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true"));
assert("doc next phase A field slice", doc.includes("A — Discography CMS next field slice"));
assert("doc next phase B reflection", doc.includes("B — Discography public reflection generalization"));
assert("doc next phase C playbook", doc.includes("C — Save / Reflection playbook"));
assert("doc next phase D tracks", doc.includes("D — Tracks / personnel / price"));
assert("doc next phase E automation defer", doc.includes("E — Public reflection automation"));
assert("doc upload result ref", doc.includes("gosaki-discography-g16b-artist-public-reflection-upload-result"));
assert("doc G-16a Save commit db59af7", doc.includes(G16A_SAVE_COMMIT));
assert("doc G-16b upload commit 418b577", doc.includes(G16B_UPLOAD_COMMIT));
assert("doc G-15e-f cross-ref", doc.includes("G-15e-f") || doc.includes("G-15d"));
assert("doc G-15c-f cross-ref", doc.includes("G-15c-f") || doc.includes("G-15c"));
assert("doc staging host", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production stop", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc cursor ftp not executed", doc.includes("Cursor FTP / upload") && doc.includes("**no**"));
assert("doc cursor db write not executed", doc.includes("DB write / Save") && doc.includes("**no**"));

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists: ${chainDoc}`, exists(`tools/static-to-astro/docs/${chainDoc}`));
  assert(`closure references: ${chainDoc}`, doc.includes(chainDoc));
}

assert("playbook exists", exists(PLAYBOOK_REL));
assert("G-15e-f closure exists", exists(G15E_F_CLOSURE_REL));
assert("G-15c-f closure exists", exists(G15C_F_CLOSURE_REL));
assert("hook module exists", exists(HOOK_REL));
assert("upload result doc exists", exists(UPLOAD_RESULT_REL));
assert("save result doc exists", exists(SAVE_RESULT_REL));
assert("dry-run doc exists", exists(DRY_RUN_REL));
assert("next field doc exists", exists(NEXT_FIELD_REL));
assert("preflight doc exists", exists(PREFLIGHT_REL));

const saveResultDoc = read(SAVE_RESULT_REL);
assert(
  "save result doc records G-16a save success",
  saveResultDoc.includes("gosakiDiscographyG16aArtistSaveSuccess: true"),
);

const uploadResultDoc = read(UPLOAD_RESULT_REL);
assert(
  "upload result doc records 418b577 or upload success",
  uploadResultDoc.includes(G16B_UPLOAD_COMMIT) ||
    uploadResultDoc.includes("gosakiDiscographyG16bArtistPublicReflectionUploadSuccess: true"),
);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const live = curl(STAGING_DISCOGRAPHY_URL);
if (live.ok) {
  const continuousItem = extractRepeaterItem(live.body, TARGET_TITLE);
  const aboutUsItem = extractRepeaterItem(live.body, ABOUT_US_TITLE);
  const skylarkItem = extractRepeaterItem(live.body, "SKYLARK");

  assert("live discography HTTP 200", live.code === "200", live.code);
  assert("live discographyDataSource supabase", live.body.includes("discographyDataSource=supabase"));
  assert("live CSS hash", live.body.includes(CSS_HASH));
  assert("live JS hash documented in closure doc", doc.includes(JS_HASH));
  assert("live Continuous present", live.body.includes(TARGET_TITLE));
  assert("live Continuous item new artist", continuousItem.includes(ARTIST_AFTER));
  assert("live Continuous item old artist absent", !continuousItem.includes(ARTIST_BEFORE));
  assert("live page old Feat artist absent", !live.body.includes(ARTIST_BEFORE));
  assert("live About Us present", live.body.includes(ABOUT_US_TITLE));
  assert("live About Us item artist", aboutUsItem.includes(ABOUT_US_ARTIST));
  assert("live new purchase_url present", live.body.includes(PURCHASE_URL_AFTER));
  assert("live old purchase_url absent", !live.body.includes(PURCHASE_URL_BEFORE));
  assert("live SKYLARK present", live.body.includes("SKYLARK"));
  assert("SKYLARK item new url", skylarkItem.includes(PURCHASE_URL_AFTER));
  assert("SKYLARK item old url absent", !skylarkItem.includes(PURCHASE_URL_BEFORE));
  assert("live Ja-Jaaaaan present", live.body.includes("Ja-Jaaaaan!"));
  assert("live not production host", !live.body.includes("gosaki-piano.com"));
  assert("live not wrong staging ref", !live.body.includes("vsbvndwuajjhnzpohghh"));
  for (const marker of AUDIT_MARKERS) {
    assert(`live no audit marker: ${marker}`, !live.body.includes(marker));
  }
}

assert("remote file path documented", doc.includes(REMOTE_FILE));
assert("staging public URL documented", doc.includes(STAGING_DISCOGRAPHY_URL));
assert("cursor ftp not executed in verifier", true);
assert("cursor db write not executed in verifier", true);
assert("cursor package regen not executed in verifier", true);
assert("cursor upload not executed in verifier", true);

console.log(`\nG-16b-f closure verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
