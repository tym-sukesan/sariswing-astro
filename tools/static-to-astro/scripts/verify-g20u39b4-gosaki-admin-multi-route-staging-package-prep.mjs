/**
 * G-20u39b4 Gosaki admin multi-route staging package prep verifier.
 * Exercises apply() in a temp dir — no real package / FTP / Save.
 * Also verifies multi-route anon-key allowlist (attribute + value scoped).
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyGosakiStagingReadOnlyAdmin,
  GOSAKI_ADMIN_MULTI_ROUTE_PAGES,
  GOSAKI_READ_ONLY_ADMIN_MULTI_ROUTE_ATTR,
} from "./lib/gosaki-staging-read-only-admin.mjs";
import {
  acceptSupabaseAnonJwtForAllowlist,
  GOSAKI_STAGING_ADMIN_ANON_KEY_ATTR,
  isGosakiStagingAdminHtmlRelPath,
  resolveKnownGosakiStagingAnonKeyForScan,
  scanSupabaseKeyExposure,
} from "./lib/static-public-artifact-verifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL = "tools/static-to-astro/docs/gosaki-admin-multi-route-staging-package-prep.md";
const PRIOR_DOC_REL =
  "tools/static-to-astro/docs/gosaki-admin-portal-and-content-routes-local-implementation.md";
const PHASE =
  "G-20u39b4-gosaki-admin-multi-route-staging-package-and-manual-upload-prep";
const GATE = "gosakiAdminMultiRouteStagingPackagePrepComplete: true";
const RECOMMENDED_NEXT =
  "staging Edge deploy";

/** Fixture-only known anon (not a real project key). payload.role=anon */
const KNOWN_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImctMjB1MzliNC10ZXN0In0.fixture_sig_g20u39b4_anon_only";
const UNKNOWN_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InVua25vd24ifQ.fixture_sig_unknown_jwt_xx";
/** payload.role=service_role — no plaintext service_role outside JWT */
const SERVICE_ROLE_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoiZy0yMHUzeTliNCJ9.fixture_sig_service_role_xx";
/** payload has iss only — no role claim */
const ROLELESS_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJyb2xlbGVzcy1maXh0dXJlIn0.fixture_sig_roleless_xx";
const MALFORMED_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.not-valid-json!.fixture_sig_malformed";

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

function latestSection(aiText, marker) {
  const idx = aiText.indexOf(marker);
  return idx >= 0 ? aiText.slice(idx, idx + 4000) : "";
}

/**
 * @param {string} base
 * @param {string} rel
 * @param {string} html
 */
function writeHtml(base, rel, html) {
  const abs = path.join(base, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, html, "utf8");
}

/**
 * @param {string} _rel
 * @param {string} keyValue
 * @param {{ marker?: boolean, attrName?: string, wrapKeyInScript?: boolean }} [opts]
 */
function gosakiAdminHtml(_rel, keyValue, opts = {}) {
  const marker = opts.marker !== false;
  const attrName = opts.attrName ?? GOSAKI_STAGING_ADMIN_ANON_KEY_ATTR;
  const markerAttr = marker ? ' data-gosaki-read-only-admin="true"' : "";
  if (opts.wrapKeyInScript) {
    return `<!doctype html><html><body${markerAttr}><script>const k="${keyValue}";</script></body></html>`;
  }
  return `<!doctype html><html><body${markerAttr} ${attrName}="${keyValue}"></body></html>`;
}

assert("impl doc exists", exists(DOC_REL));
assert("prior b3 doc exists", exists(PRIOR_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const registry = read("tools/static-to-astro/config/sites/registry.json");
const applySrc = read(
  "tools/static-to-astro/scripts/lib/gosaki-staging-read-only-admin.mjs",
);
const scannerSrc = read(
  "tools/static-to-astro/scripts/lib/static-public-artifact-verifier.mjs",
);
const adminComponent = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
);
const packagePaths = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-package-admin-paths.ts",
);
const chromeCss = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/styles/gosaki-admin-shell-chrome.css",
);

const cs = latestSection(currentState, "G-20u39b4");
const na = latestSection(nextActions, "G-20u39b4");
const ho = latestSection(handoff, "G-20u39b4");

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(
  "STAGING_ADMIN_MULTI_ROUTE_GENERATION_IMPLEMENTED true",
  /STAGING_ADMIN_MULTI_ROUTE_GENERATION_IMPLEMENTED:\s*true/i.test(doc),
);
assert(
  "STAGING_ADMIN_MULTI_ROUTE_DRY_RUN_PASSED true",
  /STAGING_ADMIN_MULTI_ROUTE_DRY_RUN_PASSED:\s*true/i.test(doc),
);
assert("SAVE_REMAINS_DISABLED true", /SAVE_REMAINS_DISABLED:\s*true/i.test(doc));
assert(
  "PRODUCTION_ADMIN_EXCLUSION_PRESERVED true",
  /PRODUCTION_ADMIN_EXCLUSION_PRESERVED:\s*true/i.test(doc),
);
assert(
  "FRESH_PACKAGE_GENERATION_REQUIRED_AFTER_COMMIT true",
  /FRESH_PACKAGE_GENERATION_REQUIRED_AFTER_COMMIT:\s*true/i.test(doc),
);
assert(
  "MULTI_ROUTE_ANON_ALLOWLIST_FIXED true",
  /MULTI_ROUTE_ANON_ALLOWLIST_FIXED:\s*true/i.test(doc),
);
assert(
  "ALLOWLIST_IS_ATTRIBUTE_AND_VALUE_SCOPED true",
  /ALLOWLIST_IS_ATTRIBUTE_AND_VALUE_SCOPED:\s*true/i.test(doc),
);
assert(
  "SERVICE_ROLE_REMAINS_BLOCKED true",
  /SERVICE_ROLE_REMAINS_BLOCKED:\s*true/i.test(doc),
);
assert(
  "PUBLIC_HTML_KEY_EXPOSURE_REMAINS_BLOCKED true",
  /PUBLIC_HTML_KEY_EXPOSURE_REMAINS_BLOCKED:\s*true/i.test(doc),
);
assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert("no package generation claimed", /packageGenerationExecuted:\s*false/i.test(doc));
assert("no FTP claimed", /ftpUploadExecuted:\s*false/i.test(doc));

assert("package paths BASE_URL", packagePaths.includes("BASE_URL") && packagePaths.includes("admin/"));
assert("package paths schedule", packagePaths.includes("schedule/"));
assert("chrome css exists", chromeCss.includes("admin-gosaki-staging-nav"));
assert("apply lists multi routes", applySrc.includes("GOSAKI_ADMIN_MULTI_ROUTE_PAGES"));
assert("apply copies chrome components", applySrc.includes("AdminGosakiStagingOperatorHome.astro"));
assert(
  "apply copies content panels",
  applySrc.includes("AdminGosakiStagingScheduleContentPanel.astro") &&
    applySrc.includes("AdminGosakiStagingAboutContentPanel.astro") &&
    applySrc.includes("AdminGosakiStagingDiscographyContentPanel.astro") &&
    applySrc.includes("AdminGosakiStagingCompactAuthBar.astro") &&
    applySrc.includes("buildScheduleAdminEventsSnapshot"),
);
assert("apply multiRoute true", applySrc.includes("multiRoute: true"));

assert(
  "STG_MULTI_ROUTE_UI_QA_PREVIOUS_RESULT FAIL recorded",
  /STG_MULTI_ROUTE_UI_QA_PREVIOUS_RESULT:\s*FAIL/i.test(doc),
);
assert("SCHEDULE_CONTENT_UI_RESTORED true", /SCHEDULE_CONTENT_UI_RESTORED:\s*true/i.test(doc));
assert(
  "DISCOGRAPHY_CONTENT_UI_RESTORED true",
  /DISCOGRAPHY_CONTENT_UI_RESTORED:\s*true/i.test(doc),
);
assert("YOUTUBE_CONTENT_UI_RESTORED true", /YOUTUBE_CONTENT_UI_RESTORED:\s*true/i.test(doc));
assert("ABOUT_CONTENT_UI_RESTORED true", /ABOUT_CONTENT_UI_RESTORED:\s*true/i.test(doc));
assert("AUTH_UI_DEEMPHASIZED true", /AUTH_UI_DEEMPHASIZED:\s*true/i.test(doc));
assert(
  "DEVELOPER_DIAGNOSTICS_COLLAPSED true",
  /DEVELOPER_DIAGNOSTICS_COLLAPSED:\s*true/i.test(doc),
);
assert(
  "FRESH_PACKAGE_REUPLOAD_REQUIRED true",
  /FRESH_PACKAGE_REUPLOAD_REQUIRED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_STG_BROWSER_QA_PASSED true",
  /DISCOGRAPHY_STG_BROWSER_QA_PASSED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_OPERATIONAL_EDIT_UI_STG_READY true",
  /DISCOGRAPHY_OPERATIONAL_EDIT_UI_STG_READY:\s*true/i.test(doc),
);
assert(
  "P1-DISCOGRAPHY-EDIT-UI resolved",
  /P1-DISCOGRAPHY-EDIT-UI:\s*resolved/i.test(doc),
);
assert(
  "DISCOGRAPHY_DB_WRITE_EXECUTED false",
  /DISCOGRAPHY_DB_WRITE_EXECUTED:\s*false/i.test(doc),
);
assert(
  "DISCOGRAPHY_GATED_SAVE_UI_WIRED true",
  /DISCOGRAPHY_GATED_SAVE_UI_WIRED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_FIXED true",
  /DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_FIXED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_STG_FORM_LAYOUT_QA_PASSED true",
  /DISCOGRAPHY_STG_FORM_LAYOUT_QA_PASSED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_RESOLVED true",
  /DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_RESOLVED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_GATED_SAVE_UI_STG_QA_PASSED true",
  /DISCOGRAPHY_GATED_SAVE_UI_STG_QA_PASSED:\s*true/i.test(doc),
);
assert(
  "G-20u41 completed",
  /G-20u41:\s*completed/i.test(doc),
);
assert(
  "G-20u41 uploaded sourceCommit 930a2fb",
  /uploadedPackageSourceCommit:\s*930a2fb9569d510e185813e91631ab6512854c82/i.test(doc),
);
assert(
  "SAVE_NETWORK_REQUEST_EXECUTED false",
  /SAVE_NETWORK_REQUEST_EXECUTED:\s*false/i.test(doc),
);
assert(
  "DISCOGRAPHY_FIELDSET_HEADING_MOBILE_FIXED true",
  /DISCOGRAPHY_FIELDSET_HEADING_MOBILE_FIXED:\s*true/i.test(doc) ||
    /DISCOGRAPHY_FIELD_GROUP_LAYOUT_REGRESSION_FIXED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_SAVE_UI_DEDUPLICATED true",
  /DISCOGRAPHY_SAVE_UI_DEDUPLICATED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_SAVE_BUTTON_COUNT 1",
  /DISCOGRAPHY_SAVE_BUTTON_COUNT:\s*1\b/i.test(doc),
);
assert(
  "SAVE_GATE_LOGIC_UNCHANGED true",
  /SAVE_GATE_LOGIC_UNCHANGED:\s*true/i.test(doc),
);
assert(
  "DISCOGRAPHY_SAVE_DEFAULT_DISABLED true",
  /DISCOGRAPHY_SAVE_DEFAULT_DISABLED:\s*true/i.test(doc),
);
assert(
  "scanner multi-route admin path helper",
  scannerSrc.includes("isGosakiStagingAdminHtmlRelPath") &&
    scannerSrc.includes("stripAllowedGosakiStagingAdminAnonKeyAttrs"),
);
assert(
  "scanner requires known anon + attribute",
  scannerSrc.includes("GOSAKI_STAGING_ADMIN_ANON_KEY_ATTR") &&
    scannerSrc.includes("knownAnonKey"),
);
assert(
  "scanner validates JWT payload.role === anon",
  scannerSrc.includes("acceptSupabaseAnonJwtForAllowlist") &&
    scannerSrc.includes('payload.role !== "anon"'),
);

assert("component multi-route attr", adminComponent.includes(GOSAKI_READ_ONLY_ADMIN_MULTI_ROUTE_ATTR));
assert("component portal mode", adminComponent.includes('page === "portal"'));
assert("component uses OperatorHome", adminComponent.includes("AdminGosakiStagingOperatorHome"));
assert("component uses Nav", adminComponent.includes("AdminGosakiStagingNav"));
assert("component uses chips", adminComponent.includes("AdminGosakiStagingSafetyChips"));
assert(
  "component uses ScheduleContentPanel",
  adminComponent.includes("AdminGosakiStagingScheduleContentPanel"),
);
assert(
  "component uses AboutContentPanel",
  adminComponent.includes("AdminGosakiStagingAboutContentPanel"),
);
assert(
  "component uses CompactAuthBar",
  adminComponent.includes("AdminGosakiStagingCompactAuthBar"),
);
assert("component schedule route", adminComponent.includes('page === "schedule"'));
assert("component discography route", adminComponent.includes('page === "discography"'));
assert("component youtube route", adminComponent.includes('page === "youtube"'));
assert("component about route", adminComponent.includes('page === "about"'));
assert(
  "schedule not summary-only in component",
  adminComponent.includes("AdminGosakiStagingScheduleContentPanel") &&
    !/page === "schedule"[\s\S]{0,400}dashboard\.schedule\.totalEvents[\s\S]{0,80}<\/>/.test(
      adminComponent,
    ),
);
assert(
  "component uses DiscographyContentPanel",
  adminComponent.includes("AdminGosakiStagingDiscographyContentPanel"),
);
assert(
  "discography has no YouTube dry-run用 heading",
  !adminComponent.includes("Staging Auth（YouTube dry-run 用）"),
);
assert(
  "youtube has content marker + dry-run",
  adminComponent.includes('data-gosaki-youtube-content="true"') &&
    adminComponent.includes('id="gra-youtube-dry-run"'),
);
assert(
  "about uses content panel not char-count-only",
  adminComponent.includes("AdminGosakiStagingAboutContentPanel") &&
    adminComponent.includes("profileHtml={view.about.profileHtml}"),
);
const compactAuthSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingCompactAuthBar.astro",
);
const schedulePanelSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleContentPanel.astro",
);
const aboutPanelSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutContentPanel.astro",
);
const discographyPanelSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyContentPanel.astro",
);
assert(
  "discography has content marker + operational edit",
  adminComponent.includes("AdminGosakiStagingDiscographyContentPanel") &&
    discographyPanelSrc.includes('data-gosaki-discography-content="true"') &&
    discographyPanelSrc.includes('data-gosaki-discography-operational-edit="true"'),
);

assert(
  "auth credentials form marked for gated display",
  compactAuthSrc.includes('data-gosaki-auth-credentials-form="true"') &&
    adminComponent.includes("AdminGosakiStagingCompactAuthBar"),
);
assert(
  "DB probe collapsed in details",
  compactAuthSrc.includes("開発者情報（DB probe / 診断）") &&
    compactAuthSrc.includes('id="gra-admin-probe"') &&
    compactAuthSrc.includes("data-gosaki-admin-dev-details"),
);
assert(
  "schedule panel lists events",
  schedulePanelSrc.includes('data-gosaki-schedule-content="true"') &&
    schedulePanelSrc.includes("data-schedule-event"),
);
assert(
  "schedule operational edit markers",
  schedulePanelSrc.includes('data-gosaki-schedule-operational-edit="true"') &&
    schedulePanelSrc.includes("data-gosaki-schedule-view-mode") &&
    schedulePanelSrc.includes("data-gosaki-schedule-edit-mode") &&
    schedulePanelSrc.includes("data-gosaki-schedule-create-start") &&
    schedulePanelSrc.includes("data-gosaki-schedule-edit-event") &&
    schedulePanelSrc.includes("data-gosaki-schedule-operational-form") &&
    schedulePanelSrc.includes("data-gosaki-schedule-save") &&
    schedulePanelSrc.includes('data-gosaki-save-allowed="false"') &&
    schedulePanelSrc.includes("AdminGosakiStagingEditToolbar") &&
    schedulePanelSrc.includes("showDryRun={true}") &&
    schedulePanelSrc.includes("一覧へ戻る") &&
    schedulePanelSrc.includes("新しい予定を追加"),
);
assert(
  "schedule schema fields only (no invented end_time/address/url)",
  schedulePanelSrc.includes('data-field="date"') &&
    schedulePanelSrc.includes('data-field="open_time"') &&
    schedulePanelSrc.includes('data-field="start_time"') &&
    schedulePanelSrc.includes('data-field="title"') &&
    schedulePanelSrc.includes('data-field="venue"') &&
    schedulePanelSrc.includes('data-field="price"') &&
    schedulePanelSrc.includes('data-field="description"') &&
    schedulePanelSrc.includes('data-field="published"') &&
    schedulePanelSrc.includes("data-gosaki-schedule-lock-value") &&
    schedulePanelSrc.includes("data-gosaki-schedule-date-edit-note") &&
    schedulePanelSrc.includes("既存予定の日付変更は現在未対応") &&
    schedulePanelSrc.includes("data-gosaki-schedule-published-label") &&
    !schedulePanelSrc.includes('data-field="end_time"') &&
    !schedulePanelSrc.includes('data-field="address"') &&
    !schedulePanelSrc.includes('data-field="url"'),
);
assert(
  "schedule mobile-safe form CSS",
  schedulePanelSrc.includes("width: 100%") &&
    schedulePanelSrc.includes("min-width: 0") &&
    schedulePanelSrc.includes("box-sizing: border-box") &&
    schedulePanelSrc.includes("overflow-wrap: anywhere") &&
    !schedulePanelSrc.includes("overflow-x: hidden") &&
    !schedulePanelSrc.includes("transform: scale"),
);
assert(
  "schedule Save button type=button disabled default",
  schedulePanelSrc.includes('data-gosaki-schedule-save') &&
    /type="button"[\s\S]{0,280}data-gosaki-schedule-save/.test(schedulePanelSrc) &&
    /data-gosaki-schedule-save[\s\S]{0,280}\bdisabled\b/.test(schedulePanelSrc) &&
    schedulePanelSrc.includes('data-gosaki-save-allowed="false"') &&
    schedulePanelSrc.includes("更新する（無効）") &&
    schedulePanelSrc.includes("data-gosaki-schedule-save-reason") &&
    !schedulePanelSrc.includes("AdminGosakiStagingSaveDisabledStatus") &&
    !schedulePanelSrc.includes("保存する（現在は無効）") &&
    (schedulePanelSrc.match(/\bdata-gosaki-schedule-save(?:\s|=|>)/g) || []).length === 1,
);
assert(
  "about panel has profile + bands",
  aboutPanelSrc.includes('data-about-block="profile"') &&
    aboutPanelSrc.includes('data-about-block="bands"'),
);
const editToolbarSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingEditToolbar.astro",
);
const saveDisabledStatusSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingSaveDisabledStatus.astro",
);
const discographyOpEditSrc = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-discography-operational-edit.ts",
);
const scheduleOpEditSrc = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-schedule-operational-edit.ts",
);
const discographyOperatorPageSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro",
);
const discographyShellLayoutSrc = read(
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro",
);
assert(
  "discography panel view/edit mode markers",
  discographyPanelSrc.includes("data-gosaki-disc-view-mode") &&
    discographyPanelSrc.includes("data-gosaki-disc-edit-mode") &&
    discographyPanelSrc.includes('data-mode="view"') &&
    discographyPanelSrc.includes("AdminGosakiStagingEditToolbar") &&
    editToolbarSrc.includes("data-gosaki-edit-start") &&
    editToolbarSrc.includes("data-gosaki-edit-cancel"),
);
assert(
  "discography tracklist multiline textarea",
  discographyPanelSrc.includes('data-track-list-textarea="true"') &&
    discographyPanelSrc.includes("1行 = 1曲") &&
    !discographyPanelSrc.includes('name="track-1"') &&
    !discographyPanelSrc.includes("data-fixed-track-slots"),
);
assert(
  "discography edit fields present",
  discographyPanelSrc.includes('data-gosaki-disc-field="title"') &&
    discographyPanelSrc.includes('data-gosaki-disc-field="artist"') &&
    discographyPanelSrc.includes('data-gosaki-disc-field="release_date"') &&
    discographyPanelSrc.includes('data-gosaki-disc-field="label"') &&
    discographyPanelSrc.includes('data-gosaki-disc-field="purchase_url"') &&
    discographyPanelSrc.includes('data-gosaki-disc-field="description"') &&
    discographyPanelSrc.includes('data-gosaki-disc-field="tracks"'),
);
assert(
  "discography image edit deferred",
  discographyPanelSrc.includes("画像変更は後続フェーズ") &&
    !discographyPanelSrc.includes("uploadAdminImage") &&
    !discographyPanelSrc.includes("data-image-upload"),
);
assert(
  "discography unsaved guard in client",
  discographyOpEditSrc.includes("isDirty") &&
    discographyOpEditSrc.includes("UNSAVED_LEAVE") &&
    discographyOpEditSrc.includes("UNSAVED_SWITCH") &&
    discographyOpEditSrc.includes("data-gosaki-unsaved-banner"),
);
assert(
  "discography dry-run connected with gated Save wiring",
  discographyOpEditSrc.includes("buildDryRunEndpointRequest") &&
    discographyOpEditSrc.includes("buildSaveEndpointRequest") &&
    discographyOpEditSrc.includes("expectedBeforeUpdatedAt") &&
    discographyOpEditSrc.includes("dryRunInFlight") &&
    discographyOpEditSrc.includes("saveInFlight") &&
    discographyOpEditSrc.includes("dryRunLockedFingerprint") &&
    discographyOpEditSrc.includes("evaluateSaveGate") &&
    discographyOpEditSrc.includes("isSaveConflictResponse") &&
    discographyPanelSrc.includes("showDryRun={true}") &&
    discographyPanelSrc.includes('data-gosaki-disc-save-panel="true"') &&
    discographyPanelSrc.includes("data-gosaki-disc-save") &&
    discographyPanelSrc.includes("data-gosaki-disc-save-disabled-reason") &&
    discographyPanelSrc.includes("data-gosaki-disc-save-conflict") &&
    editToolbarSrc.includes("data-gosaki-edit-dry-run") &&
    saveDisabledStatusSrc.includes("data-gosaki-save-disabled"),
);
assert(
  "discography Save UI deduplicated to single disabled button",
  (discographyPanelSrc.match(/data-gosaki-disc-save(?!-)/g) || []).length === 1 &&
    discographyPanelSrc.includes('disabled') &&
    discographyPanelSrc.includes('data-gosaki-disc-save-disabled-reason') &&
    discographyPanelSrc.includes('data-gosaki-save-disabled-note="true"') &&
    !discographyPanelSrc.includes("AdminGosakiStagingSaveDisabledStatus") &&
    !discographyPanelSrc.includes("data-gosaki-save-disabled-status") &&
    !discographyPanelSrc.includes("data-gosaki-save-disabled\n") &&
    !discographyPanelSrc.includes('data-gosaki-save-disabled"'),
);
assert(
  "discography form sections use stable section+heading (no legend float hack)",
  discographyPanelSrc.includes('data-gosaki-disc-form-section="basic"') &&
    discographyPanelSrc.includes("gosaki-discography-form-section") &&
    discographyPanelSrc.includes("gosaki-discography-form-section__title") &&
    discographyPanelSrc.includes('aria-labelledby="gosaki-disc-section-basic"') &&
    !discographyPanelSrc.includes("<fieldset") &&
    !discographyPanelSrc.includes("<legend") &&
    !discographyPanelSrc.includes("float: left") &&
    !discographyPanelSrc.includes("float:left") &&
    !/__legend[\s\S]{0,120}width:\s*100%/.test(discographyPanelSrc) &&
    !/overflow-x:\s*hidden/.test(discographyPanelSrc) &&
    !/transform:\s*scale/.test(discographyPanelSrc),
);
assert(
  "discography form controls are full-width block with min-width 0",
  discographyPanelSrc.includes(".gosaki-discography-content-panel__label") &&
    discographyPanelSrc.includes("display: block") &&
    discographyPanelSrc.includes("width: 100%") &&
    discographyPanelSrc.includes("min-width: 0") &&
    discographyPanelSrc.includes("box-sizing: border-box") &&
    discographyPanelSrc.includes(".gosaki-discography-content-panel__control"),
);
assert(
  "discography edit toolbar wraps on narrow viewports",
  editToolbarSrc.includes("flex-wrap: wrap") &&
    editToolbarSrc.includes("min-height: 44px") &&
    discographyPanelSrc.includes("flex-wrap: wrap"),
);
const readOnlyAdminTs = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
);
assert(
  "discography Save endpoint reuses formal Edge URL",
  readOnlyAdminTs.includes("G20U41_DISCOGRAPHY_SAVE_ENDPOINT = G20U36C_DISCOGRAPHY_DRY_RUN_ENDPOINT") &&
    readOnlyAdminTs.includes("buildDiscographySaveEndpointRequest") &&
    readOnlyAdminTs.includes('operation: G20U41_DISCOGRAPHY_SAVE_OPERATION') &&
    readOnlyAdminTs.includes("G20U41_DISCOGRAPHY_SAVE_APPROVAL_ID"),
);
assert(
  "discography Save payload includes expectedBeforeUpdatedAt",
  readOnlyAdminTs.includes("expectedBeforeUpdatedAt: expected") &&
    readOnlyAdminTs.includes("evaluateDiscographyOperationalSaveGate"),
);
assert(
  "discography Save gate requires env arm",
  readOnlyAdminTs.includes("G20U41_DISCOGRAPHY_SAVE_UI_ARMED_ENV") &&
    readOnlyAdminTs.includes("isG20u41DiscographyOperationalSaveArmed") &&
    discographyOpEditSrc.includes("envArmed: deps.saveArmed"),
);
assert(
  "local discography operator page wires saveArmed from body dataset",
  !discographyOperatorPageSrc.includes("saveArmed: false") &&
    discographyOperatorPageSrc.includes(
      'saveArmed: body?.dataset.gosakiDiscographySaveArmed === "true"',
    ),
);
assert(
  "local discography operator page wires getAccessToken from session",
  discographyOperatorPageSrc.includes("getAccessToken: resolveDiscographyAccessToken") &&
    discographyOperatorPageSrc.includes("getStagingSupabaseClient") &&
    discographyOperatorPageSrc.includes("getSession()"),
);
assert(
  "local discography shell layout mirrors read-only admin body datasets",
  discographyShellLayoutSrc.includes("wireDiscographyOperationalRuntime") &&
    discographyShellLayoutSrc.includes("data-gosaki-discography-dry-run-endpoint") &&
    discographyShellLayoutSrc.includes("data-g20u41-discography-save-approval-id") &&
    discographyShellLayoutSrc.includes("data-gosaki-supabase-anon-key") &&
    discographyShellLayoutSrc.includes("isG20u41DiscographyOperationalSaveArmed"),
);
assert(
  "discography Save approval gate uses separate candidate and expected",
  discographyOpEditSrc.includes("candidateApprovalId") &&
    discographyOpEditSrc.includes("approvalId: candidateApprovalId") &&
    discographyOpEditSrc.includes("expectedApprovalId: deps.expectedSaveApprovalId") &&
    discographyOpEditSrc.includes("dataset.g20u41DiscographySaveApprovalId") &&
    !discographyOpEditSrc.includes("approvalId: deps.saveApprovalId") &&
    !/approvalId:\s*deps\.expectedSaveApprovalId[\s\S]{0,80}expectedApprovalId:\s*deps\.expectedSaveApprovalId/.test(
      discographyOpEditSrc,
    ) &&
    !/approvalId:\s*deps\.saveApprovalId[\s\S]{0,80}expectedApprovalId:\s*deps\.saveApprovalId/.test(
      discographyOpEditSrc,
    ),
);
assert(
  "discography Save approval gate empty candidate fails closed in helper",
  readOnlyAdminTs.includes('return { enabled: false, reason: "approval ID が空です" }') &&
    readOnlyAdminTs.includes("candidateApprovalId !== expectedApprovalId"),
);

/** Local replica of approval slice in evaluateDiscographyOperationalSaveGate (no network). */
function approvalGateFailsClosed(candidate, expected) {
  const candidateApprovalId = String(candidate ?? "").trim();
  const expectedApprovalId = String(expected ?? "").trim();
  if (!candidateApprovalId) return true; // fails closed
  if (!expectedApprovalId) return true;
  if (candidateApprovalId !== expectedApprovalId) return true;
  return false;
}
function otherSaveGatesOk() {
  return {
    authenticated: true,
    dryRunSucceeded: true,
    formMatchesDryRunSnapshot: true,
    expectedBeforeUpdatedAt: "2026-06-14T15:03:08.762993+00:00",
    saveEndpointConfigured: true,
    saveEndpointSafe: true,
    envArmed: true,
    saveInFlight: false,
  };
}
function evaluateApprovalGateLocal(approvalId, expectedApprovalId) {
  const g = otherSaveGatesOk();
  if (g.saveInFlight) return { enabled: false };
  if (!g.authenticated) return { enabled: false };
  if (!g.dryRunSucceeded) return { enabled: false };
  if (!g.formMatchesDryRunSnapshot) return { enabled: false };
  if (!String(g.expectedBeforeUpdatedAt ?? "").trim()) return { enabled: false };
  if (!g.saveEndpointConfigured || !g.saveEndpointSafe) return { enabled: false };
  if (!g.envArmed) return { enabled: false };
  const candidateApprovalId = String(approvalId ?? "").trim();
  const expected = String(expectedApprovalId ?? "").trim();
  if (!candidateApprovalId) return { enabled: false };
  if (!expected) return { enabled: false };
  if (candidateApprovalId !== expected) return { enabled: false };
  return { enabled: true };
}
const FORMAL_SAVE_APPROVAL = "G-20u43-gosaki-discography-label-controlled-save-slice";
const TRACKLIST_SAVE_APPROVAL = "G-20u36-gosaki-discography-tracklist-save-non-dry-run-slice";
const DRY_RUN_APPROVAL = "G-20u31-gosaki-discography-save-dry-run-endpoint";
assert(
  "PASS candidate approval ID = expected approval ID",
  evaluateApprovalGateLocal(FORMAL_SAVE_APPROVAL, FORMAL_SAVE_APPROVAL).enabled === true &&
    readOnlyAdminTs.includes(FORMAL_SAVE_APPROVAL) &&
    !approvalGateFailsClosed(FORMAL_SAVE_APPROVAL, FORMAL_SAVE_APPROVAL),
);
assert(
  "PASS other Save gates also required with matching approval",
  evaluateApprovalGateLocal(FORMAL_SAVE_APPROVAL, FORMAL_SAVE_APPROVAL).enabled === true &&
    readOnlyAdminTs.includes("authenticated") &&
    readOnlyAdminTs.includes("dryRunSucceeded") &&
    readOnlyAdminTs.includes("formMatchesDryRunSnapshot") &&
    readOnlyAdminTs.includes("expectedBeforeUpdatedAt") &&
    readOnlyAdminTs.includes("envArmed") &&
    readOnlyAdminTs.includes("saveInFlight"),
);
assert(
  "FAIL candidate approval ID empty",
  evaluateApprovalGateLocal("", FORMAL_SAVE_APPROVAL).enabled === false &&
    approvalGateFailsClosed("", FORMAL_SAVE_APPROVAL),
);
assert(
  "FAIL candidate approval ID is dry-run approval ID",
  evaluateApprovalGateLocal(DRY_RUN_APPROVAL, FORMAL_SAVE_APPROVAL).enabled === false &&
    DRY_RUN_APPROVAL !== FORMAL_SAVE_APPROVAL,
);
assert(
  "FAIL candidate approval ID is tracklist Save approval ID",
  evaluateApprovalGateLocal(TRACKLIST_SAVE_APPROVAL, FORMAL_SAVE_APPROVAL).enabled === false &&
    TRACKLIST_SAVE_APPROVAL !== FORMAL_SAVE_APPROVAL,
);
assert(
  "FAIL candidate approval ID is unknown value",
  evaluateApprovalGateLocal("G-unknown-approval", FORMAL_SAVE_APPROVAL).enabled === false,
);
assert(
  "FAIL same-variable dual-pass of approval IDs is absent",
  !discographyOpEditSrc.includes("approvalId: deps.saveApprovalId") &&
    !/approvalId:\s*deps\.expectedSaveApprovalId,\s*\n\s*expectedApprovalId:\s*deps\.expectedSaveApprovalId/.test(
      discographyOpEditSrc,
    ) &&
    discographyOpEditSrc.includes("approvalId: candidateApprovalId") &&
    discographyOpEditSrc.includes("expectedApprovalId: deps.expectedSaveApprovalId"),
);
assert(
  "discography post-dry-run mutation relocks Save",
  discographyOpEditSrc.includes("clearDryRunLock") &&
    discographyOpEditSrc.includes("dryRunLockedFingerprint") &&
    readOnlyAdminTs.includes("formMatchesDryRunSnapshot"),
);
assert(
  "discography conflict UI no auto retry",
  discographyOpEditSrc.includes("isSaveConflictResponse") &&
    discographyOpEditSrc.includes("clearDryRunLock") &&
    readOnlyAdminTs.includes("G20U41_DISCOGRAPHY_CONFLICT_MESSAGE") &&
    !discographyOpEditSrc.includes("retrySave") &&
    !discographyOpEditSrc.match(/conflict[\s\S]{0,200}fetch\(/),
);
assert(
  "discography Save updates updated_at on success",
  discographyOpEditSrc.includes("updateAlbumCacheUpdatedAt") &&
    discographyOpEditSrc.includes("form.dataset.expectedBeforeUpdatedAt = nextUpdatedAt"),
);
assert(
  "discography optimistic lock preserved in request builder",
  readOnlyAdminTs.includes("expectedBeforeUpdatedAt: expected") &&
    discographyOpEditSrc.includes("expectedBeforeUpdatedAt"),
);
assert(
  "shared edit chrome components exist",
  editToolbarSrc.includes("data-gosaki-edit-toolbar") &&
    saveDisabledStatusSrc.includes("保存機能は現在無効です") &&
    saveDisabledStatusSrc.includes("data-gosaki-save-disabled"),
);
assert(
  "apply copies discography content panel",
  applySrc.includes("AdminGosakiStagingDiscographyContentPanel.astro") &&
    applySrc.includes("gosaki-staging-discography-operational-edit.ts"),
);
assert(
  "apply copies schedule operational edit client",
  applySrc.includes("gosaki-staging-schedule-operational-edit.ts") &&
    applySrc.includes("AdminGosakiStagingScheduleContentPanel.astro"),
);
assert(
  "schedule operational edit client gates",
  scheduleOpEditSrc.includes("initGosakiScheduleOperationalEdit") &&
    scheduleOpEditSrc.includes("buildScheduleOperationalLocalDryRun") &&
    scheduleOpEditSrc.includes("expectedBeforeUpdatedAt") &&
    scheduleOpEditSrc.includes("saveInFlight") &&
    scheduleOpEditSrc.includes("dryRunFingerprint") &&
    scheduleOpEditSrc.includes("dryRunInFlight") &&
    scheduleOpEditSrc.includes("saveAllowed: false") &&
    scheduleOpEditSrc.includes('saveBtn.disabled = true') &&
    scheduleOpEditSrc.includes("UNSAVED_LEAVE") &&
    scheduleOpEditSrc.includes("beforeunload") &&
    scheduleOpEditSrc.includes("[data-gosaki-edit-dry-run]") &&
    !scheduleOpEditSrc.includes("service_role"),
);
assert(
  "schedule page load does not auto-fetch (click-only dry-run)",
  scheduleOpEditSrc.includes("[data-gosaki-edit-dry-run]") &&
    scheduleOpEditSrc.includes("fetchImpl") &&
    scheduleOpEditSrc.indexOf("function showView") <
      scheduleOpEditSrc.indexOf("fetchImpl(endpoint") &&
    scheduleOpEditSrc.indexOf("[data-gosaki-edit-dry-run]") <
      scheduleOpEditSrc.indexOf("fetchImpl(endpoint"),
);
assert(
  "schedule page wires operational edit with Save default disarmed",
  adminComponent.includes("initGosakiScheduleOperationalEdit") &&
    adminComponent.includes("dataset.gosakiScheduleSaveArmed === \"true\"") &&
    adminComponent.includes("data-gosaki-schedule-save-armed") &&
    adminComponent.includes("isG20u45ScheduleOperationalSaveArmed") &&
    adminComponent.includes('page === "schedule"') &&
    (adminComponent.includes("showAuth") &&
      /showAuth[\s\S]{0,120}schedule/.test(adminComponent)),
);
assert(
  "schedule snapshot includes description + updatedAt for lock",
  applySrc.includes("description: r.description") &&
    applySrc.includes("updatedAt: r.updated_at"),
);
const scheduleReadSrc = read(
  "tools/static-to-astro/scripts/lib/supabase-schedule-read.mjs",
);
assert(
  "schedule SELECT includes id + updated_at for operational lock",
  scheduleReadSrc.includes("SCHEDULE_SELECT") &&
    /GOSAKI_SCHEDULE_SELECT\s*=\s*[\s\S]{0,200}updated_at/.test(scheduleReadSrc) &&
    (scheduleReadSrc.includes('"id,legacy_id') ||
      scheduleReadSrc.includes("id,legacy_id,site_slug")),
);
assert(
  "schedule normalize retains id + updated_at (no drop)",
  scheduleReadSrc.includes("id: row.id ?? null") &&
    scheduleReadSrc.includes("updated_at: row.updated_at ?? null"),
);
assert(
  "schedule existing edit requires expectedBeforeUpdatedAt / blank lock fail-closed",
  scheduleOpEditSrc.includes("expectedBeforeUpdatedAt is required for existing-event edit") &&
    scheduleOpEditSrc.includes('input.mode === "create"') &&
    scheduleOpEditSrc.includes("? null") &&
    scheduleOpEditSrc.includes("新規作成のため対象外") &&
    scheduleOpEditSrc.includes('saveBtn.disabled = true') &&
    !scheduleOpEditSrc.includes("service_role") &&
    scheduleOpEditSrc.includes("expectedBeforeUpdatedAt missing — edit network dry-run not sent"),
);
assert(
  "schedule create does not reuse existing updated_at lock",
  scheduleOpEditSrc.includes("emptyCreateForm") &&
    /updated_at:\s*""/.test(scheduleOpEditSrc) &&
    scheduleOpEditSrc.includes("新規作成のため対象外"),
);
assert(
  "schedule create local dry-run includes date + published=false (G-22e)",
  scheduleOpEditSrc.includes("SCHEDULE_OPERATIONAL_CREATE_PREVIEW_FIELDS") &&
    scheduleOpEditSrc.includes("buildScheduleOperationalCreatePayloadPreview") &&
    scheduleOpEditSrc.includes("published: false") &&
    scheduleOpEditSrc.includes("date is required for create") &&
    scheduleOpEditSrc.includes("date must be YYYY-MM-DD") &&
    scheduleOpEditSrc.includes('field === "published"') &&
    /CREATE_PREVIEW_FIELDS[\s\S]*?"date"/.test(scheduleOpEditSrc),
);
assert(
  "schedule network dry-run + Save Edge + client wiring",
  (() => {
    const edgeHandler = read(
      "tools/static-to-astro/scripts/edge-functions/gosaki-schedule-save-dry-run/handler.ts",
    );
    const edgeIndex = read(
      "tools/static-to-astro/scripts/edge-functions/gosaki-schedule-save-dry-run/index.ts",
    );
    const supabaseEdge = read(
      "supabase/functions/gosaki-schedule-save-dry-run/handler.ts",
    );
    const adminTs = read(
      "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.ts",
    );
    const pageSrc = read(
      "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro",
    );
    return (
      edgeHandler.includes('ENDPOINT_NAME = "gosaki-schedule-save-dry-run"') &&
      edgeHandler.includes('DRY_RUN_OPERATION = "dryRun"') &&
      edgeHandler.includes('SAVE_OPERATION = "save"') &&
      edgeHandler.includes('SAVE_APPROVAL_ID = "gosaki-schedule-operational-save"') &&
      edgeHandler.includes("approvalId is required for operation=save") &&
      edgeHandler.includes("approvalId must be") &&
      edgeHandler.includes("SUPABASE_SERVICE_ROLE_CONNECTED = false") &&
      !/createServiceClient|SERVICE_ROLE_KEY/.test(edgeHandler) &&
      edgeHandler.includes("kmjqppxjdnwwrtaeqjta") &&
      edgeHandler.includes("vsbvndwuajjhnzpohghh") &&
      edgeHandler.includes("expectedBeforeUpdatedAt is required for edit") &&
      edgeHandler.includes("create published must be false") &&
      edgeHandler.includes("edit published must be boolean") &&
      edgeHandler.includes("edit payload must not include date") &&
      edgeHandler.includes('"published"') &&
      /EDIT_SAFE_FIELDS[\s\S]*?"published"/.test(edgeHandler) &&
      edgeHandler.includes("legacy_id collision — create Save rejected") &&
      edgeHandler.includes("create must not reuse id / legacyId") &&
      edgeHandler.includes("no changed fields — Save rejected") &&
      edgeHandler.includes("buildCreateInsertRow") &&
      edgeHandler.includes("createDefaultUpdateAdapter") &&
      edgeHandler.includes("createDefaultInsertAdapter") &&
      edgeHandler.includes('rpc("is_admin")') &&
      edgeIndex.includes("handleScheduleEdgeDryRunHttpAsync") &&
      !edgeIndex.includes("skipAdminProbe") &&
      supabaseEdge.includes('ENDPOINT_NAME = "gosaki-schedule-save-dry-run"') &&
      supabaseEdge.includes('SAVE_APPROVAL_ID = "gosaki-schedule-operational-save"') &&
      supabaseEdge.includes("edit published must be boolean") &&
      read("supabase/config.toml").includes("[functions.gosaki-schedule-save-dry-run]") &&
      /\[functions\.gosaki-schedule-save-dry-run\]\s*\nverify_jwt\s*=\s*true/.test(
        read("supabase/config.toml"),
      ) &&
      adminTs.includes("PUBLIC_GOSAKI_SCHEDULE_DRY_RUN_ENDPOINT") &&
      adminTs.includes("PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED") &&
      adminTs.includes('G20U45_SCHEDULE_SAVE_APPROVAL_ID = "gosaki-schedule-operational-save"') &&
      adminTs.includes("buildScheduleDryRunEndpointRequest") &&
      adminTs.includes("buildScheduleSaveEndpointRequest") &&
      adminTs.includes("sanitizeScheduleDryRunEndpointDisplay") &&
      adminTs.includes("sanitizeScheduleSaveEndpointDisplay") &&
      adminTs.includes("evaluateScheduleOperationalSaveGate") &&
      adminTs.includes('operation: G20U45_SCHEDULE_DRY_RUN_OPERATION') &&
      adminTs.includes('operation: G20U45_SCHEDULE_SAVE_OPERATION') &&
      /G20U45_SCHEDULE_EDIT_SAFE_FIELDS[\s\S]*?"published"/.test(adminTs) &&
      !adminTs.includes("G-20u45-schedule") &&
      pageSrc.includes("data-gosaki-schedule-dry-run-endpoint") &&
      pageSrc.includes("data-gosaki-schedule-save-armed") &&
      pageSrc.includes("buildScheduleDryRunEndpointRequest") &&
      pageSrc.includes("buildScheduleSaveEndpointRequest") &&
      pageSrc.includes("dataset.gosakiScheduleSaveArmed === \"true\"") &&
      scheduleOpEditSrc.includes("dryRunInFlight") &&
      scheduleOpEditSrc.includes("saveInFlight") &&
      scheduleOpEditSrc.includes("access token required") &&
      scheduleOpEditSrc.includes("expectedBeforeUpdatedAt missing") &&
      scheduleOpEditSrc.includes("operation must be dryRun only") &&
      scheduleOpEditSrc.includes("evaluateSaveGate") &&
      scheduleOpEditSrc.includes("buildSaveEndpointRequest") &&
      scheduleOpEditSrc.includes("didWrite") &&
      scheduleOpEditSrc.includes("dbWrite") &&
      scheduleOpEditSrc.includes("networkWrite") &&
      scheduleOpEditSrc.includes("saveArmed === true && gate.enabled === true") &&
      scheduleOpEditSrc.includes('saveOperation ?? "save"') &&
      scheduleOpEditSrc.includes("既存予定の日付変更は現在未対応") &&
      scheduleOpEditSrc.includes("applyModeFieldLocks") &&
      scheduleOpEditSrc.includes("非公開で作成") &&
      scheduleOpEditSrc.includes("SAVE_LABEL_ENABLED") &&
      scheduleOpEditSrc.includes("applySaveButtonUi") &&
      scheduleOpEditSrc.includes("Endpoint 契約 · UI gate ではない") &&
      !scheduleOpEditSrc.includes("Save は無効のままです。operation=save は送信しません。") &&
      /SCHEDULE_OPERATIONAL_SAFE_FIELDS[\s\S]*?"published"/.test(scheduleOpEditSrc)
    );
  })(),
);
assert(
  "about panel form affordance markers",
  aboutPanelSrc.includes('data-gosaki-about-form-affordance="true"') &&
    aboutPanelSrc.includes('data-gosaki-about-edit-section="true"') &&
    aboutPanelSrc.includes('data-gosaki-about-form="profile"') &&
    aboutPanelSrc.includes('data-gosaki-about-form="bands"'),
);
assert(
  "about panel profile readonly form controls",
  aboutPanelSrc.includes('data-gosaki-about-field="profile-heading"') &&
    aboutPanelSrc.includes('data-gosaki-about-field="profile-body"') &&
    aboutPanelSrc.includes('data-gosaki-about-field="profile-image"') &&
    aboutPanelSrc.includes('data-gosaki-about-field="profile-image-alt"') &&
    aboutPanelSrc.includes('readonly') &&
    aboutPanelSrc.includes('aria-readonly="true"') &&
    !/data-gosaki-about-field="profile-body"[\s\S]{0,120}\bdisabled\b/.test(aboutPanelSrc),
);
assert(
  "about panel bands readonly form controls",
  aboutPanelSrc.includes('data-gosaki-about-field="band-name"') &&
    aboutPanelSrc.includes('data-gosaki-about-field="band-body"') &&
    aboutPanelSrc.includes('data-gosaki-about-field="band-image"') &&
    aboutPanelSrc.includes('data-gosaki-about-field="band-image-alt"') &&
    aboutPanelSrc.includes("parseBandForms") &&
    aboutPanelSrc.includes("band-profile"),
);
assert(
  "about edit section before public preview",
  aboutPanelSrc.indexOf('data-gosaki-about-edit-section="true"') <
    aboutPanelSrc.indexOf('data-gosaki-about-public-preview="true"') &&
    aboutPanelSrc.indexOf('id="gosaki-about-edit-heading"') <
      aboutPanelSrc.indexOf('id="gosaki-about-public-preview-heading"'),
);
assert(
  "about preview responsive iframe + viewport",
  aboutPanelSrc.includes('data-gosaki-about-preview-frame="true"') &&
    aboutPanelSrc.includes('data-gosaki-about-preview-responsive="true"') &&
    aboutPanelSrc.includes('data-gosaki-about-preview-iframe="true"') &&
    aboutPanelSrc.includes('name="viewport"') &&
    aboutPanelSrc.includes("width=device-width") &&
    aboutPanelSrc.includes("buildAboutPreviewSrcdoc") &&
    aboutPanelSrc.includes("max-width: 100%") &&
    aboutPanelSrc.includes("min-width: 0") &&
    aboutPanelSrc.includes("box-sizing: border-box") &&
    !aboutPanelSrc.includes("overflow-x: hidden") &&
    !aboutPanelSrc.includes("transform: scale"),
);
assert(
  "about save remains disabled in panel",
  aboutPanelSrc.includes('data-gosaki-about-save-disabled="true"') &&
    aboutPanelSrc.includes("data-gosaki-about-save-disabled") &&
    aboutPanelSrc.includes("disabled") &&
    !aboutPanelSrc.includes("executeAbout") &&
    !aboutPanelSrc.includes("onSubmit"),
);
assert(
  "about panel no fixed min-width overflow trap",
  !/min-width:\s*(9[6-9]0|1\d{3})px/.test(aboutPanelSrc) &&
    !aboutPanelSrc.includes("overflow-x: hidden"),
);
const aboutAdminCss = read(
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/gosaki-staging-read-only-admin.css",
);
assert(
  "about admin preview CSS is responsive (not clip-only)",
  aboutAdminCss.includes(".gosaki-about-admin-preview-frame") &&
    aboutAdminCss.includes(".gosaki-about-admin-preview-frame__iframe") &&
    aboutAdminCss.includes("max-width: 100%") &&
    aboutAdminCss.includes("min-width: 0") &&
    !/\.gosaki-about-admin-preview-frame[^{]*\{[^}]*overflow-x:\s*hidden/.test(aboutAdminCss) &&
    !aboutAdminCss.includes("transform: scale("),
);
assert(
  "STG about route order: content panel then developer details",
  /page === "about"[\s\S]*AdminGosakiStagingAboutContentPanel[\s\S]*data-gosaki-admin-dev-details/.test(
    adminComponent,
  ) &&
    adminComponent.includes("<summary>開発者情報</summary>") &&
    !/page === "about"[\s\S]*data-gosaki-admin-dev-details[\s\S]{0,80}AdminGosakiStagingAboutContentPanel/.test(
      adminComponent,
    ),
);
assert(
  "local shell About operator embeds shared ContentPanel",
  read(
    "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro",
  ).includes("AdminGosakiStagingAboutContentPanel"),
);
assert(
  "public About CSS source not modified by this panel path",
  !aboutPanelSrc.includes("wix-staging-visual-overrides") &&
    !aboutPanelSrc.includes("gosaki-piano-overrides"),
);
assert(
  "portal has no dashboard grid",
  !/page === "portal"[\s\S]{0,200}gra-dashboard/.test(adminComponent) &&
    !adminComponent.includes('aria-labelledby="gra-dashboard"'),
);
assert(
  "Save disabled note retained",
  adminComponent.includes("data-gosaki-save-disabled-note") ||
    aboutPanelSrc.includes("data-gosaki-save-disabled-note"),
);
assert(
  "discography dry-run retained",
  adminComponent.includes("initGosakiDiscographyOperationalEdit") ||
    discographyOpEditSrc.includes("initGosakiDiscographyOperationalEdit"),
);
assert(
  "no global Publish/Deploy/FTP disabled row restored",
  !adminComponent.includes("Publish（無効）") && !adminComponent.includes("Deploy（無効）"),
);

const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-admin-"));
const applyResult = applyGosakiStagingReadOnlyAdmin(tmpOut, TOOL_ROOT, {
  scheduleBundle: {
    scheduleDataSource: "supabase",
    months: [{ month: "2026-07" }],
    schedules: [
      {
        legacy_id: "schedule-2026-07-verify",
        date: "2026-07-10",
        year: 2026,
        month: 7,
        title: "Verifier Schedule Event",
        venue: "Tokyo",
        open_time: "18:00",
        start_time: "19:00",
        description: "Verifier description",
        published: true,
        updated_at: "2026-07-10T00:00:00.000Z",
      },
    ],
  },
  discographyBundle: {
    discographyDataSource: "supabase",
    rowCount: 1,
    trackRowCount: 1,
    siteSlugFilterApplied: true,
    rows: [],
    tracksByLegacyId: {},
  },
});
assert("apply tmp ok", applyResult.applied === true, applyResult.reason ?? "");
assert("apply multiRoute flag", applyResult.multiRoute === true);
assert(
  "apply adminRoutes length 5",
  Array.isArray(applyResult.adminRoutes) && applyResult.adminRoutes.length === 5,
);
assert(
  "apply wrote schedule events snapshot",
  fs.existsSync(path.join(tmpOut, "src/data/gosaki-read-only-admin-schedule-events.json")),
);
const scheduleSnap = JSON.parse(
  fs.readFileSync(path.join(tmpOut, "src/data/gosaki-read-only-admin-schedule-events.json"), "utf8"),
);
assert(
  "schedule snapshot has events",
  Array.isArray(scheduleSnap.events) && scheduleSnap.events.length >= 1,
);
assert(
  "schedule snapshot carries description + updatedAt",
  scheduleSnap.events[0]?.description === "Verifier description" &&
    scheduleSnap.events[0]?.updatedAt === "2026-07-10T00:00:00.000Z",
);

for (const route of GOSAKI_ADMIN_MULTI_ROUTE_PAGES) {
  const pagePath = path.join(tmpOut, route.rel);
  assert(`tmp page ${route.page}`, fs.existsSync(pagePath));
  const pageText = fs.readFileSync(pagePath, "utf8");
  assert(
    `tmp page ${route.page} props`,
    pageText.includes(`page="${route.page}"`) &&
      pageText.includes("GosakiStagingReadOnlyAdminPage"),
  );
}

assert(
  "tmp schedule content panel copied",
  fs.existsSync(
    path.join(tmpOut, "src/components/gosaki-admin/AdminGosakiStagingScheduleContentPanel.astro"),
  ),
);
assert(
  "tmp about content panel copied",
  fs.existsSync(
    path.join(tmpOut, "src/components/gosaki-admin/AdminGosakiStagingAboutContentPanel.astro"),
  ),
);
assert(
  "tmp discography content panel copied",
  fs.existsSync(
    path.join(tmpOut, "src/components/gosaki-admin/AdminGosakiStagingDiscographyContentPanel.astro"),
  ),
);
assert(
  "tmp discography operational edit lib copied",
  fs.existsSync(
    path.join(tmpOut, "src/lib/gosaki-staging-discography-operational-edit.ts"),
  ),
);
assert(
  "tmp schedule operational edit lib copied",
  fs.existsSync(
    path.join(tmpOut, "src/lib/gosaki-staging-schedule-operational-edit.ts"),
  ),
);
assert(
  "tmp compact auth copied",
  fs.existsSync(
    path.join(tmpOut, "src/components/gosaki-admin/AdminGosakiStagingCompactAuthBar.astro"),
  ),
);
const chromeNav = path.join(tmpOut, "src/components/gosaki-admin/AdminGosakiStagingNav.astro");
const chromeHome = path.join(
  tmpOut,
  "src/components/gosaki-admin/AdminGosakiStagingOperatorHome.astro",
);
assert("tmp chrome nav", fs.existsSync(chromeNav));
assert("tmp chrome home", fs.existsSync(chromeHome));
assert(
  "tmp chrome uses package paths",
  fs.readFileSync(chromeNav, "utf8").includes("gosaki-package-admin-paths") &&
    fs.readFileSync(chromeHome, "utf8").includes("gosaki-package-admin-paths"),
);
assert(
  "tmp package paths file",
  fs.existsSync(path.join(tmpOut, "src/lib/gosaki-package-admin-paths.ts")),
);
assert(
  "tmp chrome css",
  fs.existsSync(path.join(tmpOut, "src/styles/gosaki-admin-shell-chrome.css")),
);

const appliedComponent = fs.readFileSync(
  path.join(tmpOut, "src/components/GosakiStagingReadOnlyAdminPage.astro"),
  "utf8",
);
assert(
  "tmp component portal-only (no dashboard)",
  appliedComponent.includes('page === "portal"') &&
    !appliedComponent.includes('aria-labelledby="gra-dashboard"'),
);
assert(
  "tmp component schedule content panel",
  appliedComponent.includes("AdminGosakiStagingScheduleContentPanel"),
);
assert(
  "tmp component about content panel",
  appliedComponent.includes("AdminGosakiStagingAboutContentPanel"),
);
assert(
  "tmp component discography content panel",
  appliedComponent.includes("AdminGosakiStagingDiscographyContentPanel") &&
    appliedComponent.includes("initGosakiDiscographyOperationalEdit"),
);
assert(
  "tmp component no YouTube dry-run用 on discography path",
  !appliedComponent.includes("Staging Auth（YouTube dry-run 用）"),
);

try {
  fs.rmSync(tmpOut, { recursive: true, force: true });
} catch {
  // ignore
}

/* --- multi-route anon allowlist security cases --- */
assert("path helper portal", isGosakiStagingAdminHtmlRelPath("admin/index.html"));
assert("path helper schedule", isGosakiStagingAdminHtmlRelPath("admin/schedule/index.html"));
assert("path helper rejects public", !isGosakiStagingAdminHtmlRelPath("index.html"));
assert("path helper rejects admin js", !isGosakiStagingAdminHtmlRelPath("admin/app.js"));

const scanTmp = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-scan-"));
const adminRoutes = [
  "admin/index.html",
  "admin/schedule/index.html",
  "admin/discography/index.html",
  "admin/youtube/index.html",
  "admin/about/index.html",
];
for (const rel of adminRoutes) {
  writeHtml(scanTmp, rel, gosakiAdminHtml(rel, KNOWN_ANON));
}
const passScan = scanSupabaseKeyExposure(scanTmp, { knownAnonKey: KNOWN_ANON });
assert(
  "PASS multi-route known anon in attr",
  passScan.publicStaticDoesNotNeedSupabaseKeys === true,
  JSON.stringify(passScan.findings),
);

const publicFailDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-pub-"));
writeHtml(publicFailDir, "index.html", gosakiAdminHtml("index.html", KNOWN_ANON));
const publicFail = scanSupabaseKeyExposure(publicFailDir, { knownAnonKey: KNOWN_ANON });
assert(
  "FAIL public index known anon",
  publicFail.publicStaticDoesNotNeedSupabaseKeys === false,
);

const unknownDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-unk-"));
writeHtml(unknownDir, "admin/schedule/index.html", gosakiAdminHtml("admin/schedule/index.html", UNKNOWN_JWT));
const unknownFail = scanSupabaseKeyExposure(unknownDir, { knownAnonKey: KNOWN_ANON });
assert(
  "FAIL admin unknown JWT",
  unknownFail.publicStaticDoesNotNeedSupabaseKeys === false,
);

assert(
  "accept anon JWT",
  acceptSupabaseAnonJwtForAllowlist(KNOWN_ANON) === KNOWN_ANON,
);
assert(
  "reject service_role JWT as known anon",
  acceptSupabaseAnonJwtForAllowlist(SERVICE_ROLE_JWT) === null,
);
assert(
  "reject roleless JWT as known anon",
  acceptSupabaseAnonJwtForAllowlist(ROLELESS_JWT) === null,
);
assert(
  "reject malformed JWT as known anon",
  acceptSupabaseAnonJwtForAllowlist(MALFORMED_JWT) === null,
);

const svcAsKnownDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-svc-known-"));
writeHtml(
  svcAsKnownDir,
  "admin/index.html",
  `<!doctype html><html><body data-gosaki-read-only-admin="true" ${GOSAKI_STAGING_ADMIN_ANON_KEY_ATTR}="${SERVICE_ROLE_JWT}"></body></html>`,
);
const svcAsKnownFail = scanSupabaseKeyExposure(svcAsKnownDir, {
  knownAnonKey: SERVICE_ROLE_JWT,
});
assert(
  "FAIL knownAnonKey=service_role with same attr value (no plaintext hint)",
  svcAsKnownFail.publicStaticDoesNotNeedSupabaseKeys === false,
);

assert(
  "resolver rejects secretsAnonKey=service_role",
  resolveKnownGosakiStagingAnonKeyForScan({ secretsAnonKey: SERVICE_ROLE_JWT }) === null,
);

const rolelessDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-roleless-"));
writeHtml(
  rolelessDir,
  "admin/index.html",
  gosakiAdminHtml("admin/index.html", ROLELESS_JWT),
);
const rolelessResolve = resolveKnownGosakiStagingAnonKeyForScan({
  knownAnonKey: ROLELESS_JWT,
});
const rolelessScan = scanSupabaseKeyExposure(rolelessDir, { knownAnonKey: ROLELESS_JWT });
assert(
  "FAIL roleless knownAnonKey (resolve null or scan fail)",
  rolelessResolve === null || rolelessScan.publicStaticDoesNotNeedSupabaseKeys === false,
);

const malformedDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-malformed-"));
writeHtml(
  malformedDir,
  "admin/index.html",
  gosakiAdminHtml("admin/index.html", MALFORMED_JWT),
);
const malformedResolve = resolveKnownGosakiStagingAnonKeyForScan({
  knownAnonKey: MALFORMED_JWT,
});
const malformedScan = scanSupabaseKeyExposure(malformedDir, {
  knownAnonKey: MALFORMED_JWT,
});
assert(
  "FAIL malformed knownAnonKey (resolve null or scan fail)",
  malformedResolve === null || malformedScan.publicStaticDoesNotNeedSupabaseKeys === false,
);

const svcAttrDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-svc-attr-"));
writeHtml(
  svcAttrDir,
  "admin/index.html",
  `<!doctype html><html><body data-gosaki-read-only-admin="true" ${GOSAKI_STAGING_ADMIN_ANON_KEY_ATTR}="${SERVICE_ROLE_JWT}"></body></html>`,
);
const svcAttrFail = scanSupabaseKeyExposure(svcAttrDir, { knownAnonKey: KNOWN_ANON });
assert(
  "FAIL service_role in admin attr is not stripped by known anon",
  svcAttrFail.publicStaticDoesNotNeedSupabaseKeys === false,
);

const scriptDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-js-"));
writeHtml(
  scriptDir,
  "admin/discography/index.html",
  gosakiAdminHtml("admin/discography/index.html", KNOWN_ANON, { wrapKeyInScript: true }),
);
const scriptFail = scanSupabaseKeyExposure(scriptDir, { knownAnonKey: KNOWN_ANON });
assert(
  "FAIL anon outside data-gosaki-supabase-anon-key attr",
  scriptFail.publicStaticDoesNotNeedSupabaseKeys === false,
);

const otherPkgDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-other-"));
writeHtml(
  otherPkgDir,
  "admin/index.html",
  `<!doctype html><html><body ${GOSAKI_STAGING_ADMIN_ANON_KEY_ATTR}="${KNOWN_ANON}"></body></html>`,
);
const otherPkgFail = scanSupabaseKeyExposure(otherPkgDir, { knownAnonKey: KNOWN_ANON });
assert(
  "FAIL non-Gosaki package (missing read-only marker)",
  otherPkgFail.publicStaticDoesNotNeedSupabaseKeys === false,
);

const createClientDir = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-cc-"));
writeHtml(
  createClientDir,
  "admin/youtube/index.html",
  `<!doctype html><html><body data-gosaki-read-only-admin="true" ${GOSAKI_STAGING_ADMIN_ANON_KEY_ATTR}="${KNOWN_ANON}"><script>createClient('https://kmjqppxjdnwwrtaeqjta.supabase.co', '${KNOWN_ANON}');</script></body></html>`,
);
const createClientFail = scanSupabaseKeyExposure(createClientDir, {
  knownAnonKey: KNOWN_ANON,
});
assert(
  "FAIL createClient inline key even with allowlisted attr",
  createClientFail.publicStaticDoesNotNeedSupabaseKeys === false &&
    createClientFail.findings.some((f) => f.kind === "supabase_client_with_inline_key"),
);

for (const dir of [
  scanTmp,
  publicFailDir,
  unknownDir,
  svcAsKnownDir,
  rolelessDir,
  malformedDir,
  svcAttrDir,
  scriptDir,
  otherPkgDir,
  createClientDir,
]) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

assert(
  "production includesAdmin false retained",
  /"profileName"\s*:\s*"production"[\s\S]*?"includesAdmin"\s*:\s*false/.test(registry),
);
assert(
  "gosaki production excludes admin",
  /gosaki-piano[\s\S]*?"production"[\s\S]*?"includesAdmin"\s*:\s*false/s.test(registry),
);
assert("src/pages/admin not modified", /srcPagesAdminModified:\s*false/i.test(doc));
assert("service_role unused", /serviceRoleUsed:\s*false/i.test(doc));
assert("saveEnabled false", /saveEnabled:\s*false/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes("verify:g20u39b4-gosaki-admin-multi-route-staging-package-prep"),
);
assert(
  "verify script file exists",
  exists(
    "tools/static-to-astro/scripts/verify-g20u39b4-gosaki-admin-multi-route-staging-package-prep.mjs",
  ),
);

assert(`AI current-state has ${PHASE}`, cs.includes(PHASE) || currentState.includes(PHASE));
assert(`AI next-actions has ${PHASE}`, na.includes(PHASE) || nextActions.includes(PHASE));
assert(`AI handoff has ${PHASE}`, ho.includes(PHASE) || handoff.includes(PHASE));
assert(
  "AI gate MULTI_ROUTE_ANON_ALLOWLIST_FIXED",
  /MULTI_ROUTE_ANON_ALLOWLIST_FIXED:\s*true/i.test(cs + na + ho + currentState),
);
assert(
  "AI gate STAGING_ADMIN_MULTI_ROUTE",
  /STAGING_ADMIN_MULTI_ROUTE_GENERATION_IMPLEMENTED:\s*true/i.test(
    cs + na + ho + currentState,
  ),
);
assert(
  "AI recommended next",
  (cs + na + ho + nextActions + handoff).includes(RECOMMENDED_NEXT),
);
assert(
  "AI DISCOGRAPHY_STG_BROWSER_QA_PASSED",
  /DISCOGRAPHY_STG_BROWSER_QA_PASSED:\s*true/i.test(currentState + nextActions + handoff),
);
assert(
  "AI P1-DISCOGRAPHY-EDIT-UI resolved",
  /P1-DISCOGRAPHY-EDIT-UI:\s*resolved/i.test(currentState + nextActions + handoff),
);
assert(
  "AI DISCOGRAPHY_GATED_SAVE_UI_WIRED",
  /DISCOGRAPHY_GATED_SAVE_UI_WIRED:\s*true/i.test(currentState + nextActions + handoff),
);
assert(
  "AI DISCOGRAPHY_STG_FORM_LAYOUT_QA_PASSED",
  /DISCOGRAPHY_STG_FORM_LAYOUT_QA_PASSED:\s*true/i.test(currentState + nextActions + handoff),
);
assert(
  "AI DISCOGRAPHY_GATED_SAVE_UI_STG_QA_PASSED",
  /DISCOGRAPHY_GATED_SAVE_UI_STG_QA_PASSED:\s*true/i.test(currentState + nextActions + handoff),
);
assert(
  "AI G-20u41 completed",
  /G-20u41:\s*completed/i.test(currentState + nextActions + handoff) ||
    /G-20u41[\s\S]{0,80}completed/i.test(currentState + nextActions + handoff),
);

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log("G-20u39b4 verifier: PASS");
}
