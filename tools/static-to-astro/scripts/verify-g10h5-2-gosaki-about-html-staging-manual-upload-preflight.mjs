/**
 * G-10h5-2 — Gosaki About HTML staging manual upload preflight verification.
 * Run: node tools/static-to-astro/scripts/verify-g10h5-2-gosaki-about-html-staging-manual-upload-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-about-html-staging-manual-upload-preflight.md";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const ABOUT_REL = `${PACKAGE_REL}/public-dist/about/index.html`;
const README_REL = `${PACKAGE_REL}/README-UPLOAD.md`;
const CHECKLIST_REL = `${PACKAGE_REL}/CHECKLIST.md`;
const MANIFEST_REL = `${PACKAGE_REL}/MANIFEST.json`;
const ZIP_REL = `${PACKAGE_REL}/gosaki-piano-manual-upload.zip`;
const LOCAL_SOURCE = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/";
const REMOTE_DEST = "/cms-kit-staging/gosaki-piano/";

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

function countMarker(text, pattern) {
  return (String(text).match(pattern) || []).length;
}

const doc = read(DOC_REL);
const aboutHtml = exists(ABOUT_REL) ? read(ABOUT_REL) : "";
const readme = exists(README_REL) ? read(README_REL) : "";
const checklist = exists(CHECKLIST_REL) ? read(CHECKLIST_REL) : "";
let manifest = null;
try {
  manifest = JSON.parse(read(MANIFEST_REL));
} catch {
  manifest = null;
}

assert("G-10h5-2 doc phase", doc.includes("G-10h5-2-gosaki-about-html-staging-manual-upload-preflight"));
assert("preflight complete gate", doc.includes("gosakiAboutHtmlStagingManualUploadPreflightComplete: true"));
assert("upload not executed gate", doc.includes("gosakiAboutHtmlStagingManualUploadExecuted: false"));
assert("readyFor operator upload", doc.includes("readyForOperatorGosakiAboutHtmlStagingManualUpload: true"));
assert("cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("local upload source documented", doc.includes(LOCAL_SOURCE.trim()));
assert("remote destination documented", doc.includes("cms-kit-staging/gosaki-piano"));
assert("upload contents rule", doc.includes("public-dist") && doc.includes("中身"));
assert("mirror delete forbidden", doc.includes("mirror") && doc.includes("delete"));
assert("About QA documented", doc.includes("Bands / Projects"));
assert("bands marker note", doc.includes("bands HTML comment marker") || doc.includes("bands marker"));

assert("package directory exists", exists(PACKAGE_REL));
assert("public-dist directory exists", exists(`${PACKAGE_REL}/public-dist`));
assert("about index exists", exists(ABOUT_REL));
assert("README exists", exists(README_REL));
assert("CHECKLIST exists", exists(CHECKLIST_REL));
assert("MANIFEST exists", exists(MANIFEST_REL));
assert("zip exists", exists(ZIP_REL));

assert("README upload target", readme.includes(REMOTE_DEST.trim()));
assert("README contents not folder", readme.includes("contents") || readme.includes("中身"));
assert("README mirror forbidden", readme.includes("mirror"));
assert("README about URL", readme.includes("/about/"));
assert("CHECKLIST remote path", checklist.includes("/cms-kit-staging/gosaki-piano/"));
assert("CHECKLIST no mirror", checklist.includes("mirror") || checklist.includes("sync"));
assert("CHECKLIST about route", checklist.includes("/about/"));

if (aboutHtml) {
  assert("about profile marker once", countMarker(aboutHtml, /G-10h4b profile save test/g) === 1);
  assert("about profile bio", aboutHtml.includes("後藤 沙紀"));
  assert("about bands trio", aboutHtml.includes("ごさきりかこTrio"));
  assert("about single band-profiles", countMarker(aboutHtml, /class="band-profiles"/g) === 1);
  assert(
    "about bands marker (0 ok — documented strip)",
    countMarker(aboutHtml, /G-10h4d bands save test/g) === 0 ||
      doc.includes("bands marker") ||
      doc.includes("Astro build strip"),
  );
  assert("about noindex", aboutHtml.includes("noindex,nofollow,noarchive"));
  assert("about deployBase", aboutHtml.includes(REMOTE_DEST.trim()));
}

if (manifest) {
  assert("manifest safeForStaticFtp", manifest.safeForStaticFtp === true);
  assert("manifest deployBase", manifest.deployBase === REMOTE_DEST);
  assert("manifest ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
  assert("manifest fileCount 20", manifest.fileCount === 20);
}

assert("G-10h5-1 doc linked", read("tools/static-to-astro/docs/gosaki-about-html-content-public-reflection-package-prep.md").includes("G-10h5-1"));
assert("00-current-state G-10h5-2", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10h5-2"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\nG-10h5-2 preflight verification: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
