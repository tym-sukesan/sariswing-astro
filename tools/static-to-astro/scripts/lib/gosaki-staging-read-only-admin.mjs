/**
 * G-11b — Inject Gosaki staging read-only admin page into generated Astro output.
 */

import fs from "node:fs";
import path from "node:path";
import { isGosakiPianoFixture } from "./gosaki-about-band-profiles.mjs";
import { loadGosakiAboutContentConfig } from "./gosaki-about-content.mjs";
import { loadGosakiYoutubeEmbedConfig } from "./gosaki-home-youtube-embed.mjs";

export const GOSAKI_READ_ONLY_ADMIN_MARKER = "gosaki-read-only-admin";
export const GOSAKI_READ_ONLY_ADMIN_DATA_ATTR = 'data-gosaki-read-only-admin="true"';
export const GOSAKI_READ_ONLY_ADMIN_PAGE_REL = "src/pages/admin/index.astro";
export const GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL =
  "src/components/GosakiStagingReadOnlyAdminPage.astro";
export const GOSAKI_READ_ONLY_ADMIN_LIB_REL = "src/lib/gosaki-staging-read-only-admin.ts";
export const GOSAKI_READ_ONLY_ADMIN_CSS_REL = "src/styles/gosaki-staging-read-only-admin.css";
export const GOSAKI_CONTACT_HUBSPOT_CONFIG_REL = "config/sites/gosaki-piano-contact-hubspot.json";

export const EXPECTED_BAND_IMAGE_FILES = [
  "gosakirikako_trio.jpg",
  "onomatopoeia.jpg",
  "careless_hornets.jpg",
  "kikioto.jpg",
  "caribbean_function.jpg",
];

export { isGosakiPianoFixture };

/**
 * @param {string} toolRoot
 */
export function loadGosakiContactHubspotConfig(toolRoot) {
  const configPath = path.join(toolRoot, GOSAKI_CONTACT_HUBSPOT_CONFIG_REL);
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
 * @param {string} html
 */
export function isGosakiReadOnlyAdminHtml(html) {
  return String(html).includes(GOSAKI_READ_ONLY_ADMIN_DATA_ATTR);
}

/**
 * @param {string} publicDir
 */
export function detectGosakiReadOnlyAdminInPublicDir(publicDir) {
  const adminIndex = path.join(publicDir, "admin/index.html");
  if (!fs.existsSync(adminIndex)) return false;
  return isGosakiReadOnlyAdminHtml(fs.readFileSync(adminIndex, "utf8"));
}

/**
 * @param {string} bandsHtml
 */
export function extractBandImageFileNamesFromHtml(bandsHtml) {
  const matches = String(bandsHtml ?? "").matchAll(
    /assets\/about\/bands\/([a-zA-Z0-9_.-]+\.(?:jpg|jpeg|png|webp))/gi,
  );
  const seen = new Set();
  const files = [];
  for (const match of matches) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      files.push(name);
    }
  }
  return files;
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 */
export function applyGosakiStagingReadOnlyAdmin(outDir, toolRoot) {
  const youtube = loadGosakiYoutubeEmbedConfig(toolRoot);
  const about = loadGosakiAboutContentConfig(toolRoot);
  const contact = loadGosakiContactHubspotConfig(toolRoot);

  if (!youtube.ok || !about.ok || !contact.ok) {
    return {
      applied: false,
      reason: [
        !youtube.ok ? youtube.error : null,
        !about.ok ? about.error : null,
        !contact.ok ? contact.error : null,
      ]
        .filter(Boolean)
        .join("; "),
    };
  }

  const templateRoot = path.join(toolRoot, "templates/site-extensions/gosaki-piano");
  const componentSrc = path.join(templateRoot, "GosakiStagingReadOnlyAdminPage.astro");
  const libSrc = path.join(templateRoot, "gosaki-staging-read-only-admin.ts");
  const cssSrc = path.join(templateRoot, "gosaki-staging-read-only-admin.css");

  for (const src of [componentSrc, libSrc, cssSrc]) {
    if (!fs.existsSync(src)) {
      return { applied: false, reason: `template missing: ${path.basename(src)}` };
    }
  }

  const componentDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL);
  const libDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_LIB_REL);
  const cssDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_CSS_REL);
  const pageDest = path.join(outDir, GOSAKI_READ_ONLY_ADMIN_PAGE_REL);

  fs.mkdirSync(path.dirname(libDest), { recursive: true });
  fs.mkdirSync(path.dirname(cssDest), { recursive: true });
  fs.mkdirSync(path.dirname(pageDest), { recursive: true });

  fs.copyFileSync(libSrc, libDest);
  fs.copyFileSync(cssSrc, cssDest);

  let pageTemplate = fs.readFileSync(componentSrc, "utf8");
  pageTemplate = pageTemplate
    .replace('import "../styles/gosaki-staging-read-only-admin.css";', 'import "../../styles/gosaki-staging-read-only-admin.css";')
    .replace('import youtubeConfig from "../data/gosaki-youtube-embed.json";', 'import youtubeConfig from "../../data/gosaki-youtube-embed.json";')
    .replace('import aboutConfig from "../data/gosaki-about-content.json";', 'import aboutConfig from "../../data/gosaki-about-content.json";')
    .replace('import contactConfig from "../data/gosaki-contact-hubspot.json";', 'import contactConfig from "../../data/gosaki-contact-hubspot.json";')
    .replace('} from "../lib/gosaki-staging-read-only-admin";', '} from "../../lib/gosaki-staging-read-only-admin";');
  fs.writeFileSync(pageDest, pageTemplate, "utf8");

  const bandsBlock = about.config.blocks?.find((b) => b?.id === "about-bands-html");
  const bandImages = extractBandImageFileNamesFromHtml(bandsBlock?.html ?? "");

  return {
    applied: true,
    reason: null,
    adminRoute: "/admin/",
    pagePath: GOSAKI_READ_ONLY_ADMIN_PAGE_REL,
    componentPath: GOSAKI_READ_ONLY_ADMIN_COMPONENT_REL,
    libPath: GOSAKI_READ_ONLY_ADMIN_LIB_REL,
    bandImageCount: bandImages.length,
    bandImageFiles: bandImages,
    contactPortalId: contact.config.portalId ?? null,
    contactFormId: contact.config.formId ?? null,
  };
}
