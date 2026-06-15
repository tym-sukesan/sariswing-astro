#!/usr/bin/env node
/**
 * Crawl a static HTML site into a local fixture (G-7a).
 *
 * Usage:
 *   node scripts/crawl-static-site.mjs \
 *     --url https://www.example.com/ \
 *     --site-slug example \
 *     --out fixtures/example \
 *     --dry-run
 *
 * Default: dry-run is NOT automatic — pass --dry-run explicitly for safety.
 * Operator must approve live crawls. Do not crawl production without intent.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MAX_PAGES,
  runStaticSiteCrawl,
} from "./lib/static-site-crawler.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/crawl-static-site.mjs [options]

Crawl same-origin HTML pages and assets into a static fixture for static-to-astro.

Options:
  --url URL              Start URL (required)
  --site-slug SLUG       Site identifier for manifest (required)
  --out PATH             Output directory (default: fixtures/{site-slug})
  --max-pages N          Max HTML pages (default: ${DEFAULT_MAX_PAGES})
  --same-origin-only     Only follow same-origin links (default: true)
  --no-same-origin-only  Allow cross-origin page links (not recommended)
  --respect-robots       Check robots.txt (default: true)
  --no-respect-robots    Skip robots.txt
  --dry-run              Plan only; no fixture writes (may still fetch robots.txt)
  --snapshot             Reserved for future use
  --include PATTERNS     Comma-separated regex/substrings for URL filter
  --exclude PATTERNS     Comma-separated regex/substrings to skip
  --user-agent UA        Custom User-Agent
  --timeout-ms MS        Fetch timeout (default: 15000)
  --concurrency N        Parallel page fetches (default: 2)
  --delay-ms MS          Delay between requests (default: 500)
  --help, -h             Show help

Examples:
  node scripts/crawl-static-site.mjs \\
    --url https://www.example.com/ \\
    --site-slug example \\
    --out tools/static-to-astro/fixtures/example \\
    --dry-run

Run from repository root or tools/static-to-astro/.
`);
}

/**
 * @param {string[] | undefined} raw
 */
function splitPatterns(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseArgs(argv) {
  /** @type {Record<string, unknown>} */
  const opts = {
    url: null,
    siteSlug: null,
    out: null,
    maxPages: DEFAULT_MAX_PAGES,
    sameOriginOnly: true,
    respectRobots: true,
    dryRun: false,
    snapshot: false,
    userAgent: null,
    timeoutMs: null,
    concurrency: null,
    delayMs: null,
    include: [],
    exclude: [],
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--url") {
      opts.url = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--out") {
      opts.out = argv[++i];
      continue;
    }
    if (arg === "--max-pages") {
      opts.maxPages = Number(argv[++i]);
      continue;
    }
    if (arg === "--same-origin-only") {
      opts.sameOriginOnly = true;
      continue;
    }
    if (arg === "--no-same-origin-only") {
      opts.sameOriginOnly = false;
      continue;
    }
    if (arg === "--respect-robots") {
      opts.respectRobots = true;
      continue;
    }
    if (arg === "--no-respect-robots") {
      opts.respectRobots = false;
      continue;
    }
    if (arg === "--dry-run") {
      opts.dryRun = true;
      continue;
    }
    if (arg === "--snapshot") {
      opts.snapshot = true;
      continue;
    }
    if (arg === "--include") {
      opts.include = splitPatterns(argv[++i]);
      continue;
    }
    if (arg === "--exclude") {
      opts.exclude = splitPatterns(argv[++i]);
      continue;
    }
    if (arg === "--user-agent") {
      opts.userAgent = argv[++i];
      continue;
    }
    if (arg === "--timeout-ms") {
      opts.timeoutMs = Number(argv[++i]);
      continue;
    }
    if (arg === "--concurrency") {
      opts.concurrency = Number(argv[++i]);
      continue;
    }
    if (arg === "--delay-ms") {
      opts.delayMs = Number(argv[++i]);
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.url || !args.siteSlug) {
    printHelp();
    process.exit(1);
  }

  if (!Number.isFinite(args.maxPages) || args.maxPages < 1) {
    console.error("Error: --max-pages must be a positive number");
    process.exit(1);
  }

  const outDir =
    args.out ??
    path.join("tools/static-to-astro/fixtures", String(args.siteSlug));

  try {
    const result = await runStaticSiteCrawl({
      startUrl: String(args.url),
      siteSlug: String(args.siteSlug),
      outDir: String(outDir),
      maxPages: Number(args.maxPages),
      sameOriginOnly: Boolean(args.sameOriginOnly),
      respectRobots: Boolean(args.respectRobots),
      dryRun: Boolean(args.dryRun),
      snapshot: Boolean(args.snapshot),
      userAgent: args.userAgent ? String(args.userAgent) : undefined,
      timeoutMs: args.timeoutMs ?? undefined,
      concurrency: args.concurrency ?? undefined,
      delayMs: args.delayMs ?? undefined,
      includePatterns: /** @type {string[]} */ (args.include),
      excludePatterns: /** @type {string[]} */ (args.exclude),
    });

    if (args.dryRun) {
      console.log(result.reportMarkdown);
      console.log("");
      console.log("Dry-run complete. No fixture files written.");
      if (result.manifest.warnings.length) {
        console.log("Warnings:");
        for (const w of result.manifest.warnings) console.log(`  - ${w}`);
      }
      process.exit(0);
    }

    console.log(`Crawl complete.`);
    console.log(`  outDir: ${result.outDir}`);
    console.log(`  manifest: ${result.manifestPath}`);
    console.log(`  pages: ${result.manifest.stats.pagesFetched}`);
    console.log(`  assets: ${result.manifest.stats.assetsFetched}`);
    console.log(`  failed: ${result.manifest.failed.length}`);
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
