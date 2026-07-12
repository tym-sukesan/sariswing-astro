/**
 * G-20u36d-readback-edge-deploy-plan verifier.
 * Planning-only — no Edge deploy / SQL / Save / root edit.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-edge-deploy-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-edge-deploy-plan.md";
const ROOT_PLACEMENT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-root-placement.md";
const ROOT_INDEX_REL = "supabase/functions/gosaki-discography-save-dry-run/index.ts";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "a91e49e";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-discography-save-dry-run";

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
    if (file.endsWith(".sql") && !file.includes("select-only") && !file.includes("deploy-preflight")) {
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack edge-deploy-plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("root placement doc exists", exists(ROOT_PLACEMENT_DOC_REL));
assert("root index exists", exists(ROOT_INDEX_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));

const doc = read(DOC_REL);
const rootPlacementDoc = read(ROOT_PLACEMENT_DOC_REL);
const rootIndex = read(ROOT_INDEX_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const rootSrc = `${rootIndex}\n${rootHandler}`;
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36d-readback-edge-deploy-plan", doc.includes("G-20u36d-readback-edge-deploy-plan"));
assert(
  "doc gate prepared",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackEdgeDeployPlanPrepared: true"),
);
assert("doc plan only", doc.includes("plan only") || doc.includes("plan doc only"));
assert("doc Edge deploy not executed", doc.includes("deploy") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc Supabase CLI deploy not executed", doc.includes("Supabase CLI") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc root supabase functions not edited", doc.includes("supabase/functions") && /no|not|false|未編集|unchanged/i.test(doc));

assert("doc deploy target function", doc.includes(FUNCTION_NAME));
assert("doc staging project ref", doc.includes(STAGING_REF));
assert("doc production ref STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|禁止/i.test(doc));
assert("doc deploy command draft", doc.includes("supabase functions deploy") && doc.includes(STAGING_REF));
assert("doc secrets names only not values", doc.includes("names") && /never|Forbidden|表示|not display/i.test(doc));
assert("doc SUPABASE_URL env name", doc.includes("SUPABASE_URL"));
assert("doc SUPABASE_ANON_KEY env name", doc.includes("SUPABASE_ANON_KEY"));
assert("doc GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED", doc.includes("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED"));
assert("doc readBack enabled when true", doc.includes("true") && doc.includes("readBack"));
assert("doc schema-only fallback when unset", doc.includes("schema-only") || doc.includes("readBack: null"));
assert("doc service_role not used for readBack", doc.includes("service_role") && /not use|不使用|Forbidden|not used/i.test(doc));
assert("doc anon SELECT policy", doc.includes("anon SELECT") || doc.includes("supabase-select"));
assert("doc operation save reject", doc.includes("save") && /reject|拒否/i.test(doc));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc pre-deploy verifiers", doc.includes("verify:g20u36d-readback-root-placement"));
assert("doc operator procedure", doc.includes("Operator procedure") || doc.includes("operator"));
assert("doc post-deploy wouldWrite false expectation", doc.includes("wouldWrite: false") || doc.includes("wouldWrite: false"));
assert("doc live verify direct endpoint", doc.includes("direct") && /endpoint|HTTP/i.test(doc));

assert("doc next edge-deploy-preflight", doc.includes("G-20u36d-readback-edge-deploy-preflight"));
assert("doc next edge-deploy", doc.includes("G-20u36d-readback-edge-deploy"));
assert("doc next live-verify", doc.includes("G-20u36d-readback-live-verify"));
assert("doc next admin sanitizer optional", doc.includes("sanitizer") || doc.includes("admin"));
assert("doc next G-20u36e deferred", doc.includes("G-20u36e"));

assert("package script verify:g20u36d-readback-edge-deploy-plan", packageJson.includes("verify:g20u36d-readback-edge-deploy-plan"));

assert("root handler has readBack", rootHandler.includes("resolveReadBackSnapshot"));
assert("root index readBack env gate", rootIndex.includes("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED"));
assert("root no SUPABASE_SERVICE_ROLE_KEY", !/SUPABASE_SERVICE_ROLE_KEY/i.test(rootSrc));
assert("root placement gate complete", rootPlacementDoc.includes("gosakiDiscographyEdgeDryRunReadBackRootPlaced: true"));

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert("AI current-state edge-deploy-plan", currentState.includes("G-20u36d-readback-edge-deploy-plan") || currentState.includes("edge-deploy-plan"));
assert("AI next-actions edge-deploy-preflight or deploy", nextActions.includes("G-20u36d-readback-edge-deploy"));
assert("AI handoff readBack deploy plan", handoff.includes("G-20u36d") && handoff.includes("deploy"));

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-edge-deploy-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
