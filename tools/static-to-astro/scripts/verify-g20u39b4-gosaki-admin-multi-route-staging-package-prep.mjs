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
assert("apply multiRoute true", applySrc.includes("multiRoute: true"));
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
