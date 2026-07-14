/**
 * G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan verifier.
 * Diagnosis planning only — no UI fix / package / FTP / browser / RPC.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan.md";
const BLOCKED_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-stg-login-blocked-result.md";
const PHASE = "G-20u36e-controlled-save-auth-ui-login-blocked-diagnosis-planning";
const GATE =
  "gosakiDiscographyControlledSaveAuthUiLoginBlockedDiagnosisPlanPrepared: true";
const NEXT_PHASE = "G-20u36e-controlled-save-auth-ui-login-blocked-tools-draft";
const BASE_COMMIT = "380677d";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const CANDIDATES = ["A", "B", "C", "D", "E", "F", "G", "H"];

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
  console.log(`PASS HEAD is ${BASE_COMMIT} (diagnosis plan base; local edits expected)`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (diagnosis plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("diagnosis plan doc exists", exists(DOC_REL));
assert("login blocked result doc exists", exists(BLOCKED_RESULT_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(`doc gate ${GATE}`, doc.includes(GATE));
assert(
  "doc diagnosis planning only",
  /Diagnosis planning only|diagnosisPlanningOnly/i.test(doc),
);
assert("doc UI fix no", /UI fix|uiFixExecuted/i.test(doc) && /no|false/i.test(doc));
assert(
  "doc package generation no",
  /Package generation|packageGenerated/i.test(doc) && /no|false/i.test(doc),
);
assert(
  "doc output/manual-upload not updated",
  /output\/manual-upload|outputManualUpload/i.test(doc) && /no|false|not updated/i.test(doc),
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
assert("doc RPC not executed", /RPC|rpcExecuted/i.test(doc) && /no|false/i.test(doc));
assert("doc HTTP execution no", /HTTP/i.test(doc) && /no|false/i.test(doc));
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
  /Save enable|saveEnablement/i.test(doc) && /no|false/i.test(doc),
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
  "doc user_id email probe non-display",
  /user_id|email/i.test(doc) && /probe/i.test(doc) && /never|not|非表示/i.test(doc),
);
assert(
  "doc production not changed",
  /Production changed|production未変更/i.test(doc) && /no|not/i.test(doc),
);
assert(
  "doc read-only investigation results",
  /Read-only investigation|read-only調査/i.test(doc),
);
assert(
  "doc Candidate A-H table",
  CANDIDATES.every((c) => doc.includes(`**${c}**`)),
);
assert("doc Candidate A autofill", /Autofill|autofill/i.test(doc));
assert(
  "doc Candidate B updateLoginButton",
  /updateLoginButton/i.test(doc) && /never called|呼ばれて/i.test(doc),
);
assert("doc Candidate C dry-run or session", /dry-run|session/i.test(doc));
assert("doc Candidate D IIFE or early return", /IIFE|early return/i.test(doc));
assert("doc Candidate E id duplicate", /[Ii]d duplicate|duplicate/i.test(doc));
assert("doc Candidate F disabled", /disabled/i.test(doc) && /\*\*F\*\*/.test(doc));
assert(
  "doc Candidate G signed-in/out",
  /[Ss]igned-in|[Ss]igned-out|同期/i.test(doc),
);
assert(
  "doc Candidate H re-enabled or sign-in",
  /[Rr]e-enabled|sign-in btn|Supabase client/i.test(doc),
);
assert(
  "doc low-risk fix directions",
  /Low-risk fix|低リスク修正/i.test(doc),
);
assert("doc CSS false disabled or enabled CSS", /cursor:\s*not-allowed|:not\(:disabled\)|false.*disabled|look.*disabled/i.test(doc));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc next tools draft", doc.includes(NEXT_PHASE));
assert("doc updateLoginButton", doc.includes("updateLoginButton"));
assert("doc gra-auth-sign-in-btn", doc.includes("gra-auth-sign-in-btn"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan"),
);
assert(
  "AI current-state diagnosis plan",
  currentState.includes(PHASE) ||
    currentState.includes("gosakiDiscographyControlledSaveAuthUiLoginBlockedDiagnosisPlanPrepared"),
);
assert(
  "AI next-actions tools draft or diagnosis",
  nextActions.includes(NEXT_PHASE) || nextActions.includes(PHASE),
);
assert(
  "AI handoff diagnosis plan",
  handoff.includes(PHASE) ||
    handoff.includes("gosakiDiscographyControlledSaveAuthUiLoginBlockedDiagnosisPlanPrepared"),
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
assert(
  "admin UI templates not modified in diagnosis planning",
  !diffTouches(
    "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
  ) &&
    !diffTouches(
      "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
    ) &&
    !diffTouches(
      "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css",
    ),
  "unexpected template changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-ui-login-blocked-diagnosis-plan: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
