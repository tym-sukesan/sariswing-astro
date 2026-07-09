#!/usr/bin/env node
/**
 * Verify manual upload package structure (G-7g — no FTP).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyPublicDistCssPresence } from "./lib/deploy-base.mjs";
import {
  findSitemapSafetyViolations,
  validatePackageManifestSafety,
  validatePublicDistAdminSafety,
} from "./lib/package-upload-safety.mjs";

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
    if (manifest.cssPresenceOk !== true) errors.push("cssPresenceOk must be true");
    for (const err of validatePackageManifestSafety(manifest, "staging")) {
      errors.push(`manifest safety: ${err}`);
    }
    if (manifest.includesAdmin !== true) {
      errors.push("staging package includesAdmin must be true (G-20t3)");
    }
    if (!manifest.sourceCommit) errors.push("manifest sourceCommit missing");
  }

  const publicDist = path.join(pkg, "public-dist");
  if (fs.existsSync(path.join(publicDist, "index.html"))) {
    const css = verifyPublicDistCssPresence(
      publicDist,
      manifest?.deployBase ?? "/cms-kit-staging/gosaki-piano/",
    );
    if (!css.ok) errors.push(css.reason ?? "public-dist CSS check failed");
  }

  const readme = fs.existsSync(path.join(pkg, "README-UPLOAD.md"))
    ? fs.readFileSync(path.join(pkg, "README-UPLOAD.md"), "utf8")
    : "";
  if (!readme.includes("/cms-kit-staging/gosaki-piano/")) {
    errors.push("README missing upload path");
  }
  if (!readme.includes("public-dist")) errors.push("README missing public-dist guidance");
  if (!readme.includes("STAGING package")) errors.push("README missing staging package identity warning");
  if (!/not.*`public-dist` folder itself/i.test(readme)) {
    errors.push("README missing upload-contents warning");
  }
  if (!readme.includes("mirror")) errors.push("README missing mirror/sync prohibition");

  const checklist = fs.existsSync(path.join(pkg, "CHECKLIST.md"))
    ? fs.readFileSync(path.join(pkg, "CHECKLIST.md"), "utf8")
    : "";
  if (!checklist.includes("targetEnvironment")) errors.push("CHECKLIST missing targetEnvironment check");
  if (!checklist.includes("sourceCommit")) errors.push("CHECKLIST missing sourceCommit check");
  if (!checklist.includes("generatedAt")) errors.push("CHECKLIST missing generatedAt check");

  for (const err of validatePublicDistAdminSafety(publicDist, "staging")) {
    errors.push(err);
  }

  for (const ym of ["2026-06", "2026-07"]) {
    const canonicalMonthPath = path.join(publicDist, "schedule", ym, "index.html");
    if (!fs.existsSync(canonicalMonthPath)) {
      errors.push(`missing canonical month page: public-dist/schedule/${ym}/index.html`);
      continue;
    }
    const monthHtml = fs.readFileSync(canonicalMonthPath, "utf8");
    if (!monthHtml.includes("gosaki-schedule-month")) {
      errors.push(`schedule/${ym} missing gosaki-schedule-month class`);
    }
    if (!monthHtml.includes("会場")) {
      errors.push(`schedule/${ym} missing schedule body text (会場)`);
    }
    if (monthHtml.includes('style="visibility:hidden"')) {
      errors.push(`schedule/${ym} still has visibility:hidden repeater`);
    }
    if (
      !monthHtml.includes(`scheduleDataSource=static-fallback`) &&
      !monthHtml.includes(`scheduleDataSource=supabase`)
    ) {
      errors.push(`schedule/${ym} missing scheduleDataSource marker`);
    }

    const legacyMonthPath = path.join(publicDist, ym, "index.html");
    if (!fs.existsSync(legacyMonthPath)) {
      errors.push(`missing legacy stub: public-dist/${ym}/index.html`);
      continue;
    }
    const legacyHtml = fs.readFileSync(legacyMonthPath, "utf8");
    if (!legacyHtml.includes("gosaki-schedule-legacy-stub")) {
      errors.push(`${ym} legacy stub missing gosaki-schedule-legacy-stub class`);
    }
    if (!legacyHtml.includes(`/schedule/${ym}/`)) {
      errors.push(`${ym} legacy stub missing canonical link to /schedule/${ym}/`);
    }
    if (!legacyHtml.includes("noindex")) {
      errors.push(`${ym} legacy stub missing noindex`);
    }
    if (legacyHtml.includes("gosaki-schedule-event-card")) {
      errors.push(`${ym} legacy stub should not include full schedule cards`);
    }
  }

  const scheduleHub = path.join(publicDist, "schedule/index.html");
  if (fs.existsSync(scheduleHub)) {
    const hubHtml = fs.readFileSync(scheduleHub, "utf8");
    if (!hubHtml.includes("/cms-kit-staging/gosaki-piano/schedule/2026-")) {
      errors.push("schedule hub missing deployBase canonical month links");
    }
    if (!hubHtml.includes("gosaki-schedule-hub")) {
      errors.push("schedule hub missing gosaki-schedule-hub class");
    }
  } else {
    errors.push("missing schedule/index.html");
  }

  const sitemapPath = path.join(publicDist, "sitemap-0.xml");
  if (fs.existsSync(sitemapPath)) {
    const sitemap = fs.readFileSync(sitemapPath, "utf8");
    if (!sitemap.includes("/schedule/2026-07/")) {
      errors.push("sitemap missing canonical /schedule/2026-07/");
    }
    if (sitemap.includes("/gosaki-piano/2026-07/")) {
      errors.push("sitemap must not include legacy /2026-07/ URL");
    }
    for (const violation of findSitemapSafetyViolations(sitemap)) {
      errors.push(`sitemap safety: ${violation}`);
    }
  } else {
    errors.push("missing sitemap-0.xml");
  }

  const discographyPath = path.join(publicDist, "discography/index.html");
  if (fs.existsSync(discographyPath)) {
    const discHtml = fs.readFileSync(discographyPath, "utf8");
    if (!discHtml.includes("comp-llexymel") || !discHtml.includes("comp-jshobkm1")) {
      errors.push("discography page missing album structure");
    }
    if (!discHtml.includes("Track List") || !discHtml.includes("Personnel")) {
      errors.push("discography missing Track List or Personnel text");
    }
  }

  const indexPath = path.join(publicDist, "index.html");
  if (fs.existsSync(indexPath)) {
    const indexHtml = fs.readFileSync(indexPath, "utf8");
    if (!indexHtml.includes("nav-toggle") || !indexHtml.includes(">Schedule</a>")) {
      errors.push("index missing nav toggle or Schedule link");
    }
    if (!indexHtml.includes("gosaki-footer-social-links")) {
      errors.push("index missing gosaki-footer-social-links block");
    }
    if (
      !indexHtml.includes(">Facebook</a>") ||
      !indexHtml.includes(">X</a>") ||
      !indexHtml.includes(">Instagram</a>")
    ) {
      errors.push("index footer social missing Facebook/X/Instagram text links");
    }
    if (
      !indexHtml.includes("facebook.com/goto.saki.3") ||
      !indexHtml.includes("twitter.com/goto_saki_pf") ||
      !indexHtml.includes("instagram.com/gosaakiii")
    ) {
      errors.push("index footer social hrefs incomplete");
    }
    if (!indexHtml.includes("SITE_FOOTERinlineContent-gridContainer")) {
      errors.push("index missing footer grid container");
    }
  }

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
