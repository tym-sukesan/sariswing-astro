/**
 * Wix live-crawl static export visual overrides composer (G-7i → G-8c).
 * Appended to global.css when inline head styles are ingested (Wix crawl).
 */

import { buildWixStaticExportBaselineOverridesCss } from "./wix-static-export-baseline-overrides.mjs";
import {
  buildGosakiPianoSiteOverridesCss,
  GOSAKI_PIANO_SITE_SLUG,
} from "./site-specific-overrides/gosaki-piano-overrides.mjs";

/**
 * @param {{ siteSlug?: string }} [options]
 */
export function buildWixSiteSpecificOverridesCss(options = {}) {
  const slug = options.siteSlug ?? GOSAKI_PIANO_SITE_SLUG;
  if (slug === GOSAKI_PIANO_SITE_SLUG) {
    return buildGosakiPianoSiteOverridesCss({ siteSlug: slug });
  }
  return "";
}

/**
 * Baseline + optional site-specific Wix static export override CSS.
 * @param {{ siteSlug?: string }} [options]
 */
export function buildWixStagingVisualOverridesCss(options = {}) {
  const baseline = buildWixStaticExportBaselineOverridesCss();
  const siteSpecific = buildWixSiteSpecificOverridesCss(options);
  if (!siteSpecific.trim()) return baseline;
  return `${baseline}\n\n${siteSpecific}`;
}

/** @deprecated Prefer buildWixStaticExportBaselineOverridesCss for baseline-only checks */
export { buildWixStaticExportBaselineOverridesCss };

/**
 * @param {string} globalCss
 * @param {{ inlineHeadStyleCount?: number, siteSlug?: string }} [options]
 */
export function appendWixStagingVisualOverrides(globalCss, options = {}) {
  const count = options.inlineHeadStyleCount ?? 0;
  if (count <= 0) return globalCss;
  return `${globalCss.trimEnd()}\n\n${buildWixStagingVisualOverridesCss({ siteSlug: options.siteSlug })}\n`;
}
