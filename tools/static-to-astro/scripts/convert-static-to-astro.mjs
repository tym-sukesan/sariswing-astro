#!/usr/bin/env node
/**
 * Static HTML → Astro minimal scaffold generator.
 * Usage: node convert-static-to-astro.mjs <input-dir> <output-dir> [--site SITE_KEY] [--base-url URL] [--verify-build] [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAstroProject, printGenerationSummary } from "./lib/astro-generator.mjs";
import { resolveEffectiveConvertSiteKey } from "./lib/convert-site-key.mjs";
import { loadSiteSupabaseDataForBuild } from "./lib/site-aware-supabase-loaders.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const positional = [];
  let dryRun = false;
  let baseUrl = null;
  let deployBase = null;
  let verifyBuild = false;
  let withAdminCms = false;
  let siteProfile = null;
  let siteKey = null;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      return { help: true };
    }
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--verify-build") {
      verifyBuild = true;
      continue;
    }
    if (arg === "--with-admin-cms") {
      withAdminCms = true;
      continue;
    }
    if (arg === "--site") {
      siteKey = argv[++i];
      if (!siteKey) throw new Error("--site requires a siteKey");
      continue;
    }
    if (arg === "--site-profile") {
      siteProfile = argv[++i];
      if (!siteProfile) throw new Error("--site-profile requires a profile ID");
      continue;
    }
    if (arg === "--base-url") {
      baseUrl = argv[++i];
      if (!baseUrl) throw new Error("--base-url requires a URL");
      continue;
    }
    if (arg === "--deploy-base") {
      deployBase = argv[++i];
      if (!deployBase) throw new Error("--deploy-base requires a path");
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    positional.push(arg);
  }

  return {
    inputDir: positional[0] ?? null,
    outputDir: positional[1] ?? null,
    dryRun,
    baseUrl,
    deployBase,
    verifyBuild,
    withAdminCms,
    siteProfile,
    siteKey,
    help: false,
  };
}

function printHelp() {
  console.log(`Usage: node convert-static-to-astro.mjs <input-dir> <output-dir> [options]

Generates a minimal Astro project under output-dir from a static HTML site.

Options:
  --site SITE_KEY    Registry siteKey (preferred for multi-site; e.g. gosaki-piano)
  --base-url URL     Site origin for canonical / og:url / sitemap (production or staging host)
  --deploy-base PATH Astro base path for subdirectory deploy (default: /)
                     Example: /cms-kit-staging/gosaki/
  --verify-build  Run npm run build in output-dir and record result in CONVERSION_REPORT.md
  --with-admin-cms Copy Admin UI / API templates (requires @astrojs/node adapter)
  --site-profile ID  Site profile ID (musician, dance-school, generic)
                     Default with --with-admin-cms: musician
  --dry-run       Analyze only; do not write files
  --help, -h      Show this help
`);
}

async function main() {
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

  const {
    inputDir,
    outputDir,
    dryRun,
    baseUrl,
    deployBase,
    verifyBuild,
    withAdminCms,
    siteProfile,
    siteKey: explicitSiteKey,
  } = args;
  if (!inputDir || !outputDir) {
    printHelp();
    process.exit(1);
  }

  const inputAbs = path.resolve(process.cwd(), inputDir);
  const outputAbs = path.resolve(process.cwd(), outputDir);
  const toolRoot = path.resolve(SCRIPT_DIR, "..");

  if (!fs.existsSync(inputAbs) || !fs.statSync(inputAbs).isDirectory()) {
    console.error(`Error: input is not a directory: ${inputAbs}`);
    process.exit(1);
  }

  let effectiveSiteKey;
  try {
    effectiveSiteKey = resolveEffectiveConvertSiteKey(explicitSiteKey, inputAbs, toolRoot);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  try {
    let scheduleBundle = null;
    let discographyBundle = null;
    let embedsBundle = null;
    if (!dryRun && effectiveSiteKey) {
      const supabaseData = await loadSiteSupabaseDataForBuild({
        siteKey: effectiveSiteKey,
        inputDir: inputAbs,
        toolRoot,
      });
      scheduleBundle = supabaseData.schedule;
      discographyBundle = supabaseData.discography;
      embedsBundle = supabaseData.embeds;
    }

    const result = generateAstroProject(inputAbs, outputAbs, {
      dryRun,
      baseUrl,
      deployBase,
      verifyBuild,
      withAdminCms,
      siteProfile,
      siteKey: effectiveSiteKey,
      scheduleBundle,
      discographyBundle,
      embedsBundle,
      siteEmbedsBundle: embedsBundle,
    });
    if (dryRun) {
      console.log("static-to-astro convert (dry-run)");
      console.log(`  Would generate ${result.analysis.pages.length} pages at: ${outputAbs}`);
      if (effectiveSiteKey) console.log(`  siteKey: ${effectiveSiteKey}`);
      if (baseUrl) console.log(`  baseUrl: ${baseUrl}`);
      if (deployBase) console.log(`  deployBase: ${deployBase}`);
      process.exit(0);
    }
    printGenerationSummary(result);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

main();
