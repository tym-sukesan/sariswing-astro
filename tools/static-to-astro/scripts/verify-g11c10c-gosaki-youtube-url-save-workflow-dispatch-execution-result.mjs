/**
 * G-11c10c — Gosaki YouTube URL save workflow dispatch execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c10c-gosaki-youtube-url-save-workflow-dispatch-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { G11C8_CONFIG_REL, G11C8_TARGET_ITEM_ID } from "./lib/gosaki-youtube-url-save-workflow-json-patch-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-workflow-dispatch-execution-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const EXPECTED_EMBED_BEFORE = "https://www.youtube.com/watch?v=Ke4F8JAQz-I";
const EXPECTED_EMBED_AFTER = "https://youtu.be/I-eY9YMq9GI";

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
const success = doc.includes("**success**") || doc.includes("workflowRunSucceeded") && doc.includes("**true**");

let jsonRaw = read(G11C8_CONFIG_REL);
if (success) {
  const originJson = spawnSync(
    "git",
    ["show", "origin/main:tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  if (originJson.status === 0 && originJson.stdout) {
    jsonRaw = originJson.stdout;
  }
}
const json = JSON.parse(jsonRaw);
const item = json.items?.find((i) => i.id === G11C8_TARGET_ITEM_ID);

assert("result doc exists", exists(DOC_REL));
assert("doc phase G-11c10c", doc.includes("G-11c10c-gosaki-youtube-url-save-workflow-dispatch-execution"));
assert("doc records approval", doc.includes("承認します"));
assert("doc run URL or success", doc.includes("28219010388") || doc.includes("**success**"));
assert("doc retry request_id", doc.includes("g11c10c-gosaki-youtube-url-save-workflow-dispatch-retry-001"));
assert("doc target JSON", doc.includes("gosaki-piano-youtube-embed.json"));
assert("doc rollback", doc.includes("git revert"));
assert("doc no cursor JSON write", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc no FTP", doc.includes("cursorFtpUploadExecuted") && doc.includes("**false**"));
assert("doc no deploy", doc.includes("supabaseFunctionsDeployExecuted") && doc.includes("**false**"));

if (success) {
  assert("success: workflow dispatch executed", doc.includes("workflowDispatchExecuted") && doc.includes("**true**"));
  assert("success: embedCode on origin/main", item?.embedCode === EXPECTED_EMBED_AFTER);
  assert("success: published still true", item?.published === true);
  assert("success: no videoId field", !("videoId" in (item ?? {})));
  assert("success: commit sha documented", doc.includes("9f58889"));
} else {
  assert("blocked: embedCode unchanged", item?.embedCode === EXPECTED_EMBED_BEFORE);
}

assert("target item yt-placeholder-01", item?.id === G11C8_TARGET_ITEM_ID);
assert("items count 1", json.items?.length === 1);

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

assert(
  "no real email in result doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(
    doc.replace(/users\.noreply\.github\.com/g, ""),
  ),
);

console.log(`\nG-11c10c verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
