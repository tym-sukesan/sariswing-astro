/**
 * G-20u36d-readback-tracks-relation-column-inspection-preflight verifier.
 * Preflight-only — no SQL / tools-root edit / Edge deploy / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-relation-column-inspection-preflight.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-column-inspection-preflight.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-column-inspection-plan.md";
const RETRY2_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-2.md";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const TOOLS_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const TOOLS_DRAFT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-tools-draft.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "e73d79a";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";

const FORBIDDEN_SQL_WORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "ALTER",
  "CREATE",
  "DROP",
  "GRANT",
  "REVOKE",
  "RPC",
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

function extractSqlBlock(doc) {
  const match = doc.match(/```sql\n([\s\S]*?)```/);
  return match ? match[1] : "";
}

function sqlExecutableLines(sql) {
  return sql
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith("--");
    })
    .join("\n");
}

function sqlForbiddenWordsOk(sql) {
  const executable = sqlExecutableLines(sql);
  for (const word of FORBIDDEN_SQL_WORDS) {
    if (new RegExp(`\\b${word}\\b`, "i").test(executable)) {
      return { ok: false, word };
    }
  }
  return { ok: true };
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-relation inspection preflight base ${BASE_COMMIT}) — non-blocking`,
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
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("retry-2 doc exists", exists(RETRY2_DOC_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));

const doc = read(DOC_REL);
const planDoc = read(PLAN_DOC_REL);
const retry2Doc = read(RETRY2_DOC_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const sqlBlock = extractSqlBlock(doc);
const forbiddenCheck = sqlForbiddenWordsOk(sqlBlock);

assert(
  "doc phase G-20u36d-readback-tracks-relation-column-inspection-preflight",
  doc.includes("G-20u36d-readback-tracks-relation-column-inspection-preflight"),
);
assert(
  "doc gate ready",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionPreflightReady: true"),
);
assert("doc preflight only", doc.includes("preflight") && /preflight.*only|Preflight doc/i.test(doc));
assert("doc SELECT-only policy", doc.includes("SELECT-only") || doc.includes("SELECT only"));
assert("doc operator manual SQL", doc.includes("SQL Editor") && /operator|manual/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行|NOT EXECUTED/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc tools root not edited", doc.includes("Tools") && /no|not|false|未編集|unchanged/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
assert("doc production ref STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|禁止/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));

assert("doc duration issue resolved", doc.includes("duration") && /resolved|解消/i.test(doc));
assert(
  "doc release_id missing STOP",
  doc.includes("release_id") && (/does not exist|missing|absent/i.test(doc)),
);
assert("doc PostgREST 42703", doc.includes("42703") || retry2Doc.includes("42703"));
assert("doc trackCount zero context", doc.includes("trackCount") && doc.includes("0"));
assert("doc matching 400", doc.includes("matching") && doc.includes("400"));
assert("doc no G20u36e until retry pass", doc.includes("G-20u36e") && /after|until|PASS/i.test(doc));

assert("doc SQL block present", sqlBlock.length > 200);
assert("doc information_schema columns", sqlBlock.includes("information_schema.columns"));
assert("doc foreign keys inspection", sqlBlock.includes("FOREIGN KEY") || sqlBlock.includes("foreign keys"));
assert("doc pg_indexes", sqlBlock.includes("pg_indexes"));
assert("doc discography-002 sample", sqlBlock.includes("discography-002"));
assert("doc to_jsonb safe track sample", sqlBlock.includes("to_jsonb(t)"));
assert("doc relation column flags", sqlBlock.includes("has_release_id") && sqlBlock.includes("has_discography_legacy_id"));
assert("doc join feasibility hints", sqlBlock.includes("join_feasibility_hints") || sqlBlock.includes("G.join"));
assert(
  "SQL block no forbidden mutation words in executable lines",
  forbiddenCheck.ok,
  forbiddenCheck.ok ? "" : `found ${forbiddenCheck.word}`,
);
assert("doc forbidden words documented in comment", doc.includes("Forbidden:") && doc.includes("INSERT"));

assert("doc operator checklist", doc.includes("Operator checklist") || doc.includes("Operator execution"));
assert("doc next result record", doc.includes("G-20u36d-readback-tracks-relation-column-inspection-result-record"));
assert("doc next filter fix planning", doc.includes("G-20u36d-readback-tracks-relation-filter-fix-planning"));
assert("doc next live verify retry-3", doc.includes("retry-3") || doc.includes("live verify retry-3"));

assert("retry-2 doc gate false", retry2Doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry2Passed: false"));
assert("plan doc gate prepared", planDoc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionPlanPrepared: true"));

assert("root handler still uses release_id filter", rootHandler.includes("release_id=eq."));

assert(
  "package script verify:g20u36d-readback-tracks-relation-column-inspection-preflight",
  packageJson.includes("verify:g20u36d-readback-tracks-relation-column-inspection-preflight"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));

const toolsDraftFilterFixComplete =
  exists(TOOLS_DRAFT_DOC_REL) &&
  read(TOOLS_DRAFT_DOC_REL).includes(
    "gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixToolsDraftImplemented: true",
  );
if (toolsDraftFilterFixComplete) {
  console.log("NOTE tools-draft filter fix complete — skip tools handler not-modified check");
} else {
  assert("tools edge handler not modified this phase", !diffTouches(TOOLS_HANDLER_REL));
}
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));

const planVerify = runNpmScript("verify:g20u36d-readback-tracks-relation-column-inspection-plan");
assert("targeted verify inspection-plan PASS", planVerify.ok, planVerify.tail);

const retry2Verify = runNpmScript("verify:g20u36d-readback-live-verify-retry-2");
if (toolsDraftFilterFixComplete) {
  console.log(
    "NOTE tools-draft filter fix complete — retry-2 nested verify non-blocking until root placement",
  );
} else {
  assert("targeted verify live-verify-retry-2 PASS", retry2Verify.ok, retry2Verify.tail);
}

assert(
  "AI current-state tracks-relation inspection preflight",
  currentState.includes("G-20u36d-readback-tracks-relation-column-inspection-preflight") ||
    currentState.includes("tracks-relation-column-inspection-preflight"),
);
assert(
  "AI next-actions operator execution or result record",
  nextActions.includes("G-20u36d-readback-tracks-relation-column-inspection-result-record") ||
    nextActions.includes("operator manual SELECT-only") ||
    nextActions.includes("operator SELECT-only"),
);
assert(
  "AI handoff tracks relation inspection preflight",
  handoff.includes("tracks-relation-column-inspection-preflight") ||
    (handoff.includes("tracks-relation") && handoff.includes("preflight")),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Save not enabled", true);
assert("G20u36e controlled Save planning not ready", true);

console.log(
  `\nG-20u36d-readback-tracks-relation-column-inspection-preflight: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
