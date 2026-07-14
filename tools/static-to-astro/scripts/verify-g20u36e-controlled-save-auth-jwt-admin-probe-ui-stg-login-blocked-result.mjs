/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result verifier.
 * Result record only — no UI fix / probe / RPC / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-readonly-probe-preflight.md";
const PHASE =
  "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result-record";
const GATE =
  "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgLoginBlockedResultRecorded: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-planning";
const PACKAGE_SOURCE_COMMIT = "a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const ADMIN_URL = "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/admin/";
const BASE_COMMIT = "d2915d0";

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
  console.log(`PASS HEAD is ${BASE_COMMIT} (login-blocked record base; local edits expected)`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (login-blocked record base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("readonly probe preflight doc exists", exists(PREFLIGHT_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc STG login blocked",
  /STG login blocked|stgLoginBlocked/i.test(doc),
);
assert(
  "doc 未ログイン / signed-out",
  /未ログイン|signed.?out|SignedOut/i.test(doc),
);
assert(
  "doc login button disabled",
  /Login button.*disabled|loginButtonAppearsDisabled|ログインボタン/i.test(doc) &&
    /disabled/i.test(doc),
);
assert(
  "doc logout disabled",
  /Logout.*disabled|logoutDisabled|ログアウト/i.test(doc) && /disabled/i.test(doc),
);
assert(
  "doc DB admin probe disabled",
  /DB admin probe.*disabled|dbAdminProbeDisabled/i.test(doc),
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
  "doc probe not clicked",
  /Probe button clicked|probeButtonClicked|probe未実行/i.test(doc) && /no|false|未実行/i.test(doc),
);
assert(
  "doc RPC not executed",
  /RPC executed|rpcExecuted/i.test(doc) && /no|false/i.test(doc),
);
assert("doc HTTP execution no", /HTTP executed|httpExecuted/i.test(doc) && /no|false/i.test(doc));
assert("doc SQL executed no", /SQL executed|sqlExecuted/i.test(doc) && /no|false/i.test(doc));
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save disabled / 無効",
  /Save.*disabled|Save無効|saveStillDisabled/i.test(doc),
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
  "doc user_id email probe result non-display",
  /user_id|email/i.test(doc) && /probe result|非表示|displayed/i.test(doc) && /no|not|never/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert("doc next diagnosis planning", doc.includes(NEXT_PHASE));
assert("doc diagnosis candidates", /diagnosis candidates|Investigate/i.test(doc));
assert("doc no UI fix this phase", /UI fix|uiFixExecuted/i.test(doc) && /no|false/i.test(doc));
assert("doc STG URL", doc.includes(ADMIN_URL));
assert("doc package sourceCommit", doc.includes(PACKAGE_SOURCE_COMMIT));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result",
  ),
);
assert(
  "AI current-state login blocked result",
  currentState.includes(PHASE) ||
    currentState.includes(
      "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgLoginBlockedResultRecorded",
    ),
);
assert(
  "AI next-actions diagnosis planning or blocked result",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff login blocked result",
  handoff.includes(PHASE) ||
    handoff.includes(
      "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiStgLoginBlockedResultRecorded",
    ),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);
assert(
  "admin UI templates not modified in this record phase",
  !diffTouches(
    "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
  ) &&
    !diffTouches(
      "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
    ),
  "unexpected admin UI template changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
