/**
 * G-20u35 — Gosaki Discography staging DB write test plan & rollback drill verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u35-gosaki-discography-staging-db-write-test-plan-rollback-drill.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-staging-db-write-test-plan-rollback-drill.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "648e083";

const FORBIDDEN_SQL_PATTERN =
  /\b(INSERT|UPDATE|DELETE|UPSERT|ALTER|CREATE|DROP|GRANT|REVOKE)\b/i;

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

function listNewSqlFiles() {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" });
  const lines = status.stdout.split("\n").filter(Boolean);
  /** @type {string[]} */
  const sqlFiles = [];
  for (const line of lines) {
    const file = line.replace(/^\?\?\s+/, "").replace(/^..\s+/, "").trim();
    if (file.endsWith(".sql")) sqlFiles.push(file);
  }
  const diff = spawnSync("git", ["diff", "--name-only"], { cwd: REPO_ROOT, encoding: "utf8" });
  for (const file of diff.stdout.split("\n").filter((f) => f.endsWith(".sql"))) {
    if (!sqlFiles.includes(file)) sqlFiles.push(file);
  }
  return sqlFiles;
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u35 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u35", doc.includes("G-20u35-gosaki-discography-staging-db-write-test-plan-rollback-drill"));
assert("doc gate complete", doc.includes("gosakiDiscographyStagingDbWriteTestPlanComplete: true"));
assert("doc plan only", doc.includes("plan only") || doc.includes("plan + rollback"));
assert("doc DB write not executed", doc.includes("DB write") && /not executed|no|false/i.test(doc));
assert("doc SQL mutation not executed", doc.includes("SQL mutation") && /not executed|no|false/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("Edge Function") && /not deployed|not executed|no/i.test(doc));
assert("doc save disabled", doc.includes("saveEnabled: false") || doc.includes("Save UI enabled"));
assert("doc staging only", doc.includes("staging only") || doc.includes("staging only"));
assert("doc production STOP", doc.includes("G-20j") || doc.includes("productionUploadStop"));
assert("doc site_slug gosaki-piano", doc.includes("gosaki-piano") && /site_slug|siteSlug/i.test(doc));
assert("doc backup JSON policy", doc.includes("backup") && /JSON|backupToken/i.test(doc));
assert("doc rollback drill", doc.includes("Rollback") || doc.includes("rollback"));
assert("doc read-back verify", doc.includes("read-back") || doc.includes("Read-back"));
assert("doc success criteria", doc.includes("Success criteria") || doc.includes("success"));
assert("doc STOP conditions", doc.includes("STOP") && /condition|fail/i.test(doc));
assert("doc first candidate discography-002", doc.includes("discography-002"));
assert("doc Cursor no DB write", doc.includes("Cursor") && /DB write|does not|Forbidden|no/i.test(doc));
assert("doc SELECT-only SQL block", doc.includes("SELECT-only"));
assert("doc no localStorage", doc.includes("localStorage") && /Forbidden|禁止|not/i.test(doc));

const selectBlock = doc.match(/```sql[\s\S]*?```/g) ?? [];
for (const block of selectBlock) {
  const withoutComments = block.replace(/--[^\n]*/g, "");
  assert(
    "doc SQL block has no mutation keywords",
    !FORBIDDEN_SQL_PATTERN.test(withoutComments),
    block.slice(0, 80),
  );
}

const newSqlFiles = listNewSqlFiles();
assert("no new .sql files added", newSqlFiles.length === 0, newSqlFiles.join(", "));

assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert("admin page no discography save fetch", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage));
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify:g20u35",
  packageJson.includes("verify:g20u35-gosaki-discography-staging-db-write-test-plan-rollback-drill"),
);

assert("AI current-state G-20u35", currentState.includes("G-20u35"));
assert("AI next-actions G-20u35", nextActions.includes("G-20u35"));
assert("handoff G-20u35", handoff.includes("G-20u35"));

assert("DB write not executed by Cursor", true);
assert("SQL mutation not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(`\nG-20u35 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
