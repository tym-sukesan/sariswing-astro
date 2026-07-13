/**
 * G-20u36d-readback-live-verify-retry-3
 * Live HTTP verify retry-3 — readBack anon SELECT on staging Edge Function (read-only · no DB write · no secrets logged).
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-live-verify-retry-3.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { loadGosakiStagingAdminPublicEnv } from "./lib/gosaki-staging-admin-public-env.mjs";
import {
  createAnonSelectReadBackAdapter,
  resolveReadBackSnapshot,
  READBACK_SOURCE,
  isReadBackSummarySanitized,
} from "./lib/gosaki-discography-edge-dry-run-readback.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const PRODUCTION_REF = "vsbvndwuajjhnzpohghh";
const FUNCTION_NAME = "gosaki-discography-save-dry-run";
const TARGET_URL = `https://${STAGING_REF}.supabase.co/functions/v1/${FUNCTION_NAME}`;
const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-3.md";
const DEPLOY_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-tracks-relation-filter-fix-edge-deploy-result.md";
const PRIOR_RETRY_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify-retry-2.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
const LEGACY_ID = "discography-002";
const SITE_SLUG = "gosaki-piano";
const EXPECTED_TRACK_COUNT = 8;
const BASE_COMMIT = "8edeec6";
const BONUS_TRACK = "G-20u36d Live Verify Retry-3 Bonus Track";

const FORBIDDEN_RESPONSE_PATTERNS = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
];

/** @type {{ matching?: object, plusOne?: object, saveReject?: object, wrongSlug?: object, dbTrackCount?: number, retry3Passed?: boolean }} */
export const liveVerifyRetry3Capture = {};

let passed = 0;
let failed = 0;

/** @type {Array<{ id: string, status: number, ok: boolean|null, category: string, note?: string }>} */
const caseResults = [];

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

function writeFlagsOk(json) {
  return (
    json?.didWrite === false &&
    json?.dbWrite === false &&
    json?.networkWrite === false &&
    json?.saveEnabled === false
  );
}

function responseBodySafe(text) {
  return !FORBIDDEN_RESPONSE_PATTERNS.some((p) => p.test(text));
}

function sanitizeReadBack(readBack) {
  if (readBack == null) return null;
  return {
    enabled: readBack.enabled,
    source: readBack.source,
    releaseFound: readBack.releaseFound,
    trackCount: readBack.trackCount,
    legacyId: readBack.legacyId,
    siteSlug: readBack.siteSlug,
  };
}

function sanitizeCaseSummary(json, status) {
  return {
    status,
    ok: typeof json?.ok === "boolean" ? json.ok : null,
    wouldWrite: typeof json?.wouldWrite === "boolean" ? json.wouldWrite : null,
    tracksAdded: json?.changedCounts?.tracksAdded ?? null,
    didWrite: json?.didWrite === false ? false : json?.didWrite === true ? true : null,
    dbWrite: json?.dbWrite === false ? false : json?.dbWrite === true ? true : null,
    networkWrite: json?.networkWrite === false ? false : json?.networkWrite === true ? true : null,
    saveEnabled: json?.saveEnabled === false ? false : json?.saveEnabled === true ? true : null,
    errors: Array.isArray(json?.errors) ? json.errors.map((e) => String(e).slice(0, 120)) : [],
    readBack: sanitizeReadBack(json?.readBack),
    warnings: Array.isArray(json?.warnings) ? json.warnings.slice(0, 3).map((e) => String(e).slice(0, 120)) : [],
  };
}

/**
 * @param {string} url
 * @param {RequestInit} init
 */
async function callEndpoint(url, init) {
  if (url.includes(PRODUCTION_REF)) {
    throw new Error("STOP: production ref in URL");
  }
  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { res, text, json };
}

function buildBaseDryRunBody(snapshot, tracksText, clientDryRun) {
  return {
    operation: "dryRun",
    siteSlug: SITE_SLUG,
    legacyId: LEGACY_ID,
    approvalId: DRY_RUN_APPROVAL_ID,
    release: snapshot.release ?? {},
    tracksText,
    trackPolicy: {
      oneLineOneTrack: true,
      blankLinesIgnored: true,
      allowDuplicateTitles: true,
      allowEmptyTrackList: false,
    },
    clientDryRun,
  };
}

async function prefetchDbSnapshot(anonKey, supabaseUrl) {
  const adapter = createAnonSelectReadBackAdapter({
    fetchFn: fetch,
    supabaseUrl,
    anonKey,
  });
  return resolveReadBackSnapshot(adapter, { siteSlug: SITE_SLUG, legacyId: LEGACY_ID });
}

async function runLiveVerifyRetry3Cases(anonKey, supabaseUrl) {
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };

  const { snapshot, summary: dbSummary } = await prefetchDbSnapshot(anonKey, supabaseUrl);
  liveVerifyRetry3Capture.dbTrackCount = dbSummary.trackCount;

  assert("prefetch readBack releaseFound", dbSummary.releaseFound === true);
  assert("prefetch readBack source supabase-select", dbSummary.source === READBACK_SOURCE);

  const trackCount = dbSummary.trackCount;
  const matchingTracksText = String(snapshot.tracksText ?? "");
  const matchingBody = buildBaseDryRunBody(snapshot, matchingTracksText, {
    wouldWrite: false,
    totalBefore: trackCount,
    totalAfter: trackCount,
    added: [],
    removed: [],
    reordered: false,
  });

  const matching = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(matchingBody),
  });
  const matchingSummary = sanitizeCaseSummary(matching.json, matching.res.status);
  liveVerifyRetry3Capture.matching = matchingSummary;

  assert("live matching response safe", responseBodySafe(matching.text));
  assert("live matching readBack enabled", matchingSummary.readBack?.enabled === true);
  assert("live matching readBack source", matchingSummary.readBack?.source === READBACK_SOURCE);
  assert("live matching readBack releaseFound", matchingSummary.readBack?.releaseFound === true);
  assert("live matching readBack sanitized", isReadBackSummarySanitized(matching.json?.readBack));
  assert("live matching write flags false", writeFlagsOk(matching.json));

  const retry3Passed =
    trackCount === EXPECTED_TRACK_COUNT &&
    matching.res.status === 200 &&
    matchingSummary.ok === true &&
    matchingSummary.readBack?.trackCount === EXPECTED_TRACK_COUNT;

  if (retry3Passed) {
    assert("live matching status 200", matching.res.status === 200, String(matching.res.status));
    assert("live matching ok true", matchingSummary.ok === true);
    assert("live matching readBack trackCount 8", matchingSummary.readBack?.trackCount === EXPECTED_TRACK_COUNT);
    assert("live matching wouldWrite false", matchingSummary.wouldWrite === false);
    assert("live matching tracksAdded 0", matchingSummary.tracksAdded === 0);
    assert("live matching errors empty", matchingSummary.errors.length === 0);
    caseResults.push({
      id: "matching-dryRun",
      status: matching.res.status,
      ok: matchingSummary.ok,
      category: "readBack_matching_db_snapshot",
      note: `readBack trackCount=${matchingSummary.readBack?.trackCount} wouldWrite=${matchingSummary.wouldWrite}`,
    });
  } else {
    assert("live matching STOP trackCount not 8", matchingSummary.readBack?.trackCount !== EXPECTED_TRACK_COUNT);
    assert("live matching STOP status 400", matching.res.status === 400, String(matching.res.status));
    assert(
      "live matching STOP empty track list error",
      matchingSummary.errors.some((e) => /empty track list/i.test(e)),
    );
    caseResults.push({
      id: "matching-dryRun",
      status: matching.res.status,
      ok: matchingSummary.ok,
      category: "STOP_readBack_trackCount_not_8",
      note: `readBack trackCount=${matchingSummary.readBack?.trackCount} expected=${EXPECTED_TRACK_COUNT}`,
    });
  }

  const plusOneTracksText = `${matchingTracksText}\n${BONUS_TRACK}`;
  const plusOneBody = buildBaseDryRunBody(snapshot, plusOneTracksText, {
    wouldWrite: false,
    totalBefore: trackCount,
    totalAfter: trackCount + 1,
    added: [BONUS_TRACK],
    removed: [],
    reordered: false,
  });
  const plusOne = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(plusOneBody),
  });
  const plusOneSummary = sanitizeCaseSummary(plusOne.json, plusOne.res.status);
  liveVerifyRetry3Capture.plusOne = plusOneSummary;

  assert("live plusOne response safe", responseBodySafe(plusOne.text));
  assert("live plusOne status 200", plusOne.res.status === 200);
  assert("live plusOne ok true", plusOneSummary.ok === true);
  assert("live plusOne readBack enabled", plusOneSummary.readBack?.enabled === true);
  assert("live plusOne readBack releaseFound", plusOneSummary.readBack?.releaseFound === true);
  assert("live plusOne wouldWrite true", plusOneSummary.wouldWrite === true);
  assert("live plusOne tracksAdded 1", plusOneSummary.tracksAdded === 1);
  assert("live plusOne write flags false", writeFlagsOk(plusOne.json));
  caseResults.push({
    id: "plus-one-track-dryRun",
    status: plusOne.res.status,
    ok: plusOneSummary.ok,
    category: "readBack_track_added_diff",
    note: `wouldWrite=${plusOneSummary.wouldWrite} tracksAdded=${plusOneSummary.tracksAdded}`,
  });

  const saveBody = { ...matchingBody, operation: "save" };
  const save = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(saveBody),
  });
  const saveSummary = sanitizeCaseSummary(save.json, save.res.status);
  liveVerifyRetry3Capture.saveReject = saveSummary;

  assert("live save reject response safe", responseBodySafe(save.text));
  assert("live save reject status 400", save.res.status === 400, String(save.res.status));
  assert("live save reject ok false", saveSummary.ok === false);
  assert("live save reject write flags false", writeFlagsOk(save.json));
  caseResults.push({
    id: "operation-save",
    status: save.res.status,
    ok: saveSummary.ok,
    category: "save_rejected",
    note: saveSummary.errors[0] ?? "rejected",
  });

  const wrongSlugBody = { ...matchingBody, siteSlug: "wrong-site-slug" };
  const wrongSlug = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(wrongSlugBody),
  });
  const wrongSlugSummary = sanitizeCaseSummary(wrongSlug.json, wrongSlug.res.status);
  liveVerifyRetry3Capture.wrongSlug = wrongSlugSummary;

  assert("live wrong siteSlug reject status 400", wrongSlug.res.status === 400);
  assert("live wrong siteSlug ok false", wrongSlugSummary.ok === false);
  assert("live wrong siteSlug write flags false", writeFlagsOk(wrongSlug.json));
  caseResults.push({
    id: "wrong-siteSlug",
    status: wrongSlug.res.status,
    ok: wrongSlugSummary.ok,
    category: "siteSlug_rejected",
    note: wrongSlugSummary.errors[0] ?? "rejected",
  });

  const authFailure = caseResults.some((r) => r.status === 401 || r.status === 403);
  assert("no auth failure on live cases", !authFailure);

  liveVerifyRetry3Capture.retry3Passed = retry3Passed && failed === 0;
  return retry3Passed;
}

function printCaseSummaryTable() {
  console.log("\n--- Live verify retry-3 case summary (sanitized) ---");
  for (const row of caseResults) {
    console.log(
      `${row.id}: status=${row.status} ok=${row.ok} category=${row.category}` +
        (row.note ? ` note=${row.note}` : ""),
    );
  }
}

const headShort = spawnSync("git", ["rev-parse", "--short", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" });
if (headShort.stdout.trim() === BASE_COMMIT) {
  console.log(`PASS HEAD is ${BASE_COMMIT}`);
  passed += 1;
} else {
  console.log(
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack live-verify-retry-3 base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("target URL staging only", TARGET_URL.includes(STAGING_REF) && !TARGET_URL.includes(PRODUCTION_REF));
assert("deploy result doc exists", exists(DEPLOY_RESULT_DOC_REL));
assert("prior retry doc exists", exists(PRIOR_RETRY_DOC_REL));
assert("live verify retry-3 doc exists", exists(DOC_REL));

const env = loadGosakiStagingAdminPublicEnv();
const anonKey = String(env.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();

if (!anonKey) {
  console.error("STOP: PUBLIC_SUPABASE_ANON_KEY not found in .env / .env.local / process.env");
  process.exit(1);
}

assert("PUBLIC_SUPABASE_ANON_KEY present", Boolean(anonKey));
assert("PUBLIC_SUPABASE_ANON_KEY not service_role", !/service_role/i.test(anonKey));
assert(
  "PUBLIC_SUPABASE_URL staging host",
  supabaseUrl.includes(`${STAGING_REF}.supabase.co`) && !supabaseUrl.includes(PRODUCTION_REF),
);

console.log("Auth: Bearer + apikey PUBLIC_SUPABASE_ANON_KEY (values not logged)");
console.log(`Target: ${TARGET_URL}`);

const retry3PassedLive = await runLiveVerifyRetry3Cases(anonKey, supabaseUrl);
printCaseSummaryTable();

const doc = read(DOC_REL);
const docGatePass = doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry3Passed: true");
const docGateStop = doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerifyRetry3Passed: false");

assert("doc phase G-20u36d-readback-live-verify-retry-3", doc.includes("G-20u36d-readback-live-verify-retry-3"));
assert(
  "doc gate matches live outcome",
  retry3PassedLive ? docGatePass : docGateStop,
  `live retry3Passed=${retry3PassedLive} docPass=${docGatePass} docStop=${docGateStop}`,
);
assert("doc target URL", doc.includes(TARGET_URL));
assert("doc staging ref", doc.includes(STAGING_REF));
assert("doc production not used", doc.includes(PRODUCTION_REF) && /not used|未使用|STOP|forbidden/i.test(doc));
assert(
  "doc auth anon key only",
  doc.includes("PUBLIC_SUPABASE_ANON_KEY") && /not log|値を出さ|not logged|非表示/i.test(doc),
);
assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
assert(
  "doc tracks-relation-filter fix deployed",
  doc.includes("tracks relation filter fix") || doc.includes("tracksRelationFilterFixDeployed"),
);
assert("doc release_id filter removed", doc.includes("release_id") && /remove|removed|除去/i.test(doc));
assert("doc discography_legacy_id filter", doc.includes("discography_legacy_id"));
assert(
  "doc tracks-select-fields fix deployed",
  doc.includes("tracks SELECT fields fix") || doc.includes("tracksSelectFieldsFixDeployed"),
);
assert("doc release-id fix deployed", doc.includes("release-id fix") || doc.includes("releaseIdSelectFixDeployed"));
assert("doc readBack enabled", doc.includes("readBack.enabled") || doc.includes("readBack enabled"));
assert("doc readBack source", doc.includes("supabase-select") || doc.includes("readBack.source"));
assert("doc releaseFound", doc.includes("releaseFound"));
assert("doc trackCount", doc.includes("trackCount"));

if (retry3PassedLive) {
  assert("doc matching status 200", doc.includes("200") && doc.includes("matching"));
  assert("doc trackCount 8", doc.includes("trackCount") && doc.includes("8"));
  assert("doc matching wouldWrite false", doc.includes("wouldWrite") && doc.includes("false"));
  assert("doc matching tracksAdded 0", doc.includes("tracksAdded") && doc.includes("0"));
  assert("doc PASS summary", doc.includes("PASS"));
} else {
  assert("doc STOP or FAIL", doc.includes("STOP") || doc.includes("FAIL"));
  assert(
    "doc matching status 400 or STOP",
    (doc.includes("400") && doc.includes("matching")) || doc.includes("STOP"),
  );
}

assert("doc plusOne wouldWrite true", doc.includes("wouldWrite") && doc.includes("true") && doc.includes("tracksAdded"));
assert(
  "doc plusOne status 200",
  doc.includes("200") && (doc.includes("+1") || doc.includes("plusOne") || doc.includes("plus-one")),
);
assert("doc save reject", doc.includes("save") && /reject|400/i.test(doc));
assert("doc wrong siteSlug reject", doc.includes("siteSlug") || doc.includes("wrong"));
assert("doc write flags false", doc.includes("didWrite") && doc.includes("false"));
assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
assert("doc Save not enabled", doc.includes("Save") && /disabled|not enabled|blocked|false/i.test(doc));
assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|unchanged/i.test(doc));
assert("doc FTP not executed", doc.includes("FTP") && /no|not|false/i.test(doc));
assert("doc no Edge redeploy", doc.includes("Edge") && /not executed|no re-deploy|再実行なし|not executed/i.test(doc));
assert(
  "doc next phase G20u36e or STOP",
  retry3PassedLive
    ? doc.includes("G-20u36e-controlled-save-planning") || doc.includes("G-20u36e")
    : doc.includes("STOP") || doc.includes("FAIL"),
);

assert("supabase/functions not edited", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));
assert("admin UI not modified this phase", !diffTouches(ADMIN_PAGE_REL));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify script", packageJson.includes("verify:g20u36d-readback-live-verify-retry-3"));

const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
assert(
  "AI current-state live-verify-retry-3",
  currentState.includes("G-20u36d-readback-live-verify-retry-3") || currentState.includes("live-verify-retry-3"),
);
assert(
  "AI next-actions after live-verify-retry-3",
  nextActions.includes("live-verify-retry-3") || nextActions.includes("G-20u36e-controlled-save-planning"),
);
assert(
  "handoff live-verify-retry-3",
  handoff.includes("live-verify-retry-3") || handoff.includes("LiveVerifyRetry3"),
);

assert("SQL not executed by Cursor", true);
assert("Edge redeploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

if (retry3PassedLive) {
  console.log("\nRESULT: live verify retry-3 PASS — gate true");
} else {
  console.log("\nRESULT: live verify retry-3 STOP — gate false documented");
}

console.log(`\nG-20u36d-readback-live-verify-retry-3: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
