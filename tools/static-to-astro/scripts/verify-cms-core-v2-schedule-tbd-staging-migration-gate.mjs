/**
 * CMS Core v2 — Schedule TBD staging migration gate / final-review (offline).
 *
 * Validates DO NOT EXECUTE SQL template + gate/final-review docs. No network / SQL / DB.
 * npm: verify:cms-core-v2-schedule-tbd-staging-migration-gate
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { removeGeneratedOutputDir } from "./lib/safe-output-cleanup.mjs";
import {
  PRODUCTION_REF_STOP,
  STAGING_PROJECT_REF,
} from "./lib/supabase-staging-ref-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const TEMP_OUT_REL = "output/_cms-core-v2-schedule-tbd-staging-migration-gate-tmp";

const GATE_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-staging-migration-gate.md",
);
const FINAL_DOC = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-staging-migration-final-review.md",
);
const SQL = path.join(
  TOOL_ROOT,
  "scripts/supabase/cms-core-v2-schedule-tbd-date-staging-migration.template.sql",
);
const CONTRACT_PLAN = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-contract-planning.md",
);
const ADMIN_PLAN = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-schedule-tbd-date-admin-save-planning.md",
);
const MIO_GATE = path.join(
  TOOL_ROOT,
  "docs/cms-core-v2-mio-supabase-live-select-only-seed-write-gate.md",
);
const SUITE = path.join(__dirname, "run-cms-core-v2-safety-suite.mjs");
const PKG = path.join(TOOL_ROOT, "package.json");
const READ_CORE = path.join(__dirname, "lib/supabase-schedule-read.mjs");
const ADMIN_STATE = path.join(__dirname, "lib/schedule-admin-date-state.mjs");
const PAYLOAD = path.join(__dirname, "lib/schedule-tbd-save-payload.mjs");

const MIGRATIONS_DIR = path.join(REPO_ROOT, "supabase/migrations");
const TOOL_MIGRATIONS = path.join(TOOL_ROOT, "supabase/migrations");

let passed = 0;
let failed = 0;
/** @type {string | null} */
let tempOut = null;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failed += 1;
  }
}

function cleanupTemp() {
  if (tempOut && fs.existsSync(tempOut)) {
    removeGeneratedOutputDir(tempOut, TOOL_ROOT);
  }
  tempOut = null;
}

/** @param {string} src */
function stripLineComments(src) {
  return src
    .split("\n")
    .map((line) => line.replace(/--.*$/, ""))
    .join("\n");
}

/**
 * Extract SQL between begin; ... commit; for labeled blocks B and D.
 * @param {string} sql
 * @param {RegExp} headerRe
 */
function extractTxnAfterHeader(sql, headerRe) {
  const header = sql.search(headerRe);
  if (header < 0) return "";
  const after = sql.slice(header);
  const begin = after.search(/^\s*begin\s*;/im);
  if (begin < 0) return "";
  const fromBegin = after.slice(begin);
  const commit = fromBegin.search(/^\s*commit\s*;/im);
  if (commit < 0) return fromBegin;
  return fromBegin.slice(0, commit + "commit;".length);
}

process.on("exit", () => {
  try {
    cleanupTemp();
  } catch {
    /* ignore */
  }
});

tempOut = path.join(TOOL_ROOT, TEMP_OUT_REL);
fs.mkdirSync(tempOut, { recursive: true });
fs.writeFileSync(path.join(tempOut, ".keep"), "tbd-mig-gate-tmp\n", "utf8");

assert("gate doc exists", fs.existsSync(GATE_DOC));
assert("final-review doc exists", fs.existsSync(FINAL_DOC));
assert("SQL template exists", fs.existsSync(SQL));
assert("contract planning exists", fs.existsSync(CONTRACT_PLAN));
assert("admin-save planning exists", fs.existsSync(ADMIN_PLAN));
assert("mio seed gate exists", fs.existsSync(MIO_GATE));

const doc = fs.readFileSync(GATE_DOC, "utf8");
const finalDoc = fs.readFileSync(FINAL_DOC, "utf8");
const sql = fs.readFileSync(SQL, "utf8");
const suiteSrc = fs.readFileSync(SUITE, "utf8");
const pkg = JSON.parse(fs.readFileSync(PKG, "utf8"));
const readCore = fs.readFileSync(READ_CORE, "utf8");
const adminState = fs.readFileSync(ADMIN_STATE, "utf8");
const payload = fs.readFileSync(PAYLOAD, "utf8");
const contractPlan = fs.readFileSync(CONTRACT_PLAN, "utf8");
const adminPlan = fs.readFileSync(ADMIN_PLAN, "utf8");
const mioGate = fs.readFileSync(MIO_GATE, "utf8");
const sqlCode = stripLineComments(sql);

assert(
  "gate phase id",
  /cms-core-v2-schedule-tbd-staging-migration-gate/.test(doc),
);
assert(
  "final-review phase id",
  /cms-core-v2-schedule-tbd-staging-migration-final-review/.test(finalDoc),
);
assert(
  "gate READY apply true",
  /READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY:\s*true/i.test(doc),
);
assert(
  "final READY apply true",
  /READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY:\s*true/i.test(finalDoc),
);
assert("gate SQL not executed", /SQL_EXECUTED:\s*false/i.test(doc));
assert("final SQL not executed", /SQL_EXECUTED:\s*false/i.test(finalDoc));
assert("gate DB write false", /DB_WRITE_EXECUTED:\s*false/i.test(doc));
assert("gate SCHEMA_CHANGED false", /SCHEMA_CHANGED:\s*false/i.test(doc));
assert("gate RUNTIME_CHANGED false", /RUNTIME_CHANGED:\s*false/i.test(doc));
assert("gate staging ref", doc.includes(STAGING_PROJECT_REF));
assert("gate production STOP", doc.includes(PRODUCTION_REF_STOP));
assert(
  "final human project visual check",
  /SQL Editor/.test(finalDoc) && /visual/i.test(finalDoc),
);
assert(
  "final concurrency lock documented",
  /ACCESS EXCLUSIVE/i.test(finalDoc) && /NOWAIT/i.test(finalDoc),
);
assert(
  "final PASTE_FROM_A documented",
  /PASTE_FROM_A/i.test(finalDoc) && /anon/i.test(finalDoc),
);
assert(
  "final fingerprint documented",
  /string_agg/i.test(finalDoc) && /md5/i.test(finalDoc),
);
assert(
  "gate no trailing spaces",
  doc.split("\n").every((l) => l === l.replace(/\s+$/u, "")),
);
assert(
  "final no trailing spaces",
  finalDoc.split("\n").every((l) => l === l.replace(/\s+$/u, "")),
);

assert("SQL DO NOT EXECUTE", /DO NOT EXECUTE/i.test(sql));
assert("SQL staging ref", sql.includes(STAGING_PROJECT_REF));
assert("SQL production STOP", sql.includes(PRODUCTION_REF_STOP));
assert(
  "SQL READY_FOR apply true",
  /READY_FOR_SCHEDULE_TBD_STAGING_MIGRATION_APPLY:\s*true/i.test(sql),
);
assert("SQL SQL_EXECUTED false", /SQL_EXECUTED:\s*false/i.test(sql));
assert(
  "SQL human project visual check",
  /HUMAN GATE|HUMAN: confirm SQL Editor project/i.test(sql),
);
assert("SQL has block A", /A\)\s*migration直前 SELECT-only preflight/i.test(sql));
assert("SQL has block B", /B\)\s*forward migration transaction/i.test(sql));
assert("SQL has block C", /C\)\s*migration後 SELECT-only/i.test(sql));
assert("SQL has block D", /D\)\s*guarded rollback transaction/i.test(sql));
assert("SQL has block E", /E\)\s*rollback後 SELECT-only/i.test(sql));

const beginCount = (sql.match(/^\s*begin\s*;/gim) || []).length;
const commitCount = (sql.match(/^\s*commit\s*;/gim) || []).length;
assert("SQL has BEGIN (≥2 for B+D)", beginCount >= 2, `begin=${beginCount}`);
assert("SQL has COMMIT (≥2 for B+D)", commitCount >= 2, `commit=${commitCount}`);

const txnB = extractTxnAfterHeader(sql, /B\)\s*forward migration transaction/i);
const txnD = extractTxnAfterHeader(sql, /D\)\s*guarded rollback transaction/i);
const txnBCode = stripLineComments(txnB);
const txnDCode = stripLineComments(txnD);

assert("B txn extracted", txnB.length > 80);
assert("D txn extracted", txnD.length > 80);

for (const [label, txn] of [
  ["B", txnBCode],
  ["D", txnDCode],
]) {
  const beginIdx = txn.search(/^\s*begin\s*;/im);
  const lockTimeoutIdx = txn.search(/set\s+local\s+lock_timeout/i);
  const stmtTimeoutIdx = txn.search(/set\s+local\s+statement_timeout/i);
  const lockIdx = txn.search(
    /lock\s+table\s+public\.schedules\s+in\s+access\s+exclusive\s+mode\s+nowait/i,
  );
  const schemaIdx = txn.search(
    /public\.schedules missing|date_status missing|PASTE_FROM_A/i,
  );

  assert(`${label} has lock_timeout`, lockTimeoutIdx >= 0);
  assert(`${label} has statement_timeout`, stmtTimeoutIdx >= 0);
  assert(`${label} has ACCESS EXCLUSIVE NOWAIT`, lockIdx >= 0);
  assert(
    `${label} lock_timeout after BEGIN`,
    beginIdx >= 0 && lockTimeoutIdx > beginIdx,
  );
  assert(
    `${label} statement_timeout after BEGIN`,
    beginIdx >= 0 && stmtTimeoutIdx > beginIdx,
  );
  assert(`${label} lock after timeouts`, lockIdx > lockTimeoutIdx && lockIdx > stmtTimeoutIdx);
  assert(
    `${label} lock before schema/data assert`,
    schemaIdx < 0 || lockIdx < schemaIdx,
  );
}

assert(
  "SQL PASTE_FROM_A expected totals",
  /PASTE_FROM_A/i.test(sql) && /expected_total\s+int\s*:=\s*-1/.test(sql),
);
assert(
  "SQL refuses incomplete PASTE_FROM_A",
  /PASTE_FROM_A incomplete/i.test(sql),
);
assert(
  "SQL warns anon counts not SoT",
  /anon/i.test(sql) && /full.?table|schedules_total/i.test(sql),
);

assert(
  "SQL data fingerprint string_agg+md5",
  /string_agg/i.test(sql) && /md5\s*\(/i.test(sql) && /legacy_id/.test(sql),
);
assert(
  "SQL fingerprint columns",
  /coalesce\(site_slug/.test(sql) &&
    /coalesce\(date::text/.test(sql) &&
    /coalesce\(month/.test(sql) &&
    /coalesce\(published::text/.test(sql) &&
    /coalesce\(sort_order::text/.test(sql) &&
    /extract\(epoch from updated_at\)/.test(sql),
);
assert(
  "SQL data fingerprint timezone-independent updated_at",
  /extract\(epoch from updated_at\)/.test(sql) &&
    !/coalesce\(updated_at::text/.test(sql),
);
assert(
  "SQL catalog definition fingerprint (indexdef)",
  /indexdef/.test(sql) && /index_def_fingerprint|into v_index_fp/.test(sql),
);
assert(
  "SQL catalog definition fingerprint (triggerdef)",
  /pg_get_triggerdef/.test(sql) && /tgenabled/.test(sql),
);
assert(
  "SQL catalog definition fingerprint (RLS)",
  /relrowsecurity/.test(sql) &&
    /pg_get_expr\(pol\.polqual/.test(sql) &&
    /polwithcheck/.test(sql),
);
assert(
  "SQL temp baseline fail-closed CREATE (no IF NOT EXISTS)",
  /create temporary table _cms_core_v2_tbd_mig_baseline/i.test(sql) &&
    !/create temporary table if not exists _cms_core_v2_tbd_mig_baseline/i.test(sql),
);
assert(
  "SQL no baseline temp DELETE",
  !/delete\s+from\s+_cms_core_v2_tbd_mig_baseline/i.test(sql),
);
assert(
  "SQL fingerprint before/after compare",
  /data fingerprint changed after DDL/i.test(sql) &&
    /data fingerprint drifted vs PASTE_FROM_A/i.test(sql),
);

assert(
  "SQL adds date_status NOT NULL DEFAULT confirmed",
  /add column date_status text not null default 'confirmed'/i.test(sql),
);
assert(
  "SQL backfill assert confirmed",
  /date_status = 'confirmed'/.test(sql) && /confirmed backfill mismatch/i.test(sql),
);

const statusCheckPos = sql.search(
  /add constraint schedules_date_status_check/i,
);
const consistencyPos = sql.search(
  /add constraint schedules_date_status_date_consistency_check/i,
);
const dropNotNullPos = sql.search(/alter column date drop not null/i);
assert("SQL status CHECK present", statusCheckPos >= 0);
assert("SQL consistency CHECK present", consistencyPos >= 0);
assert("SQL DROP NOT NULL present", dropNotNullPos >= 0);
assert(
  "SQL CHECK order: status → consistency → DROP NOT NULL",
  statusCheckPos < consistencyPos && consistencyPos < dropNotNullPos,
);
assert("SQL NOT VALID then VALIDATE", /not valid/i.test(sql) && /validate constraint/i.test(sql));

assert(
  "SQL collision guard date_status exists",
  /date_status already exists/i.test(sql),
);
assert(
  "SQL CHECK name collision guard",
  /TBD CHECK constraint name already present/i.test(sql),
);
assert(
  "SQL null date preflight refuse",
  /date IS NULL rows exist/i.test(sql),
);
assert(
  "SQL row-count assertions",
  /total row count changed/i.test(sql) && /published count changed/i.test(sql),
);
assert(
  "SQL catalog fingerprint asserts",
  /index fingerprint changed after DDL/i.test(sql) &&
    /trigger fingerprint changed after DDL/i.test(sql) &&
    /RLS fingerprint changed after DDL/i.test(sql),
);

assert(
  "SQL rollback tbd zero guard",
  /date_status=tbd rows exist/i.test(sql),
);
assert(
  "SQL rollback null date zero guard",
  /STOP rollback: date IS NULL/i.test(sql),
);
assert(
  "SQL rollback unknown zero guard",
  /STOP rollback: null\/unknown date_status/i.test(sql),
);
assert(
  "SQL rollback contract violation zero guard",
  /STOP rollback: contract violations/i.test(sql),
);
assert(
  "SQL rollback schema type/null/default guards",
  /STOP rollback: date_status type unexpected/i.test(sql) &&
    /STOP rollback: date_status must be NOT NULL/i.test(sql) &&
    /STOP rollback: date_status DEFAULT must include confirmed/i.test(sql),
);
assert(
  "SQL rollback validated CHECK guards",
  /schedules_date_status_check not validated/i.test(sql) &&
    /schedules_date_status_date_consistency_check not validated/i.test(sql) &&
    /convalidated/.test(sql),
);
assert(
  "SQL rollback CHECK def mismatch guards",
  /schedules_date_status_check def mismatch/i.test(sql) &&
    /consistency CHECK def mismatch/i.test(sql),
);
assert(
  "SQL rollback SET NOT NULL",
  /alter column date set not null/i.test(sql),
);
assert(
  "SQL rollback DROP COLUMN date_status",
  /drop column date_status/i.test(sql),
);
assert(
  "SQL rollback DROP CONSTRAINT without IF EXISTS",
  /drop constraint schedules_date_status_date_consistency_check/i.test(sql) &&
    /drop constraint schedules_date_status_check/i.test(sql) &&
    !/drop constraint if exists/i.test(sqlCode),
);

assert("SQL no DROP TABLE", !/\bdrop\s+table\b/i.test(sqlCode));
assert("SQL no TRUNCATE", !/\btruncate\b/i.test(sqlCode));
assert("SQL no DELETE", !/\bdelete\b/i.test(sqlCode));
assert(
  "SQL no UPSERT",
  !/\bupsert\b/i.test(sqlCode) && !/\bon\s+conflict\b/i.test(sqlCode),
);
assert(
  "SQL no UPDATE",
  !/\bupdate\b/i.test(sqlCode),
);
assert(
  "SQL no updated_at assignment",
  !/updated_at\s*=/i.test(sqlCode),
);
assert(
  "SQL schedules INSERT absent",
  !/\binsert\s+into\s+public\.schedules\b/i.test(sqlCode),
);
assert("SQL no mio-sched seed ids", !/mio-sched-/i.test(sqlCode));
assert(
  "SQL no production ref as target host",
  !new RegExp(`https://${PRODUCTION_REF_STOP}`, "i").test(sqlCode),
);

assert(
  "SQL not in repo supabase/migrations",
  !fs.existsSync(path.join(MIGRATIONS_DIR, path.basename(SQL))),
);
assert(
  "SQL not in tools supabase/migrations",
  !fs.existsSync(path.join(TOOL_MIGRATIONS, path.basename(SQL))),
);

const scheduleSelectMatch = readCore.match(
  /GOSAKI_SCHEDULE_SELECT\s*=\s*"([^"]+)"/,
);
assert(
  "read core SCHEDULE_SELECT string found",
  Boolean(scheduleSelectMatch?.[1]),
);
assert(
  "read core SELECT omits date_status",
  scheduleSelectMatch?.[1]
    ? !scheduleSelectMatch[1].includes("date_status")
    : false,
);
assert(
  "admin state helper still offline module",
  /resolveScheduleAdminDateState/.test(adminState),
);
assert(
  "payload helper still offline module",
  /buildScheduleTbdSavePayload/.test(payload),
);

assert(
  "contract planning mentions migration gate",
  /cms-core-v2-schedule-tbd-staging-migration-gate/.test(contractPlan),
);
assert(
  "admin planning mentions migration",
  /migration/i.test(adminPlan),
);
assert(
  "mio gate still NOT READY",
  /READY_FOR_MIO_SEED_APPLY:\s*false/i.test(mioGate),
);
assert(
  "mio gate points at migration gate/apply",
  /staging-migration/.test(mioGate),
);

assert(
  "package.json script registered",
  Boolean(pkg.scripts?.["verify:cms-core-v2-schedule-tbd-staging-migration-gate"]),
);
assert(
  "safety suite registers offline gate verifier",
  /verify-cms-core-v2-schedule-tbd-staging-migration-gate\.mjs/.test(suiteSrc),
);
assert(
  "safety suite does not register live SELECT for this gate",
  !/tbd-staging-migration-gate.*live/i.test(suiteSrc) &&
    !/live-select.*tbd-staging-migration/i.test(suiteSrc),
);

const diffCheck = spawnSync("git", ["diff", "--check"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert(
  "git diff --check clean",
  diffCheck.status === 0 && !(diffCheck.stdout || "").trim(),
  (diffCheck.stdout || diffCheck.stderr || "").slice(0, 200),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log("VERIFY cms-core-v2-schedule-tbd-staging-migration-gate: ALL PASS");
}
