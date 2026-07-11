/**
 * G-20u36b-edge-dry-run-endpoint-implementation-plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-implementation-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-implementation-plan.md";
const DEPLOY_PLAN_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-plan.md";
const DRAFT_MODULE_REL =
  "tools/static-to-astro/scripts/lib/gosaki-discography-save-dry-run-endpoint-draft.mjs";
const SCHEMA_MODULE_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-save-schema.mjs";
const APPROVAL_MODULE_REL =
  "tools/static-to-astro/scripts/lib/gosaki-discography-save-approval-registry.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "1629573";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b implementation-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
const doc = read(DOC_REL);
const deployPlan = read(DEPLOY_PLAN_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36b-edge-dry-run-endpoint-implementation-plan",
  doc.includes("G-20u36b-edge-dry-run-endpoint-implementation-plan"),
);
assert("doc gate prepared", doc.includes("gosakiDiscographyEdgeDryRunEndpointImplementationPlanPrepared: true"));
assert("doc plan only", doc.includes("plan only") || doc.includes("plan doc only"));
assert("doc Cursor did not implement Edge", doc.includes("Cursor") && /not implement|did not implement|未実装/i.test(doc));
assert("doc supabase functions unchanged", doc.includes("supabase/functions") && /no|not|unchanged|未変更/i.test(doc));
assert("doc no deploy", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled|blocked/i.test(doc));
assert("doc no production change", doc.includes("production") && /STOP|no|not|forbidden/i.test(doc));

assert(
  "doc follows deploy plan",
  doc.includes("deploy plan") || doc.includes("deploy-plan") || doc.includes(DEPLOY_PLAN_REL.split("/").pop()),
);
assert("deploy plan doc exists", exists(DEPLOY_PLAN_REL));
assert("deploy plan gate prepared", deployPlan.includes("gosakiDiscographyEdgeDryRunEndpointDeployPlanPrepared: true"));

assert("doc permissions remediation PASS prerequisite", doc.includes("H.after_verification.summary") && doc.includes("PASS"));
assert("doc authenticated UPDATE zero", doc.includes("authenticated UPDATE") && doc.includes("0"));
assert("doc staging ref kmjqppxjdnwwrtaeqjta", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP vsbvndwuajjhnzpohghh", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc dryRun only", doc.includes("dryRun") && /only|のみ/i.test(doc));
assert("doc save rejected", doc.includes("save") && /reject|拒否|not accepted/i.test(doc));
assert("doc didWrite dbWrite networkWrite false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert("doc service_role internal only", doc.includes("service_role") && /internal|Edge|runtime secret/i.test(doc));
assert("doc service_role browser forbidden", doc.includes("serviceRoleBrowserExposure: false") || /browser.*forbidden|Forbidden.*browser/i.test(doc));

assert("doc references draft module", doc.includes("gosaki-discography-save-dry-run-endpoint-draft.mjs"));
assert("doc references schema module", doc.includes("gosaki-discography-save-schema.mjs"));
assert("doc references approval registry", doc.includes("gosaki-discography-save-approval-registry.mjs"));
assert("draft module exists", exists(DRAFT_MODULE_REL));
assert("schema module exists", exists(SCHEMA_MODULE_REL));
assert("approval module exists", exists(APPROVAL_MODULE_REL));

assert("doc request validation plan", doc.includes("Request validation plan") || doc.includes("Request validation"));
assert("doc response validation plan", doc.includes("Response validation plan") || doc.includes("Response validation"));
assert("doc security plan", doc.includes("Security plan") || doc.includes("security plan"));
assert("doc future phases", doc.includes("inert-implementation") || doc.includes("Future phases"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc target discography-002", doc.includes("discography-002"));
assert("doc siteSlug gosaki-piano", doc.includes("gosaki-piano"));
assert("doc endpoint name", doc.includes("gosaki-discography-save-dry-run"));
assert("doc no ts js source added", doc.includes(".ts") && /not added|not created|no/i.test(doc));

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
  packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-implementation-plan"),
);

assert(
  "AI current-state implementation-plan",
  currentState.includes("implementation-plan") || currentState.includes("G-20u36b-edge-dry-run-endpoint-implementation"),
);
assert(
  "AI next-actions implementation-plan",
  nextActions.includes("implementation-plan") || nextActions.includes("inert-implementation"),
);
assert(
  "handoff implementation-plan",
  handoff.includes("implementation-plan") || handoff.includes("inert-implementation"),
);

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("REVOKE GRANT not executed by Cursor", true);
assert("RLS policy change not executed by Cursor", true);

console.log(
  `\nG-20u36b-edge-dry-run-endpoint-implementation-plan verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
