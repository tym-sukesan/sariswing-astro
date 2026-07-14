/**
 * G-20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result verifier.
 * Result record only — no probe / RPC / Save / FTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result.md";
const REUPLOAD_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result.md";
const PHASE =
  "G-20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result-record";
const GATE =
  "gosakiDiscographyControlledSaveAuthUiLoginBlockedStgLoginCheckResultRecorded: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution";
const SOURCE_COMMIT = "724d951f4d64eb5fa03e96d9d97c79da1c91bade";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const ADMIN_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/";

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

assert("result doc exists", exists(DOC_REL));
assert("manual FTP reupload result doc exists", exists(REUPLOAD_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc STG login check PASS",
  /STG login check/i.test(doc) && /PASS/i.test(doc),
);
assert(
  "doc login button fix confirmed",
  /Login button fix confirmed|loginButtonFixConfirmed/i.test(doc),
);
assert(
  "doc logged in",
  /logged in|ログイン済み|operatorLoggedIn/i.test(doc),
);
assert(
  "doc dry-run possible display",
  /dry-run 可能|Dry-run possible|dryRunPossible/i.test(doc),
);
assert(
  "doc logout enabled",
  /Logout.*enabled|logoutButtonEnabled|ログアウト有効/i.test(doc),
);
assert(
  "doc login button disabled because already logged in",
  /disabled because already logged in|loginButtonDisabledBecauseAlreadyLoggedIn|ログイン済みのため無効/i.test(
    doc,
  ),
);
assert(
  "doc DB admin probe ready",
  /DB admin probe.*(ready|visible)|dbAdminProbeButtonVisibleReady/i.test(doc),
);
assert(
  "doc adminProbeStatus=not_run",
  /adminProbeStatus[`:\s]*`?not_run`?/i.test(doc) ||
    doc.includes("adminProbeStatus: not_run"),
);
assert(
  "doc isAdmin=null",
  /isAdmin[`:\s]*`?null`?/i.test(doc) || doc.includes("isAdmin: null"),
);
assert(
  "doc reasonCode=not_run",
  /reasonCode[`:\s]*`?not_run`?/i.test(doc) || doc.includes("reasonCode: not_run"),
);
assert(
  "doc DB admin probe not executed",
  /DB admin probe.*(未実行|not clicked|not executed)|dbAdminProbeExecuted:\s*false|probeButtonClicked:\s*false/i.test(
    doc,
  ),
);
assert(
  "doc RPC not executed",
  /RPC executed|rpcExecuted|RPC未実行/i.test(doc) && /no|false|未実行/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc JWT access_token refresh_token non-display",
  /JWT|access_token|refresh_token/i.test(doc) && /never|not|非表示|no/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert("doc next readonly probe execution", doc.includes(NEXT_PHASE));
assert("doc sourceCommit", doc.includes(SOURCE_COMMIT));
assert("doc STG admin URL", doc.includes(ADMIN_URL));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result",
  ),
);
assert(
  "AI current-state stg login check",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveAuthUiLoginBlockedStgLoginCheckResultRecorded",
    ),
);
assert(
  "AI next-actions probe execution or login check",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff stg login check",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveAuthUiLoginBlockedStgLoginCheckResultRecorded",
    ),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
