/**
 * G-20u39b3 Gosaki admin portal + content routes local implementation verifier.
 * Local / static checks only — no network, FTP, package apply, or Save.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");
const AI_DIR = "tools/static-to-astro/docs/ai";

const DOC_REL =
  "tools/static-to-astro/docs/gosaki-admin-portal-and-content-routes-local-implementation.md";
const PLANNING_DOC_REL =
  "tools/static-to-astro/docs/gosaki-admin-operational-ui-information-architecture-planning.md";
const PHASE =
  "G-20u39b3-gosaki-admin-portal-and-content-routes-local-implementation";
const GATE = "gosakiAdminPortalAndContentRoutesLocalImplemented: true";
const RECOMMENDED_NEXT =
  "G-20u39b4-gosaki-admin-multi-route-staging-package-and-manual-upload-prep";

const HOME =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingOperatorHome.astro";
const NAV =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingNav.astro";
const CHIPS =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingSafetyChips.astro";
const LAYOUT =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingShellLayout.astro";
const SCHEDULE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingScheduleOperatorPage.astro";
const DISCOGRAPHY =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingDiscographyOperatorPage.astro";
const YOUTUBE =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingYoutubeOperatorPage.astro";
const ABOUT =
  "tools/static-to-astro/templates/admin-cms/gosaki/components/AdminGosakiStagingAboutOperatorPage.astro";
const STG_ADMIN =
  "tools/static-to-astro/templates/site-extensions/gosaki-piano/GosakiStagingReadOnlyAdminPage.astro";
const ADMIN_CSS = "tools/static-to-astro/templates/admin-cms/styles/admin.css";
const PATHS_TS =
  "tools/static-to-astro/templates/admin-cms/gosaki/gosaki-staging-admin-paths.ts";

const PAGE_ROUTES = [
  "src/pages/__admin-staging-shell/musician-basic/admin/index.astro",
  "src/pages/__admin-staging-shell/musician-basic/admin/schedule/index.astro",
  "src/pages/__admin-staging-shell/musician-basic/admin/discography/index.astro",
  "src/pages/__admin-staging-shell/musician-basic/admin/youtube/index.astro",
  "src/pages/__admin-staging-shell/musician-basic/admin/about/index.astro",
];

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

assert("impl doc exists", exists(DOC_REL));
assert("planning doc exists", exists(PLANNING_DOC_REL));

const doc = read(DOC_REL);
const packageJson = read("tools/static-to-astro/package.json");
const currentState = read(`${AI_DIR}/00-current-state.md`);
const nextActions = read(`${AI_DIR}/03-next-actions.md`);
const handoff = read(`${AI_DIR}/handoff-to-chatgpt.md`);
const registry = read("tools/static-to-astro/config/sites/registry.json");

const home = read(HOME);
const nav = read(NAV);
const chips = read(CHIPS);
const layout = read(LAYOUT);
const schedule = read(SCHEDULE);
const discography = read(DISCOGRAPHY);
const youtube = read(YOUTUBE);
const about = read(ABOUT);
const stgAdmin = read(STG_ADMIN);
const adminCss = read(ADMIN_CSS);
const pathsTs = read(PATHS_TS);

const cs = latestSection(currentState, "G-20u39b3");
const na = latestSection(nextActions, "G-20u39b3");
const ho = latestSection(handoff, "G-20u39b3");

assert(`doc phase ${PHASE}`, doc.includes(PHASE));
assert(
  "ADMIN_PORTAL_LOCAL_IMPLEMENTED true",
  /ADMIN_PORTAL_LOCAL_IMPLEMENTED:\s*true/i.test(doc),
);
assert(
  "INDIVIDUAL_ADMIN_ROUTES_LOCAL_IMPLEMENTED true",
  /INDIVIDUAL_ADMIN_ROUTES_LOCAL_IMPLEMENTED:\s*true/i.test(doc),
);
assert(
  "DEVELOPER_CONTENT_CLEANUP_IMPLEMENTED true",
  /DEVELOPER_CONTENT_CLEANUP_IMPLEMENTED:\s*true/i.test(doc),
);
assert("SAVE_REMAINS_DISABLED true", /SAVE_REMAINS_DISABLED:\s*true/i.test(doc));
assert(
  "STG_PACKAGE_AND_BROWSER_QA_REQUIRED true",
  /STG_PACKAGE_AND_BROWSER_QA_REQUIRED:\s*true/i.test(doc),
);
assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));

assert("nav component exists", exists(NAV));
assert("chips component exists", exists(CHIPS));
assert("portal marker on home", home.includes('data-gosaki-admin-portal="true"'));
assert("portal title Gosaki Piano CMS", home.includes("Gosaki Piano CMS"));
assert("portal cards", home.includes("data-gosaki-portal-cards"));
assert("portal has statuses", home.includes("閲覧可能") && home.includes("dry-run可能"));
assert("portal has 準備中", home.includes("準備中"));
assert("portal public preview", home.includes("data-gosaki-public-preview-link"));
assert("portal uses nav", home.includes("AdminGosakiStagingNav"));
assert("portal uses chips", home.includes("AdminGosakiStagingSafetyChips"));
assert(
  "portal has no schedule form section",
  !home.includes("gosaki-schedule-operator") && !home.includes("data-selectable-rows"),
);

assert("nav lists content routes", nav.includes("schedule") && nav.includes("discography"));
assert("chips テスト環境", chips.includes("テスト環境"));
assert("chips 閲覧のみ", chips.includes("閲覧のみ"));
assert("chips Save disabled", chips.includes("Save disabled"));

for (const [label, src] of [
  ["schedule", schedule],
  ["discography", discography],
  ["youtube", youtube],
  ["about", about],
]) {
  assert(`${label} has nav`, src.includes("AdminGosakiStagingNav"));
  assert(`${label} has chips`, src.includes("AdminGosakiStagingSafetyChips"));
  assert(`${label} back to portal`, src.includes("管理トップへ"));
}

assert("schedule current=schedule", schedule.includes('current="schedule"'));
assert("discography current=discography", discography.includes('current="discography"'));
assert("youtube current=youtube", youtube.includes('current="youtube"'));
assert("about current=about", about.includes('current="about"'));

assert(
  "shell layout uses chips",
  layout.includes("AdminGosakiStagingSafetyChips"),
);

for (const rel of PAGE_ROUTES) {
  assert(`route page ${rel}`, exists(rel));
}
assert(
  "no contact admin route page",
  !exists("src/pages/__admin-staging-shell/musician-basic/admin/contact/index.astro"),
);

assert("paths schedule", pathsTs.includes("/admin/schedule/"));
assert("paths discography", pathsTs.includes("/admin/discography/"));
assert("paths youtube", pathsTs.includes("/admin/youtube/"));
assert("paths about", pathsTs.includes("/admin/about/"));

assert("admin.css portal cards", adminCss.includes("admin-gosaki-portal-cards"));
assert("admin.css staging nav", adminCss.includes("admin-gosaki-staging-nav"));
assert("admin.css safety chips", adminCss.includes("admin-gosaki-safety-chips"));
assert("admin.css overflow-x clip retained", adminCss.includes("overflow-x: clip"));

assert("STG admin details marker", stgAdmin.includes("data-gosaki-admin-dev-details"));
assert("STG admin chips テスト環境", stgAdmin.includes("テスト環境"));
assert("STG admin chips 閲覧のみ", stgAdmin.includes("閲覧のみ"));
assert(
  "STG main banner without FTP list",
  stgAdmin.includes("data-gosaki-admin-main-banner") &&
    !/data-gosaki-admin-main-banner[\s\S]{0,800}手動 FTP/.test(stgAdmin),
);
assert(
  "STG removed global disabled Publish/Deploy/FTP row",
  !stgAdmin.includes("Publish（無効）") && !stgAdmin.includes("Deploy（無効）") && !stgAdmin.includes(">FTP（無効）"),
);
assert(
  "STG removed upload-safety card",
  !stgAdmin.includes('data-section-card="upload-safety"'),
);
assert("STG save-disabled note retained", stgAdmin.includes("data-gosaki-save-disabled-note"));
assert(
  "STG discography save still disabled in UI text",
  stgAdmin.includes("Save disabled"),
);

assert(
  "discography page keeps save-enabled false default marker",
  discography.includes('data-g15a2-save-enabled="false"') &&
    discography.includes('data-g15a2-db-write-enabled="false"'),
);

assert(
  "production includesAdmin false retained",
  /"id"\s*:\s*"production"[\s\S]*?"includesAdmin"\s*:\s*false/.test(registry) ||
    registry.includes('"includesAdmin": false'),
);
assert(
  "gosaki production profile excludes admin",
  /gosaki-piano[\s\S]*?"production"[\s\S]*?"includesAdmin"\s*:\s*false/s.test(registry) ||
    (registry.includes("gosaki-piano") && registry.includes('"includesAdmin": false')),
);

assert("no package generation claimed", /packageGenerationExecuted:\s*false/i.test(doc));
assert("no FTP claimed", /ftpUploadExecuted:\s*false/i.test(doc));
assert("saveEnabled false", /saveEnabled:\s*false/i.test(doc));
assert("src/pages/admin not modified", /srcPagesAdminModified:\s*false/i.test(doc));
assert("service_role unused", /serviceRoleUsed:\s*false/i.test(doc));

assert(
  "package.json verify script",
  packageJson.includes(
    "verify:g20u39b3-gosaki-admin-portal-and-content-routes-local-implementation",
  ),
);
assert("verify script file exists", exists(
  "tools/static-to-astro/scripts/verify-g20u39b3-gosaki-admin-portal-and-content-routes-local-implementation.mjs",
));

assert(`AI current-state has ${PHASE}`, cs.includes(PHASE) || currentState.includes(PHASE));
assert(`AI next-actions has ${PHASE}`, na.includes(PHASE) || nextActions.includes(PHASE));
assert(`AI handoff has ${PHASE}`, ho.includes(PHASE) || handoff.includes(PHASE));
assert(`AI gate or ADMIN_PORTAL`, /ADMIN_PORTAL_LOCAL_IMPLEMENTED:\s*true/i.test(cs + na + ho + currentState));
assert(`AI recommended next`, (cs + na + ho + nextActions + handoff).includes(RECOMMENDED_NEXT));

console.log("");
console.log(`passed=${passed} failed=${failed}`);
if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log("G-20u39b3 verifier: PASS");
}
