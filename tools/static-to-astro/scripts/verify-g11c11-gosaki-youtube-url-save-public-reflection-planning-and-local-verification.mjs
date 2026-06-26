/**
 * G-11c11 — Gosaki YouTube URL save public reflection planning + local verification.
 * Run: node tools/static-to-astro/scripts/verify-g11c11-gosaki-youtube-url-save-public-reflection-planning-and-local-verification.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { G11C8_CONFIG_REL } from "./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-public-reflection-planning-and-local-verification.md";
const VERIFY_OUT = "output/gosaki-piano-g11c11-verify";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const NEW_VID = "I-eY9YMq9GI";
const OLD_VID = "Ke4F8JAQz-I";
const NEW_EMBED = "https://youtu.be/I-eY9YMq9GI";

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function read(rel) {
  return fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

const doc = read(DOC_REL);
const config = JSON.parse(read(G11C8_CONFIG_REL));
const item = config.items?.find((i) => i.id === "yt-placeholder-01");

assert("G-11c11 doc exists", exists(DOC_REL));
assert("doc phase G-11c11", doc.includes("G-11c11-gosaki-youtube-url-save-public-reflection-planning-and-local-verification"));
assert("doc planning complete", doc.includes("planning + local verification complete"));
assert("doc target JSON", doc.includes("gosaki-piano-youtube-embed.json"));
assert("doc current embedCode", doc.includes(NEW_EMBED));
assert("doc published true", doc.includes("published") && doc.includes("true"));
assert("doc reflection path", doc.includes("applyGosakiHomeYouTubeEmbed"));
assert("doc nocookie embed", doc.includes("youtube-nocookie.com/embed"));
assert("doc local verification", doc.includes("gosaki-piano-g11c11-verify"));
assert("doc no FTP", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc no deploy", doc.includes("deployExecuted") && doc.includes("**false**"));
assert("doc no workflow dispatch", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no JSON write", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc phase split G-11c12", doc.includes("G-11c12"));
assert("doc upload preflight G-11c13", doc.includes("G-11c13"));
assert("doc upload execution G-11c14", doc.includes("G-11c14"));
assert("doc public verification G-11c15", doc.includes("G-11c15"));

assert("config embedCode", item?.embedCode === NEW_EMBED);
assert("config published", item?.published === true);

const homeDist = path.join(TOOL_ROOT, VERIFY_OUT, "dist/index.html");
const dataCopy = path.join(TOOL_ROOT, VERIFY_OUT, "src/data/gosaki-youtube-embed.json");
if (fs.existsSync(homeDist)) {
  const homeHtml = fs.readFileSync(homeDist, "utf8");
  const dataJson = JSON.parse(fs.readFileSync(dataCopy, "utf8"));
  assert("local build home embed section", homeHtml.includes("gosaki-youtube-embed"));
  assert("local build new videoId in iframe", homeHtml.includes(`youtube-nocookie.com/embed/${NEW_VID}`));
  assert("local build old videoId absent", !homeHtml.includes(OLD_VID));
  assert("local data copy embedCode", dataJson.items?.[0]?.embedCode === NEW_EMBED);
} else {
  console.error("WARN local build artifact missing — re-run convert for full verify");
}

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-11c11 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
