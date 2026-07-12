/**
 * G-20u36d-readback-implementation-in-tools-draft
 * Tools draft readBack verifier — mock/fixture only · no live Supabase HTTP.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-implementation-in-tools-draft.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { simulateDiscographySaveDryRunEndpoint } from "./lib/gosaki-discography-save-dry-run-endpoint-draft.mjs";
import {
  buildAnonSelectDiscographyReleasePath,
  buildAnonSelectDiscographyTracksPath,
  buildDiscography002MatchingDryRunRequest,
  buildDiscography002TrackAddedDryRunRequest,
  createAnonSelectReadBackAdapter,
  createMockReadBackAdapter,
  DISCOGRAPHY_002_READBACK_FIXTURE,
  G20U36D_READBACK_PHASE,
  isReadBackSummarySanitized,
  READBACK_SITE_SLUG,
  READBACK_SOURCE,
  resolveReadBackSnapshot,
  snapshotFromReadBackRows,
  STAGING_PROJECT_REF,
} from "./lib/gosaki-discography-edge-dry-run-readback.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-implementation-in-tools-draft.md";
const DRAFT_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const DRAFT_INDEX_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts";
const READBACK_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "d99fd21";

const MUTATION_PATTERNS = [
  /\.insert\s*\(/i,
  /\.update\s*\(/i,
  /\.upsert\s*\(/i,
  /\.delete\s*\(/i,
  /\.rpc\s*\(/i,
  /\bINSERT\s+INTO\b/i,
  /\bUPDATE\s+\w+\s+SET\b/i,
  /\bDELETE\s+FROM\b/i,
];

const DEPLOY_PATTERNS = [/functions deploy/i, /workflow_dispatch/i, /mirror\s+--delete/i];

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
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("readBack lib exists", exists(READBACK_LIB_REL));
assert("tools draft handler exists", exists(DRAFT_HANDLER_REL));
assert("tools draft index exists", exists(DRAFT_INDEX_REL));

const doc = read(DOC_REL);
const handlerTs = read(DRAFT_HANDLER_REL);
const indexTs = read(DRAFT_INDEX_REL);
const readbackLib = read(READBACK_LIB_REL);
const draftSrc = `${handlerTs}\n${indexTs}\n${readbackLib}`;
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const packageJson = read("tools/static-to-astro/package.json");

assert("doc phase G-20u36d-readback-implementation-in-tools-draft", doc.includes(G20U36D_READBACK_PHASE));
assert(
  "doc gate gosakiDiscographyEdgeDryRunReadBackToolsDraftImplemented",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackToolsDraftImplemented: true"),
);
assert("doc tools draft only", doc.includes("tools draft") || doc.includes("tools配下"));
assert("doc root supabase functions unchanged", doc.includes("supabase/functions") && /unchanged|未変更|not edited/i.test(doc));
assert("doc no Edge deploy", doc.includes("Edge deploy") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|disabled/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|no service_role/i.test(doc));
assert("doc anon SELECT", doc.includes("anon SELECT") || doc.includes("supabase-select"));
assert("doc mock verifier", doc.includes("mock") || doc.includes("fixture"));
assert("doc next G-20u36d-readback-root-placement-plan", doc.includes("G-20u36d-readback-root-placement-plan"));

assert("package script verify:g20u36d-readback-implementation-in-tools-draft", packageJson.includes("verify:g20u36d-readback-implementation-in-tools-draft"));

assert("handler phase G-20u36d", handlerTs.includes(G20U36D_READBACK_PHASE));
assert("handler resolveReadBackSnapshot", handlerTs.includes("resolveReadBackSnapshot"));
assert("handler buildSanitizedReadBackSummary", handlerTs.includes("buildSanitizedReadBackSummary"));
assert("handler createAnonSelectReadBackAdapter", handlerTs.includes("createAnonSelectReadBackAdapter"));
assert("handler simulateDiscographySaveDryRunEndpointWithReadBack", handlerTs.includes("simulateDiscographySaveDryRunEndpointWithReadBack"));
assert("handler handleDiscographyEdgeDryRunHttpAsync", handlerTs.includes("handleDiscographyEdgeDryRunHttpAsync"));
assert("handler anon SELECT release path builder", handlerTs.includes("buildAnonSelectDiscographyReleasePath"));
assert("handler anon SELECT tracks path builder", handlerTs.includes("buildAnonSelectDiscographyTracksPath"));
assert("handler legacyId + siteSlug readBack", handlerTs.includes("legacyId") && handlerTs.includes("siteSlug"));
assert("handler readBack source supabase-select", handlerTs.includes(READBACK_SOURCE));

assert("index async readBack wiring", indexTs.includes("handleDiscographyEdgeDryRunHttpAsync"));
assert("index readBack env gate", indexTs.includes("GOSAKI_DISCOGRAPHY_DRY_RUN_READBACK_ENABLED"));

assert(
  "handler service_role not connected flag",
  handlerTs.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false"),
);
assert(
  "handler no SUPABASE_SERVICE_ROLE_KEY reference",
  !/SUPABASE_SERVICE_ROLE_KEY/i.test(handlerTs),
);
assert(
  "readBack lib no SUPABASE_SERVICE_ROLE_KEY reference",
  !/SUPABASE_SERVICE_ROLE_KEY/i.test(readbackLib),
);
assert("handler no createClient", !/createClient\s*\(/i.test(draftSrc));

for (const pattern of MUTATION_PATTERNS) {
  assert(`draft no mutation ${pattern}`, !pattern.test(draftSrc));
}

for (const pattern of DEPLOY_PATTERNS) {
  assert(`draft no deploy call ${pattern}`, !pattern.test(draftSrc));
}

const ROOT_PLACEMENT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-root-placement.md";
const rootPlacementComplete =
  exists(ROOT_PLACEMENT_DOC_REL) &&
  read(ROOT_PLACEMENT_DOC_REL).includes("gosakiDiscographyEdgeDryRunReadBackRootPlaced: true");

assert("handler operation save reject", handlerTs.includes('operation "save" is rejected'));
assert("handler write flags false", handlerTs.includes("didWrite: false") && handlerTs.includes("saveEnabled: false"));

if (rootPlacementComplete) {
  console.log(
    "NOTE root placement complete — tools-draft verifier root-unmodified check skipped (historical tools-draft doc)",
  );
  passed += 1;
} else {
  assert("root handler not modified this phase", !diffTouches(ROOT_HANDLER_REL));
}
assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));

assert("AI current-state mentions G-20u36d readBack tools draft", currentState.includes("G-20u36d-readback-implementation-in-tools-draft") || currentState.includes("readBack tools draft"));
assert("AI next-actions mentions next phase", nextActions.includes("G-20u36d-readback-root-placement-plan") || nextActions.includes("readback-root-placement"));
assert("AI handoff mentions G-20u36d readBack", handoff.includes("G-20u36d") && handoff.includes("readBack"));

const releasePath = buildAnonSelectDiscographyReleasePath(READBACK_SITE_SLUG, "discography-002");
assert("anon SELECT release path site_slug", releasePath.includes("site_slug=eq.gosaki-piano"));
assert("anon SELECT release path legacy_id", releasePath.includes("legacy_id=eq.discography-002"));
assert("anon SELECT release path discography table", releasePath.includes("/rest/v1/discography"));

const tracksPath = buildAnonSelectDiscographyTracksPath(
  READBACK_SITE_SLUG,
  DISCOGRAPHY_002_READBACK_FIXTURE.release.id,
);
assert("anon SELECT tracks path release_id", tracksPath.includes("release_id=eq."));
assert("anon SELECT tracks order", tracksPath.includes("order=track_number"));

assert(
  "anon adapter rejects production ref",
  (() => {
    try {
      createAnonSelectReadBackAdapter({
        fetchFn: async () => new Response("[]"),
        supabaseUrl: "https://vsbvndwuajjhnzpohghh.supabase.co",
        anonKey: "test-anon-key",
      });
      return false;
    } catch (error) {
      return String(error?.message ?? error).includes("production");
    }
  })(),
);

const mockAdapter = createMockReadBackAdapter({
  "discography-002": DISCOGRAPHY_002_READBACK_FIXTURE,
});

const readBackResult = await resolveReadBackSnapshot(mockAdapter, {
  siteSlug: READBACK_SITE_SLUG,
  legacyId: "discography-002",
});

assert("mock readBack releaseFound true", readBackResult.summary.releaseFound === true);
assert("mock readBack trackCount 8", readBackResult.summary.trackCount === 8);
assert("mock readBack legacyId", readBackResult.summary.legacyId === "discography-002");
assert("mock readBack siteSlug", readBackResult.summary.siteSlug === READBACK_SITE_SLUG);
assert("mock readBack source", readBackResult.summary.source === READBACK_SOURCE);
assert("mock readBack summary sanitized", isReadBackSummarySanitized(readBackResult.summary));

assert(
  "mock snapshot summary only — no raw release id in summary",
  !String(readBackResult.summary?.id ?? "").includes("00000000"),
);

const matchingRequest = buildDiscography002MatchingDryRunRequest();
const schemaOnlyResult = simulateDiscographySaveDryRunEndpoint(matchingRequest, {});
assert(
  "schema-only wouldWrite true (STG QA false positive)",
  schemaOnlyResult.wouldWrite === true,
  String(schemaOnlyResult.wouldWrite),
);
assert(
  "schema-only tracksAdded 8",
  schemaOnlyResult.changedCounts?.tracksAdded === 8,
  String(schemaOnlyResult.changedCounts?.tracksAdded),
);

const dbGroundedResult = simulateDiscographySaveDryRunEndpoint(matchingRequest, readBackResult.snapshot);
assert(
  "readBack fixture wouldWrite false (no change)",
  dbGroundedResult.wouldWrite === false,
  String(dbGroundedResult.wouldWrite),
);
assert(
  "readBack fixture tracksAdded 0",
  dbGroundedResult.changedCounts?.tracksAdded === 0,
  String(dbGroundedResult.changedCounts?.tracksAdded),
);

const trackAddedRequest = buildDiscography002TrackAddedDryRunRequest();
const trackAddedResult = simulateDiscographySaveDryRunEndpoint(trackAddedRequest, readBackResult.snapshot);
assert(
  "readBack fixture track added wouldWrite true",
  trackAddedResult.wouldWrite === true,
  String(trackAddedResult.wouldWrite),
);
assert(
  "readBack fixture track added tracksAdded 1",
  trackAddedResult.changedCounts?.tracksAdded === 1,
  String(trackAddedResult.changedCounts?.tracksAdded),
);

const notFoundSnapshot = snapshotFromReadBackRows(null, [], {
  legacyId: "discography-missing",
  siteSlug: READBACK_SITE_SLUG,
});
assert("release not found summary releaseFound false", notFoundSnapshot.summary.releaseFound === false);
assert("release not found summary trackCount 0", notFoundSnapshot.summary.trackCount === 0);

const saveReject = simulateDiscographySaveDryRunEndpoint({
  ...matchingRequest,
  operation: "save",
  approvalId: "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice",
});
assert("operation save rejected", saveReject.ok === false);
assert("operation save errors mention reject", saveReject.errors?.some((e) => /reject/i.test(String(e))));

assert("write flags didWrite false", dbGroundedResult.didWrite === false);
assert("write flags dbWrite false", dbGroundedResult.dbWrite === false);
assert("write flags networkWrite false", dbGroundedResult.networkWrite === false);
assert("write flags saveEnabled false", dbGroundedResult.saveEnabled === false);

assert("staging ref in handler", handlerTs.includes(STAGING_PROJECT_REF));
assert("production ref STOP in handler", handlerTs.includes("vsbvndwuajjhnzpohghh"));

console.log(`\nG-20u36d readBack tools draft verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
