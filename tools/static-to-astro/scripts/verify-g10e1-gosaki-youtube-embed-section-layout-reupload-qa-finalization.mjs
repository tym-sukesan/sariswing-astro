/**
 * G-10e1 — Gosaki YouTube embed section layout reupload QA finalization.
 * Run: node tools/static-to-astro/scripts/verify-g10e1-gosaki-youtube-embed-section-layout-reupload-qa-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-embed-section-layout-reupload-qa-finalization.md";
const G10E_DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-embed-section-layout-improvement.md";
const LOCAL_SOURCE = "tools/static-to-astro/output/manual-upload/gosaki-piano/public-dist/";
const STAGING_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/";
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
const g10e = read(G10E_DOC_REL);

assert(
  "G-10e1 doc phase",
  doc.includes("G-10e1-gosaki-youtube-embed-section-layout-reupload-qa-finalization"),
);
assert(
  "finalization complete gate",
  doc.includes("gosakiYoutubeEmbedSectionLayoutReuploadQaFinalizationComplete: true"),
);
assert(
  "staging reflected gate",
  doc.includes("gosakiYoutubeEmbedSectionLayoutStagingReflected: true"),
);
assert(
  "operator reupload executed gate",
  doc.includes("gosakiYoutubeEmbedSectionLayoutOperatorReuploadExecuted: true"),
);
assert("QA passed gate", doc.includes("gosakiYoutubeEmbedSectionLayoutQaPassed: true"));
assert("staging URL recorded", doc.includes(STAGING_URL.trim()));
assert("local upload source recorded", doc.includes(LOCAL_SOURCE.trim()));
assert("remote destination recorded", doc.includes("cms-kit-staging/gosaki-piano"));
assert("QA top page OK", doc.includes("Top page displays") && doc.includes("**OK**"));
assert("QA YouTube section OK", doc.includes("YouTube section visible") && doc.includes("**OK**"));
assert(
  "QA layout improvement OK",
  doc.includes("YouTube section size improvement") && doc.includes("**OK**"),
);
assert(
  "QA larger natural display OK",
  (doc.includes("Larger, natural display") || doc.includes("以前より大きく")) &&
    doc.includes("**OK**"),
);
assert("QA no major breakage", doc.includes("No major layout breakage") && doc.includes("**OK**"));
assert("videoId recorded", doc.includes(EXPECTED_VIDEO_ID));
assert("nocookie embed recorded", doc.includes(EXPECTED_NOCOOKIE));
assert(
  "layout improvement on staging recorded",
  doc.includes("layout improvement reflected") || doc.includes("Layout improvement reflected"),
);
assert("grid-column breakout recorded", doc.includes("grid-column: 1 / -1"));
assert("max-width 720px recorded", doc.includes("max-width: 720px"));
assert("aspect-ratio 16/9 recorded", doc.includes("aspect-ratio: 16 / 9"));
assert("no delete mirror sync", doc.includes("Delete remote") && doc.includes("**no**"));
assert("mirror not used", doc.includes("mirror") && doc.includes("**no**"));
assert("FTP auto deploy not used", doc.includes("FTP auto-deploy") && doc.includes("**no**"));
assert("workflow_dispatch not executed", doc.includes("workflow_dispatch"));
assert("cursor FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert(
  "next Discography candidate",
  doc.includes("G-10f-gosaki-discography-album-images-planning"),
);
assert("next HubSpot candidate", doc.includes("G-10g-gosaki-contact-hubspot-form-planning"));

assert(
  "G-10e doc staging reupload QA",
  g10e.includes("G-10e1") && g10e.includes("staging re-upload") && g10e.includes("**PASS**"),
);
assert("00-current-state G-10e1", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10e1"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
