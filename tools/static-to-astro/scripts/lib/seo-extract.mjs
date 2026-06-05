import { resolveRef } from "./static-site-analyzer.mjs";

const FAVICON_RELS = ["icon", "shortcut icon", "apple-touch-icon"];

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {string} pageRelPath
 */
export function extractSeo($, pageRelPath) {
  const lang = $("html").attr("lang")?.trim() || "ja";
  const title = $("title").first().text().trim() || "";
  const description = $('meta[name="description"]').attr("content")?.trim() || "";
  const canonicalRaw = $('link[rel="canonical"]').attr("href")?.trim() || "";

  const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() || "";
  const ogDescription = $('meta[property="og:description"]').attr("content")?.trim() || "";
  const ogImageRaw = $('meta[property="og:image"]').attr("content")?.trim() || "";
  const ogType = $('meta[property="og:type"]').attr("content")?.trim() || "";
  const ogUrlRaw = $('meta[property="og:url"]').attr("content")?.trim() || "";
  const twitterCard = $('meta[name="twitter:card"]').attr("content")?.trim() || "";

  let faviconRaw = "";
  let appleTouchIconRaw = "";

  $("link[rel][href]").each((_, el) => {
    const rel = ($(el).attr("rel") ?? "").toLowerCase();
    const href = $(el).attr("href")?.trim();
    if (!href) return;
    if (rel.includes("apple-touch-icon") && !appleTouchIconRaw) {
      appleTouchIconRaw = href;
    }
    if ((rel === "icon" || rel === "shortcut icon") && !faviconRaw) {
      faviconRaw = href;
    }
  });

  if (!faviconRaw && appleTouchIconRaw) faviconRaw = appleTouchIconRaw;

  const ogImageResolved = resolveSeoAssetRef(ogImageRaw, pageRelPath);
  const faviconResolved = resolveSeoAssetRef(faviconRaw, pageRelPath);
  const appleResolved = resolveSeoAssetRef(appleTouchIconRaw, pageRelPath);
  const canonicalResolved = resolveCanonical(canonicalRaw, pageRelPath);

  return {
    title,
    description,
    canonical: canonicalResolved.href,
    canonicalRaw,
    canonicalKind: canonicalResolved.kind,
    ogTitle,
    ogDescription,
    ogImage: ogImageResolved.href,
    ogImageRaw,
    ogImageKind: ogImageResolved.kind,
    ogType,
    ogUrl: resolveCanonical(ogUrlRaw || canonicalRaw, pageRelPath).href,
    ogUrlRaw,
    twitterCard,
    favicon: faviconResolved.href,
    faviconRaw,
    faviconKind: faviconResolved.kind,
    appleTouchIcon: appleResolved.href,
    appleTouchIconRaw,
    appleTouchIconKind: appleResolved.kind,
    lang,
  };
}

function resolveSeoAssetRef(ref, pageRelPath) {
  if (!ref) return { href: "", kind: "none", raw: "" };
  if (/^https?:\/\//i.test(ref)) return { href: ref, kind: "external", raw: ref };
  if (ref.startsWith("data:")) return { href: ref, kind: "data", raw: ref };

  const resolved = resolveRef(ref, pageRelPath);
  return { href: toPublicSeoPath(resolved.href), kind: resolved.kind, raw: ref };
}

function resolveCanonical(ref, pageRelPath) {
  if (!ref) return { href: "", kind: "none" };
  if (/^https?:\/\//i.test(ref)) return { href: ref, kind: "external" };
  const resolved = resolveRef(ref, pageRelPath);
  if (resolved.kind === "internal") {
    return { href: resolved.href, kind: "internal" };
  }
  return { href: ref, kind: "special" };
}

/** Map internal asset path to Astro public URL. */
export function toPublicSeoPath(resolvedHref) {
  if (!resolvedHref) return "";
  if (/^https?:\/\//i.test(resolvedHref)) return resolvedHref;

  let p = resolvedHref.replace(/^\//, "");
  if (p.startsWith("images/") || p.startsWith("assets/")) return `/${p}`;
  if (/\.(svg|ico|png|jpe?g|webp|gif)$/i.test(p)) {
    if (p.includes("/")) return `/${p}`;
    return `/${p}`;
  }
  return `/${p}`;
}

const SEO_FIELDS = [
  "title",
  "description",
  "canonical",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "ogType",
  "ogUrl",
  "twitterCard",
  "favicon",
  "lang",
];

/**
 * Props for BaseLayout / page generation (Astro output paths).
 */
export function seoToLayoutProps(seo) {
  return {
    title: seo.title || "Untitled",
    description: seo.description || "",
    canonical: seo.canonical || "",
    ogTitle: seo.ogTitle || seo.title || "Untitled",
    ogDescription: seo.ogDescription || seo.description || "",
    ogImage: seo.ogImage || "",
    ogType: seo.ogType || "website",
    ogUrl: seo.ogUrl || seo.canonical || "",
    twitterCard: seo.twitterCard || "summary_large_image",
    favicon: seo.favicon || "",
    lang: seo.lang || "ja",
  };
}

export function listMissingSeoFields(seo) {
  const missing = [];
  if (!seo.title) missing.push("title");
  if (!seo.description) missing.push("description");
  if (!seo.canonical) missing.push("canonical");
  if (!seo.ogTitle) missing.push("og:title");
  if (!seo.ogDescription) missing.push("og:description");
  if (!seo.ogImage) missing.push("og:image");
  if (!seo.favicon) missing.push("favicon");
  return missing;
}

export function collectInternalSeoAssetPaths(pages) {
  const paths = new Set();
  for (const page of pages) {
    const seo = page.seo;
    if (!seo) continue;
    for (const key of ["ogImageRaw", "faviconRaw", "appleTouchIconRaw"]) {
      const raw = seo[key];
      if (!raw || /^https?:\/\//i.test(raw) || raw.startsWith("data:")) continue;
      const resolved = resolveRef(raw, page.sourcePath);
      if (resolved.kind === "internal") paths.add(resolved.href.replace(/^\//, ""));
    }
  }
  return [...paths];
}

export { SEO_FIELDS };
