/**
 * G-9j — Inject gosaki home YouTube embed after THIS WEEK'S LIVE SCHEDULE block.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isGosakiPianoFixture } from "./gosaki-about-band-profiles.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../../../package.json"));
const cheerio = require("cheerio");

export const GOSAKI_YOUTUBE_EMBED_CONFIG_REL = "config/sites/gosaki-piano-youtube-embed.json";
export const GOSAKI_YOUTUBE_EMBED_TEMPLATE_REL =
  "templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro";
export const GOSAKI_YOUTUBE_EMBED_LIB_REL =
  "templates/site-extensions/gosaki-piano/gosaki-youtube-embed.ts";
export const GOSAKI_YOUTUBE_EMBED_SLOT = "<!--GOSAKI_YOUTUBE_EMBED_SLOT-->";

export { isGosakiPianoFixture };

/**
 * @param {string} toolRoot
 */
export function resolveGosakiYoutubeEmbedConfigPath(toolRoot) {
  return path.join(toolRoot, GOSAKI_YOUTUBE_EMBED_CONFIG_REL);
}

/**
 * @param {string} toolRoot
 */
export function loadGosakiYoutubeEmbedConfig(toolRoot) {
  const configPath = resolveGosakiYoutubeEmbedConfigPath(toolRoot);
  if (!fs.existsSync(configPath)) {
    return { ok: false, configPath, config: null, error: "config not found" };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    return { ok: true, configPath, config, error: null };
  } catch (err) {
    return { ok: false, configPath, config: null, error: `parse error: ${err.message}` };
  }
}

/**
 * @param {string} bodyHtml
 */
export function markYoutubeEmbedSlotInHomeBody(bodyHtml) {
  if (bodyHtml.includes(GOSAKI_YOUTUBE_EMBED_SLOT)) return bodyHtml;

  const $ = cheerio.load(`<div id="gosaki-home-root">${bodyHtml}</div>`, { xml: false });
  const schedule = $("#comp-m8y53dj5");
  if (schedule.length) {
    schedule.after(GOSAKI_YOUTUBE_EMBED_SLOT);
    return $("#gosaki-home-root").html() ?? bodyHtml;
  }

  return `${bodyHtml}\n${GOSAKI_YOUTUBE_EMBED_SLOT}\n`;
}

/**
 * @param {string} pageContent
 */
export function injectYouTubeEmbedIntoHomePage(pageContent) {
  if (!pageContent.includes("</BaseLayout>")) {
    throw new Error("Home page content missing </BaseLayout>");
  }

  const importComponent =
    'import YouTubeEmbedSection from "../../components/YouTubeEmbedSection.astro";\n';
  let updated = pageContent;
  if (!updated.includes("YouTubeEmbedSection")) {
    updated = updated.replace(/^---\n/m, `---\n${importComponent}`);
  }

  const closeTag = "</BaseLayout>";
  const closeIdx = updated.lastIndexOf(closeTag);
  if (closeIdx === -1) throw new Error("Home page missing </BaseLayout>");

  const beforeClose = updated.slice(0, closeIdx);
  const afterClose = updated.slice(closeIdx);
  const fmEnd = beforeClose.indexOf("---", 3) + 3;
  const bodyPart = beforeClose.slice(fmEnd);

  const strippedBody = bodyPart
    .replace(/\n\s*<YouTubeEmbedSection\s*\/>\n?/g, "\n")
    .replace(GOSAKI_YOUTUBE_EMBED_SLOT, "");

  const markedBody = markYoutubeEmbedSlotInHomeBody(strippedBody);
  const withComponent = markedBody.replace(
    GOSAKI_YOUTUBE_EMBED_SLOT,
    "\n  <YouTubeEmbedSection />\n",
  );

  return beforeClose.slice(0, fmEnd) + withComponent + afterClose;
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{ homePagePath?: string }} [options]
 */
export function applyGosakiHomeYouTubeEmbed(outDir, toolRoot, options = {}) {
  const loaded = loadGosakiYoutubeEmbedConfig(toolRoot);
  if (!loaded.ok) {
    return { applied: false, reason: loaded.error, publishedCount: 0 };
  }

  const templatePath = path.join(toolRoot, GOSAKI_YOUTUBE_EMBED_TEMPLATE_REL);
  const libPath = path.join(toolRoot, GOSAKI_YOUTUBE_EMBED_LIB_REL);
  if (!fs.existsSync(templatePath) || !fs.existsSync(libPath)) {
    return { applied: false, reason: "YouTube embed template missing", publishedCount: 0 };
  }

  const homeRel = options.homePagePath ?? "src/pages/index.astro";
  const homePath = path.join(outDir, homeRel);
  if (!fs.existsSync(homePath)) {
    return { applied: false, reason: `Home page not found: ${homeRel}`, publishedCount: 0 };
  }

  const componentDest = path.join(outDir, "src/components/YouTubeEmbedSection.astro");
  const dataDest = path.join(outDir, "src/data/gosaki-youtube-embed.json");
  const libDest = path.join(outDir, "src/lib/gosaki-youtube-embed.ts");

  fs.mkdirSync(path.dirname(dataDest), { recursive: true });
  fs.mkdirSync(path.dirname(libDest), { recursive: true });
  fs.copyFileSync(templatePath, componentDest);
  fs.copyFileSync(libPath, libDest);
  fs.writeFileSync(dataDest, `${JSON.stringify(loaded.config, null, 2)}\n`, "utf8");

  const homeContent = fs.readFileSync(homePath, "utf8");
  fs.writeFileSync(homePath, injectYouTubeEmbedIntoHomePage(homeContent), "utf8");

  const publishedCount = Array.isArray(loaded.config.items)
    ? loaded.config.items.filter((item) => item?.published === true).length
    : loaded.config.published === true
      ? 1
      : 0;

  return {
    applied: true,
    reason: null,
    publishedCount,
    homePagePath: homeRel,
    componentPath: "src/components/YouTubeEmbedSection.astro",
    dataPath: "src/data/gosaki-youtube-embed.json",
    libPath: "src/lib/gosaki-youtube-embed.ts",
  };
}

/**
 * @param {string} homeHtml
 */
export function verifyHomeYouTubeEmbedHtml(homeHtml, expected) {
  /** @type {string[]} */
  const errors = [];
  if (expected?.published) {
    if (!homeHtml.includes("gosaki-youtube-embed")) {
      errors.push("missing gosaki-youtube-embed section");
    }
    if (!homeHtml.includes("youtube-nocookie.com/embed/")) {
      errors.push("missing youtube-nocookie embed");
    }
  } else if (homeHtml.includes("gosaki-youtube-embed")) {
    errors.push("youtube section should be hidden when unpublished");
  }
  return { ok: errors.length === 0, errors };
}
