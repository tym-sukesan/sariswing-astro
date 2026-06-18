/**
 * G-9g3g2 — Operational Save UI gate smoke preparation (no Save, no Preview click by Cursor, no DB write).
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
const POC_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const OPERATIONAL_APPROVAL_ID =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";
const OPERATIONAL_ARM = "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";
const SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";
const SAVE_RESULT_ID = "site-slug-edit-g9g3g-operational-save-result";
const SAVE_GATE_PANEL_ID = "site-slug-edit-save-gate-panel";
const PREVIEW_BTN_ID = "site-slug-edit-dry-run-preview-btn";
const PREVIEW_RESULT_ID = "site-slug-edit-dry-run-result";
const DESCRIPTION_CANDIDATE =
  "[CMS Kit staging] G-9g3g2 gate smoke candidate — no save";
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

const smokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-operational-general-edit-ui-gate-smoke-test-result.md",
);
const smokeDocSrc = fs.existsSync(smokeDocPath)
  ? fs.readFileSync(smokeDocPath, "utf8")
  : "";

const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const operationalConfigSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-operational-general-edit-config.ts",
);
const editSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert("G-9g3g2 smoke result doc exists", smokeDocSrc.length > 0);
assert(
  "G-9g3g2 smoke phase documented",
  smokeDocSrc.includes("G-9g3g2-operational-save-ui-gate-smoke-test"),
);
assert(
  "G-9g3g2 smoke passed",
  smokeDocSrc.includes("G-9g3g2 operational Save UI gate smoke passed"),
);
assert(
  "smoke gate passed",
  smokeDocSrc.includes(
    "stagingShellScheduleSiteSlugOperationalGeneralEditUiGateSmokeTestPassed: true",
  ),
);
assert(
  "ready for g9g3g3 preflight",
  smokeDocSrc.includes("readyForG9g3g3OperationalNonDryRunPreflight: true"),
);
assert(
  "operator manual preview confirmed",
  smokeDocSrc.includes("operatorManualPreviewClicked: true"),
);
assert(
  "operator steps documented",
  smokeDocSrc.includes("Operator steps") && smokeDocSrc.includes("Step A"),
);
assert(
  "Save button id in smoke doc",
  smokeDocSrc.includes(`#${SAVE_BTN_ID}`) &&
    smokeDocSrc.includes("Save operational general edit"),
);
assert(
  "Save result panel id in smoke doc",
  smokeDocSrc.includes(`#${SAVE_RESULT_ID}`),
);
assert(
  "Save gate panel id in smoke doc",
  smokeDocSrc.includes(`#${SAVE_GATE_PANEL_ID}`),
);
assert(
  "G-9 preview button/panel in smoke doc",
  smokeDocSrc.includes(`#${PREVIEW_BTN_ID}`) &&
    smokeDocSrc.includes(`#${PREVIEW_RESULT_ID}`) &&
    smokeDocSrc.includes("G-9 site_slug general edit preview result"),
);
assert(
  "routine dev disabled expectations",
  smokeDocSrc.includes("ENABLE_ADMIN_STAGING_WRITE=false") &&
    smokeDocSrc.includes("PUBLIC_ADMIN_WRITE_DRY_RUN=true") &&
    smokeDocSrc.includes(`${OPERATIONAL_ARM}=false`),
);
assert(
  "arm off blocks Save marker",
  smokeDocSrc.includes("arm off") && smokeDocSrc.includes("Save disabled"),
);
assert(
  "preview required marker",
  smokeDocSrc.includes("no latest G-9 preview") ||
    smokeDocSrc.includes("Latest G-9 preview"),
);
assert(
  "stale blocks Save marker",
  smokeDocSrc.includes("Preview is stale") &&
    (smokeDocSrc.includes("blocks Save") || smokeDocSrc.includes("Stale blocks Save")),
);
assert(
  "PoC row blocks Save marker",
  smokeDocSrc.includes(POC_ROW_ID) && smokeDocSrc.includes("not selectable"),
);
assert(
  "legacy G-6 not valid marker",
  smokeDocSrc.includes("G-6-e2-schedule-dry-run-ui") &&
    smokeDocSrc.includes("not G-9"),
);
assert(
  "G-9g3d PoC Save frozen marker",
  smokeDocSrc.includes("g9g3d-save-btn") && smokeDocSrc.includes("frozen"),
);
assert("Save not clicked marker", smokeDocSrc.includes("Save not clicked"));
assert(
  "DB write not executed marker",
  smokeDocSrc.includes("DB write not executed") || smokeDocSrc.includes("DB write not executed"),
);
assert(
  "selected row documented",
  smokeDocSrc.includes(SELECTED_ROW_ID) &&
    smokeDocSrc.includes(SELECTED_LEGACY_ID) &&
    smokeDocSrc.includes(SITE_SLUG),
);
assert(
  "description smoke candidate documented",
  smokeDocSrc.includes(DESCRIPTION_CANDIDATE),
);
assert(
  "next phase G-9g3g3 after pass",
  smokeDocSrc.includes("G-9g3g3-operational-non-dry-run-preflight"),
);
assert(
  "changedFields description only in smoke doc",
  smokeDocSrc.includes("changedFields") &&
    smokeDocSrc.includes("description") &&
    smokeDocSrc.includes("only"),
);
assert(
  "optimisticLock stale false in smoke doc",
  smokeDocSrc.includes("optimisticLock.stale") &&
    smokeDocSrc.includes("`false`"),
);
assert(
  "hostGatePassed true in smoke doc",
  smokeDocSrc.includes("hostGatePassed") && smokeDocSrc.includes("`true`"),
);

const mergedEnv = mergeEnv();
const activeHost = hostFromUrl(mergedEnv.PUBLIC_SUPABASE_URL ?? "");

if (Object.keys(mergedEnv).length > 0) {
  assert("routine dev staging write off", mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "false");
  assert("routine dev dry-run on", mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN === "true");
  assert("routine dev g9g3g arm off", mergedEnv[OPERATIONAL_ARM] !== "true");
  assert("routine dev g9g3d arm off", mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED !== "true");
  assert("routine dev staging host", activeHost === STAGING_HOST);
  assert("routine dev not production host", activeHost !== PRODUCTION_HOST);
} else {
  console.log("SKIP routine dev env checks (.env not present in workspace)");
}

assert("G9G3G2_PHASE in config", configSrc.includes("G9G3G2_PHASE"));
assert(
  "G9G3G2 smoke description candidate constant",
  configSrc.includes("G9G3G2_GATE_SMOKE_DESCRIPTION_CANDIDATE"),
);

assert(
  "operational Save button in template",
  editSectionSrc.includes(`id="${SAVE_BTN_ID}"`) &&
    editSectionSrc.includes("Save operational general edit"),
);
assert(
  "operational Save disabled by default in template",
  editSectionSrc.includes(`id="${SAVE_BTN_ID}"`) && editSectionSrc.includes("disabled={true}"),
);
assert(
  "Save result panel in template",
  editSectionSrc.includes(`id="${SAVE_RESULT_ID}"`),
);
assert(
  "Save gate panel in template",
  editSectionSrc.includes(`id="${SAVE_GATE_PANEL_ID}"`),
);

assert(
  "canEnableG9G3gOperationalSave in UI",
  editUiSrc.includes("canEnableG9G3gOperationalSave"),
);
assert(
  "preview stale blocks Save in UI",
  editUiSrc.includes("isG9PreviewResultStale") &&
    (editUiSrc.includes("G9G3F3C_PREVIEW_STALE_MSG") ||
      editUiSrc.includes("markG9PreviewStale")),
);
assert(
  "PoC audit row block in UI",
  editUiSrc.includes("isPocAuditScheduleRow") &&
    editUiSrc.includes("PoC audit row cannot be saved"),
);
assert(
  "candidate preview mismatch blocks Save",
  editUiSrc.includes("changed since preview"),
);
assert(
  "operational config default disabled reason",
  operationalConfigSrc.includes("G9G3G_OPERATIONAL_SAVE_DISABLED_DEFAULT_REASON"),
);
assert(
  "operational approval ID in config",
  configSrc.includes(OPERATIONAL_APPROVAL_ID),
);

assert(
  "G-9g3d PoC executed frozen",
  configSrc.includes("G9G3D_GENERAL_EDIT_POC_EXECUTED = true"),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
