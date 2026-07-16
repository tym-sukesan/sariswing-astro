/**
 * G-20u43a — Gosaki Discography label Save Edge deploy preflight verifier.
 * Read-only — no Edge deploy / env / Save / DB write / network requests.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const PHASE = "G-20u43a-gosaki-discography-label-save-edge-deploy-preflight";
const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-label-save-edge-deploy-preflight.md";
const G20U43_DOC =
  "tools/static-to-astro/docs/gosaki-discography-label-controlled-save-slice-local-implementation.md";
const FUNCTION = "gosaki-discography-save-dry-run";
const STAGING = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION = "vsbvndwuajjhnzpohghh";
const ROLLBACK_BASELINE = "4c2e589";
const DEPLOY_COMMIT = "5c0d892";
const G20U43_APPROVAL = "G-20u43-gosaki-discography-label-controlled-save-slice";
const DRY_RUN_APPROVAL = "G-20u31-gosaki-discography-save-dry-run-endpoint";
const TRACK_SAVE_APPROVAL = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const LABEL_ORIGINAL = "Mardi Gras JAPAN Records";
const UPDATED_AT_BASELINE = "2026-07-10T05:59:35.138671+00:00";

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

function git(args) {
  return spawnSync("git", args, { cwd: REPO_ROOT, encoding: "utf8" });
}

const head = git(["rev-parse", "--short", "HEAD"]).stdout.trim();
const originMain = git(["rev-parse", "--short", "origin/main"]).stdout.trim();
const status = git(["status", "--short"]).stdout.trim();
const diffNames = git(["diff", `${ROLLBACK_BASELINE}..HEAD`, "--name-only", "--", `supabase/functions/${FUNCTION}/`])
  .stdout.trim()
  .split("\n")
  .filter(Boolean);

assert("preflight doc exists", exists(DOC_REL));
assert("G-20u43 implementation doc exists", exists(G20U43_DOC));

const doc = read(DOC_REL);
const g20u43Doc = read(G20U43_DOC);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const handler = read(`supabase/functions/${FUNCTION}/handler.ts`);
const indexTs = read(`supabase/functions/${FUNCTION}/index.ts`);
const adminTs = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);

assert(
  "package.json verify:g20u43a script",
  packageJson.includes('"verify:g20u43a-gosaki-discography-label-save-edge-deploy-preflight"'),
);
assert("doc phase id", doc.includes(PHASE));
assert("doc EDGE_DEPLOY_PREFLIGHT_READY true", doc.includes("EDGE_DEPLOY_PREFLIGHT_READY: true"));
assert("doc TARGET_PROJECT_FIXED true", doc.includes("TARGET_PROJECT_FIXED: true"));
assert("doc TARGET_FUNCTION_FIXED true", doc.includes("TARGET_FUNCTION_FIXED: true"));
assert(
  "doc SINGLE_FUNCTION_DEPLOY_CONFIRMED true",
  doc.includes("SINGLE_FUNCTION_DEPLOY_CONFIRMED: true"),
);
assert("doc NEW_SECRETS_REQUIRED false", doc.includes("NEW_SECRETS_REQUIRED: false"));
assert(
  "doc NON_WRITE_SMOKE_TEST_PLAN_FIXED true",
  doc.includes("NON_WRITE_SMOKE_TEST_PLAN_FIXED: true"),
);
assert("doc ROLLBACK_BASELINE_FIXED true", doc.includes("ROLLBACK_BASELINE_FIXED: true"));
assert("doc ROLLBACK_PLAN_FIXED true", doc.includes("ROLLBACK_PLAN_FIXED: true"));
assert("doc EDGE_DEPLOY_EXECUTED false", doc.includes("EDGE_DEPLOY_EXECUTED: false"));
assert("doc SAVE_REQUEST_EXECUTED false", doc.includes("SAVE_REQUEST_EXECUTED: false"));
assert("doc DB_WRITE_EXECUTED false", doc.includes("DB_WRITE_EXECUTED: false"));
assert(
  "doc CONTROLLED_SAVE_PREFLIGHT_READY false",
  doc.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false"),
);
assert("doc staging ref", doc.includes(STAGING));
assert("doc production STOP", doc.includes(PRODUCTION));
assert("doc function name", doc.includes(FUNCTION));
assert("doc rollback baseline", doc.includes(ROLLBACK_BASELINE));
assert("doc deploy commit", doc.includes(DEPLOY_COMMIT));
assert("doc label baseline", doc.includes(LABEL_ORIGINAL));
assert("doc updated_at baseline", doc.includes(UPDATED_AT_BASELINE));
assert("doc no operator runbook claim", !/curl\s+-i|supabase functions deploy/.test(doc));
assert("doc smoke unauthenticated reject", /without.*Authorization|reject/i.test(doc));
assert("doc smoke no authenticated Save", /Do not send|authenticated G-20u43 Save/i.test(doc));
assert("doc G-20u25 4 releases 34 tracks", /4 releases.*34 tracks|4 releases · 34 tracks/.test(doc));

assert("HEAD equals origin/main", head === originMain, `${head} vs ${originMain}`);
if (status === "") {
  assert("working tree clean", true);
} else {
  const onlyG20u43aArtifacts = status
    .split("\n")
    .filter(Boolean)
    .every((line) =>
      /gosaki-discography-label-save-edge-deploy-preflight|verify-g20u43a-gosaki-discography-label-save-edge-deploy-preflight|tools\/static-to-astro\/package\.json|tools\/static-to-astro\/docs\/ai\//.test(
        line,
      ),
    );
  assert(
    "working tree clean or only G-20u43a preflight artifacts",
    onlyG20u43aArtifacts,
    status,
  );
}

assert("handler STAGING_PROJECT_REF", handler.includes(`STAGING_PROJECT_REF = "${STAGING}"`));
assert("handler PRODUCTION_REF_STOP", handler.includes(`PRODUCTION_REF_STOP = "${PRODUCTION}"`));
assert("handler G-20u43 route", handler.includes("handleControlledG20u43LabelSaveHttp"));
assert("handler track-title path preserved", handler.includes("handleControlledG20u36eSaveHttp"));
assert("handler nested validateG20u43NestedSavePayload", handler.includes("validateG20u43NestedSavePayload"));
assert(
  "handler atomic label eq",
  /\.eq\("label", transition\.beforeLabel\)/.test(handler),
);
assert("handler no service_role connected", handler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"));
assert("handler dry-run approval preserved", handler.includes(DRY_RUN_APPROVAL));
assert("handler track save approval preserved", handler.includes(TRACK_SAVE_APPROVAL));
assert("handler G-20u43 approval", handler.includes(G20U43_APPROVAL));

const indexDiff = git(["diff", `${ROLLBACK_BASELINE}..HEAD`, "--", `supabase/functions/${FUNCTION}/index.ts`])
  .stdout;
assert("index.ts diff comment-only (no corsHeaders change)", !indexDiff.includes("corsHeaders"));
assert("index OPTIONS unchanged", indexTs.includes('req.method === "OPTIONS"'));
assert("index CORS allow origin star", indexTs.includes('"Access-Control-Allow-Origin": "*"'));

assert(
  "deploy diff only handler + index",
  diffNames.length === 2 &&
    diffNames.includes(`supabase/functions/${FUNCTION}/handler.ts`) &&
    diffNames.includes(`supabase/functions/${FUNCTION}/index.ts`),
  diffNames.join(", "),
);
assert("handler no local relative imports", !/from\s+["']\.\//.test(handler));

assert("UI arm exact true only", adminTs.includes('=== "true"'));
assert("UI arm env name", adminTs.includes("PUBLIC_GOSAKI_DISCOGRAPHY_SAVE_UI_ARMED"));
assert("UI G-20u43 approval", adminTs.includes(G20U43_APPROVAL));

assert("G-20u43 doc nested allowlist", g20u43Doc.includes("NESTED_PAYLOAD_ALLOWLIST_FAILS_CLOSED: true"));
assert("AI 00 G-20u43a", currentState.includes("G-20u43a"));
assert("AI 03 G-20u43a", nextActions.includes("G-20u43a"));
assert("handoff G-20u43a", handoff.includes("G-20u43a"));

const deno = spawnSync(
  "deno",
  ["check", `supabase/functions/${FUNCTION}/index.ts`],
  { cwd: REPO_ROOT, encoding: "utf8" },
);
if (deno.error && deno.error.code === "ENOENT") {
  console.log("NOTE deno not installed — skipping type check");
} else {
  assert("deno check Edge function", deno.status === 0, deno.stderr?.trim());
}

console.log(`\nPassed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  console.error(`G-20u43a label Save Edge deploy preflight verifier: FAIL`);
  process.exit(1);
}
console.log("G-20u43a label Save Edge deploy preflight verifier: PASS");
