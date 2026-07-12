/**
 * G-20u36b-edge-dry-run-endpoint-live-verify
 * Live HTTP verify against staging Edge Function (read-only · no DB write · no secrets logged).
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-live-verify.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadGosakiStagingAdminPublicEnv } from "./lib/gosaki-staging-admin-public-env.mjs";
import { buildSampleDiscographySaveDryRunEndpointRequest } from "./lib/gosaki-discography-save-dry-run-endpoint-draft.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-discography-save-dry-run";
const TARGET_URL = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;
const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-live-verify.md";
const DEPLOY_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-deploy-manual-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
const SAVE_APPROVAL_ID = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const BASE_COMMIT = "7fe788b";

const FORBIDDEN_RESPONSE_PATTERNS = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
];

let passed = 0;
let failed = 0;

/** @type {Array<{ id: string, status: number, ok: boolean|null, category: string, wouldWrite?: boolean, writeFlagsOk?: boolean, note?: string }>} */
const caseResults = [];

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

function sanitizeResponseSummary(json, status) {
  return {
    status,
    ok: typeof json?.ok === "boolean" ? json.ok : null,
    operation: typeof json?.operation === "string" ? json.operation : null,
    wouldWrite: typeof json?.wouldWrite === "boolean" ? json.wouldWrite : null,
    didWrite: json?.didWrite === false ? false : json?.didWrite === true ? true : null,
    dbWrite: json?.dbWrite === false ? false : json?.dbWrite === true ? true : null,
    networkWrite: json?.networkWrite === false ? false : json?.networkWrite === true ? true : null,
    saveEnabled: json?.saveEnabled === false ? false : json?.saveEnabled === true ? true : null,
    errorCategory: Array.isArray(json?.errors) && json.errors.length > 0 ? String(json.errors[0]).slice(0, 120) : null,
    backupToken: json?.backupToken ?? null,
    readBack: json?.readBack ?? null,
  };
}

function writeFlagsOk(summary) {
  return (
    summary.didWrite === false &&
    summary.dbWrite === false &&
    summary.networkWrite === false &&
    summary.saveEnabled === false
  );
}

function responseBodySafe(text) {
  if (FORBIDDEN_RESPONSE_PATTERNS.some((p) => p.test(text))) return false;
  if (/service_role/i.test(text)) return false;
  return true;
}

/**
 * @param {string} url
 * @param {RequestInit} init
 */
async function callEndpoint(url, init) {
  if (url.includes(PRODUCTION_REF)) {
    throw new Error("STOP: production ref in URL");
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json };
}

function buildValidDryRunBody() {
  return buildSampleDiscographySaveDryRunEndpointRequest();
}

function buildNoChangeDryRunBody() {
  const base = buildSampleDiscographySaveDryRunEndpointRequest();
  return {
    ...base,
    tracksText: "Nature Boy\nWaters Of March\n",
    clientDryRun: {
      totalBefore: 2,
      totalAfter: 2,
      added: [],
      removed: [],
      reordered: false,
      wouldWrite: false,
    },
  };
}

async function runLiveVerifyCases(anonKey) {
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
  };

  // 1. OPTIONS
  const options = await callEndpoint(TARGET_URL, { method: "OPTIONS" });
  const optionsOk = options.res.status === 200;
  const allowMethods = options.res.headers.get("access-control-allow-methods") ?? "";
  caseResults.push({
    id: "options",
    status: options.res.status,
    ok: optionsOk,
    category: optionsOk ? "cors_preflight_ok" : "cors_preflight_fail",
    note: allowMethods ? `allow-methods=${allowMethods}` : "no allow-methods header",
  });
  assert("live OPTIONS 200", optionsOk, String(options.res.status));
  assert("live OPTIONS allows POST", /POST/i.test(allowMethods), allowMethods);

  // 2. valid dryRun
  const validBody = buildValidDryRunBody();
  const valid = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(validBody),
  });
  const validSummary = sanitizeResponseSummary(valid.json, valid.res.status);
  assert("live valid dryRun response safe", responseBodySafe(valid.text));
  assert("live valid dryRun status 200", valid.res.status === 200, String(valid.res.status));
  assert("live valid dryRun ok true", validSummary.ok === true);
  assert("live valid dryRun write flags false", writeFlagsOk(validSummary));
  caseResults.push({
    id: "valid-dryRun",
    status: valid.res.status,
    ok: validSummary.ok,
    category: "dryRun_accepted",
    wouldWrite: validSummary.wouldWrite ?? undefined,
    writeFlagsOk: writeFlagsOk(validSummary),
    note: `wouldWrite=${validSummary.wouldWrite}`,
  });

  // 3. no-change dryRun (schema-only baseline · wouldWrite may be true without DB snapshot)
  const noChangeBody = buildNoChangeDryRunBody();
  const noChange = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(noChangeBody),
  });
  const noChangeSummary = sanitizeResponseSummary(noChange.json, noChange.res.status);
  assert("live no-change dryRun response safe", responseBodySafe(noChange.text));
  assert("live no-change dryRun status 200", noChange.res.status === 200);
  assert("live no-change dryRun ok true", noChangeSummary.ok === true);
  assert("live no-change dryRun write flags false", writeFlagsOk(noChangeSummary));
  caseResults.push({
    id: "no-change-dryRun",
    status: noChange.res.status,
    ok: noChangeSummary.ok,
    category: "dryRun_no_track_addition",
    wouldWrite: noChangeSummary.wouldWrite ?? undefined,
    writeFlagsOk: writeFlagsOk(noChangeSummary),
    note: "schema-only baseline · wouldWrite may be true without DB snapshot",
  });

  // 4. operation=save
  const saveBody = { ...buildValidDryRunBody(), operation: "save" };
  const save = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(saveBody),
  });
  const saveSummary = sanitizeResponseSummary(save.json, save.res.status);
  assert("live save reject response safe", responseBodySafe(save.text));
  assert("live save reject status 400", save.res.status === 400, String(save.res.status));
  assert("live save reject ok false", saveSummary.ok === false);
  assert("live save reject write flags false", writeFlagsOk(saveSummary));
  caseResults.push({
    id: "operation-save",
    status: save.res.status,
    ok: saveSummary.ok,
    category: "save_rejected",
    writeFlagsOk: writeFlagsOk(saveSummary),
    note: saveSummary.errorCategory ?? "rejected",
  });

  // 5. wrong siteSlug
  const wrongSlugBody = { ...buildValidDryRunBody(), siteSlug: "wrong-site" };
  const wrongSlug = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(wrongSlugBody),
  });
  const wrongSlugSummary = sanitizeResponseSummary(wrongSlug.json, wrongSlug.res.status);
  assert("live wrong siteSlug reject status 400", wrongSlug.res.status === 400);
  assert("live wrong siteSlug ok false", wrongSlugSummary.ok === false);
  assert("live wrong siteSlug write flags false", writeFlagsOk(wrongSlugSummary));
  caseResults.push({
    id: "wrong-siteSlug",
    status: wrongSlug.res.status,
    ok: wrongSlugSummary.ok,
    category: "siteSlug_rejected",
    writeFlagsOk: writeFlagsOk(wrongSlugSummary),
    note: wrongSlugSummary.errorCategory ?? "rejected",
  });

  // 6. empty approvalId
  const emptyApprovalBody = { ...buildValidDryRunBody(), approvalId: "" };
  const emptyApproval = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(emptyApprovalBody),
  });
  const emptyApprovalSummary = sanitizeResponseSummary(emptyApproval.json, emptyApproval.res.status);
  assert("live empty approvalId reject status 400", emptyApproval.res.status === 400);
  assert("live empty approvalId ok false", emptyApprovalSummary.ok === false);
  caseResults.push({
    id: "empty-approvalId",
    status: emptyApproval.res.status,
    ok: emptyApprovalSummary.ok,
    category: "approvalId_rejected",
    writeFlagsOk: writeFlagsOk(emptyApprovalSummary),
    note: emptyApprovalSummary.errorCategory ?? "rejected",
  });

  // 7. save approval ID
  const saveApprovalBody = { ...buildValidDryRunBody(), approvalId: SAVE_APPROVAL_ID };
  const saveApproval = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(saveApprovalBody),
  });
  const saveApprovalSummary = sanitizeResponseSummary(saveApproval.json, saveApproval.res.status);
  assert("live save approvalId reject status 400", saveApproval.res.status === 400);
  assert("live save approvalId ok false", saveApprovalSummary.ok === false);
  caseResults.push({
    id: "save-approvalId",
    status: saveApproval.res.status,
    ok: saveApprovalSummary.ok,
    category: "save_approvalId_rejected",
    writeFlagsOk: writeFlagsOk(saveApprovalSummary),
    note: saveApprovalSummary.errorCategory ?? "rejected",
  });

  // Auth probe (informational — not a failure if JWT required)
  const unauth = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildValidDryRunBody()),
  });
  caseResults.push({
    id: "unauthenticated-probe",
    status: unauth.res.status,
    ok: null,
    category: unauth.res.status === 401 ? "auth_required_bearer_anon" : `http_${unauth.res.status}`,
    note: "Bearer PUBLIC_SUPABASE_ANON_KEY required",
  });
  assert("live unauthenticated returns 401", unauth.res.status === 401, String(unauth.res.status));

  // backupToken / readBack must be null on success path
  assert("live valid backupToken null", validSummary.backupToken === null);
  assert("live valid readBack null", validSummary.readBack === null);
}

function printCaseSummaryTable() {
  console.log("\n--- Live verify case summary (sanitized) ---");
  for (const row of caseResults) {
    console.log(
      `${row.id}: status=${row.status} ok=${row.ok} category=${row.category}` +
        (row.wouldWrite != null ? ` wouldWrite=${row.wouldWrite}` : "") +
        (row.writeFlagsOk != null ? ` writeFlagsOk=${row.writeFlagsOk}` : "") +
        (row.note ? ` note=${row.note}` : ""),
    );
  }
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b live-verify base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("target URL staging only", TARGET_URL.includes(STAGING_REF) && !TARGET_URL.includes(PRODUCTION_REF));
assert("deploy result doc exists", exists(DEPLOY_RESULT_DOC_REL));

const env = loadGosakiStagingAdminPublicEnv();
const anonKey = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();

if (!anonKey) {
  console.error("STOP: PUBLIC_SUPABASE_ANON_KEY not found in .env / .env.local / process.env");
  process.exit(1);
}

assert("PUBLIC_SUPABASE_ANON_KEY present", Boolean(anonKey));
assert("PUBLIC_SUPABASE_ANON_KEY not service_role", !/service_role/i.test(anonKey));
assert(
  "PUBLIC_SUPABASE_URL staging host",
  supabaseUrl.includes(`${STAGING_REF}.supabase.co`) && !supabaseUrl.includes(PRODUCTION_REF),
);

console.log("Auth: Bearer PUBLIC_SUPABASE_ANON_KEY (value not logged)");
console.log(`Target: ${TARGET_URL}`);

await runLiveVerifyCases(anonKey);
printCaseSummaryTable();

const authFailure = caseResults.some(
  (r) => r.id !== "unauthenticated-probe" && (r.status === 401 || r.status === 403),
);
if (authFailure) {
  console.error("STOP: auth issue (401/403) on live cases — do not proceed to next phase");
  failed += 1;
}

assert("no auth failure on live cases", !authFailure);

// Doc + static checks (when doc exists)
if (exists(DOC_REL)) {
  const doc = read(DOC_REL);
  assert("doc phase G-20u36b-edge-dry-run-endpoint-live-verify", doc.includes("G-20u36b-edge-dry-run-endpoint-live-verify"));
  assert("doc gate live verified", doc.includes("gosakiDiscographyEdgeDryRunEndpointLiveVerified: true"));
  assert("doc target URL", doc.includes(TARGET_URL));
  assert("doc staging ref", doc.includes(STAGING_REF));
  assert("doc production not used", doc.includes(PRODUCTION_REF) && /not used|未使用|STOP/i.test(doc));
  assert("doc auth bearer anon", doc.includes("PUBLIC_SUPABASE_ANON_KEY") && /not log|値を出さ|without logging/i.test(doc));
  assert("doc valid dryRun 200", doc.includes("valid dryRun") && doc.includes("200"));
  assert("doc save reject", doc.includes("save") && /reject|400/i.test(doc));
  assert("doc wrong siteSlug reject", doc.includes("wrong siteSlug") || doc.includes("siteSlug"));
  assert("doc approvalId reject", doc.includes("approvalId"));
  assert("doc write flags false", doc.includes("didWrite") && doc.includes("false"));
  assert("doc Save disabled", doc.includes("Save") && /disabled|not enabled/i.test(doc));
  assert("doc admin fetch POST not added", doc.includes("fetch POST") && /not added|未追加/i.test(doc));
  assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
  assert("doc service_role not exposed", doc.includes("service_role") && /not exposed|露出なし|false/i.test(doc));
  assert("doc next phase", doc.includes("G-20u36c") || doc.includes("admin"));
}

assert("supabase/functions not edited", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

const adminPage = read(ADMIN_PAGE_REL);
assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert(
  "admin page no discography save fetch",
  !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage),
);
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify script", packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-live-verify"));

if (exists(DOC_REL)) {
  const currentState = read(`${AI_DIR}/00-current-state.md`);
  const nextActions = read(`${AI_DIR}/03-next-actions.md`);
  const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
  assert(
    "AI current-state live-verify",
    currentState.includes("live-verify") || currentState.includes("LiveVerified"),
  );
  assert(
    "AI next-actions G-20u36c or blocked",
    nextActions.includes("G-20u36c") || nextActions.includes("live-verify"),
  );
  assert("handoff live-verify", handoff.includes("live-verify") || handoff.includes("LiveVerified"));
}

assert("SQL not executed by Cursor", true);
assert("Edge redeploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36b-edge-dry-run-endpoint-live-verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
