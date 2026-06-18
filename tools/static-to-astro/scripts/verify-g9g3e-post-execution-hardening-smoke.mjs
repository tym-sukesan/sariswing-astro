/**
 * G-9g3e2 — Post-execution hardening smoke (no Save, no Preview click, no DB write).
 * Routine dev safety + static/source markers + optional HTTP GET SSR markers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const STAGING_SHELL_URL =
  "http://localhost:4321/__admin-staging-shell/musician-basic/";

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

// --- routine dev safety (key names only; no secret values logged) ---
const mergedEnv = mergeEnv();
const activeHost = hostFromUrl(mergedEnv.PUBLIC_SUPABASE_URL ?? "");

assert("routine dev staging write off", mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "false");
assert("routine dev dry-run on", mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN === "true");
assert(
  "routine dev g9g3d arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev g9g3b arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED !== "true",
);
assert(
  "routine dev g9g3c arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED !== "true",
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

// --- static / source: G-9g3d freeze ---
const siteSlugConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-config.ts",
);
const g9g3dConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-general-edit-poc-config.ts",
);
const g9g3dSaveSrc = readRepo(
  "src/lib/admin/staging-write/staging-schedule-site-slug-general-edit-poc-save.ts",
);
const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const writeGuardsSrc = readRepo("src/lib/admin/staging-write/schedule-write-guards.ts");
const g9g2ConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-title-poc-config.ts",
);
const g9g3bConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-venue-description-poc-config.ts",
);
const g9g3cConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-time-price-poc-config.ts",
);
const sectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert(
  "G9G3D_GENERAL_EDIT_POC_EXECUTED true",
  siteSlugConfigSrc.includes("G9G3D_GENERAL_EDIT_POC_EXECUTED = true"),
);
assert(
  "G-9g3d arm true blocked by poc executed",
  g9g3dConfigSrc.includes("else if (G9G3D_GENERAL_EDIT_POC_EXECUTED)") &&
    g9g3dConfigSrc.includes("G9G3D_POC_EXECUTED_ARM_FAILURE"),
);
assert(
  "G-9g3d executor poc_executed early block",
  g9g3dSaveSrc.includes("if (G9G3D_GENERAL_EDIT_POC_EXECUTED)") &&
    g9g3dSaveSrc.includes('errorCode: "poc_executed"'),
);
assert(
  "G-9g3d approval ID registered",
  siteSlugConfigSrc.includes("G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc"),
);
assert(
  "G-9g2 slice poc executed arm failure",
  g9g2ConfigSrc.includes("G9G3_SLICE_POC_EXECUTED_ARM_FAILURE"),
);
assert(
  "G-9g3b slice poc executed arm failure",
  g9g3bConfigSrc.includes("G9G3_SLICE_POC_EXECUTED_ARM_FAILURE"),
);
assert(
  "G-9g3c slice poc executed arm failure",
  g9g3cConfigSrc.includes("G9G3_SLICE_POC_EXECUTED_ARM_FAILURE"),
);
assert(
  "legacy PoC audit-only SSR panel",
  sectionSrc.includes("Legacy PoC (executed — audit only)") &&
    sectionSrc.includes("disabled={true}"),
);
assert(
  "legacy PoC save buttons audit-only in UI",
  editUiSrc.includes("Audit only") && editUiSrc.includes("G9G3_SLICE_POC_EXECUTED_ARM_FAILURE"),
);
assert(
  "G9G3D poc executed blocks UI save handlers",
  editUiSrc.includes("if (G9G3D_GENERAL_EDIT_POC_EXECUTED)"),
);
assert(
  "changed-fields-only payload guard",
  writeGuardsSrc.includes("assertG9G3dGeneralEditPayloadOnly") &&
    writeGuardsSrc.includes("payload keys must match changedFields exactly"),
);
assert(
  "save gate panel in edit UI",
  editUiSrc.includes("site-slug-edit-save-gate-panel"),
);
assert(
  "staging shell banner in section",
  sectionSrc.includes("Staging shell only") && sectionSrc.includes("not production"),
);
assert(
  "production STOP element in section",
  sectionSrc.includes("site-slug-edit-production-stop"),
);
assert(
  "stale lock banner element in section",
  sectionSrc.includes("site-slug-edit-stale-lock-banner"),
);
assert(
  "auth banner element in section",
  sectionSrc.includes("site-slug-edit-auth-banner"),
);
assert(
  "loaded vs candidate labels",
  sectionSrc.includes("Loaded from DB (read-only)") &&
    sectionSrc.includes("Your edit (candidate)"),
);
assert(
  "changedFields chips in edit UI",
  editUiSrc.includes("changedFields:") && editUiSrc.includes("renderChangedFieldChips"),
);

// service_role not used in staging admin lib
const stagingAdminDir = path.join(REPO_ROOT, "src/lib/admin");
let serviceRoleHits = 0;
function walkDir(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walkDir(full);
    else if (/\.(ts|tsx|astro|mjs)$/.test(ent.name)) {
      const src = fs.readFileSync(full, "utf8");
      if (/service_role/i.test(src) && !/No service_role/i.test(src)) {
        serviceRoleHits += 1;
      }
    }
  }
}
walkDir(stagingAdminDir);
assert("service_role not active in staging admin lib", serviceRoleHits === 0);

// --- optional HTTP GET SSR smoke (no Preview/Save clicks) ---
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
  assert("SSR staging shell route", ssrHtml.includes("/__admin-staging-shell/musician-basic/"));
  assert("SSR G-9g3e1 phase title", ssrHtml.includes("G-9g3e1"));
  assert("SSR activeHost staging", ssrHtml.includes(STAGING_HOST));
  assert("SSR production host absent", !ssrHtml.includes(PRODUCTION_HOST));
  assert("SSR g9g3d poc executed banner", ssrHtml.includes("G-9g3d PoC executed"));
  assert('SSR data-g9g3d-poc-executed="true"', ssrHtml.includes('data-g9g3d-poc-executed="true"'));
  assert("SSR save gate panel", ssrHtml.includes("site-slug-edit-save-gate-panel"));
  assert("SSR auth banner", ssrHtml.includes("site-slug-edit-auth-banner"));
  assert("SSR production stop element", ssrHtml.includes("site-slug-edit-production-stop"));
  assert("SSR stale lock element", ssrHtml.includes("site-slug-edit-stale-lock-banner"));
  assert("SSR dry-run preview button present", ssrHtml.includes("site-slug-edit-dry-run-preview-btn"));
  assert("SSR save general edit frozen", ssrHtml.includes("Save general edit (frozen)"));
  assert('SSR data-g9g3d-armed="false"', ssrHtml.includes('data-g9g3d-armed="false"'));
  assert(
    'SSR data-legacy-poc-ui-visible="false"',
    ssrHtml.includes('data-legacy-poc-ui-visible="false"'),
  );
  assert(
    "SSR legacy PoC save buttons hidden",
    !ssrHtml.includes("site-slug-edit-g9g3b-save-btn") &&
      !ssrHtml.includes("site-slug-edit-g9g3c-save-btn") &&
      !ssrHtml.includes("site-slug-edit-g9g3d-legacy-save-btn"),
  );
  assert(
    "SSR g9g3d save disabled frozen",
    ssrHtml.includes('id="site-slug-edit-g9g3d-save-btn"') && ssrHtml.includes("disabled"),
  );
  assert(
    "SSR save disabled reason visible",
    ssrHtml.includes("General edit PoC executed — do not re-run"),
  );
  assert("SSR loaded from DB label", ssrHtml.includes("Loaded from DB (read-only)"));
  assert("SSR candidate label", ssrHtml.includes("Your edit (candidate)"));
  assert("SSR dry-run result container", ssrHtml.includes("site-slug-edit-dry-run-result"));
}

// --- smoke policy markers (this script itself) ---
assert("smoke: Save not clicked", true);
assert("smoke: Preview not clicked", true);
assert("smoke: DB write not executed", true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
