/**
 * G-20u36e-controlled-save-rollback-name-adjustment-prep verifier.
 * Prep only — no Rollback / REVOKE / DROP / Save execution.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-rollback-name-adjustment-prep.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-rollback-name-adjustment-prep.md";
const POST_APPLY_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-post-apply-result.md";
const PHASE = "G-20u36e-controlled-save-rollback-name-adjustment-prep";
const GATE =
  "gosakiDiscographyControlledSaveRollbackNameAdjustmentPrepared: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-handler-permission-aware-planning";
const INTENDED =
  "discography_tracks_g20u36e_controlled_save_title_update_restrictive";
const OBSERVED =
  "discography_tracks_g20u36e_controlled_save_title_update_restric";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

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

function stripSqlLineComments(sql) {
  return sql
    .split("\n")
    .map((line) => {
      const idx = line.indexOf("--");
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join("\n");
}

assert("rollback name adjustment doc exists", exists(DOC_REL));
assert("post-apply result doc exists", exists(POST_APPLY_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

const rollbackSql = extractFencedSqlAfterHeading(
  doc,
  "## 2. Adjusted rollback SQL",
);
const preRollbackSql = extractFencedSqlAfterHeading(
  doc,
  "## 3. Pre-rollback verification SELECT-only SQL",
);
const postRollbackSql = extractFencedSqlAfterHeading(
  doc,
  "## 4. Adjusted post-rollback verification SELECT-only SQL",
);
const rollbackExec = stripSqlLineComments(rollbackSql);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc preparation only",
  /Preparation only|preparationOnly:\s*true/i.test(doc),
);
assert(
  "doc Rollback未実行",
  /Rollback executed.*\*\*no\*\*|rollbackExecuted:\s*false|Rollback未実行/i.test(
    doc,
  ),
);
assert(
  "doc REVOKE未実行",
  /REVOKE executed.*\*\*no\*\*|revokeExecuted:\s*false|REVOKE未実行/i.test(doc),
);
assert(
  "doc DROP POLICY未実行",
  /DROP POLICY executed.*\*\*no\*\*|dropPolicyExecuted:\s*false|DROP POLICY未実行/i.test(
    doc,
  ),
);
assert(
  "doc SQL未実行",
  /SQL executed.*\*\*no\*\*|sqlExecuted:\s*false|SQL未実行/i.test(doc),
);
assert("doc DB writeなし", /DB write.*\*\*no\*\*|dbWriteExecuted:\s*false/i.test(doc));
assert(
  "doc Save未実行",
  /Save executed.*\*\*no\*\*|saveExecuted:\s*false|Save未実行/i.test(doc),
);
assert(
  "doc operation=save未送信",
  /operation=save.*not sent|operationSaveSent:\s*false|operation=save.*未送信/i.test(
    doc,
  ),
);
assert(
  "doc service_role不使用",
  /service_role.*not used|serviceRoleUsed:\s*false|service_role.*不使用/i.test(
    doc,
  ),
);
assert(
  "doc production未変更",
  /Production changed.*\*\*no\*\*|productionChanged:\s*false|production未変更/i.test(
    doc,
  ),
);
assert("doc intended full policy name", doc.includes(INTENDED));
assert("doc actual observed truncated policy name", doc.includes(OBSERVED));
assert(
  "doc policyname_length=63",
  /policyname_length.*\*\*63\*\*|policynameLength:\s*63/i.test(doc),
);
assert(
  "doc PostgreSQL identifier truncation",
  /PostgreSQL.*identifier truncation|identifier truncation/i.test(doc),
);
assert(
  "doc adjusted rollback SQL",
  /## 2\. Adjusted rollback SQL/i.test(doc) && rollbackSql.length > 50,
);
assert(
  "doc rollback uses actual observed truncated policy name",
  rollbackSql.includes(OBSERVED),
);
assert(
  "doc rollback SQL REVOKE UPDATE(title)",
  /REVOKE\s+UPDATE\s*\(\s*title\s*\)/i.test(rollbackSql),
);
assert(
  "doc rollback SQL DROP POLICY IF EXISTS actual name",
  /DROP\s+POLICY\s+IF\s+EXISTS\s+discography_tracks_g20u36e_controlled_save_title_update_restric/i.test(
    rollbackSql,
  ),
);
assert(
  "doc rollback does not touch admin_all/public_select/RLS/data",
  /Does not touch.*admin_all|admin_all \/ public_select|does NOT/i.test(doc) &&
    !/\b(ENABLE|DISABLE)\s+ROW\s+LEVEL\s+SECURITY\b/i.test(rollbackExec) &&
    !/\bINSERT\s+INTO\b/i.test(rollbackExec) &&
    !/\bDELETE\s+FROM\b/i.test(rollbackExec) &&
    !/^\s*UPDATE\s+/im.test(rollbackExec),
);
assert(
  "doc pre-rollback SELECT-only SQL",
  /g20u36e_permission_change_pre_rollback_snapshot/i.test(doc) &&
    preRollbackSql.length > 100,
);
assert(
  "doc post-rollback adjusted SELECT-only SQL",
  /g20u36e_permission_change_post_rollback_adjusted_snapshot/i.test(doc) &&
    postRollbackSql.length > 100,
);
assert(
  "doc target title old/new allowed",
  /old\/new|title_old_or_new_allowed|either.*old.*new|old \*\*or\*\* new/i.test(
    doc,
  ),
);
assert("doc STOP conditions", /## 5\. STOP conditions|STOP conditions/i.test(doc));
assert("doc next handler planning", doc.includes(NEXT_PHASE));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF));

// Static: rollback SQL safety
assert("rollback SQL extracted", rollbackSql.length > 50);
assert(
  "static rollback no data UPDATE/INSERT/DELETE",
  !/^\s*UPDATE\s+/im.test(rollbackExec) &&
    !/\bUPDATE\s+\w+\s+SET\b/i.test(rollbackExec) &&
    !/\bINSERT\s+INTO\b/i.test(rollbackExec) &&
    !/\bDELETE\s+FROM\b/i.test(rollbackExec),
);
assert(
  "static rollback no service_role",
  !/service_role/i.test(rollbackExec),
);
assert(
  "static rollback no production execute premise",
  !new RegExp(
    `ON\\s+${PRODUCTION_REF}|PROJECT\\s*=\\s*${PRODUCTION_REF}|USE\\s+${PRODUCTION_REF}`,
    "i",
  ).test(rollbackExec),
);
assert(
  "static DROP target is observed truncated name",
  /DROP\s+POLICY\s+IF\s+EXISTS\s+discography_tracks_g20u36e_controlled_save_title_update_restric/i.test(
    rollbackExec,
  ),
);
assert(
  "static DROP not primarily intended full name",
  !new RegExp(
    `DROP\\s+POLICY(?:\\s+IF\\s+EXISTS)?\\s+${INTENDED.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
    "i",
  ).test(rollbackExec),
);

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-rollback-name-adjustment-prep",
  ),
);
assert(
  "AI current-state rollback name adjustment",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveRollbackNameAdjustmentPrepared",
    ),
);
assert(
  "AI next-actions handler planning or rollback prep",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff rollback name adjustment",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveRollbackNameAdjustmentPrepared",
    ),
);

function supabaseFunctionsOnlyAllowedLocalImplOrClean() {
  const status = spawnSync(
    "git",
    ["status", "--porcelain", "--", "supabase/functions/"],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  const allowed = new Set([
    "supabase/functions/gosaki-discography-save-dry-run/handler.ts",
    "supabase/functions/gosaki-discography-save-dry-run/index.ts",
  ]);
  const files = status.stdout
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => line.slice(3).trim());
  return files.every((file) => allowed.has(file));
}

assert(
  "supabase/functions not modified (or only controlled local-impl files)",
  supabaseFunctionsOnlyAllowedLocalImplOrClean(),
  "unexpected supabase/functions changes",
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
  "unexpected output/manual-upload changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-rollback-name-adjustment-prep: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
