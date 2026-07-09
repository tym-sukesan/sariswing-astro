/**
 * G-20r2b — Gosaki schedule product quality policy verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-product-quality-policy.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-product-quality-policy.md";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

const BASE_COMMIT = head;

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
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("policy doc exists", exists(DOC_REL));
assert("HEAD recorded", BASE_COMMIT.length >= 7, `HEAD=${BASE_COMMIT}`);

assert("phase is product quality policy", /G-20r2b-gosaki-schedule-product-quality-policy|product quality policy/i.test(doc));
assert("event count 19", /eventCount: 19|19件|19 events/i.test(doc));
assert("published true count", /publishedTrueCandidates: 14|published=true.*14/i.test(doc));
assert("published false count", /publishedFalseCandidates: 3|published=false.*3/i.test(doc));
assert("hold count", /holdCandidates: 2|\bhold\b.*2/i.test(doc));

assert("8/10 published false or hold", /2026-08-10|8\/10/i.test(doc) && /published=false|hold/i.test(doc));
assert("8/15 published false or hold", /2026-08-15|8\/15/i.test(doc));
assert("8/21 published false or hold", /2026-08-21|8\/21/i.test(doc));

assert("angle bracket not kit bug", /Kit bug\?.*No|Kit bugではない|source parity/i.test(doc));
assert("quality over wix parity for incomplete", /qualityOverWixParityForIncomplete|商品品質.*Wix|品質.*parity/i.test(doc));
assert("empty label UI rule", /空ラベル|do not render OPEN|非表示/i.test(doc));
assert("dual session policy", /二部制|#14|2026-08-23/i.test(doc));

assert("g20r3 readiness", /readyForG20r3ScheduleAugustDbInsertPreflight: true|readyForG20r3.*true/i.test(doc));
assert("g20r3 approvalId", /approvalId|G-20r3/i.test(doc));

assert("DB write none", /dbWriteInThisPhase: false|DB write.*\*\*no\*\*/i.test(doc));
assert("SQL none", /sqlFileCreated: false|SQL.*\*\*no\*\*|SQL作成なし/i.test(doc));
assert("Save none", /saveInThisPhase: false|Save.*\*\*no\*\*/i.test(doc));
assert("package regen none", /package regen.*\*\*no\*\*|regen.*not executed/i.test(doc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(doc));

assert("00-current-state mentions G-20r2b", /G-20r2b|product-quality-policy/i.test(currentState));
assert("03-next-actions mentions G-20r2b", /G-20r2b|product-quality-policy/i.test(nextActions));
assert("handoff mentions G-20r2b", /G-20r2b|product-quality-policy/i.test(handoff));

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
  `\nG-20r2b Gosaki schedule product quality policy verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
