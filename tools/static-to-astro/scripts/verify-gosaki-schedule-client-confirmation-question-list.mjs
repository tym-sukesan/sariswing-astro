/**
 * G-20r2a — Gosaki schedule client confirmation question list verifier.
 * Run: node tools/static-to-astro/scripts/verify-gosaki-schedule-client-confirmation-question-list.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-client-confirmation-question-list.md";
const CANDIDATES_REL = "tools/static-to-astro/docs/gosaki-schedule-august-seed-candidates.json";
const FORBIDDEN_PROD_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "abfa594";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
}).stdout.trim();

assert("question list doc exists", exists(DOC_REL));
assert("HEAD matches BASE_COMMIT", head === BASE_COMMIT, `HEAD=${head}`);

assert("phase is client confirmation question list", /G-20r2a-gosaki-client-confirmation-question-list|client confirmation question list/i.test(doc));
assert("event count 19", /eventCount: 19|event_count.*19|19件/i.test(doc));
assert("needs_client_confirmation 3", /needsClientConfirmationCount: 3|needs_client_confirmation.*3|必須確認.*3/i.test(doc));

assert("8/10 documented", /2026-08-10|8月10日|8\/10/i.test(doc));
assert("8/15 documented", /2026-08-15|8月15日|8\/15/i.test(doc));
assert("8/21 documented", /2026-08-21|8月21日|8\/21/i.test(doc));

assert("partial gaps documented", /partial gaps|#1–2|#8|#11|#14|#18|地ビールフェスト|二部制/i.test(doc));
assert("angle bracket source parity not kit bug", /source parity|Kit.*bugではない|Kit変換バグではない/i.test(doc));

assert("client message draft exists", /本人に送る確認メッセージ案|後藤さん|新サイトへ反映/i.test(doc));
assert("published judgment memo", /published.*false|下書き|案 A|案 B|案 C/i.test(doc));

const sqlGlob = spawnSync(
  "find",
  ["tools/static-to-astro", "-name", "*.sql", "-newer", path.join(REPO_ROOT, DOC_REL)],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
const newSql = sqlGlob.stdout.trim().split("\n").filter(Boolean);
assert("no new SQL files", newSql.length === 0, newSql.join(", "));

assert("DB write none", /dbWriteInThisPhase: false|DB write.*\*\*no\*\*/i.test(doc));
assert("Save none", /saveInThisPhase: false|Save.*\*\*no\*\*/i.test(doc));
assert("package regen none", /packageRegenInThisPhase: false|package regen.*\*\*no\*\*/i.test(doc));
assert("FTP none", /FTP.*\*\*no\*\*|ftp/i.test(doc));
assert("production change none", /production.*\*\*no\*\*|production 変更/i.test(doc));
assert("G-20r3 approvalId required", /G-20r3.*approvalId|approvalId 必須/i.test(doc));

const deniedOk = new RegExp(`Never.*${FORBIDDEN_PROD_REF}|forbiddenProjectRef`, "i");
assert("forbidden prod ref not active target", deniedOk.test(doc));

if (exists(CANDIDATES_REL)) {
  const candidates = JSON.parse(read(CANDIDATES_REL));
  const needsConfirm = candidates.candidates?.filter((c) => c.needs_client_confirmation) ?? [];
  assert("candidates JSON needs_client_confirmation 3", needsConfirm.length === 3, `got ${needsConfirm.length}`);
}

assert("00-current-state mentions G-20r2a", /G-20r2a|client-confirmation-question-list/i.test(currentState));
assert("03-next-actions mentions G-20r2a", /G-20r2a|client-confirmation-question-list/i.test(nextActions));
assert("handoff mentions G-20r2a", /G-20r2a|client-confirmation-question-list/i.test(handoff));

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
  `\nG-20r2a Gosaki schedule client confirmation question list verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
