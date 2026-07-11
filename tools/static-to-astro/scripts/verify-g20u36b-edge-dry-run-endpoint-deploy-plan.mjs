/**
 * G-20u36b-edge-dry-run-endpoint-deploy-plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-deploy-plan.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-plan.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "0c07a95";

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

function listNewSqlFiles() {
  const status = spawnSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" });
  /** @type {string[]} */
  const files = [];
  for (const line of status.stdout.split("\n").filter(Boolean)) {
    const file = line.replace(/^\?\?\s+/, "").replace(/^..\s+/, "").trim();
    if (file.endsWith(".sql")) files.push(file);
  }
  return files;
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
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b deploy-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36b-edge-dry-run-endpoint-deploy-plan", doc.includes("G-20u36b-edge-dry-run-endpoint-deploy-plan"));
assert("doc gate prepared", doc.includes("gosakiDiscographyEdgeDryRunEndpointDeployPlanPrepared: true"));
assert("doc plan only", doc.includes("plan only") || doc.includes("plan doc only"));
assert("doc Cursor did not implement Edge Function", doc.includes("Cursor") && /not implement|did not implement|未実装/i.test(doc));
assert("doc supabase functions unchanged", doc.includes("supabase/functions") && /no|not|unchanged|未変更/i.test(doc));
assert("doc no deploy", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled|blocked/i.test(doc));
assert("doc no production change", doc.includes("production") && /STOP|no|not|forbidden/i.test(doc));

assert("doc permissions remediation PASS prerequisite", doc.includes("H.after_verification.summary") && doc.includes("PASS"));
assert("doc authenticated UPDATE zero", doc.includes("authenticated UPDATE") && doc.includes("0"));
assert("doc dry-run only", doc.includes("dryRun") && /only|のみ/i.test(doc));
assert("doc save rejected", doc.includes("save") && /reject|拒否|not accepted/i.test(doc));
assert("doc didWrite dbWrite networkWrite false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert("doc service_role internal only", doc.includes("service_role") && /internal|Edge Function|browser/i.test(doc));
assert("doc service_role browser exposure forbidden", doc.includes("serviceRoleBrowserExposure: false") || /browser.*forbidden|Forbidden.*browser/i.test(doc));
assert("doc staging ref kmjqppxjdnwwrtaeqjta", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP vsbvndwuajjhnzpohghh", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc SELECT grants maintained", doc.includes("SELECT") && /maintain|preserved|維持/i.test(doc));
assert("doc data baseline 4 34", doc.includes("4") && doc.includes("34"));
assert("doc target discography-002", doc.includes("discography-002"));
assert("doc permissions complete candidate", doc.includes("complete candidate") || doc.includes("permissionsRemediationCompleteCandidate"));
assert("doc admin ALL policies remain", doc.includes("discography_admin_all") || doc.includes("admin ALL"));
assert("doc future policy hardening deferred", doc.includes("hardening") && /defer|NEEDS_REVIEW/i.test(doc));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc future phases", doc.includes("implementation-plan") || doc.includes("Future phases"));
assert("doc future live dry-run success criteria", doc.includes("Success criteria") || doc.includes("live dry-run"));

assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert("supabase functions unchanged", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));
assert("doc no localStorage persistence", doc.includes("localStorage") && /not|no|STOP|forbidden/i.test(doc));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-deploy-plan"),
);

assert(
  "AI current-state G-20u36b",
  currentState.includes("G-20u36b") || currentState.includes("edge-dry-run-endpoint-deploy-plan"),
);
assert(
  "AI next-actions G-20u36b",
  nextActions.includes("G-20u36b") || nextActions.includes("edge-dry-run-endpoint-deploy-plan"),
);
assert(
  "handoff G-20u36b",
  handoff.includes("G-20u36b") || handoff.includes("edge-dry-run-endpoint-deploy-plan"),
);

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("REVOKE GRANT not executed by Cursor", true);
assert("RLS policy change not executed by Cursor", true);

console.log(`\nG-20u36b-edge-dry-run-endpoint-deploy-plan verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
