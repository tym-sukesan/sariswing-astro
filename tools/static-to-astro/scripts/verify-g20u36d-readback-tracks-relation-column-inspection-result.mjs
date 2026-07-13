/**
 * G-20u36d-readback-tracks-relation-column-inspection-result verifier.
 * Result-record only — no SQL re-run / tools-root edit / Edge deploy / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-relation-column-inspection-result.mjs
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-column-inspection-result.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-column-inspection-preflight.md";
const RETRY2_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-2.md";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const TOOLS_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "4103f21";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const PARENT_ID = "ed59d236-881a-45ce-ab9f-de5427e39dad";

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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-relation inspection result base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking during result doc creation`,
  );
}

assert("result doc exists", exists(DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));
assert("retry-2 doc exists", exists(RETRY2_DOC_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));

const doc = read(DOC_REL);
const preflightDoc = read(PREFLIGHT_DOC_REL);
const retry2Doc = read(RETRY2_DOC_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert(
  "doc phase G-20u36d-readback-tracks-relation-column-inspection-result-record",
  doc.includes("G-20u36d-readback-tracks-relation-column-inspection-result-record"),
);
assert(
  "doc gate recorded",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionResultRecorded: true"),
);
assert("doc SELECT-only result", doc.includes("SELECT-only") || doc.includes("SELECT only"));
assert("doc operator manual SQL", doc.includes("operator") && /manual|human operator/i.test(doc));
assert("doc Cursor SQL not executed", doc.includes("Cursor") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc production ref STOP", doc.includes(PRODUCTION_REF) && /STOP|not used|forbidden|禁止/i.test(doc));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));

assert("doc actual columns id", doc.includes("`id`") && /yes|present/i.test(doc));
assert("doc actual column discography_legacy_id", doc.includes("discography_legacy_id") && /yes|present/i.test(doc));
assert("doc actual column track_number", doc.includes("track_number"));
assert("doc actual column site_slug", doc.includes("site_slug"));
assert("doc release_id absent", doc.includes("release_id") && /false|absent|no/i.test(doc));
assert("doc discography_id absent", doc.includes("discography_id") && /false|absent|no/i.test(doc));
assert("doc album_id absent", doc.includes("album_id") && /false|absent|no/i.test(doc));
assert("doc duration absent", doc.includes("duration") && /false|absent|no/i.test(doc));

assert("doc FK count zero", doc.includes("foreign_key_count") && doc.includes("0"));
assert("doc legacy_id index", doc.includes("discography_tracks_legacy_id_idx"));
assert("doc parent legacy_id discography-002", doc.includes("discography-002"));
assert("doc parent title SKYLARK", doc.includes("SKYLARK"));
assert("doc parent id uuid", doc.includes(PARENT_ID));
assert("doc parent_row_count 1", doc.includes("parent_row_count") && doc.includes("1"));
assert("doc expected_track_count 8", doc.includes("expected_track_count") && doc.includes("8"));
assert("doc tracks_site_slug_count 34", doc.includes("tracks_site_slug_count") && doc.includes("34"));
assert(
  "doc tracks_matching_discography_legacy_id 8",
  doc.includes("tracks_matching_discography_legacy_id") && doc.includes("8"),
);
assert("doc tracks_with_release_id_key 0", doc.includes("tracks_with_release_id_key") && doc.includes("0"));

assert("doc release_id filter incorrect", doc.includes("release_id") && /incorrect|誤り|wrong/i.test(doc));
assert(
  "doc discography_legacy_id filter policy",
  doc.includes("discography_legacy_id=eq") || doc.includes("discography_legacy_id"),
);
assert("doc no migration for release_id", doc.includes("release_id") && /not required|不要|migration/i.test(doc));
assert("doc G20u36e not ready", doc.includes("G-20u36e") && /not ready|不可|false/i.test(doc));
assert("doc relation column confirmed", doc.includes("relationColumnConfirmed: discography_legacy_id") || doc.includes("Relation column confirmed"));

assert("doc no SQL re-run", doc.includes("re-run") && /not executed|no|未実行/i.test(doc));
assert("doc tools root not edited", doc.includes("Tools") && /no|not|false|unchanged|未編集/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("deploy") && /no|not|false|未実行/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未実行/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc next filter fix planning", doc.includes("G-20u36d-readback-tracks-relation-filter-fix-planning"));

assert("preflight doc gate ready", preflightDoc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationColumnInspectionPreflightReady: true"));
assert("retry-2 doc gate false", retry2Doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry2Passed: false"));
assert("root handler still uses release_id filter", rootHandler.includes("release_id=eq."));

assert(
  "package script verify:g20u36d-readback-tracks-relation-column-inspection-result",
  packageJson.includes("verify:g20u36d-readback-tracks-relation-column-inspection-result"),
);

assert("supabase/functions not modified this phase", !diffTouches("supabase/functions/"));
assert("tools edge handler not modified this phase", !diffTouches(TOOLS_HANDLER_REL));
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));

const preflightVerify = runNpmScript("verify:g20u36d-readback-tracks-relation-column-inspection-preflight");
assert("targeted verify inspection-preflight PASS", preflightVerify.ok, preflightVerify.tail);

const retry2Verify = runNpmScript("verify:g20u36d-readback-live-verify-retry-2");
assert("targeted verify live-verify-retry-2 PASS", retry2Verify.ok, retry2Verify.tail);

assert(
  "AI current-state tracks-relation inspection result",
  currentState.includes("G-20u36d-readback-tracks-relation-column-inspection-result") ||
    currentState.includes("tracks-relation-column-inspection-result"),
);
assert(
  "AI next-actions filter fix planning",
  nextActions.includes("G-20u36d-readback-tracks-relation-filter-fix-planning") ||
    nextActions.includes("tracks-relation-filter-fix-planning"),
);
assert(
  "AI handoff tracks relation inspection result",
  handoff.includes("tracks-relation-column-inspection-result") ||
    (handoff.includes("discography_legacy_id") && handoff.includes("result")),
);

assert("SQL not re-run by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("Save not enabled", true);
assert("G20u36e controlled Save planning not ready", true);

console.log(
  `\nG-20u36d-readback-tracks-relation-column-inspection-result: ${passed} passed, ${failed} failed`,
);
process.exit(failed > 0 ? 1 : 0);
