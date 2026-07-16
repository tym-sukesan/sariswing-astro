/**
 * G-20u39b4 Gosaki admin multi-route staging package prep verifier.
 * Exercises apply() in a temp dir — no real package / FTP / Save.
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
assert(`recommended next ${RECOMMENDED_NEXT}`, doc.includes(RECOMMENDED_NEXT));
assert("no package generation claimed", /packageGenerationExecuted:\s*false/i.test(doc));
assert("no FTP claimed", /ftpUploadExecuted:\s*false/i.test(doc));

assert("package paths BASE_URL", packagePaths.includes("BASE_URL") && packagePaths.includes("admin/"));
assert("package paths schedule", packagePaths.includes("schedule/"));
assert("chrome css exists", chromeCss.includes("admin-gosaki-staging-nav"));
assert("apply lists multi routes", applySrc.includes("GOSAKI_ADMIN_MULTI_ROUTE_PAGES"));
assert("apply copies chrome components", applySrc.includes("AdminGosakiStagingOperatorHome.astro"));
assert("apply multiRoute true", applySrc.includes("multiRoute: true"));

assert("component multi-route attr", adminComponent.includes(GOSAKI_READ_ONLY_ADMIN_MULTI_ROUTE_ATTR));
assert("component portal mode", adminComponent.includes('page === "portal"'));
assert("component uses OperatorHome", adminComponent.includes("AdminGosakiStagingOperatorHome"));
assert("component uses Nav", adminComponent.includes("AdminGosakiStagingNav"));
assert("component uses chips", adminComponent.includes("AdminGosakiStagingSafetyChips"));
assert("component schedule route", adminComponent.includes('page === "schedule"'));
assert("component discography route", adminComponent.includes('page === "discography"'));
assert("component youtube route", adminComponent.includes('page === "youtube"'));
assert("component about route", adminComponent.includes('page === "about"'));
assert(
  "portal has no dashboard grid",
  !/page === "portal"[\s\S]{0,200}gra-dashboard/.test(adminComponent) &&
    !adminComponent.includes('aria-labelledby="gra-dashboard"'),
);
assert("Save disabled note retained", adminComponent.includes("data-gosaki-save-disabled-note"));
assert("discography dry-run retained", adminComponent.includes("Dry-run validation（保存なし）"));
assert(
  "no global Publish/Deploy/FTP disabled row restored",
  !adminComponent.includes("Publish（無効）") && !adminComponent.includes("Deploy（無効）"),
);

const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), "g20u39b4-admin-"));
const applyResult = applyGosakiStagingReadOnlyAdmin(tmpOut, TOOL_ROOT, {
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

try {
  fs.rmSync(tmpOut, { recursive: true, force: true });
} catch {
  // ignore
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
