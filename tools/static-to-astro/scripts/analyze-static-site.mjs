#!/usr/bin/env node
/**
 * Static HTML site analyzer.
 * Usage: node analyze-static-site.mjs <static-site-dir> [--json] [--base-url URL] [--out path]
 */

import fs from "node:fs";
import path from "node:path";
import {
  analyzeStaticSite,
  buildJsonReport,
  formatMarkdownReport,
} from "./lib/static-site-analyzer.mjs";
import { applyBaseUrlToPages } from "./lib/base-url.mjs";

function parseArgs(argv) {
  const positional = [];
  let outPath = null;
  let json = false;
  let baseUrl = null;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out" || arg === "-o") {
      outPath = argv[++i];
      if (!outPath) throw new Error("--out requires a file path");
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--base-url") {
      baseUrl = argv[++i];
      if (!baseUrl) throw new Error("--base-url requires a URL");
    } else if (arg === "--help" || arg === "-h") {
      return { help: true };
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  return { inputDir: positional[0] ?? null, outPath, json, baseUrl, help: false };
}

function printHelp() {
  console.log(`Usage: node analyze-static-site.mjs <static-site-dir> [--json] [--base-url URL] [--out path]

Analyzes a static HTML site and prints a migration report (Markdown or JSON).
Run from repository root (uses cheerio from package.json).

Options:
  --json          Output JSON instead of Markdown
  --base-url URL  Preview canonical / og:url / og:image with production origin
  --out, -o       Write report to a file (format follows --json)
  --help, -h      Show this help
`);
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.inputDir) {
    printHelp();
    process.exit(1);
  }

  const siteDir = path.resolve(process.cwd(), args.inputDir);
  if (!fs.existsSync(siteDir) || !fs.statSync(siteDir).isDirectory()) {
    console.error(`Error: not a directory: ${siteDir}`);
    process.exit(1);
  }

  let analysis;
  try {
    analysis = analyzeStaticSite(siteDir);
    if (args.baseUrl) {
      analysis.pages = applyBaseUrlToPages(analysis.pages, args.baseUrl);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const report = args.json
    ? JSON.stringify(buildJsonReport(analysis, { baseUrl: args.baseUrl }), null, 2)
    : formatMarkdownReport(analysis);

  if (args.outPath) {
    const outAbs = path.resolve(process.cwd(), args.outPath);
    fs.mkdirSync(path.dirname(outAbs), { recursive: true });
    fs.writeFileSync(outAbs, report, "utf8");
    console.error(`Report written: ${outAbs}`);
  }

  console.log(report);
}

main();
