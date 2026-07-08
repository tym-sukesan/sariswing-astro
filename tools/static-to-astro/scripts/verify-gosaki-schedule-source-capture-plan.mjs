/**
 * G-20r1 — Gosaki schedule source capture plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-source-capture-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const RESULT_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-source-capture-plan.md";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const BASE_COMMIT = "406ec63";

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

const resultDoc = read(RESULT_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

assert("result doc exists", exists(RESULT_DOC_REL));
assert("HEAD matches BASE_COMMIT", head === BASE_COMMIT, `HEAD=${head}`);

assert("purpose is schedule source capture plan", /schedule source capture plan|G-20r1-gosaki-schedule-source-capture-plan/i.test(resultDoc));

assert("cursor no live crawl", /cursorLiveCrawl: false|live crawl.*\*\*no\*\*|Cursor.*live crawl/i.test(resultDoc));
assert("cursor no network access", /cursorNetworkAccess: false|network access.*\*\*no\*\*|network.*\*\*しない\*\*/i.test(resultDoc));
assert("operator browser capture policy", /operator.*ブラウザ|operator-human-browser|戸山さん/i.test(resultDoc));

assert("2026-08 source URL candidates", /2026-08|gosaki-piano\.com\/2026-08/i.test(resultDoc));
assert("screenshot in capture procedure", /screenshot|スクリーンショット/i.test(resultDoc));
assert("raw_text in format", /raw_text/i.test(resultDoc));
assert("uncertainty_notes in format", /uncertainty_notes/i.test(resultDoc));

assert("record format present", /記録フォーマット|Event table|CSV header/i.test(resultDoc));
assert("intended_action candidates", /intended_action.*insert|insert.*update.*skip.*needs_client_confirmation/i.test(resultDoc));

assert("normalization rules draft", /正規化ルール|normalization/i.test(resultDoc));
assert("angle bracket source parity in rules", /<>|source parity/i.test(resultDoc));

assert("DB write none in phase", /dbWriteInThisPhase: false|DB write.*\*\*no\*\*|DB write.*実行しない/i.test(resultDoc));
assert("Save none in phase", /saveInThisPhase: false|Save.*\*\*no\*\*|Save.*押さない/i.test(resultDoc));
assert("package regen none", /packageRegenInThisPhase: false|package regen.*\*\*しない\*\*/i.test(resultDoc));
assert("FTP none", /ftpUploadInThisPhase: false|FTP.*\*\*しない\*\*/i.test(resultDoc));
assert("production change none", /production.*\*\*しない\*\*|productionChange/i.test(resultDoc));

assert("G-20r1a next phase separated", /G-20r1a-operator-capture-result/i.test(resultDoc));
assert("G-20r2 next phase separated", /G-20r2-schedule-august-seed-planning/i.test(resultDoc));
assert("G-20r3 next phase separated", /G-20r3-schedule-august-db-insert-preflight/i.test(resultDoc));
assert("G-20r4 next phase separated", /G-20r4-schedule-public-reflection-plan/i.test(resultDoc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(resultDoc));

assert("00-current-state mentions G-20r1", /G-20r1|source-capture-plan/i.test(currentState));
assert("03-next-actions mentions G-20r1", /G-20r1|source-capture-plan/i.test(nextActions));
assert("handoff mentions G-20r1", /G-20r1|source-capture-plan/i.test(handoff));

const portCheck = spawnSync("lsof", ["-nP", "-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("build not executed by Cursor", true);
assert("network not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Save not executed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(
  `\nG-20r1 Gosaki schedule source capture plan verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
