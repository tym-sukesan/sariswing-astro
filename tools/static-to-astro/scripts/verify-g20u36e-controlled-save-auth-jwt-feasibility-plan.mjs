/**
 * G-20u36e-controlled-save-auth-jwt-feasibility-plan verifier.
 * Planning-only — no SQL / GRANT / RLS / DB write / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-feasibility-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-plan.md";
const PERMISSION_MODEL_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-permission-model-decision.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "457c579";

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
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e auth JWT feasibility base ${BASE_COMMIT}) — non-blocking`,
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

assert("feasibility plan doc exists", exists(DOC_REL));
assert("permission model decision doc exists", exists(PERMISSION_MODEL_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-auth-jwt-feasibility-planning",
  doc.includes("G-20u36e-controlled-save-auth-jwt-feasibility-planning"),
);
assert(
  "doc gate gosakiDiscographyControlledSaveAuthJwtFeasibilityPlanned",
  doc.includes("gosakiDiscographyControlledSaveAuthJwtFeasibilityPlanned: true"),
);
assert("doc planning only", doc.includes("Planning only") || doc.includes("planning only"));
assert("doc SQL created no", doc.includes("SQL created") && /no|not|false/i.test(doc));
assert(
  "doc executable SQL no",
  doc.includes("Executable SQL") && /no|not|false/i.test(doc),
);
assert("doc SQL executed no", doc.includes("SQL executed") && /no|not|false/i.test(doc));
assert(
  "doc GRANT REVOKE no",
  doc.includes("GRANT") && doc.includes("REVOKE") && /no|not|false/i.test(doc),
);
assert(
  "doc RLS change no",
  doc.includes("RLS") && /no|not|false|変更なし|policy change.*no/i.test(doc),
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
  doc.includes("service_role") && /not use|不使用|not used|STOP|REJECTED/i.test(doc),
);

assert(
  "doc current Edge auth client findings",
  doc.includes("Current Edge Function auth") || doc.includes("Current Edge auth"),
);
assert(
  "doc Authorization Bearer user JWT",
  /Authorization.*Bearer/i.test(doc) && /user JWT|user access token|operator JWT/i.test(doc),
);
assert(
  "doc caller admin UI auth findings",
  doc.includes("caller") && /admin UI|staging shell|Caller/i.test(doc),
);
assert(
  "doc operator JWT feasibility",
  /operator JWT/i.test(doc) && /feasib/i.test(doc),
);
assert(
  "doc dryRun anon save JWT required",
  /dryRun.*anon|anon.*dryRun/i.test(doc) && /save.*JWT|JWT.*save|operator JWT required/i.test(doc),
);
assert("doc is_admin policy", doc.includes("is_admin()"));
assert(
  "doc restrictive RLS",
  /restrictive RLS|restrictive policy|restrictive UPDATE/i.test(doc),
);
assert(
  "doc feasibility verdict",
  doc.includes("Feasibility verdict") || doc.includes("feasibilityVerdict"),
);
assert(
  "doc verdict FEASIBLE PARTIAL or STOP",
  /\*\*FEASIBLE\*\*|feasibilityVerdict: FEASIBLE|PARTIAL|STOP/i.test(doc),
);
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));
assert(
  "doc next phase auth jwt preflight or tools draft",
  doc.includes("G-20u36e-controlled-save-auth-jwt-feasibility-preflight") ||
    doc.includes("G-20u36e-controlled-save-auth-jwt-tools-draft-planning"),
);
assert(
  "doc readBack anon key",
  /readBack.*anon|anon.*readBack|SUPABASE_ANON_KEY/i.test(doc),
);
assert(
  "doc service_role not connected",
  /SUPABASE_SERVICE_ROLE_CONNECTED|service_role.*false|not used/i.test(doc),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-jwt-feasibility-plan"),
);
assert(
  "AI current-state auth jwt feasibility",
  currentState.includes("G-20u36e-controlled-save-auth-jwt-feasibility-planning") ||
    currentState.includes("gosakiDiscographyControlledSaveAuthJwtFeasibilityPlanned"),
);
assert(
  "AI next-actions auth jwt feasibility or preflight",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-feasibility-planning") ||
    nextActions.includes("G-20u36e-controlled-save-auth-jwt-feasibility-preflight"),
);
assert(
  "AI handoff auth jwt feasibility",
  handoff.includes("G-20u36e-controlled-save-auth-jwt-feasibility-planning") ||
    handoff.includes("gosakiDiscographyControlledSaveAuthJwtFeasibilityPlanned"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-feasibility-plan: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
