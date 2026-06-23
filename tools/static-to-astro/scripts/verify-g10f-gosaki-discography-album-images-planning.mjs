/**
 * G-10f — Gosaki discography album images planning.
 * Run: node tools/static-to-astro/scripts/verify-g10f-gosaki-discography-album-images-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-album-images-planning.md";
const CONFIG_REL = "tools/static-to-astro/config/sites/gosaki-piano-discography.json";
const FIXTURE_DISC = "tools/static-to-astro/fixtures/gosaki-piano/discography.html";
const RELEASE_IDS = ["continuous", "skylark", "about-us", "ja-jaaaaan"];

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
const config = JSON.parse(read(CONFIG_REL));
const fixture = read(FIXTURE_DISC);

assert("G-10f doc phase", doc.includes("G-10f-gosaki-discography-album-images-planning"));
assert("planning complete gate", doc.includes("gosakiDiscographyAlbumImagesPlanningComplete: true"));
assert("discography source of truth recorded", doc.includes("discography.html") && doc.includes("gosaki-piano-discography.json"));
assert("fixture to astro flow recorded", doc.includes("convert-static-to-astro"));
assert("NO PHOTO discography clarification", doc.includes("not") && doc.includes("NO PHOTO"));
assert("admin placeholder recorded", doc.includes("準備中") || doc.includes("placeholder"));
assert("Wix CDN external dependency recorded", doc.includes("wixstatic.com"));
assert("4 releases recorded", doc.includes("releases total: 4"));
assert("0 coverImage in JSON recorded", doc.includes("coverImage set in JSON: 0"));
assert("album item table ids", RELEASE_IDS.every((id) => doc.includes(id)));
assert("continuous title", doc.includes("Continuous"));
assert("skylark title", doc.includes("SKYLARK"));
assert("image candidate search recorded", doc.includes("fixtures/gosaki-piano"));
assert("no local discography images", doc.includes("local self-hosted") || doc.includes("Absent"));
assert("Wix mediaId candidates", doc.includes("26e086_3b3d02790d654bebb1ddca8f52af7926"));
assert("option comparison A-E", doc.includes("Option") && doc.includes("**E**"));
assert("recommended E+B", doc.includes("E + B") || doc.includes("E + B"));
assert("future CMS outlook", doc.includes("YouTube G-10c") || doc.includes("static JSON write"));
assert("Supabase deferred", doc.includes("Defer") || doc.includes("not implemented"));
assert("image mutation not executed", doc.includes("cursorImageFileMutationExecuted: false"));
assert("JSON write not executed", doc.includes("cursorJsonWriteExecuted: false"));
assert("FTP not executed", doc.includes("cursorFtpUploadExecuted: false"));
assert("next G-10f1 recorded", doc.includes("G-10f1-gosaki-discography-album-images-acquisition-preflight"));
assert("readyFor G-10f1", doc.includes("readyForG10f1DiscographyAlbumImagesAcquisitionPreflight: true"));

assert("config 4 releases", config.releases?.length === 4);
assert("config all coverImage empty", config.releases.every((r) => !r.coverImage));
assert("fixture has wixstatic", fixture.includes("wixstatic.com"));
assert("fixture no NO PHOTO", !fixture.includes("NO PHOTO") && !fixture.includes("NO%20PHOTO"));
assert("fixture jacket alts", fixture.includes("jacket-l.png") && fixture.includes("0301_skylark"));

assert("00-current-state G-10f", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10f"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", (adminDiff.stdout ?? "").trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
