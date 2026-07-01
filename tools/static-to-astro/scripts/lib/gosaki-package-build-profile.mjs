/**
 * G-20h1 — Gosaki package build deploy profile loader.
 * Reads config/sites/gosaki-piano.deploy-profiles.json (no secrets).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isStagingSubdirBuild, normalizeDeployBase } from "./deploy-base.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const TOOL_ROOT = path.resolve(__dirname, "../..");

export const GOSAKI_DEPLOY_PROFILES_REL = "config/sites/gosaki-piano.deploy-profiles.json";
export const ALLOWED_PROFILE_NAMES = /** @type {const} */ (["staging", "production"]);
export const STAGING_KIT_SUPABASE_REF = "kmjqppxjdnwwrtaeqjta";
export const SARISWING_PRODUCTION_SUPABASE_REF = "vsbvndwuajjhnzpohghh";

const SAFE_REL_PATH = /^[a-z0-9][a-z0-9._/-]*$/i;

/**
 * @param {string} rel
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
export function loadGosakiDeployProfiles(toolRoot = TOOL_ROOT) {
  const abs = path.join(toolRoot, GOSAKI_DEPLOY_PROFILES_REL);
  if (!fs.existsSync(abs)) {
    throw new Error(`Deploy profiles not found: ${GOSAKI_DEPLOY_PROFILES_REL}`);
  }
  const raw = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!raw?.profiles || typeof raw.profiles !== "object") {
    throw new Error("Deploy profiles JSON missing profiles object");
  }
  return raw;
}

/**
 * @param {unknown} profile
 * @param {string} name
 */
function validateProfileShape(profile, name) {
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
}

/**
 * @param {string} profileName
 * @param {{ toolRoot?: string }} [options]
 */
export function resolveGosakiPackageBuildProfile(profileName, options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  if (!ALLOWED_PROFILE_NAMES.includes(/** @type {typeof ALLOWED_PROFILE_NAMES[number]} */ (profileName))) {
    throw new Error(
      `Unknown profile "${profileName}" — allowed: ${ALLOWED_PROFILE_NAMES.join(", ")}`,
    );
  }

  const config = loadGosakiDeployProfiles(toolRoot);
  const raw = config.profiles[profileName];
  validateProfileShape(raw, profileName);

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

  if (profileName === "staging" && manualUploadOut !== "output/manual-upload/gosaki-piano") {
    throw new Error("staging manualUploadOut must remain output/manual-upload/gosaki-piano");
  }
  if (profileName === "production" && manualUploadOut !== "output/manual-upload/gosaki-piano-production") {
    throw new Error(
      "production manualUploadOut must be output/manual-upload/gosaki-piano-production",
    );
  }

  return {
    profileName,
    siteSlug: String(config.siteSlug ?? "gosaki-piano"),
    fixtureDir: assertSafeRelativePath(String(config.fixtureDir ?? "fixtures/gosaki-piano"), "fixtureDir"),
    origin: String(raw.origin).replace(/\/$/, ""),
    baseUrl: String(raw.baseUrl).replace(/\/$/, ""),
    publicUrl: String(raw.publicUrl).replace(/\/$/, "") + "/",
    deployBase,
    outputName: String(raw.outputName),
    astroOut,
    staticPublicOut,
    manualUploadOut,
    remotePath: String(raw.remotePath ?? ""),
    supabaseProjectRef: STAGING_KIT_SUPABASE_REF,
    seo: {
      stagingNoindex: Boolean(raw.seo?.stagingNoindex),
      robotsDisallowAll: Boolean(raw.seo?.robotsDisallowAll),
      productionIndexable: Boolean(raw.seo?.productionIndexable),
    },
    staticPublicReportRel: path.join(staticPublicOut, "STATIC_PUBLIC_ARTIFACT_REPORT.md"),
    astroOutRepoRel: path.join("tools/static-to-astro", astroOut),
    isStagingSubdirBuild: isStagingSubdirBuild(deployBase),
  };
}

/**
 * @param {string} profileName
 */
export function getGosakiPackageBuildProfileOrThrow(profileName) {
  return resolveGosakiPackageBuildProfile(profileName);
}
