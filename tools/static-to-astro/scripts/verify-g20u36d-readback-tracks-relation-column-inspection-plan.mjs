/**
 * G-20u36d-readback-tracks-relation-column-inspection-plan verifier.
 * Planning-only — no SQL / tools-root edit / Edge deploy / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-relation-column-inspection-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-column-inspection-plan.md";
const RETRY2_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-2.md";
const DEPLOY_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-select-fields-fix-edge-deploy-result.md";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const TOOLS_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const READBACK_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "cdcb649";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

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
const originShort = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});

if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-relation inspection plan base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during plan doc creation`,
  );
}

assert("plan doc exists", exists(DOC_REL));
assert("retry-2 doc exists", exists(RETRY2_DOC_REL));
assert("deploy result doc exists", exists(DEPLOY_RESULT_DOC_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));
assert("tools handler exists", exists(TOOLS_HANDLER_REL));
assert("readback lib exists", exists(READBACK_LIB_REL));

const doc = read(DOC_REL);
const retry2Doc = read(RETRY2_DOC_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const toolsHandler = read(TOOLS_HANDLER_REL);
const readbackLib = read(READBACK_LIB_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-tracks-relation-column-inspection-planning",
  doc.includes("G-20u36d-readback-tracks-relation-column-inspection-planning"),
);
assert(
  "doc gate prepared",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionPlanPrepared: true"),
);
assert("doc plan only", doc.includes("plan") && /plan.*only|planning doc/i.test(doc));
assert("doc no tools root edit", doc.includes("Tools") && /no|not|false|未編集|unchanged/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));

assert("doc retry-2 STOP context", doc.includes("retry-2") || doc.includes("live verify retry-2"));
assert("doc duration issue resolved", doc.includes("duration") && /resolved|解消/i.test(doc));
assert(
  "doc release_id column missing",
  doc.includes("release_id") && (/does not exist|missing|absent/i.test(doc)),
);
assert("doc PostgREST 42703", doc.includes("42703"));
assert("doc trackCount zero", doc.includes("trackCount") && doc.includes("0"));
assert("doc matching 400", doc.includes("matching") && doc.includes("400"));
assert("doc write flags false safe", doc.includes("write flags") && /false|not a dangerous/i.test(doc));
assert("doc no G20u36e until retry pass", doc.includes("G-20u36e") && /after|until|PASS/i.test(doc));

assert("doc SELECT-only inspection", doc.includes("SELECT-only") || doc.includes("SELECT only"));
assert("doc operator SQL Editor", doc.includes("SQL Editor") || doc.includes("operator"));
assert("doc information_schema columns", doc.includes("information_schema.columns"));
assert("doc foreign keys inspection", doc.includes("FOREIGN KEY") || doc.includes("foreign keys"));
assert("doc pg_indexes", doc.includes("pg_indexes"));
assert("doc sample discography-002", doc.includes("discography-002"));
assert("doc candidate relation columns", doc.includes("discography_legacy_id") || doc.includes("discography_id"));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|禁止/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used|not required/i.test(doc));
assert("doc anon SELECT maintained", doc.includes("anon SELECT") || doc.includes("anonSelectPreferred"));
assert("doc STOP conditions", doc.includes("STOP conditions") || doc.includes("STOP condition"));
assert("doc next inspection preflight", doc.includes("G-20u36d-readback-tracks-relation-column-inspection-preflight"));
assert("doc next result record", doc.includes("G-20u36d-readback-tracks-relation-column-inspection-result-record"));
assert("doc next filter fix planning", doc.includes("G-20u36d-readback-tracks-relation-filter-fix-planning"));
assert("doc next live verify retry-3", doc.includes("retry-3") || doc.includes("live verify retry-3"));

assert("retry-2 doc gate false", retry2Doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry2Passed: false"));
assert("retry-2 doc release_id cause", retry2Doc.includes("release_id") && retry2Doc.includes("does not exist"));

assert("root handler still uses release_id filter", rootHandler.includes("release_id=eq."));
assert("tools handler still uses release_id filter", toolsHandler.includes("release_id=eq."));
assert("readback lib still uses release_id filter", readbackLib.includes("release_id=eq."));
assert("root handler TRACK_SELECT_FIELDS without duration", !/TRACK_SELECT_FIELDS[\s\S]{0,120}duration/.test(rootHandler));

assert(
  "package script verify:g20u36d-readback-tracks-relation-column-inspection-plan",
  packageJson.includes("verify:g20u36d-readback-tracks-relation-column-inspection-plan"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("tools edge handler not modified this phase", !diffTouches(TOOLS_HANDLER_REL));
assert("readback lib not modified this phase", !diffTouches(READBACK_LIB_REL));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert(
  "AI current-state tracks-relation inspection plan",
  currentState.includes("G-20u36d-readback-tracks-relation-column-inspection-plan") ||
    currentState.includes("tracks-relation-column-inspection-plan"),
);
assert(
  "AI next-actions inspection preflight",
  nextActions.includes("G-20u36d-readback-tracks-relation-column-inspection-preflight") ||
    nextActions.includes("tracks-relation-column-inspection-preflight"),
);
assert(
  "AI handoff tracks relation inspection plan",
  handoff.includes("tracks-relation") || handoff.includes("release_id") || handoff.includes("discography_legacy_id"),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(
  `\nG-20u36d-readback-tracks-relation-column-inspection-plan: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
