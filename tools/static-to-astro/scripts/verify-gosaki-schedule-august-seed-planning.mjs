/**
 * G-20r2 — Gosaki schedule August seed planning verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-august-seed-planning.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const PLAN_DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-august-seed-planning.md";
const CANDIDATES_REL = "tools/static-to-astro/docs/gosaki-schedule-august-seed-candidates.json";
const SCHEDULES_JSON = path.join(
  TOOL_ROOT,
  "output/gosaki-piano-astro-production/src/data/gosaki-schedules.json",
);
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "32333b9";

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

const planDoc = read(PLAN_DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

assert("planning doc exists", exists(PLAN_DOC_REL));
assert("HEAD matches BASE_COMMIT", head === BASE_COMMIT, `HEAD=${head}`);

assert("phase is august seed planning", /G-20r2-gosaki-schedule-august-seed-planning|august seed planning/i.test(planDoc));
assert("event count 19 recorded", /eventCountCandidates: 19|event_count.*19|19 candidate|19件/i.test(planDoc));
assert("extraction confidence HIGH", /extractionConfidenceFromG20r1b: HIGH|extraction confidence.*HIGH/i.test(planDoc));
assert("kit august rows 0", /kitAugustRowsExisting: 0|2026-08 rows.*0|0 rows/i.test(planDoc));

let candidateCount = 0;
if (exists(CANDIDATES_REL)) {
  const candidates = JSON.parse(read(CANDIDATES_REL));
  candidateCount = candidates.candidates?.length ?? 0;
}
assert("19 candidate records in JSON", candidateCount === 19, `got ${candidateCount}`);

assert("proposed legacy_id rules", /schedule-2026-08-001|legacy_id.*schedule-2026/i.test(planDoc));
assert("sort_order rules", /sort_order/i.test(planDoc));
assert("intended_action classification", /intended_action|needs_client_confirmation.*3|insert.*16/i.test(planDoc));
assert("needs_client_confirmation documented", /needs_client_confirmation|8\/10|8\/15|8\/21/i.test(planDoc));
assert("angle bracket source parity", /source parity|Kit bugではない|angleBracket/i.test(planDoc));

const sqlGlob = spawnSync("find", ["tools/static-to-astro", "-name", "*.sql", "-newer", PLAN_DOC_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const newSql = sqlGlob.stdout.trim().split("\n").filter(Boolean);
assert("no new SQL files from this phase", newSql.length === 0, newSql.join(", "));

assert("DB write none", /dbWriteInThisPhase: false|DB write.*\*\*no\*\*/i.test(planDoc));
assert("Save none", /saveInThisPhase: false|Save.*\*\*no\*\*/i.test(planDoc));
assert("package regen none", /packageRegenInThisPhase: false|package regen.*\*\*no\*\*/i.test(planDoc));
assert("FTP none", /ftpUploadInThisPhase: false|FTP.*\*\*no\*\*/i.test(planDoc));
assert("G-20r3 approvalId required", /G-20r3.*approvalId|approvalId 必須/i.test(planDoc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(planDoc));

if (fs.existsSync(SCHEDULES_JSON)) {
  const schedules = JSON.parse(fs.readFileSync(SCHEDULES_JSON, "utf8"));
  const aug = schedules.filter((r) => r.month === "2026-08" || r.date?.startsWith("2026-08"));
  assert("local gosaki-schedules.json 2026-08 rows 0", aug.length === 0, `got ${aug.length}`);
}

assert("00-current-state mentions G-20r2", /G-20r2|august-seed-planning/i.test(currentState));
assert("03-next-actions mentions G-20r2", /G-20r2|august-seed-planning/i.test(nextActions));
assert("handoff mentions G-20r2", /G-20r2|august-seed-planning/i.test(handoff));

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
  `\nG-20r2 Gosaki schedule August seed planning verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
