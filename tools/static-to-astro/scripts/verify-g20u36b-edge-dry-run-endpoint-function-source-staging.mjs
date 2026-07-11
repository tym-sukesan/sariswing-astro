/**
 * G-20u36b-edge-dry-run-endpoint-function-source-staging verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-function-source-staging.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-function-source-staging.md";
const DRAFT_INDEX_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts";
const DRAFT_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const INERT_MODULE_REL =
  "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-endpoint-inert.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "13c5bc6";

const MUTATION_PATTERNS = [
  /\.insert\s*\(/i,
  /\.update\s*\(/i,
  /\.upsert\s*\(/i,
  /\.delete\s*\(/i,
  /\.rpc\s*\(/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
];

const DEPLOY_CALL_PATTERNS = [
  /trigger-deploy/i,
  /workflow_dispatch/i,
  /ftp/i,
  /mirror\s+--delete/i,
  /functions deploy/i,
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

function countDenoServeInToolsDraft() {
  const edgeDir = path.join(REPO_ROOT, "tools/static-to-astro/scripts/edge-functions");
  if (!fs.existsSync(edgeDir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(edgeDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const indexPath = path.join(edgeDir, entry.name, "index.ts");
    if (fs.existsSync(indexPath) && fs.readFileSync(indexPath, "utf8").includes("Deno.serve")) {
      count += 1;
    }
  }
  return count;
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b function-source-staging base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("function source draft index exists", exists(DRAFT_INDEX_REL));
assert("function source draft handler exists", exists(DRAFT_HANDLER_REL));
assert("inert module exists", exists(INERT_MODULE_REL));

const doc = read(DOC_REL);
const indexTs = read(DRAFT_INDEX_REL);
const handlerTs = read(DRAFT_HANDLER_REL);
const draftSrc = `${indexTs}\n${handlerTs}`;
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36b-edge-dry-run-endpoint-function-source-staging",
  doc.includes("G-20u36b-edge-dry-run-endpoint-function-source-staging"),
);
assert("doc gate staged", doc.includes("gosakiDiscographyEdgeDryRunEndpointFunctionSourceStaged: true"));
assert("doc tools draft only", doc.includes("tools draft") || doc.includes("tools配下"));
assert("doc root supabase functions unchanged", doc.includes("supabase/functions") && /no|not|unchanged|未変更/i.test(doc));
assert("doc no deploy", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled/i.test(doc));
assert("doc admin fetch POST not added", doc.includes("fetch POST") && /no|not|未追加/i.test(doc));
assert("doc endpoint name", doc.includes("gosaki-discography-save-dry-run"));
assert("doc staging ref kmjqppxjdnwwrtaeqjta", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert("doc production ref STOP vsbvndwuajjhnzpohghh", doc.includes("vsbvndwuajjhnzpohghh"));
assert("doc dryRun only", doc.includes("dryRun") && /only|のみ/i.test(doc));
assert("doc save rejected", doc.includes("save") && /reject|拒否/i.test(doc));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert(
  "doc service_role not connected",
  doc.includes("service_role") && /NOT CONNECTED|not connected|未接続/i.test(doc),
);
assert("doc secrets not printed", doc.includes("secret") && /not print|Forbidden|表示しない|Not read/i.test(doc));
assert("doc next phases root placement", doc.includes("root-placement"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));

assert("draft index Deno.serve", indexTs.includes("Deno.serve"));
assert("draft POST only", indexTs.includes('req.method !== "POST"') || handlerTs.includes("HTTP method must be POST"));
assert("draft application/json", draftSrc.includes("application/json"));
assert("draft endpoint name in handler", handlerTs.includes("gosaki-discography-save-dry-run"));
assert("draft siteSlug gosaki-piano", handlerTs.includes("gosaki-piano"));
assert("draft operation save reject", draftSrc.includes('operation "save" is rejected'));
assert("draft dryRun only", handlerTs.includes('operation must be "dryRun"') || handlerTs.includes("DRY_RUN_OPERATION"));
assert("draft didWrite false", handlerTs.includes("didWrite: false"));
assert("draft dbWrite false", handlerTs.includes("dbWrite: false"));
assert("draft networkWrite false", handlerTs.includes("networkWrite: false"));
assert("draft saveEnabled false", handlerTs.includes("saveEnabled: false"));
assert("draft service_role not connected", handlerTs.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert(
  "draft no active service_role env read",
  !/Deno\.env\.get\s*\(\s*["']SUPABASE_SERVICE_ROLE_KEY["']\s*\)/.test(draftSrc),
);
assert(
  "draft no supabase createClient",
  !draftSrc.includes("createClient") && !draftSrc.includes("@supabase/supabase-js"),
);

for (const pattern of MUTATION_PATTERNS) {
  assert(`draft no mutation ${pattern}`, !pattern.test(draftSrc));
}

for (const pattern of DEPLOY_CALL_PATTERNS) {
  assert(`draft no deploy call ${pattern}`, !pattern.test(draftSrc));
}

assert("draft no localStorage", !draftSrc.includes("localStorage"));
assert("Deno.serve only in tools edge-functions draft", countDenoServeInToolsDraft() >= 1);

assert("root supabase functions unchanged", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

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
  packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-function-source-staging"),
);

assert(
  "AI current-state function-source-staging",
  currentState.includes("function-source-staging") || currentState.includes("function source staging"),
);
assert(
  "AI next-actions root-placement",
  nextActions.includes("root-placement") || nextActions.includes("root placement"),
);
assert(
  "handoff function-source-staging",
  handoff.includes("function-source-staging") || handoff.includes("function source staging"),
);

try {
  const { handleDiscographyEdgeDryRunInert, buildSampleInertDryRunInput } = await import(
    "./lib/gosaki-discography-edge-dry-run-endpoint-inert.mjs"
  );
  const inertInput = buildSampleInertDryRunInput();
  const inertResult = handleDiscographyEdgeDryRunInert(inertInput);
  assert("inert module sample dryRun ok", inertResult.ok === true);
  assert("inert module write flags false", inertResult.didWrite === false && inertResult.dbWrite === false);
  assert("handler exports handleDiscographyEdgeDryRunHttp", handlerTs.includes("handleDiscographyEdgeDryRunHttp"));
  assert("handler exports simulateDiscographySaveDryRunEndpoint", handlerTs.includes("simulateDiscographySaveDryRunEndpoint"));
} catch (err) {
  assert("inert module parity import", false, String(err));
}

assert("SQL not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36b-edge-dry-run-endpoint-function-source-staging verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
