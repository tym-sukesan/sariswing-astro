#!/usr/bin/env node
/**
 * Build staging FTP upload plan from static-public/public-dist (G-7e — no FTP connect).
 *
 * Usage:
 *   node scripts/plan-staging-public-upload.mjs \
 *     --public-dir tools/static-to-astro/output/static-public/gosaki-piano/public-dist \
 *     --site-slug gosaki-piano \
 *     --deploy-base /cms-kit-staging/gosaki-piano/ \
 *     --out tools/static-to-astro/output/deploy/gosaki-piano/staging-upload-plan.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildStagingUploadPlan,
  writeStagingUploadPlanArtifacts,
} from "./lib/staging-upload-plan.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

function parseArgs(argv) {
  const opts = {
    publicDir: null,
    siteSlug: "gosaki-piano",
    deployBase: "/cms-kit-staging/gosaki-piano/",
    stagingUrl: "https://yskcreate.weblike.jp/cms-kit-staging/gosaki-piano/",
    out: null,
    help: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      opts.help = true;
      continue;
    }
    if (arg === "--public-dir") opts.publicDir = argv[++i];
    else if (arg === "--site-slug") opts.siteSlug = argv[++i];
    else if (arg === "--deploy-base") opts.deployBase = argv[++i];
    else if (arg === "--staging-url") opts.stagingUrl = argv[++i];
    else if (arg === "--out") opts.out = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help || !opts.publicDir || !opts.out) {
    console.log(`Usage: node scripts/plan-staging-public-upload.mjs --public-dir PATH --out PATH`);
    process.exit(opts.help ? 0 : 1);
  }

  const publicDir = path.resolve(REPO_ROOT, opts.publicDir);
  if (!fs.existsSync(publicDir)) {
    console.error(`public-dir not found: ${publicDir}`);
    process.exit(1);
  }

  const plan = buildStagingUploadPlan({
    publicDistDir: publicDir,
    siteSlug: opts.siteSlug,
    deployBase: opts.deployBase,
    stagingUrl: opts.stagingUrl,
  });

  const outPath = path.resolve(REPO_ROOT, opts.out);
  const written = writeStagingUploadPlanArtifacts(plan, outPath);
  console.log(`Upload plan: ${path.relative(REPO_ROOT, written.jsonPath)}`);
  console.log(`Upload plan doc: ${path.relative(REPO_ROOT, written.mdPath)}`);
  console.log(`Files: ${plan.fileCount}`);
  console.log(`Staging URL: ${plan.stagingPublicUrl}`);
}

main();
