/**
 * G-10d1 — Gosaki YouTube embed manual upload package prep.
 * Run: node tools/static-to-astro/scripts/verify-g10d1-gosaki-youtube-embed-manual-upload-package-prep.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-embed-manual-upload-package-prep.md";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const INDEX_REL = `${PACKAGE_REL}/public-dist/index.html`;
const MANIFEST_REL = `${PACKAGE_REL}/MANIFEST.json`;
const EXPECTED_VIDEO_ID = "Ke4F8JAQz-I";
const EXPECTED_NOCOOKIE = `youtube-nocookie.com/embed/${EXPECTED_VIDEO_ID}`;
const DEPLOY_BASE = "/cms-kit-staging/gosaki-piano/";
const STAGING_HOST = "yskcreate.weblike.jp/cms-kit-staging/gosaki-piano";

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

function readIfExists(rel) {
  const abs = path.join(REPO_ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
}

const doc = read(DOC_REL);
const indexHtml = readIfExists(INDEX_REL);
let manifest = null;
try {
  manifest = JSON.parse(read(MANIFEST_REL));
} catch {
  manifest = null;
}

assert("G-10d1 doc phase", doc.includes("G-10d1-gosaki-youtube-embed-manual-upload-package-prep"));
assert("package prep complete gate", doc.includes("gosakiYoutubeEmbedManualUploadPackagePrepComplete: true"));
assert("FTP not executed in doc", doc.includes("FTP") && doc.includes("not executed"));
assert("workflow_dispatch not executed", doc.includes("workflow_dispatch"));
assert("staging upload not executed", doc.includes("staging upload not executed") || doc.includes("Staging manual upload | **not executed**"));
assert("operator upload next", doc.includes("G-10d2") && doc.includes("operator"));
assert("manual-upload:package documented", doc.includes("manual-upload:package"));
assert("deployBase documented", doc.includes(DEPLOY_BASE));
assert("staging URL documented", doc.includes(STAGING_HOST));
assert("no mirror delete in flow", doc.includes("mirror") && doc.includes("delete"));

assert("package directory exists", fs.existsSync(path.join(REPO_ROOT, PACKAGE_REL)));
assert("package index.html exists", indexHtml !== null);
assert("package MANIFEST.json exists", manifest !== null);

if (indexHtml) {
  assert("package index gosaki-youtube-embed", indexHtml.includes("gosaki-youtube-embed"));
  assert("package index nocookie embed", indexHtml.includes(EXPECTED_NOCOOKIE));
  assert("package index videoId", indexHtml.includes(EXPECTED_VIDEO_ID));
}

if (manifest) {
  assert("manifest ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
  assert("manifest safeForStaticFtp true", manifest.safeForStaticFtp === true);
  assert("manifest deployBase", manifest.deployBase === DEPLOY_BASE);
  assert("manifest fileCount", manifest.fileCount >= 1);
}

assert("package zip exists", fs.existsSync(path.join(REPO_ROOT, PACKAGE_REL, "gosaki-piano-manual-upload.zip")));
assert("package README exists", fs.existsSync(path.join(REPO_ROOT, PACKAGE_REL, "README-UPLOAD.md")));
assert("package CHECKLIST exists", fs.existsSync(path.join(REPO_ROOT, PACKAGE_REL, "CHECKLIST.md")));
assert("package _astro css exists", fs.existsSync(path.join(REPO_ROOT, PACKAGE_REL, "public-dist/_astro")));
assert("package sitemap exists", fs.existsSync(path.join(REPO_ROOT, PACKAGE_REL, "public-dist/sitemap-index.xml")));

const createScript = read("tools/static-to-astro/scripts/create-manual-upload-package.mjs");
const packageLib = read("tools/static-to-astro/scripts/lib/manual-upload-package.mjs");
assert("create script no ftp", !/\b(lftp|mirror|rsync)\b/i.test(createScript));
assert("package lib local copy only", packageLib.includes("fs.cpSync") && packageLib.includes("ftpAutoDeployUsed: false"));

assert("G-10d doc references G-10d1", read("tools/static-to-astro/docs/gosaki-youtube-embed-public-reflection-verification.md").includes("G-10d1"));
assert("00-current-state G-10d1", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10d1"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
