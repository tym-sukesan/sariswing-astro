/**
 * Astro deploy base path helpers (staging subdirectory FTP).
 */

import fs from "node:fs";
import path from "node:path";

/**
 * @param {string | null | undefined} deployBase
 */
export function normalizeDeployBase(deployBase) {
  if (!deployBase?.trim() || deployBase.trim() === "/") return "/";
  let base = deployBase.trim().replace(/\\/g, "/");
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
}

/**
 * @param {string | null | undefined} deployBase
 */
export function isStagingSubdirBuild(deployBase) {
  return normalizeDeployBase(deployBase) !== "/";
}

/** Robots meta content for staging subdirectory deploys. */
export const STAGING_ROBOTS_META_CONTENT = "noindex,nofollow,noarchive";

/**
 * @param {string | null | undefined} deployBase
 */
export function shouldApplyStagingNoindex(deployBase) {
  return isStagingSubdirBuild(deployBase);
}

/** Production domain that must not appear in staging canonical / og:url. */
export const STAGING_CANONICAL_LEAK_PATTERN = /www\.gosaki-piano\.com/i;

/**
 * @param {string} html
 */
export function extractHeadHtml(html) {
  const match = html.match(/<head[^>]*>[\s\S]*?<\/head>/i);
  return match ? match[0] : html.slice(0, 8000);
}

/**
 * SEO meta URLs only — Wix-derived body content may legitimately link to production domains.
 * @param {string} html
 */
export function extractSeoMetaUrlsFromHtml(html) {
  const head = extractHeadHtml(html);
  const canonical = head.match(/<link rel="canonical" href="([^"]*)"/i)?.[1] ?? "";
  const ogUrl = head.match(/property="og:url" content="([^"]*)"/i)?.[1] ?? "";
  return { canonical, ogUrl, head };
}

/**
 * @param {string} html
 */
export function stagingCanonicalLeakInSeoMeta(html) {
  const { canonical, ogUrl } = extractSeoMetaUrlsFromHtml(html);
  return STAGING_CANONICAL_LEAK_PATTERN.test(`${canonical}${ogUrl}`);
}

/**
 * @param {string} html
 */
export function detectCanonicalModeFromHtml(html) {
  const { canonical, ogUrl } = extractSeoMetaUrlsFromHtml(html);
  if (!canonical && !ogUrl) return "omitted";
  if (STAGING_CANONICAL_LEAK_PATTERN.test(`${canonical}${ogUrl}`)) return "production-leak";
  if (/\/cms-kit-staging\//i.test(`${canonical}${ogUrl}`)) return "staging-url";
  return canonical ? "production" : "omitted";
}

/**
 * @param {string} publicDir
 */
function publicDirReferencesAstroAssets(publicDir) {
  const astroDir = path.join(publicDir, "_astro");
  if (fs.existsSync(astroDir)) return true;

  /** @param {string} dir */
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (walk(abs)) return true;
        continue;
      }
      if (!/\.(html|css|js|mjs)$/i.test(entry.name)) continue;
      const content = fs.readFileSync(abs, "utf8");
      if (/_astro\//.test(content)) return true;
    }
    return false;
  }

  return walk(publicDir);
}

/**
 * Verify noindex / robots.txt policy in built public HTML.
 * @param {string} publicDir
 * @param {string | null | undefined} deployBase
 */
export function verifyPublicDistSeoFlags(publicDir, deployBase) {
  const stagingBuild = isStagingSubdirBuild(deployBase);
  const indexPath = path.join(publicDir, "index.html");
  const linkPath = path.join(publicDir, "link", "index.html");
  const robotsPath = path.join(publicDir, "robots.txt");

  let hasNoindexMeta = false;
  let hasDisallowAll = false;
  let hasAllowRoot = false;
  let canonicalMode = stagingBuild ? "omitted" : "production";
  let stagingCanonicalOk = true;

  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, "utf8");
    hasNoindexMeta = new RegExp(
      `name="robots"\\s+content="${STAGING_ROBOTS_META_CONTENT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
      "i",
    ).test(html);
    canonicalMode = detectCanonicalModeFromHtml(html);
    if (stagingBuild) {
      const { canonical, ogUrl } = extractSeoMetaUrlsFromHtml(html);
      stagingCanonicalOk =
        !stagingCanonicalLeakInSeoMeta(html) &&
        !canonicalHasDuplicateDeployBase(canonical, deployBase) &&
        !canonicalHasDuplicateDeployBase(ogUrl, deployBase) &&
        (canonicalMode === "staging-url" || canonicalMode === "omitted");
    }
  }

  if (stagingBuild && fs.existsSync(linkPath)) {
    const linkHtml = fs.readFileSync(linkPath, "utf8");
    const { canonical, ogUrl } = extractSeoMetaUrlsFromHtml(linkHtml);
    if (
      stagingCanonicalLeakInSeoMeta(linkHtml) ||
      canonicalHasDuplicateDeployBase(canonical, deployBase) ||
      canonicalHasDuplicateDeployBase(ogUrl, deployBase)
    ) {
      stagingCanonicalOk = false;
    }
  }

  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, "utf8");
    hasDisallowAll = /User-agent:\s*\*/i.test(robots) && /Disallow:\s*\/\s*$/m.test(robots);
    hasAllowRoot = /Allow:\s*\/\s*$/m.test(robots);
  }

  const stagingNoindex = stagingBuild ? hasNoindexMeta : !hasNoindexMeta;
  const robotsDisallowAll = stagingBuild ? hasDisallowAll : !hasDisallowAll;
  const productionIndexable = !stagingBuild && !hasNoindexMeta && hasAllowRoot;

  if (stagingBuild && canonicalMode === "production-leak") {
    canonicalMode = "production-leak";
  }

  return {
    stagingBuild,
    stagingNoindex,
    robotsDisallowAll,
    productionIndexable,
    canonicalMode: stagingBuild
      ? canonicalMode === "production-leak"
        ? "production-leak"
        : canonicalMode === "staging-url"
          ? "staging-url"
          : "omitted"
      : canonicalMode === "production"
        ? "production"
        : "omitted",
    hasNoindexMeta,
    hasDisallowAll,
    hasAllowRoot,
    stagingCanonicalOk,
    ok: stagingBuild
      ? hasNoindexMeta && hasDisallowAll && stagingCanonicalOk
      : !hasNoindexMeta && hasAllowRoot,
  };
}

/**
 * @param {string} url
 * @param {string | null | undefined} deployBase
 */
export function canonicalHasDuplicateDeployBase(url, deployBase) {
  const segment = normalizeDeployBase(deployBase).replace(/^\/|\/$/g, "");
  if (!segment || !url) return false;
  const escaped = segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`/${escaped}/${escaped}(?:/|$)`, "i").test(url);
}

/**
 * Staging absolute URL from Astro site root + pathname (matches resolve-public-seo.ts).
 * @param {string | null | undefined} siteRoot
 * @param {string | null | undefined} deployBase
 * @param {string} pathname
 */
export function resolveStagingPublicUrl(siteRoot, deployBase, pathname) {
  const root = (siteRoot ?? "").trim().replace(/\/+$/, "");
  if (!root) return "";
  const base = normalizeDeployBase(deployBase);
  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (!path.endsWith("/")) path = `${path}/`;
  if (base !== "/" && path.startsWith(base)) {
    path = path.slice(base.length - 1);
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path = `${path}/`;
  }
  return path === "/" ? `${root}/` : `${root}${path}`;
}

export function buildDeployOrigin(baseUrl, deployBase = "/") {
  const site = (baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!site) return null;
  const base = normalizeDeployBase(deployBase);
  if (base === "/") return site;
  const basePath = base.slice(0, -1);
  if (site.toLowerCase().endsWith(basePath.toLowerCase())) {
    return site;
  }
  return `${site}${basePath}`;
}

/**
 * @param {string} astroDir
 */
export function readAstroDeployBaseFromConfig(astroDir) {
  const configPath = path.join(astroDir, "astro.config.mjs");
  try {
    const content = fs.readFileSync(configPath, "utf8");
    const match = content.match(/\bbase:\s*["']([^"']+)["']/);
    return match ? normalizeDeployBase(match[1]) : "/";
  } catch {
    return "/";
  }
}

/**
 * @param {string} publicDir
 * @param {string | null | undefined} deployBase
 */
export function verifyAssetPathsIncludeBase(publicDir, deployBase) {
  const base = normalizeDeployBase(deployBase);
  const indexPath = path.join(publicDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return { ok: false, reason: "index.html missing", deployBase: base };
  }

  const html = fs.readFileSync(indexPath, "utf8");

  if (base === "/") {
    const hasSubdirAssets = /\/cms-kit-staging\//i.test(html);
    return {
      ok: !hasSubdirAssets,
      deployBase: base,
      stagingSubdirBuild: false,
      assetPathsIncludeBase: !/\/cms-kit-staging\/gosaki\/_astro\//i.test(html),
      sampleCss: html.match(/href="([^"]*_astro[^"]*)"/)?.[1] ?? null,
      sampleNav: html.match(/href="([^"]*discography[^"]*)"/)?.[1] ?? null,
    };
  }

  const prefix = base.replace(/^\/|\/$/g, "");
  const needsAstroAssets = publicDirReferencesAstroAssets(publicDir);
  const assetOk = needsAstroAssets ? new RegExp(`/${prefix}/_astro/`).test(html) : true;
  const navOk = new RegExp(`href="/${prefix}/discography/"`).test(html);
  const pathsOk = navOk && assetOk;
  return {
    ok: pathsOk,
    deployBase: base,
    stagingSubdirBuild: true,
    assetPathsIncludeBase: pathsOk,
    needsAstroAssets,
    sampleCss: html.match(/href="([^"]*_astro[^"]*)"/)?.[1] ?? null,
    sampleNav: html.match(/href="([^"]*discography[^"]*)"/)?.[1] ?? null,
    reason: !navOk
      ? "missing base-prefixed nav link"
      : needsAstroAssets && !assetOk
        ? "missing base-prefixed _astro path"
        : null,
  };
}

/**
 * G-7e staging preview checks: canonical shape + nav internal link rewrite.
 * Production root deploy (deployBase=/) uses verifyProductionPreviewHtml instead.
 * @param {string} publicDir
 * @param {string | null | undefined} deployBase
 */
export function verifyStagingPreviewHtml(publicDir, deployBase) {
  const base = normalizeDeployBase(deployBase);
  if (base === "/") {
    return verifyProductionPreviewHtml(publicDir);
  }

  const prefix = base.replace(/^\/|\/$/g, "");
  const indexPath = path.join(publicDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return {
      ok: false,
      reason: "index.html missing",
      canonicalDoesNotContainProductionHost: false,
      canonicalDoesNotDuplicateDeployBase: false,
      ogUrlDoesNotContainProductionHost: false,
      navHomeRewritten: false,
      internalLinksRewritten: false,
    };
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const { canonical, ogUrl } = extractSeoMetaUrlsFromHtml(html);
  const navSection =
    html.match(/<nav[^>]*global-nav[^>]*>[\s\S]*?<\/nav>/i)?.[0] ??
    html.match(/<nav[^>]*>[\s\S]*?<\/nav>/i)?.[0] ??
    html.slice(0, 6000);

  const canonicalDoesNotContainProductionHost = !stagingCanonicalLeakInSeoMeta(
    extractHeadHtml(html),
  );
  const ogUrlDoesNotContainProductionHost = !STAGING_CANONICAL_LEAK_PATTERN.test(ogUrl);
  const canonicalDoesNotDuplicateDeployBase = !canonicalHasDuplicateDeployBase(canonical, deployBase);
  const ogUrlDoesNotDuplicateDeployBase = !canonicalHasDuplicateDeployBase(ogUrl, deployBase);
  const navHomeRewritten =
    !STAGING_CANONICAL_LEAK_PATTERN.test(navSection) &&
    !new RegExp(`/${prefix}/https?://`, "i").test(navSection) &&
    (new RegExp(`href="/${prefix}/"`).test(navSection) ||
      new RegExp(`href="/${prefix}"`).test(navSection));
  const headerSlice = html.slice(0, 12000);
  const internalLinksRewritten =
    !new RegExp(`/${prefix}/https?://`, "i").test(headerSlice) &&
    !/<nav[^>]*>[\s\S]*?href="https:\/\/www\.gosaki-piano\.com/i.test(html);

  const ok =
    canonicalDoesNotContainProductionHost &&
    canonicalDoesNotDuplicateDeployBase &&
    ogUrlDoesNotContainProductionHost &&
    ogUrlDoesNotDuplicateDeployBase &&
    navHomeRewritten &&
    internalLinksRewritten;

  return {
    ok,
    canonical,
    ogUrl,
    canonicalDoesNotContainProductionHost,
    canonicalDoesNotDuplicateDeployBase,
    ogUrlDoesNotContainProductionHost,
    ogUrlDoesNotDuplicateDeployBase,
    navHomeRewritten,
    internalLinksRewritten,
    reason: ok
      ? null
      : [
          !canonicalDoesNotContainProductionHost && "production host in canonical",
          !canonicalDoesNotDuplicateDeployBase && "duplicate deployBase in canonical",
          !ogUrlDoesNotContainProductionHost && "production host in og:url",
          !ogUrlDoesNotDuplicateDeployBase && "duplicate deployBase in og:url",
          !navHomeRewritten && "nav Home not rewritten to deployBase",
          !internalLinksRewritten && "internal nav still contains production URLs",
        ]
          .filter(Boolean)
          .join("; "),
  };
}

const PRODUCTION_HOST_PATTERN = /www\.gosaki-piano\.com/i;
const STAGING_HOST_LEAK_PATTERN = /yskcreate\.weblike\.jp|\/cms-kit-staging\//i;

/**
 * G-20h2 production package checks: production canonical/og:url + no staging leak.
 * @param {string} publicDir
 */
export function verifyProductionPreviewHtml(publicDir) {
  const indexPath = path.join(publicDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return {
      ok: false,
      reason: "index.html missing",
      productionHostInCanonical: false,
      productionHostInOgUrl: false,
      noStagingHostLeak: false,
      rootNavPaths: false,
      rootAssetPaths: false,
    };
  }

  const html = fs.readFileSync(indexPath, "utf8");
  const { canonical, ogUrl } = extractSeoMetaUrlsFromHtml(html);
  const head = extractHeadHtml(html);

  const productionHostInCanonical = PRODUCTION_HOST_PATTERN.test(canonical);
  const productionHostInOgUrl = PRODUCTION_HOST_PATTERN.test(ogUrl);
  const noStagingHostLeak = !STAGING_HOST_LEAK_PATTERN.test(`${canonical}${ogUrl}${head}`);
  const rootNavPaths =
    /href="\/discography\/"/.test(html) &&
    /href="\/schedule\/"/.test(html) &&
    !/\/cms-kit-staging\//i.test(html.slice(0, 15000));
  const rootAssetPaths =
    /href="\/_astro\//.test(html) && !/\/cms-kit-staging\/gosaki-piano\/_astro\//i.test(html);

  const ok =
    productionHostInCanonical &&
    productionHostInOgUrl &&
    noStagingHostLeak &&
    rootNavPaths &&
    rootAssetPaths;

  return {
    ok,
    canonical,
    ogUrl,
    productionHostInCanonical,
    productionHostInOgUrl,
    noStagingHostLeak,
    rootNavPaths,
    rootAssetPaths,
    canonicalDoesNotContainProductionHost: productionHostInCanonical,
    canonicalDoesNotDuplicateDeployBase: true,
    ogUrlDoesNotContainProductionHost: productionHostInOgUrl,
    ogUrlDoesNotDuplicateDeployBase: true,
    navHomeRewritten: rootNavPaths,
    internalLinksRewritten: noStagingHostLeak,
    reason: ok
      ? null
      : [
          !productionHostInCanonical && "canonical missing production host",
          !productionHostInOgUrl && "og:url missing production host",
          !noStagingHostLeak && "staging host leak in SEO meta",
          !rootNavPaths && "nav links not root-prefixed",
          !rootAssetPaths && "asset paths not root /_astro/",
        ]
          .filter(Boolean)
          .join("; "),
  };
}

/** Minimum non-whitespace chars in a built `<style>` block to count as layout CSS. */
export const MIN_PUBLIC_DIST_INLINE_STYLE_CHARS = 500;

const PUBLIC_DIST_CSS_SAMPLE_PAGES = ["index.html", "about/index.html"];

/**
 * Map stylesheet href from built HTML to a file under public-dist (strips deployBase prefix).
 * @param {string} publicDir
 * @param {string} href
 * @param {string | null | undefined} deployBase
 */
export function resolvePublicDistAssetPath(publicDir, href, deployBase) {
  const trimmed = href.split("?")[0].split("#")[0];
  const base = normalizeDeployBase(deployBase);
  let rel = trimmed;
  if (base !== "/" && rel.startsWith(base)) {
    rel = rel.slice(base.length);
  }
  rel = rel.replace(/^\/+/, "");
  return path.join(publicDir, rel);
}

/**
 * Verify built public-dist HTML includes resolvable CSS (local file, external link, or substantial inline).
 * @param {string} publicDir
 * @param {string | null | undefined} [deployBase]
 */
export function verifyPublicDistCssPresence(publicDir, deployBase = null) {
  /** @type {string[]} */
  const checks = [];
  /** @type {string[]} */
  const errors = [];
  let hasResolvableStylesheet = false;
  let hasSubstantialInlineCss = false;
  let maxInlineStyleChars = 0;

  for (const rel of PUBLIC_DIST_CSS_SAMPLE_PAGES) {
    const filePath = path.join(publicDir, rel);
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, "utf8");

    for (const tag of html.matchAll(/<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)) {
      const hrefMatch = tag[0].match(/href=["']([^"']+)["']/i);
      if (!hrefMatch) continue;
      const href = hrefMatch[1];
      if (/^https?:\/\//i.test(href)) {
        hasResolvableStylesheet = true;
        checks.push(`${rel}: external stylesheet ${href.slice(0, 96)}`);
        continue;
      }
      const localPath = resolvePublicDistAssetPath(publicDir, href, deployBase);
      const exists = fs.existsSync(localPath);
      checks.push(`${rel}: local stylesheet ${href} → ${exists ? "ok" : "missing"}`);
      if (exists) hasResolvableStylesheet = true;
      else errors.push(`${rel}: missing local CSS file for href=${href}`);
    }

    for (const block of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
      const len = block[1].trim().length;
      maxInlineStyleChars = Math.max(maxInlineStyleChars, len);
      if (len >= MIN_PUBLIC_DIST_INLINE_STYLE_CHARS) {
        hasSubstantialInlineCss = true;
        checks.push(`${rel}: inline style ${len} chars`);
      }
    }
  }

  const ok = hasResolvableStylesheet || hasSubstantialInlineCss;
  if (!ok) {
    errors.push(
      `no substantial CSS in public-dist (max inline style ${maxInlineStyleChars} chars; need link or >= ${MIN_PUBLIC_DIST_INLINE_STYLE_CHARS})`,
    );
  }

  return {
    ok,
    hasResolvableStylesheet,
    hasSubstantialInlineCss,
    maxInlineStyleChars,
    checks,
    errors,
    reason: ok ? null : errors.join("; "),
  };
}
