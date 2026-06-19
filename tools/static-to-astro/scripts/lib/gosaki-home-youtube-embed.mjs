/**
 * G-9j — Inject gosaki home YouTube embed section (static JSON config).
 */

import fs from "node:fs";
import path from "node:path";
import { isGosakiPianoFixture } from "./gosaki-about-band-profiles.mjs";

export const GOSAKI_YOUTUBE_EMBED_CONFIG_REL = "config/sites/gosaki-piano-youtube-embed.json";
export const GOSAKI_YOUTUBE_EMBED_TEMPLATE_REL =
  "templates/site-extensions/gosaki-piano/YouTubeEmbedSection.astro";
export const GOSAKI_YOUTUBE_EMBED_LIB_REL =
  "templates/site-extensions/gosaki-piano/gosaki-youtube-embed.ts";

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
 * @param {string} pageContent
 */
export function injectYouTubeEmbedIntoHomePage(pageContent) {
  if (!pageContent.includes("</BaseLayout>")) {
    throw new Error("Home page content missing </BaseLayout>");
  }
  if (pageContent.includes("YouTubeEmbedSection")) {
    return pageContent;
  }

  const importComponent =
    'import YouTubeEmbedSection from "../../components/YouTubeEmbedSection.astro";\n';
  const withImport = pageContent.replace(
    /^---\nimport BaseLayout/m,
    `---\n${importComponent}import BaseLayout`,
  );

  return withImport.replace(
    "</BaseLayout>",
    `  <YouTubeEmbedSection />\n</BaseLayout>`,
  );
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{ homePagePath?: string }} [options]
 */
export function applyGosakiHomeYouTubeEmbed(outDir, toolRoot, options = {}) {
  const loaded = loadGosakiYoutubeEmbedConfig(toolRoot);
  if (!loaded.ok) {
    return { applied: false, reason: loaded.error, published: false };
  }

  const templatePath = path.join(toolRoot, GOSAKI_YOUTUBE_EMBED_TEMPLATE_REL);
  const libPath = path.join(toolRoot, GOSAKI_YOUTUBE_EMBED_LIB_REL);
  if (!fs.existsSync(templatePath) || !fs.existsSync(libPath)) {
    return { applied: false, reason: "YouTube embed template missing", published: false };
  }

  const homeRel = options.homePagePath ?? "src/pages/index.astro";
  const homePath = path.join(outDir, homeRel);
  if (!fs.existsSync(homePath)) {
    return { applied: false, reason: `Home page not found: ${homeRel}`, published: false };
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

  return {
    applied: true,
    reason: null,
    published: loaded.config.published === true,
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
