/**
 * Static site crawler core (G-7a).
 * Injectable fetchFn for tests; no network in verify script.
 */

import fs from "node:fs";
import path from "node:path";
import {
  extractFromHtml,
  rewriteSameOriginUrls,
} from "./static-site-crawler-extract.mjs";
import {
  urlToAssetRelativePath,
  urlToPageRelativePath,
} from "./static-site-crawler-path.mjs";
import {
  fetchRobotsTxt,
  isUrlAllowedByRobots,
} from "./static-site-crawler-robots.mjs";
import {
  getOrigin,
  isSameOrigin,
  matchPatterns,
  normalizeCrawlUrl,
  parseUrlSafe,
} from "./static-site-crawler-url.mjs";

export const DEFAULT_USER_AGENT = "static-to-astro-crawler/1.0 (+https://github.com/tym-sukesan/sariswing-astro; G-7a)";
export const DEFAULT_MAX_PAGES = 20;
export const DEFAULT_TIMEOUT_MS = 15000;
export const DEFAULT_CONCURRENCY = 2;
export const DEFAULT_DELAY_MS = 500;

/**
 * @typedef {Object} CrawlOptions
 * @property {string} startUrl
 * @property {string} siteSlug
 * @property {string} outDir
 * @property {number} maxPages
 * @property {boolean} sameOriginOnly
 * @property {boolean} respectRobots
 * @property {boolean} dryRun
 * @property {boolean} snapshot
 * @property {string} userAgent
 * @property {number} timeoutMs
 * @property {number} concurrency
 * @property {number} delayMs
 * @property {string[]} includePatterns
 * @property {string[]} excludePatterns
 * @property {typeof fetch} [fetchFn]
 */

/**
 * @param {Partial<CrawlOptions>} input
 * @returns {CrawlOptions & { origin: string }}
 */
export function resolveCrawlOptions(input) {
  const startUrl = input.startUrl?.trim();
  if (!startUrl) throw new Error("startUrl is required");
  const parsed = parseUrlSafe(startUrl);
  if (!parsed) throw new Error(`Invalid start URL: ${startUrl}`);
  const origin = parsed.origin;
  const siteSlug = input.siteSlug?.trim();
  if (!siteSlug) throw new Error("siteSlug is required");

  return {
    startUrl: parsed.href,
    siteSlug,
    outDir: input.outDir ?? path.join("fixtures", siteSlug),
    maxPages: input.maxPages ?? DEFAULT_MAX_PAGES,
    sameOriginOnly: input.sameOriginOnly !== false,
    respectRobots: input.respectRobots !== false,
    dryRun: input.dryRun === true,
    snapshot: input.snapshot === true,
    userAgent: input.userAgent ?? DEFAULT_USER_AGENT,
    timeoutMs: input.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    concurrency: Math.max(1, input.concurrency ?? DEFAULT_CONCURRENCY),
    delayMs: input.delayMs ?? DEFAULT_DELAY_MS,
    includePatterns: input.includePatterns ?? [],
    excludePatterns: input.excludePatterns ?? [],
    fetchFn: input.fetchFn ?? globalThis.fetch,
    origin,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} url
 * @param {CrawlOptions & { origin: string }} options
 */
async function fetchResource(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const res = await options.fetchFn(url, {
      headers: {
        "User-Agent": options.userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "";
    const body = await res.text();
    return { ok: res.ok, status: res.status, contentType, body, url: res.url || url };
  } finally {
    clearTimeout(timer);
  }
}

function shouldCrawlUrl(url, options) {
  if (options.sameOriginOnly && !isSameOrigin(url, options.origin)) return false;
  if (options.includePatterns.length && !matchPatterns(url, options.includePatterns)) {
    return false;
  }
  if (options.excludePatterns.length && matchPatterns(url, options.excludePatterns)) {
    return false;
  }
  return true;
}

/**
 * @param {CrawlOptions & { origin: string }} options
 */
export async function runStaticSiteCrawl(optionsInput) {
  const options = resolveCrawlOptions(optionsInput);
  const warnings = [];

  /** @type {Record<string, unknown>} */
  const manifest = {
    siteSlug: options.siteSlug,
    startUrl: options.startUrl,
    origin: options.origin,
    crawledAt: new Date().toISOString(),
    dryRun: options.dryRun,
    options: {
      maxPages: options.maxPages,
      sameOriginOnly: options.sameOriginOnly,
      respectRobots: options.respectRobots,
      userAgent: options.userAgent,
      timeoutMs: options.timeoutMs,
      concurrency: options.concurrency,
      delayMs: options.delayMs,
      includePatterns: options.includePatterns,
      excludePatterns: options.excludePatterns,
    },
    pages: [],
    assets: [],
    failed: [],
    warnings,
    stats: {
      pagesFetched: 0,
      assetsFetched: 0,
      pagesSkipped: 0,
      assetsSkipped: 0,
    },
  };

  let robotsBody = "";
  if (options.respectRobots && !options.dryRun) {
    const robots = await fetchRobotsTxt(options.origin, options.fetchFn, {
      userAgent: options.userAgent,
      timeoutMs: options.timeoutMs,
    });
    manifest.robots = {
      url: robots.robotsUrl,
      ok: robots.ok,
      status: robots.status,
      error: robots.error,
      failurePolicy: "warn-allow",
    };
    if (robots.ok) {
      robotsBody = robots.body;
    } else {
      warnings.push(
        `robots.txt fetch failed (${robots.error ?? robots.status}); continuing with warn-allow policy`,
      );
    }
  }

  if (options.respectRobots && options.dryRun) {
    manifest.robots = {
      url: `${options.origin}/robots.txt`,
      ok: null,
      status: null,
      error: null,
      failurePolicy: "warn-allow",
      skippedInDryRun: true,
    };
  }

  if (options.dryRun) {
    manifest.wouldWrite = !options.dryRun;
    manifest.wouldFetchFirstPage = options.startUrl;
    return { manifest, reportMarkdown: formatDryRunReport(manifest, options) };
  }

  const outAbs = path.resolve(process.cwd(), options.outDir);
  fs.mkdirSync(outAbs, { recursive: true });

  const queue = [normalizeCrawlUrl(options.startUrl, options.startUrl)];
  const seenPages = new Set();
  const seenAssets = new Set();
  /** @type {Map<string, string>} */
  const pendingAssets = new Map();

  while (queue.length > 0 && manifest.pages.length < options.maxPages) {
    const batch = queue.splice(0, options.concurrency);
    for (const pageUrl of batch) {
      if (!pageUrl || seenPages.has(pageUrl)) continue;
      if (manifest.pages.length >= options.maxPages) break;
      seenPages.add(pageUrl);

      if (!shouldCrawlUrl(pageUrl, options)) {
        manifest.stats.pagesSkipped += 1;
        continue;
      }
      if (
        options.respectRobots &&
        robotsBody &&
        !isUrlAllowedByRobots(robotsBody, pageUrl, options.userAgent)
      ) {
        manifest.failed.push({
          url: pageUrl,
          phase: "robots",
          reason: "disallowed by robots.txt",
        });
        continue;
      }

      let fetchResult;
      try {
        fetchResult = await fetchResource(pageUrl, options);
      } catch (err) {
        manifest.failed.push({
          url: pageUrl,
          phase: "fetch-page",
          reason: err instanceof Error ? err.message : String(err),
        });
        continue;
      }

      if (!fetchResult.ok) {
        manifest.failed.push({
          url: pageUrl,
          phase: "fetch-page",
          reason: `HTTP ${fetchResult.status}`,
        });
        continue;
      }

      const relativePath = urlToPageRelativePath(fetchResult.url);
      const extracted = extractFromHtml(fetchResult.body, fetchResult.url, options.origin, {
        sameOriginOnly: options.sameOriginOnly,
      });

      let htmlOut = fetchResult.body;
      if (options.sameOriginOnly) {
        htmlOut = rewriteSameOriginUrls(htmlOut, fetchResult.url, options.origin, (assetUrl) => {
          try {
            if (assetUrl.startsWith(options.origin)) {
              return urlToAssetRelativePath(assetUrl, options.origin);
            }
            return assetUrl;
          } catch {
            return assetUrl;
          }
        });
      }

      const fileAbs = path.join(outAbs, relativePath);
      fs.mkdirSync(path.dirname(fileAbs), { recursive: true });
      fs.writeFileSync(fileAbs, htmlOut, "utf8");
      manifest.stats.pagesFetched += 1;

      manifest.pages.push({
        url: fetchResult.url,
        relativePath,
        title: extracted.meta.title,
        description: extracted.meta.description,
        canonical: extracted.meta.canonical,
        status: fetchResult.status,
        contentType: fetchResult.contentType,
      });

      for (const link of extracted.pageLinks) {
        const normalized = normalizeCrawlUrl(link, fetchResult.url);
        if (!normalized || seenPages.has(normalized)) continue;
        if (shouldCrawlUrl(normalized, options)) queue.push(normalized);
      }

      for (const assetUrl of extracted.assetLinks) {
        const normalized = normalizeCrawlUrl(assetUrl, fetchResult.url, { stripQuery: false });
        if (!normalized || seenAssets.has(normalized)) continue;
        if (!isSameOrigin(normalized, options.origin)) continue;
        seenAssets.add(normalized);
        pendingAssets.set(normalized, relativePath);
      }

      if (options.delayMs > 0) await sleep(options.delayMs);
    }
  }

  for (const [assetUrl, fromPage] of pendingAssets.entries()) {
    if (manifest.stats.assetsFetched >= options.maxPages * 10) {
      warnings.push("asset fetch cap reached (maxPages * 10)");
      break;
    }
    let relativePath;
    try {
      relativePath = urlToAssetRelativePath(assetUrl, options.origin);
    } catch (err) {
      manifest.failed.push({
        url: assetUrl,
        phase: "fetch-asset",
        reason: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    try {
      const res = await fetchResource(assetUrl, options);
      if (!res.ok) {
        manifest.failed.push({
          url: assetUrl,
          phase: "fetch-asset",
          reason: `HTTP ${res.status}`,
        });
        continue;
      }
      const fileAbs = path.join(outAbs, relativePath);
      fs.mkdirSync(path.dirname(fileAbs), { recursive: true });
      fs.writeFileSync(fileAbs, res.body, "utf8");
      manifest.stats.assetsFetched += 1;
      manifest.assets.push({
        url: assetUrl,
        relativePath,
        contentType: res.contentType,
        status: res.status,
        fromPage,
      });
    } catch (err) {
      manifest.failed.push({
        url: assetUrl,
        phase: "fetch-asset",
        reason: err instanceof Error ? err.message : String(err),
      });
    }
    if (options.delayMs > 0) await sleep(options.delayMs);
  }

  const manifestPath = path.join(outAbs, "manifest.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const reportPath = path.join(outAbs, "CRAWL_REPORT.md");
  fs.writeFileSync(reportPath, formatCrawlReport(manifest, options, outAbs), "utf8");

  return { manifest, outDir: outAbs, manifestPath, reportPath };
}

function formatDryRunReport(manifest, options) {
  const lines = [
    "# Static site crawl — dry-run",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| siteSlug | \`${manifest.siteSlug}\` |`,
    `| startUrl | \`${manifest.startUrl}\` |`,
    `| origin | \`${manifest.origin}\` |`,
    `| outDir | \`${options.outDir}\` |`,
    `| maxPages | ${options.maxPages} |`,
    `| sameOriginOnly | ${options.sameOriginOnly} |`,
    `| respectRobots | ${options.respectRobots} |`,
    `| wouldWrite | false (dry-run) |`,
    `| wouldFetchFirstPage | \`${manifest.wouldFetchFirstPage ?? manifest.startUrl}\` |`,
    "",
  ];
  if (manifest.robots) {
    lines.push("## robots.txt", "");
    lines.push(`- url: ${manifest.robots.url}`);
    lines.push(`- ok: ${manifest.robots.ok}`);
    lines.push(`- failurePolicy: ${manifest.robots.failurePolicy}`);
    lines.push("");
  }
  if (manifest.warnings.length) {
    lines.push("## Safety warnings", "");
    for (const w of manifest.warnings) lines.push(`- ${w}`);
    lines.push("");
  }
  lines.push("_No files written. Re-run without `--dry-run` to crawl (operator approval required)._");
  return lines.join("\n");
}

function formatCrawlReport(manifest, options, outAbs) {
  return [
    "# Static site crawl report",
    "",
    `- siteSlug: ${manifest.siteSlug}`,
    `- outDir: ${outAbs}`,
    `- pages fetched: ${manifest.stats.pagesFetched}`,
    `- assets fetched: ${manifest.stats.assetsFetched}`,
    `- failed: ${manifest.failed.length}`,
    `- warnings: ${manifest.warnings.length}`,
    "",
    "See `manifest.json` for full details.",
  ].join("\n");
}

export { urlToPageRelativePath, urlToAssetRelativePath };
