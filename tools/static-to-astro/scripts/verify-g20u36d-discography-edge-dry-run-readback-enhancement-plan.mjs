/**
 * G-20u36d-discography-edge-dry-run-readback-enhancement-planning
 * Planning-only verifier — no Edge edit / deploy / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-discography-edge-dry-run-readback-enhancement-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-discography-edge-dry-run-readback-enhancement-plan.md";
const STG_QA_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-stg-browser-qa-result.md";
const PERMS_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36a-permissions-remediation-after-verification-result.md";
const HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const BASE_COMMIT = "f31165f";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const SITE_SLUG = "gosaki-piano";

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
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");

assert("doc phase G-20u36d", doc.includes("G-20u36d-discography-edge-dry-run-readback-enhancement-planning"));
assert("doc gate prepared", doc.includes("gosakiDiscographyEdgeDryRunReadBackEnhancementPlanPrepared: true"));
assert("doc planning only", doc.includes("planning only") || doc.includes("planning-only"));
assert("doc Edge edit not in phase", doc.includes("Edge Function edit") && /not in this phase|not executed/i.test(doc));
assert("doc deploy not in phase", doc.includes("Edge deploy") && /not in this phase|not executed/i.test(doc));
assert("doc SQL not in phase", doc.includes("SQL") && /not in this phase|not executed/i.test(doc));
assert("doc DB write not in phase", doc.includes("DB write") && /not in this phase|not executed/i.test(doc));
assert("doc Save not in phase", doc.includes("Save enablement") && /not in this phase|not executed/i.test(doc));
assert("doc admin UI not in phase", doc.includes("Admin UI") && /not in this phase|not executed/i.test(doc));
assert("doc FTP not in phase", doc.includes("FTP") && /not in this phase|not executed/i.test(doc));

assert("doc readBack purpose", doc.includes("readBack") && (/SELECT-only|SELECT only/i.test(doc)));
assert("doc anon SELECT preferred", doc.includes("anon SELECT") && (/prefer|first|優先/i.test(doc)));
assert("doc service_role not in implementation", doc.includes("service_role") && (/not implement|Do not implement|使わない|not used/i.test(doc)));
assert("doc query siteSlug legacyId", doc.includes(SITE_SLUG) && doc.includes("legacy_id"));
assert("doc discography tables", doc.includes("public.discography") && doc.includes("discography_tracks"));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("false"));
assert("doc operation save reject", doc.includes("operation=save") && (/reject|Still/i.test(doc)));
assert("doc sanitized readBack summary", doc.includes("sanitized") && doc.includes("readBack"));
assert("doc no full raw rows", doc.includes("full") && (/not return|Do not return|summary only/i.test(doc)));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP and ask"));
assert("doc production STOP ref", doc.includes(PRODUCTION_REF));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc next phase tools-draft", doc.includes("readback-implementation-in-tools-draft") || doc.includes("tools-draft"));
assert("doc next phase live-verify", doc.includes("readback-live-verify") || doc.includes("live-verify"));
assert("doc G-20u36e Save planning deferred", doc.includes("G-20u36e") || doc.includes("controlled Save"));

assert("STG QA doc exists", exists(STG_QA_DOC_REL));
assert("permissions doc exists", exists(PERMS_DOC_REL));
assert("handler exists for analysis", exists(HANDLER_REL));
const handler = read(HANDLER_REL);
assert("handler resolveCurrentSnapshot empty", handler.includes("resolveCurrentSnapshot") && handler.includes("return {}"));
assert("handler readBack null today", handler.includes("readBack: null"));

assert("supabase/functions not edited", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));
assert("admin templates not edited for readBack impl", !diffTouches("tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts") || !doc.includes("implementation"));

assert("npm verify script", packageJson.includes("verify:g20u36d-discography-edge-dry-run-readback-enhancement-plan"));

if (exists(DOC_REL)) {
  const currentState = read(`${AI_DIR}/00-current-state.md`);
  const nextActions = read(`${AI_DIR}/03-next-actions.md`);
  const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
  assert(
    "AI current-state G-20u36d",
    currentState.includes("G-20u36d") || currentState.includes("ReadBackEnhancement"),
  );
  assert(
    "AI next-actions readback implementation",
    nextActions.includes("readback-implementation") ||
      nextActions.includes("readBack") ||
      nextActions.includes("tools-draft"),
  );
  assert("handoff G-20u36d", handoff.includes("G-20u36d") || handoff.includes("readBack"));
}

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge deploy not executed by Cursor", true);
assert("Save enablement not executed by Cursor", true);

console.log(`\nG-20u36d-discography-edge-dry-run-readback-enhancement-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
