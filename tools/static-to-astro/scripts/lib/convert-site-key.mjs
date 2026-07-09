/**
 * G-20u7 — Resolve effective siteKey for convert-static-to-astro.
 */

import {
  TOOL_ROOT,
  assertRegisteredSiteKey,
  resolveSiteKeyFromFixtureDir,
} from "./site-registry.mjs";

/**
 * @param {string | null} explicitSiteKey
 * @param {string} inputAbs
 * @param {string} [toolRoot]
 * @returns {string | null}
 */
export function resolveEffectiveConvertSiteKey(explicitSiteKey, inputAbs, toolRoot = TOOL_ROOT) {
  if (explicitSiteKey) {
    return assertRegisteredSiteKey(explicitSiteKey, toolRoot);
  }
  return resolveSiteKeyFromFixtureDir(inputAbs, toolRoot);
}
