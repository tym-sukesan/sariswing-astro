/**
 * G-20u19 — Normalize site data bundle options for astro-generator / convert.
 * Primary names: scheduleBundle / discographyBundle.
 * Legacy aliases: gosakiScheduleBundle / gosakiDiscographyBundle.
 */

/**
 * @typedef {object} SiteDataBundles
 * @property {unknown} scheduleBundle
 * @property {unknown} discographyBundle
 * @property {unknown} embedsBundle
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
  const embedsBundle =
    options.embedsBundle ?? options.siteEmbedsBundle ?? options.gosakiEmbedsBundle ?? null;
  const pageFieldsBundle =
    options.pageFieldsBundle ??
    options.sitePageFieldsBundle ??
    options.gosakiPageFieldsBundle ??
    null;
  return { scheduleBundle, discographyBundle, embedsBundle, pageFieldsBundle };
}

/**
 * Build generateAstroProject options with generic bundle keys (legacy aliases accepted on input).
 *
 * @param {Record<string, unknown>} options
 * @returns {Record<string, unknown>}
 */
export function withNormalizedSiteDataBundles(options = {}) {
  const { scheduleBundle, discographyBundle, embedsBundle, pageFieldsBundle } =
    normalizeSiteDataBundles(options);
  return {
    ...options,
    scheduleBundle,
    discographyBundle,
    embedsBundle,
    siteEmbedsBundle: embedsBundle,
    pageFieldsBundle,
    sitePageFieldsBundle: pageFieldsBundle,
    gosakiScheduleBundle: scheduleBundle,
    gosakiDiscographyBundle: discographyBundle,
    gosakiEmbedsBundle: embedsBundle,
    gosakiPageFieldsBundle: pageFieldsBundle,
  };
}
