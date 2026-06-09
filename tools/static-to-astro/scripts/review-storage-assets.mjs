#!/usr/bin/env node
/**
 * Generate storage asset review manifest from fixture HTML (G-4a dry-run).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/review-storage-assets.mjs \
 *     --site-slug gosaki \
 *     --fixture-dir tools/static-to-astro/fixtures/gosaki-static-site \
 *     --data-dir tools/static-to-astro/output/generated-astro/src/data \
 *     --report tools/static-to-astro/output/storage/gosaki/STORAGE_ASSET_REVIEW_REPORT.md \
 *     --manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildReviewManifestJson,
  buildStorageAssetReview,
  formatStorageAssetReviewReport,
} from "./lib/storage-asset-review-generator.mjs";
import {
  applySiteConfigToCli,
  attachSiteConfigMeta,
  formatSiteConfigReportFooter,
} from "./lib/site-config-loader.mjs";

const CLI_NAME = "review-storage-assets";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/review-storage-assets.mjs [options]

Extract image candidates from fixture HTML/CSS and map to legacy_id (read-only).

Options:
  --site-config PATH     Site config JSON (G-5c — resolves slug/paths; explicit args win)
  --site-slug SLUG       Site slug (required without --site-config)
  --fixture-dir PATH     Static fixture directory (required without --site-config)
  --data-dir PATH        schedules.json / discography.json for legacy_id mapping
  --report PATH          STORAGE_ASSET_REVIEW_REPORT.md output (required without --site-config)
  --manifest PATH        storage-asset-review-manifest.json output (required without --site-config)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteConfig: null,
    siteSlug: null,
    fixtureDir: null,
    dataDir: null,
    report: null,
    manifest: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--site-config") {
      opts.siteConfig = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--fixture-dir") {
      opts.fixtureDir = argv[++i];
      continue;
    }
    if (arg === "--data-dir") {
      opts.dataDir = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(review, configMeta = null) {
  const s = review.summary;
  console.log("");
  console.log("=== Storage Asset Review Summary (G-4a) ===");
  console.log(`mode: ${review.mode}`);
  if (configMeta?.configDriven) {
    console.log(`site config: ${configMeta.siteConfigPath}`);
    console.log(`config driven: yes`);
  }
  console.log(`siteSlug: ${review.siteSlug}`);
  console.log(`fixtureDir: ${review.fixtureDir}`);
  console.log(`dataDir: ${review.dataDir ?? "(not specified)"}`);
  console.log(`raw extractions: ${review.inputMeta.rawCandidatesExtracted}`);
  console.log(`manifest entries: ${s.totalCandidates}`);
  console.log(`reviewRequired: ${s.reviewRequired}`);
  console.log(`discography covers (wix): ${s.discographyCoverCandidates} / ${s.discographyCoverExpected}`);
  console.log(`home schedule images (wix): ${s.homeScheduleImageCandidates}`);
  console.log(`schedule flyers (wix): ${s.scheduleFlyerCandidates}`);
  console.log(`uploads performed: no`);
  console.log(`db update performed: no`);
  console.log(`secret leak: none (URLs only)`);
}

function main() {
  let opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const { opts: resolved, meta: configMeta } = applySiteConfigToCli(CLI_NAME, opts, {
    toolRoot: TOOL_ROOT,
    repoRoot: REPO_ROOT,
  });
  opts = /** @type {ReturnType<typeof parseArgs>} */ (resolved);

  if (!opts.siteSlug || !opts.fixtureDir || !opts.report || !opts.manifest) {
    printHelp();
    process.exit(1);
  }

  const fixtureDir = path.resolve(REPO_ROOT, opts.fixtureDir);
  const dataDir = opts.dataDir ? path.resolve(REPO_ROOT, opts.dataDir) : null;
  const reportPath = path.resolve(REPO_ROOT, opts.report);
  const manifestPath = path.resolve(REPO_ROOT, opts.manifest);

  if (!fs.existsSync(fixtureDir)) {
    console.error(`Fixture directory not found: ${fixtureDir}`);
    process.exit(1);
  }
  if (opts.dataDir && !fs.existsSync(dataDir)) {
    console.error(`Data directory not found: ${dataDir}`);
    process.exit(1);
  }

  console.log("Storage asset review (G-4a read-only)");
  console.log(`Fixture: ${opts.fixtureDir}`);
  console.log(`Data: ${opts.dataDir ?? "(not specified)"}`);
  console.log(`Site: ${opts.siteSlug}`);
  console.log("");

  const review = buildStorageAssetReview({
    siteSlug: opts.siteSlug,
    fixtureDir,
    dataDir,
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  const manifestJson = attachSiteConfigMeta(buildReviewManifestJson(review), configMeta);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifestJson, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reportPath,
    formatStorageAssetReviewReport(review, {
      reportPath: opts.report,
      manifestPath: opts.manifest,
    }) + formatSiteConfigReportFooter(configMeta),
    "utf8",
  );

  printSummary(review, configMeta);
  console.log("");
  console.log(`Report: ${opts.report}`);
  console.log(`Manifest: ${opts.manifest}`);
}

main();
