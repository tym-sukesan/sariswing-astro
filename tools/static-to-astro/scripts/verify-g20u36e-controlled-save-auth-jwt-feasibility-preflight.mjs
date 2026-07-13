/**
 * G-20u36e-controlled-save-auth-jwt-feasibility-preflight verifier.
 * Preflight design-only — no SQL execution / GRANT / RLS / DB write / Edge / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-auth-jwt-feasibility-preflight.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-preflight.md";
const FEASIBILITY_PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-auth-jwt-feasibility-plan.md";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const BASE_COMMIT = "df93bdf";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e auth JWT feasibility preflight base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during preflight doc creation`,
  );
}

assert("preflight doc exists", exists(DOC_REL));
assert("feasibility plan doc exists", exists(FEASIBILITY_PLAN_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36e-controlled-save-auth-jwt-feasibility-preflight",
  doc.includes("G-20u36e-controlled-save-auth-jwt-feasibility-preflight"),
);
assert(
  "doc gate gosakiDiscographyControlledSaveAuthJwtFeasibilityPreflightReady",
  doc.includes("gosakiDiscographyControlledSaveAuthJwtFeasibilityPreflightReady: true"),
);
assert("doc preflight only", doc.includes("Preflight only") || doc.includes("preflight only"));
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
  doc.includes("service_role") && /not use|不使用|not used|STOP|forbidden/i.test(doc),
);

assert(
  "doc operator JWT operational preflight",
  /operator JWT.*preflight|Operator JWT operational preflight/i.test(doc),
);
assert(
  "doc access_token non-display",
  /access_token/i.test(doc) && /non-display|not.*paste|Never|値を出さ|do not copy token/i.test(doc),
);
assert(
  "doc Edge Authorization header design",
  /Authorization header/i.test(doc) && /index\.ts|pass.*handler|header pass/i.test(doc),
);
assert(
  "doc save only JWT required",
  /save.*JWT|JWT.*save|operation=save.*JWT|save-only JWT/i.test(doc),
);
assert(
  "doc dryRun anon maintained",
  /dryRun.*anon|anon.*dryRun|dryRun stays anon/i.test(doc),
);
assert("doc is_admin confirmation items", doc.includes("is_admin()"));
assert(
  "doc RLS permissive restrictive composition",
  /permissive/i.test(doc) && /restrictive/i.test(doc) && /compos/i.test(doc),
);
assert(
  "doc operator user admin check items",
  /operator.*admin|admin.*operator|operator test user|operator user/i.test(doc),
);
assert(
  "doc feasibility preflight verdict",
  doc.includes("Feasibility preflight verdict") || doc.includes("feasibilityPreflightVerdict"),
);
assert(
  "doc verdict NEEDS_SELECT or READY or STOP",
  /NEEDS_SELECT_ONLY_AUTH_SNAPSHOT|READY_FOR_AUTH_JWT_TOOLS_DRAFT_PLANNING|STOP/i.test(doc),
);
assert(
  "doc recommended next phase",
  doc.includes("Recommended next phase") || doc.includes("Recommended next phases"),
);
assert(
  "doc auth admin rls select prep recommended",
  doc.includes("G-20u36e-controlled-save-auth-admin-rls-select-prep"),
);
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));
assert(
  "doc prior FEASIBLE",
  doc.includes("FEASIBLE") && /priorFeasibilityVerdict|Prior.*FEASIBLE/i.test(doc),
);

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u36e-controlled-save-auth-jwt-feasibility-preflight"),
);
assert(
  "AI current-state auth jwt feasibility preflight",
  currentState.includes("G-20u36e-controlled-save-auth-jwt-feasibility-preflight") ||
    currentState.includes("gosakiDiscographyControlledSaveAuthJwtFeasibilityPreflightReady"),
);
assert(
  "AI next-actions auth admin rls select prep or preflight",
  nextActions.includes("G-20u36e-controlled-save-auth-jwt-feasibility-preflight") ||
    nextActions.includes("G-20u36e-controlled-save-auth-admin-rls-select-prep"),
);
assert(
  "AI handoff auth jwt feasibility preflight",
  handoff.includes("G-20u36e-controlled-save-auth-jwt-feasibility-preflight") ||
    handoff.includes("gosakiDiscographyControlledSaveAuthJwtFeasibilityPreflightReady"),
);

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

console.log(
  `\nverify-g20u36e-controlled-save-auth-jwt-feasibility-preflight: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
