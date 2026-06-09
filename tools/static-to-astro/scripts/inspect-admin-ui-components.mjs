#!/usr/bin/env node
/**
 * Inspect Admin UI components registry (G-5k read-only).
 * No upload, DB update, FTP, GitHub dispatch, or code extraction.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs
 *   node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --risk high
 *   node tools/static-to-astro/scripts/inspect-admin-ui-components.mjs --category layout
 */

import { inspectAdminUiComponents } from "./lib/admin-ui-components-registry-loader.mjs";

function printHelp() {
  console.log(`Usage: node scripts/inspect-admin-ui-components.mjs [options]

Inspect Admin UI components registry (read-only). No upload / DB / FTP / dispatch.

Options:
  --registry PATH       Override registry JSON (default: config/admin/admin-ui-components-registry.json)
  --category CATEGORY   Filter by category (layout, navigation, feedback, form, table, crud, media, auth, publish, module, utility, prototype)
  --risk LEVEL          Filter by risk (low, medium, high)
  --phase PHASE         Filter by suggestedPhase or implementedInPhase (e.g. G-5l, G-5m-a)
  --extractable-only    Show only components with doNotExtractYet=false
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = {
    registry: null,
    category: null,
    risk: null,
    suggestedPhase: null,
    extractableOnly: false,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--registry") {
      opts.registry = argv[++i];
      continue;
    }
    if (arg === "--category") {
      opts.category = argv[++i];
      continue;
    }
    if (arg === "--risk") {
      opts.risk = argv[++i];
      continue;
    }
    if (arg === "--phase") {
      opts.suggestedPhase = argv[++i];
      continue;
    }
    if (arg === "--extractable-only") {
      opts.extractableOnly = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return opts;
}

/**
 * @param {ReturnType<typeof inspectAdminUiComponents>["components"][number]} c
 */
function printComponent(c) {
  console.log(`componentId: ${c.componentId}`);
  console.log(`  name: ${c.name}`);
  console.log(`  category: ${c.category}`);
  console.log(`  reusablePotential: ${c.reusablePotential}`);
  console.log(`  extractionDifficulty: ${c.extractionDifficulty}`);
  console.log(`  risk: ${c.risk}`);
  console.log(`  suggestedPhase: ${c.suggestedPhase}`);
  console.log(`  doNotExtractYet: ${c.doNotExtractYet}`);
  console.log(`  dependencies: ${c.dependencies.length ? c.dependencies.join(", ") : "(none)"}`);
  if (c.scaffoldStatus) {
    console.log(`  scaffoldStatus: ${c.scaffoldStatus}`);
  }
  if (c.scaffoldPath) {
    console.log(`  scaffoldPath: ${c.scaffoldPath}`);
  }
  if (c.implementedInPhase) {
    console.log(`  implementedInPhase: ${c.implementedInPhase}`);
  }
  if (typeof c.productionReady === "boolean") {
    console.log(`  productionReady: ${c.productionReady}`);
  }
  if (typeof c.connectedToRuntime === "boolean") {
    console.log(`  connectedToRuntime: ${c.connectedToRuntime}`);
  }
  console.log("");
}

function main() {
  const opts = parseArgs(process.argv);

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  console.log("Admin UI components registry inspection (G-5k/G-5l read-only)");
  console.log("");

  const result = inspectAdminUiComponents({
    registryPath: opts.registry,
    category: opts.category,
    risk: opts.risk,
    suggestedPhase: opts.suggestedPhase,
    extractableOnly: opts.extractableOnly,
  });

  console.log("=== Admin UI Components Registry ===");
  console.log(`mode: ${result.mode}`);
  console.log(`registry: ${result.registryPath}`);
  console.log(`version: ${result.registryVersion} (${result.registryStatus})`);
  console.log(`source: ${result.source.provenSite} / ${result.source.sourcePhase}`);
  console.log(`total components: ${result.summary.totalComponents}`);
  console.log(`filtered: ${result.summary.filteredCount}`);
  console.log(`extractable now (doNotExtractYet=false): ${result.summary.extractableNow}`);
  console.log(`deferred (doNotExtractYet=true): ${result.summary.deferred}`);
  console.log(`risk — low: ${result.summary.lowRisk}, medium: ${result.summary.mediumRisk}, high: ${result.summary.highRisk}`);
  console.log(`uploadPerformed: false`);
  console.log(`dbUpdatePerformed: false`);
  console.log(`ftpDeployPerformed: false`);
  console.log(`githubDispatchPerformed: false`);
  console.log("");

  if (opts.category || opts.risk || opts.suggestedPhase || opts.extractableOnly) {
    const parts = [];
    if (opts.category) parts.push(`category=${opts.category}`);
    if (opts.risk) parts.push(`risk=${opts.risk}`);
    if (opts.suggestedPhase) parts.push(`phase=${opts.suggestedPhase}`);
    if (opts.extractableOnly) parts.push("extractable-only");
    console.log(`Filters: ${parts.join(", ")}`);
    console.log("");
  }

  for (const c of result.components) {
    printComponent(c);
  }

  if (!result.validationOk) {
    process.exit(1);
  }
}

main();
