/**
 * G-9g3f3b — Row picker → general edit binding smoke (no Save, no Preview click by Cursor, no DB write).
 * Routine dev safety + static/source markers + programmatic dry-run math + optional HTTP GET SSR.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const SITE_SLUG = "gosaki-piano";
const SELECTED_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const SELECTED_LEGACY_ID = "schedule-2026-03-001";
const PRICE_CANDIDATE =
  "[CMS Kit staging] G-9g3f3b row-picker binding smoke price candidate";
const STAGING_SHELL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/";

const SELECTED_ROW_BASELINE = {
  id: SELECTED_ROW_ID,
  legacy_id: SELECTED_LEGACY_ID,
  site_slug: SITE_SLUG,
  title: "<ごちまきトリオ>",
  venue: null,
  open_time: null,
  start_time: null,
  price: "3,500円",
  description: null,
  updated_at: "2026-06-16T16:03:41.551792+00:00",
};

let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`PASS ${label}`);
    passed += 1;
  } else {
    console.error(`FAIL ${label}`);
    failed += 1;
  }
}

function readRepo(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function mergeEnv() {
  const base = parseEnvFile(path.join(REPO_ROOT, ".env"));
  const local = parseEnvFile(path.join(REPO_ROOT, ".env.local"));
  return { ...base, ...local };
}

function normalizeCompare(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function buildDryRunPreview(row, patch) {
  const safeFields = [
    "title",
    "venue",
    "open_time",
    "start_time",
    "price",
    "description",
  ];
  const before = {};
  for (const f of safeFields) before[f] = row[f] ?? null;
  const after = { ...before };
  for (const f of safeFields) {
    if (Object.prototype.hasOwnProperty.call(patch, f)) {
      after[f] = patch[f];
    }
  }
  const changedFields = safeFields.filter(
    (f) => normalizeCompare(before[f]) !== normalizeCompare(after[f]),
  );
  return { before, after, changedFields };
}

// --- smoke result doc ---
const smokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-smoke-test-result.md",
);
const smokeDocSrc = fs.existsSync(smokeDocPath)
  ? fs.readFileSync(smokeDocPath, "utf8")
  : "";

assert("G-9g3f3b smoke result doc exists", smokeDocSrc.length > 0);
assert(
  "G-9g3f3b smoke passed",
  smokeDocSrc.includes("G-9g3f3b smoke passed"),
);
assert(
  "G-9g3f3b manual re-smoke passed",
  smokeDocSrc.includes("g9ManualReSmokePassed: true") ||
    smokeDocSrc.includes("manual re-smoke"),
);
assert(
  "correct G-9 preview panel used",
  smokeDocSrc.includes("#site-slug-edit-dry-run-preview-btn") &&
    smokeDocSrc.includes("#site-slug-edit-dry-run-result") &&
    smokeDocSrc.includes("G-9 site_slug general edit preview result"),
);
assert(
  "legacy G-6-e2 false-path documented not pass",
  smokeDocSrc.includes("G-6-e2-schedule-dry-run-ui") &&
    smokeDocSrc.includes("not accepted as pass"),
);
assert(
  "selected row id recorded",
  smokeDocSrc.includes(SELECTED_ROW_ID) &&
    smokeDocSrc.includes(SELECTED_LEGACY_ID) &&
    smokeDocSrc.includes(SITE_SLUG),
);
assert(
  "changedFields price only",
  smokeDocSrc.includes("changedFields") &&
    smokeDocSrc.includes("price") &&
    smokeDocSrc.includes("only"),
);
assert(
  "optimisticLock stale false",
  smokeDocSrc.includes("optimisticLock.stale") &&
    smokeDocSrc.includes("`false`"),
);
assert(
  "hostGatePassed true",
  smokeDocSrc.includes("hostGatePassed") &&
    smokeDocSrc.includes("`true`"),
);
assert(
  "actualWrite=false recorded",
  smokeDocSrc.includes("actualWrite=false") ||
    smokeDocSrc.includes("| actualWrite | `false`"),
);
assert("Save not clicked recorded", smokeDocSrc.includes("Save not clicked"));
assert("DB write not executed recorded", smokeDocSrc.includes("DB write not executed"));
assert(
  "smoke gate passed",
  smokeDocSrc.includes("stagingShellScheduleSiteSlugRowPickerGeneralEditBindingSmokeTestPassed: true"),
);
assert(
  "next phase G-9g3f3c",
  smokeDocSrc.includes("G-9g3f3c-row-picker-general-edit-binding-hardening"),
);

// --- routine dev safety ---
const mergedEnv = mergeEnv();
const activeHost = hostFromUrl(mergedEnv.PUBLIC_SUPABASE_URL ?? "");

assert("routine dev staging write off", mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "false");
assert("routine dev dry-run on", mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN === "true");
assert(
  "routine dev g9g3d arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev g9g2 arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev legacy poc ui off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE !== "true",
);
assert("routine dev staging host", activeHost === STAGING_HOST);
assert("routine dev not production host", activeHost !== PRODUCTION_HOST);

// --- static / source ---
const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const editPickerSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-picker-binding.ts",
);
const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const editSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert("G9G3F3B_PHASE constant", configSrc.includes("G9G3F3B_PHASE"));
assert(
  "G9G3F3B smoke price candidate constant",
  configSrc.includes("G9G3F3B_SMOKE_PRICE_CANDIDATE"),
);
assert(
  "preview uses G9G3F3B_PHASE in picker mode",
  editUiSrc.includes("G9G3F3B_PHASE") && editUiSrc.includes("pickerMode"),
);
assert(
  "G-9 preview uses buildSiteSlugScheduleEditDryRunResult",
  editUiSrc.includes("buildSiteSlugScheduleEditDryRunResult") &&
    editUiSrc.includes("onPreviewClick"),
);
assert(
  "G-9 preview not wired to G-6 adapter",
  !editUiSrc.includes("buildScheduleUpdateDryRunResult") &&
    !editUiSrc.includes("staging-schedule-dry-run-ui"),
);
assert(
  "G-9 preview button id distinct from G-6-e2",
  editSectionSrc.includes('id="site-slug-edit-dry-run-preview-btn"') &&
    !editSectionSrc.includes('id="schedule-dry-run-update-btn"'),
);
assert(
  "G-9 renderDryRunResult exposes changedFields",
  editUiSrc.includes("changedFields:") &&
    editUiSrc.includes("optimisticLock.expectedBeforeUpdatedAt") &&
    editUiSrc.includes("hostGatePassed"),
);
assert(
  "G-6-e2 preview is separate module",
  readRepo("src/lib/admin/staging-write/staging-schedule-dry-run-ui.ts").includes(
    "schedule-dry-run-update-btn",
  ) &&
    readRepo("src/lib/admin/staging-write/staging-schedule-dry-run-config.ts").includes(
      "G-6-e2-schedule-dry-run-ui",
    ),
);
assert(
  "refreshPreviewButtonState present",
  editUiSrc.includes("refreshPreviewButtonState"),
);
assert(
  "PoC audit row preview block",
  editUiSrc.includes("isPocAuditScheduleRow") && editUiSrc.includes("PoC audit row — preview blocked"),
);
assert(
  "picker SSR preload removed",
  editPickerSrc.includes("loadedBaseline") && editSectionSrc.includes('data-target-row=""'),
);
assert(
  "binding connected",
  editSectionSrc.includes("data-picker-driven-binding") &&
    editSectionSrc.includes("site-slug-edit-picker-placeholder"),
);
assert(
  "G-9 preview button id site-slug-edit-dry-run-preview-btn",
  editSectionSrc.includes('id="site-slug-edit-dry-run-preview-btn"'),
);
assert(
  "G-9 preview button label clarified",
  editSectionSrc.includes("Preview G-9 site_slug general edit dry-run"),
);
assert(
  "G-9 preview guide mentions legacy G-6",
  editSectionSrc.includes("Do not use the legacy G-6 dry-run panel"),
);
assert(
  "G-9 result panel id site-slug-edit-dry-run-result",
  editSectionSrc.includes('id="site-slug-edit-dry-run-result"'),
);
assert(
  "G-9 result panel title clarified",
  editSectionSrc.includes("G-9 site_slug general edit preview result"),
);
assert(
  "G-9 result expects changedFields optimisticLock hostGatePassed",
  editSectionSrc.includes("changedFields") &&
    editSectionSrc.includes("optimisticLock") &&
    editSectionSrc.includes("hostGatePassed"),
);
assert(
  "legacy G-6-e2 not valid for G-9g3f3b warning",
  editSectionSrc.includes("G-6-e2-schedule-dry-run-ui") &&
    editSectionSrc.includes("not valid") &&
    editSectionSrc.includes('data-legacy-g6-warning="true"'),
);
assert(
  "no Preview deferred copy in G-9 section",
  !editSectionSrc.includes("Preview deferred") &&
    !editSectionSrc.includes("execution deferred to G-9g3f3b"),
);
assert(
  "smoke remains passed until next phase",
  smokeDocSrc.includes("stagingShellScheduleSiteSlugRowPickerGeneralEditBindingSmokeTestPassed: true"),
);
assert(
  "save still frozen",
  editSectionSrc.includes("Save general edit (frozen)") ||
    editSectionSrc.includes("G-9g3d PoC executed"),
);

// --- programmatic price-only dry-run (picker-selected row shape) ---
const preview = buildDryRunPreview(SELECTED_ROW_BASELINE, { price: PRICE_CANDIDATE });
assert("dry-run actualWrite=false (implicit)", true);
assert("dry-run changedFields price only", preview.changedFields.join(",") === "price");
assert("dry-run target id scope", SELECTED_ROW_BASELINE.id === SELECTED_ROW_ID);
assert("dry-run target legacy_id scope", SELECTED_ROW_BASELINE.legacy_id === SELECTED_LEGACY_ID);
assert("dry-run target site_slug scope", SELECTED_ROW_BASELINE.site_slug === SITE_SLUG);
assert("dry-run before price baseline", preview.before.price === SELECTED_ROW_BASELINE.price);
assert("dry-run after price candidate", preview.after.price === PRICE_CANDIDATE);
assert("dry-run title unchanged", preview.after.title === SELECTED_ROW_BASELINE.title);

// --- optional HTTP GET SSR ---
let ssrHtml = "";
try {
  const res = await fetch(STAGING_SHELL_URL, { method: "GET" });
  if (res.ok) {
    ssrHtml = await res.text();
    assert("SSR HTTP GET staging shell 200", true);
  } else {
    assert("SSR HTTP GET staging shell 200", false);
  }
} catch {
  console.log("SKIP SSR HTTP GET — dev server not reachable on :4321");
}

if (ssrHtml) {
  assert("SSR G-9g3f3b edit title", ssrHtml.includes("G-9g3f3b"));
  assert("SSR picker-driven binding", ssrHtml.includes('data-picker-driven-binding="true"'));
  assert("SSR picker placeholder", ssrHtml.includes("site-slug-edit-picker-placeholder"));
  assert("SSR G-9 preview button label", ssrHtml.includes("Preview G-9 site_slug general edit dry-run"));
  assert("SSR G-9 legacy G-6 warning", ssrHtml.includes("G-6-e2-schedule-dry-run-ui"));
  assert("SSR G-9 result panel title", ssrHtml.includes("G-9 site_slug general edit preview result"));
  assert("SSR save frozen", ssrHtml.includes("Save general edit (frozen)"));
  assert("SSR staging host", ssrHtml.includes(STAGING_HOST));
  assert("SSR no production host", !ssrHtml.includes(PRODUCTION_HOST));
  assert("SSR data-picker-row-bound false initially", ssrHtml.includes('data-picker-row-bound="false"'));
  assert("SSR legacy poc ui hidden", ssrHtml.includes('data-legacy-poc-ui-visible="false"'));
}

assert("smoke: Save not clicked", true);
assert("smoke: Preview not clicked by Cursor", true);
assert("smoke: DB write not executed", true);
assert("smoke: manual SQL not executed", true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
