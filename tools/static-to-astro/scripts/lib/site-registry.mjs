/**
 * G-20u2 — CMS Kit site registry loader.
 * Resolves site slug semantics, deploy profiles, and package manifest metadata.
 * No secrets · no DB · no FTP.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isStagingSubdirBuild, normalizeDeployBase } from "./deploy-base.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_ROOT = path.resolve(__dirname, "../..");

export const SITE_REGISTRY_REL = "config/sites/registry.json";
export const GOSAKI_SITE_KEY = "gosaki-piano";
export const PILOT_SAMPLE_STATIC_SITE_KEY = "pilot-sample-static";
export const GOSAKI_DEPLOY_PROFILES_REL = "config/sites/gosaki-piano.deploy-profiles.json";
export const ALLOWED_PROFILE_NAMES = /** @type {const} */ (["staging", "production"]);
export const STAGING_KIT_SUPABASE_REF = "kmjqppxjdnwwrtaeqjta";
export const SARISWING_PRODUCTION_SUPABASE_REF = "vsbvndwuajjhnzpohghh";

const SAFE_REL_PATH = /^[a-z0-9][a-z0-9._/-]*$/i;

/**
 * @param {string} rel
 * @param {string} label
 */
function assertSafeRelativePath(rel, label) {
  const normalized = rel.replace(/\\/g, "/");
  if (!normalized || normalized.startsWith("/") || normalized.includes("..")) {
    throw new Error(`${label} must be a safe relative path under tools/static-to-astro`);
  }
  if (!SAFE_REL_PATH.test(normalized)) {
    throw new Error(`${label} contains invalid characters: ${rel}`);
  }
  return normalized;
}

/**
 * @param {string} [toolRoot]
 */
export function loadSiteRegistry(toolRoot = TOOL_ROOT) {
  const abs = path.join(toolRoot, SITE_REGISTRY_REL);
  if (!fs.existsSync(abs)) {
    throw new Error(`Site registry not found: ${SITE_REGISTRY_REL}`);
  }
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!raw?.sites || typeof raw.sites !== "object") {
    throw new Error("Site registry missing sites object");
  }
  return raw;
}

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 */
export function getSiteRegistryEntry(siteKey, toolRoot = TOOL_ROOT) {
  const registry = loadSiteRegistry(toolRoot);
  const entry = registry.sites[siteKey];
  if (!entry) {
    throw new Error(`Unknown siteKey "${siteKey}" — registered: ${Object.keys(registry.sites).join(", ")}`);
  }
  if (entry.siteKey && entry.siteKey !== siteKey) {
    throw new Error(`Site registry key mismatch: map key ${siteKey} vs entry.siteKey ${entry.siteKey}`);
  }
  return entry;
}

/**
 * @param {string} [toolRoot]
 * @returns {string[]}
 */
export function listSiteKeys(toolRoot = TOOL_ROOT) {
  return Object.keys(loadSiteRegistry(toolRoot).sites);
}

/**
 * Resolve registry siteKey from a fixture directory path (basename match).
 * Returns null when no registry entry matches.
 *
 * @param {string} fixtureDir
 * @param {string} [toolRoot]
 * @returns {string | null}
 */
export function resolveSiteKeyFromFixtureDir(fixtureDir, toolRoot = TOOL_ROOT) {
  const basename = path.basename(path.resolve(fixtureDir));
  const registry = loadSiteRegistry(toolRoot);
  for (const [siteKey, entry] of Object.entries(registry.sites ?? {})) {
    const fixtureBase = path.basename(String(entry.fixtureDir ?? ""));
    if (fixtureBase && basename === fixtureBase) {
      return siteKey;
    }
  }
  return null;
}

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @returns {string}
 */
export function assertRegisteredSiteKey(siteKey, toolRoot = TOOL_ROOT) {
  getSiteRegistryEntry(siteKey, toolRoot);
  return siteKey;
}

/**
 * @typedef {{ schedule: boolean, discography: boolean, siteEmbeds: boolean }} SupabaseFeatures
 */

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 * @returns {string}
 */
export function resolveSupabaseSiteSlug(siteKey, toolRoot = TOOL_ROOT) {
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const slug = entry.slugSemantics ?? {};
  return String(slug.supabaseSiteSlug ?? siteKey);
}

export {
  resolveSupabaseFeatures,
  resolveCmsFeatures,
  resolveSiteCmsFeaturePlan,
  isSupabaseFeatureEnabled,
  isCmsFeatureEnabled,
} from "./site-cms-features.mjs";

/**
 * @param {string} rel
 * @param {string} [toolRoot]
 */
export function loadDeployProfilesFile(rel, toolRoot = TOOL_ROOT) {
  const normalized = assertSafeRelativePath(rel, "deployProfilesFile");
  const abs = path.join(toolRoot, normalized);
  if (!fs.existsSync(abs)) {
    throw new Error(`Deploy profiles not found: ${normalized}`);
  }
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!raw?.profiles || typeof raw.profiles !== "object") {
    throw new Error(`Deploy profiles JSON missing profiles object: ${normalized}`);
  }
  return raw;
}

/**
 * @param {unknown} profile
 * @param {string} name
 */
function validateDeployProfileShape(profile, name) {
  if (!profile || typeof profile !== "object") {
    throw new Error(`Profile "${name}" is not an object`);
  }
  const p = /** @type {Record<string, unknown>} */ (profile);
  const required = [
    "origin",
    "baseUrl",
    "publicUrl",
    "deployBase",
    "outputName",
    "astroOut",
    "staticPublicOut",
    "manualUploadOut",
    "supabaseProjectRef",
    "seo",
  ];
  for (const key of required) {
    if (p[key] == null || p[key] === "") {
      throw new Error(`Profile "${name}" missing required field: ${key}`);
    }
  }

  const ref = String(p.supabaseProjectRef);
  if (ref === SARISWING_PRODUCTION_SUPABASE_REF) {
    throw new Error(
      `Profile "${name}" must not use Sariswing production Supabase ref ${SARISWING_PRODUCTION_SUPABASE_REF}`,
    );
  }
  if (ref !== STAGING_KIT_SUPABASE_REF) {
    throw new Error(
      `Profile "${name}" supabaseProjectRef must be ${STAGING_KIT_SUPABASE_REF} (interim production SoT)`,
    );
  }

  const seo = /** @type {Record<string, unknown>} */ (p.seo);
  const deployBase = normalizeDeployBase(String(p.deployBase));
  const stagingBuild = isStagingSubdirBuild(deployBase);
  if (stagingBuild && seo.stagingNoindex !== true) {
    throw new Error(`Profile "${name}" staging subdir build requires seo.stagingNoindex=true`);
  }
  if (!stagingBuild && seo.productionIndexable !== true) {
    throw new Error(`Profile "${name}" root deploy requires seo.productionIndexable=true`);
  }

  if (name === "production" && p.includeGosakiReadOnlyAdmin !== false) {
    throw new Error(`Profile "${name}" must set includeGosakiReadOnlyAdmin=false (G-20i3)`);
  }
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 */
function assertGosakiLegacyPathGuards(siteKey, profileName, manualUploadOut) {
  if (siteKey !== GOSAKI_SITE_KEY) return;
  if (profileName === "staging" && manualUploadOut !== "output/manual-upload/gosaki-piano") {
    throw new Error("staging manualUploadOut must remain output/manual-upload/gosaki-piano");
  }
  if (profileName === "production" && manualUploadOut !== "output/manual-upload/gosaki-piano-production") {
    throw new Error("production manualUploadOut must be output/manual-upload/gosaki-piano-production");
  }
}

/**
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ toolRoot?: string }} [options]
 */
export function resolveSitePackageBuildProfile(siteKey, profileName, options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  if (!ALLOWED_PROFILE_NAMES.includes(/** @type {typeof ALLOWED_PROFILE_NAMES[number]} */ (profileName))) {
    throw new Error(
      `Unknown profile "${profileName}" — allowed: ${ALLOWED_PROFILE_NAMES.join(", ")}`,
    );
  }

  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const slug = entry.slugSemantics ?? {};
  const packageOverlay = entry.packageProfiles?.[profileName];
  if (!packageOverlay) {
    throw new Error(`Site "${siteKey}" missing packageProfiles.${profileName} in registry`);
  }

  const deployProfilesRel = entry.deployProfilesFile ?? GOSAKI_DEPLOY_PROFILES_REL;
  const deployConfig = loadDeployProfilesFile(deployProfilesRel, toolRoot);
  const raw = deployConfig.profiles[profileName];
  if (!raw) {
    throw new Error(`Deploy profile "${profileName}" missing in ${deployProfilesRel}`);
  }
  validateDeployProfileShape(raw, profileName);

  const deployBase = normalizeDeployBase(String(raw.deployBase));
  const astroOut = assertSafeRelativePath(String(raw.astroOut), `${profileName}.astroOut`);
  const staticPublicOut = assertSafeRelativePath(
    String(raw.staticPublicOut),
    `${profileName}.staticPublicOut`,
  );
  const manualUploadOut = assertSafeRelativePath(
    String(raw.manualUploadOut),
    `${profileName}.manualUploadOut`,
  );

  assertGosakiLegacyPathGuards(siteKey, profileName, manualUploadOut);

  const supabaseSiteSlug = String(slug.supabaseSiteSlug ?? deployConfig.siteSlug ?? siteKey);
  const cmsSiteSlug = String(slug.cmsSiteSlug ?? supabaseSiteSlug);
  const filesystemSlug = String(slug.filesystemSlug ?? siteKey);
  const packageKey = String(packageOverlay.packageKey ?? siteKey);
  const publicBaseUrl = String(packageOverlay.publicBaseUrl ?? raw.publicUrl).replace(/\/$/, "") + "/";
  const stagingBaseUrl =
    packageOverlay.stagingBaseUrl != null
      ? String(packageOverlay.stagingBaseUrl).replace(/\/$/, "")
      : profileName === "staging"
        ? String(raw.baseUrl).replace(/\/$/, "")
        : null;
  const intendedRemotePath = String(
    packageOverlay.intendedRemotePath ?? raw.remotePath ?? deployBase,
  );
  const includesAdmin =
    packageOverlay.includesAdmin === true ||
    (profileName !== "production" && raw.includeGosakiReadOnlyAdmin !== false);
  const includeGosakiReadOnlyAdmin =
    profileName === "production" ? false : packageOverlay.includeGosakiReadOnlyAdmin !== false;

  return {
    profileName,
    siteKey,
    siteSlug: supabaseSiteSlug,
    cmsSiteSlug,
    supabaseSiteSlug,
    packageKey,
    filesystemSlug,
    fixtureDir: assertSafeRelativePath(
      String(entry.fixtureDir ?? deployConfig.fixtureDir ?? `fixtures/${filesystemSlug}`),
      "fixtureDir",
    ),
    origin: String(raw.origin).replace(/\/$/, ""),
    baseUrl: String(raw.baseUrl).replace(/\/$/, ""),
    publicUrl: String(raw.publicUrl).replace(/\/$/, "") + "/",
    publicBaseUrl,
    stagingBaseUrl,
    deployBase,
    outputName: String(raw.outputName),
    astroOut,
    staticPublicOut,
    manualUploadOut,
    remotePath: String(raw.remotePath ?? ""),
    intendedRemotePath,
    targetEnvironment: packageOverlay.targetEnvironment ?? profileName,
    packageProfileName: packageOverlay.profileName ?? profileName,
    includesAdmin,
    supabaseProjectRef: STAGING_KIT_SUPABASE_REF,
    seo: {
      stagingNoindex: Boolean(raw.seo?.stagingNoindex),
      robotsDisallowAll: Boolean(raw.seo?.robotsDisallowAll),
      productionIndexable: Boolean(raw.seo?.productionIndexable),
    },
    staticPublicReportRel: path.join(staticPublicOut, "STATIC_PUBLIC_ARTIFACT_REPORT.md"),
    astroOutRepoRel: path.join("tools/static-to-astro", astroOut),
    isStagingSubdirBuild: isStagingSubdirBuild(deployBase),
    includeGosakiReadOnlyAdmin,
    deployProfilesFile: deployProfilesRel,
    cmsPreset: entry.cmsPreset ?? null,
  };
}

/**
 * Manifest-oriented fields from registry (for package builder / preflight).
 *
 * @param {string} siteKey
 * @param {string} profileName
 * @param {{ toolRoot?: string }} [options]
 */
export function resolvePackageManifestMetaFromRegistry(siteKey, profileName, options = {}) {
  const profile = resolveSitePackageBuildProfile(siteKey, profileName, options);
  return {
    siteKey: profile.siteKey,
    siteSlug: profile.siteSlug,
    cmsSiteSlug: profile.cmsSiteSlug,
    supabaseSiteSlug: profile.supabaseSiteSlug,
    packageKey: profile.packageKey,
    targetEnvironment: profile.targetEnvironment,
    packageProfileName: profile.packageProfileName,
    deployBase: profile.deployBase,
    publicBaseUrl: profile.publicBaseUrl,
    stagingBaseUrl: profile.stagingBaseUrl,
    intendedRemotePath: profile.intendedRemotePath,
    includesAdmin: profile.includesAdmin,
    includeGosakiReadOnlyAdmin: profile.includeGosakiReadOnlyAdmin,
    manualUploadOut: profile.manualUploadOut,
  };
}

/**
 * @param {string} siteKey
 * @param {string} [toolRoot]
 */
export function loadSiteDeployProfiles(siteKey, toolRoot = TOOL_ROOT) {
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const rel = entry.deployProfilesFile ?? GOSAKI_DEPLOY_PROFILES_REL;
  return loadDeployProfilesFile(rel, toolRoot);
}
