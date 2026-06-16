export type CanonicalMode = "production" | "staging-url" | "omitted";

/**
 * Resolve canonical / og:url for public pages.
 * Production (BASE_URL="/"): keep layout props (production URLs).
 * Staging subdirectory: use staging absolute URL; never emit production canonical.
 */
export function resolvePublicSeoUrls(input: {
  canonical?: string;
  ogUrl?: string;
  pathname: string;
}): { canonical: string; ogUrl: string; canonicalMode: CanonicalMode } {
  const deployBase = import.meta.env.BASE_URL;
  if (deployBase === "/") {
    const canonical = input.canonical ?? "";
    const ogUrl = input.ogUrl ?? canonical;
    return {
      canonical,
      ogUrl,
      canonicalMode: canonical ? "production" : "omitted",
    };
  }

  const siteRoot = (import.meta.env.SITE ?? "").replace(/\/+$/, "");
  if (!siteRoot) {
    return { canonical: "", ogUrl: "", canonicalMode: "omitted" };
  }

  // Legacy stub pages pass absolute canonical for /schedule/YYYY-MM/ — preserve it.
  if (input.canonical?.startsWith("http")) {
    const ogUrl = input.ogUrl?.startsWith("http") ? input.ogUrl : input.canonical;
    return {
      canonical: input.canonical,
      ogUrl,
      canonicalMode: "staging-url",
    };
  }

  let path = input.pathname.startsWith("/") ? input.pathname : `/${input.pathname}`;
  if (!path.endsWith("/")) path = `${path}/`;

  const base = deployBase.endsWith("/") ? deployBase : `${deployBase}/`;
  // pathname may already include deploy base (Astro subdirectory builds).
  // site (SITE) already includes the staging deploy path — do not prepend base again.
  if (base !== "/" && path.startsWith(base)) {
    path = path.slice(base.length - 1);
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path = `${path}/`;
  }

  const stagingUrl = path === "/" ? `${siteRoot}/` : `${siteRoot}${path}`;
  return {
    canonical: stagingUrl,
    ogUrl: stagingUrl,
    canonicalMode: "staging-url",
  };
}
