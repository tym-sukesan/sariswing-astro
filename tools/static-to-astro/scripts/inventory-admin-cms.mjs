#!/usr/bin/env node
/**
 * Sariswing admin CMS inventory (G-5j read-only).
 * No code modification, DB, Storage, FTP, or GitHub dispatch.
 *
 * Usage:
 *   node tools/static-to-astro/scripts/inventory-admin-cms.mjs --root .
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  formatAdminInventoryReport,
  runAdminCmsInventory,
} from "./lib/admin-cms-inventory-scanner.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function printHelp() {
  console.log(`Usage: node scripts/inventory-admin-cms.mjs [options]

Read-only Sariswing admin CMS code inventory.

Options:
  --root PATH       Repository root to scan (default: repo root)
  --report PATH     Markdown report output
  --manifest PATH   JSON manifest output
  --help, -h
`);
}

function parseArgs(argv) {
  const opts = { root: null, report: null, manifest: null, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--root") {
      opts.root = argv[++i];
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

function printSummary(inventory, reportAbs, manifestAbs) {
  const s = inventory.summary;
  console.log("");
  console.log("=== Sariswing Admin CMS Inventory (G-5j) ===");
  console.log(`mode: ${inventory.mode}`);
  console.log(`admin files: ${s.adminFiles}`);
  console.log(`admin pages: ${s.adminPages}`);
  console.log(`components: ${s.adminComponents}`);
  console.log(`lib+scripts: ${s.adminLibAndScripts}`);
  console.log(`reusable: ${s.reusableCandidates}`);
  console.log(`site-specific: ${s.siteSpecificItems}`);
  console.log(`risky: ${s.riskyItems}`);
  console.log(`unknown: ${s.unknownItems}`);
  console.log(`publish refs: ${s.publishWorkflowReferences}`);
  console.log(`codeModified: ${inventory.safety.codeModified}`);
  console.log(`githubDispatchPerformed: ${inventory.safety.githubDispatchPerformed}`);
  console.log(`report: ${path.relative(REPO_ROOT, reportAbs)}`);
  console.log(`manifest: ${path.relative(REPO_ROOT, manifestAbs)}`);
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const root = opts.root ? path.resolve(REPO_ROOT, opts.root) : REPO_ROOT;
  const reportPath = opts.report ? path.resolve(REPO_ROOT, opts.report) : opts.report;
  const manifestPath = opts.manifest ? path.resolve(REPO_ROOT, opts.manifest) : opts.manifest;

  console.log("Sariswing admin CMS inventory (G-5j read-only)");
  console.log(`Root: ${opts.root ?? "(repo root)"}`);
  console.log("");

  const { inventory, reportAbs, manifestAbs } = runAdminCmsInventory({
    root,
    reportPath,
    manifestPath,
    toolRoot: TOOL_ROOT,
  });

  fs.mkdirSync(path.dirname(reportAbs), { recursive: true });
  fs.mkdirSync(path.dirname(manifestAbs), { recursive: true });
  fs.writeFileSync(reportAbs, formatAdminInventoryReport(inventory), "utf8");
  fs.writeFileSync(manifestAbs, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");

  printSummary(inventory, reportAbs, manifestAbs);
  console.log("\nInventory written (read-only — no code modified).");
}

main();
