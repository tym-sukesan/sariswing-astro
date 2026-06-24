/**
 * G-10i1 — Gosaki About bands/projects images package prep verification.
 * Run: node tools/static-to-astro/scripts/verify-g10i1-gosaki-about-bands-projects-images-package-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-about-bands-projects-images-package-prep.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-about-content.json";
const SOURCE_BANDS_DIR = "tools/static-to-astro/fixtures/gosaki-piano/assets/about/bands";
const ABOUT_ASTRO_REL = "tools/static-to-astro/output/gosaki-piano-astro/src/pages/about/index.astro";
const ABOUT_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/about/index.html";
const CONTACT_HTML_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/public-dist/contact/index.html";
const MANUAL_ABOUT_REL =
  "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/about/index.html";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const PUBLIC_DIST_REL = "tools/static-to-astro/output/static-public/gosaki-piano/public-dist";
const REPORT_REL =
  "tools/static-to-astro/output/static-public/gosaki-piano/STATIC_PUBLIC_ARTIFACT_REPORT.md";

const EXPECTED_IMAGES = [
  { file: "gosakirikako_trio.jpg", w: 524, h: 696 },
  { file: "onomatopoeia.jpg", w: 696, h: 524 },
  { file: "careless_hornets.jpg", w: 696, h: 524 },
  { file: "kikioto.jpg", w: 524, h: 696 },
  { file: "caribbean_function.jpg", w: 696, h: 524 },
];

const SCRIPT_PAT = /js\.hsforms\.net\/forms\/embed\/21392032\.js/g;

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function count(text, pattern) {
  return (String(text).match(pattern) || []).length;
}

function imageSize(rel) {
  const abs = path.join(REPO_ROOT, rel);
  const out = spawnSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", abs], { encoding: "utf8" });
  const w = out.stdout.match(/pixelWidth:\s*(\d+)/)?.[1];
  const h = out.stdout.match(/pixelHeight:\s*(\d+)/)?.[1];
  return { w: Number(w), h: Number(h) };
}

const doc = read(DOC_REL);
const config = JSON.parse(read(CONFIG_REL));
const bandsHtml = config.blocks.find((b) => b.id === "about-bands-html")?.html ?? "";
const aboutAstro = exists(ABOUT_ASTRO_REL) ? read(ABOUT_ASTRO_REL) : "";
const aboutHtml = exists(ABOUT_HTML_REL) ? read(ABOUT_HTML_REL) : "";
const contactHtml = exists(CONTACT_HTML_REL) ? read(CONTACT_HTML_REL) : "";
const manualAboutHtml = exists(MANUAL_ABOUT_REL) ? read(MANUAL_ABOUT_REL) : "";
const report = exists(REPORT_REL) ? read(REPORT_REL) : "";

assert("G-10i1 doc phase", doc.includes("G-10i1-gosaki-about-bands-projects-images-package-prep"));
assert("prep complete gate", doc.includes("gosakiAboutBandsProjectsImagesPackagePrepComplete: true"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("DB not executed", doc.includes("cursorDbWriteExecuted: false"));
assert("image ops not executed", doc.includes("cursorImageOpsExecuted: false"));

for (const img of EXPECTED_IMAGES) {
  const sourceRel = `${SOURCE_BANDS_DIR}/${img.file}`;
  assert(`source image exists ${img.file}`, exists(sourceRel));
  if (exists(sourceRel)) {
    const size = imageSize(sourceRel);
    assert(`source size ${img.file}`, size.w === img.w && size.h === img.h);
  }
  const publicRel = `${PUBLIC_DIST_REL}/assets/about/bands/${img.file}`;
  const manualRel = `${PACKAGE_REL}/public-dist/assets/about/bands/${img.file}`;
  assert(`public-dist image ${img.file}`, exists(publicRel));
  assert(`manual-upload image ${img.file}`, exists(manualRel));
  assert(`config bands html ref ${img.file}`, bandsHtml.includes(`assets/about/bands/${img.file}`));
}

assert("no band placeholders in config", !bandsHtml.includes('class="band-profile__placeholder"'));
assert("G-10h4b marker in config", read(CONFIG_REL).includes("G-10h4b profile save test"));
assert("G-10h4d marker in config", read(CONFIG_REL).includes("G-10h4d bands save test"));
assert(
  "natural aspect CSS on images",
  /\.band-profile__image \{[^}]*height: auto/.test(bandsHtml) &&
    !/\.band-profile__image \{[^}]*aspect-ratio/.test(bandsHtml),
);

const IMG_TAG_PAT = /<img[^>]*class="band-profile__image"/g;

if (aboutAstro) {
  assert("astro band image tags 5", count(aboutAstro, IMG_TAG_PAT) === 5);
  assert("astro single band-profiles", count(aboutAstro, /class="band-profiles"/g) === 1);
  assert("astro no placeholder div", !aboutAstro.includes('class="band-profile__placeholder"'));
}

if (aboutHtml) {
  assert("public-dist band image tags 5", count(aboutHtml, IMG_TAG_PAT) === 5);
  assert("public-dist single band-profiles", count(aboutHtml, /class="band-profiles"/g) === 1);
  assert("public-dist profile About heading", aboutHtml.includes("About"));
  assert("public-dist noindex", aboutHtml.includes("noindex,nofollow,noarchive"));
  assert("public-dist deployBase", aboutHtml.includes("/cms-kit-staging/gosaki-piano/"));
  for (const img of EXPECTED_IMAGES) {
    assert(`public-dist html ref ${img.file}`, aboutHtml.includes(`assets/about/bands/${img.file}`));
  }
}

if (manualAboutHtml) {
  assert("manual about band image tags 5", count(manualAboutHtml, IMG_TAG_PAT) === 5);
}

if (contactHtml) {
  assert("contact hubspot script once", count(contactHtml, SCRIPT_PAT) === 1);
  assert("contact hs-form-frame once", count(contactHtml, /class="hs-form-frame"/g) === 1);
}

assert("safeForStaticFtp true", report.includes('"safeForStaticFtp": true'));
assert("manual-upload package exists", exists(PACKAGE_REL));
assert("zip exists", exists(`${PACKAGE_REL}/gosaki-piano-manual-upload.zip`));
assert("00-current-state G-10i1", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10i1"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\nG-10i1 verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
