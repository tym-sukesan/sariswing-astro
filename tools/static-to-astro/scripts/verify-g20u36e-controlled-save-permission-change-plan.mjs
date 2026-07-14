/**
 * G-20u36e-controlled-save-permission-change-plan verifier.
 * Planning only — no SQL / GRANT / POLICY / Save execution.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-permission-change-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-change-plan.md";
const PROBE_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result.md";
const PHASE = "G-20u36e-controlled-save-permission-change-planning";
const GATE = "gosakiDiscographyControlledSavePermissionChangePlanPrepared: true";
const NEXT_PHASE = "G-20u36e-controlled-save-permission-change-sql-prep";
const BASE_COMMIT = "17aac7a";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const TARGET_ID = "e30c5ea9-2857-492b-8a78-58cbfcbe7929";

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT} (plan base; local edits expected)`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("plan doc exists", exists(DOC_REL));
assert("probe execution result doc exists", exists(PROBE_RESULT_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("doc planning only", /Planning only|planningOnly/i.test(doc));
assert(
  "doc executable SQL block none",
  /Executable SQL block|executableSqlBlock/i.test(doc) &&
    /none|なし|false|no/i.test(doc),
);
assert("doc SQL executed no", /SQL executed|sqlExecuted/i.test(doc) && /no|false/i.test(doc));
assert(
  "doc GRANT REVOKE executed no",
  /GRANT \/ REVOKE executed|grantRevokeExecuted/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc CREATE ALTER DROP POLICY executed no",
  /CREATE \/ ALTER \/ DROP POLICY|createAlterDropPolicyExecuted/i.test(doc) &&
    /no|false/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc Edge implementation no",
  /Edge implementation|edgeImplementation/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc supabase/functions edit no",
  /supabase\/functions|supabaseFunctionsEdited/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc Edge deploy no",
  /Edge deploy|edgeDeploy/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|saveEnablement/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc FTP upload no",
  /FTP \/ upload|ftpUpload|FTP \/ upload/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used|rejected/i.test(doc),
);
assert(
  "doc JWT access_token refresh_token non-display",
  /JWT|access_token|refresh_token/i.test(doc) && /never|not|非表示|no/i.test(doc),
);
assert(
  "doc operator JWT admin VERIFIED",
  /operator JWT admin|Operator JWT admin/i.test(doc) && /VERIFIED/i.test(doc),
);
assert(
  "doc current grants 0",
  /authenticated UPDATE grants/i.test(doc) && /\*\*0\*\*|grantsZero|: \*\*0\*\*/i.test(doc),
);
assert(
  "doc permission change purpose",
  /Permission change purpose|permission change の目的/i.test(doc),
);
assert(
  "doc UPDATE(title) column-level",
  /UPDATE\(title\)|column-level/i.test(doc),
);
assert(
  "doc restrictive RLS",
  /Restrictive RLS|RESTRICTIVE UPDATE|restrictive UPDATE/i.test(doc),
);
assert(
  "doc USING old row",
  /USING/i.test(doc) && /On a Clear Day/i.test(doc) && /track_number = 1/i.test(doc),
);
assert(
  "doc WITH CHECK new row",
  /WITH CHECK/i.test(doc) &&
    /On a Clear Day \[CMS Kit staging G-20u36e\]/i.test(doc),
);
assert(
  "doc anon UPDATE rejected",
  /anon UPDATE/i.test(doc) && /rejected/i.test(doc),
);
assert(
  "doc service_role rejected",
  /service_role/i.test(doc) && /rejected|STOP/i.test(doc),
);
assert("doc rollback方針", /Rollback|rollback/i.test(doc));
assert(
  "doc preflight verification方針",
  /Preflight \/ verification|preflight.*verification/i.test(doc),
);
assert("doc risks", /## 8\. Risks|Risks/i.test(doc));
assert(
  "doc First controlled Save still not allowed",
  /First controlled Save/i.test(doc) && /still not allowed/i.test(doc),
);
assert("doc next SQL prep", doc.includes(NEXT_PHASE));
assert("doc target row id", doc.includes(TARGET_ID));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));

// Soft guard: plan should not look like a full executable migration dump
assert(
  "doc not a GRANT EXECUTE block dump",
  !/^GRANT UPDATE\s*\(/m.test(doc) && !/^CREATE POLICY /m.test(doc),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-permission-change-plan"),
);
assert(
  "AI current-state permission change plan",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSavePermissionChangePlanPrepared"),
);
assert(
  "AI next-actions SQL prep or plan",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff permission change plan",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSavePermissionChangePlanPrepared"),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);
assert(
  "output/manual-upload not modified",
  !diffTouches("tools/static-to-astro/output/manual-upload"),
  "unexpected output/manual-upload changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-permission-change-plan: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
