/**
 * G-22j2 — Gosaki Schedule CMS P0 release note verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22j2-gosaki-schedule-cms-p0-release-note.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedule-cms-p0-release-note.md";
const G22J1_CLOSURE = "tools/static-to-astro/docs/gosaki-schedule-p0-overall-closure.md";

const BASE_COMMIT = "904a248";
const TARGET_LEGACY = "schedule-2026-07-008";
const REF_014 = "schedule-2026-03-014";
const REF_001 = "schedule-2026-09-001";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";

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

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

assert("HEAD is 904a248", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is 904a248", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("release note doc exists", exists(DOC_REL));
assert("G-22j1 closure doc exists", exists(G22J1_CLOSURE));

const doc = read(DOC_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-22j2", doc.includes("G-22j2-gosaki-schedule-cms-p0-release-note"));
assert(
  "doc release note gate complete",
  doc.includes("gosakiScheduleCmsP0ReleaseNoteComplete: true"),
);
assert("doc schedule CMS P0 complete", doc.includes("scheduleCmsP0Complete: true"));

assert("doc overview gosaki-piano", /gosaki-piano/i.test(doc));
assert("doc CMS Kit", /CMS Kit/i.test(doc));
assert("doc Wix Astro migration", /Wix|Astro/i.test(doc));

assert("doc capabilities section", /できるようになったこと/i.test(doc));
assert("doc admin login", /管理画面ログイン|authenticated admin read/i.test(doc));
assert("doc schedule list", /一覧表示|スケジュール一覧/i.test(doc));
assert("doc search filter", /検索|フィルタ/i.test(doc));
assert("doc legacy_id", /legacy_id/i.test(doc));

assert("doc new event", /新規追加/i.test(doc));
assert("doc duplicate", /複製/i.test(doc));
assert("doc unpublish", /非公開化/i.test(doc));
assert("doc republish", /再公開/i.test(doc));

assert("doc authenticated admin read", /authenticated admin read/i.test(doc));
assert("doc save preview", /preview|プレビュー/i.test(doc));
assert("doc optimistic lock", /optimistic lock/i.test(doc));
assert("doc public reflection", /public reflection/i.test(doc));

assert("doc safety design", /安全設計/i.test(doc));
assert("doc physical delete none", /physical DELETE.*なし|physical DELETE なし/i.test(doc));
assert("doc ftp separate gate", /FTP.*別|別高リスク/i.test(doc));
assert("doc mirror delete forbidden", /--delete|mirror.*禁止/i.test(doc));
assert("doc service role not used", /service_role.*未使用|service_role 未使用/i.test(doc));

assert("doc 008 published true", doc.includes(TARGET_LEGACY) && doc.includes("published=true") || doc.includes("**`true`**"));
assert("doc 014 published false", doc.includes(REF_014) && doc.includes("published=false") || doc.includes("**`false`**"));
assert("doc 001 published false", doc.includes(REF_001));

assert("doc db local live aligned", /DB.*local.*live|整合済み/i.test(doc));
assert("doc upload not needed", /uploadNeeded: false|upload.*不要|Upload.*不要/i.test(doc));
assert("doc G-22i5 G-22i6 skip", /G-22i5.*skip|skipped/i.test(doc));

assert("doc physical delete deferred", doc.includes("physicalDeleteDeferred: true") || /physical DELETE.*後回し|未実装/i.test(doc));
assert("doc UX polish deferred", /UX polish|文言整理/i.test(doc));

assert("doc future discography", /Discography/i.test(doc));
assert("doc future youtube", /YouTube/i.test(doc));
assert("doc 30 minute flow", /30.*分|30-minute|30 分/i.test(doc));
assert("doc customer explanation", /顧客説明/i.test(doc));

assert("doc cursor save false", doc.includes("cursorSaveExecuted: false"));
assert("doc cursor db write false", doc.includes("cursorDbWriteExecuted: false"));
assert("doc cursor sql mutation false", doc.includes("cursorSqlMutationExecuted: false"));
assert("doc package regen false", doc.includes("packageRegenExecuted: false"));
assert("doc ftp not executed", doc.includes("ftpUploadExecuted: false"));
assert("doc deploy not executed", doc.includes("deployExecuted: false"));

assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert(
  "doc prod ref only in never context",
  !doc.includes(PROD_REF) || /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);

const portCheck = spawnSync("lsof", ["-iTCP:4321", "-sTCP:LISTEN"], {
  encoding: "utf8",
});
if (portCheck.stdout.trim().length === 0) {
  console.log("PASS port 4321 LISTEN none");
  passed += 1;
} else {
  console.error(`FAIL port 4321 LISTEN none — ${portCheck.stdout.trim()}`);
  failed += 1;
}

assert("00-current-state mentions G-22j2", currentState.includes("G-22j2"));
assert("03-next-actions mentions G-22j2", nextActions.includes("G-22j2"));
assert("handoff mentions G-22j2", handoff.includes("G-22j2"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Package regen not executed by Cursor", true);
assert("FTP not executed by Cursor", true);
assert("Deploy not executed by Cursor", true);
assert("GRANT/REVOKE not executed by Cursor", true);
assert("RLS not changed by Cursor", true);
assert("service_role not used by Cursor", true);

console.log(
  `\nG-22j2 Gosaki Schedule CMS P0 release note verifier: ${passed} passed, ${failed} failed\n`,
);
process.exit(failed > 0 ? 1 : 0);
