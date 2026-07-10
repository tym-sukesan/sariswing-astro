/**
 * G-20u19 — Normalize site data bundle options for astro-generator / convert.
 * Primary names: scheduleBundle / discographyBundle.
 * Legacy aliases: gosakiScheduleBundle / gosakiDiscographyBundle.
 */

/**
 * @typedef {object} SiteDataBundles
 * @property {unknown} scheduleBundle
 * @property {unknown} discographyBundle
 */

/**
 * @param {Record<string, unknown>} [options]
 * @returns {SiteDataBundles}
 */
export function normalizeSiteDataBundles(options = {}) {
  const scheduleBundle =
    options.scheduleBundle ?? options.gosakiScheduleBundle ?? null;
  const discographyBundle =
    options.discographyBundle ?? options.gosakiDiscographyBundle ?? null;
  return { scheduleBundle, discographyBundle };
}

/**
 * Build generateAstroProject options with generic bundle keys (legacy aliases accepted on input).
 *
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
export function withNormalizedSiteDataBundles(options = {}) {
  const { scheduleBundle, discographyBundle } = normalizeSiteDataBundles(options);
  return {
    ...options,
    scheduleBundle,
    discographyBundle,
    gosakiScheduleBundle: scheduleBundle,
    gosakiDiscographyBundle: discographyBundle,
  };
}
