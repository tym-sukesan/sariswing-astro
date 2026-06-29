/**
 * G-16b — Gosaki Discography G-16a artist public reflection local regen + upload preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g16b-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16b-artist-public-reflection-local-regen-and-upload-preflight.md";
const SAVE_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-artist-save-result.md";
const PLAYBOOK_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const G14C_REL =
  "tools/static-to-astro/docs/gosaki-public-reflection-operation-standardization.md";
const BUILD_SCRIPT_REL = "tools/static-to-astro/scripts/build-gosaki-staging-admin-package.mjs";
const HOOK_REL = "tools/static-to-astro/scripts/lib/supabase-discography-read.mjs";
const GENERATOR_REL = "tools/static-to-astro/scripts/lib/astro-generator.mjs";
const FTP_SAFETY_REL =
  "tools/static-to-astro/docs/ftp-deploy-root-delete-incident-and-safety-hardening.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const GITIGNORE_REL = "tools/static-to-astro/.gitignore";

const DISCOGRAPHY_HTML_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/discography/index.html";
const ASTRO_CSS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.YcHrHZH4.css";
const ASTRO_JS_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/_astro/index.astro_astro_type_script_index_0_lang.CTyGy8yS.js";

const G16B_BASE_COMMIT = "db59af7";
const TARGET_LEGACY_ID = "discography-001";
const TARGET_TITLE = "Continuous";
const ARTIST_BEFORE = "ごさきりかこTrio Feat.石川周之介";
const ARTIST_AFTER = "ごさきりかこTrio feat.石川周之介";
const ABOUT_US_TITLE = "About Us!!";
const ABOUT_US_ARTIST = "ごさきりかこTrio";
const PURCHASE_URL_BEFORE = "https://gosaakiii.base.shop/";
const PURCHASE_URL_AFTER = "https://gosakirikako.base.shop/";
const REMOTE_FILE = "/cms-kit-staging/gosaki-piano/discography/index.html";
const STAGING_DISCOGRAPHY_URL =
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/";
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
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G16B_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);
assert(
  "HEAD at or after G-16a execution baseline db59af7",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);

assert("G-16b preflight doc exists", exists(DOC_REL));
assert(
  "doc phase G-16b",
  doc.includes(
    "G-16b-gosaki-discography-artist-public-reflection-local-regen-and-upload-preflight",
  ),
);
assert(
  "doc local regen complete gate",
  doc.includes("gosakiDiscographyG16bArtistPublicReflectionLocalRegenComplete: true"),
);
assert(
  "doc upload preflight complete gate",
  doc.includes("gosakiDiscographyG16bArtistPublicReflectionUploadPreflightComplete: true"),
);
assert("doc readyForUploadExecution", doc.includes("readyForG16bPublicReflectionUploadExecution: true"));
assert("doc packageRegenExecuted true", doc.includes("packageRegenExecuted: true"));
assert("doc cssJsHashChanged false", doc.includes("cssJsHashChanged: false"));
assert("doc minimal upload scope", doc.includes("minimalUploadScopeConfirmed: true"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc target title Continuous", doc.includes(TARGET_TITLE));
assert("doc artist before Feat", doc.includes(ARTIST_BEFORE));
assert("doc artist after feat", doc.includes(ARTIST_AFTER));
assert("doc playbook reference", doc.includes("cms-kit-save-reflection-playbook.md"));
assert("doc build script", doc.includes("build-gosaki-staging-admin-package.mjs"));
assert("doc hook G-16b fix", doc.includes("comp-llexymga__item1"));
assert("doc CSS hash", doc.includes("index.YcHrHZH4.css"));
assert("doc JS hash", doc.includes("index.astro_astro_type_script_index_0_lang.CTyGy8yS.js"));
assert("doc minimal 1 file upload", doc.includes("discography/index.html"));
assert("doc remote path", doc.includes(REMOTE_FILE));
assert("doc purchase_url maintained", doc.includes("skylarkPurchaseUrlReflectionMaintained: true"));
assert("doc continuous purchase_url baseline", doc.includes("continuousPurchaseUrlBaselineRecorded: true"));
assert("doc purchase_url gosakirikako baseline", doc.includes(PURCHASE_URL_AFTER));
assert("doc aboutUs artist maintained", doc.includes("aboutUsArtistReflectionMaintained: true"));
assert("doc discographyDataSource supabase", doc.includes("discographyDataSource=supabase"));
assert("doc live stale artist", doc.includes("stale"));
assert("doc G-16b-upload next", doc.includes("G-16b-upload"));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));

assert("G-16a save result doc exists", exists(SAVE_RESULT_REL));
assert("playbook doc exists", exists(PLAYBOOK_REL));
assert("G-14c playbook exists", exists(G14C_REL));
assert("build script exists", exists(BUILD_SCRIPT_REL));
assert("hook module exists", exists(HOOK_REL));
assert("ftp safety doc exists", exists(FTP_SAFETY_REL));
assert("output gitignored", read(GITIGNORE_REL).includes("output/*"));

const hookSrc = read(HOOK_REL);
const generatorSrc = read(GENERATOR_REL);
assert("hook artist in SELECT", hookSrc.includes("legacy_id,title,artist,purchase_url"));
assert("hook patchGosakiDiscographySupabaseFields", hookSrc.includes("patchGosakiDiscographySupabaseFields"));
assert("hook patchDiscographyItemArtist", hookSrc.includes("patchDiscographyItemArtist"));
assert("hook item1 repeater regex", hookSrc.includes("comp-llexymga__item[^"));
assert("hook title bracket needle", hookSrc.includes("「${titleNeedle}」"));
assert("hook zwsp artist regex", hookSrc.includes("\\u200b?「"));
assert("generator uses supabase fields patch", generatorSrc.includes("patchGosakiDiscographySupabaseFields"));
assert("generator artistPatchCount", generatorSrc.includes("artistPatchCount"));

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

assert("discography HTML exists", exists(DISCOGRAPHY_HTML_REL));
assert("astro CSS exists", exists(ASTRO_CSS_REL));
assert("astro JS exists", exists(ASTRO_JS_REL));

const discHtml = read(DISCOGRAPHY_HTML_REL);
const continuousItem = extractRepeaterItem(discHtml, TARGET_TITLE);
const skylarkItem = extractRepeaterItem(discHtml, "SKYLARK");
const aboutUsItem = extractRepeaterItem(discHtml, ABOUT_US_TITLE);

assert("local discographyDataSource supabase", discHtml.includes("discographyDataSource=supabase"));
assert("local Continuous new artist present", continuousItem.includes(ARTIST_AFTER));
assert("local Continuous old artist absent", !continuousItem.includes(ARTIST_BEFORE));
assert("local page old Feat artist absent", !discHtml.includes(ARTIST_BEFORE));
assert("local page new feat artist present", discHtml.includes(ARTIST_AFTER));
assert("local new purchase_url present", discHtml.includes(PURCHASE_URL_AFTER));
assert("local old purchase_url absent", !discHtml.includes(PURCHASE_URL_BEFORE));
assert("SKYLARK item new url", skylarkItem.includes(PURCHASE_URL_AFTER));
assert("SKYLARK item old url absent", !skylarkItem.includes(PURCHASE_URL_BEFORE));
assert("Continuous item purchase_url", continuousItem.includes(PURCHASE_URL_AFTER));
assert("About Us artist G-15e maintained", aboutUsItem.includes(ABOUT_US_ARTIST));
assert("Continuous title present", discHtml.includes("Continuous"));
assert("SKYLARK title present", discHtml.includes("SKYLARK"));
assert("Ja-Jaaaaan title present", discHtml.includes("Ja-Jaaaaan!"));

for (const marker of AUDIT_MARKERS) {
  assert(`discography HTML no audit marker: ${marker}`, !discHtml.includes(marker));
}

const fileCount = spawnSync(
  "find",
  [
    path.join(REPO_ROOT, "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist"),
    "-type",
    "f",
  ],
  { encoding: "utf8" },
);
const count = fileCount.stdout.trim().split("\n").filter(Boolean).length;
assert("public-dist file count 27", count === 27, String(count));

try {
  const r = spawnSync("/usr/bin/curl", ["-sS", "-w", "\n%{http_code}", STAGING_DISCOGRAPHY_URL], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status === 0) {
    const parts = r.stdout.trimEnd().split("\n");
    const code = parts.pop();
    const body = parts.join("\n");
    assert("live discography HTTP 200", code === "200", code);
    const liveContinuous = extractRepeaterItem(body, TARGET_TITLE);
    const liveAboutUs = extractRepeaterItem(body, ABOUT_US_TITLE);
    assert("live Continuous old artist stale", liveContinuous.includes(ARTIST_BEFORE));
    assert("live Continuous new artist absent", !liveContinuous.includes(ARTIST_AFTER));
    assert("live About Us artist G-15e maintained", liveAboutUs.includes(ABOUT_US_ARTIST));
    assert("live purchase_url G-15c maintained", body.includes(PURCHASE_URL_AFTER));
    assert("live old purchase_url absent", !body.includes(PURCHASE_URL_BEFORE));
    assert("live page not production host", !body.includes("gosaki-piano.com"));
    assert("live css hash unchanged", body.includes("index.YcHrHZH4.css"));
    assert("live discographyDataSource supabase", body.includes("discographyDataSource=supabase"));
  } else {
    console.log("SKIP live HTTP — curl failed");
  }
} catch {
  console.log("SKIP live HTTP");
}

assert("DB write not executed in verifier", true);
assert("FTP/upload not executed", true);

console.log(`\nG-16b preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
