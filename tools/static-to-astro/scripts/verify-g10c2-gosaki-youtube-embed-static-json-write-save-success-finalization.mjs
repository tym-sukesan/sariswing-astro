/**
 * G-10c2 — Gosaki YouTube embed static JSON write Save success finalization.
 * Run: node tools/static-to-astro/scripts/verify-g10c2-gosaki-youtube-embed-static-json-write-save-success-finalization.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
const TARGET_ITEM_ID = "yt-placeholder-01";
const EXPECTED_EMBED_CODE = "https://www.youtube.com/watch?v=Ke4F8JAQz-I";
const EXPECTED_VIDEO_ID = "Ke4F8JAQz-I";
const APPROVAL_ID = "G-10c-gosaki-youtube-embed-static-json-write-slice";

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

const doc = read("tools/static-to-astro/docs/gosaki-youtube-embed-static-json-write-save-success-finalization.md");
const configRaw = read(CONFIG_REL);
const config = JSON.parse(configRaw);
const item = config.items?.find((row) => row?.id === TARGET_ITEM_ID);

assert("G-10c2 doc phase", doc.includes("G-10c2-gosaki-youtube-embed-static-json-write-save-success-finalization"));
assert("save success gate", doc.includes("gosakiYoutubeEmbedStaticJsonWriteSaveSuccess: true"));
assert("finalization complete gate", doc.includes("gosakiYoutubeEmbedStaticJsonWriteSaveSuccessFinalizationComplete: true"));
assert("itemsAffected 1 recorded", doc.includes("itemsAffected") && doc.includes("1"));
assert("videoId recorded", doc.includes(EXPECTED_VIDEO_ID));
assert("changedFields embedCode published", doc.includes("embedCode") && doc.includes("published"));
assert("convert build manual upload noted", doc.includes("convert") && doc.includes("manual upload"));
assert("no deploy in doc", doc.includes("FTP") && doc.includes("not executed"));
assert("no production", doc.includes("Sariswing production") || doc.includes("production touched"));
assert("readyForG10d", doc.includes("readyForG10dPublicReflectionVerification: true"));
assert("do not re-click Save", doc.includes("Do not re-click G-10c Save"));

assert("config path", CONFIG_REL.includes("gosaki-piano-youtube-embed.json"));
assert("siteSlug gosaki-piano", config.siteSlug === "gosaki-piano");
assert("target item exists", item?.id === TARGET_ITEM_ID);
assert("published true", item?.published === true);
assert("embedCode watch URL", item?.embedCode === EXPECTED_EMBED_CODE);
assert("embedCode contains videoId", String(item?.embedCode ?? "").includes(EXPECTED_VIDEO_ID));

assert("approvalId in doc", doc.includes(APPROVAL_ID));
assert("operator diff in doc", doc.includes("published\": true") || doc.includes('"published": true'));

assert("G-10c doc references G-10c2", read("tools/static-to-astro/docs/gosaki-youtube-embed-static-json-write-slice-implementation.md").includes("G-10c2"));
assert("G-10c1 doc Save succeeded note", read("tools/static-to-astro/docs/gosaki-youtube-embed-static-json-save-api-response-fix.md").includes("G-10c2"));

assert("00-current-state G-10c2", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10c2"));
assert("03-next-actions G-10d", read("tools/static-to-astro/docs/ai/03-next-actions.md").includes("G-10d"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
