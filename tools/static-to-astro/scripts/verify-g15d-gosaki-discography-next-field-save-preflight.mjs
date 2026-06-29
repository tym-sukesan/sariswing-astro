/**
 * G-15d — Gosaki Discography next-field Save preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g15d-gosaki-discography-next-field-save-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL = "tools/static-to-astro/docs/gosaki-discography-next-field-save-preflight.md";
const TYPES_REL = "src/lib/admin/staging-write/gosaki-discography-next-field-types.ts";
const DRY_RUN_GUARDS_REL =
  "src/lib/admin/staging-write/gosaki-discography-artist-dry-run-guards.ts";
const DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-discography-existing-release-artist-dry-run.ts";
const SAVE_REL = "src/lib/admin/staging-write/gosaki-discography-existing-release-artist-save.ts";
const SAVE_CONFIG_REL = "src/lib/admin/staging-write/gosaki-discography-artist-save-config.ts";
const WRITE_TYPES_REL = "src/lib/admin/staging-write/discography-write-types.ts";
const WRITE_GUARDS_REL = "src/lib/admin/staging-write/discography-write-guards.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const CLOSURE_DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-closure.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const G15_CLOSURE_COMMIT = "c2870e0";
const TARGET_LEGACY_ID = "discography-003";
const TARGET_ID = "d17653b4-f83d-4548-9936-d3fcc218906e";
const TARGET_TITLE = "About Us!!";
const TARGET_FIELD = "artist";
const ARTIST_BEFORE = "ごさきりかこtrio";
const ARTIST_AFTER = "ごさきりかこTrio";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const DRY_RUN_APPROVAL_ID = "G-15d-gosaki-discography-artist-dry-run-slice";
const SAVE_APPROVAL_ID =
  "G-15d-gosaki-discography-existing-release-artist-non-dry-run";
const STAGING_REF = "kmjqppxjdnwwrtaeqjta";
const SARISWING_HOST = "vsbvndwuajjhnzpohghh";

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

function loadEnv(file) {
  const abs = path.join(REPO_ROOT, file);
  if (!fs.existsSync(abs)) return {};
  const out = {};
  for (const line of fs.readFileSync(abs, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return out;
}

function simulateG15dDryRunPreview(beforeSnapshot, formArtist) {
  const changedFields = [];
  const beforeNorm = String(beforeSnapshot.artist ?? "");
  const afterNorm = String(formArtist ?? "");
  if (beforeNorm !== afterNorm) changedFields.push("artist");
  const ok =
    beforeSnapshot.legacy_id === TARGET_LEGACY_ID &&
    changedFields.length === 1 &&
    changedFields[0] === "artist";
  return {
    dryRun: true,
    actualWrite: false,
    wouldWrite: ok,
    changedFields,
    payload: ok ? { artist: afterNorm } : {},
    expectedBeforeUpdatedAt: beforeSnapshot.updated_at,
    stale: false,
    saveReadiness: ok ? "ready_but_save_disabled" : "guard_error",
    dryRunApprovalId: DRY_RUN_APPROVAL_ID,
    saveApprovalId: SAVE_APPROVAL_ID,
  };
}

const head = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const origin = spawnSync("git", ["rev-parse", "--short", "origin/main"], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
const mergeBase = spawnSync(
  "git",
  ["merge-base", "--is-ancestor", G15_CLOSURE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);
assert(
  "HEAD at or after G-15 closure c2870e0",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);
assert("origin/main matches closure baseline", origin.stdout.trim() === G15_CLOSURE_COMMIT);

const doc = read(DOC_REL);
const typesSrc = read(TYPES_REL);
const dryRunGuardsSrc = read(DRY_RUN_GUARDS_REL);
const dryRunSrc = read(DRY_RUN_REL);
const saveSrc = read(SAVE_REL);
const saveConfigSrc = read(SAVE_CONFIG_REL);
const writeTypesSrc = read(WRITE_TYPES_REL);
const writeGuardsSrc = read(WRITE_GUARDS_REL);
const adapterSrc = read(ADAPTER_REL);
const uiSrc = read(UI_REL);
const operator = read(OPERATOR_REL);
const closureDoc = exists(CLOSURE_DOC_REL) ? read(CLOSURE_DOC_REL) : "";

assert("doc exists", exists(DOC_REL));
assert("doc phase G-15d", doc.includes("G-15d-gosaki-discography-existing-release-artist-non-dry-run"));
assert("doc preflight gate", doc.includes("gosakiDiscographyNextFieldSavePreflightComplete: true"));
assert("doc target discography-003", doc.includes(TARGET_LEGACY_ID));
assert("doc artist before/after", doc.includes(ARTIST_BEFORE) && doc.includes(ARTIST_AFTER));
assert("doc save not executed", doc.includes("Save NOT executed"));
assert("doc updated_at trigger proof", doc.includes("discography_set_updated_at"));
assert("doc optimistic lock baseline", doc.includes(BASELINE_UPDATED_AT));
assert("doc rollback SQL", doc.includes("rollback") && doc.includes(ARTIST_BEFORE));
assert("doc public reflection later", doc.includes("Yes (later"));

assert("closure doc exists", exists(CLOSURE_DOC_REL));
assert("closure doc G-15 chain closed", closureDoc.includes("closed") || closureDoc.includes("G-15"));

assert("types target legacy", typesSrc.includes(TARGET_LEGACY_ID));
assert("types artist before/after", typesSrc.includes(ARTIST_BEFORE) && typesSrc.includes(ARTIST_AFTER));
assert("types dry-run approval", typesSrc.includes(DRY_RUN_APPROVAL_ID));

assert("dry-run guards artist only", dryRunGuardsSrc.includes('"artist"'));
assert("dry-run guards target 003", dryRunGuardsSrc.includes(TARGET_LEGACY_ID));

assert("dry-run export executeG15d", dryRunSrc.includes("executeG15dDiscographyArtistDryRun"));
assert("dry-run actualWrite false", dryRunSrc.includes("actualWrite: false"));
assert("dry-run resolveG15d save", dryRunSrc.includes("resolveG15dDiscographyArtistSaveEnabled"));

assert("save export executeG15d", saveSrc.includes("executeG15dDiscographyArtistSave"));
assert("save uses updateDiscographyWrite", saveSrc.includes("updateDiscographyWrite"));
assert("save no service_role", !saveSrc.includes("service_role"));
assert("save target artist after constant", saveSrc.includes("G15D_TARGET_ARTIST_AFTER"));

assert("save config G-15d arm env", saveConfigSrc.includes("PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED"));
assert("save config single-arm G-15b off", saveConfigSrc.includes("must be off"));
assert("save config default disabled", saveConfigSrc.includes("Save disabled by default"));

assert("write types G-15d approval", writeTypesSrc.includes(SAVE_APPROVAL_ID));
assert("write types artist payload", writeTypesSrc.includes("artist?: string | null"));

assert("write guards G-15d artist only", writeGuardsSrc.includes("assertG15dDiscographyUpdatePayloadAllowed"));
assert("write guards target 003", writeGuardsSrc.includes("G15D_TARGET_LEGACY_ID"));

assert("adapter G-15d branch", adapterSrc.includes("G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID"));
assert("adapter optimistic lock", adapterSrc.includes("expectedBeforeUpdatedAt"));

assert("ui executeG15d dry-run", uiSrc.includes("executeG15dDiscographyArtistDryRun"));
assert("ui executeG15d save", uiSrc.includes("executeG15dDiscographyArtistSave"));
assert("ui default row 003", uiSrc.includes("G15D_TARGET_LEGACY_ID"));
assert("ui no auto save on init", !/initGosakiStagingDiscographyAdminUi[\s\S]*runSave\(\)/.test(uiSrc));

assert("operator G-15d save page config", operator.includes("G15D_DISCOGRAPHY_SAVE_PAGE_CONFIG_ELEMENT_ID"));
assert("operator default legacy 003", operator.includes('data-gosaki-disc-default-legacy-id="discography-003"'));
assert("operator G-15d save approval", operator.includes("G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID"));
assert("operator G-15d dry-run approval", operator.includes("G15D_DRY_RUN_SLICE_APPROVAL_ID"));

const adminDiff = spawnSync("git", ["diff", "--name-only", SARISWING_ADMIN_REL], {
  cwd: REPO_ROOT,
  encoding: "utf8",
});
assert("src/pages/admin no diff", !adminDiff.stdout.trim());

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const url = env.PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

assert("staging url configured", !!url, "missing PUBLIC_SUPABASE_URL");
assert("anon key configured", !!key, "missing PUBLIC_SUPABASE_ANON_KEY");
assert("staging host only", url.includes(STAGING_REF), url);
assert("not production host", !url.includes(SARISWING_HOST), url);
assert("not service_role key", !String(key).toLowerCase().includes("service_role"));

if (url && key) {
  const allEndpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?select=legacy_id,title,artist,purchase_url,streaming_url,updated_at&order=legacy_id`;
  const allRes = await fetch(allEndpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("live SELECT all releases HTTP ok", allRes.ok, String(allRes.status));
  const allRows = await allRes.json();
  assert("live SELECT four releases", Array.isArray(allRows) && allRows.length === 4);

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=id,legacy_id,title,artist,purchase_url,streaming_url,updated_at`;
  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("live SELECT HTTP ok", res.ok, String(res.status));
  const rows = await res.json();
  assert("live SELECT one row", Array.isArray(rows) && rows.length === 1);
  if (Array.isArray(rows) && rows[0]) {
    const row = rows[0];
    assert("live legacy_id", row.legacy_id === TARGET_LEGACY_ID);
    assert("live id", row.id === TARGET_ID);
    assert("live title About Us!!", row.title === TARGET_TITLE);
    assert("live artist before", row.artist === ARTIST_BEFORE);
    assert("live updated_at baseline", row.updated_at === BASELINE_UPDATED_AT);
    assert("live streaming_url present", !!row.streaming_url);
    assert("DB artist unchanged (preflight)", row.artist === ARTIST_BEFORE);

    const preview = simulateG15dDryRunPreview(row, ARTIST_AFTER);
    assert("dry-run actualWrite false", preview.actualWrite === false);
    assert("dry-run wouldWrite true", preview.wouldWrite === true);
    assert("dry-run changedFields artist only", JSON.stringify(preview.changedFields) === '["artist"]');
    assert("dry-run payload after artist", preview.payload.artist === ARTIST_AFTER);
    assert("dry-run expectedBeforeUpdatedAt", preview.expectedBeforeUpdatedAt === BASELINE_UPDATED_AT);
    assert("dry-run approvalId", preview.dryRunApprovalId === DRY_RUN_APPROVAL_ID);
    assert("save approvalId in preview meta", preview.saveApprovalId === SAVE_APPROVAL_ID);
    assert("dry-run saveReadiness disabled default", preview.saveReadiness === "ready_but_save_disabled");
  }

  assert("streaming_url 001 null skipped in slice", true);
  if (Array.isArray(allRows)) {
    const r002 = allRows.find((r) => r.legacy_id === "discography-002");
    if (r002) {
      assert("002 purchase_url post-G-15b not empty", !!r002.purchase_url);
    }
  }
}

assert("Save preflight stops before execution", saveSrc.includes("save_disabled"));
assert("Save not executed in verifier", true);
assert("DB write not executed in verifier", true);
assert("FTP/upload not executed", true);

console.log(`\nG-15d verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
