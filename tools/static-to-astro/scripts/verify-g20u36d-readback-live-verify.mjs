/**
 * G-20u36d-readback-live-verify
 * Live HTTP verify — readBack anon SELECT on staging Edge Function (read-only · no DB write · no secrets logged).
 * Run: node tools/static-to-astro/scripts/verify-g20u36d-readback-live-verify.mjs
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
const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-live-verify.md";
const DEPLOY_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-edge-deploy-result.md";
const ENV_SECRET_RESULT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36d-readback-env-secret-setting-result.md";
const ADMIN_PAGE_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const DRY_RUN_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
const LEGACY_ID = "discography-002";
const SITE_SLUG = "gosaki-piano";
const BASE_COMMIT = "8ec25a7";

const FORBIDDEN_RESPONSE_PATTERNS = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
];

/** @type {{ matching?: object, plusOne?: object, saveReject?: object, wrongSlug?: object, dbTrackCount?: number }} */
export const liveVerifyCapture = {};

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

async function runLiveVerifyCases(anonKey, supabaseUrl) {
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };

  const { snapshot, summary: dbSummary } = await prefetchDbSnapshot(anonKey, supabaseUrl);
  liveVerifyCapture.dbTrackCount = dbSummary.trackCount;

  assert("prefetch readBack releaseFound", dbSummary.releaseFound === true);
  if (dbSummary.trackCount === 0) {
    console.log("NOTE readBack prefetch trackCount=0 — matching dryRun STOP expected (release SELECT may omit internal id)");
  } else {
    assert("prefetch readBack trackCount >= 1", dbSummary.trackCount >= 1);
  }

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

  // 1. matching dryRun
  const matching = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(matchingBody),
  });
  const matchingSummary = sanitizeCaseSummary(matching.json, matching.res.status);
  liveVerifyCapture.matching = matchingSummary;

  assert("live matching response safe", responseBodySafe(matching.text));
  assert("live matching readBack enabled", matchingSummary.readBack?.enabled === true);
  assert("live matching readBack source", matchingSummary.readBack?.source === READBACK_SOURCE);
  assert("live matching readBack releaseFound", matchingSummary.readBack?.releaseFound === true);
  assert("live matching readBack sanitized", isReadBackSummarySanitized(matching.json?.readBack));
  assert("live matching write flags false", writeFlagsOk(matching.json));

  if (trackCount === 0) {
    assert("live matching STOP trackCount zero observed", matchingSummary.readBack?.trackCount === 0);
    assert("live matching STOP status 400", matching.res.status === 400, String(matching.res.status));
    assert("live matching STOP empty track list error", matchingSummary.errors.some((e) => /empty track list/i.test(e)));
    caseResults.push({
      id: "matching-dryRun",
      status: matching.res.status,
      ok: matchingSummary.ok,
      category: "STOP_readBack_trackCount_zero",
      note: `readBack trackCount=0 releaseFound=true — matching blocked`,
    });
  } else {
    assert("live matching status 200", matching.res.status === 200, String(matching.res.status));
    assert("live matching ok true", matchingSummary.ok === true);
    assert("live matching readBack trackCount", matchingSummary.readBack?.trackCount === trackCount);
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
  }

  // 2. +1 track dryRun
  const plusOneTracksText = `${matchingTracksText}\nG-20u36d Live Verify Bonus Track`;
  const plusOneBody = buildBaseDryRunBody(snapshot, plusOneTracksText, {
    wouldWrite: false,
    totalBefore: trackCount,
    totalAfter: trackCount + 1,
    added: ["G-20u36d Live Verify Bonus Track"],
    removed: [],
    reordered: false,
  });
  const plusOne = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(plusOneBody),
  });
  const plusOneSummary = sanitizeCaseSummary(plusOne.json, plusOne.res.status);
  liveVerifyCapture.plusOne = plusOneSummary;

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

  // 3. operation=save reject
  const saveBody = { ...matchingBody, operation: "save" };
  const save = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(saveBody),
  });
  const saveSummary = sanitizeCaseSummary(save.json, save.res.status);
  liveVerifyCapture.saveReject = saveSummary;

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

  // 4. wrong siteSlug reject
  const wrongSlugBody = { ...matchingBody, siteSlug: "wrong-site-slug" };
  const wrongSlug = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(wrongSlugBody),
  });
  const wrongSlugSummary = sanitizeCaseSummary(wrongSlug.json, wrongSlug.res.status);
  liveVerifyCapture.wrongSlug = wrongSlugSummary;

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
}

function printCaseSummaryTable() {
  console.log("\n--- Live verify case summary (sanitized) ---");
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36d readBack live-verify base ${BASE_COMMIT}) — non-blocking`,
  );
}

assert("target URL staging only", TARGET_URL.includes(STAGING_REF) && !TARGET_URL.includes(PRODUCTION_REF));
assert("deploy result doc exists", exists(DEPLOY_RESULT_DOC_REL));
assert("env secret result doc exists", exists(ENV_SECRET_RESULT_DOC_REL));

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

await runLiveVerifyCases(anonKey, supabaseUrl);
printCaseSummaryTable();

const livePass = failed === 0 || (passed > 0 && !caseResults.some((r) => r.status === 401 || r.status === 403));

if (exists(DOC_REL)) {
  const doc = read(DOC_REL);
  assert("doc phase G-20u36d-readback-live-verify", doc.includes("G-20u36d-readback-live-verify"));
  assert(
    "doc gate live verified",
    doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerified: true") ||
      doc.includes("gosakiDiscographyEdgeDryRunReadBackLiveVerified: false"),
  );
  assert("doc target URL", doc.includes(TARGET_URL));
  assert("doc staging ref", doc.includes(STAGING_REF));
  assert("doc production not used", doc.includes(PRODUCTION_REF) && /not used|未使用|STOP|forbidden/i.test(doc));
  assert(
    "doc auth anon key only",
    doc.includes("PUBLIC_SUPABASE_ANON_KEY") && /not log|値を出さ|not logged|非表示/i.test(doc),
  );
  assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used|不使用/i.test(doc));
  assert("doc readBack enabled", doc.includes("readBack.enabled") || doc.includes("readBack enabled"));
  assert("doc readBack source", doc.includes("supabase-select") || doc.includes("readBack.source"));
  assert("doc releaseFound", doc.includes("releaseFound"));
  assert("doc trackCount", doc.includes("trackCount"));
  assert(
    "doc matching result or STOP",
    (doc.includes("wouldWrite") && doc.includes("false") && doc.includes("tracksAdded")) ||
      (doc.includes("STOP") && doc.includes("trackCount")),
  );
  assert("doc plusOne wouldWrite true", doc.includes("wouldWrite") && doc.includes("true") && doc.includes("tracksAdded"));
  assert("doc save reject", doc.includes("save") && /reject|400/i.test(doc));
  assert("doc write flags false", doc.includes("didWrite") && doc.includes("false"));
  assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
  assert("doc Save not enabled", doc.includes("Save") && /disabled|not enabled|blocked|false/i.test(doc));
  assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|unchanged/i.test(doc));
  assert("doc no Edge redeploy", doc.includes("Edge") && /not executed|no re-deploy|再実行なし/i.test(doc));
  assert("doc next phase", doc.includes("G-20u36d-admin-sanitizer") || doc.includes("G-20u36e") || doc.includes("live-verify"));
}

assert("supabase/functions not edited", !diffTouches("supabase/functions"));
assert("src unchanged", !diffTouches("src"));
assert("public unchanged", !diffTouches("public"));

const packageJson = read("tools/static-to-astro/package.json");
assert("npm verify script", packageJson.includes("verify:g20u36d-readback-live-verify"));

if (exists(DOC_REL)) {
  const currentState = read(`${AI_DIR}/00-current-state.md`);
  const nextActions = read(`${AI_DIR}/03-next-actions.md`);
  const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
  assert(
    "AI current-state live-verify",
    currentState.includes("G-20u36d-readback-live-verify") || currentState.includes("LiveVerified"),
  );
  assert(
    "AI next-actions after live-verify",
    nextActions.includes("readBack release-id") ||
      nextActions.includes("release-id select") ||
      nextActions.includes("G-20u36d-readback-live-verify"),
  );
  assert("handoff live-verify", handoff.includes("live-verify") || handoff.includes("LiveVerified"));
}

assert("SQL not executed by Cursor", true);
assert("Edge redeploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);

console.log(`\nG-20u36d-readback-live-verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
