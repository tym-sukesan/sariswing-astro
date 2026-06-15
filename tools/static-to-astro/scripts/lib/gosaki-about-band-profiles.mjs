/**
 * G-8a — Inject gosaki About page band / project profiles section.
 */

import fs from "node:fs";
import path from "node:path";

export const GOSAKI_BAND_PROFILES_CONFIG_REL = "config/sites/gosaki-piano-band-profiles.json";
export const GOSAKI_BAND_PROFILES_TEMPLATE_REL =
  "templates/site-extensions/gosaki-piano/BandProfilesSection.astro";

/**
 * @param {string} toolRoot
 */
export function resolveGosakiBandProfilesConfigPath(toolRoot) {
  return path.join(toolRoot, GOSAKI_BAND_PROFILES_CONFIG_REL);
}

/**
 * @param {string} toolRoot
 */
export function loadGosakiBandProfilesConfig(toolRoot) {
  const configPath = resolveGosakiBandProfilesConfigPath(toolRoot);
  if (!fs.existsSync(configPath)) {
    return { ok: false, configPath, config: null, error: "config not found" };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!Array.isArray(config.bands) || config.bands.length === 0) {
      return { ok: false, configPath, config: null, error: "bands array missing or empty" };
    }
    return { ok: true, configPath, config, error: null };
  } catch (err) {
    return { ok: false, configPath, config: null, error: `parse error: ${err.message}` };
  }
}

/**
 * @param {string} siteDir
 */
export function isGosakiPianoFixture(siteDir) {
  return path.basename(path.resolve(siteDir)) === "gosaki-piano";
}

/**
 * @param {string} pageContent
 */
export function injectBandProfilesIntoAboutPage(pageContent) {
  if (!pageContent.includes("</BaseLayout>")) {
    throw new Error("About page content missing </BaseLayout>");
  }
  if (pageContent.includes("BandProfilesSection")) {
    return pageContent;
  }

  const importLine = 'import BandProfilesSection from "../../components/BandProfilesSection.astro";\n';
  const withImport = pageContent.replace(
    /^---\nimport BaseLayout/m,
    `---\n${importLine}import BaseLayout`,
  );

  return withImport.replace(
    "</BaseLayout>",
    `  <BandProfilesSection />\n</BaseLayout>`,
  );
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{ aboutPagePath?: string }} [options]
 */
export function applyGosakiAboutBandProfiles(outDir, toolRoot, options = {}) {
  const loaded = loadGosakiBandProfilesConfig(toolRoot);
  if (!loaded.ok) {
    return { applied: false, reason: loaded.error, bandCount: 0 };
  }

  const templatePath = path.join(toolRoot, GOSAKI_BAND_PROFILES_TEMPLATE_REL);
  if (!fs.existsSync(templatePath)) {
    return { applied: false, reason: "BandProfilesSection template missing", bandCount: 0 };
  }

  const aboutRel = options.aboutPagePath ?? "src/pages/about/index.astro";
  const aboutPath = path.join(outDir, aboutRel);
  if (!fs.existsSync(aboutPath)) {
    return { applied: false, reason: `About page not found: ${aboutRel}`, bandCount: 0 };
  }

  const componentDest = path.join(outDir, "src/components/BandProfilesSection.astro");
  const dataDest = path.join(outDir, "src/data/gosaki-band-profiles.json");
  const bandsPublicDir = path.join(outDir, "public/images/bands");

  fs.mkdirSync(path.dirname(dataDest), { recursive: true });
  fs.mkdirSync(bandsPublicDir, { recursive: true });
  fs.copyFileSync(templatePath, componentDest);
  fs.writeFileSync(dataDest, `${JSON.stringify(loaded.config, null, 2)}\n`, "utf8");

  const aboutContent = fs.readFileSync(aboutPath, "utf8");
  fs.writeFileSync(aboutPath, injectBandProfilesIntoAboutPage(aboutContent), "utf8");

  return {
    applied: true,
    reason: null,
    bandCount: loaded.config.bands.length,
    sectionTitle: loaded.config.sectionTitle ?? "Bands / Projects",
    aboutPagePath: aboutRel,
    componentPath: "src/components/BandProfilesSection.astro",
    dataPath: "src/data/gosaki-band-profiles.json",
    imageDir: "public/images/bands/",
  };
}

/**
 * @param {string} aboutHtml
 * @param {{ sectionTitle?: string, bandNames?: string[] }} expected
 */
export function verifyAboutBandProfilesHtml(aboutHtml, expected) {
  /** @type {string[]} */
  const errors = [];
  const title = expected.sectionTitle ?? "Bands / Projects";
  if (!aboutHtml.includes(title)) errors.push(`missing section title: ${title}`);
  for (const name of expected.bandNames ?? []) {
    if (!aboutHtml.includes(name)) errors.push(`missing band name: ${name}`);
  }
  if (!aboutHtml.includes("band-profiles")) errors.push("missing band-profiles class");
  return { ok: errors.length === 0, errors };
}
