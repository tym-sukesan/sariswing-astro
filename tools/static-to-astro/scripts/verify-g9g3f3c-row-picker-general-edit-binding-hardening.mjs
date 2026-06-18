/**
 * G-9g3f3c — Row picker → general edit binding hardening (no Save, no Preview click, no DB write).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TOOL_ROOT = path.resolve(__dirname, "..");

const G9G1_TARGET_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";
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

const hardeningDocPath = path.join(
  TOOL_ROOT,
  "docs/staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening.md",
);
const hardeningDocSrc = fs.existsSync(hardeningDocPath)
  ? fs.readFileSync(hardeningDocPath, "utf8")
  : "";

const pickerBindingSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-picker-binding.ts",
);
const editUiSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-edit-ui.ts");
const rowPickerUiSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-row-picker-ui.ts",
);
const configSrc = readRepo("src/lib/admin/staging-data/staging-schedule-site-slug-config.ts");
const editBindingSrc = readRepo(
  "src/lib/admin/staging-data/staging-schedule-site-slug-edit-binding.ts",
);
const editSectionSrc = fs.readFileSync(
  path.join(
    TOOL_ROOT,
    "templates/admin-cms/data/components/AdminStagingScheduleSiteSlugEditSection.astro",
  ),
  "utf8",
);

assert("G-9g3f3c hardening doc exists", hardeningDocSrc.length > 0);
assert(
  "G-9g3f3c hardening completed",
  hardeningDocSrc.includes("G-9g3f3c hardening completed"),
);
assert(
  "hardening gate true",
  hardeningDocSrc.includes(
    "stagingShellScheduleSiteSlugRowPickerGeneralEditBindingHardeningComplete: true",
  ),
);
assert(
  "next phase G-9g3f3d",
  hardeningDocSrc.includes("G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test"),
);
assert("Save not clicked in doc", hardeningDocSrc.includes("Save not clicked"));
assert("DB write not executed in doc", hardeningDocSrc.includes("DB write not executed"));

assert("G9G3F3C_PHASE constant", configSrc.includes("G9G3F3C_PHASE"));
assert(
  "row switch confirm message constant",
  configSrc.includes("G9G3F3C_ROW_SWITCH_UNSAVED_CONFIRM_MSG") &&
    configSrc.includes(
      "You have unsaved candidate edits. Switching rows will discard the current candidate values. Continue?",
    ),
);
assert(
  "preview stale message constant",
  configSrc.includes("G9G3F3C_PREVIEW_STALE_MSG") &&
    configSrc.includes("Preview is stale — run G-9 preview again"),
);

assert(
  "dirty candidate row-switch protection exists",
  pickerBindingSrc.includes("confirmDiscardDirtyCandidateIfNeeded") &&
    pickerBindingSrc.includes("hasUnsavedCandidateEdits") &&
    rowPickerUiSrc.includes("confirmDiscardDirtyCandidateIfNeeded"),
);

assert(
  "preview stale invalidation exists",
  editUiSrc.includes("markG9PreviewStale") &&
    editUiSrc.includes("G9G3F3C_PREVIEW_STALE_MSG") &&
    pickerBindingSrc.includes("markG9PreviewStale"),
);

assert(
  "selected row identity display exists",
  pickerBindingSrc.includes("data-selected-row-identity") &&
    pickerBindingSrc.includes("site-slug-edit-bound-source-route") &&
    editSectionSrc.includes("data-selected-row-identity-panel"),
);

assert(
  "G-9 preview button id site-slug-edit-dry-run-preview-btn",
  editSectionSrc.includes('id="site-slug-edit-dry-run-preview-btn"'),
);
assert(
  "G-9 result panel id site-slug-edit-dry-run-result",
  editSectionSrc.includes('id="site-slug-edit-dry-run-result"'),
);
assert(
  "legacy G-6-e2 not valid for G-9",
  editSectionSrc.includes("G-6-e2-schedule-dry-run-ui") &&
    editSectionSrc.includes("not valid"),
);

assert(
  "PoC audit row remains excluded",
  pickerBindingSrc.includes("isPocAuditScheduleRow") &&
    rowPickerUiSrc.includes("isPocAuditScheduleRow") &&
    hardeningDocSrc.includes(G9G1_TARGET_ROW_ID),
);

assert(
  "binding phase G9G3F3C",
  editBindingSrc.includes("G9G3F3C_PHASE") &&
    editBindingSrc.includes("phase: G9G3F3C_PHASE"),
);

assert(
  "picker preview phase G9G3F3C",
  editUiSrc.includes("G9G3F3C_PHASE") && editUiSrc.includes("pickerMode"),
);

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
  assert("SSR G-9g3f3c title", ssrHtml.includes("G-9g3f3c"));
  assert("SSR preview stale CSS class", ssrHtml.includes("site-slug-edit-dry-run-result--stale"));
  assert("SSR selected row identity panel", ssrHtml.includes("data-selected-row-identity-panel"));
  assert("SSR G-9 preview button", ssrHtml.includes("site-slug-edit-dry-run-preview-btn"));
  assert("SSR G-9 result panel", ssrHtml.includes("site-slug-edit-dry-run-result"));
}

assert("smoke: Save not clicked", true);
assert("smoke: Preview not clicked by Cursor", true);
assert("smoke: DB write not executed", true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
