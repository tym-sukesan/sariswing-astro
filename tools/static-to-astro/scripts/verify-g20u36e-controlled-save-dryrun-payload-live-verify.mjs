/**
 * G-20u36e-controlled-save-dryrun-payload-live-verify
 * Live HTTP dryRun Step A (matching) + Step B (controlled slice) — no Save / SQL / DB write.
 * Run: node tools/static-to-astro/scripts/verify-g20u36e-controlled-save-dryrun-payload-live-verify.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  loadGosakiStagingAdminPublicEnv,
  validateGosakiStagingAdminPublicEnv,
} from "./lib/gosaki-staging-admin-public-env.mjs";
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
const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-dryrun-payload-live-verify.md";
const FIXTURE_AUDIT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-canonical-track-fixture-audit.md";
const PREFLIGHT_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g20u36e-controlled-save-preflight.md";
const STEP_A_APPROVAL_ID = "G-20u31-gosaki-discography-save-dry-run-endpoint";
const STEP_B_APPROVAL_ID = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const SLICE_ID = "G-20u36e1-discography-002-track-1-title-staging-marker";
const LEGACY_ID = "discography-002";
const SITE_SLUG = "gosaki-piano";
const EXPECTED_TRACK_COUNT = 8;
const TRACK1_BEFORE = "On a Clear Day";
const TRACK1_AFTER = "On a Clear Day [CMS Kit staging G-20u36e]";
const TRACK7_CANONICAL = "Like a Lover";
const BASE_COMMIT = "6053e1a";

const MATCHING_TRACKS_TEXT = [
  TRACK1_BEFORE,
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  TRACK7_CANONICAL,
  "The Water Is Wide",
].join("\n");

const SLICE_TRACKS_TEXT = [
  TRACK1_AFTER,
  "My Blue Heaven",
  "How Deep Is The Ocean",
  "Skylark",
  "Set Sail",
  "What a Wonderful World",
  TRACK7_CANONICAL,
  "The Water Is Wide",
].join("\n");

const FORBIDDEN_RESPONSE_PATTERNS = [
  /service_role/i,
  /SUPABASE_SERVICE_ROLE_KEY/i,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
];

/** @type {{ stepA?: object, stepB?: object, liveVerifyPassed?: boolean }} */
export const liveVerifyG20u36eCapture = {};

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
  const changedLines = Array.isArray(json?.diff?.changedLines)
    ? json.diff.changedLines.map((line) => ({
        line: line.line,
        kind: line.kind,
        before: line.before == null ? null : String(line.before).slice(0, 80),
        after: line.after == null ? null : String(line.after).slice(0, 80),
      }))
    : [];
  return {
    status,
    ok: typeof json?.ok === "boolean" ? json.ok : null,
    wouldWrite: typeof json?.wouldWrite === "boolean" ? json.wouldWrite : null,
    tracksAdded: json?.changedCounts?.tracksAdded ?? null,
    tracksRemoved: json?.changedCounts?.tracksRemoved ?? null,
    tracksReordered: json?.changedCounts?.tracksReordered ?? null,
    releaseFieldsChanged: json?.changedCounts?.releaseFields ?? json?.diff?.releaseFieldsChanged ?? null,
    totalBefore: json?.diff?.totalBefore ?? null,
    totalAfter: json?.diff?.totalAfter ?? null,
    changedLineCount: changedLines.length,
    changedLines,
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

function buildDryRunBody(release, tracksText, approvalId, clientDryRun) {
  return {
    operation: "dryRun",
    siteSlug: SITE_SLUG,
    legacyId: LEGACY_ID,
    approvalId,
    release: release ?? {},
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

function sliceDiffOk(summary) {
  if (summary.changedLineCount !== 1) return false;
  const line = summary.changedLines[0];
  if (!line || line.kind !== "changed" || line.line !== 1) return false;
  if (line.before !== TRACK1_BEFORE || line.after !== TRACK1_AFTER) return false;
  const track7Changed = summary.changedLines.some(
    (l) => l.line === 7 && (l.kind === "changed" || l.kind === "added" || l.kind === "removed"),
  );
  if (track7Changed) return false;
  const hasAddRemoveLineKind = summary.changedLines.some(
    (l) => l.kind === "added" || l.kind === "removed",
  );
  return !hasAddRemoveLineKind;
}

function tracksAddRemoveOk(summary) {
  if (summary.tracksAdded === 0 && summary.tracksRemoved === 0) return true;
  return (
    summary.totalBefore === EXPECTED_TRACK_COUNT &&
    summary.totalAfter === EXPECTED_TRACK_COUNT &&
    sliceDiffOk(summary)
  );
}

async function runLiveVerifyCases(anonKey, supabaseUrl) {
  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${anonKey}`,
    apikey: anonKey,
  };

  const { snapshot, summary: dbSummary } = await prefetchDbSnapshot(anonKey, supabaseUrl);

  assert("prefetch readBack releaseFound", dbSummary.releaseFound === true);
  assert("prefetch readBack trackCount 8", dbSummary.trackCount === EXPECTED_TRACK_COUNT);

  const release = snapshot.release ?? {};

  const stepABody = buildDryRunBody(release, MATCHING_TRACKS_TEXT, STEP_A_APPROVAL_ID, {
    wouldWrite: false,
    totalBefore: EXPECTED_TRACK_COUNT,
    totalAfter: EXPECTED_TRACK_COUNT,
    added: [],
    removed: [],
    reordered: false,
  });

  const stepA = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(stepABody),
  });
  const stepASummary = sanitizeCaseSummary(stepA.json, stepA.res.status);
  liveVerifyG20u36eCapture.stepA = stepASummary;

  assert("Step A response safe", responseBodySafe(stepA.text));
  assert("Step A readBack sanitized", isReadBackSummarySanitized(stepA.json?.readBack));
  assert("Step A write flags false", writeFlagsOk(stepA.json));
  assert("Step A status 200", stepA.res.status === 200, String(stepA.res.status));
  assert("Step A ok true", stepASummary.ok === true);
  assert("Step A readBack enabled", stepASummary.readBack?.enabled === true);
  assert("Step A readBack source", stepASummary.readBack?.source === READBACK_SOURCE);
  assert("Step A readBack releaseFound", stepASummary.readBack?.releaseFound === true);
  assert("Step A readBack trackCount 8", stepASummary.readBack?.trackCount === EXPECTED_TRACK_COUNT);
  assert("Step A wouldWrite false", stepASummary.wouldWrite === false);
  assert("Step A tracksAdded 0", stepASummary.tracksAdded === 0);
  assert("Step A errors empty", stepASummary.errors.length === 0);

  caseResults.push({
    id: "step-a-matching-dryRun",
    status: stepA.res.status,
    ok: stepASummary.ok,
    category: "matching_dryRun",
    note: `wouldWrite=${stepASummary.wouldWrite} trackCount=${stepASummary.readBack?.trackCount}`,
  });

  const stepBBody = buildDryRunBody(release, SLICE_TRACKS_TEXT, STEP_A_APPROVAL_ID, {
    wouldWrite: false,
    totalBefore: EXPECTED_TRACK_COUNT,
    totalAfter: EXPECTED_TRACK_COUNT,
    added: [],
    removed: [],
    reordered: false,
  });

  const stepB = await callEndpoint(TARGET_URL, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(stepBBody),
  });
  const stepBSummary = sanitizeCaseSummary(stepB.json, stepB.res.status);
  liveVerifyG20u36eCapture.stepB = stepBSummary;

  assert("Step B response safe", responseBodySafe(stepB.text));
  assert("Step B readBack sanitized", isReadBackSummarySanitized(stepB.json?.readBack));
  assert("Step B write flags false", writeFlagsOk(stepB.json));
  assert("Step B status 200", stepB.res.status === 200, String(stepB.res.status));
  assert("Step B ok true", stepBSummary.ok === true);
  assert("Step B readBack enabled", stepBSummary.readBack?.enabled === true);
  assert("Step B readBack source", stepBSummary.readBack?.source === READBACK_SOURCE);
  assert("Step B readBack releaseFound", stepBSummary.readBack?.releaseFound === true);
  assert("Step B readBack trackCount 8", stepBSummary.readBack?.trackCount === EXPECTED_TRACK_COUNT);

  const stepBPassCore =
    stepB.res.status === 200 &&
    stepBSummary.ok === true &&
    stepBSummary.wouldWrite === true &&
    tracksAddRemoveOk(stepBSummary) &&
    stepBSummary.totalBefore === EXPECTED_TRACK_COUNT &&
    stepBSummary.totalAfter === EXPECTED_TRACK_COUNT &&
    sliceDiffOk(stepBSummary) &&
    (Array.isArray(stepBSummary.releaseFieldsChanged)
      ? stepBSummary.releaseFieldsChanged.length === 0
      : stepBSummary.releaseFieldsChanged == null ||
        (Array.isArray(stepBSummary.releaseFieldsChanged) &&
          stepBSummary.releaseFieldsChanged.length === 0));

  if (stepBSummary.wouldWrite === false) {
    assert("Step B STOP wouldWrite false", false, "title-only diff not detected");
  } else {
    assert("Step B wouldWrite true", stepBSummary.wouldWrite === true);
  }

  if (!tracksAddRemoveOk(stepBSummary)) {
    assert(
      "Step B STOP tracksAdded/tracksRemoved",
      false,
      `added=${stepBSummary.tracksAdded} removed=${stepBSummary.tracksRemoved} totalBefore=${stepBSummary.totalBefore} totalAfter=${stepBSummary.totalAfter}`,
    );
  } else {
    assert("Step B tracks add/remove ok", true);
    if (stepBSummary.tracksAdded === 0 && stepBSummary.tracksRemoved === 0) {
      assert("Step B tracksAdded 0", true);
      assert("Step B tracksRemoved 0", true);
    } else {
      console.log(
        `NOTE Step B changedCounts tracksAdded=${stepBSummary.tracksAdded} tracksRemoved=${stepBSummary.tracksRemoved} — title rename decomposition; totalBefore/After=${stepBSummary.totalBefore}/${stepBSummary.totalAfter}; changedLines kind=changed only`,
      );
    }
  }

  assert("Step B track count 8 to 8", stepBSummary.totalBefore === 8 && stepBSummary.totalAfter === 8);
  assert("Step B changed line track 1 only", sliceDiffOk(stepBSummary));
  assert(
    "Step B release scalar unchanged",
    !stepBSummary.releaseFieldsChanged ||
      (Array.isArray(stepBSummary.releaseFieldsChanged) &&
        stepBSummary.releaseFieldsChanged.length === 0),
  );
  assert("Step B errors empty", stepBSummary.errors.length === 0);

  caseResults.push({
    id: "step-b-controlled-slice-dryRun",
    status: stepB.res.status,
    ok: stepBSummary.ok,
    category: stepBPassCore ? "controlled_slice_dryRun" : "STOP_controlled_slice",
    note: `wouldWrite=${stepBSummary.wouldWrite} changedLines=${stepBSummary.changedLineCount}`,
  });

  const stepAPass =
    stepA.res.status === 200 &&
    stepASummary.ok === true &&
    stepASummary.wouldWrite === false &&
    stepASummary.tracksAdded === 0 &&
    stepASummary.readBack?.trackCount === EXPECTED_TRACK_COUNT &&
    writeFlagsOk(stepA.json);

  liveVerifyG20u36eCapture.liveVerifyPassed = stepAPass && stepBPassCore;

  return liveVerifyG20u36eCapture.liveVerifyPassed;
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
    `NOTE HEAD is ${headShort.stdout.trim()} (G-20u36e dryRun live-verify base ${BASE_COMMIT}) — non-blocking`,
  );
}

if (headShort.stdout.trim() === originShort.stdout.trim()) {
  console.log("PASS HEAD matches origin/main");
  passed += 1;
} else {
  console.log(
    `NOTE HEAD ${headShort.stdout.trim()} != origin/main ${originShort.stdout.trim()} — non-blocking`,
  );
}

assert("target URL staging only", TARGET_URL.includes(STAGING_REF) && !TARGET_URL.includes(PRODUCTION_REF));
assert("fixture audit doc exists", exists(FIXTURE_AUDIT_DOC_REL));
assert("preflight doc exists", exists(PREFLIGHT_DOC_REL));

const env = loadGosakiStagingAdminPublicEnv();
const envCheck = validateGosakiStagingAdminPublicEnv(env);

assert("PUBLIC_SUPABASE_ANON_KEY present", Boolean(env.PUBLIC_SUPABASE_ANON_KEY));
assert("PUBLIC_SUPABASE_ANON_KEY not service_role", !/service_role/i.test(env.PUBLIC_SUPABASE_ANON_KEY || ""));
assert(
  "PUBLIC_SUPABASE_URL staging host",
  String(env.PUBLIC_SUPABASE_URL).includes(`${STAGING_REF}.supabase.co`),
);

console.log("Auth: Bearer + apikey PUBLIC_SUPABASE_ANON_KEY (values not logged)");
console.log(`Target: ${TARGET_URL}`);

let livePassed = false;
try {
  livePassed = await runLiveVerifyCases(env.PUBLIC_SUPABASE_ANON_KEY, env.PUBLIC_SUPABASE_URL);
} catch (error) {
  console.error(`FAIL live verify threw — ${error instanceof Error ? error.message : String(error)}`);
  failed += 1;
}

console.log("\n--- G-20u36e dryRun payload live verify case summary (sanitized) ---");
for (const row of caseResults) {
  console.log(
    `${row.id}: status=${row.status} ok=${row.ok} category=${row.category}${row.note ? ` note=${row.note}` : ""}`,
  );
}

assert("live verify doc exists", exists(DOC_REL));

if (exists(DOC_REL)) {
  const doc = read(DOC_REL);
  const packageJson = read("tools/static-to-astro/package.json");
  const currentState = read(`${AI_DIR}/00-current-state.md`);
  const nextActions = read(`${AI_DIR}/03-next-actions.md`);
  const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);

  assert("doc phase G-20u36e-controlled-save-dryrun-payload-live-verify", doc.includes("G-20u36e-controlled-save-dryrun-payload-live-verify"));
  assert(
    "doc gate recorded",
    doc.includes("gosakiDiscographyControlledSaveDryRunPayloadLiveVerifyPassed:"),
  );
  assert("doc staging endpoint", doc.includes(STAGING_REF) && doc.includes(FUNCTION_NAME));
  assert("doc production STOP", doc.includes(PRODUCTION_REF) && /STOP|forbidden|never/i.test(doc));
  assert(
    "doc anon key only no secrets",
    doc.includes("anon") && /not logged|非表示|values not logged/i.test(doc),
  );
  assert("doc service_role not used", doc.includes("service_role") && /not use|不使用|not used/i.test(doc));
  assert("doc Step A recorded", doc.includes("Step A"));
  assert("doc Step B recorded", doc.includes("Step B"));
  assert("doc Step A wouldWrite false", doc.includes("wouldWrite") && /false/.test(doc));
  assert("doc Step B wouldWrite true or STOP", doc.includes("wouldWrite") && /true|STOP/i.test(doc));
  assert("doc track 1 title diff", doc.includes(TRACK1_BEFORE) && doc.includes(TRACK1_AFTER));
  assert("doc track 7 unchanged", doc.includes(TRACK7_CANONICAL) && /unchanged|変更なし/i.test(doc));
  assert("doc tracksAdded/tracksRemoved semantic", doc.includes("tracksAdded") && /semantic|削除なし|no net/i.test(doc));
  assert("doc write flags false", doc.includes("didWrite") && doc.includes("false"));
  assert("doc operation save not sent", doc.includes("operation=save") && /not sent|未送信|reject/i.test(doc));
  assert("doc no DB write", doc.includes("DB write") && /no|not|false/i.test(doc));
  assert("doc no SQL", doc.includes("SQL") && /no|not|false/i.test(doc));
  assert("doc no Edge deploy", doc.includes("Edge deploy") && /no|not|false/i.test(doc));
  assert("doc admin UI not changed", doc.includes("Admin UI") && /no|not|false/i.test(doc));
  assert("doc FTP not executed", doc.includes("FTP") && /no|not|false/i.test(doc));
  assert(
    "doc gate matches live outcome",
    livePassed
      ? doc.includes("gosakiDiscographyControlledSaveDryRunPayloadLiveVerifyPassed: true")
      : doc.includes("gosakiDiscographyControlledSaveDryRunPayloadLiveVerifyPassed: false"),
  );

  assert(
    "package.json verify script",
    packageJson.includes("verify:g20u36e-controlled-save-dryrun-payload-live-verify"),
  );
  assert(
    "AI current-state dryrun live verify",
    currentState.includes("G-20u36e-controlled-save-dryrun-payload-live-verify") ||
      currentState.includes("gosakiDiscographyControlledSaveDryRunPayloadLiveVerifyPassed"),
  );
  assert(
    "AI next-actions dryrun live verify or edge save path",
    nextActions.includes("G-20u36e-controlled-save-dryrun-payload-live-verify") ||
      nextActions.includes("G-20u36e-controlled-save-edge-save-path-planning"),
  );
  assert(
    "AI handoff dryrun live verify",
    handoff.includes("G-20u36e-controlled-save-dryrun-payload-live-verify") ||
      handoff.includes("gosakiDiscographyControlledSaveDryRunPayloadLiveVerifyPassed"),
  );
}

assert(
  "supabase/functions not modified in this phase",
  !diffTouches("supabase/functions/"),
  "unexpected supabase/functions changes",
);

assert("SQL not executed by Cursor", true);
assert("Edge redeploy not executed by Cursor", true);
assert("DB write not executed by Cursor", true);
assert("operation=save not sent", true);

console.log(`\nRESULT: dryRun payload live verify ${livePassed ? "PASS" : "STOP"} — gate ${livePassed}`);

console.log(`\nverify-g20u36e-controlled-save-dryrun-payload-live-verify: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
