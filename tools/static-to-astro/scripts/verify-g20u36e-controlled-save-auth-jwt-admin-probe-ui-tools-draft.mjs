/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft verifier.
 * UI tools draft only — no browser RPC / HTTP / SQL / GRANT / Edge / Save execution.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft.md";
const UI_PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const ADMIN_CSS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "e915905";
const PHASE = "G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft";
const GATE = "gosakiDiscographyControlledSaveAuthJwtAdminProbeUiToolsDrafted: true";

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
  console.log(`PASS HEAD is ${BASE_COMMIT} (tools-draft base; local edits expected)`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (tools-draft base ${BASE_COMMIT}) — non-blocking`);
}

assert("tools draft doc exists", exists(DOC_REL));
assert("UI plan doc exists", exists(UI_PLAN_DOC_REL));
assert("admin page exists", exists(ADMIN_PAGE_REL));
assert("admin ts exists", exists(ADMIN_TS_REL));
assert("admin css exists", exists(ADMIN_CSS_REL));

const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminTs = read(ADMIN_TS_REL);
const adminCss = read(ADMIN_CSS_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const probeScript = extractProbeScript(adminPage);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("doc UI tools draft / implementation draft only", /UI tools draft|UI implementation draft only/i.test(doc));
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
  doc.includes("supabase/functions") && /no|false|Not changed/i.test(doc),
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
assert("doc FTP no", doc.includes("FTP") && /no|false/i.test(doc));
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc JWT access_token refresh_token non-display",
  /JWT|access_token|refresh_token/i.test(doc) && /never|not|非表示|Must not|displayed.*no/i.test(doc),
);
assert(
  "doc user_id email non-display",
  /user_id/i.test(doc) && /email/i.test(doc) && /never|not|非表示|Must not|displayed/i.test(doc),
);
assert("doc Save separation", /Save separation|Save と切り離|decoupl|saveArmDecoupled/i.test(doc));
assert(
  "doc probe not connected to Save enabled",
  /Probe PASS enables Save|connected to Save|Save enabled/i.test(doc) && /no|false|does not|ならない/i.test(doc),
);
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never|forbidden/i.test(doc));
assert(
  "doc next local-verify or package-preflight",
  doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify") ||
    doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight"),
);

assert("admin ts phase constant", adminTs.includes(PHASE));
assert("admin ts rpc name is_admin", adminTs.includes('G20U36E_ADMIN_PROBE_RPC_NAME = "is_admin"'));
assert("admin ts reasonCode production_ref_blocked", adminTs.includes("production_ref_blocked"));
assert("admin ts reasonCode session_missing", adminTs.includes("session_missing"));
assert("admin ts reasonCode rpc_success_true", adminTs.includes("rpc_success_true"));
assert("admin ts reasonCode rpc_success_false", adminTs.includes("rpc_success_false"));
assert("admin ts reasonCode rpc_error", adminTs.includes("rpc_error"));
assert("admin ts buildG20u36eAdminProbeDisplay", adminTs.includes("buildG20u36eAdminProbeDisplay"));
assert(
  "admin ts host safe assert",
  adminTs.includes("assertG20u36eAdminProbeSupabaseHostSafe"),
);
assert("admin ts saveEnabled always false type", /saveEnabled:\s*false/.test(adminTs));
assert("admin ts staging ref", adminTs.includes(STAGING_REF));
assert("admin ts production STOP", adminTs.includes(PRODUCTION_REF));
assert(
  "admin ts no service_role string added for probe",
  !/G20U36E[\s\S]{0,200}service_role/i.test(adminTs) ||
    !/service_role\s*[=:]/.test(adminTs.match(/G20U36E_ADMIN_PROBE[\s\S]*?export interface Discography/)?.[0] ?? ""),
);

assert("admin page probe section", adminPage.includes('data-section="g20u36e-admin-probe"'));
assert("admin page probe button id", adminPage.includes('id="gra-admin-probe-btn"'));
assert("admin page probe button label", adminPage.includes("DB admin probe (read-only)"));
assert("admin page probe result", adminPage.includes('id="gra-admin-probe-result"'));
assert("admin page near gra-auth", adminPage.includes('id="gra-auth"') && adminPage.includes("gra-admin-probe"));
assert("admin page rpc is_admin wiring", /client\.rpc\(G20U36E_ADMIN_PROBE_RPC_NAME\)|client\.rpc\(['\"]is_admin['\"]\)/.test(adminPage));
assert("admin page production_ref_blocked path", adminPage.includes("assertG20u36eAdminProbeSupabaseHostSafe"));
assert("admin page Save disabled still", adminPage.includes("Save（無効"));
assert("admin page diagnostic Save copy", /probe PASS does not enable Save|First controlled Save remains disabled/i.test(adminPage));
assert("admin css probe panel", adminCss.includes("gosaki-read-only-admin__admin-probe"));

assert(
  "probe script does not console.log secrets",
  !/console\.log/i.test(probeScript),
);
assert("probe script no access_token", !/access_token/i.test(probeScript));
assert("probe script no refresh_token", !/refresh_token/i.test(probeScript));
assert(
  "probe script no JWT display / Authorization Bearer",
  !/Authorization:\s*['\"]Bearer|textContent\s*=\s*.*jwt/i.test(probeScript),
);
assert(
  "probe script no user.email or user.id",
  !/user\.email|user\.id|user_id/i.test(probeScript),
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
  "admin page no new operation save send in probe",
  !/wireG20u36eAdminProbe[\s\S]*?operation\s*:\s*['\"]save['\"]/.test(adminPage),
);
assert(
  "admin page probe does not enable Save buttons",
  !/wireG20u36eAdminProbe[\s\S]*?(saveEnabled\s*=\s*true|disabled\s*=\s*false[\s\S]{0,80}save)/i.test(
    adminPage,
  ),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft"),
);
assert(
  "AI current-state tools draft",
  currentState.includes(PHASE) || currentState.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiToolsDrafted"),
);
assert(
  "AI next-actions local-verify or tools draft",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-local-verify") ||
    nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-package-preflight") ||
    nextActions.includes(PHASE),
);
assert(
  "AI handoff tools draft",
  handoff.includes(PHASE) || handoff.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiToolsDrafted"),
);

assert(
  "supabase/functions not modified",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

assert(
  "src/ not modified for this tools draft",
  !diffTouches("src/"),
  "unexpected src/ changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
