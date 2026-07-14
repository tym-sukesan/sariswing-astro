/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result verifier.
 * Result record only — no permission change / SQL / Save / FTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result.md";
const LOGIN_CHECK_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-stg-login-check-result.md";
const PHASE =
  "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result-record";
const GATE =
  "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbeExecutionResultRecorded: true";
const NEXT_PHASE = "G-20u36e-controlled-save-permission-change-planning";
const ALT_NEXT =
  "G-20u36e-controlled-save-authenticated-title-update-rls-planning";
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
assert("stg login check result doc exists", exists(LOGIN_CHECK_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc STG readonly probe execution PASS",
  /STG readonly probe execution/i.test(doc) && /PASS/i.test(doc),
);
assert(
  "doc operator JWT admin VERIFIED",
  /operator JWT admin|Operator JWT admin/i.test(doc) && /VERIFIED/i.test(doc),
);
assert(
  "doc public.is_admin true under operator JWT",
  /public\.is_admin\(\)/i.test(doc) &&
    /operator JWT/i.test(doc) &&
    /true/i.test(doc),
);
assert(
  "doc adminProbeStatus=pass",
  /adminProbeStatus[`:\s]*`?pass`?/i.test(doc) ||
    doc.includes("adminProbeStatus: pass"),
);
assert(
  "doc isAdmin=true",
  /isAdmin[`:\s]*`?true`?/i.test(doc) || doc.includes("isAdmin: true"),
);
assert(
  "doc reasonCode=rpc_success_true",
  /reasonCode[`:\s]*`?rpc_success_true`?/i.test(doc) ||
    doc.includes("reasonCode: rpc_success_true"),
);
assert(
  "doc saveEnabled=false",
  /saveEnabled[`:\s]*`?false`?/i.test(doc) || doc.includes("saveEnabled: false"),
);
assert(
  "doc diagnosticOnly=true",
  /diagnosticOnly[`:\s]*`?true`?/i.test(doc) ||
    doc.includes("diagnosticOnly: true"),
);
assert(
  "doc probe executed exactly once",
  /exactly once|probeExecutedExactlyOnce/i.test(doc),
);
assert("doc RPC read-only", /read-only|rpcReadOnly/i.test(doc));
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|saveEnablement/i.test(doc) && /no|false|なし/i.test(doc),
);
assert(
  "doc permission change no",
  /Permission change|permissionChange/i.test(doc) && /no|false|なし/i.test(doc),
);
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|false|なし/i.test(doc),
);
assert(
  "doc RLS change no",
  /RLS change|rlsPolicyChange/i.test(doc) && /no|false|なし/i.test(doc),
);
assert(
  "doc Edge implementation/deploy no",
  /Edge implementation|edgeDeploy/i.test(doc) && /no|false|なし/i.test(doc),
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
  "doc user_id email probe non-display",
  /user_id|email/i.test(doc) && /probe/i.test(doc) && /never|not|非表示|no/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert(
  "doc First controlled Save still not allowed",
  /First controlled Save/i.test(doc) && /still not allowed|still not|不可/i.test(doc),
);
assert(
  "doc next permission planning",
  doc.includes(NEXT_PHASE) || doc.includes(ALT_NEXT),
);
assert("doc sourceCommit", doc.includes(SOURCE_COMMIT));
assert("doc STG admin URL", doc.includes(ADMIN_URL));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result",
  ),
);
assert(
  "AI current-state probe execution result",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbeExecutionResultRecorded",
    ),
);
assert(
  "AI next-actions permission planning or probe result",
  nextActions.includes(NEXT_PHASE) ||
    nextActions.includes(ALT_NEXT) ||
    nextActions.includes(PHASE),
);
assert(
  "AI handoff probe execution result",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbeExecutionResultRecorded",
    ),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
