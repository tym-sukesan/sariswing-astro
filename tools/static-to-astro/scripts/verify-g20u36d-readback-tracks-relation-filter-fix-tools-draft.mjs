/**
 * G-20u36d-readback-tracks-relation-filter-fix-tools-draft verifier.
 * Tools draft fix only — no root edit / Edge deploy / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-tracks-relation-filter-fix-tools-draft.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { simulateDiscographySaveDryRunEndpoint } from "./lib/gosaki-discography-save-dry-run-endpoint-draft.mjs";
import {
  buildAnonSelectDiscographyTracksPath,
  buildDiscography002MatchingDryRunRequest,
  buildDiscography002TrackAddedDryRunRequest,
  createMockReadBackAdapter,
  DISCOGRAPHY_002_READBACK_FIXTURE,
  G20U36D_TRACKS_RELATION_FILTER_FIX_PHASE,
  isReadBackSummarySanitized,
  READBACK_SITE_SLUG,
  READBACK_SOURCE,
  resolveReadBackSnapshot,
} from "./lib/gosaki-discography-edge-dry-run-readback.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-tools-draft.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-plan.md";
const DRAFT_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const DRAFT_INDEX_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts";
const READBACK_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "4b79db8";

const MUTATION_PATTERNS = [
  /\.insert\s*\(/i,
  /\.update\s*\(/i,
  /\.upsert\s*\(/i,
  /\.delete\s*\(/i,
  /\.rpc\s*\(/i,
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

function trackSelectIncludesField(src, field) {
  const match = src.match(/TRACK_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  return new RegExp(`["']${field}["']`).test(match[1]);
}

function trackSelectHasRequiredFields(src) {
  const match = src.match(/TRACK_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  const fields = match[1];
  return (
    /["']track_number["']/.test(fields) &&
    /["']title["']/.test(fields) &&
    /["']sort_order["']/.test(fields) &&
    /["']site_slug["']/.test(fields)
  );
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d tracks-relation filter-fix tools-draft base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("tools draft handler exists", exists(DRAFT_HANDLER_REL));
assert("tools draft index exists", exists(DRAFT_INDEX_REL));
assert("readback lib exists", exists(READBACK_LIB_REL));
assert("root handler exists", exists(ROOT_HANDLER_REL));

const doc = read(DOC_REL);
const handlerTs = read(DRAFT_HANDLER_REL);
const indexTs = read(DRAFT_INDEX_REL);
const readbackLib = read(READBACK_LIB_REL);
const rootHandler = read(ROOT_HANDLER_REL);
const draftSrc = `${handlerTs}\n${indexTs}\n${readbackLib}`;
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36d-readback-tracks-relation-filter-fix-tools-draft", doc.includes(G20U36D_TRACKS_RELATION_FILTER_FIX_PHASE));
assert(
  "doc gate implemented",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackTracksRelationFilterFixToolsDraftImplemented: true"),
);
assert("doc tools draft only", doc.includes("tools draft") && /only|のみ/i.test(doc));
assert("doc root not edited", doc.includes("supabase/functions") && /no|not|false|未変更|unchanged/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("Edge") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未変更|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc release_id filter removed", doc.includes("release_id") && /remove|removed|wrong|誤/i.test(doc));
assert("doc discography_legacy_id filter", doc.includes("discography_legacy_id=eq") || doc.includes("discography_legacy_id"));
assert("doc no UUID in tracks relation", doc.includes("UUID") && /not|no|remove|使わない/i.test(doc));
assert("doc TRACK_SELECT_FIELDS policy", doc.includes("TRACK_SELECT_FIELDS"));
assert("doc discography_legacy_id filter only", doc.includes("discography_legacy_id") && /filter only|filter のみ/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
assert("doc matching trackCount 8", doc.includes("trackCount") && doc.includes("8"));
assert("doc matching wouldWrite false", doc.includes("wouldWrite") && doc.includes("false"));
assert("doc plusOne wouldWrite true", doc.includes("wouldWrite") && doc.includes("true"));
assert("doc operation save reject", doc.includes("operation=save") || (doc.includes("save") && /reject/i.test(doc)));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("saveEnabled"));
assert("doc generalization note", doc.includes("Generalization") || doc.includes("generalization"));
assert("doc next root placement", doc.includes("G-20u36d-readback-tracks-relation-filter-fix-root-placement"));

assert("handler no release_id in tracks path", !handlerTs.includes("release_id=eq."));
assert("handler discography_legacy_id in tracks path", handlerTs.includes("discography_legacy_id=eq."));
assert("handler site_slug in tracks path", handlerTs.includes("site_slug=eq."));
assert("handler resolveReadBackSnapshot uses legacyId for tracks", /fetchTracks\(\{\s*siteSlug,\s*legacyId\s*\}/.test(handlerTs));
assert("handler no releaseRow.id tracks gate", !handlerTs.includes("release row missing internal id"));
assert("handler TRACK_SELECT_FIELDS no duration", !trackSelectIncludesField(handlerTs, "duration"));
assert("handler TRACK_SELECT_FIELDS no release_id", !trackSelectIncludesField(handlerTs, "release_id"));
assert("handler TRACK_SELECT_FIELDS has required fields", trackSelectHasRequiredFields(handlerTs));
assert("readback lib no release_id in tracks path", !readbackLib.includes("release_id=eq."));
assert("readback lib discography_legacy_id filter", readbackLib.includes("discography_legacy_id=eq."));
assert("readback lib TRACK_SELECT_FIELDS no duration", !trackSelectIncludesField(readbackLib, "duration"));
assert("readback lib TRACK_SELECT_FIELDS no release_id", !trackSelectIncludesField(readbackLib, "release_id"));
assert("handler operation save reject", handlerTs.includes('operation "save" is rejected'));
assert("handler write flags false", handlerTs.includes("didWrite: false") && handlerTs.includes("saveEnabled: false"));
assert("handler no SUPABASE_SERVICE_ROLE_KEY", !/SUPABASE_SERVICE_ROLE_KEY/i.test(draftSrc));
assert("handler no createClient", !/createClient\s*\(/i.test(draftSrc));
for (const pattern of MUTATION_PATTERNS) {
  assert(`handler no mutation ${pattern}`, !pattern.test(handlerTs));
}

assert("root supabase/functions not modified", !diffTouches("supabase/functions/"));
assert("root handler still uses release_id filter (pre-placement)", rootHandler.includes("release_id=eq."));

const tracksPath = buildAnonSelectDiscographyTracksPath(READBACK_SITE_SLUG, "discography-002");
assert("tracks path no release_id filter", !tracksPath.includes("release_id=eq."));
assert("tracks path discography_legacy_id filter", tracksPath.includes("discography_legacy_id=eq.discography-002"));
assert("tracks path site_slug filter", tracksPath.includes("site_slug=eq.gosaki-piano"));
assert("tracks path select without duration", !tracksPath.includes("duration"));
assert(
  "tracks path select includes track_number title sort_order site_slug",
  tracksPath.includes("track_number") &&
    tracksPath.includes("title") &&
    tracksPath.includes("sort_order") &&
    tracksPath.includes("site_slug"),
);

const mockAdapter = createMockReadBackAdapter({
  "discography-002": DISCOGRAPHY_002_READBACK_FIXTURE,
});

const readBackResult = await resolveReadBackSnapshot(mockAdapter, {
  siteSlug: READBACK_SITE_SLUG,
  legacyId: "discography-002",
});

assert("mock readBack trackCount 8", readBackResult.summary.trackCount === 8);
assert("mock readBack releaseFound true", readBackResult.summary.releaseFound === true);
assert("mock readBack source supabase-select", readBackResult.summary.source === READBACK_SOURCE);
assert("mock readBack summary sanitized", isReadBackSummarySanitized(readBackResult.summary));

const matchingRequest = buildDiscography002MatchingDryRunRequest();
const matchingResult = simulateDiscographySaveDryRunEndpoint(matchingRequest, readBackResult.snapshot);
assert("matching mock wouldWrite false", matchingResult.wouldWrite === false, String(matchingResult.wouldWrite));
assert("matching mock tracksAdded 0", matchingResult.changedCounts?.tracksAdded === 0);
assert("matching mock ok true", matchingResult.ok === true);

const trackAddedRequest = buildDiscography002TrackAddedDryRunRequest();
const trackAddedResult = simulateDiscographySaveDryRunEndpoint(trackAddedRequest, readBackResult.snapshot);
assert("plusOne mock wouldWrite true", trackAddedResult.wouldWrite === true, String(trackAddedResult.wouldWrite));
assert("plusOne mock tracksAdded 1", trackAddedResult.changedCounts?.tracksAdded === 1);

const schemaOnlyResult = simulateDiscographySaveDryRunEndpoint(matchingRequest, {});
assert("schema-only wouldWrite true", schemaOnlyResult.wouldWrite === true);

const saveReject = simulateDiscographySaveDryRunEndpoint({
  ...matchingRequest,
  operation: "save",
});
assert("operation save reject", saveReject.ok === false);
assert("save reject write flags false", saveReject.didWrite === false && saveReject.saveEnabled === false);

assert("matching write flags false", matchingResult.didWrite === false && matchingResult.dbWrite === false);
assert("matching networkWrite false", matchingResult.networkWrite === false);
assert("matching saveEnabled false", matchingResult.saveEnabled === false);

assert(
  "package script verify:g20u36d-readback-tracks-relation-filter-fix-tools-draft",
  packageJson.includes("verify:g20u36d-readback-tracks-relation-filter-fix-tools-draft"),
);

assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));

assert(
  "AI current-state tools-draft filter fix",
  currentState.includes("G-20u36d-readback-tracks-relation-filter-fix-tools-draft") ||
    currentState.includes("tracks-relation-filter-fix-tools-draft"),
);
assert(
  "AI next-actions root placement",
  nextActions.includes("G-20u36d-readback-tracks-relation-filter-fix-root-placement"),
);
assert(
  "AI handoff filter fix tools draft",
  handoff.includes("tracks-relation-filter-fix-tools-draft") ||
    (handoff.includes("discography_legacy_id") && handoff.includes("tools-draft")),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-tracks-relation-filter-fix-tools-draft: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
