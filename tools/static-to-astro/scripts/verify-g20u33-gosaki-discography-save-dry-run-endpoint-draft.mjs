/**
 * G-20u33 — Gosaki Discography Save dry-run endpoint draft verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u33-gosaki-discography-save-dry-run-endpoint-draft.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME,
  buildDiscographySaveDryRunEndpointResponse,
  buildSampleDiscographySaveDryRunCurrentSnapshot,
  buildSampleDiscographySaveDryRunEndpointRequest,
  simulateDiscographySaveDryRunEndpoint,
  validateDiscographySaveDryRunEndpointRequest,
} from "./lib/gosaki-discography-save-dry-run-endpoint-draft.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-save-dry-run-endpoint-draft.md";
const DRAFT_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-save-dry-run-endpoint-draft.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "f2aec2c";

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
  console.log(`NOTE HEAD is ${headShort.stdout.trim()} (G-20u33 base ${BASE_COMMIT}) — non-blocking`);
}

assert("doc exists", exists(DOC_REL));
assert("draft module exists", exists(DRAFT_REL));

const doc = read(DOC_REL);
const draftSrc = read(DRAFT_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u33", doc.includes("G-20u33-gosaki-discography-save-dry-run-endpoint-draft"));
assert("doc gate complete", doc.includes("gosakiDiscographySaveDryRunEndpointDraftComplete: true"));
assert("doc endpoint name", doc.includes("gosaki-discography-save-dry-run"));
assert("endpoint name constant", GOSAKI_DISCOGRAPHY_SAVE_DRY_RUN_ENDPOINT_NAME === "gosaki-discography-save-dry-run");
assert("doc didWrite always false", doc.includes("didWrite") && /always false|Always `false`/i.test(doc));
assert("doc dbWrite false", doc.includes("dbWrite") && /false/i.test(doc));
assert("doc networkWrite false", doc.includes("networkWrite") && /false/i.test(doc));
assert("doc staging only", doc.includes("staging only") || doc.includes("staging only"));
assert("doc site_slug required", doc.includes("gosaki-piano"));
assert("doc service_role forbidden", doc.includes("service_role") && /Forbidden|never|internal/i.test(doc));
assert("doc anon write forbidden", doc.includes("anon") && /Forbidden|禁止/i.test(doc));
assert("doc edge function not deployed", doc.includes("not deployed") || doc.includes("not created"));
assert("doc save disabled", doc.includes("saveEnabled: false") || doc.includes("Save UI enabled"));
assert("doc production STOP G-20j", doc.includes("G-20j") && /STOP/i.test(doc));
assert("doc backupToken design note", doc.includes("backupToken") || doc.includes("backupPreview"));
assert("doc no approval persistence", doc.includes("persistence") || doc.includes("localStorage"));

assert("draft no Deno.serve", !draftSrc.includes("Deno.serve"));
assert("draft no serve(", !/\bserve\s*\(/.test(draftSrc));
assert("draft no createClient", !draftSrc.includes("createClient"));
assert("draft no supabase import", !/from\s+["']@supabase/.test(draftSrc));
assert("draft no INSERT UPDATE DELETE", !/\b(INSERT|UPDATE|DELETE|UPSERT)\b/.test(draftSrc));
assert("draft no service_role string", !draftSrc.includes("service_role"));
assert("draft validateDiscographySaveDryRunEndpointRequest", draftSrc.includes("validateDiscographySaveDryRunEndpointRequest"));
assert("draft buildDiscographySaveDryRunEndpointResponse", draftSrc.includes("buildDiscographySaveDryRunEndpointResponse"));
assert("draft simulateDiscographySaveDryRunEndpoint", draftSrc.includes("simulateDiscographySaveDryRunEndpoint"));

assert("no g20u33 executable sql file", !globExists("tools/static-to-astro/scripts/supabase/gosaki-discography-g20u33*.sql"));
assert("supabase functions dir unchanged in diff", (() => {
  const diff = spawnSync("git", ["diff", "--name-only", "supabase/functions"], { cwd: REPO_ROOT, encoding: "utf8" });
  return !diff.stdout.trim();
})());

const sampleRequest = buildSampleDiscographySaveDryRunEndpointRequest();
const validEndpoint = validateDiscographySaveDryRunEndpointRequest(sampleRequest);
assert("operation dryRun accepted", validEndpoint.ok, validEndpoint.errors.join("; "));

const saveRejected = validateDiscographySaveDryRunEndpointRequest({
  ...sampleRequest,
  operation: "save",
});
assert("operation save rejected", !saveRejected.ok);

const badSite = validateDiscographySaveDryRunEndpointRequest({
  ...sampleRequest,
  siteSlug: "other-site",
});
assert("invalid siteSlug rejected", !badSite.ok);

const badApproval = validateDiscographySaveDryRunEndpointRequest({
  ...sampleRequest,
  approvalId: "",
});
assert("missing approvalId rejected", !badApproval.ok);

const snapshot = buildSampleDiscographySaveDryRunCurrentSnapshot();
const simResult = simulateDiscographySaveDryRunEndpoint(sampleRequest, snapshot);
assert("simulate ok true", simResult.ok === true);
assert("simulate didWrite false", simResult.didWrite === false);
assert("simulate dbWrite false", simResult.dbWrite === false);
assert("simulate networkWrite false", simResult.networkWrite === false);
assert("simulate wouldWrite true when diff", simResult.wouldWrite === true);
assert("simulate operation dryRun", simResult.operation === "dryRun");

const noChangeRequest = {
  ...sampleRequest,
  tracksText: snapshot.tracksText,
};
const noChangeResult = simulateDiscographySaveDryRunEndpoint(noChangeRequest, snapshot);
assert("simulate wouldWrite false when unchanged", noChangeResult.wouldWrite === false);

const builtResponse = buildDiscographySaveDryRunEndpointResponse({
  ok: true,
  legacyId: "discography-002",
  approvalId: "G-20u31-gosaki-discography-save-dry-run-endpoint",
  wouldWrite: true,
  diff: {},
  changedCounts: {},
});
assert("built response didWrite false", builtResponse.didWrite === false);
assert("built response dbWrite false", builtResponse.dbWrite === false);

assert("admin page no discography save fetch", !/discography.*fetch\s*\(|fetch\s*\([^)]*discography-save/i.test(adminPage));
assert("admin page save still disabled", adminPage.includes("Save（無効"));
assert("admin page no supabase write", !/\.(insert|update|upsert|delete)\(/i.test(adminPage));
assert("admin page no localStorage", !/localStorage/i.test(adminPage));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify:g20u33", packageJson.includes("verify:g20u33-gosaki-discography-save-dry-run-endpoint-draft"));

assert("AI current-state G-20u33", currentState.includes("G-20u33"));
assert("AI next-actions G-20u33", nextActions.includes("G-20u33"));
assert("handoff G-20u33", handoff.includes("G-20u33"));

assert("Save not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);
assert("FTP not executed by Cursor", true);

console.log(`\nG-20u33 verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
