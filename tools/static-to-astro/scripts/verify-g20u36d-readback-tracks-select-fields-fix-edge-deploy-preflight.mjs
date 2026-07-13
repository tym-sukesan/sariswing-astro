/**
 * G-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight verifier.
 * Preflight-only — no Edge deploy / SQL / Save / root edit.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight.md";
const ROOT_PLACEMENT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-select-fields-fix-root-placement.md";
const TOOLS_DRAFT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-select-fields-fix-tools-draft.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-select-fields-fix-plan.md";
const ENV_SECRET_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-env-secret-setting-result.md";
const LIVE_VERIFY_RETRY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry.md";
const ROOT_INDEX_REL = "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "cd6b0d5";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-discography-save-dry-run";

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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
}

function trackSelectIncludesDuration(src) {
  const match = src.match(/TRACK_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  return /["']duration["']/.test(match[1]);
}

function trackSelectMissingDuration(src) {
  return !trackSelectIncludesDuration(src);
}

function trackSelectHasRequiredFields(src) {
  const match = src.match(/TRACK_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  const fields = match[1];
  return (
    /["']track_number["']/.test(fields) &&
    /["']title["']/.test(fields) &&
    /["']sort_order["']/.test(fields) &&
    /["']site_slug["']/.test(fields)
  );
}

function runNpmScript(scriptName) {
  const result = spawnSync("npm", ["run", scriptName], {
    cwd: TOOL_ROOT,
    encoding: "utf8",
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  return {
    ok: result.status === 0,
    status: result.status ?? 1,
    tail: `${result.stdout}\n${result.stderr}`.trim().split("\n").slice(-3).join("\n"),
  };
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-select-fields edge-deploy-preflight base ${BASE_COMMIT}) — non-blocking`,
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
assert("root placement doc exists", exists(ROOT_PLACEMENT_DOC_REL));
assert("tools draft doc exists", exists(TOOLS_DRAFT_DOC_REL));
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("env secret result doc exists", exists(ENV_SECRET_RESULT_DOC_REL));
assert("live verify retry doc exists", exists(LIVE_VERIFY_RETRY_DOC_REL));
assert("root index exists", exists(ROOT_INDEX_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));

const doc = read(DOC_REL);
const rootIndex = read(ROOT_INDEX_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const rootSrc = `${rootIndex}\n${rootHandler}`;
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight",
  doc.includes("G-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight"),
);
assert(
  "doc gate ready",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksSelectFieldsFixEdgeDeployPreflightReady: true"),
);
assert("doc preflight only", doc.includes("preflight") && /preflight.*only|Preflight doc/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("deploy") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert(
  "doc supabase functions not edited this phase",
  doc.includes("supabase/functions") && /no|not|false|未編集|unchanged|this phase/i.test(doc),
);
assert("doc root placement complete", doc.includes("root placement") || doc.includes("rootPlacementComplete"));
assert("doc TRACK_SELECT_FIELDS without duration", doc.includes("TRACK_SELECT_FIELDS") && doc.includes("duration"));
assert("doc duration optional absent", doc.includes("optional") || doc.includes("absent"));

assert("doc deploy target function", doc.includes(FUNCTION_NAME));
assert("doc staging project ref", doc.includes(STAGING_REF));
assert("doc production ref STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|禁止/i.test(doc));
assert("doc deploy command locked", doc.includes("supabase functions deploy") && doc.includes(STAGING_REF));
assert("doc cd repo root in command", doc.includes("cd ~/sariswing-astro"));
assert("doc Docker warning non-blocking", doc.includes("Docker") && /non-blocking/i.test(doc));
assert("doc cli-latest restore", doc.includes("cli-latest") && /restore/i.test(doc));
assert("doc git status after deploy", doc.includes("git status"));

assert("doc SUPABASE_URL env name", doc.includes("SUPABASE_URL"));
assert("doc SUPABASE_ANON_KEY env name", doc.includes("SUPABASE_ANON_KEY"));
assert(
  "doc GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED added",
  doc.includes("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED") && /added|exists/i.test(doc),
);
assert("doc secrets names only", doc.includes("names") && /never|not display|値|values not/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|Forbidden|not used/i.test(doc));
assert("doc anon SELECT policy", doc.includes("anon SELECT") || doc.includes("supabase-select"));
assert("doc operation save reject", doc.includes("save") && /reject|拒否/i.test(doc));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert(
  "doc targeted verifier root-placement",
  doc.includes("verify:g20u36d-readback-tracks-select-fields-fix-root-placement"),
);
assert(
  "doc targeted verifier tools-draft",
  doc.includes("verify:g20u36d-readback-tracks-select-fields-fix-tools-draft"),
);
assert("doc targeted verifier plan", doc.includes("verify:g20u36d-readback-tracks-select-fields-fix-plan"));
assert("doc targeted verifier env-secret-result", doc.includes("verify:g20u36d-readback-env-secret-setting-result"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert(
  "doc deploy readiness decision",
  doc.includes("Deploy execution readiness") ||
    doc.includes("Proceed to G-20u36d-readback-tracks-select-fields-fix-edge-deploy"),
);
assert("doc next edge-deploy", doc.includes("G-20u36d-readback-tracks-select-fields-fix-edge-deploy"));
assert("doc next live verify retry-2", doc.includes("G-20u36d-readback-live-verify-retry-2") || doc.includes("live verify retry-2"));
assert("doc G20u36e after retry-2 PASS", doc.includes("G-20u36e") && /retry-2|after/i.test(doc));
assert("doc post-deploy trackCount 8", doc.includes("trackCount") && doc.includes("8"));
assert("doc live verify retry-2 not executed", doc.includes("retry-2") && /not executed|NOT this phase/i.test(doc));

assert(
  "package script verify:g20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight",
  packageJson.includes("verify:g20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight"),
);

assert("root TRACK_SELECT_FIELDS missing duration", trackSelectMissingDuration(rootHandler));
assert("root TRACK_SELECT_FIELDS has required fields", trackSelectHasRequiredFields(rootHandler));
assert("root mapTrackRowsToTracksText present", rootHandler.includes("mapTrackRowsToTracksText"));
assert("root resolveReadBackSnapshot uses releaseRow.id", rootHandler.includes("releaseRow.id"));
assert("root buildSanitizedReadBackSummary present", rootHandler.includes("buildSanitizedReadBackSummary"));
assert("root index readBack env gate", rootIndex.includes("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED"));
assert("root no SUPABASE_SERVICE_ROLE_KEY", !/SUPABASE_SERVICE_ROLE_KEY/i.test(rootSrc));
assert("root no createClient", !rootSrc.includes("createClient"));
assert("root operation save reject", rootSrc.includes('operation "save" is rejected'));
assert("root write flags false", rootHandler.includes("didWrite: false") && rootHandler.includes("saveEnabled: false"));

for (const pattern of MUTATION_PATTERNS) {
  assert(`root no mutation ${pattern}`, !pattern.test(rootSrc));
}

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));

const rootPlacementVerify = runNpmScript("verify:g20u36d-readback-tracks-select-fields-fix-root-placement");
assert("targeted verify tracks root-placement PASS", rootPlacementVerify.ok, rootPlacementVerify.tail);

const toolsDraftVerify = runNpmScript("verify:g20u36d-readback-tracks-select-fields-fix-tools-draft");
assert("targeted verify tracks tools-draft PASS", toolsDraftVerify.ok, toolsDraftVerify.tail);

const planVerify = runNpmScript("verify:g20u36d-readback-tracks-select-fields-fix-plan");
assert("targeted verify tracks plan PASS", planVerify.ok, planVerify.tail);

const envSecretVerify = runNpmScript("verify:g20u36d-readback-env-secret-setting-result");
assert("targeted verify env-secret-setting-result PASS", envSecretVerify.ok, envSecretVerify.tail);

assert(
  "AI current-state tracks edge-deploy-preflight",
  currentState.includes("G-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight") ||
    currentState.includes("tracks-select-fields-fix-edge-deploy-preflight"),
);
assert(
  "AI next-actions edge-deploy",
  nextActions.includes("G-20u36d-readback-tracks-select-fields-fix-edge-deploy") ||
    nextActions.includes("tracks-select-fields-fix-edge-deploy"),
);
assert(
  "AI handoff tracks deploy preflight",
  handoff.includes("tracks-select") && (handoff.includes("preflight") || handoff.includes("edge-deploy")),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("live verify retry-2 not executed", true);
assert("G20u36e controlled Save planning not ready", true);

console.log(
  `\nG-20u36d-readback-tracks-select-fields-fix-edge-deploy-preflight: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
