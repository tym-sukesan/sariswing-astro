/**
 * G-20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result verifier.
 * Result record only — no login / probe / RPC / FTP re-upload / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result.md";
const LOCAL_VERIFY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-local-verify.md";
const PHASE =
  "G-20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result-record";
const GATE =
  "gosakiDiscographyControlledSaveAuthUiLoginBlockedManualFtpReuploadResultRecorded: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-auth-ui-login-blocked-stg-login-check";
const SOURCE_COMMIT = "724d951f4d64eb5fa03e96d9d97c79da1c91bade";
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
assert("local verify doc exists", exists(LOCAL_VERIFY_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc manual FTP reupload done",
  /Manual FTP reupload|manualFtpReupload/i.test(doc) &&
    /done|実施済み|executed/i.test(doc),
);
assert("doc sourceCommit recorded", doc.includes(SOURCE_COMMIT));
assert(
  "doc STG display PASS",
  /STG admin display confirmation/i.test(doc) && /PASS/i.test(doc),
);
assert(
  "doc login button enabled display",
  /Login button|login button/i.test(doc) &&
    /有効表示|enabled look|Enabled display|loginButtonEnabledDisplayConfirmed/i.test(doc),
);
assert(
  "doc DB admin probe button display improved",
  /DB admin probe button|probe button/i.test(doc) &&
    /表示改善|improved|Display improved/i.test(doc),
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
  "doc Save disabled / 無効",
  /Save.*無効|Save.*disabled|saveStillDisabled|saveEnabled.*false/i.test(doc),
);
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc probe not clicked / 未実行",
  /Probe button clicked|probe未実行|probe not clicked/i.test(doc) &&
    /no|false|未実行/i.test(doc),
);
assert(
  "doc RPC not executed",
  /RPC executed|rpcExecuted|RPC未実行/i.test(doc) && /no|false/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc JWT access_token user_id email non-display",
  /JWT|access_token|user_id|email/i.test(doc) &&
    /never|not|非表示|no/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert("doc next stg-login-check", doc.includes(NEXT_PHASE));
assert("doc STG admin URL", doc.includes(ADMIN_URL));
assert("doc remote target", doc.includes(REMOTE_TARGET));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result",
  ),
);
assert(
  "AI current-state reupload result",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveAuthUiLoginBlockedManualFtpReuploadResultRecorded",
    ),
);
assert(
  "AI next-actions stg-login-check or reupload",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff reupload result",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveAuthUiLoginBlockedManualFtpReuploadResultRecorded",
    ),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-ui-login-blocked-manual-ftp-reupload-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
