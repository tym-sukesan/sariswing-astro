/**
 * G-20u43 — Gosaki Discography label controlled Save slice local implementation verifier.
 * Fixture / mock / source inspection only — no network Save · no DB write · no Edge deploy.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  G20U31_DRY_RUN_APPROVAL_ID,
  G20U36_TRACKLIST_SAVE_APPROVAL_ID,
  G20U43_CLIENT_DRY_RUN_ALLOWED_KEYS,
  G20U43_LABEL_ALBUM_TITLE,
  G20U43_LABEL_LEGACY_ID,
  G20U43_LABEL_ORIGINAL,
  G20U43_LABEL_SAVE_APPROVAL_ID,
  G20U43_LABEL_SITE_SLUG,
  G20U43_LABEL_TEMPORARY,
  G20U43_RELEASE_ALLOWED_KEYS,
  G20U43_TRACK_POLICY_ALLOWED_KEYS,
  classifyG20u43LabelUpdateOutcome,
  evaluateG20u43LabelSliceEligibility,
  resolveG20u43LabelTransition,
  validateG20u43LabelChangeAgainstCurrent,
  validateG20u43LabelSaveRequestShape,
  validateG20u43NestedSavePayload,
} from "./lib/gosaki-discography-g20u43-label-controlled-save-gate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-label-controlled-save-slice-local-implementation.md";
const HANDLER_REL = "supabase/functions/gosaki-discography-save-dry-run/handler.ts";
const ADMIN_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts";
const EDIT_TS_REL =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts";
const PANEL_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro";

const LOCK = "2026-07-10T05:59:35.138671+00:00";

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

function formalRelease(overrides = {}) {
  return {
    title: G20U43_LABEL_ALBUM_TITLE,
    artist: "新谷健介オノマトペ",
    release_date: "2015-03-21",
    label: G20U43_LABEL_ORIGINAL,
    catalog_number: "OMP-001",
    published: true,
    cover_image_url: null,
    purchase_url: null,
    streaming_url: null,
    description: "desc",
    ...overrides,
  };
}

function formalTrackPolicy(overrides = {}) {
  return {
    oneLineOneTrack: true,
    blankLinesIgnored: true,
    allowDuplicateTitles: true,
    allowEmptyTrackList: false,
    ...overrides,
  };
}

function formalClientDryRun(overrides = {}) {
  return {
    totalBefore: 2,
    totalAfter: 2,
    added: [],
    removed: [],
    reordered: false,
    wouldWrite: false,
    ...overrides,
  };
}

function baseRelease(overrides = {}) {
  return {
    title: G20U43_LABEL_ALBUM_TITLE,
    artist: "新谷健介オノマトペ",
    release_date: "2015-03-21",
    label: G20U43_LABEL_ORIGINAL,
    catalog_number: "OMP-001",
    published: true,
    cover_image_url: null,
    purchase_url: null,
    streaming_url: null,
    description: "desc",
    updated_at: LOCK,
    ...overrides,
  };
}

function baseSaveRequest(overrides = {}) {
  return {
    operation: "save",
    siteSlug: G20U43_LABEL_SITE_SLUG,
    legacyId: G20U43_LABEL_LEGACY_ID,
    approvalId: G20U43_LABEL_SAVE_APPROVAL_ID,
    expectedBeforeUpdatedAt: LOCK,
    release: formalRelease({ label: G20U43_LABEL_TEMPORARY }),
    tracksText: "Track A\nTrack B",
    trackPolicy: formalTrackPolicy(),
    clientDryRun: formalClientDryRun(),
    ...overrides,
  };
}

assert("doc exists", exists(DOC_REL));
assert("handler exists", exists(HANDLER_REL));
assert("gate lib exists", exists("tools/static-to-astro/scripts/lib/gosaki-discography-g20u43-label-controlled-save-gate.mjs"));

const doc = read(DOC_REL);
const handler = read(HANDLER_REL);
const adminTs = read(ADMIN_TS_REL);
const editTs = read(EDIT_TS_REL);
const panel = read(PANEL_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const preflight42 = read("tools/static-to-astro/docs/gosaki-discography-controlled-save-enablement-preflight.md");

assert(
  "package.json verify script",
  packageJson.includes(
    '"verify:g20u43-gosaki-discography-label-controlled-save-slice-local-implementation"',
  ),
);

assert("doc phase", doc.includes("G-20u43-gosaki-discography-label-controlled-save-slice-local-implementation"));
assert("doc LABEL_CONTROLLED_SAVE_SLICE_IMPLEMENTED true", doc.includes("LABEL_CONTROLLED_SAVE_SLICE_IMPLEMENTED: true"));
assert("doc TARGET_RESTRICTED_TO_DISCOGRAPHY_004 true", doc.includes("TARGET_RESTRICTED_TO_DISCOGRAPHY_004: true"));
assert("doc LABEL_ONLY_CHANGE_ENFORCED true", doc.includes("LABEL_ONLY_CHANGE_ENFORCED: true"));
assert("doc EXACT_TWO_WAY_TRANSITION_ENFORCED true", doc.includes("EXACT_TWO_WAY_TRANSITION_ENFORCED: true"));
assert("doc NEW_APPROVAL_ID_ENFORCED true", doc.includes("NEW_APPROVAL_ID_ENFORCED: true"));
assert("doc OPTIMISTIC_LOCK_REQUIRED true", doc.includes("OPTIMISTIC_LOCK_REQUIRED: true"));
assert("doc NESTED_PAYLOAD_ALLOWLIST_FAILS_CLOSED true", doc.includes("NESTED_PAYLOAD_ALLOWLIST_FAILS_CLOSED: true"));
assert("doc ATOMIC_LABEL_WHERE_VERIFIED true", doc.includes("ATOMIC_LABEL_WHERE_VERIFIED: true"));
assert("doc ZERO_ROW_UPDATE_TESTED true", doc.includes("ZERO_ROW_UPDATE_TESTED: true"));
assert("doc nested allowlist table", doc.includes("trackPolicy") && doc.includes("clientDryRun"));
assert("doc STAGING_PACKAGE_DEFAULT_DISARMED true", doc.includes("STAGING_PACKAGE_DEFAULT_DISARMED: true"));
assert("doc EDGE_DEPLOY_EXECUTED false", doc.includes("EDGE_DEPLOY_EXECUTED: false"));
assert("doc SAVE_REQUEST_EXECUTED false", doc.includes("SAVE_REQUEST_EXECUTED: false"));
assert("doc DB_WRITE_EXECUTED false", doc.includes("DB_WRITE_EXECUTED: false"));
assert("doc CONTROLLED_SAVE_PREFLIGHT_READY false", doc.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false"));
assert("doc not execution-ready", /not execution-ready|実行可能とはまだ|Edge deploy.*later|未 deploy/i.test(doc));

assert("handler G-20u43 approval", handler.includes(G20U43_LABEL_SAVE_APPROVAL_ID));
assert("handler label original", handler.includes(G20U43_LABEL_ORIGINAL));
assert("handler label temporary", handler.includes(G20U43_LABEL_TEMPORARY));
assert("handler discography-004", handler.includes(G20U43_LABEL_LEGACY_ID));
assert("handler G-20u43 route", handler.includes("handleControlledG20u43LabelSaveHttp"));
assert("handler keeps track-title path", handler.includes("handleControlledG20u36eSaveHttp"));
assert("handler keeps tracklist approval", handler.includes(G20U36_TRACKLIST_SAVE_APPROVAL_ID));
assert("handler returns updatedAt", handler.includes("updatedAt:") && handler.includes("updated_at:"));
assert(
  "handler UPDATE eq site_slug",
  handler.includes('.eq("site_slug", SITE_SLUG)') &&
    /\.eq\("site_slug", SITE_SLUG\)/.test(handler.slice(handler.indexOf("handleControlledG20u43LabelSaveHttp"))),
);
assert(
  "handler UPDATE eq legacy_id discography-004",
  handler.includes('.eq("legacy_id", G20U43_LABEL_LEGACY_ID)'),
);
assert(
  "handler UPDATE eq label uses transition.beforeLabel",
  /\.eq\("label", transition\.beforeLabel\)/.test(handler),
);
assert(
  "handler UPDATE eq updated_at expectedBeforeUpdatedAt",
  handler.includes('.eq("updated_at", expectedBeforeUpdatedAt)'),
);
assert("handler nested validateG20u43NestedSavePayload", handler.includes("validateG20u43NestedSavePayload"));
assert("handler classifyG20u43LabelUpdateOutcome", handler.includes("classifyG20u43LabelUpdateOutcome"));
assert(
  "gate release allowed keys exported",
  G20U43_RELEASE_ALLOWED_KEYS.length === 10,
);
assert(
  "gate trackPolicy allowed keys exported",
  G20U43_TRACK_POLICY_ALLOWED_KEYS.length === 4,
);
assert(
  "gate clientDryRun allowed keys exported",
  G20U43_CLIENT_DRY_RUN_ALLOWED_KEYS.length === 6,
);

assert("UI approval is G-20u43", adminTs.includes(G20U43_LABEL_SAVE_APPROVAL_ID));
assert("UI keeps tracklist constant", adminTs.includes(G20U36_TRACKLIST_SAVE_APPROVAL_ID));
assert(
  "UI expected Save approval is G-20u43",
  adminTs.includes("G20U41_DISCOGRAPHY_SAVE_APPROVAL_ID = G20U43_DISCOGRAPHY_LABEL_SAVE_APPROVAL_ID"),
);
assert("UI arm exact true", adminTs.includes('=== "true"') && adminTs.includes("isG20u41DiscographyOperationalSaveArmed"));
assert("UI evaluateG20u43LabelSliceEligibility", adminTs.includes("evaluateG20u43LabelSliceEligibility"));
assert("edit runtime passes g20u43LabelSlice", editTs.includes("g20u43LabelSlice"));
assert("panel label-only hint", panel.includes("label 単一変更") || panel.includes("G-20u43"));

assert("G-20u42 preflight still false", preflight42.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false"));

// --- Fixture PASS ---
assert(
  "PASS original → temporary transition",
  resolveG20u43LabelTransition(G20U43_LABEL_ORIGINAL, G20U43_LABEL_TEMPORARY).ok === true,
);
assert(
  "PASS temporary → original transition",
  resolveG20u43LabelTransition(G20U43_LABEL_TEMPORARY, G20U43_LABEL_ORIGINAL).ok === true,
);
assert(
  "PASS shape original→temporary",
  validateG20u43LabelSaveRequestShape(baseSaveRequest()).ok === true,
);
assert(
  "PASS shape temporary→original",
  validateG20u43LabelSaveRequestShape(
    baseSaveRequest({
      release: formalRelease({ label: G20U43_LABEL_ORIGINAL }),
    }),
  ).ok === true,
);
assert(
  "PASS nested formal payload original→temporary",
  validateG20u43NestedSavePayload(baseSaveRequest()).length === 0,
);
assert(
  "PASS nested formal payload temporary→original",
  validateG20u43NestedSavePayload(
    baseSaveRequest({ release: formalRelease({ label: G20U43_LABEL_ORIGINAL }) }),
  ).length === 0,
);
assert(
  "PASS eligibility original→temporary",
  evaluateG20u43LabelSliceEligibility({
    legacyId: G20U43_LABEL_LEGACY_ID,
    originalLabel: G20U43_LABEL_ORIGINAL,
    currentLabel: G20U43_LABEL_TEMPORARY,
    changedFields: ["label"],
  }).ok === true,
);
assert(
  "PASS change against current + lock",
  validateG20u43LabelChangeAgainstCurrent({
    currentRelease: baseRelease({ label: G20U43_LABEL_ORIGINAL }),
    requestedRelease: baseRelease({ label: G20U43_LABEL_TEMPORARY }),
    expectedBeforeUpdatedAt: LOCK,
  }).ok === true,
);
assert(
  "PASS approval ID exact",
  validateG20u43LabelSaveRequestShape(baseSaveRequest()).approvalId === G20U43_LABEL_SAVE_APPROVAL_ID,
);
assert(
  "PASS expectedBeforeUpdatedAt present",
  Boolean(validateG20u43LabelSaveRequestShape(baseSaveRequest()).expectedBeforeUpdatedAt),
);

// --- Fixture FAIL ---
assert(
  "FAIL other release",
  evaluateG20u43LabelSliceEligibility({
    legacyId: "discography-002",
    originalLabel: G20U43_LABEL_ORIGINAL,
    currentLabel: G20U43_LABEL_TEMPORARY,
    changedFields: ["label"],
  }).ok === false,
);
assert(
  "FAIL title change",
  validateG20u43LabelChangeAgainstCurrent({
    currentRelease: baseRelease(),
    requestedRelease: baseRelease({ title: "Other", label: G20U43_LABEL_TEMPORARY }),
    expectedBeforeUpdatedAt: LOCK,
  }).ok === false,
);
assert(
  "FAIL tracklist-only eligibility (label+tracks)",
  evaluateG20u43LabelSliceEligibility({
    legacyId: G20U43_LABEL_LEGACY_ID,
    originalLabel: G20U43_LABEL_ORIGINAL,
    currentLabel: G20U43_LABEL_TEMPORARY,
    changedFields: ["label", "tracks"],
  }).ok === false,
);
assert(
  "FAIL label + another field",
  validateG20u43LabelChangeAgainstCurrent({
    currentRelease: baseRelease(),
    requestedRelease: baseRelease({
      label: G20U43_LABEL_TEMPORARY,
      purchase_url: "https://example.com",
    }),
    expectedBeforeUpdatedAt: LOCK,
  }).ok === false,
);
assert(
  "FAIL invalid label value",
  resolveG20u43LabelTransition(G20U43_LABEL_ORIGINAL, "Some Other Label").ok === false,
);
assert(
  "FAIL before value mismatch (not allowlisted)",
  resolveG20u43LabelTransition("Wrong Before", G20U43_LABEL_TEMPORARY).ok === false,
);
assert(
  "FAIL approval old tracklist ID",
  validateG20u43LabelSaveRequestShape(
    baseSaveRequest({ approvalId: G20U36_TRACKLIST_SAVE_APPROVAL_ID }),
  ).ok === false,
);
assert(
  "FAIL approval dry-run ID",
  validateG20u43LabelSaveRequestShape(
    baseSaveRequest({ approvalId: G20U31_DRY_RUN_APPROVAL_ID }),
  ).ok === false,
);
assert(
  "FAIL approval empty",
  validateG20u43LabelSaveRequestShape(baseSaveRequest({ approvalId: "" })).ok === false,
);
assert(
  "FAIL lock missing",
  validateG20u43LabelSaveRequestShape(baseSaveRequest({ expectedBeforeUpdatedAt: "" })).ok === false,
);
assert(
  "FAIL lock conflict",
  validateG20u43LabelChangeAgainstCurrent({
    currentRelease: baseRelease(),
    requestedRelease: baseRelease({ label: G20U43_LABEL_TEMPORARY }),
    expectedBeforeUpdatedAt: "1999-01-01T00:00:00.000Z",
  }).ok === false,
);
assert(
  "FAIL service_role in payload",
  validateG20u43LabelSaveRequestShape(
    baseSaveRequest({ service_role: "x" }),
  ).ok === false,
);
assert(
  "FAIL unexpected payload key",
  validateG20u43LabelSaveRequestShape(baseSaveRequest({ evilExtra: true })).ok === false,
);
assert(
  "FAIL empty label",
  resolveG20u43LabelTransition(G20U43_LABEL_ORIGINAL, "").ok === false,
);

// --- Nested payload FAIL ---
assert(
  "FAIL release.extra",
  validateG20u43NestedSavePayload(
    baseSaveRequest({ release: { ...formalRelease({ label: G20U43_LABEL_TEMPORARY }), extra: true } }),
  ).some((e) => /unexpected release keys/.test(e)),
);
assert(
  "FAIL release null",
  validateG20u43NestedSavePayload(baseSaveRequest({ release: null })).some((e) =>
    /release must be a non-null object/.test(e),
  ),
);
assert(
  "FAIL release array",
  validateG20u43NestedSavePayload(baseSaveRequest({ release: [] })).some((e) =>
    /release must be a non-null object/.test(e),
  ),
);
assert(
  "FAIL release missing required key",
  validateG20u43NestedSavePayload(
    baseSaveRequest({
      release: {
        title: G20U43_LABEL_ALBUM_TITLE,
        artist: "x",
        label: G20U43_LABEL_TEMPORARY,
        published: true,
      },
    }),
  ).some((e) => /missing required release keys/.test(e)),
);
assert(
  "FAIL trackPolicy.extra",
  validateG20u43NestedSavePayload(
    baseSaveRequest({ trackPolicy: { ...formalTrackPolicy(), extra: true } }),
  ).some((e) => /unexpected trackPolicy keys/.test(e)),
);
assert(
  "FAIL trackPolicy array",
  validateG20u43NestedSavePayload(baseSaveRequest({ trackPolicy: [] })).some((e) =>
    /trackPolicy must be a non-null object/.test(e),
  ),
);
assert(
  "FAIL clientDryRun.extra",
  validateG20u43NestedSavePayload(
    baseSaveRequest({ clientDryRun: { ...formalClientDryRun(), extra: true } }),
  ).some((e) => /unexpected clientDryRun keys/.test(e)),
);
assert(
  "FAIL clientDryRun invalid wouldWrite type",
  validateG20u43NestedSavePayload(
    baseSaveRequest({ clientDryRun: formalClientDryRun({ wouldWrite: true }) }),
  ).some((e) => /clientDryRun.wouldWrite must be false/.test(e)),
);
assert(
  "FAIL clientDryRun missing key",
  validateG20u43NestedSavePayload(
    baseSaveRequest({
      clientDryRun: { totalBefore: 2, totalAfter: 2, added: [], removed: [], reordered: false },
    }),
  ).some((e) => /missing required clientDryRun keys/.test(e)),
);
assert(
  "FAIL release.title non-label change vs DB",
  validateG20u43LabelChangeAgainstCurrent({
    currentRelease: baseRelease({ label: G20U43_LABEL_ORIGINAL }),
    requestedRelease: formalRelease({ title: "Changed Title", label: G20U43_LABEL_TEMPORARY }),
    expectedBeforeUpdatedAt: LOCK,
  }).ok === false,
);

// --- UPDATE row count (pure helper) ---
assert(
  "FAIL update zero rows",
  classifyG20u43LabelUpdateOutcome({ updatedRows: [] }).ok === false &&
    classifyG20u43LabelUpdateOutcome({ updatedRows: [] }).reasonCode === "update_zero_rows",
);
assert(
  "FAIL update multiple rows",
  classifyG20u43LabelUpdateOutcome({
    updatedRows: [{ updated_at: LOCK }, { updated_at: LOCK }],
  }).ok === false &&
    classifyG20u43LabelUpdateOutcome({
      updatedRows: [{ updated_at: LOCK }, { updated_at: LOCK }],
    }).reasonCode === "update_multiple_rows",
);
assert(
  "FAIL success without updated_at",
  classifyG20u43LabelUpdateOutcome({ updatedRows: [{ label: G20U43_LABEL_TEMPORARY }] }).ok ===
    false &&
    classifyG20u43LabelUpdateOutcome({ updatedRows: [{ label: G20U43_LABEL_TEMPORARY }] })
      .reasonCode === "post_save_updated_at_missing",
);
assert(
  "PASS update one row with updated_at",
  classifyG20u43LabelUpdateOutcome({
    updatedRows: [{ label: G20U43_LABEL_TEMPORARY, updated_at: "2026-07-17T00:00:00.000Z" }],
  }).ok === true,
);
assert(
  "conflict outcome has no auto retry",
  classifyG20u43LabelUpdateOutcome({ updatedRows: [] }).autoRetry === false,
);

// Source: verifier must not call fetch/Save endpoint
const selfSrc = fs.readFileSync(fileURLToPath(import.meta.url), "utf8");
assert(
  "verifier has no Save network call",
  !/functions\/v1\/gosaki-discography-save-dry-run/.test(selfSrc) &&
    !/\bfetch\s*\(/.test(selfSrc),
);

assert("AI 00 G-20u43", currentState.includes("G-20u43-gosaki-discography-label-controlled-save-slice-local-implementation"));
assert("AI 03 G-20u43", nextActions.includes("G-20u43-gosaki-discography-label-controlled-save-slice-local-implementation"));
assert("handoff G-20u43", handoff.includes("G-20u43-gosaki-discography-label-controlled-save-slice-local-implementation"));
assert(
  "AI PREFLIGHT_READY false",
  currentState.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false") ||
    nextActions.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false") ||
    handoff.includes("CONTROLLED_SAVE_PREFLIGHT_READY: false"),
);

console.log("");
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) process.exit(1);
console.log("G-20u43 label controlled Save slice local implementation verifier: PASS");
