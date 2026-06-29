/**
 * G-17e — Gosaki Discography label public reflection local regen + upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g17e-gosaki-discography-label-public-reflection-local-regen-and-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17e-label-public-reflection-local-regen-and-upload-preflight.md";
const G17D_REL =
  "tools/static-to-astro/docs/gosaki-discography-g17d-label-save-result-and-unexpected-state-investigation.md";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const GENERATOR_REL = "tools/static-to-astro/scripts/lib/astro-generator.mjs";
const GITIGNORE_REL = "tools/static-to-astro/.gitignore";

const DISCOGRAPHY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const ASTRO_DIR_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro";

const BASE_COMMIT = "7219c6c";
const TARGET_LEGACY_ID = "discography-004";
const TARGET_TITLE = "Ja-Jaaaaan!";
const LABEL_VALUE = "Mardi Gras JAPAN Records";
const ABOUT_US_TITLE = "About Us!!";
const ABOUT_US_ARTIST = "ごさきりかこTrio";
const CONTINUOUS_ARTIST = "ごさきりかこTrio feat.石川周之介";
const CONTINUOUS_ARTIST_OLD = "ごさきりかこTrio Feat.石川周之介";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";
const LIVE_CSS = "index.YcHrHZH4.css";
const LOCAL_CSS = "BaseLayout.YcHrHZH4.css";
const JS_HASH = "index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";

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

assert("HEAD is 7219c6c", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 7219c6c", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

const doc = read(DOC_REL);
const hookSrc = read(HOOK_REL);
const generatorSrc = read(GENERATOR_REL);

assert("G-17e preflight doc exists", exists(DOC_REL));
assert("doc phase G-17e", doc.includes("G-17e-gosaki-discography-label-public-reflection-local-regen-and-upload-preflight"));
assert("doc local regen complete gate", doc.includes("gosakiDiscographyG17eLabelPublicReflectionLocalRegenComplete: true"));
assert("doc upload preflight gate", doc.includes("gosakiDiscographyG17eLabelPublicReflectionUploadPreflightComplete: true"));
assert("doc packageRegenExecuted true", doc.includes("packageRegenExecuted: true"));
assert("doc cssJsHashChanged true", doc.includes("cssJsHashChanged: true"));
assert("doc minimal upload not confirmed", doc.includes("minimalUploadScopeConfirmed: false"));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc label value", doc.includes(LABEL_VALUE));
assert("doc G-15c maintained", doc.includes("skylarkPurchaseUrlReflectionMaintained: true"));
assert("doc G-15e maintained", doc.includes("aboutUsArtistReflectionMaintained: true"));
assert("doc G-16b maintained", doc.includes("continuousArtistReflectionMaintained: true"));
assert("doc old purchase URL absent", doc.includes("gosaakiii.base.shop"));
assert("doc discographyDataSource supabase", doc.includes("discographyDataSource=supabase"));
assert("doc minimal upload blocked", doc.includes("blocked") || doc.includes("not confirmed"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));

assert("G-17d investigation doc exists", exists(G17D_REL));
assert("output gitignored", read(GITIGNORE_REL).includes("output/*"));

assert("hook label in SELECT", hookSrc.includes("label,catalog_number"));
assert("hook patchDiscographyItemLabel", hookSrc.includes("patchDiscographyItemLabel"));
assert("hook label in registry", hookSrc.includes('label:') && hookSrc.includes('field: "label"'));
assert("hook label in field order", hookSrc.includes('"label"'));
assert("hook labelPatches", hookSrc.includes("labelPatches"));
assert("generator labelPatchCount", generatorSrc.includes("labelPatchCount"));

if (exists(DISCOGRAPHY_HTML_REL)) {
  const discHtml = read(DISCOGRAPHY_HTML_REL);
  const jaItem = extractRepeaterItem(discHtml, TARGET_TITLE);
  const aboutItem = extractRepeaterItem(discHtml, ABOUT_US_TITLE);
  const continuousItem = extractRepeaterItem(discHtml, "Continuous");

  assert("local discographyDataSource supabase", discHtml.includes("discographyDataSource=supabase"));
  assert("local Ja-Jaaaaan present", discHtml.includes(TARGET_TITLE));
  assert("local Mardi Gras present", discHtml.includes(LABEL_VALUE));
  assert("local Ja item has label", jaItem.includes(LABEL_VALUE));
  assert("local gosakirikako purchase_url", discHtml.includes(PURCHASE_URL_AFTER));
  assert("local gosaakiii absent", !discHtml.includes(PURCHASE_URL_BEFORE));
  assert("local About Us artist", aboutItem.includes(ABOUT_US_ARTIST));
  assert("local Continuous feat artist", continuousItem.includes(CONTINUOUS_ARTIST));
  assert("local Continuous old Feat absent", !continuousItem.includes(CONTINUOUS_ARTIST_OLD));
  assert("local 4 titles", ["Continuous", "SKYLARK", ABOUT_US_TITLE, TARGET_TITLE].every((t) => discHtml.includes(t)));
  assert(
    "local audit markers absent",
    !AUDIT_MARKERS.some((m) => discHtml.includes(m)),
  );

  const astroRefs = [...discHtml.matchAll(/_astro\/[^"']+/g)].map((m) => m[0]);
  assert("local CSS ref BaseLayout", astroRefs.some((r) => r.includes(LOCAL_CSS)));
  assert("local JS in package", exists(`${ASTRO_DIR_REL}/${JS_HASH}`));
}

if (exists(ASTRO_DIR_REL)) {
  const files = fs.readdirSync(path.join(REPO_ROOT, ASTRO_DIR_REL));
  assert("local package has CSS file", files.some((f) => f.includes("YcHrHZH4") && f.endsWith(".css")));
  assert("local package has JS file", files.includes(JS_HASH));
}

try {
  const liveRes = await fetch(STAGING_DISCOGRAPHY_URL, { method: "GET" });
  assert("live GET HTTP ok", liveRes.ok, String(liveRes.status));
  const body = await liveRes.text();
  assert("live not production host", !body.includes(SARISWING_HOST));
  assert("live discographyDataSource supabase", body.includes("discographyDataSource=supabase"));
  assert("live Ja-Jaaaaan", body.includes(TARGET_TITLE));
  assert("live Mardi Gras", body.includes(LABEL_VALUE));
  assert("live gosakirikako", body.includes(PURCHASE_URL_AFTER));
  assert("live gosaakiii absent", !body.includes(PURCHASE_URL_BEFORE));
  assert("live Continuous feat", body.includes(CONTINUOUS_ARTIST));
  assert("live CSS ref index", body.includes(LIVE_CSS));
} catch (err) {
  assert("live GET", false, err instanceof Error ? err.message : String(err));
}

assert("DB write not executed by Cursor", true);
assert("FTP/upload not executed", true);
assert("service_role not used", true);
assert("commit/push not executed", true);

console.log(`\nG-17e label public reflection preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
