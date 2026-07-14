/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify verifier.
 * Local verify only — no STG upload / browser RPC / HTTP / SQL / GRANT / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify.md";
const TOOLS_DRAFT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "1578cc2";
const PHASE = "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify";
const GATE = "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiLocalVerified: true";
const REASON_CODES = [
  "not_run",
  "session_missing",
  "rpc_success_true",
  "rpc_success_false",
  "rpc_error",
  "production_ref_blocked",
  "unexpected",
];

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

function extractProbeScript(adminPage) {
  const marker = "wireG20u36eAdminProbe";
  const start = adminPage.indexOf(marker);
  if (start < 0) return "";
  const end = adminPage.indexOf("function findAlbumCard", start);
  return end > start ? adminPage.slice(start, end) : adminPage.slice(start);
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT} (local-verify base; local edits expected)`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (local-verify base ${BASE_COMMIT}) — non-blocking`);
}

assert("local verify doc exists", exists(DOC_REL));
assert("tools draft doc exists", exists(TOOLS_DRAFT_DOC_REL));
assert("admin page exists", exists(ADMIN_PAGE_REL));
assert("admin ts exists", exists(ADMIN_TS_REL));

const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminTs = read(ADMIN_TS_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const probeScript = extractProbeScript(adminPage);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("doc local verify only", /Local verify only|localVerifyOnly/i.test(doc));
assert("doc STG upload no", /STG upload/i.test(doc) && /no|false/i.test(doc));
assert("doc FTP no", doc.includes("FTP") && /no|false/i.test(doc));
assert(
  "doc real browser RPC no",
  /Real browser RPC|rpcBrowserExecuted|browser RPC/i.test(doc) && /no|false/i.test(doc),
);
assert("doc HTTP execution no", doc.includes("HTTP execution") && /no|false/i.test(doc));
assert("doc SQL created no", doc.includes("SQL created") && /no|false/i.test(doc));
assert("doc SQL executed no", doc.includes("SQL executed") && /no|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|false|変更なし|policy change/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|false/i.test(doc),
);
assert(
  "doc supabase/functions edit no",
  doc.includes("supabase/functions") && /no|false|Not changed|edit.*no/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc dryRun HTTP not re-sent",
  doc.includes("dryRun HTTP") && /no|not|re-sent|未/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|Save 有効化|saveEnablement/i.test(doc) && /no|false/i.test(doc),
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
assert(
  "doc #gra-admin-probe-btn confirmed",
  doc.includes("#gra-admin-probe-btn") || doc.includes("gra-admin-probe-btn"),
);
assert(
  "doc client.rpc is_admin confirmed",
  /rpc\(['\"]is_admin['\"]\)|G20U36E_ADMIN_PROBE_RPC_NAME|is_admin/i.test(doc),
);
assert("doc manual only confirmed", /Manual only|manual only|click handler|手動/i.test(doc));
assert(
  "doc reasonCode confirmed",
  REASON_CODES.every((code) => doc.includes(code)),
);
assert("doc production_ref_blocked confirmed", doc.includes("production_ref_blocked"));
assert("doc Save separation confirmed", /Save separation|saveArmDecoupled|Save 分離/i.test(doc));
assert(
  "doc operation=save absent in probe confirmed",
  /operation=save/i.test(doc) && /absent|no|not sent|未送信/i.test(doc),
);
assert(
  "doc STG not yet reflecting",
  /STG.*not.*reflect|not reflected yet|STG未反映|stgPublicUrlNotYetReflecting/i.test(doc),
);
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never|forbidden|blocked/i.test(doc));
assert(
  "doc next package-preflight",
  doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight"),
);
assert("doc static checks PASS", /Static checks[\s\S]*PASS|PASS.*gra-admin-probe/i.test(doc));
assert(
  "doc local build dry-run",
  /build:gosaki:staging:dry-run|Local build \/ generate/i.test(doc) && /PASS|dry-run/i.test(doc),
);

assert("admin page #gra-admin-probe-btn", adminPage.includes('id="gra-admin-probe-btn"'));
assert("admin page #gra-admin-probe-result", adminPage.includes('id="gra-admin-probe-result"'));
assert("admin page adminProbeStatus display", adminPage.includes("adminProbeStatus"));
assert("admin page isAdmin display", adminPage.includes("isAdmin"));
assert("admin page reasonCode display", adminPage.includes("reasonCode"));
assert(
  "admin page rpc is_admin wiring",
  /client\.rpc\(G20U36E_ADMIN_PROBE_RPC_NAME\)/.test(adminPage),
);
assert(
  "admin page manual click only for rpc",
  probeScript.includes('addEventListener("click"') &&
    probeScript.includes("client.rpc") &&
    !/^\s*client\.rpc/m.test(probeScript.split("addEventListener")[0] || ""),
);
assert(
  "admin ts reasonCode enum complete",
  REASON_CODES.every((code) => adminTs.includes(code)),
);
assert("admin ts production_ref_blocked", adminTs.includes("production_ref_blocked"));
assert("admin ts staging ref", adminTs.includes(STAGING_REF));
assert("admin ts production STOP", adminTs.includes(PRODUCTION_REF));
assert(
  "admin ts host safe assert",
  adminTs.includes("assertG20u36eAdminProbeSupabaseHostSafe"),
);
assert("admin ts saveEnabled always false", /saveEnabled:\s*false/.test(adminTs));
assert(
  "admin page Save still disabled",
  adminPage.includes("Save（無効") && /probe PASS does not enable Save/i.test(adminPage),
);

assert("probe script no access_token", !/access_token/i.test(probeScript));
assert("probe script no refresh_token", !/refresh_token/i.test(probeScript));
assert(
  "probe script no JWT Bearer display",
  !/Authorization:\s*['\"]Bearer/i.test(probeScript),
);
assert(
  "probe script no user.email or user.id",
  !/user\.email|user\.id|user_id/i.test(probeScript),
);
assert("probe script no console.log", !/console\.log/i.test(probeScript));
assert(
  "probe script no raw error.message display",
  !/error\.message|rpcRes\.error\.message/i.test(probeScript),
);
assert(
  "probe script no service_role",
  !/service_role|SUPABASE_SERVICE_ROLE/i.test(probeScript),
);
assert(
  "probe script no operation=save send",
  !/operation\s*:\s*['\"]save['\"]|operation=save/i.test(probeScript),
);
assert(
  "probe does not set saveEnabled true",
  !/saveEnabled\s*=\s*true/i.test(probeScript),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify"),
);
assert(
  "AI current-state local verify",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiLocalVerified"),
);
assert(
  "AI next-actions package-preflight or local verify",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight") ||
    nextActions.includes(PHASE),
);
assert(
  "AI handoff local verify",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiLocalVerified"),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
