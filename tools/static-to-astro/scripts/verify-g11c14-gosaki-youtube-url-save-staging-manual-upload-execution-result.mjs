/**
 * G-11c14 — Gosaki YouTube URL save staging manual upload execution result verifier.
 * Run: node tools/static-to-astro/scripts/verify-g11c14-gosaki-youtube-url-save-staging-manual-upload-execution-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-youtube-url-save-staging-manual-upload-execution-result.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";
const ENV_FILES = [".env", ".env.local"];

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

const doc = read(DOC_REL);

assert("G-11c14 result doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-11c14", doc.includes("G-11c14-gosaki-youtube-url-save-staging-manual-upload-execution"));
assert("doc operator upload complete", doc.includes("operator upload complete") || doc.includes("Operator upload complete"));
assert("doc upload source", doc.includes("output/manual-upload/gosaki-piano/public-dist"));
assert("doc upload destination", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc operator manual", doc.includes("Operator") && doc.includes("manual"));
assert("doc cursor no FTP", doc.includes("cursorFtpUploadExecuted") && doc.includes("**false**"));
assert("doc mirror delete not used", doc.includes("mirrorDeleteUsed") && doc.includes("**false**"));
assert("doc sync delete not used", doc.includes("syncDeleteUsed") && doc.includes("**false**"));
assert("doc remote delete not used", doc.includes("remoteDeleteUsed") && doc.includes("**false**"));
assert("doc production not touched", doc.includes("productionTouched") && doc.includes("**false**"));
assert("doc deploy not executed", doc.includes("deployExecuted") && doc.includes("**false**"));
assert("doc workflow_dispatch not executed", doc.includes("workflowDispatchExecuted") && doc.includes("**false**"));
assert("doc Save not executed", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc DB write not executed", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc JSON write not executed", doc.includes("cursorJsonWriteExecuted") && doc.includes("**false**"));
assert("doc secrets set not executed", doc.includes("supabaseSecretsSetExecuted") && doc.includes("**false**"));
assert("doc next G-11c15", doc.includes("G-11c15"));
assert("doc staging public verification", doc.includes("staging public verification") || doc.includes("staging-public-verification"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

for (const envFile of ENV_FILES) {
  const envDiff = spawnSync("git", ["diff", "--name-only", envFile], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  assert(`${envFile} no diff`, !envDiff.stdout.trim());
}

assert(
  "no real email in doc",
  !/@(?!example\.com|users\.noreply\.github\.com)[a-z0-9.-]+\.[a-z]{2,}/i.test(doc),
);

console.log(`\nG-11c14 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
