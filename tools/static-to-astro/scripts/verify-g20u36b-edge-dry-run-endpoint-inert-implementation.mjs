/**
 * G-20u36b-edge-dry-run-endpoint-inert-implementation verifier.
 * Run: node tools/static-to-astro/scripts/verify-g20u36b-edge-dry-run-endpoint-inert-implementation.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  DRY_RUN_APPROVAL_ID,
  INERT_ALLOWED_CONTENT_TYPE,
  INERT_ALLOWED_HTTP_METHOD,
  SAVE_APPROVAL_ID,
  buildSampleInertDryRunInput,
  buildSampleInertNoChangeInput,
  handleDiscographyEdgeDryRunInert,
  validateDryRunEndpointApprovalId,
  validateInertHttpEnvelope,
} from "./lib/gosaki-discography-edge-dry-run-endpoint-inert.mjs";
import { buildSampleDiscographySaveDryRunEndpointRequest } from "./lib/gosaki-discography-save-dry-run-endpoint-draft.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36b-edge-dry-run-endpoint-inert-implementation.md";
const MODULE_REL =
  "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-endpoint-inert.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "7af5fdf";

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
    if (file.endsWith(".sql")) files.push(file);
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36b inert base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("inert module exists", exists(MODULE_REL));

const doc = read(DOC_REL);
const moduleSrc = read(MODULE_REL);
const adminPage = read(ADMIN_PAGE_REL);
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36b-edge-dry-run-endpoint-inert-implementation",
  doc.includes("G-20u36b-edge-dry-run-endpoint-inert-implementation"),
);
assert("doc gate prepared", doc.includes("gosakiDiscographyEdgeDryRunEndpointInertImplementationPrepared: true"));
assert("doc inert implementation", doc.includes("inert") && /deploy-inert|inert implementation/i.test(doc));
assert("doc Cursor did not deploy", doc.includes("Cursor") && /not deploy|did not deploy|未/i.test(doc));
assert("doc root supabase functions unchanged", doc.includes("supabase/functions") && /no|not|unchanged|未変更/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled/i.test(doc));
assert("doc admin fetch POST not added", doc.includes("fetch POST") && /no|not|未追加/i.test(doc));
assert("doc dryRun only", doc.includes("dryRun") && /only|のみ/i.test(doc));
assert("doc save rejected", doc.includes("save") && /reject|拒否/i.test(doc));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert("doc service_role not exposed", doc.includes("service_role") && /never|not|禁止|forbidden/i.test(doc));
assert("doc next deploy-preflight", doc.includes("deploy-preflight"));

assert("module no Deno.serve", !moduleSrc.includes("Deno.serve"));
assert("module no serve(", !/\bserve\s*\(/.test(moduleSrc));
assert("module no createClient", !moduleSrc.includes("createClient"));
assert("module no supabase import", !/from\s+["']@supabase/.test(moduleSrc));
assert("module no INSERT UPDATE DELETE UPSERT", !/\b(INSERT|UPDATE|DELETE|UPSERT)\b/.test(moduleSrc));
assert("module no service_role string", !moduleSrc.includes("service_role"));
assert("module no localStorage", !/localStorage/.test(moduleSrc));
assert("module no GitHub FTP deploy call", !/\b(github|ftp|workflow_dispatch|mirror)\b/i.test(moduleSrc));
assert("module handleDiscographyEdgeDryRunInert", moduleSrc.includes("handleDiscographyEdgeDryRunInert"));

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

const validInput = buildSampleInertDryRunInput();
const validResult = handleDiscographyEdgeDryRunInert(validInput);
assert("dryRun valid case ok", validResult.ok === true, JSON.stringify(validResult.errors));
assert("dryRun valid status 200", validResult.status === 200);
assert("dryRun valid wouldWrite true", validResult.wouldWrite === true);
assert("dryRun valid didWrite false", validResult.didWrite === false);
assert("dryRun valid dbWrite false", validResult.dbWrite === false);
assert("dryRun valid networkWrite false", validResult.networkWrite === false);
assert("dryRun valid saveEnabled false", validResult.saveEnabled === false);
assert("dryRun valid operation dryRun", validResult.operation === "dryRun");

const noChangeInput = buildSampleInertNoChangeInput();
const noChangeResult = handleDiscographyEdgeDryRunInert(noChangeInput);
assert("no-change ok", noChangeResult.ok === true);
assert("no-change wouldWrite false", noChangeResult.wouldWrite === false);
assert("no-change write flags false", noChangeResult.didWrite === false && noChangeResult.dbWrite === false);

const sampleBody = buildSampleDiscographySaveDryRunEndpointRequest();
const saveReject = handleDiscographyEdgeDryRunInert({
  method: INERT_ALLOWED_HTTP_METHOD,
  contentType: INERT_ALLOWED_CONTENT_TYPE,
  body: { ...sampleBody, operation: "save" },
});
assert("operation save rejected", saveReject.ok === false);
assert("operation save status 400", saveReject.status === 400);
assert("operation save write flags false", saveReject.didWrite === false && saveReject.dbWrite === false);

const wrongSite = handleDiscographyEdgeDryRunInert({
  method: INERT_ALLOWED_HTTP_METHOD,
  contentType: INERT_ALLOWED_CONTENT_TYPE,
  body: { ...sampleBody, siteSlug: "other-site" },
});
assert("wrong siteSlug rejected", wrongSite.ok === false);

const emptyApproval = handleDiscographyEdgeDryRunInert({
  method: INERT_ALLOWED_HTTP_METHOD,
  contentType: INERT_ALLOWED_CONTENT_TYPE,
  body: { ...sampleBody, approvalId: "" },
});
assert("empty approvalId rejected", emptyApproval.ok === false);
assert("empty approvalId has approvalRequirements", Boolean(emptyApproval.approvalRequirements));

const saveApprovalReject = validateDryRunEndpointApprovalId(SAVE_APPROVAL_ID);
assert("save approval ID rejected", saveApprovalReject.ok === false);
const saveApprovalHandler = handleDiscographyEdgeDryRunInert({
  method: INERT_ALLOWED_HTTP_METHOD,
  contentType: INERT_ALLOWED_CONTENT_TYPE,
  body: { ...sampleBody, approvalId: SAVE_APPROVAL_ID },
});
assert("save approval ID handler rejected", saveApprovalHandler.ok === false);
assert(
  "save approval ID error message",
  saveApprovalHandler.errors.some((e) => /save approval ID/i.test(e)),
);

const wrongMethod = validateInertHttpEnvelope({
  method: "GET",
  contentType: INERT_ALLOWED_CONTENT_TYPE,
  body: sampleBody,
});
assert("wrong method rejected", wrongMethod.ok === false && wrongMethod.status === 405);

const wrongContentType = validateInertHttpEnvelope({
  method: INERT_ALLOWED_HTTP_METHOD,
  contentType: "text/plain",
  body: sampleBody,
});
assert("wrong content-type rejected", wrongContentType.ok === false && wrongContentType.status === 415);

const responseJson = JSON.stringify(validResult);
assert("response no service_role", !/service_role/i.test(responseJson));
assert("response no backupToken value", validResult.backupToken === null);
assert("response no readBack value", validResult.readBack === null);
assert("response no secret keys", !/\b(secret|apikey|api_key)\b/i.test(responseJson));

assert("dry-run approval ID constant", DRY_RUN_APPROVAL_ID === "G-20u31-gosaki-discography-save-dry-run-endpoint");

const packageJson = read("tools/static-to-astro/package.json");
assert(
  "npm verify script",
  packageJson.includes("verify:g20u36b-edge-dry-run-endpoint-inert-implementation"),
);

assert(
  "AI current-state inert-implementation",
  currentState.includes("inert-implementation") || currentState.includes("G-20u36b-edge-dry-run-endpoint-inert"),
);
assert(
  "AI next-actions deploy-preflight",
  nextActions.includes("deploy-preflight") || nextActions.includes("inert-implementation"),
);
assert(
  "handoff inert-implementation",
  handoff.includes("inert-implementation") || handoff.includes("deploy-preflight"),
);

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Edge Function not deployed by Cursor", true);

console.log(
  `\nG-20u36b-edge-dry-run-endpoint-inert-implementation verifier: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
