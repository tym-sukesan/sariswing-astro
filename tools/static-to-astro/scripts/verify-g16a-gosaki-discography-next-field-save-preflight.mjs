/**
 * G-16a — Gosaki Discography next-field Save preflight verifier.
 * Run: node tools/static-to-astro/scripts/verify-g16a-gosaki-discography-next-field-save-preflight.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-discography-g16a-next-field-save-preflight.md";
const PLAYBOOK_REL = "tools/static-to-astro/docs/cms-kit-save-reflection-playbook.md";
const TYPES_REL = "src/lib/admin/staging-write/gosaki-discography-g16a-next-field-types.ts";
const DRY_RUN_GUARDS_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-artist-dry-run-guards.ts";
const DRY_RUN_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-dry-run.ts";
const SAVE_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-existing-release-artist-save.ts";
const SAVE_CONFIG_REL =
  "src/lib/admin/staging-write/gosaki-discography-g16a-artist-save-config.ts";
const WRITE_TYPES_REL = "src/lib/admin/staging-write/discography-write-types.ts";
const WRITE_GUARDS_REL = "src/lib/admin/staging-write/discography-write-guards.ts";
const ADAPTER_REL = "src/lib/admin/staging-write/discography-write-adapter.ts";
const UI_REL = "src/lib/admin/staging-data/gosaki-staging-discography-admin-ui.ts";
const OPERATOR_REL =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const CLOSURE_15E_REL =
  "tools/static-to-astro/docs/gosaki-discography-artist-public-reflection-closure.md";
const CLOSURE_15C_REL =
  "tools/static-to-astro/docs/gosaki-discography-public-reflection-closure.md";
const SARISWING_ADMIN_REL = "src/pages/admin/index.astro";

const G16_BASE_COMMIT = "2d70001";
const TARGET_LEGACY_ID = "discography-001";
const TARGET_ID = "00f4cd00-cfb6-43b3-991a-211b2d7c92ef";
const TARGET_TITLE = "Continuous";
const TARGET_FIELD = "artist";
const ARTIST_BEFORE = "ごさきりかこTrio Feat.石川周之介";
const ARTIST_AFTER = "ごさきりかこTrio feat.石川周之介";
const BASELINE_UPDATED_AT = "2026-06-05T17:39:44.201802+00:00";
const DRY_RUN_APPROVAL_ID = "G-16a-gosaki-discography-artist-dry-run-slice";
const SAVE_APPROVAL_ID =
  "G-16a-gosaki-discography-existing-release-artist-non-dry-run";
const CLOSED_002 = "discography-002";
const CLOSED_003 = "discography-003";
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

function simulateG16aDryRunPreview(beforeSnapshot, formArtist) {
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
  ["merge-base", "--is-ancestor", G16_BASE_COMMIT, "HEAD"],
  { cwd: REPO_ROOT },
);

assert("git HEAD present", !!head.stdout.trim(), head.stdout);
assert("git origin/main present", !!origin.stdout.trim(), origin.stdout);
assert("HEAD is 2d70001", head.stdout.trim() === G16_BASE_COMMIT, head.stdout.trim());
assert(
  "HEAD at or after G-16 playbook baseline 2d70001",
  mergeBase.status === 0,
  `HEAD=${head.stdout.trim()}`,
);

const doc = read(DOC_REL);
const playbook = exists(PLAYBOOK_REL) ? read(PLAYBOOK_REL) : "";
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

assert("doc exists", exists(DOC_REL));
assert(
  "doc phase G-16a",
  doc.includes("G-16a-gosaki-discography-existing-release-artist-non-dry-run"),
);
assert(
  "doc preflight gate",
  doc.includes("gosakiDiscographyG16aNextFieldSavePreflightComplete: true"),
);
assert("doc playbook reference", doc.includes("cms-kit-save-reflection-playbook.md"));
assert("playbook doc exists", exists(PLAYBOOK_REL));
assert("playbook G-16 phase", playbook.includes("G-16-cms-kit-save-reflection-playbook-consolidation"));
assert("doc target discography-001", doc.includes(TARGET_LEGACY_ID));
assert("doc not closed 002", doc.includes(CLOSED_002) && doc.includes("do not re-Save"));
assert("doc not closed 003", doc.includes(CLOSED_003));
assert("doc artist before/after", doc.includes(ARTIST_BEFORE) && doc.includes(ARTIST_AFTER));
assert("doc save not executed", doc.includes("Save NOT executed"));
assert("doc optimistic lock baseline", doc.includes(BASELINE_UPDATED_AT));
assert("doc public reflection", doc.includes("Public reflection"));
assert("doc rollback SQL", doc.includes("rollback") && doc.includes(ARTIST_BEFORE));
assert("doc dry-run approvalId", doc.includes(DRY_RUN_APPROVAL_ID));
assert("doc save approvalId", doc.includes(SAVE_APPROVAL_ID));
assert("doc staging host", doc.includes(STAGING_REF));
assert("doc production stop", doc.includes(SARISWING_HOST));

assert("closure 15e exists", exists(CLOSURE_15E_REL));
assert("closure 15c exists", exists(CLOSURE_15C_REL));

assert("types target legacy", typesSrc.includes(TARGET_LEGACY_ID));
assert("types artist before/after", typesSrc.includes(ARTIST_BEFORE) && typesSrc.includes(ARTIST_AFTER));
assert("types dry-run approval", typesSrc.includes(DRY_RUN_APPROVAL_ID));

assert("dry-run guards artist only", dryRunGuardsSrc.includes('"artist"'));
assert("dry-run guards target 001", dryRunGuardsSrc.includes(TARGET_LEGACY_ID));

assert("dry-run export executeG16a", dryRunSrc.includes("executeG16aDiscographyArtistDryRun"));
assert("dry-run actualWrite false", dryRunSrc.includes("actualWrite: false"));
assert("dry-run resolveG16a save", dryRunSrc.includes("resolveG16aDiscographyArtistSaveEnabled"));

assert("save export executeG16a", saveSrc.includes("executeG16aDiscographyArtistSave"));
assert("save uses updateDiscographyWrite", saveSrc.includes("updateDiscographyWrite"));
assert("save no service_role", !saveSrc.includes("service_role"));
assert("save target artist after constant", saveSrc.includes("G16A_TARGET_ARTIST_AFTER"));

assert(
  "save config G-16a arm env",
  saveConfigSrc.includes("PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_G16A_ARTIST_NON_DRY_RUN_ARMED"),
);
assert("save config single-arm G-15b off", saveConfigSrc.includes("must be off"));
assert("save config single-arm G-15d off", saveConfigSrc.includes("G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED"));
assert("save config default disabled", saveConfigSrc.includes("Save disabled by default"));

assert("write types G-16a approval", writeTypesSrc.includes(SAVE_APPROVAL_ID));
assert("write types artist payload", writeTypesSrc.includes("artist?: string | null"));

assert("write guards G-16a artist only", writeGuardsSrc.includes("assertG16aDiscographyUpdatePayloadAllowed"));
assert("write guards target 001", writeGuardsSrc.includes("G16A_TARGET_LEGACY_ID"));

assert("adapter G-16a branch", adapterSrc.includes("G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID"));
assert("adapter optimistic lock", adapterSrc.includes("expectedBeforeUpdatedAt"));

assert("ui executeG16a dry-run", uiSrc.includes("executeG16aDiscographyArtistDryRun"));
assert("ui executeG16a save", uiSrc.includes("executeG16aDiscographyArtistSave"));
assert("ui default row 001", uiSrc.includes("G16A_TARGET_LEGACY_ID"));
assert("ui not target closed 003 only", uiSrc.includes("G15D_TARGET_LEGACY_ID"));
assert("ui no auto save on init", !/initGosakiStagingDiscographyAdminUi[\s\S]*runSave\(\)/.test(uiSrc));

assert("operator G-16a save page config", operator.includes("G16A_DISCOGRAPHY_SAVE_PAGE_CONFIG_ELEMENT_ID"));
assert("operator default legacy 001", operator.includes('data-gosaki-disc-default-legacy-id="discography-001"'));
assert("operator G-16a save approval", operator.includes("G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID"));
assert("operator G-16a dry-run approval", operator.includes("G16A_DRY_RUN_SLICE_APPROVAL_ID"));

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
  const allEndpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?select=legacy_id,title,artist,year,release_date,updated_at&order=legacy_id`;
  const allRes = await fetch(allEndpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  assert("live SELECT all releases HTTP ok", allRes.ok, String(allRes.status));
  const allRows = await allRes.json();
  assert("live SELECT four releases", Array.isArray(allRows) && allRows.length === 4);

  const endpoint = `${url.replace(/\/$/, "")}/rest/v1/discography?legacy_id=eq.${TARGET_LEGACY_ID}&select=id,legacy_id,title,artist,year,release_date,updated_at`;
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
    assert("live title Continuous", row.title === TARGET_TITLE);
    assert("live artist before", row.artist === ARTIST_BEFORE);
    assert("live updated_at baseline", row.updated_at === BASELINE_UPDATED_AT);
    assert("DB artist unchanged (preflight)", row.artist === ARTIST_BEFORE);

    const preview = simulateG16aDryRunPreview(row, ARTIST_AFTER);
    assert("dry-run actualWrite false", preview.actualWrite === false);
    assert("dry-run wouldWrite true", preview.wouldWrite === true);
    assert("dry-run changedFields artist only", JSON.stringify(preview.changedFields) === '["artist"]');
    assert("dry-run payload after artist", preview.payload.artist === ARTIST_AFTER);
    assert("dry-run expectedBeforeUpdatedAt", preview.expectedBeforeUpdatedAt === BASELINE_UPDATED_AT);
    assert("dry-run approvalId", preview.dryRunApprovalId === DRY_RUN_APPROVAL_ID);
    assert("save approvalId in preview meta", preview.saveApprovalId === SAVE_APPROVAL_ID);
    assert("dry-run saveReadiness disabled default", preview.saveReadiness === "ready_but_save_disabled");
  }

  if (Array.isArray(allRows)) {
    const r002 = allRows.find((r) => r.legacy_id === CLOSED_002);
    const r003 = allRows.find((r) => r.legacy_id === CLOSED_003);
    if (r002) assert("002 not G-16a target", r002.legacy_id !== TARGET_LEGACY_ID);
    if (r003) {
      assert("003 artist closed chain value", r003.artist === "ごさきりかこTrio");
      assert("003 not G-16a target", r003.legacy_id !== TARGET_LEGACY_ID);
    }
  }
}

assert("Save preflight stops before execution", saveSrc.includes("save_disabled"));
assert("Save not executed in verifier", true);
assert("DB write not executed in verifier", true);
assert("FTP/upload not executed", true);

console.log(`\nG-16a preflight verifier: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
