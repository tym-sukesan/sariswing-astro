#!/usr/bin/env node
/**
 * Generate admin scaffold dry-run package from site config (G-5s).
 * No runtime admin files, Supabase, DB update, Storage upload, or deploy.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/generate-admin-scaffold-dry-run.mjs \
 *     --site-config tools/static-to-astro/config/sites/gosaki.site-config.example.json
 */

import {
  generateAdminScaffoldDryRunPackage,
  writeAdminScaffoldPackage,
} from "./lib/admin-scaffold-dry-runner.mjs";

function printHelp() {
  console.log(`Usage: node scripts/generate-admin-scaffold-dry-run.mjs [options]

Generate admin scaffold dry-run package (read-only inputs → output package).
No runtime admin files, Supabase, DB, Storage upload, FTP, or GitHub dispatch.

Options:
  --site-config PATH              Site config JSON (required)
  --out-dir PATH                  Output dir (default: output/admin-scaffold-packages/{siteSlug})
  --template-registry PATH        Override cms-template-registry.json
  --schema-adapters PATH          Override cms-schema-adapters.json
  --admin-components-registry PATH Override admin-ui-components-registry.json
  --preview-manifest PATH        Override preview-manifest.json
  --site-slug SLUG                Override siteSlug from config
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    siteConfig: null,
    outDir: null,
    templateRegistry: null,
    schemaAdapters: null,
    adminComponentsRegistry: null,
    previewManifest: null,
    siteSlug: null,
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
    if (arg === "--out-dir") {
      opts.outDir = argv[++i];
      continue;
    }
    if (arg === "--template-registry") {
      opts.templateRegistry = argv[++i];
      continue;
    }
    if (arg === "--schema-adapters") {
      opts.schemaAdapters = argv[++i];
      continue;
    }
    if (arg === "--admin-components-registry") {
      opts.adminComponentsRegistry = argv[++i];
      continue;
    }
    if (arg === "--preview-manifest") {
      opts.previewManifest = argv[++i];
      continue;
    }
    if (arg === "--site-slug") {
      opts.siteSlug = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/**
 * @param {ReturnType<typeof generateAdminScaffoldDryRunPackage>} result
 */
function printSummary(result) {
  const pkg = result.artifacts.generationPackage;
  const preview = result.artifacts.previewPlan;

  console.log("");
  console.log("=== Admin Scaffold Dry-Run Package (G-5s) ===");
  console.log(`mode: ${pkg.mode}`);
  console.log(`siteSlug: ${pkg.siteSlug}`);
  console.log(`templateId: ${pkg.templateId}`);
  console.log(`schemaAdapterId: ${pkg.schemaAdapterId}`);
  console.log(`output: ${result.outDirRelative}/`);
  console.log(`runtimeFilesWritten: ${pkg.runtimeFilesWritten}`);
  console.log(`adminScaffoldGenerated: ${pkg.adminScaffoldGenerated}`);
  console.log(`productionReady: ${pkg.productionReady}`);
  console.log(`connectedToRuntime: ${pkg.connectedToRuntime}`);
  console.log(`customerDemoReady: ${preview.customerDemoReady === true}`);
  console.log(`dbUpdatePerformed: ${pkg.safety.dbUpdatePerformed}`);
  console.log(`storageUploadPerformed: ${pkg.safety.storageUploadPerformed}`);
  console.log(`githubDispatchPerformed: ${pkg.safety.githubDispatchPerformed}`);
  console.log(`ftpDeployPerformed: ${pkg.safety.ftpDeployPerformed}`);
  console.log(`productionTouched: ${pkg.safety.productionTouched}`);

  const missing = result.artifacts.requiredComponents.summary.missingComponents;
  if (missing.length) {
    console.log(`warnings: missingComponents=${missing.join(", ")}`);
  } else {
    console.log("warnings: none (all required components in registry)");
  }
  console.log("");
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  if (!opts.siteConfig) {
    console.error("Error: --site-config is required");
    printHelp();
    process.exit(1);
  }

  console.log("Admin scaffold dry-run generator (G-5s read-only)");
  console.log("No runtime / Supabase / DB / Storage / FTP / GitHub dispatch");

  const result = generateAdminScaffoldDryRunPackage({
    siteConfigPath: opts.siteConfig,
    outDir: opts.outDir,
    templateRegistryPath: opts.templateRegistry,
    schemaAdaptersPath: opts.schemaAdapters,
    adminComponentsRegistryPath: opts.adminComponentsRegistry,
    previewManifestPath: opts.previewManifest,
    siteSlug: opts.siteSlug,
  });

  const outAbs = writeAdminScaffoldPackage(result);
  printSummary(result);
  console.log(`Wrote package to: ${outAbs}`);
}

main();
