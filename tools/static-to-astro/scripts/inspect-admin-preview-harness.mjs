#!/usr/bin/env node
/**
 * Inspect Admin prototype preview harness (G-5r read-only).
 * No Astro build, runtime, DB update, Storage upload, FTP, or GitHub dispatch.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs
 *   node tools/static-to-astro/scripts/inspect-admin-preview-harness.mjs --prototype musician-basic-admin-prototype
 */

import { inspectAdminPreviewHarness } from "./lib/admin-preview-harness-loader.mjs";

function printHelp() {
  console.log(`Usage: node scripts/inspect-admin-preview-harness.mjs [options]

Inspect Admin prototype preview harness manifest (read-only).
No build / deploy / runtime / DB / Storage / FTP / dispatch.

Options:
  --manifest PATH       Override preview-manifest.json path
  --prototype ID        Filter by prototypeId
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    manifest: null,
    prototypeId: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--manifest") {
      opts.manifest = argv[++i];
      continue;
    }
    if (arg === "--prototype") {
      opts.prototypeId = argv[++i];
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/**
 * @param {ReturnType<typeof inspectAdminPreviewHarness>["prototypes"][number]} p
 * @param {boolean} harnessConnectedToRuntime
 * @param {boolean} harnessProductionReady
 */
function printPrototype(p, harnessConnectedToRuntime, harnessProductionReady) {
  console.log(`prototypeId: ${p.prototypeId}`);
  console.log(`  label: ${p.label}`);
  console.log(`  templateId: ${p.templateId}`);
  console.log(`  siteType: ${p.siteType}`);
  console.log(`  previewStatus: ${p.previewStatus}`);
  console.log(`  customerDemoReady: ${p.customerDemoReady}`);
  console.log(`  requiresLocalHarness: ${p.requiresLocalHarness}`);
  console.log(`  prototypePath: ${p.prototypePath}`);
  console.log(`  connectedToRuntime: ${harnessConnectedToRuntime}`);
  console.log(`  productionReady: ${harnessProductionReady}`);
  console.log(`  runtimeConnected: ${p.safety.runtimeConnected}`);
  console.log(`  supabaseAuthConnected: ${p.safety.supabaseAuthConnected}`);
  console.log(`  supabaseQueryPerformed: ${p.safety.supabaseQueryPerformed}`);
  console.log(`  dbUpdatePerformed: ${p.safety.dbUpdatePerformed}`);
  console.log(`  storageUploadPerformed: ${p.safety.storageUploadPerformed}`);
  console.log(`  githubDispatchPerformed: ${p.safety.githubDispatchPerformed}`);
  console.log(`  ftpDeployPerformed: ${p.safety.ftpDeployPerformed}`);
  console.log(`  productionTouched: ${p.safety.productionTouched}`);
  console.log(`  recommendedNextStep: ${p.recommendedNextStep}`);
  console.log("");
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  console.log("Admin prototype preview harness inspection (G-5r read-only)");
  console.log("");

  const result = inspectAdminPreviewHarness({
    manifestPath: opts.manifest,
    prototypeId: opts.prototypeId,
  });

  console.log("=== Admin Prototype Preview Harness ===");
  console.log(`mode: ${result.mode}`);
  console.log(`manifest: ${result.manifestPath}`);
  console.log(`version: ${result.manifestVersion} (${result.manifestStatus})`);
  console.log(`harnessMode: ${result.harnessMode}`);
  console.log(`connectedToRuntime: ${result.connectedToRuntime}`);
  console.log(`productionReady: ${result.productionReady}`);
  console.log(`previewBuildPerformed: ${result.previewBuildPerformed}`);
  console.log(`deployPerformed: ${result.deployPerformed}`);
  console.log(`total prototypes: ${result.summary.totalPrototypes}`);
  console.log(`filtered: ${result.summary.filteredCount}`);
  console.log(`customerDemoReady: ${result.summary.customerDemoReadyCount}`);
  console.log(`previewBuildPerformed: false`);
  console.log(`dbUpdatePerformed: false`);
  console.log(`storageUploadPerformed: false`);
  console.log(`githubDispatchPerformed: false`);
  console.log(`ftpDeployPerformed: false`);
  console.log("");

  if (opts.prototypeId) {
    console.log(`Filter: prototype=${opts.prototypeId}`);
    console.log("");
  }

  if (result.prototypes.length === 0) {
    console.log("No matching prototypes.");
    process.exit(1);
  }

  for (const p of result.prototypes) {
    printPrototype(p, result.connectedToRuntime, result.productionReady);
  }
}

main();
