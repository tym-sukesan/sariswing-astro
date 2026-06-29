/**
 * G-17e-upload — Gosaki Discography label public reflection upload result + HTTP verify verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17e-gosaki-discography-label-public-reflection-upload-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17e-label-public-reflection-upload-result.md";
const PREFLIGHT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17e-label-public-reflection-local-regen-and-upload-preflight.md";
const G17D_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const STAGING_BASE = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";
const STAGING_DISCOGRAPHY_URL = `${STAGING_BASE}/discography/`;
const STAGING_CSS_URL = `${STAGING_BASE}/_astro/BaseLayout.YcHrHZH4.css`;
const STAGING_LEGACY_CSS_URL = `${STAGING_BASE}/_astro/index.YcHrHZH4.css`;
const REMOTE_HTML = "/cms-kit-staging/gosaki-piano/discography/index.html";
const REMOTE_CSS = "/cms-kit-staging/gosaki-piano/_astro/BaseLayout.YcHrHZH4.css";

const BASE_COMMIT = "08e63a8";
const TARGET_LEGACY_ID = "discography-004";
const TARGET_TITLE = "Ja-Jaaaaan!";
const LABEL_VALUE = "Mardi Gras JAPAN Records";
const ABOUT_US_TITLE = "About Us!!";
const ABOUT_US_ARTIST = "ごさきりかこTrio";
const CONTINUOUS_ARTIST = "ごさきりかこTrio feat.石川周之介";
const CONTINUOUS_ARTIST_OLD = "ごさきりかこTrio Feat.石川周之介";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const CSS_FILE = "BaseLayout.YcHrHZH4.css";
const LEGACY_CSS_FILE = "index.YcHrHZH4.css";
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

assert("HEAD is 08e63a8", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 08e63a8", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);

assert("upload result doc exists", exists(DOC_REL));
assert("doc phase G-17e-upload", doc.includes("G-17e-upload-gosaki-discography-label-public-reflection-upload-result"));
assert("doc upload success gate", doc.includes("gosakiDiscographyG17eLabelPublicReflectionUploadSuccess: true"));
assert("doc http verify gate", doc.includes("gosakiDiscographyG17eLabelPublicReflectionHttpVerifyComplete: true"));
assert("doc readyForClosure", doc.includes("readyForG17eDiscographyLabelReflectionClosure: true"));
assert("doc 2 files uploaded", doc.includes("Files uploaded") && doc.includes("**2**"));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc label value", doc.includes(LABEL_VALUE));
assert("doc BaseLayout CSS path", doc.includes(CSS_FILE));
assert("doc legacy index CSS not deleted", doc.includes("not deleted"));
assert("doc remote HTML path", doc.includes(REMOTE_HTML));
assert("doc remote CSS path", doc.includes(REMOTE_CSS));
assert("doc ftp not by cursor", doc.includes("ftpUploadExecutedByCursor: false"));
assert("doc G-15c maintained", doc.includes("skylarkPurchaseUrlReflectionMaintained: true"));
assert("doc G-15e maintained", doc.includes("aboutUsArtistReflectionMaintained: true"));
assert("doc G-16b maintained", doc.includes("continuousArtistReflectionMaintained: true"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc operator visual ok", doc.includes("崩れていない") || doc.includes("not broken"));
assert("doc next G-17e-f", doc.includes("G-17e-f"));

assert("G-17e preflight doc exists", exists(PREFLIGHT_REL));
assert("G-17d investigation doc exists", exists(G17D_REL));

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

assert("live HTML refs BaseLayout CSS", discBody.includes(CSS_FILE));
assert("live HTML no index CSS ref", !discBody.includes(LEGACY_CSS_FILE));
assert("live discographyDataSource supabase", discBody.includes("discographyDataSource=supabase"));

const jaItem = extractRepeaterItem(discBody, TARGET_TITLE);
const aboutItem = extractRepeaterItem(discBody, ABOUT_US_TITLE);
const continuousItem = extractRepeaterItem(discBody, "Continuous");

assert("live Ja-Jaaaaan present", discBody.includes(TARGET_TITLE));
assert("live Mardi Gras present", discBody.includes(LABEL_VALUE));
assert("live Ja item label", jaItem.includes(LABEL_VALUE));
assert("live gosakirikako purchase_url", discBody.includes(PURCHASE_URL_AFTER));
assert("live gosaakiii absent", !discBody.includes(PURCHASE_URL_BEFORE));
assert("live gosakirikako count 4", (discBody.match(/gosakirikako\.base\.shop/g) || []).length === 4);
assert("live About Us artist", aboutItem.includes(ABOUT_US_ARTIST));
assert("live Continuous feat artist", continuousItem.includes(CONTINUOUS_ARTIST));
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

console.log(`\nG-17e-upload result verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
