#!/usr/bin/env node
/**
 * Prepare storage upload allowlist from G-4a review manifest (G-4b-prep dry-run).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/prepare-storage-upload-allowlist.mjs \
 *     --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
 *     --site-slug gosaki \
 *     --report tools/static-to-astro/output/storage/gosaki/STORAGE_UPLOAD_ALLOWLIST_REPORT.md \
 *     --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildStorageUploadAllowlist,
  formatStorageUploadAllowlistReport,
  loadReviewManifest,
  validateStorageUploadAllowlist,
} from "./lib/storage-upload-allowlist-generator.mjs";
import {
  applySiteConfigToCli,
  attachSiteConfigMeta,
  formatSiteConfigReportFooter,
} from "./lib/site-config-loader.mjs";

const CLI_NAME = "prepare-storage-upload-allowlist";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/prepare-storage-upload-allowlist.mjs [options]

Build staging upload allowlist from G-4a review manifest (read-only).

Options:
  --site-config PATH       Site config JSON (G-5c — resolves slug/paths; explicit args win)
  --review-manifest PATH   storage-asset-review-manifest.json (required without --site-config)
  --site-slug SLUG         Site slug (required without --site-config)
  --report PATH            STORAGE_UPLOAD_ALLOWLIST_REPORT.md output (required without --site-config)
  --allowlist PATH         storage-upload-allowlist.json output (required without --site-config)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteConfig: null,
    reviewManifest: null,
    siteSlug: null,
    report: null,
    allowlist: null,
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
    if (arg === "--review-manifest") {
      opts.reviewManifest = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--allowlist") {
      opts.allowlist = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(allowlist, validation, configMeta = null) {
  const s = allowlist.summary;
  console.log("");
  console.log("=== Storage Upload Allowlist Summary (G-4b-prep) ===");
  console.log(`mode: ${allowlist.mode}`);
  if (configMeta?.configDriven) {
    console.log(`site config: ${configMeta.siteConfigPath}`);
    console.log(`config driven: yes`);
  }
  console.log(`siteSlug: ${allowlist.siteSlug}`);
  console.log(`uploadAllowed: ${allowlist.uploadAllowed}`);
  console.log(`dbUpdateAllowed: ${allowlist.dbUpdateAllowed}`);
  console.log(`approvedForStagingUpload: ${s.approvedForStagingUpload}`);
  console.log(`needsHumanReview: ${s.needsHumanReview}`);
  console.log(`rejectedOrDeferred: ${s.rejectedOrDeferred}`);
  console.log(`discography covers approved: ${s.discographyCoversApproved} / 4`);
  console.log(`schedule needs review: ${s.scheduleNeedsReview}`);
  console.log(`upload performed: no`);
  console.log(`db update performed: no`);
  console.log(`validation: ${validation.ok ? "PASS" : "FAIL"}`);
  if (!validation.ok) {
    for (const err of validation.errors) console.error(`  ERROR: ${err}`);
  }
  for (const warn of validation.warnings) console.warn(`  WARN: ${warn}`);
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

  if (!opts.reviewManifest || !opts.siteSlug || !opts.report || !opts.allowlist) {
    printHelp();
    process.exit(1);
  }

  const reviewManifestPath = path.resolve(REPO_ROOT, opts.reviewManifest);
  const reportPath = path.resolve(REPO_ROOT, opts.report);
  const allowlistPath = path.resolve(REPO_ROOT, opts.allowlist);

  if (!fs.existsSync(reviewManifestPath)) {
    console.error(`Review manifest not found: ${reviewManifestPath}`);
    process.exit(1);
  }

  console.log("Storage upload allowlist prep (G-4b-prep read-only)");
  console.log(`Review manifest: ${opts.reviewManifest}`);
  console.log(`Site: ${opts.siteSlug}`);
  console.log("");

  const reviewManifest = loadReviewManifest(reviewManifestPath);
  if (reviewManifest.siteSlug && reviewManifest.siteSlug !== opts.siteSlug) {
    console.warn(
      `WARN: review manifest siteSlug=${reviewManifest.siteSlug} differs from --site-slug=${opts.siteSlug}`,
    );
  }

  const allowlist = buildStorageUploadAllowlist(reviewManifest, { siteSlug: opts.siteSlug });
  const validation = validateStorageUploadAllowlist(allowlist);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(allowlistPath), { recursive: true });

  const allowlistOut = attachSiteConfigMeta(allowlist, configMeta);
  fs.writeFileSync(allowlistPath, `${JSON.stringify(allowlistOut, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    reportPath,
    formatStorageUploadAllowlistReport(allowlist, {
      reportPath: opts.report,
      allowlistPath: opts.allowlist,
      reviewManifestPath: opts.reviewManifest,
    }) + formatSiteConfigReportFooter(configMeta),
    "utf8",
  );

  printSummary(allowlist, validation, configMeta);
  console.log("");
  console.log(`Report: ${opts.report}`);
  console.log(`Allowlist: ${opts.allowlist}`);

  if (!validation.ok) {
    process.exit(1);
  }
}

main();
