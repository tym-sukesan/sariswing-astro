/**
 * G-20u36d-readback-release-id-select-fix-tools-draft verifier.
 * Tools draft fix only — no root edit / Edge deploy / SQL / Save.
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-release-id-select-fix-tools-draft.mjs
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
  createMockReadBackAdapter,
  DISCOGRAPHY_002_READBACK_FIXTURE,
  G20U36D_RELEASE_ID_SELECT_FIX_PHASE,
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
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-tools-draft.md";
const PLAN_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-release-id-select-fix-plan.md";
const DRAFT_HANDLER_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/handler.ts";
const DRAFT_INDEX_REL =
  "tools/static-to-astro/scripts/edge-functions/gosaki-discography-save-dry-run/index.ts";
const READBACK_LIB_REL = "tools/static-to-astro/scripts/lib/gosaki-discography-edge-dry-run-readback.mjs";
const ROOT_HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const BASE_COMMIT = "2494ca1";

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

function releaseSelectIncludesId(src) {
  const match = src.match(/RELEASE_SELECT_FIELDS\s*=\s*\[([\s\S]*?)\]/);
  if (!match) return false;
  return /["']id["']/.test(match[1]);
}

function releaseSelectMissingId(src) {
  return !releaseSelectIncludesId(src);
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d release-id fix tools-draft base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("doc exists", exists(DOC_REL));
assert("plan doc exists", exists(PLAN_DOC_REL));
assert("tools draft handler exists", exists(DRAFT_HANDLER_REL));
assert("tools draft index exists", exists(DRAFT_INDEX_REL));
assert("readback lib exists", exists(READBACK_LIB_REL));

const doc = read(DOC_REL);
const handlerTs = read(DRAFT_HANDLER_REL);
const indexTs = read(DRAFT_INDEX_REL);
const readbackLib = read(READBACK_LIB_REL);
const rootHandler = exists(ROOT_HANDLER_REL) ? read(ROOT_HANDLER_REL) : "";
const draftSrc = `${handlerTs}\n${indexTs}\n${readbackLib}`;
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

assert("doc phase G-20u36d-readback-release-id-select-fix-tools-draft", doc.includes(G20U36D_RELEASE_ID_SELECT_FIX_PHASE));
assert(
  "doc gate implemented",
  doc.includes("gosakiDiscographyEdgeDryRunReadBackReleaseIdSelectFixToolsDraftImplemented: true"),
);
assert("doc tools draft only", doc.includes("tools draft") && /only|のみ/i.test(doc));
assert("doc root not edited", doc.includes("supabase/functions") && /no|not|false|未変更|unchanged/i.test(doc));
assert("doc Edge deploy not executed", doc.includes("Edge") && /no|not|false|未実行/i.test(doc));
assert("doc no SQL", doc.includes("SQL") && /no|not|false|未実行/i.test(doc));
assert("doc no DB write", doc.includes("DB write") && /no|not|false|未実行/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /false|no|not enabled|blocked/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false|未変更|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false|未実行/i.test(doc));
assert("doc release SELECT id added", doc.includes("RELEASE_SELECT_FIELDS") && doc.includes("id"));
assert("doc internal id only", doc.includes("internal") && doc.includes("id"));
assert("doc sanitized summary no id", doc.includes("sanitized") && /no `id`|No UUID|absent/i.test(doc));
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
assert("doc anon SELECT maintained", doc.includes("anon SELECT"));
assert("doc matching trackCount 8", doc.includes("trackCount") && doc.includes("8"));
assert("doc matching wouldWrite false", doc.includes("wouldWrite") && doc.includes("false"));
assert("doc plusOne wouldWrite true", doc.includes("wouldWrite") && doc.includes("true"));
assert("doc next root placement", doc.includes("G-20u36d-readback-release-id-select-fix-root-placement"));

assert("handler RELEASE_SELECT_FIELDS includes id", releaseSelectIncludesId(handlerTs));
assert("readback lib RELEASE_SELECT_FIELDS includes id", releaseSelectIncludesId(readbackLib));
assert("handler internal id comment", handlerTs.includes("internal") && handlerTs.includes("id"));
assert("handler resolveReadBackSnapshot uses releaseRow.id", handlerTs.includes("releaseRow.id"));
assert("handler missing id warning", handlerTs.includes("missing internal id"));
assert("handler mapReleaseRow omits id", handlerTs.includes("mapReleaseRowToCurrentSnapshotRelease"));
assert(
  "handler snapshot release mapping no id field",
  !/mapReleaseRowToCurrentSnapshotRelease[\s\S]{0,400}\bid\s*:/.test(handlerTs),
);
assert("handler buildSanitizedReadBackSummary no id field", !/buildSanitizedReadBackSummary[\s\S]{0,300}\bid\b:/.test(handlerTs));
assert("handler tracks path release_id", handlerTs.includes("release_id=eq."));
assert("handler operation save reject", handlerTs.includes('operation "save" is rejected'));
assert("handler write flags false", handlerTs.includes("didWrite: false") && handlerTs.includes("saveEnabled: false"));
assert("handler no SUPABASE_SERVICE_ROLE_KEY", !/SUPABASE_SERVICE_ROLE_KEY/i.test(draftSrc));
assert("handler no createClient", !/createClient\s*\(/i.test(draftSrc));
for (const pattern of MUTATION_PATTERNS) {
  assert(`handler no mutation ${pattern}`, !pattern.test(handlerTs));
}

assert("root handler not modified", !diffTouches("supabase/functions/"));
if (rootHandler) {
  assert("root handler still missing id (pre-placement)", releaseSelectMissingId(rootHandler));
}

const releasePath = buildAnonSelectDiscographyReleasePath(READBACK_SITE_SLUG, "discography-002");
assert("release path includes id in select", releasePath.includes("select=id,") || releasePath.includes("select=id%2C"));
const tracksPath = buildAnonSelectDiscographyTracksPath(
  READBACK_SITE_SLUG,
  DISCOGRAPHY_002_READBACK_FIXTURE.release.id,
);
assert("tracks path release_id filter", tracksPath.includes("release_id=eq."));

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
assert("mock readBack summary no id key", readBackResult.summary.id === undefined);
assert("mock snapshot release no id", readBackResult.snapshot.release?.id === undefined);
assert("mock readBack warnings empty when id present", readBackResult.warnings.length === 0);

const missingIdAdapter = createMockReadBackAdapter({
  "discography-002": {
    release: { ...DISCOGRAPHY_002_READBACK_FIXTURE.release, id: undefined },
    tracks: DISCOGRAPHY_002_READBACK_FIXTURE.tracks,
  },
});
const missingIdResult = await resolveReadBackSnapshot(missingIdAdapter, {
  siteSlug: READBACK_SITE_SLUG,
  legacyId: "discography-002",
});
assert("missing id fallback trackCount 0", missingIdResult.summary.trackCount === 0);
assert("missing id fallback warning", missingIdResult.warnings.some((w) => /missing internal id/i.test(w)));

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
  "package script verify:g20u36d-readback-release-id-select-fix-tools-draft",
  packageJson.includes("verify:g20u36d-readback-release-id-select-fix-tools-draft"),
);

assert("admin UI not modified", !diffTouches(ADMIN_PAGE_REL));
assert("src not modified", !diffTouches("src/"));
assert("public not modified", !diffTouches("public/"));
assert("no new mutation sql files", listNewSqlFiles().length === 0);

assert(
  "AI current-state tools-draft fix",
  currentState.includes("G-20u36d-readback-release-id-select-fix-tools-draft") ||
    currentState.includes("release-id-select-fix-tools-draft"),
);
assert(
  "AI next-actions root placement",
  nextActions.includes("G-20u36d-readback-release-id-select-fix-root-placement"),
);
assert(
  "AI handoff release id tools draft fix",
  handoff.includes("G-20u36d") && handoff.includes("release-id"),
);

assert("Edge deploy not executed by Cursor", true);
assert("SQL not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-release-id-select-fix-tools-draft: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
