/**
 * G-20u19 — Registry-based fixture directory matching.
 * Replaces ad-hoc `isGosakiPianoFixture` checks in generator core / hook resolution.
 */

import path from "node:path";
import {
  GOSAKI_SITE_KEY,
  TOOL_ROOT,
  getSiteRegistryEntry,
  listRegistryFixtureDirRelatives,
  resolveSiteKeyFromFixtureDir,
} from "./site-registry.mjs";

/**
 * Match a fixture directory against a registry site's `fixtureDir` basename.
 *
 * @param {string} siteDir
 * @param {string} siteKey
 * @param {string} [toolRoot]
 */
export function matchRegistryFixtureDir(siteDir, siteKey, toolRoot = TOOL_ROOT) {
  const entry = getSiteRegistryEntry(siteKey, toolRoot);
  const inputBase = path.basename(path.resolve(siteDir));
  return listRegistryFixtureDirRelatives(entry).some(
    (rel) => path.basename(rel) === inputBase,
  );
}

/**
 * @param {string} siteDir
 * @param {string} [toolRoot]
 * @returns {string | null}
 */
export function resolveRegisteredSiteKeyFromFixtureDir(siteDir, toolRoot = TOOL_ROOT) {
  return resolveSiteKeyFromFixtureDir(siteDir, toolRoot);
}

/**
 * Legacy Gosaki-only basename check. Retained for gosaki-specific hook modules only.
 * Prefer `matchRegistryFixtureDir(siteDir, siteKey)` in generator core.
 *
 * @param {string} siteDir
 */
export function isLegacyGosakiPianoFixture(siteDir) {
  return matchRegistryFixtureDir(siteDir, GOSAKI_SITE_KEY);
}
