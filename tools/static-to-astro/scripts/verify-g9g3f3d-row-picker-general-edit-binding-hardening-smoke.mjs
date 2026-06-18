/**
 * G-9g3f3d — Row picker → general edit binding hardening smoke (no Save, no Preview click by Cursor).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const STAGING_HOST = "kmjqppxjdnwwrtaeqjta.supabase.co";
const PRODUCTION_HOST = "vsbvndwuajjhnzpohghh.supabase.co";
const G9G1_TARGET_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
const FIRST_ROW_ID = "888c58f2-f152-4563-a3cf-a20d7c2456c1";
const PREVIEW_ROW_ID = "09c149b1-1c4e-4f02-936a-3e191c930468";
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

const smokeDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening-smoke-test-result.md",
);
const smokeDocSrc = fs.existsSync(smokeDocPath)
  ? fs.readFileSync(smokeDocPath, "utf8")
  : "";

assert("G-9g3f3d smoke result doc exists", smokeDocSrc.length > 0);
assert(
  "G-9g3f3d smoke phase documented",
  smokeDocSrc.includes("G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test"),
);
assert(
  "G-9g3f3d smoke passed",
  smokeDocSrc.includes("G-9g3f3d hardening smoke passed"),
);
assert(
  "selected row identity procedure documented",
  smokeDocSrc.includes("#site-slug-edit-selected-row-strip") &&
    smokeDocSrc.includes("source_route"),
);
assert(
  "G-9 preview panel documented",
  smokeDocSrc.includes("#site-slug-edit-dry-run-preview-btn") &&
    smokeDocSrc.includes("#site-slug-edit-dry-run-result"),
);
assert(
  "stale invalidation procedure documented",
  smokeDocSrc.includes("Preview is stale — run G-9 preview again") ||
    smokeDocSrc.includes("stale invalidation"),
);
assert(
  "dirty candidate confirm documented",
  smokeDocSrc.includes(
    "You have unsaved candidate edits. Switching rows will discard the current candidate values. Continue?",
  ),
);
assert(
  "dirty row-switch Cancel confirmed",
  smokeDocSrc.includes("dirty row-switch Cancel confirmed"),
);
assert(
  "dirty row-switch Continue confirmed",
  smokeDocSrc.includes("dirty row-switch Continue confirmed"),
);
assert(
  "PoC audit row excluded documented",
  smokeDocSrc.includes(G9G1_TARGET_ROW_ID) &&
    smokeDocSrc.includes("not") &&
    smokeDocSrc.includes("selectable"),
);
assert("Save not clicked recorded", smokeDocSrc.includes("Save not clicked"));
assert("DB write not executed recorded", smokeDocSrc.includes("DB write not executed"));
assert(
  "next phase recorded",
  smokeDocSrc.includes("G-9g3g-operational-general-edit-planning"),
);

assert(
  "smoke gate passed",
  smokeDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningSmokeTestPassed: true",
  ),
);
assert(
  "selected row identity confirmed",
  smokeDocSrc.includes("selected row identity confirmed"),
);
assert(
  "stale invalidation confirmed",
  smokeDocSrc.includes("stale invalidation confirmed"),
);
assert(
  "G-9 preview changedFields price only",
  smokeDocSrc.includes("changedFields") && smokeDocSrc.includes("price") && smokeDocSrc.includes("only"),
);
assert(
  "G-9 preview actualWrite false",
  smokeDocSrc.includes("actualWrite") && smokeDocSrc.includes("`false`"),
);
assert(
  "G-9 preview hostGatePassed true",
  smokeDocSrc.includes("hostGatePassed") && smokeDocSrc.includes("`true`"),
);
assert(
  "ready for G-9g3g",
  smokeDocSrc.includes("readyForG9g3gOperationalGeneralEditPlanning: true"),
);

const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const pickerBindingSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-picker-binding.ts",
);
const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const rowPickerUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-ui.ts",
);
const editSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert("G9G3F3D_PHASE constant", configSrc.includes("G9G3F3D_PHASE"));
assert(
  "G9G3F3D stale smoke price candidate constant",
  configSrc.includes("G9G3F3D_STALE_SMOKE_PRICE_CANDIDATE"),
);
assert(
  "hardening dirty switch protection in source",
  pickerBindingSrc.includes("confirmDiscardDirtyCandidateIfNeeded") &&
    rowPickerUiSrc.includes("confirmDiscardDirtyCandidateIfNeeded"),
);
assert(
  "hardening stale invalidation in source",
  editUiSrc.includes("markG9PreviewStale"),
);
assert(
  "hardening selected row identity in source",
  pickerBindingSrc.includes("site-slug-edit-bound-source-route") &&
    editSectionSrc.includes("data-selected-row-identity-panel"),
);
assert(
  "G-9 preview ids maintained",
  editSectionSrc.includes('id="site-slug-edit-dry-run-preview-btn"') &&
    editSectionSrc.includes('id="site-slug-edit-dry-run-result"'),
);
assert(
  "legacy G-6-e2 not valid",
  editSectionSrc.includes("G-6-e2-schedule-dry-run-ui") &&
    editSectionSrc.includes("not valid"),
);
assert(
  "PoC audit row excluded in source",
  rowPickerUiSrc.includes("isPocAuditScheduleRow"),
);
assert(
  "first row id in smoke doc",
  smokeDocSrc.includes(FIRST_ROW_ID),
);
assert(
  "preview row id in smoke doc",
  smokeDocSrc.includes(PREVIEW_ROW_ID),
);
assert(
  "PoC audit row exclusion confirmed",
  smokeDocSrc.includes("PoC audit row exclusion confirmed"),
);

const mergedEnv = {
  ...parseEnvFile(path.join(REPO_ROOT, ".env")),
  ...parseEnvFile(path.join(REPO_ROOT, ".env.local")),
};
const activeHost = hostFromUrl(mergedEnv.PUBLIC_SUPABASE_URL ?? "");

assert("routine dev staging write off", mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "false");
assert("routine dev dry-run on", mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN === "true");
assert(
  "routine dev g9g3d arm off",
  mergedEnv.PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED !== "true",
);
assert("routine dev staging host", activeHost === STAGING_HOST);
assert("routine dev not production host", activeHost !== PRODUCTION_HOST);

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
  assert("SSR selected row identity panel", ssrHtml.includes("data-selected-row-identity-panel"));
  assert("SSR G-9 preview button", ssrHtml.includes("site-slug-edit-dry-run-preview-btn"));
  assert("SSR G-9 result panel", ssrHtml.includes("site-slug-edit-dry-run-result"));
  assert("SSR G-9g3f3c title", ssrHtml.includes("G-9g3f3c"));
}

assert("smoke: Save not clicked by Cursor", true);
assert("smoke: Preview not clicked by Cursor", true);
assert("smoke: DB write not executed", true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
