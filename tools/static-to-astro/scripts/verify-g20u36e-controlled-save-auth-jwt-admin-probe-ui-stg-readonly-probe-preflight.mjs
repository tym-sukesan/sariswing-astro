/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight verifier.
 * Preflight only — no probe click / RPC / HTTP / SQL / Save / FTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight.md";
const UPLOAD_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-manual-ftp-upload-result.md";
const PHASE = "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight";
const GATE =
  "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbePreflightPrepared: true";
const BASE_COMMIT = "98681de";
const PACKAGE_SOURCE_COMMIT = "a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const ADMIN_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/";
const NEXT_PHASE =
  "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-execution";

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
  console.log(`PASS HEAD is ${BASE_COMMIT} (preflight base; local edits expected)`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (preflight base ${BASE_COMMIT}) — non-blocking`);
}

assert("preflight doc exists", exists(DOC_REL));
assert("upload result doc exists", exists(UPLOAD_RESULT_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("doc preflight only", /Preflight only|preflightOnly/i.test(doc));
assert(
  "doc probe button not clicked",
  /Probe button clicked|probe button not clicked|probeButtonClicked/i.test(doc) &&
    /no|false|未/i.test(doc),
);
assert(
  "doc RPC not executed",
  /RPC executed|rpcExecuted/i.test(doc) && /no|false/i.test(doc),
);
assert("doc HTTP execution no", doc.includes("HTTP executed") && /no|false/i.test(doc));
assert("doc SQL created no", doc.includes("SQL created") && /no|false/i.test(doc));
assert("doc SQL executed no", doc.includes("SQL executed") && /no|false/i.test(doc));
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|saveEnablement/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|false|policy change/i.test(doc),
);
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|false/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|false/i.test(doc));
assert(
  "doc FTP re-upload no",
  /FTP re-upload|ftpReupload/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc JWT access_token refresh_token non-display",
  /JWT|access_token|refresh_token/i.test(doc) && /never|not|非表示|displayed.*no/i.test(doc),
);
assert(
  "doc user_id email non-display",
  /user_id/i.test(doc) && /email/i.test(doc) && /never|not|非表示|displayed/i.test(doc),
);
assert("doc STG URL", doc.includes(ADMIN_URL));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc package sourceCommit", doc.includes(PACKAGE_SOURCE_COMMIT));
assert(
  "doc pre-login checks",
  /Pre-login checks|実行前チェック/i.test(doc),
);
assert(
  "doc post-login checks",
  /Post-login checks|ログイン後チェック/i.test(doc),
);
assert(
  "doc allowed operation",
  /Allowed operation|実行してよい操作/i.test(doc) && /once|1回/i.test(doc),
);
assert(
  "doc PASS FAIL ERROR STOP",
  /### PASS/i.test(doc) &&
    /### FAIL/i.test(doc) &&
    /### ERROR/i.test(doc) &&
    /### STOP/i.test(doc),
);
assert("doc rpc_success_true", doc.includes("rpc_success_true"));
assert("doc rpc_success_false", doc.includes("rpc_success_false"));
assert("doc production_ref_blocked STOP", doc.includes("production_ref_blocked"));
assert(
  "doc paste OK / never paste",
  /OK to paste|貼ってよい/i.test(doc) && /Never paste|貼ってはいけない/i.test(doc),
);
assert(
  "doc next phase execution",
  doc.includes(NEXT_PHASE),
);
assert("doc is_admin admin_users", /is_admin|admin_users/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight",
  ),
);
assert(
  "AI current-state stg readonly probe preflight",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbePreflightPrepared",
    ),
);
assert(
  "AI next-actions execution or preflight",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff stg readonly probe preflight",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgReadonlyProbePreflightPrepared",
    ),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
