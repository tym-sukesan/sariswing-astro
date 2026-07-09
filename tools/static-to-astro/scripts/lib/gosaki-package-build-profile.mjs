/**
 * G-20h1 / G-20u2 — Gosaki package build deploy profile loader.
 * Delegates to site registry (config/sites/registry.json).
 * Kept for backward compatibility — existing wrappers import from here.
 */

import {
  ALLOWED_PROFILE_NAMES,
  GOSAKI_DEPLOY_PROFILES_REL,
  GOSAKI_SITE_KEY,
  SARISWING_PRODUCTION_SUPABASE_REF,
  STAGING_KIT_SUPABASE_REF,
  TOOL_ROOT,
  loadSiteDeployProfiles,
  resolveSitePackageBuildProfile,
} from "./site-registry.mjs";

export {
  ALLOWED_PROFILE_NAMES,
  GOSAKI_DEPLOY_PROFILES_REL,
  SARISWING_PRODUCTION_SUPABASE_REF,
  STAGING_KIT_SUPABASE_REF,
  TOOL_ROOT,
};

/**
 * @param {string} [toolRoot]
 */
export function loadGosakiDeployProfiles(toolRoot = TOOL_ROOT) {
  return loadSiteDeployProfiles(GOSAKI_SITE_KEY, toolRoot);
}

/**
 * @param {string} profileName
 * @param {{ toolRoot?: string }} [options]
 */
export function resolveGosakiPackageBuildProfile(profileName, options = {}) {
  return resolveSitePackageBuildProfile(GOSAKI_SITE_KEY, profileName, options);
}

/**
 * @param {string} profileName
 */
export function getGosakiPackageBuildProfileOrThrow(profileName) {
  return resolveGosakiPackageBuildProfile(profileName);
}
