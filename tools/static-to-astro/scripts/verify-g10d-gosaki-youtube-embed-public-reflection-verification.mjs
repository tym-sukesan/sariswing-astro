/**
 * G-10d — Gosaki YouTube embed public reflection verification.
 * Run: node tools/static-to-astro/scripts/verify-g10d-gosaki-youtube-embed-public-reflection-verification.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.join(REPO_ROOT, "tools/static-to-astro");

const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
const DOC_REL = "tools/static-to-astro/docs/gosaki-youtube-embed-public-reflection-verification.md";
const TARGET_ITEM_ID = "yt-placeholder-01";
const EXPECTED_EMBED_CODE = "https://www.youtube.com/watch?v=Ke4F8JAQz-I";
const EXPECTED_VIDEO_ID = "Ke4F8JAQz-I";
const EXPECTED_NOCOOKIE_EMBED = `youtube-nocookie.com/embed/${EXPECTED_VIDEO_ID}`;
const HOME_HTML_REL =
  "tools/static-to-astro/output/gosaki-piano-g10d-verify/dist/index.html";

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
const config = JSON.parse(read(CONFIG_REL));
const item = config.items?.find((row) => row?.id === TARGET_ITEM_ID);
const homeHtml = readIfExists(HOME_HTML_REL);

assert("G-10d doc phase", doc.includes("G-10d-gosaki-youtube-embed-public-reflection-verification"));
assert("verification complete gate", doc.includes("gosakiYoutubeEmbedPublicReflectionVerificationComplete: true"));
assert("manual upload separate noted", doc.includes("manual upload") && doc.includes("not executed"));
assert("FTP not executed", doc.includes("FTP") && doc.includes("not executed"));
assert("workflow_dispatch not executed", doc.includes("workflow_dispatch"));
assert("applyGosakiHomeYouTubeEmbed path", doc.includes("applyGosakiHomeYouTubeEmbed"));
assert("videoId recorded", doc.includes(EXPECTED_VIDEO_ID));
assert("nocookie embedUrl recorded", doc.includes(EXPECTED_NOCOOKIE_EMBED));
assert("readyFor manual upload", doc.includes("readyForGosakiYoutubeEmbedStagingManualUploadByOperator: true"));
assert("do not re-click Save", doc.includes("Do not re-click G-10c Save"));

assert("source config path", CONFIG_REL.includes("gosaki-piano-youtube-embed.json"));
assert("target item exists", item?.id === TARGET_ITEM_ID);
assert("published true", item?.published === true);
assert("embedCode watch URL", item?.embedCode === EXPECTED_EMBED_CODE);
assert("embedCode contains videoId", String(item?.embedCode ?? "").includes(EXPECTED_VIDEO_ID));

assert("home HTML artifact exists", homeHtml !== null);
if (homeHtml) {
  assert("home HTML gosaki-youtube-embed", homeHtml.includes("gosaki-youtube-embed"));
  assert("home HTML nocookie embed", homeHtml.includes(EXPECTED_NOCOOKIE_EMBED));
  assert("home HTML videoId", homeHtml.includes(EXPECTED_VIDEO_ID));
}

assert("G-10c2 doc references G-10d", read("tools/static-to-astro/docs/gosaki-youtube-embed-static-json-write-save-success-finalization.md").includes("G-10d"));
assert("00-current-state G-10d", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10d"));

const adminDiff = spawnSync(
  "git",
  ["diff", "--name-only", "--", "src/pages/admin"],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
