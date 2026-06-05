/**
 * baseUrl normalization for canonical / og:url / og:image (Phase 2-D).
 */

/**
 * @param {string} baseUrl
 */
export function normalizeBaseUrl(baseUrl) {
  if (!baseUrl?.trim()) return null;
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(`Invalid --base-url (must start with http:// or https://): ${baseUrl}`);
  }
  return trimmed;
}

/**
 * @param {string} baseUrl
 * @param {string} route e.g. `/`, `/about/`
 */
export function routeToAbsoluteUrl(baseUrl, route) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return "";
  if (!route || route === "/") return `${base}/`;
  const path = route.startsWith("/") ? route : `/${route}`;
  const withSlash = path.endsWith("/") ? path : `${path}/`;
  return `${base}${withSlash}`;
}

/**
 * @param {string} baseUrl
 * @param {string} assetPath site-root path e.g. `/images/ogp.jpg`
 */
export function toAbsoluteAssetUrl(baseUrl, assetPath) {
  if (!assetPath) return "";
  if (/^https?:\/\//i.test(assetPath) || assetPath.startsWith("data:")) return assetPath;
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return assetPath;
  const path = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${base}${path}`;
}

/**
 * Apply baseUrl to SEO fields for Astro layout output.
 * favicon / apple-touch-icon stay site-root relative.
 *
 * @param {object} seo extracted SEO
 * @param {string} route Astro route
 * @param {string | null} baseUrl
 */
export function applyBaseUrlToSeo(seo, route, baseUrl) {
  const normalized = normalizeBaseUrl(baseUrl);
  if (!normalized) {
    return {
      ...seo,
      baseUrlApplied: false,
    };
  }

  const canonicalOriginal = seo.canonical || "";
  const ogUrlOriginal = seo.ogUrl || "";
  const ogImageOriginal = seo.ogImage || "";

  const canonical = routeToAbsoluteUrl(normalized, route);
  const ogUrl = canonical;
  let ogImage = seo.ogImage || "";
  if (ogImage && !/^https?:\/\//i.test(ogImage) && !ogImage.startsWith("data:")) {
    ogImage = toAbsoluteAssetUrl(normalized, ogImage);
  }

  return {
    ...seo,
    canonical,
    ogUrl,
    ogImage,
    canonicalOriginal,
    ogUrlOriginal,
    ogImageOriginal,
    baseUrlApplied: true,
    baseUrl: normalized,
  };
}

/**
 * @param {Array<{ seo: object, route: string, sourcePath: string }>} pages
 * @param {string | null} baseUrl
 */
export function applyBaseUrlToPages(pages, baseUrl) {
  if (!normalizeBaseUrl(baseUrl)) return pages;
  return pages.map((page) => ({
    ...page,
    seo: applyBaseUrlToSeo(page.seo, page.route, baseUrl),
  }));
}

/**
 * Pages that still need manual production-domain review when baseUrl was not set.
 */
export function pagesNeedingDomainReview(pages) {
  return pages
    .filter((page) => {
      const { canonical, ogUrl, ogImage } = page.seo;
      if (!canonical || !ogUrl) return true;
      if (canonical.startsWith("/")) return true;
      if (ogUrl.startsWith("/")) return true;
      if (ogImage && ogImage.startsWith("/")) return true;
      if (/example\.(com|org|net)/i.test(canonical)) return true;
      return false;
    })
    .map((page) => ({
      file: page.sourcePath,
      route: page.route,
      canonical: page.seo.canonical || "—",
      ogUrl: page.seo.ogUrl || "—",
      ogImage: page.seo.ogImage || "—",
    }));
}
