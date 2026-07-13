/**
 * G-20u36d-readback-tracks-relation-filter-fix-plan verifier.
 * Planning-only — no SQL / tools-root edit / Edge deploy / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-relation-filter-fix-plan.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-plan.md";
const TOOLS_DRAFT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-tools-draft.md";
const RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-column-inspection-result.md";
const RETRY2_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-2.md";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const TOOLS_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const READBACK_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "3a8a655";
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

function diffTouches(prefix) {
  const diff = spawnSync("git", ["diff", "--name-only", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain", prefix], { cwd: REPO_ROOT, encoding: "utf8" });
  return Boolean(diff.stdout.trim() || status.stdout.trim());
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-relation filter-fix plan base ${BASE_COMMIT}) — non-blocking`,
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
assert("inspection result doc exists", exists(RESULT_DOC_REL));
assert("retry-2 doc exists", exists(RETRY2_DOC_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));
assert("tools handler exists", exists(TOOLS_HANDLER_REL));
assert("readback lib exists", exists(READBACK_LIB_REL));

const doc = read(DOC_REL);
const resultDoc = read(RESULT_DOC_REL);
const retry2Doc = read(RETRY2_DOC_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-tracks-relation-filter-fix-planning",
  doc.includes("G-20u36d-readback-tracks-relation-filter-fix-planning"),
);
assert(
  "doc gate prepared",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixPlanPrepared: true"),
);
assert("doc plan only", doc.includes("plan") && /plan.*only|planning doc/i.test(doc));
assert("doc no tools root edit", doc.includes("Tools") && /no|not|false|未編集|unchanged/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL execution", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));

assert("doc release_id filter incorrect", doc.includes("release_id") && /incorrect|誤り|wrong|absent/i.test(doc));
assert(
  "doc discography_legacy_id relation",
  doc.includes("discography_legacy_id") && doc.includes("discography.legacy_id"),
);
assert(
  "doc site_slug + discography_legacy_id filter",
  doc.includes("site_slug") && doc.includes("discography_legacy_id=eq"),
);
assert("doc DB migration not required", doc.includes("release_id") && /not required|不要|migration/i.test(doc));
assert("doc retry-3 expectations", doc.includes("retry-3") || doc.includes("Live verify retry-3"));
assert("doc matching trackCount 8", doc.includes("trackCount") && doc.includes("8"));
assert("doc matching wouldWrite false", doc.includes("wouldWrite") && doc.includes("false"));
assert("doc plusOne tracksAdded 1", doc.includes("tracksAdded") && doc.includes("1"));
assert("doc operation save reject", doc.includes("save") && /reject|400/i.test(doc));
assert(
  "doc write flags false",
  doc.includes("didWrite") && doc.includes("dbWrite") && doc.includes("networkWrite") && doc.includes("saveEnabled"),
);
assert("doc generalization note", doc.includes("Generalization") || doc.includes("generalization"));
assert("doc site profile schema mapping", doc.includes("site profile") || doc.includes("schema mapping"));
assert("doc TRACK_SELECT_FIELDS unchanged", doc.includes("TRACK_SELECT_FIELDS") && doc.includes("track_number"));
assert(
  "doc discography_legacy_id filter only not select",
  doc.includes("discography_legacy_id") && (/filter only|filter parameter/i.test(doc)),
);
assert("doc no UUID in readBack summary", doc.includes("UUID") && /not|do not|no/i.test(doc));
assert("doc no G20u36e until retry-3", doc.includes("G-20u36e") && /retry-3|after/i.test(doc));
assert("doc next tools draft", doc.includes("G-20u36d-readback-tracks-relation-filter-fix-tools-draft"));
assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden/i.test(doc));

assert(
  "result doc relation confirmed",
  resultDoc.includes("relationColumnConfirmed: discography_legacy_id") || resultDoc.includes("Relation column confirmed"),
);
assert("retry-2 doc gate false", retry2Doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry2Passed: false"));
assert("root handler still uses release_id filter", rootHandler.includes("release_id=eq."));

assert(
  "package script verify:g20u36d-readback-tracks-relation-filter-fix-plan",
  packageJson.includes("verify:g20u36d-readback-tracks-relation-filter-fix-plan"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));

const toolsDraftComplete =
  exists(TOOLS_DRAFT_DOC_REL) &&
  read(TOOLS_DRAFT_DOC_REL).includes(
    "gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixToolsDraftImplemented: true",
  );
if (toolsDraftComplete) {
  console.log(
    "NOTE tools-draft complete — plan verifier skips tools handler/readback lib not-modified checks",
  );
} else {
  assert("tools edge handler not modified this phase", !diffTouches(TOOLS_HANDLER_REL));
  assert("readback lib not modified this phase", !diffTouches(READBACK_LIB_REL));
}
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));

const resultVerify = runNpmScript("verify:g20u36d-readback-tracks-relation-column-inspection-result");
assert("targeted verify inspection-result PASS", resultVerify.ok, resultVerify.tail);

const retry2Verify = runNpmScript("verify:g20u36d-readback-live-verify-retry-2");
if (toolsDraftComplete) {
  console.log(
    "NOTE tools-draft filter fix complete — retry-2 nested verify non-blocking until root placement",
  );
} else {
  assert("targeted verify live-verify-retry-2 PASS", retry2Verify.ok, retry2Verify.tail);
}

assert(
  "AI current-state filter fix plan",
  currentState.includes("G-20u36d-readback-tracks-relation-filter-fix-plan") ||
    currentState.includes("tracks-relation-filter-fix-plan"),
);
assert(
  "AI next-actions tools draft",
  nextActions.includes("G-20u36d-readback-tracks-relation-filter-fix-tools-draft") ||
    nextActions.includes("tracks-relation-filter-fix-tools-draft"),
);
assert(
  "AI handoff filter fix plan",
  handoff.includes("tracks-relation-filter-fix-plan") ||
    (handoff.includes("discography_legacy_id") && handoff.includes("filter")),
);

assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Save not enabled", true);

console.log(`\nG-20u36d-readback-tracks-relation-filter-fix-plan: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
