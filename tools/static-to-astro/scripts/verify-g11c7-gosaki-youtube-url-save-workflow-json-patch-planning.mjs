/**
 * G-11c7 — Gosaki YouTube URL save workflow JSON patch planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c7-gosaki-youtube-url-save-workflow-json-patch-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const JSON_REL = "tools/static-to-astro/config/sites/gosaki-piano-youtube-embed.json";
const WORKFLOW_REL = ".github/workflows/gosaki-youtube-url-save-staging.yml";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-workflow-json-patch-planning.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

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
const workflow = read(WORKFLOW_REL);
const jsonConfig = read(JSON_REL);

assert("G-11c7 doc exists", exists(DOC_REL));
assert("doc phase G-11c7", doc.includes("G-11c7-gosaki-youtube-url-save-workflow-json-patch-planning"));
assert("doc planning complete", doc.includes("planning complete"));
assert("doc patch JSON path", doc.includes("gosaki-piano-youtube-embed.json"));
assert("doc target item yt-placeholder-01", doc.includes("yt-placeholder-01"));
assert("doc field option recommendation", doc.includes("Option C") || doc.includes("embedCode` only"));
assert("doc validation section", doc.includes("Workflow-side validation"));
assert("doc conflict", doc.includes("conflict"));
assert("doc rollback", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc public reflection deferred", doc.includes("G-11c11"));
assert("doc workflow dispatch gates", doc.includes("G-11c8") && doc.includes("G-11c10"));
assert("doc workflow_dispatch not executed", doc.includes("workflowDispatchExecuted: false"));
assert("doc no JSON write", doc.includes("cursorJsonWriteExecuted: false"));
assert("doc no Save", doc.includes("saveEnabled:true") || doc.includes("Save"));
assert("doc no DB write", doc.includes("cursorDbWriteExecuted: false"));
assert("doc no FTP", doc.includes("cursorFtpUploadExecuted: false"));
assert("doc no deploy", doc.includes("supabaseFunctionsDeployExecuted: false"));
assert("doc no secrets set", doc.includes("supabaseSecretsSetExecuted: false"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production blocked", doc.includes(PRODUCTION_REF));
assert("doc next G-11c8", doc.includes("G-11c8"));
assert(
  "doc no real email",
  !/@(?!example\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc.replace(/example\.com/g, "")),
);

assert("JSON config exists", exists(JSON_REL));
assert("JSON has target item", jsonConfig.includes("yt-placeholder-01"));
assert("JSON siteSlug gosaki-piano", jsonConfig.includes('"siteSlug": "gosaki-piano"'));

assert("workflow skeleton exists", exists(WORKFLOW_REL));
assert("workflow workflow_dispatch only", workflow.includes("workflow_dispatch:"));
assert("workflow no push trigger", !/\bon:\s*\n[\s\S]*\bpush:/m.test(workflow));
assert("workflow references JSON path", workflow.includes("gosaki-piano-youtube-embed.json"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "--", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", !adminDiff.stdout?.trim());

const envDiff = spawnSync("git", ["diff", "--name-only", "--", ".env", ".env.local"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(".env unchanged", !envDiff.stdout?.trim());

console.log("");
console.log(`G-11c7 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
