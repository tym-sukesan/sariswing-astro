#!/usr/bin/env node
/**
 * Verify manual upload package structure (G-7g — no FTP).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TOOL_ROOT, "../..");

const DEFAULT_PACKAGE = path.join(TOOL_ROOT, "output/manual-upload/gosaki-piano");

function parseArgs(argv) {
  const opts = { packageDir: DEFAULT_PACKAGE, help: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--package-dir") opts.packageDir = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    console.log("Usage: node scripts/verify-manual-upload-package.mjs [--package-dir PATH]");
    process.exit(0);
  }

  const pkg = path.isAbsolute(opts.packageDir)
    ? opts.packageDir
    : path.resolve(TOOL_ROOT, opts.packageDir);
  /** @type {string[]} */
  const errors = [];

  const required = [
    "public-dist/index.html",
    "public-dist/robots.txt",
    "README-UPLOAD.md",
    "CHECKLIST.md",
    "MANIFEST.json",
    "gosaki-piano-manual-upload.zip",
  ];

  for (const rel of required) {
    if (!fs.existsSync(path.join(pkg, rel))) errors.push(`missing: ${rel}`);
  }

  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(pkg, "MANIFEST.json"), "utf8"));
  } catch {
    errors.push("MANIFEST.json missing or invalid");
  }

  if (manifest) {
    if (manifest.ftpAutoDeployUsed !== false) errors.push("ftpAutoDeployUsed must be false");
    if (!manifest.safeForStaticFtp) errors.push("safeForStaticFtp must be true");
    if (manifest.deployBase !== "/cms-kit-staging/gosaki-piano/") {
      errors.push(`unexpected deployBase: ${manifest.deployBase}`);
    }
    if (manifest.fileCount < 1) errors.push("fileCount must be > 0");
  }

  const readme = fs.existsSync(path.join(pkg, "README-UPLOAD.md"))
    ? fs.readFileSync(path.join(pkg, "README-UPLOAD.md"), "utf8")
    : "";
  if (!readme.includes("/cms-kit-staging/gosaki-piano/")) {
    errors.push("README missing upload path");
  }
  if (!readme.includes("public-dist")) errors.push("README missing public-dist guidance");

  const ok = errors.length === 0;
  console.log(`\n=== verify:manual-upload: ${ok ? "PASS" : "FAIL"} ===`);
  if (errors.length) {
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`package: ${path.relative(REPO_ROOT, pkg)}`);
  console.log(`fileCount: ${manifest?.fileCount}`);
  console.log(`safeForStaticFtp: ${manifest?.safeForStaticFtp}`);
}

main();
