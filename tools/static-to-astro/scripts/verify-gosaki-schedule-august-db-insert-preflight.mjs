/**
 * G-20r3 — Gosaki schedule August DB INSERT preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-august-db-insert-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-august-db-insert-preflight.md";
const SQL_REL = "tools/static-to-astro/scripts/supabase/gosaki-schedule-august-2026-insert-preflight.sql";
const CANDIDATES_REL = "tools/static-to-astro/docs/gosaki-schedule-august-seed-candidates.json";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

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

assert("preflight doc exists", exists(DOC_REL));
assert("HEAD recorded", head.length >= 7, `HEAD=${head}`);

assert("phase is august db insert preflight", /G-20r3-gosaki-schedule-august-db-insert-preflight/i.test(doc));
assert("insert target 17", /insertTargetCount: 17|INSERT 対象.*17|17件/i.test(doc));
assert("hold excluded 2", /holdExcludedCount: 2|hold 除外.*2|#8.*#18/i.test(doc));
assert("published true 14", /publishedTrueCount: 14|published=true.*14/i.test(doc));
assert("published false 3", /publishedFalseCount: 3|published=false.*3/i.test(doc));

assert("hold 8 excluded", /schedule-2026-08-008|#8|2026-08-11/i.test(doc));
assert("hold 18 excluded", /schedule-2026-08-018|#18|2026-08-29/i.test(doc));

assert("approvalId defined", /G-20r3-gosaki-schedule-august-batch-insert-non-dry-run-slice/i.test(doc));
assert("sort_order plan", /sort_order|Option A/i.test(doc));
assert("july bump documented", /\+ 19|sort_order \+ 19/i.test(doc));
assert("rollback documented", /rollback|ROLLBACK/i.test(doc));
assert("verification SQL", /beforeVerification|afterVerification/i.test(doc));

assert("sql not executed", /sqlExecuted: false|NOT EXECUTED|実行禁止/i.test(doc));
assert("DB write none", /dbWriteExecuted: false|DB write.*\*\*no\*\*/i.test(doc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProject.*${FORBIDDEN_PROD_REF}`, "i");
assert("forbidden prod ref not active target", deniedOk.test(doc));

if (exists(SQL_REL)) {
  const sql = read(SQL_REL);
  assert("SQL draft exists", true);
  assert("SQL marked not executed", /NOT EXECUTED|DRAFT/i.test(sql));
  const inserts = (sql.match(/^INSERT INTO/gim) || []).length;
  assert("SQL draft 17 inserts", inserts === 17, `got ${inserts}`);
  assert("SQL no hold 008", !sql.includes("schedule-2026-08-008"));
  assert("SQL no hold 018", !/INSERT[\s\S]*schedule-2026-08-018/.test(sql));
}

if (exists(CANDIDATES_REL)) {
  const c = JSON.parse(read(CANDIDATES_REL));
  const hold = c.candidates.filter((x) => [8, 18].includes(x.candidate_order));
  assert("candidates hold count 2", hold.length === 2);
}

assert("00-current-state mentions G-20r3", /G-20r3|august-db-insert-preflight/i.test(currentState));
assert("03-next-actions mentions G-20r3", /G-20r3|august-db-insert-preflight/i.test(nextActions));
assert("handoff mentions G-20r3", /G-20r3|august-db-insert-preflight/i.test(handoff));

const portCheck = spawnSync("lsof", ["-nP", "-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none`);
  failed += 1;
}

console.log(
  `\nG-20r3 Gosaki schedule August DB INSERT preflight verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
