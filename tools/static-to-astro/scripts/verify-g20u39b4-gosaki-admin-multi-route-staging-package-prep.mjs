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
  "G-20u39b5-gosaki-admin-multi-route-staging-package-generation-at-head";

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
  "discography has content marker + dry-run",
  adminComponent.includes('data-gosaki-discography-content="true"') &&
    adminComponent.includes("Dry-run validation（保存なし）"),
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
  "about panel has profile + bands",
  aboutPanelSrc.includes('data-about-block="profile"') &&
    aboutPanelSrc.includes('data-about-block="bands"'),
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
assert("discography dry-run retained", adminComponent.includes("Dry-run validation（保存なし）"));
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
        published: true,
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

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log("G-20u39b4 verifier: PASS");
}
