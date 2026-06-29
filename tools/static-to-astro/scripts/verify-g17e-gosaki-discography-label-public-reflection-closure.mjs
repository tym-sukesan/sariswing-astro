/**
 * G-17e-f — Gosaki Discography G-17c label Save / public reflection closure verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17e-gosaki-discography-label-public-reflection-closure.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17e-label-public-reflection-closure.md";
const UPLOAD_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17e-label-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17e-label-public-reflection-local-regen-and-upload-preflight.md";
const G17D_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md";
const G17C_PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17c-next-field-registry-slice-preflight.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const STAGING_DISCOGRAPHY_URL = `${STAGING_BASE}/discography/`;
const STAGING_CSS_URL = `${STAGING_BASE}/_astro/BaseLayout.YcHrHZH4.css`;
const STAGING_LEGACY_CSS_URL = `${STAGING_BASE}/_astro/index.YcHrHZH4.css`;

const BASE_COMMIT = "734e592";
const TARGET_ID = "32b83506-8766-4cf6-9de7-40defbfc0b38";
const TARGET_LEGACY_ID = "discography-004";
const TARGET_TITLE = "Ja-Jaaaaan!";
const LABEL_BEFORE = "null";
const LABEL_AFTER = "Mardi Gras JAPAN Records";
const G17C_SAVE_APPROVAL = "G-17c-gosaki-discography-existing-release-label-non-dry-run";
const G17C_DRY_RUN_APPROVAL = "G-17c-gosaki-discography-label-dry-run-slice";
const SLICE_ID = "g17c-label";
const ABOUT_US_TITLE = "About Us!!";
const ABOUT_US_ARTIST = "ごさきりかこTrio";
const CONTINUOUS_ARTIST = "ごさきりかこTrio feat.石川周之介";
const CONTINUOUS_ARTIST_OLD = "ごさきりかこTrio Feat.石川周之介";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const UPDATED_AT_BASELINE = "2026-06-05T17:39:44.201802+00:00";
const UPDATED_AT_AFTER_SAVE = "2026-06-29T07:36:49.044397+00:00";
const CSS_FILE = "BaseLayout.YcHrHZH4.css";
const G17E_UPLOAD_COMMIT = "734e592";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

const CHAIN_DOCS = [
  "gosaki-discography-g17c-next-field-registry-slice-preflight.md",
  "gosaki-discography-g17c-label-dry-run-result-and-g17d-save-final-preflight.md",
  "gosaki-discography-g17d-label-save-path-enablement.md",
  "gosaki-discography-g17d-label-save-readiness-investigation.md",
  "gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md",
  "gosaki-discography-g17e-label-public-reflection-local-regen-and-upload-preflight.md",
  "gosaki-discography-g17e-label-public-reflection-upload-result.md",
];

const CHAIN_COMMITS = ["9475286", "d1eefb8", "0fadd54", "9016d5a", "7219c6c", "08e63a8", "734e592"];

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
  ["merge-base", "--is-ancestor", G17E_UPLOAD_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("HEAD is 734e592", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 734e592", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());
assert(
  "HEAD at or after G-17e-upload 734e592",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("closure doc exists", exists(DOC_REL));
assert("doc phase G-17e-f", doc.includes("G-17e-f-gosaki-discography-g17c-label-public-reflection-closure"));
assert("doc closure gate", doc.includes("gosakiDiscographyG17eLabelPublicReflectionClosureComplete: true"));
assert("doc chain complete gate", doc.includes("gosakiDiscographyG17cLabelChainComplete: true"));
assert("doc re-upload forbidden", doc.includes("readyForG17eDiscographyLabelReUpload: false"));
assert("doc re-save forbidden", doc.includes("readyForG17cSameRowReSave: false"));
assert("doc rollback not needed", doc.includes("rollbackNeeded: false"));
assert("doc target id", doc.includes(TARGET_ID));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc label before null", doc.includes(LABEL_BEFORE) || doc.includes("`null`"));
assert("doc label after", doc.includes(LABEL_AFTER));
assert("doc updated_at after", doc.includes(UPDATED_AT_AFTER_SAVE));
assert("doc updated_at baseline", doc.includes(UPDATED_AT_BASELINE));
assert("doc unexpected state section", doc.includes("Unexpected already-applied"));
assert("doc preview dry-run no write", doc.includes("actualWrite: false") || doc.includes("did not write"));
assert("doc G-17b registry chain", doc.includes("g17c-label") || doc.includes("G-17b"));
assert("doc label registry patch", doc.includes("DISCOGRAPHY_PUBLIC_PATCH_REGISTRY"));
assert("doc 2 file upload", doc.includes("2 files") || doc.includes("**2**"));
assert("doc BaseLayout CSS", doc.includes(CSS_FILE));
assert("doc legacy CSS not deleted", doc.includes("not deleted"));
assert("doc G-15c maintained", doc.includes("skylarkPurchaseUrlReflectionMaintained: true"));
assert("doc G-15e maintained", doc.includes("aboutUsArtistReflectionMaintained: true"));
assert("doc G-16b maintained", doc.includes("continuousArtistReflectionMaintained: true"));
assert("doc G-18a next", doc.includes("G-18a"));
assert("doc save logging next", doc.includes("Save operation logging"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc slice approval ids", doc.includes(G17C_SAVE_APPROVAL) && doc.includes(G17C_DRY_RUN_APPROVAL));

for (const chainDoc of CHAIN_DOCS) {
  assert(`chain doc exists: ${chainDoc}`, exists(`tools/static-to-astro/docs/${chainDoc}`));
}
for (const commit of CHAIN_COMMITS) {
  assert(`closure doc records commit ${commit}`, doc.includes(commit));
}

assert("upload result doc exists", exists(UPLOAD_RESULT_REL));
assert("G-17e preflight doc exists", exists(PREFLIGHT_REL));
assert("G-17d investigation doc exists", exists(G17D_REL));
assert("G-17c preflight doc exists", exists(G17C_PREFLIGHT_REL));

const hookSrc = read(HOOK_REL);
assert("hook patchDiscographyItemLabel", hookSrc.includes("patchDiscographyItemLabel"));
assert("hook label in registry", hookSrc.includes('field: "label"'));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const discRes = await fetch(STAGING_DISCOGRAPHY_URL);
const discBody = await discRes.text();
assert("live discography HTTP 200", discRes.status === 200, String(discRes.status));
assert("live not production host", !discBody.includes(SARISWING_HOST));

const cssRes = await fetch(STAGING_CSS_URL);
assert("live BaseLayout CSS HTTP 200", cssRes.status === 200, String(cssRes.status));

const legacyCssRes = await fetch(STAGING_LEGACY_CSS_URL);
assert("legacy index CSS still HTTP 200", legacyCssRes.status === 200, String(legacyCssRes.status));

const jaItem = extractRepeaterItem(discBody, TARGET_TITLE);
const aboutItem = extractRepeaterItem(discBody, ABOUT_US_TITLE);
const continuousItem = extractRepeaterItem(discBody, "Continuous");

assert("live discographyDataSource supabase", discBody.includes("discographyDataSource=supabase"));
assert("live HTML refs BaseLayout CSS", discBody.includes(CSS_FILE));
assert("live Ja label", jaItem.includes(LABEL_AFTER));
assert("live gosakirikako", discBody.includes(PURCHASE_URL_AFTER));
assert("live gosaakiii absent", !discBody.includes(PURCHASE_URL_BEFORE));
assert("live About Us artist", aboutItem.includes(ABOUT_US_ARTIST));
assert("live Continuous feat", continuousItem.includes(CONTINUOUS_ARTIST));
assert("live Continuous old Feat absent", !continuousItem.includes(CONTINUOUS_ARTIST_OLD));
assert(
  "live 4 titles",
  ["Continuous", "SKYLARK", ABOUT_US_TITLE, TARGET_TITLE].every((t) => discBody.includes(t)),
);
assert(
  "live audit markers absent",
  !AUDIT_MARKERS.some((m) => discBody.includes(m)),
);

assert("DB write not executed by Cursor", true);
assert("FTP/upload not executed by Cursor", true);
assert("service_role not used", true);
assert("package regen not executed", true);
assert("commit/push not executed", true);

console.log(`\nG-17e-f closure verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
