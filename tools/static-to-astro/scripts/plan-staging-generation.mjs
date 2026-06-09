#!/usr/bin/env node
/**
 * Plan staging generation from site config (G-5f read-only).
 * No Astro generation, DB create/update, Storage upload, or FTP deploy.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/plan-staging-generation.mjs \
 *     --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatStagingGenerationReport,
  planStagingGeneration,
} from "./lib/staging-generation-planner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/plan-staging-generation.mjs [options]

Generate staging generation plan from site config + template + schema adapter (read-only).

Options:
  --site-config PATH   Site config JSON (required)
  --report PATH        Markdown report (default: output/plans/{siteSlug}/STAGING_GENERATION_PLAN.md)
  --manifest PATH      JSON manifest (default: output/plans/{siteSlug}/staging-generation-plan.json)
  --registry PATH      Override template registry JSON
  --adapters PATH      Override schema adapters JSON
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteConfig: null,
    report: null,
    manifest: null,
    registry: null,
    adapters: null,
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
    if (arg === "--report") {
      opts.report = argv[++i];
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    if (arg === "--registry") {
      opts.registry = argv[++i];
      continue;
    }
    if (arg === "--adapters") {
      opts.adapters = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

function printSummary(plan, paths) {
  console.log("");
  console.log("=== Staging Generation Plan (G-5f) ===");
  console.log(`mode: ${plan.mode}`);
  console.log(`siteSlug: ${plan.siteSlug}`);
  console.log(`siteType: ${plan.siteType}`);
  console.log(`templateId: ${plan.templateId} (${plan.template.status})`);
  console.log(`schemaAdapterId: ${plan.schemaAdapterId} (${plan.schema.status})`);
  console.log(`pages: ${plan.template.pages.length}`);
  console.log(`content models: ${plan.template.contentModels.join(", ") || "(none)"}`);
  console.log(`schema tables: ${plan.schema.tables.length}`);
  console.log(`storage migration items: ${plan.storageMigrationPlan.length}`);
  console.log(
    `human review assets: ${
      plan.storageMigrationPlan
        .filter((m) => m.humanReviewRequired)
        .map((m) => m.assetType)
        .join(", ") || "(none)"
    }`,
  );
  console.log(`workflow steps: ${plan.recommendedWorkflow.length}`);
  console.log(`production ready: ${plan.productionReadiness.ready ? "yes" : "no"}`);
  console.log(`uploadPerformed: ${plan.safety.uploadPerformed}`);
  console.log(`dbCreatePerformed: ${plan.safety.dbCreatePerformed}`);
  console.log(`dbUpdatePerformed: ${plan.safety.dbUpdatePerformed}`);
  console.log(`ftpDeployPerformed: ${plan.safety.ftpDeployPerformed}`);
  console.log(`astroGenerationPerformed: ${plan.safety.astroGenerationPerformed}`);
  console.log(`report: ${paths.reportRelative}`);
  console.log(`manifest: ${paths.manifestRelative}`);

  if (plan.warnings.length) {
    console.log("warnings:");
    for (const w of plan.warnings) console.warn(`  WARN: ${w}`);
  }
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.siteConfig) {
    printHelp();
    process.exit(1);
  }

  const registryPath = opts.registry ? path.resolve(REPO_ROOT, opts.registry) : null;
  const adaptersPath = opts.adapters ? path.resolve(REPO_ROOT, opts.adapters) : null;

  console.log("Staging generation plan (G-5f read-only)");
  console.log(`Site config: ${opts.siteConfig}`);
  console.log("");

  const { plan, paths } = planStagingGeneration({
    siteConfigPath: opts.siteConfig,
    reportPath: opts.report,
    manifestPath: opts.manifest,
    templateRegistryPath: registryPath,
    adaptersPath,
    toolRoot: TOOL_ROOT,
  });

  fs.mkdirSync(path.dirname(paths.reportAbs), { recursive: true });
  fs.mkdirSync(path.dirname(paths.manifestAbs), { recursive: true });
  fs.writeFileSync(paths.reportAbs, formatStagingGenerationReport(plan), "utf8");
  fs.writeFileSync(paths.manifestAbs, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  printSummary(plan, paths);
  console.log("\nPlan written (read-only — no operations performed).");
}

main();
