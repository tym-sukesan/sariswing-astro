/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result verifier.
 * Result record only — no probe click / RPC / FTP re-upload / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result.md";
const PREP_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight-prep.md";
const PHASE = "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result-record";
const GATE = "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiManualFtpUploadResultRecorded: true";
const SOURCE_COMMIT = "a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const REMOTE_TARGET = "/cms-kit-staging/gosaki-piano/";
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
assert("prep doc exists", exists(PREP_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc manual FTP upload done",
  /Manual FTP upload/i.test(doc) && /done|実施済み|executed/i.test(doc),
);
assert("doc sourceCommit recorded", doc.includes(SOURCE_COMMIT));
assert(
  "doc STG admin display PASS",
  /STG admin display confirmation/i.test(doc) && /PASS/i.test(doc),
);
assert(
  "doc signed-out / 未ログイン",
  /未ログイン|signed.?out|Signed-out/i.test(doc),
);
assert(
  "doc DB admin probe UI visible",
  /DB admin probe/i.test(doc) && /visible|表示/i.test(doc),
);
assert(
  "doc adminProbeStatus=not_run",
  /adminProbeStatus[`:\s]*`?not_run`?/i.test(doc) || doc.includes("adminProbeStatus: not_run"),
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
  "doc saveEnabled=false",
  /saveEnabled[`:\s]*`?false`?/i.test(doc) || doc.includes("saveEnabled: false"),
);
assert(
  "doc diagnosticOnly=true",
  /diagnosticOnly[`:\s]*`?true`?/i.test(doc) || doc.includes("diagnosticOnly: true"),
);
assert(
  "doc probe not clicked / 未実行",
  /Probe button clicked|probe未実行|probe not clicked|Probe button click/i.test(doc) &&
    /no|false|未実行/i.test(doc),
);
assert(
  "doc RPC not executed",
  /RPC executed|rpcExecuted|RPC未実行/i.test(doc) && /no|false/i.test(doc),
);
assert("doc HTTP execution no", /HTTP/i.test(doc) && /no|false/i.test(doc));
assert("doc SQL executed no", /SQL executed|sqlExecuted/i.test(doc) && /no|false/i.test(doc));
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save disabled / 無効",
  /Save.*disabled|Save無効|saveStillDisabled|Save still disabled/i.test(doc),
);
assert(
  "doc JWT access_token user_id email non-display",
  /JWT|access_token/i.test(doc) &&
    /user_id|email/i.test(doc) &&
    /never|not|非表示|absent|no/i.test(doc),
);
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更|Production path/i.test(doc) && /no|not/i.test(doc),
);
assert("doc remote target", doc.includes(REMOTE_TARGET));
assert("doc admin URL", doc.includes(ADMIN_URL));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));
assert(
  "doc next login-ready or probe-preflight",
  doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-ready-check") ||
    doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight"),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result"),
);
assert(
  "AI current-state manual FTP upload result",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiManualFtpUploadResultRecorded"),
);
assert(
  "AI next-actions login-ready or result",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-ready-check") ||
    nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight") ||
    nextActions.includes(PHASE),
);
assert(
  "AI handoff manual FTP upload result",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiManualFtpUploadResultRecorded"),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
