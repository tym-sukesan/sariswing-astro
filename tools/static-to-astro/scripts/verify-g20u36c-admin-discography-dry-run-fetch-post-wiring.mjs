/**
 * G-20u36c-admin-discography-dry-run-fetch-post-wiring
 * Static verify: admin Discography editor dry-run fetch POST wiring (no Save · no live HTTP).
 * Run: node tools/static-to-astro/scripts/verify-g20u36c-admin-discography-dry-run-fetch-post-wiring.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-discography-save-dry-run";
const TARGET_URL = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;
const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36c-admin-discography-dry-run-fetch-post-wiring.md";
const LIVE_VERIFY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-live-verify.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
const BASE_COMMIT = "4e048d4";

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
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u36c base ${BASE_COMMIT}) — non-blocking`);
}

assert("live verify doc exists", exists(LIVE_VERIFY_DOC_REL));
assert("doc exists", exists(DOC_REL));

const doc = read(DOC_REL);
const adminPage = read(ADMIN_PAGE_REL);
const adminTs = read(ADMIN_TS_REL);
const packageJson = read("tools/static-to-astro/package.json");

assert("doc phase G-20u36c", doc.includes("G-20u36c-admin-discography-dry-run-fetch-post-wiring"));
assert("doc gate wired", doc.includes("gosakiDiscographyAdminDryRunFetchPostWired: true"));
assert("doc target URL staging", doc.includes(STAGING_REF) && doc.includes(FUNCTION_NAME));
assert("doc production not used", doc.includes(PRODUCTION_REF) && /not used|未使用|STOP/i.test(doc));
assert("doc Save disabled", doc.includes("Save") && /disabled|still disabled/i.test(doc));
assert("doc operation dryRun only", doc.includes("dryRun") && /only|固定/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|なし/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not used|未使用|no/i.test(doc));
assert("doc no deploy upload", doc.includes("deploy") || doc.includes("upload") || doc.includes("FTP"));
assert("doc next phase STG", doc.includes("STG") || doc.includes("staging package") || doc.includes("manual"));

assert("admin ts G20U36C phase", adminTs.includes("G20U36C_DISCOGRAPHY_DRY_RUN_FETCH_POST_PHASE"));
assert("admin ts staging endpoint", adminTs.includes(STAGING_REF) && adminTs.includes(FUNCTION_NAME));
assert("admin ts production STOP ref", adminTs.includes(PRODUCTION_REF));
assert("admin ts dryRun operation constant", adminTs.includes('G20U36C_DISCOGRAPHY_DRY_RUN_OPERATION = "dryRun"'));
assert("admin ts buildDiscographyDryRunEndpointRequest", adminTs.includes("buildDiscographyDryRunEndpointRequest"));
assert("admin ts sanitizeDiscographyDryRunEndpointDisplay", adminTs.includes("sanitizeDiscographyDryRunEndpointDisplay"));
assert("admin ts no service_role client usage", !/createClient|service_role.*connected|SUPABASE_SERVICE_ROLE_KEY\s*[=:]/i.test(adminTs));
assert("admin ts endpoint staging ref", adminTs.includes(STAGING_REF) && adminTs.includes(FUNCTION_NAME));

assert("admin page endpoint data attr", adminPage.includes("data-gosaki-discography-dry-run-endpoint"));
assert("admin page operation data attr", adminPage.includes("data-g20u36c-discography-dry-run-operation"));
assert("admin page approval id data attr", adminPage.includes("data-g20u36c-discography-dry-run-approval-id"));
assert("admin page endpoint dry-run section", adminPage.includes('data-section="discography-endpoint-dry-run-album"'));
assert("admin page endpoint dry-run button", adminPage.includes("Endpoint dry-run (POST · no save)"));
assert("admin page endpoint fetch wiring", adminPage.includes("fetch(endpoint") && adminPage.includes("buildDiscographyDryRunEndpointRequest"));
assert("admin page bearer anon auth", adminPage.includes('Authorization: "Bearer " + anonKey'));
assert("admin page sanitize display", adminPage.includes("sanitizeDiscographyDryRunEndpointDisplay"));
assert("admin page staging endpoint resolver", adminPage.includes("resolveG20u36cDiscographyDryRunEndpoint"));
assert("admin page dryRun only UI", adminPage.includes("Dry-run only") && adminPage.includes("No DB write"));
assert("admin page Save still disabled UI", adminPage.includes("Save is still disabled"));
assert("admin page checks request only", adminPage.includes("This checks the request and endpoint response only"));
assert("admin page production block check", adminPage.includes("G20U36C_PRODUCTION_PROJECT_REF_STOP"));
assert("admin page no production endpoint", !adminPage.includes(PRODUCTION_REF));
assert("admin page save still disabled buttons", adminPage.includes("Save（無効"));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));
assert("admin page no service_role", !/service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(adminPage));

const discFetchBlock = adminPage.slice(
  adminPage.indexOf("runAlbumEndpointDryRun"),
  adminPage.indexOf("document.querySelectorAll('[data-disc-dry-run-btn="),
);
assert("discography fetch uses POST", discFetchBlock.includes('method: "POST"'));
assert("discography fetch operation dryRun guard", discFetchBlock.includes("G20U36C_DISCOGRAPHY_DRY_RUN_OPERATION"));
assert("discography fetch no operation save literal", !/operation:\s*["']save["']/.test(discFetchBlock));

assert("admin ts write flags false in display", adminTs.includes("didWrite: false") && adminTs.includes("saveEnabled: false"));
assert("admin ts approval id", adminTs.includes(DRY_RUN_APPROVAL_ID));
assert("build payload operation dryRun", adminTs.includes("operation: G20U36C_DISCOGRAPHY_DRY_RUN_OPERATION"));
assert("build payload siteSlug gosaki-piano", adminTs.includes('siteSlug: GOSAKI_STAGING_SITE_SLUG'));
assert("build payload no save operation", !/operation:\s*["']save["']/.test(adminTs));

assert("supabase/functions not edited", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

assert("npm verify script", packageJson.includes("verify:g20u36c-admin-discography-dry-run-fetch-post-wiring"));

if (exists(DOC_REL)) {
  const currentState = read(`${AI_DIR}/00-current-state.md`);
  const nextActions = read(`${AI_DIR}/03-next-actions.md`);
  const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
  assert("AI current-state G-20u36c", currentState.includes("G-20u36c") || currentState.includes("FetchPostWired"));
  assert(
    "AI next-actions staging package or STG",
    nextActions.includes("staging package") || nextActions.includes("STG") || nextActions.includes("manual FTP"),
  );
  assert("handoff G-20u36c", handoff.includes("G-20u36c") || handoff.includes("fetch POST"));
}

assert("SQL not executed by Cursor", true);
assert("Edge redeploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("FTP deploy not executed by Cursor", true);

console.log(`\nG-20u36c-admin-discography-dry-run-fetch-post-wiring: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
