/**
 * G-10d2 — Gosaki YouTube embed staging manual upload by operator (preflight).
 * Run: node tools/static-to-astro/scripts/verify-g10d2-gosaki-youtube-embed-staging-manual-upload-by-operator-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-embed-staging-manual-upload-by-operator.md";
const PACKAGE_REL = "tools/static-to-astro/output/manual-upload/gosaki-piano";
const INDEX_REL = `${PACKAGE_REL}/public-dist/index.html`;
const MANIFEST_REL = `${PACKAGE_REL}/MANIFEST.json`;
const LOCAL_SOURCE = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/";
const REMOTE_DEST = "/cms-kit-staging/gosaki-piano/";
const EXPECTED_VIDEO_ID = "Ke4F8JAQz-I";
const EXPECTED_NOCOOKIE = `youtube-nocookie.com/embed/${EXPECTED_VIDEO_ID}`;

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

assert("G-10d2 doc phase", doc.includes("G-10d2-gosaki-youtube-embed-staging-manual-upload-by-operator"));
assert("preflight complete gate", doc.includes("gosakiYoutubeEmbedStagingManualUploadPreflightComplete: true"));
assert("upload not executed gate", doc.includes("gosakiYoutubeEmbedStagingManualUploadExecuted: false"));
assert("cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("local upload source documented", doc.includes(LOCAL_SOURCE.trim()));
assert("remote destination documented", doc.includes("cms-kit-staging/gosaki-piano"));
assert("upload contents rule", doc.includes("public-dist") && doc.includes("中身"));
assert("mirror delete forbidden", doc.includes("mirror") && doc.includes("delete"));
assert("sync forbidden", doc.includes("同期") || doc.includes("sync"));
assert("FTP deploy not executed", doc.includes("FTP") && doc.includes("not executed"));
assert("workflow_dispatch not executed", doc.includes("workflow_dispatch"));
assert("post-upload QA documented", doc.includes("Post-upload") || doc.includes("post-upload"));
assert("QA youtube embed", doc.includes(EXPECTED_NOCOOKIE));
assert("QA gosaki-youtube-embed", doc.includes("gosaki-youtube-embed"));
assert("operator Go GO", doc.includes("GO") && doc.includes("Operator may proceed"));
assert("readyFor operator upload", doc.includes("readyForOperatorGosakiYoutubeEmbedStagingManualUpload: true"));

assert("package directory exists", fs.existsSync(path.join(REPO_ROOT, PACKAGE_REL)));
assert("public-dist index exists", indexHtml !== null);

if (indexHtml) {
  assert("index nocookie embed", indexHtml.includes(EXPECTED_NOCOOKIE));
  assert("index gosaki-youtube-embed", indexHtml.includes("gosaki-youtube-embed"));
  assert("index noindex", indexHtml.includes("noindex"));
}

if (manifest) {
  assert("manifest safeForStaticFtp", manifest.safeForStaticFtp === true);
  assert("manifest deployBase", manifest.deployBase === REMOTE_DEST);
  assert("manifest ftpAutoDeployUsed false", manifest.ftpAutoDeployUsed === false);
}

assert("G-10d1 doc linked", read("tools/static-to-astro/docs/gosaki-youtube-embed-manual-upload-package-prep.md").includes("G-10d1"));
assert("00-current-state G-10d2", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10d2"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
