import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} outputDir
 */
export function verifyGeneratedStructure(outputDir, { scheduleIndexExpected = false } = {}) {
  const baseLayoutPath = path.join(outputDir, "src/layouts/BaseLayout.astro");
  const headerPath = path.join(outputDir, "src/components/Header.astro");
  const scheduleIndexPath = path.join(outputDir, "src/pages/schedule/index.astro");

  const baseLayout = fs.existsSync(baseLayoutPath) ? fs.readFileSync(baseLayoutPath, "utf8") : "";
  const header = fs.existsSync(headerPath) ? fs.readFileSync(headerPath, "utf8") : "";

  const baseLayoutHasMainWrapper =
    /<main>[\s\S]*<slot\s*\/>[\s\S]*<\/main>/i.test(baseLayout) ||
    (baseLayout.includes("<main>") && baseLayout.includes("<slot"));

  const headerScheduleLinkToHub = /href="\/schedule\/"/.test(header);
  const headerHasMonthlyNavLabels = /2026\.\d{2}/.test(header);
  const scheduleNavActiveInHeader = header.includes("scheduleNavActive");

  return {
    baseLayoutHasMainWrapper,
    headerScheduleLinkToHub,
    headerHasMonthlyNavLabels,
    scheduleNavActiveInHeader,
    scheduleIndexExists: fs.existsSync(scheduleIndexPath),
    scheduleIndexExpected,
  };
}

/**
 * @param {string} distDir
 * @returns {string[]}
 */
export function findSitemapFilesInDist(distDir) {
  if (!fs.existsSync(distDir)) return [];
  const found = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/^sitemap(-index)?.*\.xml$/i.test(entry.name)) {
        found.push(path.relative(distDir, full).split(path.sep).join("/"));
      }
    }
  }

  walk(distDir);
  return found.sort();
}

/**
 * @param {string} outputDir
 * @param {{ installDependencies?: boolean }} [options]
 */
export function runBuildVerification(outputDir, { installDependencies = true } = {}) {
  const distDir = path.join(outputDir, "dist");
  const distScheduleIndex = path.join(distDir, "schedule/index.html");
  const result = {
    buildSuccess: false,
    buildCommand: "npm run build",
    installCommand: installDependencies ? "npm install" : null,
    buildOutput: "",
    distScheduleIndexExists: false,
    robotsTxtInPublic: fs.existsSync(path.join(outputDir, "public/robots.txt")),
    sitemapFiles: [],
    verifiedAt: new Date().toISOString(),
  };

  if (installDependencies && fs.existsSync(path.join(outputDir, "package.json"))) {
    try {
      execSync("npm install", {
        cwd: outputDir,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 180_000,
      });
    } catch (err) {
      const stdout = err.stdout?.toString?.() ?? "";
      const stderr = err.stderr?.toString?.() ?? "";
      result.buildOutput = `npm install failed:\n${stdout}\n${stderr}`.slice(-4000);
      return result;
    }
  }

  try {
    const out = execSync("npm run build", {
      cwd: outputDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
    });
    result.buildSuccess = true;
    result.buildOutput = out.slice(-2000);
  } catch (err) {
    const stdout = err.stdout?.toString?.() ?? "";
    const stderr = err.stderr?.toString?.() ?? "";
    result.buildOutput = `${stdout}\n${stderr}`.slice(-4000);
  }

  result.distScheduleIndexExists = fs.existsSync(distScheduleIndex);
  result.sitemapFiles = findSitemapFilesInDist(distDir);
  return result;
}

/**
 * Dev URLs to check (human must use terminal-printed URL).
 */
export const DEV_VERIFICATION_ROUTES = [
  "/",
  "/schedule/",
  "/schedule-2026-07/",
  "/schedule-2026-06/",
  "/schedule-2026-05/",
  "/schedule-2026-04/",
  "/schedule-2026-03/",
  "/about/",
  "/discography/",
  "/contact/",
  "/link/",
];
