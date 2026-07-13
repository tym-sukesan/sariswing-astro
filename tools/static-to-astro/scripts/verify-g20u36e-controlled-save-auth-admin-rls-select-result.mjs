/**
 * G-20u36e-controlled-save-auth-admin-rls-select-result verifier.
 * Result-record only — no SQL re-run / GRANT / RLS / DB write / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-admin-rls-select-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-admin-rls-select-result.md";
const PREP_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-admin-rls-select-prep.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "cfe4247";

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
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e auth-admin-rls select result base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during result doc creation`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("prep doc exists", exists(PREP_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-auth-admin-rls-select-result-record",
  doc.includes("G-20u36e-controlled-save-auth-admin-rls-select-result-record"),
);
assert(
  "doc gate gosakiDiscographyControlledSaveAuthAdminRlsSelectResultRecorded",
  doc.includes("gosakiDiscographyControlledSaveAuthAdminRlsSelectResultRecorded: true"),
);
assert(
  "doc SELECT-only snapshot executed by operator",
  /executed by operator|SELECT-only.*snapshot/i.test(doc) && /SQL Editor/i.test(doc),
);
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never|forbidden/i.test(doc));
assert(
  "doc SQL re-run no",
  /SQL re-run|sqlReExecuted/i.test(doc) && /no|false|none/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|not|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|not|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|not|false|変更なし|policy change/i.test(doc),
);
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|not|false/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc dryRun HTTP not sent",
  doc.includes("dryRun HTTP") && /no|not|sent|未/i.test(doc),
);
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
assert("doc FTP no", doc.includes("FTP") && /no|not|false/i.test(doc));
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);

assert(
  "doc is_admin_function_count 1",
  /is_admin_function_count[\s\S]{0,40}\*\*1\*\*|is_admin_function_count.*\b1\b/i.test(doc),
);
assert(
  "doc is_admin SECURITY DEFINER",
  /SECURITY DEFINER|security_definer.*true/i.test(doc),
);
assert(
  "doc is_admin definition summary",
  doc.includes("admin_users") && doc.includes("auth.uid()") && /role.*admin/i.test(doc),
);
assert(
  "doc sql_editor_is_admin_callable true",
  /sql_editor_is_admin_callable[\s\S]{0,40}\*\*true\*\*|sql_editor_is_admin_callable.*true/i.test(
    doc,
  ),
);
assert(
  "doc sql_editor_is_admin_result false not operator JWT",
  /sql_editor_is_admin_result[\s\S]{0,80}false/i.test(doc) &&
    /not.*operator JWT|NOT operator JWT|≠ JWT|not JWT context/i.test(doc),
);
assert(
  "doc is_admin_policy_count 2",
  /is_admin_policy_count[\s\S]{0,40}\*\*2\*\*|is_admin_policy_count.*\b2\b/i.test(doc),
);
assert(
  "doc admin_all_policy_count 2",
  /admin_all_policy_count[\s\S]{0,40}\*\*2\*\*|admin_all_policy_count.*\b2\b/i.test(doc),
);
assert(
  "doc discography_tracks_restrictive_policy_count 0",
  /discography_tracks_restrictive_policy_count[\s\S]{0,40}\*\*0\*\*|restrictive.*\*\*0\*\*/i.test(
    doc,
  ),
);
assert(
  "doc rls_enabled_discography true",
  /rls_enabled_discography[\s\S]{0,40}\*\*true\*\*/i.test(doc),
);
assert(
  "doc rls_enabled_discography_tracks true",
  /rls_enabled_discography_tracks[\s\S]{0,40}\*\*true\*\*/i.test(doc),
);
assert(
  "doc authenticated_update_grants_count 0",
  /authenticated_update_grants_count[\s\S]{0,40}\*\*0\*\*/i.test(doc),
);
assert(
  "doc authenticated_title_update_column_grants_count 0",
  /authenticated_title_update_column_grants_count[\s\S]{0,40}\*\*0\*\*/i.test(doc),
);
assert(
  "doc anon_write_grants_count 0",
  /anon_write_grants_count[\s\S]{0,40}\*\*0\*\*/i.test(doc),
);
assert("doc target_row_count 1", /target_row_count[\s\S]{0,40}\*\*1\*\*/i.test(doc));
assert("doc track_count 8", /track_count[\s\S]{0,40}\*\*8\*\*/i.test(doc));
assert(
  "doc track_7_title Like a Lover",
  doc.includes("Like a Lover") && /track_7|track 7/i.test(doc),
);
assert(
  "doc operator JWT admin status unverified",
  /operator JWT admin.*unverif|JWT admin status.*unverif|unverified/i.test(doc),
);
assert(
  "doc First controlled Save still not allowed",
  /First controlled Save/i.test(doc) && /not allowed|still not|not executable/i.test(doc),
);
assert(
  "doc snapshot PASS",
  /snapshot.*=.*\*\*PASS\*\*|Auth.*RLS snapshot.*=.*\*\*PASS\*\*|authAdminRlsSnapshotPass: true/i.test(
    doc,
  ),
);
assert(
  "doc next phase JWT admin probe planning",
  doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-planning"),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-admin-rls-select-result"),
);
assert(
  "AI current-state auth-admin-rls select result",
  currentState.includes("G-20u36e-controlled-save-auth-admin-rls-select-result") ||
    currentState.includes("gosakiDiscographyControlledSaveAuthAdminRlsSelectResultRecorded"),
);
assert(
  "AI next-actions JWT admin probe or result",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-planning") ||
    nextActions.includes("G-20u36e-controlled-save-auth-admin-rls-select-result"),
);
assert(
  "AI handoff auth-admin-rls select result",
  handoff.includes("G-20u36e-controlled-save-auth-admin-rls-select-result") ||
    handoff.includes("gosakiDiscographyControlledSaveAuthAdminRlsSelectResultRecorded"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-admin-rls-select-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
