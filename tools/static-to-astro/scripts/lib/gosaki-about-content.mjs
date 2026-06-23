/**
 * G-10h2 — Inject gosaki About page HTML blocks from static JSON config.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isGosakiPianoFixture } from "./gosaki-about-band-profiles.mjs";
import { splitBaseLayoutOpenAndInner } from "./gosaki-home-youtube-embed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../../package.json"));
const cheerio = require("cheerio");

export const GOSAKI_ABOUT_CONTENT_CONFIG_REL = "config/sites/gosaki-piano-about-content.json";
export const GOSAKI_ABOUT_CONTENT_DATA_REL = "src/data/gosaki-about-content.json";
export const PROFILE_GRID_SELECTOR = '[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]';
export const BLOCK_PROFILE_ID = "about-profile-html";
export const BLOCK_BANDS_ID = "about-bands-html";

export { isGosakiPianoFixture };

/**
 * @param {string} toolRoot
 */
export function resolveGosakiAboutContentConfigPath(toolRoot) {
  return path.join(toolRoot, GOSAKI_ABOUT_CONTENT_CONFIG_REL);
}

/**
 * @param {string} toolRoot
 */
export function loadGosakiAboutContentConfig(toolRoot) {
  const configPath = resolveGosakiAboutContentConfigPath(toolRoot);
  if (!fs.existsSync(configPath)) {
    return { ok: false, configPath, config: null, error: "config not found" };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!Array.isArray(config.blocks) || config.blocks.length === 0) {
      return { ok: false, configPath, config: null, error: "blocks array missing or empty" };
    }
    return { ok: true, configPath, config, error: null };
  } catch (err) {
    return { ok: false, configPath, config: null, error: `parse error: ${err.message}` };
  }
}

/**
 * @param {{ id?: string, enabled?: boolean, html?: string } | null | undefined} block
 */
export function shouldApplyAboutContentBlock(block) {
  if (!block || block.enabled === false) return false;
  return String(block.html ?? "").trim().length > 0;
}

/**
 * @param {{ blocks?: Array<{ id?: string }> }} config
 * @param {string} blockId
 */
export function findAboutContentBlock(config, blockId) {
  return config.blocks?.find((block) => block?.id === blockId) ?? null;
}

/**
 * @param {string} pageContent
 * @param {{ blocks?: Array<{ id?: string, enabled?: boolean, html?: string }> }} config
 * @param {{ requireProfileAnchor?: boolean }} [options]
 */
export function applyAboutContentToPage(pageContent, config, options = {}) {
  const profileBlock = findAboutContentBlock(config, BLOCK_PROFILE_ID);
  const bandsBlock = findAboutContentBlock(config, BLOCK_BANDS_ID);
  const applyProfile = shouldApplyAboutContentBlock(profileBlock);
  const applyBands = shouldApplyAboutContentBlock(bandsBlock);

  if (!applyProfile && !applyBands) {
    return {
      content: pageContent,
      profileApplied: false,
      bandsApplied: false,
      bandsImportRemoved: false,
    };
  }

  if (!pageContent.includes("</BaseLayout>")) {
    throw new Error("About page content missing </BaseLayout>");
  }

  const closeTag = "</BaseLayout>";
  const closeIdx = pageContent.lastIndexOf(closeTag);
  const beforeClose = pageContent.slice(0, closeIdx);
  const afterClose = pageContent.slice(closeIdx);
  const fmEnd = beforeClose.indexOf("---", 3) + 3;
  const frontmatter = beforeClose.slice(0, fmEnd);
  const bodyPart = beforeClose.slice(fmEnd);

  const layout = splitBaseLayoutOpenAndInner(bodyPart);
  if (!layout) {
    throw new Error("About page body missing <BaseLayout>");
  }

  let inner = layout.inner;
  let bandsImportRemoved = false;

  if (applyProfile) {
    const $ = cheerio.load(`<div id="gosaki-about-root">${inner}</div>`, { xml: false });
    const grid = $(PROFILE_GRID_SELECTOR);
    if (!grid.length) {
      if (options.requireProfileAnchor !== false) {
        throw new Error(`About profile anchor not found: ${PROFILE_GRID_SELECTOR}`);
      }
    } else {
      grid.html(String(profileBlock?.html ?? "").trim());
      inner = $("#gosaki-about-root").html() ?? inner;
    }
  }

  if (applyBands) {
    const bandsHtml = String(bandsBlock?.html ?? "").trim();
    if (!inner.includes("<BandProfilesSection")) {
      inner = `${inner.trimEnd()}\n  ${bandsHtml}\n`;
    } else {
      inner = inner.replace(/\n\s*<BandProfilesSection\s*\/>\s*\n?/g, `\n  ${bandsHtml}\n`);
    }
  }

  let updated = `${frontmatter}${layout.open}${inner}${afterClose}`;
  if (applyBands) {
    const withoutImport = updated.replace(
      /^import BandProfilesSection from [^\n]+\n/m,
      "",
    );
    bandsImportRemoved = withoutImport !== updated;
    updated = withoutImport;
  }

  return {
    content: updated,
    profileApplied: applyProfile,
    bandsApplied: applyBands,
    bandsImportRemoved,
  };
}

/**
 * @param {string} aboutHtml
 * @param {{ profileSnippet?: string, bandsTitle?: string, bandNames?: string[], expectBandProfilesComponent?: boolean }} expected
 */
export function verifyAboutContentHtml(aboutHtml, expected) {
  /** @type {string[]} */
  const errors = [];

  if (expected.profileSnippet && !aboutHtml.includes(expected.profileSnippet)) {
    errors.push(`missing profile snippet: ${expected.profileSnippet}`);
  }
  if (expected.bandsTitle && !aboutHtml.includes(expected.bandsTitle)) {
    errors.push(`missing bands title: ${expected.bandsTitle}`);
  }
  for (const name of expected.bandNames ?? []) {
    if (!aboutHtml.includes(name)) errors.push(`missing band name: ${name}`);
  }
  if (expected.expectBandProfilesComponent === false && aboutHtml.includes("<BandProfilesSection")) {
    errors.push("BandProfilesSection component should be replaced");
  }
  if (expected.expectBandProfilesComponent === true && !aboutHtml.includes("band-profiles")) {
    errors.push("expected band-profiles fallback markup");
  }
  const bandProfilesCount = (aboutHtml.match(/class="band-profiles"/g) ?? []).length;
  if (bandProfilesCount > 1) {
    errors.push(`duplicate band-profiles sections: ${bandProfilesCount}`);
  }

  return { ok: errors.length === 0, errors };
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{ aboutPagePath?: string }} [options]
 */
export function applyGosakiAboutContent(outDir, toolRoot, options = {}) {
  const loaded = loadGosakiAboutContentConfig(toolRoot);
  if (!loaded.ok) {
    return {
      applied: false,
      reason: loaded.error,
      profileApplied: false,
      bandsApplied: false,
    };
  }

  const aboutRel = options.aboutPagePath ?? "src/pages/about/index.astro";
  const aboutPath = path.join(outDir, aboutRel);
  if (!fs.existsSync(aboutPath)) {
    return {
      applied: false,
      reason: `About page not found: ${aboutRel}`,
      profileApplied: false,
      bandsApplied: false,
    };
  }

  const dataDest = path.join(outDir, GOSAKI_ABOUT_CONTENT_DATA_REL);
  fs.mkdirSync(path.dirname(dataDest), { recursive: true });
  fs.writeFileSync(dataDest, `${JSON.stringify(loaded.config, null, 2)}\n`, "utf8");

  const aboutContent = fs.readFileSync(aboutPath, "utf8");
  const result = applyAboutContentToPage(aboutContent, loaded.config);
  fs.writeFileSync(aboutPath, result.content, "utf8");

  return {
    applied: result.profileApplied || result.bandsApplied,
    reason: null,
    profileApplied: result.profileApplied,
    bandsApplied: result.bandsApplied,
    bandsImportRemoved: result.bandsImportRemoved,
    aboutPagePath: aboutRel,
    dataPath: GOSAKI_ABOUT_CONTENT_DATA_REL,
    configPath: GOSAKI_ABOUT_CONTENT_CONFIG_REL,
  };
}
