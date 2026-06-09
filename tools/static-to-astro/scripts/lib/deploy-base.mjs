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
export function detectCanonicalModeFromHtml(html) {
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/i)?.[1] ?? "";
  const ogUrl = html.match(/property="og:url" content="([^"]*)"/i)?.[1] ?? "";
  if (!canonical && !ogUrl) return "omitted";
  if (STAGING_CANONICAL_LEAK_PATTERN.test(`${canonical}${ogUrl}`)) return "production-leak";
  if (/\/cms-kit-staging\//i.test(`${canonical}${ogUrl}`)) return "staging-url";
  return canonical ? "production" : "omitted";
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
      stagingCanonicalOk =
        !STAGING_CANONICAL_LEAK_PATTERN.test(html) &&
        (canonicalMode === "staging-url" || canonicalMode === "omitted");
    }
  }

  if (stagingBuild && fs.existsSync(linkPath)) {
    const linkHtml = fs.readFileSync(linkPath, "utf8");
    if (STAGING_CANONICAL_LEAK_PATTERN.test(linkHtml)) {
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
 * @param {string | null | undefined} baseUrl
 * @param {string | null | undefined} deployBase
 */
export function buildDeployOrigin(baseUrl, deployBase = "/") {
  const site = (baseUrl ?? "").trim().replace(/\/+$/, "");
  if (!site) return null;
  const base = normalizeDeployBase(deployBase);
  if (base === "/") return site;
  return `${site}${base.slice(0, -1)}`;
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
  const assetOk = new RegExp(`/${prefix}/_astro/`).test(html);
  const navOk = new RegExp(`href="/${prefix}/discography/"`).test(html);
  return {
    ok: assetOk && navOk,
    deployBase: base,
    stagingSubdirBuild: true,
    assetPathsIncludeBase: assetOk && navOk,
    sampleCss: html.match(/href="([^"]*_astro[^"]*)"/)?.[1] ?? null,
    sampleNav: html.match(/href="([^"]*discography[^"]*)"/)?.[1] ?? null,
    reason: !assetOk ? "missing base-prefixed _astro path" : !navOk ? "missing base-prefixed nav link" : null,
  };
}
