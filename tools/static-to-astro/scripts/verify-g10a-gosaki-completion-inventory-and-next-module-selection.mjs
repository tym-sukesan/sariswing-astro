/**
 * G-10a — Gosaki completion inventory and next module selection.
 * Run: node tools/static-to-astro/scripts/verify-g10a-gosaki-completion-inventory-and-next-module-selection.mjs
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

const doc = read("tools/static-to-astro/docs/gosaki-completion-inventory-and-next-module-selection.md");

assert("G-10a doc phase", doc.includes("G-10a-gosaki-completion-inventory-and-next-module-selection"));
assert("inventory gate", doc.includes("gosakiCompletionInventoryAndNextModuleSelectionComplete: true"));
assert("schedule completed section", doc.includes("G-9k6g"));
assert("all six field slices mentioned", doc.includes("G-9k6b") && doc.includes("G-9k6f"));
assert("youtube module assessed", doc.includes("YouTube"));
assert("discography assessed", doc.includes("Discography"));
assert("contact assessed", doc.includes("Contact"));
assert("next module YouTube", doc.includes("G-10b-gosaki-youtube-embed-read-and-write-planning"));
assert("risk classification", doc.includes("リスク分類") || doc.includes("Risk"));
assert("G-9h1 parallel", doc.includes("G-9h1"));
assert("no DB write this phase", doc.includes("DB write") && doc.includes("no"));
assert("00-current-state G-10a", read("tools/static-to-astro/docs/ai/00-current-state.md").includes("G-10a"));

const adminDiff = spawnSync("git", ["diff", "--name-only", "HEAD", "--", "src/pages/admin"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin unchanged", adminDiff.stdout.trim() === "");

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
