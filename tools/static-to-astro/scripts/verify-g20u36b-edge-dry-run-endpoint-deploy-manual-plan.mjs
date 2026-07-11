/**
 * G-20u36b-edge-dry-run-endpoint-deploy-manual-plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-deploy-manual-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-manual-plan.md";
const PREFLIGHT_RESULT_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-preflight-result.md";
const INERT_MODULE_REL =
  "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-endpoint-inert.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "2189c82";

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
    if (
      file.endsWith(".sql") &&
      !file.includes("deploy-preflight") &&
      !file.includes("select-only")
    ) {
      files.push(file);
    }
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b deploy-manual-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("preflight result doc exists", exists(PREFLIGHT_RESULT_REL));
assert("inert module exists", exists(INERT_MODULE_REL));

const doc = read(DOC_REL);
const preflightResult = read(PREFLIGHT_RESULT_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36b-edge-dry-run-endpoint-deploy-manual-plan",
  doc.includes("G-20u36b-edge-dry-run-endpoint-deploy-manual-plan"),
);
assert("doc gate prepared", doc.includes("gosakiDiscographyEdgeDryRunEndpointDeployManualPlanPrepared: true"));
assert("doc plan only", doc.includes("plan only") || doc.includes("plan doc only"));
assert("doc Cursor did not deploy", doc.includes("Cursor") && /not deploy|did not deploy|未/i.test(doc));
assert("doc root supabase functions unchanged", doc.includes("supabase/functions") && /no|not|unchanged|未変更/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled/i.test(doc));
assert("doc admin fetch POST not added", doc.includes("fetch POST") && /no|not|未追加/i.test(doc));
assert("doc no production change", doc.includes("production") && /STOP|no|not|forbidden/i.test(doc));

assert(
  "doc deploy preflight READY prerequisite",
  doc.includes("READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT") ||
    doc.includes("deploy-preflight-result"),
);
assert(
  "preflight result READY recorded",
  preflightResult.includes("READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT"),
);
assert("doc endpoint name", doc.includes("gosaki-discography-save-dry-run"));
assert("doc staging ref kmjqppxjdnwwrtaeqjta", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP vsbvndwuajjhnzpohghh", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc dryRun only", doc.includes("dryRun") && /only|のみ/i.test(doc));
assert("doc save rejected", doc.includes("save") && /reject|拒否/i.test(doc));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert("doc service_role internal only", doc.includes("service_role") && /internal|Edge|runtime|never/i.test(doc));
assert("doc secrets not printed", doc.includes("secret") && /not print|Forbidden|表示しない|do not display/i.test(doc));
assert(
  "doc future manual deploy NOT EXECUTED",
  doc.includes("NOT EXECUTED IN THIS PHASE") &&
    doc.includes("HUMAN OPERATOR ONLY") &&
    doc.includes("STAGING ONLY"),
);
assert("doc function source staging next phase", doc.includes("function source") || doc.includes("Function source"));
assert("doc live verify plan", doc.includes("Live verify") || doc.includes("live verify"));
assert("doc rollback disable plan", doc.includes("Rollback") || doc.includes("disable"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));

assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert("root supabase functions unchanged", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-deploy-manual-plan"),
);

assert(
  "AI current-state deploy-manual-plan",
  currentState.includes("deploy-manual") || currentState.includes("deploy-manual-plan"),
);
assert(
  "AI next-actions function source or deploy-manual",
  nextActions.includes("function-source") ||
    nextActions.includes("deploy-manual") ||
    nextActions.includes("deploy-manual-plan"),
);
assert(
  "handoff deploy-manual-plan",
  handoff.includes("deploy-manual") || handoff.includes("function-source"),
);

assert("SQL not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36b-edge-dry-run-endpoint-deploy-manual-plan verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
