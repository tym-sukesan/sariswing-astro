/**
 * G-20u44c-gosaki-discography-label-permission-enablement-prep verifier.
 * SQL prep only — no SQL / GRANT / POLICY / Save execution.
 * Run: npm run verify:g20u44c-gosaki-discography-label-permission-enablement-prep
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
  "tools/static-to-astro/docs/gosaki-discography-label-permission-enablement-prep.md";
const PHASE = "G-20u44c-gosaki-discography-label-permission-enablement-prep";
const GATE = "gosakiDiscographyLabelPermissionEnablementPrepComplete: true";
const NEXT_PHASE =
  "G-20u44d-gosaki-discography-label-permission-preflight-select-execution";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const POLICY_NAME = "discography_g20u43_label_update_restrict";
const TARGET_LEGACY_ID = "discography-004";
const BASELINE_LABEL = "Mardi Gras JAPAN Records";
const TEMPORARY_LABEL = "[CMS Kit staging] G-20u42 label PoC";
const BASELINE_UPDATED_AT = "2026-07-10T05:59:35.138671+00:00";

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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  const status = spawnSync("git", ["status", "--porcelain", "--", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

function extractFencedSqlAfterHeading(doc, headingNeedle) {
  const headingIdx = doc.indexOf(headingNeedle);
  if (headingIdx < 0) return "";
  const after = doc.slice(headingIdx);
  const fenceStart = after.indexOf("```sql");
  if (fenceStart < 0) return "";
  const bodyStart = fenceStart + "```sql".length;
  const fenceEnd = after.indexOf("```", bodyStart);
  if (fenceEnd < 0) return "";
  return after.slice(bodyStart, fenceEnd);
}

/** Strip `--` line comments so Forbidden notes do not false-positive static checks. */
function stripSqlLineComments(sql) {
  return sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const g20u42Doc = read(
  "tools/static-to-astro/docs/gosaki-discography-controlled-save-enablement-preflight.md",
);
const g20u43Doc = read(
  "tools/static-to-astro/docs/gosaki-discography-label-controlled-save-slice-local-implementation.md",
);

const preflightSql = extractFencedSqlAfterHeading(
  doc,
  "## A. Preflight SELECT-only SQL",
);
const applySql = extractFencedSqlAfterHeading(doc, "## B. Apply SQL");
const postApplySql = extractFencedSqlAfterHeading(
  doc,
  "## C. Post-apply verification SELECT-only SQL",
);
const rollbackSql = extractFencedSqlAfterHeading(doc, "## D. Rollback SQL");
const postRollbackSql = extractFencedSqlAfterHeading(
  doc,
  "## E. Post-rollback verification SELECT-only SQL",
);

const applySqlExec = stripSqlLineComments(applySql);
const rollbackSqlExec = stripSqlLineComments(rollbackSql);
const preflightSqlExec = stripSqlLineComments(preflightSql);
const postApplySqlExec = stripSqlLineComments(postApplySql);

assert("SQL prep doc exists", exists(DOC_REL));
assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("doc SQL prep only", /SQL prep only|sqlPrepOnly/i.test(doc));
assert(
  "PERMISSION_PREFLIGHT_SQL_READY true",
  /PERMISSION_PREFLIGHT_SQL_READY:\s*true/.test(doc),
);
assert(
  "PERMISSION_APPLY_SQL_READY true",
  /PERMISSION_APPLY_SQL_READY:\s*true/.test(doc),
);
assert(
  "POST_APPLY_VERIFY_SQL_READY true",
  /POST_APPLY_VERIFY_SQL_READY:\s*true/.test(doc),
);
assert(
  "PERMISSION_ROLLBACK_SQL_READY true",
  /PERMISSION_ROLLBACK_SQL_READY:\s*true/.test(doc),
);
assert(
  "COLUMN_LEVEL_GRANT_ONLY true",
  /COLUMN_LEVEL_GRANT_ONLY:\s*true/.test(doc),
);
assert(
  "RESTRICTIVE_POLICY_READY true",
  /RESTRICTIVE_POLICY_READY:\s*true/.test(doc),
);
assert(
  "ANON_UPDATE_REMAINS_DENIED true",
  /ANON_UPDATE_REMAINS_DENIED:\s*true/.test(doc),
);
assert(
  "TABLE_WIDE_UPDATE_REMAINS_DENIED true",
  /TABLE_WIDE_UPDATE_REMAINS_DENIED:\s*true/.test(doc),
);
assert(
  "PRODUCTION_STOP_PRESERVED true",
  /PRODUCTION_STOP_PRESERVED:\s*true/.test(doc),
);
assert("SQL_EXECUTED false", /SQL_EXECUTED:\s*false/.test(doc));
assert("DB_WRITE_EXECUTED false", /DB_WRITE_EXECUTED:\s*false/.test(doc));
assert("SAVE_REQUEST_EXECUTED false", /SAVE_REQUEST_EXECUTED:\s*false/.test(doc));
assert("doc grantRevokeExecuted no", /grantRevokeExecuted:\s*false/.test(doc));
assert(
  "doc createDropPolicyExecuted no",
  /createDropPolicyExecuted:\s*false/.test(doc),
);
assert("doc service_role not used", /service_role.*not used/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF));
assert("doc target table discography", /public\.discography/.test(doc));
assert("doc target role authenticated", /TO authenticated/.test(doc));
assert("doc target column label", /UPDATE\s*\(\s*label\s*\)/i.test(doc));
assert("doc policy name", doc.includes(POLICY_NAME));
assert("doc target legacy_id", doc.includes(TARGET_LEGACY_ID));
assert("doc site_slug gosaki-piano", doc.includes("gosaki-piano"));
assert("doc baseline label", doc.includes(BASELINE_LABEL));
assert("doc temporary label", doc.includes(TEMPORARY_LABEL));
assert("doc baseline updated_at", doc.includes(BASELINE_UPDATED_AT));
assert("doc root cause Class B", /ROOT_CAUSE_CLASS.*\*\*B\*\*/.test(doc));
assert("doc admin predicate decision", /Admin predicate placement/i.test(doc));
assert("doc Edge transition note", /Transition direction/i.test(doc));
assert("doc operator execution order", /Operator execution order/i.test(doc));
assert("doc next phase", doc.includes(NEXT_PHASE));

assert("preflight SQL extracted", preflightSql.length > 200);
assert("apply SQL extracted", applySql.length > 200);
assert("post-apply SQL extracted", postApplySql.length > 200);
assert("rollback SQL extracted", rollbackSql.length > 100);
assert("post-rollback SQL extracted", postRollbackSql.length > 100);

assert(
  "preflight SELECT-only no GRANT",
  !/\bGRANT\b/i.test(preflightSqlExec) && !/\bREVOKE\b/i.test(preflightSqlExec),
);
assert(
  "preflight SELECT-only no mutation keywords",
  !/\bINSERT\s+INTO\b/i.test(preflightSqlExec) &&
    !/\bDELETE\s+FROM\b/i.test(preflightSqlExec) &&
    !/\bCREATE\s+POLICY\b/i.test(preflightSqlExec),
);
assert(
  "post-apply SELECT-only no GRANT",
  !/\bGRANT\b/i.test(postApplySqlExec) && !/\bREVOKE\b/i.test(postApplySqlExec),
);

assert(
  "apply SQL has BEGIN COMMIT transaction",
  /\bBEGIN\s*;/i.test(applySqlExec) && /\bCOMMIT\s*;/i.test(applySqlExec),
);
assert(
  "apply SQL has fail-closed RAISE EXCEPTION",
  /RAISE EXCEPTION/i.test(applySqlExec),
);
assert(
  "apply SQL has GRANT UPDATE (label) only",
  /GRANT UPDATE\s*\(\s*label\s*\)\s+ON TABLE public\.discography\s+TO authenticated/i.test(
    applySqlExec,
  ),
);
assert(
  "apply SQL no table-wide GRANT UPDATE",
  !/GRANT UPDATE\s+ON TABLE public\.discography\s+TO authenticated/i.test(
    applySqlExec,
  ),
);
assert(
  "apply SQL has CREATE POLICY RESTRICTIVE",
  /CREATE POLICY/i.test(applySqlExec) &&
    /AS RESTRICTIVE/i.test(applySqlExec) &&
    applySqlExec.includes(POLICY_NAME),
);
assert(
  "apply SQL FOR UPDATE TO authenticated",
  /FOR UPDATE/i.test(applySqlExec) && /TO authenticated/i.test(applySqlExec),
);
assert(
  "apply SQL USING slice predicates",
  /USING\s*\(/i.test(applySqlExec) &&
    applySqlExec.includes("site_slug = 'gosaki-piano'") &&
    applySqlExec.includes(`legacy_id = '${TARGET_LEGACY_ID}'`) &&
    applySqlExec.includes(BASELINE_LABEL) &&
    applySqlExec.includes(TEMPORARY_LABEL),
);
assert(
  "apply SQL WITH CHECK slice predicates",
  /WITH CHECK\s*\(/i.test(applySqlExec),
);
assert(
  "apply SQL references discography_admin_all guard",
  /discography_admin_all/i.test(applySqlExec),
);
assert(
  "apply SQL no data UPDATE/INSERT/DELETE",
  !/^\s*UPDATE\s+public\./im.test(applySqlExec) &&
    !/\bINSERT\s+INTO\b/i.test(applySqlExec) &&
    !/\bDELETE\s+FROM\b/i.test(applySqlExec),
);
assert("apply SQL no service_role", !/service_role/i.test(applySqlExec));
assert(
  "apply SQL no GRANT to anon",
  !/GRANT\s+[^;]*\bTO\s+anon\b/i.test(applySqlExec),
);
assert(
  "apply SQL no DROP POLICY IF EXISTS",
  !/DROP POLICY IF EXISTS/i.test(applySqlExec),
);
assert(
  "apply SQL no RLS disable",
  !/DISABLE ROW LEVEL SECURITY/i.test(applySqlExec),
);

assert(
  "rollback SQL transaction fail-closed",
  /\bBEGIN\s*;/i.test(rollbackSqlExec) &&
    /RAISE EXCEPTION/i.test(rollbackSqlExec) &&
    /\bCOMMIT\s*;/i.test(rollbackSqlExec),
);
assert(
  "rollback SQL REVOKE UPDATE (label)",
  /REVOKE UPDATE\s*\(\s*label\s*\)\s+ON TABLE public\.discography\s+FROM authenticated/i.test(
    rollbackSqlExec,
  ),
);
assert(
  "rollback SQL DROP POLICY",
  new RegExp(`DROP POLICY ${POLICY_NAME} ON public\\.discography`, "i").test(
    rollbackSqlExec,
  ),
);
assert(
  "rollback SQL no table-wide REVOKE",
  !/REVOKE UPDATE\s+ON TABLE public\.discography\s+FROM authenticated/i.test(
    rollbackSqlExec,
  ),
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u44c-gosaki-discography-label-permission-enablement-prep",
  ),
);
assert(
  "AI current-state G-20u44c",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyLabelPermissionEnablementPrep"),
);
assert(
  "AI next-actions G-20u44c or next",
  nextActions.includes(PHASE) || nextActions.includes(NEXT_PHASE),
);
assert(
  "AI handoff G-20u44c",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyLabelPermissionEnablementPrep"),
);
assert("g20u42 doc references G-20u44c", g20u42Doc.includes("G-20u44c"));
assert("g20u43 doc references G-20u44c", g20u43Doc.includes("G-20u44c"));

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u44c-gosaki-discography-label-permission-enablement-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
