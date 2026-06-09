/**
 * Refresh data-driven Astro views after Supabase JSON export (Phase 3-K).
 * Ensures schedule index/month pages use withBase() and image helpers are current.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyDiscographyDataViews } from "./discography-seed-extractor.mjs";
import { writeHomeScheduleArtifacts } from "./home-schedule-sync.mjs";
import { applyScheduleDataViews } from "./schedule-seed-extractor.mjs";

const TOOL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RESOLVE_IMAGE_TEMPLATE = path.join(
  TOOL_ROOT,
  "templates/admin-cms/src/lib/resolve-public-image.ts",
);
const RESOLVE_SEO_TEMPLATE = path.join(
  TOOL_ROOT,
  "templates/admin-cms/src/lib/resolve-public-seo.ts",
);

/**
 * @param {string} astroDir
 * @param {string} templatePath
 * @param {string} destName
 */
function syncTemplateLibFile(astroDir, templatePath, destName) {
  if (!fs.existsSync(templatePath)) {
    return { copied: false };
  }
  const dest = path.join(path.resolve(astroDir), "src/lib", destName);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(templatePath, dest);
  return { copied: true, path: dest };
}

/**
 * @param {string} astroDir
 */
function syncResolvePublicImageHelper(astroDir) {
  return syncTemplateLibFile(astroDir, RESOLVE_IMAGE_TEMPLATE, "resolve-public-image.ts");
}

function syncResolvePublicSeoHelper(astroDir) {
  return syncTemplateLibFile(astroDir, RESOLVE_SEO_TEMPLATE, "resolve-public-seo.ts");
}

/**
 * @param {object[]} scheduleMonths
 * @param {string} astroDir
 */
export function refreshPublicCmsViewsAfterExport(astroDir, { scheduleMonths } = {}) {
  const astroAbs = path.resolve(astroDir);
  const imageHelper = syncResolvePublicImageHelper(astroAbs);
  const seoHelper = syncResolvePublicSeoHelper(astroAbs);

  let months = scheduleMonths;
  if (!months?.length) {
    const monthsPath = path.join(astroAbs, "src/data/schedule-months.json");
    if (fs.existsSync(monthsPath)) {
      months = JSON.parse(fs.readFileSync(monthsPath, "utf8"));
    }
  }

  let scheduleViews = { dataDrivenPages: [], htmlBasedPages: [] };
  if (months?.length) {
    scheduleViews = applyScheduleDataViews(astroAbs, months);
  }

  const homeSchedule = writeHomeScheduleArtifacts(astroAbs);
  const discography = applyDiscographyDataViews(astroAbs);

  return {
    imageHelper,
    seoHelper,
    scheduleViews,
    homeSchedule,
    discography,
    monthsCount: months?.length ?? 0,
  };
}
