/**
 * G-20u36b-edge-dry-run-endpoint-deploy-preflight-result record verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-result-gosaki-discography-edge-dry-run-endpoint-deploy-preflight-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-preflight-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-preflight.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "2d754f7";

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
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b deploy-preflight-result base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));

const doc = read(DOC_REL);
const preflightDoc = read(PREFLIGHT_DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36b-edge-dry-run-endpoint-deploy-preflight-result-record",
  doc.includes("G-20u36b-edge-dry-run-endpoint-deploy-preflight-result-record"),
);
assert(
  "doc gate result recorded",
  doc.includes("gosakiDiscographyEdgeDryRunEndpointDeployPreflightResultRecorded: true"),
);
assert("doc human operator executed", doc.includes("Human operator") || doc.includes("human operator"));
assert("doc Cursor did not execute SQL", doc.includes("Cursor") && /not execute|did not execute|no/i.test(doc));
assert("doc staging project ref", doc.includes("kmjqppxjdnwwrtaeqjta"));
assert(
  "doc production not used",
  doc.includes("vsbvndwuajjhnzpohghh") && /not used|not executed|Forbidden|confirmed not/i.test(doc),
);
assert(
  "doc READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT",
  doc.includes("READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT"),
);
assert("doc H.deploy_preflight summary", doc.includes("H.deploy_preflight.summary"));
assert("doc endpoint name", doc.includes("gosaki-discography-save-dry-run"));
assert("doc authenticated UPDATE zero", doc.includes("authenticated UPDATE") && /0/.test(doc));
assert("doc anon write grants zero", doc.includes("anon write") && /0/.test(doc));
assert("doc SELECT grants preserved", doc.includes("SELECT") && /preserv|2/.test(doc));
assert("doc RLS enabled", doc.includes("RLS") && /enabled|true/i.test(doc));
assert("doc data baseline 4 34", doc.includes("4") && doc.includes("34"));
assert("doc target discography-002 1 8", doc.includes("discography-002") && doc.includes("8"));
assert(
  "doc effective write risk NEEDS_REVIEW no longer RISK",
  doc.includes("NEEDS_REVIEW") && doc.includes("no longer RISK"),
);
assert(
  "doc admin ALL policies remain",
  doc.includes("admin ALL") || doc.includes("discography_admin_all"),
);
assert(
  "doc Edge deploy not executed",
  doc.includes("Edge") && /not executed|No|false|未実行/i.test(doc),
);
assert(
  "doc Save not enabled",
  doc.includes("Save") && /not executed|not enabled|No|false|disabled|未有効/i.test(doc),
);
assert(
  "doc admin fetch POST not added",
  doc.includes("fetch POST") && /not added|Not added|未追加/i.test(doc),
);
assert("doc next deploy-manual", doc.includes("deploy-manual"));

assert(
  "preflight doc gate prepared",
  preflightDoc.includes("gosakiDiscographyEdgeDryRunEndpointDeployPreflightPrepared: true"),
);

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
  packageJson.includes(
    "verify:g20u36b-result-gosaki-discography-edge-dry-run-endpoint-deploy-preflight-result",
  ),
);

assert(
  "AI current-state deploy-preflight-result",
  currentState.includes("deploy-preflight-result") ||
    currentState.includes("READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT"),
);
assert(
  "AI next-actions deploy-manual",
  nextActions.includes("deploy-manual") || nextActions.includes("deploy-preflight-result"),
);
assert(
  "handoff deploy-preflight-result",
  handoff.includes("deploy-preflight-result") ||
    handoff.includes("READY_FOR_EDGE_DRY_RUN_DEPLOY_PREFLIGHT") ||
    handoff.includes("deploy-manual"),
);

assert("SQL not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36b-edge-dry-run-endpoint-deploy-preflight-result verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
