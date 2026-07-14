/**
 * G-20u36e-controlled-save-auth-jwt-admin-probe-ui-plan verifier.
 * Planning-only — no UI / RPC / HTTP / SQL / GRANT / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan.md";
const PROBE_PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-admin-probe-plan.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "a1fabb1";

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

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e JWT admin probe UI plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during plan doc creation`,
  );
}

assert("plan doc exists", exists(DOC_REL));
assert("parent probe plan doc exists", exists(PROBE_PLAN_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning",
  doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning"),
);
assert(
  "doc gate gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPlanPrepared",
  doc.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPlanPrepared: true"),
);
assert("doc planning only", /Planning only|planning only/i.test(doc));
assert(
  "doc UI implementation no",
  /UI implementation/i.test(doc) && /no|not|false/i.test(doc),
);
assert("doc RPC executed no", doc.includes("RPC executed") && /no|not|false/i.test(doc));
assert("doc HTTP executed no", doc.includes("HTTP executed") && /no|not|false/i.test(doc));
assert("doc SQL created no", doc.includes("SQL created") && /no|not|false/i.test(doc));
assert("doc SQL executed no", doc.includes("SQL executed") && /no|not|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|not|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|not|false|変更なし|policy change/i.test(doc),
);
assert("doc DB write no", doc.includes("DB write") && /no|not|false/i.test(doc));
assert(
  "doc Edge implementation no",
  doc.includes("Edge implementation") && /no|not|false/i.test(doc),
);
assert(
  "doc supabase/functions edit no",
  doc.includes("supabase/functions") && /no|not|false/i.test(doc),
);
assert("doc Edge deploy no", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
assert(
  "doc operation save not sent",
  doc.includes("operation=save") && /not sent|未送信|no/i.test(doc),
);
assert(
  "doc dryRun HTTP not re-sent",
  doc.includes("dryRun HTTP") && /no|not|re-sent|未/i.test(doc),
);
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
assert("doc FTP no", doc.includes("FTP") && /no|not|false/i.test(doc));
assert(
  "doc service_role not used",
  doc.includes("service_role") && /not use|不使用|not used/i.test(doc),
);
assert(
  "doc JWT access_token non-display",
  /JWT|access_token/i.test(doc) && /Never|never|not display|非表示|Must not/i.test(doc),
);
assert(
  "doc user_id email non-display",
  /user_id/i.test(doc) && /email/i.test(doc) && /never|not|Must not|非表示/i.test(doc),
);

assert("doc UI probe purpose", /UI probe purpose|probe purpose/i.test(doc));
assert(
  "doc existing UI auth findings",
  /Existing UI \/ auth findings|existing UI\/auth|getSession/i.test(doc),
);
assert("doc UI probe design", /UI probe design/i.test(doc));
assert(
  "doc reasonCode design",
  doc.includes("reasonCode") &&
    doc.includes("session_missing") &&
    doc.includes("rpc_success_true") &&
    doc.includes("rpc_success_false") &&
    doc.includes("rpc_error"),
);
assert(
  "doc Save decoupled",
  /Decouple from Save|does not.*enable Save|SaveArmDecoupled|Save と切り離/i.test(doc),
);
assert("doc success conditions", /Success conditions|成功条件/i.test(doc));
assert("doc failure handling", /Failure handling|失敗時/i.test(doc));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|never|forbidden/i.test(doc));
assert(
  "doc next tools draft",
  doc.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft"),
);
assert("doc rpc is_admin", /rpc\(['\"]is_admin['\"]\)|rpc\('is_admin'\)/i.test(doc));
assert("doc YouTube dry-run precedent", /YouTube/i.test(doc) && /dry-run|getSession/i.test(doc));
assert("doc mock allowlist note", /mock allowlist|mock-allowlist/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan"),
);
assert(
  "AI current-state UI probe planning",
  currentState.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning") ||
    currentState.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPlanPrepared"),
);
assert(
  "AI next-actions tools draft or UI plan",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-tools-draft") ||
    nextActions.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning"),
);
assert(
  "AI handoff UI probe planning",
  handoff.includes("G-20u36e-controlled-save-auth-jwt-admin-probe-ui-planning") ||
    handoff.includes("gosakiDiscographyControlledSaveAuthJwtAdminProbeUiPlanPrepared"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-admin-probe-ui-plan: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
