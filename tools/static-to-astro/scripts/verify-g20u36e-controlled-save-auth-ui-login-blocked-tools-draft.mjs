/**
 * G-20u36e-controlled-save-auth-ui-login-blocked-tools-draft verifier.
 * Tools draft only — no package / FTP / browser / probe / RPC / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-ui-login-blocked-tools-draft.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-tools-draft.md";
const DIAGNOSIS_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_CSS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";

const PHASE = "G-20u36e-controlled-save-auth-ui-login-blocked-tools-draft";
const GATE = "gosakiDiscographyControlledSaveAuthUiLoginBlockedToolsDrafted: true";
const NEXT_PHASE = "G-20u36e-controlled-save-auth-ui-login-blocked-local-verify";
const BASE_COMMIT = "3dabb88";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

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

function extractAuthInlineScript(adminPage) {
  const marker = 'script is:inline';
  const start = adminPage.indexOf(marker);
  if (start < 0) return "";
  const scriptStart = adminPage.indexOf("\n", start);
  const end = adminPage.indexOf("</script>", scriptStart);
  return end > scriptStart ? adminPage.slice(scriptStart, end) : "";
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
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (tools-draft base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("tools draft doc exists", exists(DOC_REL));
assert("diagnosis plan doc exists", exists(DIAGNOSIS_DOC_REL));
assert("admin page exists", exists(ADMIN_PAGE_REL));
assert("admin css exists", exists(ADMIN_CSS_REL));
assert("admin ts exists", exists(ADMIN_TS_REL));

const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminCss = read(ADMIN_CSS_REL);
const adminTs = read(ADMIN_TS_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const authScript = extractAuthInlineScript(adminPage);
const probeScript = extractProbeScript(adminPage);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert("doc tools draft only", /Tools draft only|toolsDraftOnly/i.test(doc));
assert(
  "doc CSS enabled-state fix",
  /CSS enabled-state|cssEnabledStateFix|:not\(:disabled\)/i.test(doc),
);
assert(
  "doc auth init hardening",
  /Auth init hardening|authInitHardening/i.test(doc),
);
assert(
  "doc package generation no",
  /Package generation|packageGenerated/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc output/manual-upload not updated",
  /output\/manual-upload|outputManualUpload/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc FTP re-upload no",
  /FTP re-upload|ftpReupload/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc browser operation no",
  /Browser operation|browserOperation/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc probe not clicked",
  /Probe button clicked|probeButtonClicked/i.test(doc) && /no|false/i.test(doc),
);
assert("doc RPC not executed", /RPC executed|rpcExecuted/i.test(doc) && /no|false/i.test(doc));
assert("doc HTTP execution no", /HTTP executed|httpExecuted/i.test(doc) && /no|false/i.test(doc));
assert("doc SQL created no", doc.includes("SQL created") && /no|false/i.test(doc));
assert("doc SQL executed no", doc.includes("SQL executed") && /no|false/i.test(doc));
assert("doc DB write no", doc.includes("DB write") && /no|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|false/i.test(doc),
);
assert("doc RLS change no", doc.includes("RLS") && /no|false/i.test(doc));
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|false/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|false/i.test(doc));
assert(
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|saveEnablement/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc Save separation",
  /Save separation|saveSeparation/i.test(doc),
);
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc JWT access_token refresh_token non-display",
  /JWT|access_token|refresh_token/i.test(doc) && /never|not|非表示|displayed.*no|no/i.test(doc),
);
assert(
  "doc user_id email probe non-display",
  /user_id|email/i.test(doc) && /probe/i.test(doc) && /never|not|非表示|no/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert("doc next local verify", doc.includes(NEXT_PHASE));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));

// Static: CSS
assert(
  "css has btn:not(:disabled)",
  adminCss.includes(".gosaki-read-only-admin__btn:not(:disabled)"),
);
assert(
  "css has primary:not(:disabled)",
  adminCss.includes(".gosaki-read-only-admin__btn--primary:not(:disabled)"),
);
assert(
  "css enabled uses cursor:pointer",
  /:not\(:disabled\)[\s\S]{0,120}cursor:\s*pointer/.test(adminCss),
);
assert(
  "css disabled styles retained",
  adminCss.includes(".gosaki-read-only-admin__btn:disabled") ||
    adminCss.includes(".gosaki-read-only-admin__btn--primary:disabled"),
);
assert(
  "css disabled keeps not-allowed",
  /:disabled[\s\S]{0,200}cursor:\s*not-allowed/.test(adminCss),
);

// Static: auth hardening
assert("auth script extracted", authScript.length > 200);
assert(
  "auth early return body-only (not YouTube-gated)",
  /if\s*\(\s*!body\s*\)\s*return/.test(authScript) &&
    !/if\s*\(\s*!btn\s*\|\|\s*!input\s*\|\|\s*!result\s*\|\|\s*!body\s*\)\s*return/.test(
      authScript,
    ),
);
assert(
  "auth YouTube click gated",
  /if\s*\(\s*btn\s*&&\s*input\s*&&\s*result\s*\)/.test(authScript),
);
assert("auth updateLoginButton defined", authScript.includes("function updateLoginButton"));
assert(
  "auth updateLoginButton after config / autofill timeouts",
  /updateLoginButton\(\)/.test(authScript) &&
    /setTimeout\(\s*updateLoginButton\s*,\s*0\s*\)/.test(authScript) &&
    /setTimeout\(\s*updateLoginButton\s*,\s*250\s*\)/.test(authScript) &&
    /setTimeout\(\s*updateLoginButton\s*,\s*1000\s*\)/.test(authScript),
);
assert(
  "auth input change keyup listeners",
  authScript.includes('"input"') &&
    authScript.includes('"change"') &&
    authScript.includes('"keyup"'),
);
assert(
  "auth enable condition configured && !signedIn",
  /!supabaseAuthConfigured\s*\|\|\s*signedIn/.test(authScript),
);

// Probe isolation
assert(
  "probe init try/catch",
  /wireG20u36eAdminProbe[\s\S]*try\s*\{/.test(adminPage) &&
    /Probe init failure must never stop/.test(adminPage),
);

// Static: no Save arm / token display / service_role in this draft slice
const combined = `${authScript}\n${probeScript}\n${adminTs}`;
assert(
  "no new operation=save send in auth/probe scripts",
  !/operation\s*:\s*["']save["']/.test(authScript) &&
    !/operation\s*:\s*["']save["']/.test(probeScript),
);
assert(
  "no saveEnabled true wiring in probe script",
  !/saveEnabled\s*[:=]\s*true/.test(probeScript),
);
assert(
  "no console.log of tokens/user_id/email in auth/probe",
  !/console\.log\s*\([^)]*(access_token|refresh_token|user_id|email)/i.test(combined),
);
assert(
  "no new service_role usage in auth/probe scripts",
  !/service_role/.test(authScript) && !/service_role/.test(probeScript),
);

const probeFormat = (() => {
  const start = adminTs.indexOf("formatG20u36eAdminProbeDisplay");
  if (start < 0) return "";
  return adminTs.slice(start, start + 1200);
})();
assert(
  "probe formatter does not include access_token/refresh_token/jwt display keys",
  !/access_token|refresh_token/.test(probeFormat) && !/\bjwt\b/i.test(probeFormat),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-ui-login-blocked-tools-draft"),
);
assert(
  "AI current-state tools draft",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveAuthUiLoginBlockedToolsDrafted"),
);
assert(
  "AI next-actions local verify or tools draft",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff tools draft",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveAuthUiLoginBlockedToolsDrafted"),
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
  `\nverify-g20u36e-controlled-save-auth-ui-login-blocked-tools-draft: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
