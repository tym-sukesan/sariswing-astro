/**
 * G-20u10 — Resolve package directory for freshness preflight.
 * Registry-driven (--site/--profile) with legacy Gosaki --profile-only compat.
 */

import path from "node:path";
import { resolveGosakiPackageBuildProfile } from "./gosaki-package-build-profile.mjs";
import {
  ALLOWED_PROFILE_NAMES,
  GOSAKI_SITE_KEY,
  TOOL_ROOT,
  getSiteRegistryEntry,
  resolvePackageManifestMetaFromRegistry,
} from "./site-registry.mjs";

/**
 * @typedef {"package-dir"|"registry"|"legacy-gosaki-profile"} PackageFreshnessResolution
 */

/**
 * @typedef {object} PackageFreshnessTarget
 * @property {string} packageDir
 * @property {string | null} siteKey
 * @property {string} profileName
 * @property {PackageFreshnessResolution} resolution
 * @property {string} manualUploadOut
 */

/**
 * @param {{
 *   packageDir?: string | null,
 *   siteKey?: string | null,
 *   profileName?: string,
 *   toolRoot?: string,
 * }} options
 * @returns {PackageFreshnessTarget}
 */
export function resolvePackageFreshnessTarget(options = {}) {
  const toolRoot = options.toolRoot ?? TOOL_ROOT;
  const profileName = options.profileName ?? "staging";

  if (!ALLOWED_PROFILE_NAMES.includes(/** @type {typeof ALLOWED_PROFILE_NAMES[number]} */ (profileName))) {
    throw new Error(
      `Unknown profile "${profileName}" — allowed: ${ALLOWED_PROFILE_NAMES.join(", ")}`,
    );
  }

  if (options.packageDir) {
    const packageDir = path.isAbsolute(options.packageDir)
      ? options.packageDir
      : path.resolve(toolRoot, options.packageDir);
    return {
      packageDir,
      siteKey: options.siteKey ?? null,
      profileName,
      resolution: "package-dir",
      manualUploadOut: path.relative(toolRoot, packageDir).replace(/\\/g, "/"),
    };
  }

  if (options.siteKey) {
    getSiteRegistryEntry(options.siteKey, toolRoot);
    const meta = resolvePackageManifestMetaFromRegistry(options.siteKey, profileName, { toolRoot });
    return {
      packageDir: path.join(toolRoot, meta.manualUploadOut),
      siteKey: options.siteKey,
      profileName,
      resolution: "registry",
      manualUploadOut: meta.manualUploadOut,
    };
  }

  const profile = resolveGosakiPackageBuildProfile(profileName);
  return {
    packageDir: path.join(toolRoot, profile.manualUploadOut),
    siteKey: GOSAKI_SITE_KEY,
    profileName,
    resolution: "legacy-gosaki-profile",
    manualUploadOut: profile.manualUploadOut,
  };
}
