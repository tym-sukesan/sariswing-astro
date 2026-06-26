/**
 * G-12d — Gosaki Schedule CMS Phase 1/2 boundary planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-g12d-gosaki-schedule-cms-phase-boundary-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-cms-phase-boundary-planning.md";
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

assert("G-12d doc exists", fs.existsSync(path.join(REPO_ROOT, DOC_REL)));
assert("doc phase G-12d", doc.includes("G-12d-gosaki-schedule-cms-phase-boundary-planning"));
assert("doc planning complete", doc.includes("planning complete"));
assert("doc Phase 1 section", doc.includes("Phase 1"));
assert("doc Phase 2 section", doc.includes("Phase 2"));
assert("doc G-12b complete", doc.includes("G-12b"));
assert("doc why no write yet", doc.includes("Why DB write") || doc.includes("does not proceed"));
assert("doc entry conditions", doc.includes("entry conditions"));
assert("doc write slice candidates", doc.includes("write slice candidates") || doc.includes("Tier"));
assert("doc approval gates", doc.includes("Approval gates") || doc.includes("approval"));
assert("doc avoid operations", doc.includes("absolutely avoid") || doc.includes("Forbidden"));
assert("doc mirror delete forbidden", doc.includes("mirror --delete"));
assert("doc schedule_months", doc.includes("schedule_months"));
assert("doc readyForAnyDbWrite false", doc.includes("readyForAnyDbWrite") && doc.includes("**false**"));
assert("doc boundary gate true", doc.includes("gosakiScheduleCmsPhaseBoundaryDocumented") && doc.includes("**true**"));
assert("doc client feedback pending", doc.includes("gosakiClientPreviewFeedbackClosureComplete") && doc.includes("**false**"));
assert("doc no DB write this phase", doc.includes("cursorDbWriteExecuted") && doc.includes("**false**"));
assert("doc no FTP", doc.includes("ftpUploadExecuted") && doc.includes("**false**"));
assert("doc no Save", doc.includes("cursorSaveExecuted") && doc.includes("**false**"));
assert("doc next phase", doc.includes("G-12c-result") || doc.includes("G-13a"));
assert("doc staging shell route", doc.includes("__admin-staging-shell"));
assert("doc not production", doc.includes("production") && doc.includes("Out of scope"));

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

console.log(`\nG-12d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
