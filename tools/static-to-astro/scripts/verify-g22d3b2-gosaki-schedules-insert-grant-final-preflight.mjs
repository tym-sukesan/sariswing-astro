/**
 * G-22d3b2 — Gosaki schedules INSERT grant final preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g22d3b2-gosaki-schedules-insert-grant-final-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const BASE_COMMIT = "f61ab6e";

const DOC_REL = "tools/static-to-astro/docs/gosaki-schedules-insert-grant-final-preflight.md";
const AUDIT_DOC =
  "tools/static-to-astro/docs/gosaki-schedule-duplicate-insert-permission-denied-audit.md";
const SQL_REL =
  "tools/static-to-astro/scripts/supabase/gosaki-schedules-g22d3b2-insert-grant-final-preflight.sql";

const APPROVAL_ID = "G-22d3b2-gosaki-schedules-insert-grant-apply";
const GRANT_SQL = "grant insert on table public.schedules to authenticated;";
const REVOKE_SQL = "revoke insert on table public.schedules from authenticated;";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PROD_REF = "vsbvndwuajjhnzpohghh";
const PLANNED_LEGACY = "schedule-2026-03-014";

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

assert("HEAD is f61ab6e", head.stdout.trim() === BASE_COMMIT, head.stdout.trim());
assert("origin/main is f61ab6e", origin.stdout.trim() === BASE_COMMIT, origin.stdout.trim());

assert("final preflight doc exists", exists(DOC_REL));
assert("prior audit doc exists", exists(AUDIT_DOC));
assert("SQL template exists", exists(SQL_REL));

const doc = read(DOC_REL);
const auditDoc = read(AUDIT_DOC);
const sql = read(SQL_REL);

assert("doc phase G-22d3b2", doc.includes("G-22d3b2-gosaki-schedules-insert-grant-final-preflight"));
assert("doc preflight gate complete", doc.includes("gosakiSchedulesInsertGrantFinalPreflightComplete: true"));
assert("doc ready G-22d3b3", doc.includes("readyForG22d3b3InsertGrantOperatorExecution: true"));
assert("doc save retry blocked", doc.includes("readyForG22d3b4DuplicateInsertSaveRetry: false"));
assert("doc grant not executed", doc.includes("grantExecuted: false"));
assert("doc approvalId", doc.includes(APPROVAL_ID));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc never prod", /never.*vsbvndwuajjhnzpohghh/i.test(doc));
assert("doc exact grant SQL", doc.includes(GRANT_SQL));
assert("doc revoke rollback", doc.includes(REVOKE_SQL));
assert("doc afterVerification", doc.includes("afterVerification"));
assert("doc STOP conditions", doc.includes("STOP"));
assert("doc forbidden anon grant", doc.includes("grant insert ... to anon"));
assert("doc forbidden policy change", doc.includes("alter policy"));
assert("doc authenticated INSERT root cause", doc.includes("authenticated") && doc.includes("INSERT"));
assert("doc schedules_admin_all", doc.includes("schedules_admin_all"));
assert("doc no-write 014 zero", doc.includes(PLANNED_LEGACY));
assert("doc march count 13", doc.includes("march_count") || doc.includes("March count"));
assert("doc G-22d3b3 next", doc.includes("G-22d3b3"));
assert("doc base commit f61ab6e", doc.includes(BASE_COMMIT));

assert("audit doc prior", auditDoc.includes("G-22d3b-blocker"));
assert("sql SELECT only sections", sql.includes("SELECT only") || sql.includes("select count"));
assert("sql pre-grant grants", sql.includes("role_table_grants"));
assert("sql post-grant has_insert", sql.includes("has_insert"));
assert("sql rollback comment", sql.includes("revoke insert"));
assert("sql no active grant", !sql.match(/^\s*grant\s+insert/im));
assert("sql no insert into schedules", !sql.match(/^\s*insert\s+into\s+public\.schedules/im));

assert(
  "doc mentions prod ref only as never",
  doc.includes(PROD_REF) && /never.*vsbvndwuajjhnzpohghh/i.test(doc),
);
assert(
  "sql mentions prod ref only as stop",
  sql.includes(PROD_REF) && sql.includes("STOP"),
);

console.log(
  `\nG-22d3b2 Gosaki schedules INSERT grant final preflight verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
