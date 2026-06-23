/**
 * G-10d2a — Gosaki YouTube embed staging upload QA finalization.
 * Run: node tools/static-to-astro/scripts/verify-g10d2a-gosaki-youtube-embed-staging-upload-qa-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-embed-staging-upload-qa-finalization.md";
const G10D2_DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-embed-staging-manual-upload-by-operator.md";
const LOCAL_SOURCE = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/";
const STAGING_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
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

const doc = read(DOC_REL);
const g10d2 = read(G10D2_DOC_REL);

assert("G-10d2a doc phase", doc.includes("G-10d2a-gosaki-youtube-embed-staging-upload-qa-finalization"));
assert("finalization complete gate", doc.includes("gosakiYoutubeEmbedStagingUploadQaFinalizationComplete: true"));
assert("upload executed gate", doc.includes("gosakiYoutubeEmbedStagingManualUploadExecuted: true"));
assert("QA passed gate", doc.includes("gosakiYoutubeEmbedStagingUploadQaPassed: true"));
assert("staging URL recorded", doc.includes(STAGING_URL.trim()));
assert("local upload source recorded", doc.includes(LOCAL_SOURCE.trim()));
assert("remote destination recorded", doc.includes("cms-kit-staging/gosaki-piano"));
assert("QA top page OK", doc.includes("Top page displays") && doc.includes("**OK**"));
assert("QA YouTube section OK", doc.includes("YouTube section visible") && doc.includes("**OK**"));
assert("QA video OK", doc.includes("Video plays") || doc.includes("video **displays**"));
assert("QA about schedule contact OK", doc.includes("About / Schedule / Contact"));
assert("QA layout OK", doc.includes("No major layout breakage"));
assert("QA staging URL OK", doc.includes("staging URL"));
assert("videoId recorded", doc.includes(EXPECTED_VIDEO_ID));
assert("nocookie embed recorded", doc.includes(EXPECTED_NOCOOKIE));
assert("UI issue too small recorded", doc.includes("小さすぎる") || doc.includes("too small"));
assert("UI issue non-blocking", doc.includes("non-blocking"));
assert("no delete mirror sync", doc.includes("Delete remote") && doc.includes("**no**"));
assert("FTP auto deploy not used", doc.includes("FTP auto-deploy") && doc.includes("**no**"));
assert("workflow_dispatch not executed", doc.includes("workflow_dispatch"));
assert("cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("next G-10e recorded", doc.includes("G-10e-gosaki-youtube-embed-section-layout-improvement"));
assert("readyFor G-10e", doc.includes("readyForG10eYoutubeEmbedSectionLayoutImprovement: true"));

assert("G-10d2 doc upload succeeded note", g10d2.includes("G-10d2a") || g10d2.includes("upload **succeeded**") || g10d2.includes("QA **PASS**"));
assert("00-current-state G-10d2a", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10d2a"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
