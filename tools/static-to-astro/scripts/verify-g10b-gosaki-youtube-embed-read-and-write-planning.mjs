/**
 * G-10b — Gosaki YouTube embed read and write planning.
 * Run: node tools/static-to-astro/scripts/verify-g10b-gosaki-youtube-embed-read-and-write-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

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

const doc = read("tools/static-to-astro/docs/gosaki-youtube-embed-read-and-write-planning.md");
const config = read("tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json");

assert("G-10b doc phase", doc.includes("G-10b-gosaki-youtube-embed-read-and-write-planning"));
assert("planning complete gate", doc.includes("gosakiYoutubeEmbedReadAndWritePlanningComplete: true"));
assert("public display path documented", doc.includes("applyGosakiHomeYouTubeEmbed"));
assert("admin binding documented", doc.includes("gosaki-youtube-embed-admin-binding.ts"));
assert("current data source JSON", doc.includes("gosaki-piano-youtube-embed.json"));
assert("placeholder state documented", doc.includes("yt-placeholder-01"));
assert("write options A-D compared", doc.includes("Option A") && doc.includes("site_embeds"));
assert("recommended G-10c static JSON", doc.includes("G-10c") && doc.includes("static JSON"));
assert("G-10c safety gates", doc.includes("approvalId") && doc.includes("1 Save = 1 embed item"));
assert("site_slug gosaki-piano gate", doc.includes('site_slug') || doc.includes("gosaki-piano"));
assert("service_role forbidden", doc.includes("service_role"));
assert("generalization section", doc.includes("Musician CMS Kit"));
assert("risk classification", doc.includes("Risk classification"));
assert("no DB write this phase", doc.includes("no DB write") || doc.includes("no DB write, no Save"));
assert("G-10e deferred", doc.includes("G-10e"));

assert("config file siteSlug", config.includes('"siteSlug": "gosaki-piano"'));
assert("config placeholder unpublished", config.includes('"published": false'));

assert("resolver exists", fs.existsSync(path.join(REPO_ROOT, "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-youtube-embed.ts")));
assert("convert hook exists", fs.existsSync(path.join(REPO_ROOT, "tools/static-to-astro/scripts/lib/gosaki-home-youtube-embed.mjs")));
assert("admin binding exists", fs.existsSync(path.join(REPO_ROOT, "src/lib/admin/staging-data/gosaki-youtube-embed-admin-binding.ts")));

assert("00-current-state G-10b", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10b"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
