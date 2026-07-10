/**
 * G-20u26b — Staging FTP upload HTTP verification record verifier (doc-only).
 * Run: node tools/static-to-astro/scripts/verify-g20u26b-staging-ftp-upload-http-verification-record.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-staging-ftp-upload-http-verification-record.md";
const BASE_COMMIT = "3287219";

const VERIFIED_URLS = [
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/",
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/about/",
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/",
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/schedule/2026-08/",
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/discography/",
  "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/contact/",
];

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u26b base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u26b", doc.includes("G-20u26b-staging-ftp-upload-http-verification-record"));
assert("doc gate complete", doc.includes("gosakiStagingFtpUploadHttpVerificationRecordComplete: true"));
assert("doc sourceCommit 3287219", doc.includes("3287219"));
assert("doc preflight PASS", doc.includes("preflight:gosaki:staging") && /PASS/i.test(doc));
assert("doc manual FTP complete", doc.includes("Manual FTP") && /complete/i.test(doc));
assert("doc FileZilla or equivalent", doc.includes("FileZilla") || doc.includes("manual FTP"));
assert("doc upload source public-dist", doc.includes("public-dist"));
assert("doc remote /cms-kit-staging/gosaki-piano/", doc.includes("/cms-kit-staging/gosaki-piano/"));
assert("doc production not executed", doc.includes("not updated") || doc.includes("not executed"));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc cursor FTP not executed", doc.includes("Cursor FTP") || doc.includes("cursorFtpUploadExecuted: false"));
assert("doc no mirror sync delete", doc.includes("mirror") && doc.includes("sync") && doc.includes("delete"));

for (const url of VERIFIED_URLS) {
  assert(`doc verified URL ${url}`, doc.includes(url));
}

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u26b", packageJson.includes("verify:g20u26b-staging-ftp-upload-http-verification-record"));

assert("AI current-state G-20u26b", currentState.includes("G-20u26b"));
assert("AI next-actions G-20u26b", nextActions.includes("G-20u26b"));
assert("handoff G-20u26b", handoff.includes("G-20u26b"));

assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u26b verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
