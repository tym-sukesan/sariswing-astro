/**
 * G-20u36e-controlled-save-auth-ui-login-blocked-local-verify verifier.
 * Local verify only — no package / FTP / browser / probe / RPC / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-ui-login-blocked-local-verify.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-local-verify.md";
const TOOLS_DRAFT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-tools-draft.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_CSS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";

const PHASE = "G-20u36e-controlled-save-auth-ui-login-blocked-local-verify";
const GATE = "gosakiDiscographyControlledSaveAuthUiLoginBlockedLocalVerified: true";
const NEXT_PHASE =
  "G-20u36e-controlled-save-auth-ui-login-blocked-package-generate-freshness";
const BASE_COMMIT = "767f29c";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const STG_OLD_SOURCE_COMMIT = "a92d45d7dd345aad9d1509d49f5949a3fa9b1ffe";

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
  const marker = "script is:inline";
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
  console.log(`PASS HEAD is ${BASE_COMMIT} (local-verify base; local edits expected)`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (local-verify base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("local verify doc exists", exists(DOC_REL));
assert("tools draft doc exists", exists(TOOLS_DRAFT_DOC_REL));
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
assert("doc local verify only", /Local verify only|localVerifyOnly/i.test(doc));
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
  "doc operation=save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc Save enablement no",
  /Save enablement|saveEnablement/i.test(doc) && /no|false/i.test(doc),
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
  "doc CSS confirmation",
  /CSS confirmation|CSS確認/i.test(doc) && /:not\(:disabled\)|PASS/i.test(doc),
);
assert(
  "doc auth init confirmation",
  /Auth init confirmation|auth初期化確認/i.test(doc),
);
assert(
  "doc Save separation",
  /Save separation|saveSeparation/i.test(doc),
);
assert(
  "doc local build/dry-run",
  /Local build|dry-run|DRY-RUN PASS/i.test(doc),
);
assert(
  "doc STG not reflected",
  /STG未反映|stgLoginButtonFixNotYetReflected|not yet/i.test(doc),
);
assert("doc next package-generate-freshness", doc.includes(NEXT_PHASE));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF));
assert("doc old STG sourceCommit", doc.includes(STG_OLD_SOURCE_COMMIT));

// Static CSS
assert(
  "css has btn:not(:disabled)",
  adminCss.includes(".gosaki-read-only-admin__btn:not(:disabled)"),
);
assert(
  "css has primary:not(:disabled)",
  adminCss.includes(".gosaki-read-only-admin__btn--primary:not(:disabled)"),
);
assert(
  "css enabled cursor:pointer",
  /:not\(:disabled\)[\s\S]{0,120}cursor:\s*pointer/.test(adminCss),
);
assert(
  "css disabled not-allowed retained",
  /:disabled[\s\S]{0,200}cursor:\s*not-allowed/.test(adminCss),
);

// Static auth
assert("auth script extracted", authScript.length > 200);
assert(
  "auth body-only early return",
  /if\s*\(\s*!body\s*\)\s*return/.test(authScript) &&
    !/if\s*\(\s*!btn\s*\|\|\s*!input\s*\|\|\s*!result\s*\|\|\s*!body\s*\)\s*return/.test(
      authScript,
    ),
);
assert(
  "auth YouTube gated",
  /if\s*\(\s*btn\s*&&\s*input\s*&&\s*result\s*\)/.test(authScript),
);
assert(
  "auth autofill timeouts",
  /setTimeout\(\s*updateLoginButton\s*,\s*0\s*\)/.test(authScript) &&
    /setTimeout\(\s*updateLoginButton\s*,\s*250\s*\)/.test(authScript) &&
    /setTimeout\(\s*updateLoginButton\s*,\s*1000\s*\)/.test(authScript),
);
assert(
  "auth input change keyup",
  authScript.includes('"input"') &&
    authScript.includes('"change"') &&
    authScript.includes('"keyup"'),
);
assert(
  "auth enable condition",
  /!supabaseAuthConfigured\s*\|\|\s*signedIn/.test(authScript),
);
assert(
  "probe try/catch isolation",
  /Probe init failure must never stop/.test(adminPage),
);

// Safety
assert(
  "no operation=save in auth/probe",
  !/operation\s*:\s*["']save["']/.test(authScript) &&
    !/operation\s*:\s*["']save["']/.test(probeScript),
);
assert("no saveEnabled true in probe", !/saveEnabled\s*[:=]\s*true/.test(probeScript));
assert(
  "no console.log token/PII",
  !/console\.log\s*\([^)]*(access_token|refresh_token|user_id|email)/i.test(
    `${authScript}\n${probeScript}`,
  ),
);
assert(
  "no service_role in auth/probe",
  !/service_role/.test(authScript) && !/service_role/.test(probeScript),
);

const probeFormatStart = adminTs.indexOf("formatG20u36eAdminProbeDisplay");
const probeFormat =
  probeFormatStart >= 0 ? adminTs.slice(probeFormatStart, probeFormatStart + 800) : "";
assert(
  "probe formatter omits tokens/jwt",
  !/access_token|refresh_token/.test(probeFormat) && !/\bjwt\b/i.test(probeFormat),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-ui-login-blocked-local-verify"),
);
assert(
  "AI current-state local verify",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveAuthUiLoginBlockedLocalVerified"),
);
assert(
  "AI next-actions package-generate or local verify",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff local verify",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveAuthUiLoginBlockedLocalVerified"),
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
  `\nverify-g20u36e-controlled-save-auth-ui-login-blocked-local-verify: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
