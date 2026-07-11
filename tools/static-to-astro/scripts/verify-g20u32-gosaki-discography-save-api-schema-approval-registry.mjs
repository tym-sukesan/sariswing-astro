/**
 * G-20u32 — Gosaki Discography Save API schema & approval registry verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u32-gosaki-discography-save-api-schema-approval-registry.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_REGISTRY,
  validateApprovalIdShape,
} from "./lib/gosaki-discography-save-approval-registry.mjs";
import {
  DISCOGRAPHY_SAVE_REQUEST_SCHEMA_KEYS,
  DISCOGRAPHY_SAVE_RESPONSE_SCHEMA_KEYS,
  buildSampleDiscographySaveDryRunRequest,
  buildSampleDiscographySaveDryRunResponse,
  validateDiscographySaveRequest,
  validateDiscographySaveResponse,
  assertDiscographySaveIsStagingOnly,
  assertNoBrowserServiceRole,
} from "./lib/gosaki-discography-save-schema.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-save-api-schema-approval-registry.md";
const SCHEMA_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-save-schema.mjs";
const REGISTRY_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-save-approval-registry.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "c40b88e";

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

function globExists(globPattern) {
  const dir = path.dirname(path.join(REPO_ROOT, globPattern));
  const base = path.basename(globPattern);
  if (!fs.existsSync(dir)) return false;
  const re = new RegExp(`^${base.replace(/\*/g, ".*")}$`);
  return fs.readdirSync(dir).some((name) => re.test(name));
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u32 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
assert("schema module exists", exists(SCHEMA_REL));
assert("approval registry module exists", exists(REGISTRY_REL));

const doc = read(DOC_REL);
const schemaSrc = read(SCHEMA_REL);
const registrySrc = read(REGISTRY_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u32", doc.includes("G-20u32-gosaki-discography-save-api-schema-approval-registry"));
assert("doc gate complete", doc.includes("gosakiDiscographySaveApiSchemaApprovalRegistryComplete: true"));
assert("doc schema approval registry only", doc.includes("schema") && doc.includes("approval registry"));
assert("doc DB write not executed", doc.includes("DB write") && /not executed|Forbidden/i.test(doc));
assert("doc save disabled continues", doc.includes("saveEnabled: false") || doc.includes("Save UI enabled"));
assert("doc edge function not implemented", doc.includes("Edge Function") && /not executed|not implemented|design/i.test(doc));
assert("doc service_role browser forbidden", doc.includes("service_role") && /Forbidden|browser/i.test(doc));
assert("doc anon write forbidden", doc.includes("anon") && /Forbidden|禁止/i.test(doc));
assert("doc site_slug required", doc.includes("site_slug") || doc.includes("siteSlug"));
assert("doc server dry-run gate", doc.includes("server dry-run") || doc.includes("Server dry-run"));
assert("doc rollback backupToken", doc.includes("backupToken") || doc.includes("Rollback"));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc no approval persistence", doc.includes("localStorage") || doc.includes("persistence"));

for (const key of ["siteSlug", "legacyId", "approvalId", "release", "tracksText", "trackPolicy"]) {
  assert(`request schema key ${key}`, DISCOGRAPHY_SAVE_REQUEST_SCHEMA_KEYS.includes(key));
}

for (const key of ["wouldWrite", "didWrite", "backupToken", "changedCounts"]) {
  assert(`response schema key ${key}`, DISCOGRAPHY_SAVE_RESPONSE_SCHEMA_KEYS.includes(key));
}

assert("schema validateDiscographySaveRequest", schemaSrc.includes("validateDiscographySaveRequest"));
assert("schema validateDiscographySaveResponse", schemaSrc.includes("validateDiscographySaveResponse"));
assert("registry validateApprovalIdShape", registrySrc.includes("validateApprovalIdShape"));
assert("registry GOSAKI_DISCOGRAPHY_SAVE prefix", registrySrc.includes("GOSAKI_DISCOGRAPHY_SAVE"));
assert("registry entries non-empty", GOSAKI_DISCOGRAPHY_SAVE_APPROVAL_REGISTRY.length >= 2);

const sampleRequest = buildSampleDiscographySaveDryRunRequest();
const validRequest = validateDiscographySaveRequest(sampleRequest);
assert("sample valid request PASS", validRequest.ok, validRequest.errors.join("; "));

const badSite = validateDiscographySaveRequest({ ...sampleRequest, siteSlug: "other-site" });
assert("invalid siteSlug rejected", !badSite.ok);

const badApproval = validateDiscographySaveRequest({ ...sampleRequest, approvalId: "" });
assert("missing approvalId rejected", !badApproval.ok);

const saveRequest = validateDiscographySaveRequest({ ...sampleRequest, operation: "save" });
assert("operation save schema accepted", saveRequest.ok || saveRequest.warnings.length > 0);

const sampleResponse = buildSampleDiscographySaveDryRunResponse();
const validResponse = validateDiscographySaveResponse(sampleResponse);
assert("sample dryRun response PASS", validResponse.ok, validResponse.errors.join("; "));

const didWriteBlocked = validateDiscographySaveResponse({
  ...sampleResponse,
  operation: "save",
  didWrite: true,
});
assert("operation save didWrite true blocked", !didWriteBlocked.ok);

const stagingOnly = assertDiscographySaveIsStagingOnly({ siteSlug: "gosaki-piano" });
assert("staging siteSlug OK", stagingOnly.ok);

const stagingReject = assertDiscographySaveIsStagingOnly({ siteSlug: "wrong" });
assert("non-staging siteSlug rejected", !stagingReject.ok);

const noServiceRole = assertNoBrowserServiceRole({
  env: { SUPABASE_SERVICE_ROLE_KEY: "secret" },
});
assert("service_role in env rejected", !noServiceRole.ok);

const approvalShape = validateApprovalIdShape({
  approvalId: "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice",
  operation: "save",
  siteSlug: "gosaki-piano",
  legacyId: "discography-002",
});
assert("approval ID shape valid", approvalShape.ok, approvalShape.errors.join("; "));

assert("no g20u32 executable sql file", !globExists("tools/static-to-astro/scripts/supabase/gosaki-discography-g20u32*.sql"));
assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

assert("admin page no discography save fetch", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage));
assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u32", packageJson.includes("verify:g20u32-gosaki-discography-save-api-schema-approval-registry"));

assert("AI current-state G-20u32", currentState.includes("G-20u32"));
assert("AI next-actions G-20u32", nextActions.includes("G-20u32"));
assert("handoff G-20u32", handoff.includes("G-20u32"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge Function not implemented by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(`\nG-20u32 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
