/**
 * G-20r1b — Gosaki schedule public URL capture result verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-public-url-capture-result.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const RESULT_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-public-url-capture-result.md";
const CAPTURE_DIR = path.join(TOOL_ROOT, "output/gosaki-source-captures/2026-08");
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "aa128b8";

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

assert("target URL limited to 2026-08", /2026-08|gosaki-piano\.com\/2026-08/i.test(resultDoc));
assert("public GET only", /public GET only|method.*public GET/i.test(resultDoc));
assert("login none", /login.*none|login:\s*none/i.test(resultDoc));
assert("auth none", /auth.*none|auth:\s*none/i.test(resultDoc));
assert("form submission none", /form submission.*none|formSubmission:\s*false/i.test(resultDoc));
assert("recursive crawl none", /recursive crawl.*none|recursiveCrawl:\s*false/i.test(resultDoc));

const rawHtml = path.join(CAPTURE_DIR, "raw.html");
const summaryJson = path.join(CAPTURE_DIR, "capture-summary.json");
const hasCapture = fs.existsSync(rawHtml) && fs.existsSync(summaryJson);
assert(
  "raw capture files exist or failure documented",
  hasCapture || /FAILED|取得不可/i.test(resultDoc),
  `raw=${fs.existsSync(rawHtml)} summary=${fs.existsSync(summaryJson)}`,
);

if (hasCapture) {
  const summary = JSON.parse(fs.readFileSync(summaryJson, "utf8"));
  assert("capture summary event count", summary.eventCountDetected > 0, `got ${summary.eventCountDetected}`);
}

assert("extraction confidence documented", /extractionConfidence|Extraction confidence|HIGH|MEDIUM|LOW|FAILED/i.test(resultDoc));
assert("Kit gap documented", /2026-03.*2026-07|source freshness|Kit 側/i.test(resultDoc));
assert("angle bracket source parity", /source parity|Kit変換バグではない|angleBracketSourceParity/i.test(resultDoc));

assert("DB write none", /dbWriteInThisPhase: false|DB write.*\*\*no\*\*/i.test(resultDoc));
assert("Save none", /saveInThisPhase: false|Save.*\*\*no\*\*/i.test(resultDoc));
assert("package regen none", /packageRegenInThisPhase: false|package regen.*\*\*no\*\*/i.test(resultDoc));
assert("FTP none", /ftpUploadInThisPhase: false|FTP.*\*\*no\*\*/i.test(resultDoc));
assert("production change none", /production.*\*\*no\*\*|productionChange/i.test(resultDoc));

assert("G-20r2 next phase separated", /G-20r2-schedule-august-seed-planning/i.test(resultDoc));
assert("G-20r3 next phase separated", /G-20r3-schedule-august-db-insert-preflight/i.test(resultDoc));
assert("G-20r4 next phase separated", /G-20r4-schedule-public-reflection-plan/i.test(resultDoc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(resultDoc));

assert("00-current-state mentions G-20r1b", /G-20r1b|public-url-capture/i.test(currentState));
assert("03-next-actions mentions G-20r1b", /G-20r1b|public-url-capture/i.test(nextActions));
assert("handoff mentions G-20r1b", /G-20r1b|public-url-capture/i.test(handoff));

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

console.log(
  `\nG-20r1b Gosaki schedule public URL capture verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
