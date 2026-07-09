/**
 * G-20u4 — Gosaki-specific site package content checks (staging / production).
 */

import fs from "node:fs";
import path from "node:path";

const STAGING_HOST = "yskcreate.weblike.jp";
const STAGING_DEPLOY_BASE = "/cms-kit-staging/gosaki-piano";
const PRODUCTION_URL = "https://www.gosaki-piano.com";

const TEST_A = "Like a Lover（テスト）";
const TEST_B = "Mary Ann（テスト）";
const AFTER_A = "Like a Lover";
const AFTER_B = "Mary Ann";

/**
 * @param {string} packageDir
 * @param {string} deployBase
 * @returns {string[]}
 */
export function verifyGosakiStagingContentExtensions(packageDir, deployBase) {
  /** @type {string[]} */
  const errors = [];
  const publicDist = path.join(packageDir, "public-dist");
  const readme = fs.existsSync(path.join(packageDir, "README-UPLOAD.md"))
    ? fs.readFileSync(path.join(packageDir, "README-UPLOAD.md"), "utf8")
    : "";

  if (!readme.includes(deployBase)) errors.push("README missing upload path");
  if (!readme.includes("public-dist")) errors.push("README missing public-dist guidance");
  if (!readme.includes("STAGING package")) errors.push("README missing staging package identity warning");
  if (!/not.*`public-dist` folder itself/i.test(readme)) {
    errors.push("README missing upload-contents warning");
  }
  if (!readme.includes("mirror")) errors.push("README missing mirror/sync prohibition");

  const checklist = fs.existsSync(path.join(packageDir, "CHECKLIST.md"))
    ? fs.readFileSync(path.join(packageDir, "CHECKLIST.md"), "utf8")
    : "";
  if (!checklist.includes("targetEnvironment")) errors.push("CHECKLIST missing targetEnvironment check");
  if (!checklist.includes("sourceCommit")) errors.push("CHECKLIST missing sourceCommit check");
  if (!checklist.includes("generatedAt")) errors.push("CHECKLIST missing generatedAt check");

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
      !monthHtml.includes("scheduleDataSource=static-fallback") &&
      !monthHtml.includes("scheduleDataSource=supabase")
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
    if (!hubHtml.includes(`${deployBase}schedule/2026-`)) {
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

  return errors;
}

/**
 * @param {string} packageDir
 * @returns {string[]}
 */
export function verifyGosakiProductionContentExtensions(packageDir) {
  /** @type {string[]} */
  const errors = [];
  const publicDist = path.join(packageDir, "public-dist");

  const seoRoutes = [
    "index.html",
    "discography/index.html",
    "schedule/index.html",
    "about/index.html",
    "contact/index.html",
  ];

  for (const rel of seoRoutes) {
    const abs = path.join(publicDist, rel);
    if (!fs.existsSync(abs)) continue;
    const html = fs.readFileSync(abs, "utf8");
    const headHtml = html.match(/<head[^>]*>[\s\S]*?<\/head>/i)?.[0] ?? html.slice(0, 8000);
    if (/noindex/i.test(headHtml)) errors.push(`${rel} must not have noindex in production`);
    if (headHtml.includes(STAGING_HOST) || headHtml.includes(STAGING_DEPLOY_BASE)) {
      errors.push(`${rel} must not reference staging host`);
    }
    if (!/rel="canonical" href="https:\/\/www\.gosaki-piano\.com/i.test(headHtml)) {
      errors.push(`${rel} missing production canonical`);
    }
    if (!/property="og:url" content="https:\/\/www\.gosaki-piano\.com/i.test(headHtml)) {
      errors.push(`${rel} missing production og:url`);
    }
  }

  const robotsPath = path.join(publicDist, "robots.txt");
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, "utf8");
    if (!robots.includes(`${PRODUCTION_URL}/sitemap-index.xml`)) {
      errors.push("robots.txt missing production sitemap-index URL");
    }
  }

  const sitemapIndexPath = path.join(publicDist, "sitemap-index.xml");
  if (fs.existsSync(sitemapIndexPath)) {
    const sitemapIndex = fs.readFileSync(sitemapIndexPath, "utf8");
    if (!sitemapIndex.includes(PRODUCTION_URL)) errors.push("sitemap-index missing production URL");
    if (sitemapIndex.includes(STAGING_HOST)) errors.push("sitemap-index must not include staging host");
  }

  const discPath = path.join(publicDist, "discography/index.html");
  if (fs.existsSync(discPath)) {
    const discHtml = fs.readFileSync(discPath, "utf8");
    if (discHtml.includes(TEST_A) || discHtml.includes(TEST_B)) {
      errors.push("discography must not include test suffix titles");
    }
    if (!discHtml.includes(AFTER_A) || !discHtml.includes(AFTER_B)) {
      errors.push("discography missing cleaned album titles");
    }
  }

  return errors;
}
