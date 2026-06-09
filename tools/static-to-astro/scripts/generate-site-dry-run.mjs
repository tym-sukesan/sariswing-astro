#!/usr/bin/env node
/**
 * Generate dry-run site generation package from staging plan (G-5g).
 * No Astro generation, DB create/update, Storage upload, or FTP deploy.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
 *     --plan tools/static-to-astro/output/plans/gosaki/staging-generation-plan.json
 *
 *   node tools/static-to-astro/scripts/generate-site-dry-run.mjs \
 *     --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
 */

import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  generateSiteDryRunPackage,
  writeGenerationPackage,
} from "./lib/site-generation-dry-runner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");

function printHelp() {
  console.log(`Usage: node scripts/generate-site-dry-run.mjs [options]

Build dry-run generation package from staging-generation-plan.json (read-only).

Options:
  --plan PATH          staging-generation-plan.json (from plan-staging-generation.mjs)
  --site-config PATH   Build plan internally, then generate package
  --out-dir PATH       Output directory (default: output/generation-packages/{siteSlug})
  --adapters PATH      Override schema adapters JSON
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    plan: null,
    siteConfig: null,
    outDir: null,
    adapters: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--plan") {
      opts.plan = argv[++i];
      continue;
    }
    if (arg === "--site-config") {
      opts.siteConfig = argv[++i];
      continue;
    }
    if (arg === "--out-dir") {
      opts.outDir = argv[++i];
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

function printSummary(result) {
  const pkg = result.artifacts.generationPackage;
  console.log("");
  console.log("=== Dry-Run Generation Package (G-5g) ===");
  console.log(`mode: ${pkg.mode}`);
  console.log(`siteSlug: ${pkg.siteSlug}`);
  console.log(`templateId: ${pkg.templateId}`);
  console.log(`schemaAdapterId: ${pkg.schemaAdapterId}`);
  console.log(`out dir: ${result.outDirRelative}`);
  console.log(`planned pages: ${pkg.summary.plannedPages}`);
  console.log(`planned components: ${pkg.summary.plannedComponents}`);
  console.log(`planned files (total): ${pkg.summary.totalPlannedFiles}`);
  console.log(`supabase tables: ${pkg.summary.plannedSupabaseTables}`);
  console.log(`storage asset types: ${pkg.summary.plannedStorageAssetTypes}`);
  console.log(`human review tasks: ${pkg.summary.humanReviewTasks}`);
  console.log(`production ready: ${pkg.productionReadiness.ready ? "yes" : "no"}`);
  console.log(`astroGenerationPerformed: ${pkg.safety.astroGenerationPerformed}`);
  console.log(`dbCreatePerformed: ${pkg.safety.dbCreatePerformed}`);
  console.log(`dbUpdatePerformed: ${pkg.safety.dbUpdatePerformed}`);
  console.log(`storageUploadPerformed: ${pkg.safety.storageUploadPerformed}`);
  console.log(`ftpDeployPerformed: ${pkg.safety.ftpDeployPerformed}`);
  console.log(`productionTouched: ${pkg.safety.productionTouched}`);

  if (pkg.warnings.length) {
    console.log("warnings:");
    for (const w of pkg.warnings) console.warn(`  WARN: ${w}`);
  }
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.plan && !opts.siteConfig) {
    printHelp();
    process.exit(1);
  }

  const adaptersPath = opts.adapters
    ? path.resolve(path.resolve(TOOL_ROOT, "../.."), opts.adapters)
    : null;

  console.log("Dry-run site generation package (G-5g read-only)");
  if (opts.plan) console.log(`Plan: ${opts.plan}`);
  if (opts.siteConfig) console.log(`Site config: ${opts.siteConfig}`);
  if (opts.outDir) console.log(`Out dir: ${opts.outDir}`);
  console.log("");

  const result = generateSiteDryRunPackage({
    planPath: opts.plan,
    siteConfigPath: opts.siteConfig,
    outDir: opts.outDir,
    adaptersPath,
    toolRoot: TOOL_ROOT,
  });

  writeGenerationPackage(result);
  printSummary(result);
  console.log("\nGeneration package written (dry-run — no operations performed).");
}

main();
