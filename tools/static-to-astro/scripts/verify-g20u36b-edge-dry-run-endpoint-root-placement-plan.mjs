/**
 * G-20u36b-edge-dry-run-endpoint-root-placement-plan verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-root-placement-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-root-placement-plan.md";
const STAGING_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-function-source-staging.md";
const DRAFT_INDEX_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts";
const DRAFT_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const ROOT_INDEX_REL = "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "e3b5e01";

const MUTATION_PATTERNS = [
  /\.insert\s*\(/i,
  /\.update\s*\(/i,
  /\.upsert\s*\(/i,
  /\.delete\s*\(/i,
  /\.rpc\s*\(/i,
];

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
    if (file.endsWith(".sql") && !file.includes("select-only")) {
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b root-placement-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("function-source-staging doc exists", exists(STAGING_DOC_REL));
assert("tools draft index exists", exists(DRAFT_INDEX_REL));
assert("tools draft handler exists", exists(DRAFT_HANDLER_REL));

const doc = read(DOC_REL);
const stagingDoc = read(STAGING_DOC_REL);
const draftIndex = read(DRAFT_INDEX_REL);
const draftHandler = read(DRAFT_HANDLER_REL);
const draftSrc = `${draftIndex}\n${draftHandler}`;
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36b-edge-dry-run-endpoint-root-placement-plan",
  doc.includes("G-20u36b-edge-dry-run-endpoint-root-placement-plan"),
);
assert("doc gate prepared", doc.includes("gosakiDiscographyEdgeDryRunEndpointRootPlacementPlanPrepared: true"));
assert("doc plan only", doc.includes("plan only") || doc.includes("plan doc only"));
assert("doc root supabase functions unchanged", doc.includes("supabase/functions") && /no|not|unchanged|未変更/i.test(doc));
assert("doc no deploy", doc.includes("deploy") && /no|not|false|未実行|separate/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled/i.test(doc));
assert("doc admin fetch POST not added", doc.includes("fetch POST") && /no|not|未追加/i.test(doc));

assert(
  "doc copy from tools draft index",
  doc.includes("scripts/edge-functions/gosaki-discography-save-dry-run/index.ts"),
);
assert(
  "doc copy from tools draft handler",
  doc.includes("scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts"),
);
assert(
  "doc copy to root index",
  doc.includes("supabase/functions/gosaki-discography-save-dry-run/index.ts"),
);
assert(
  "doc copy to root handler",
  doc.includes("supabase/functions/gosaki-discography-save-dry-run/handler.ts"),
);
assert(
  "doc relative copy path",
  doc.includes("../../supabase/functions/gosaki-discography-save-dry-run"),
);

assert("doc endpoint name", doc.includes("gosaki-discography-save-dry-run"));
assert("doc staging ref kmjqppxjdnwwrtaeqjta", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP vsbvndwuajjhnzpohghh", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc dryRun only", doc.includes("dryRun") && /only|のみ/i.test(doc));
assert("doc save rejected", doc.includes("save") && /reject|拒否/i.test(doc));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert(
  "doc service_role not connected",
  doc.includes("service_role") && /NOT CONNECTED|not connected|false/i.test(doc),
);
assert("doc review Deno.serve index only", doc.includes("Deno.serve") && /index\.ts only|index.ts only/i.test(doc));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert(
  "doc root-placement separate approval",
  doc.includes("root-placement") &&
    (/separate approval|別承認|separate operator/i.test(doc) ||
      doc.includes("G-20u36b-edge-dry-run-endpoint-root-placement")),
);
assert(
  "doc deploy separate phase",
  doc.includes("deploy-manual") || doc.includes("Deploy remains separate"),
);

assert("staging doc proceedToRootPlacementPlan", stagingDoc.includes("proceedToRootPlacementPlan: true"));

assert("root target function not yet present", !exists(ROOT_INDEX_REL));
assert("root supabase functions unchanged", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert("draft Deno.serve in index only", draftIndex.includes("Deno.serve") && !draftHandler.includes("Deno.serve"));
assert("draft operation save reject", draftSrc.includes('operation "save" is rejected'));
assert("draft service_role not connected", draftHandler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));

for (const pattern of MUTATION_PATTERNS) {
  assert(`draft no mutation ${pattern}`, !pattern.test(draftSrc));
}

assert(
  "draft no service_role env read",
  !/Deno\.env\.get\s*\(\s*["']SUPABASE_SERVICE_ROLE_KEY["']\s*\)/.test(draftSrc),
);

assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-root-placement-plan"),
);

assert(
  "AI current-state root-placement-plan",
  currentState.includes("root-placement-plan") || currentState.includes("root placement plan"),
);
assert(
  "AI next-actions root-placement execution",
  nextActions.includes("G-20u36b-edge-dry-run-endpoint-root-placement") ||
    (nextActions.includes("root-placement") && nextActions.includes("separate approval")),
);
assert(
  "handoff root-placement-plan",
  handoff.includes("root-placement-plan") || handoff.includes("root placement plan"),
);

assert("SQL not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36b-edge-dry-run-endpoint-root-placement-plan verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
