#!/usr/bin/env node
/**
 * Generate schedule image human review table (G-4d read-only).
 *
 * Usage:
 *   node tools/static-to-astro/scripts/review-schedule-storage-assets.mjs \
 *     --allowlist tools/static-to-astro/output/storage/gosaki/storage-upload-allowlist.json \
 *     --review-manifest tools/static-to-astro/output/storage/gosaki/storage-asset-review-manifest.json \
 *     --data-dir tools/static-to-astro/output/generated-astro/src/data \
 *     --site-slug gosaki \
 *     --report tools/static-to-astro/output/storage/gosaki/SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md \
 *     --manifest tools/static-to-astro/output/storage/gosaki/schedule-image-human-review.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildScheduleHumanDecisionTemplate,
  buildScheduleHumanReview,
  buildScheduleHumanReviewManifest,
  formatScheduleHumanReviewReport,
} from "./lib/storage-schedule-human-review-generator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/review-schedule-storage-assets.mjs [options]

Build schedule image human review table from allowlist + review manifest (read-only).

Options:
  --allowlist PATH         storage-upload-allowlist.json (required)
  --review-manifest PATH   storage-asset-review-manifest.json (required)
  --data-dir PATH          schedules.json for legacy_id enrichment
  --site-slug SLUG         Site slug (required)
  --report PATH            SCHEDULE_IMAGE_HUMAN_REVIEW_REPORT.md (required)
  --manifest PATH          schedule-image-human-review.json (required)
  --decision-template PATH schedule-image-human-decision-template.json (optional)
  --fixture-dir PATH       Fixture HTML for alt/surrounding text (optional)
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    allowlist: null,
    reviewManifest: null,
    dataDir: null,
    siteSlug: null,
    report: null,
    manifest: null,
    decisionTemplate: null,
    fixtureDir: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--allowlist") {
      opts.allowlist = argv[++i];
      continue;
    }
    if (arg === "--review-manifest") {
      opts.reviewManifest = argv[++i];
      continue;
    }
    if (arg === "--data-dir") {
      opts.dataDir = argv[++i];
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
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    if (arg === "--decision-template") {
      opts.decisionTemplate = argv[++i];
      continue;
    }
    if (arg === "--fixture-dir") {
      opts.fixtureDir = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(review) {
  const s = review.summary;
  console.log("");
  console.log("=== Schedule Image Human Review Summary (G-4d) ===");
  console.log(`mode: ${review.mode}`);
  console.log(`siteSlug: ${review.siteSlug}`);
  console.log(`candidates: ${s.totalCandidates}`);
  console.log(`schedule_home: ${s.byAssetType.schedule_home ?? 0}`);
  console.log(`schedule_flyer: ${s.byAssetType.schedule_flyer ?? 0}`);
  console.log(`alt-date-conflict: ${s.altDateConflictCount}`);
  console.log(`excluded NO PHOTO: ${s.excludedNoPhoto}`);
  console.log(`humanDecision pending: ${s.humanDecisionPending}`);
  console.log(`upload performed: no`);
  console.log(`db update performed: no`);
  console.log(`secret leak: none`);
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.allowlist || !opts.reviewManifest || !opts.siteSlug || !opts.report || !opts.manifest) {
    printHelp();
    process.exit(1);
  }

  const allowlistPath = path.resolve(REPO_ROOT, opts.allowlist);
  const reviewManifestPath = path.resolve(REPO_ROOT, opts.reviewManifest);
  const reportPath = path.resolve(REPO_ROOT, opts.report);
  const manifestPath = path.resolve(REPO_ROOT, opts.manifest);
  const decisionTemplatePath = opts.decisionTemplate
    ? path.resolve(REPO_ROOT, opts.decisionTemplate)
    : path.join(path.dirname(manifestPath), "schedule-image-human-decision-template.json");
  const dataDir = opts.dataDir ? path.resolve(REPO_ROOT, opts.dataDir) : null;
  const fixtureDir = opts.fixtureDir ? path.resolve(REPO_ROOT, opts.fixtureDir) : null;

  if (!fs.existsSync(allowlistPath)) {
    console.error(`Allowlist not found: ${allowlistPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(reviewManifestPath)) {
    console.error(`Review manifest not found: ${reviewManifestPath}`);
    process.exit(1);
  }

  console.log("Schedule image human review (G-4d read-only)");
  console.log(`Allowlist: ${opts.allowlist}`);
  console.log(`Review manifest: ${opts.reviewManifest}`);
  console.log(`Data: ${opts.dataDir ?? "(not specified)"}`);
  console.log("");

  const review = buildScheduleHumanReview({
    allowlistPath,
    reviewManifestPath,
    dataDir,
    siteSlug: opts.siteSlug,
    fixtureDir,
  });

  const decisionTemplate = buildScheduleHumanDecisionTemplate(review);

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });

  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify(buildScheduleHumanReviewManifest(review), null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    reportPath,
    formatScheduleHumanReviewReport(review, {
      reportPath: opts.report,
      manifestPath: opts.manifest,
      decisionTemplatePath: path.relative(REPO_ROOT, decisionTemplatePath),
      allowlistPath: opts.allowlist,
      reviewManifestPath: opts.reviewManifest,
    }),
    "utf8",
  );
  fs.writeFileSync(
    decisionTemplatePath,
    `${JSON.stringify(decisionTemplate, null, 2)}\n`,
    "utf8",
  );

  printSummary(review);
  console.log("");
  console.log(`Report: ${opts.report}`);
  console.log(`Manifest: ${opts.manifest}`);
  console.log(`Decision template: ${path.relative(REPO_ROOT, decisionTemplatePath)}`);
}

main();
