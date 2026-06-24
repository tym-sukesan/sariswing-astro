/**
 * G-10g1 — Inject gosaki Contact page HubSpot form embed from static JSON config.
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

export const GOSAKI_CONTACT_HUBSPOT_CONFIG_REL =
  "config/sites/gosaki-piano-contact-hubspot.json";
export const GOSAKI_CONTACT_HUBSPOT_DATA_REL = "src/data/gosaki-contact-hubspot.json";
export const CONTACT_FORM_WRAPPER_SELECTOR = "#comp-jqbwo704";
export const GOSAKI_CONTACT_HUBSPOT_SLOT = "<!--GOSAKI_CONTACT_HUBSPOT_SLOT-->";

export const GOSAKI_CONTACT_HUBSPOT_ALLOWLIST = {
  provider: "hubspot",
  scriptSrc: "https://js.hsforms.net/forms/embed/21392032.js",
  portalId: "21392032",
  formId: "57909d0c-9b9f-470a-8a18-e176d1d1a459",
  region: "na1",
};

export { isGosakiPianoFixture };

/**
 * @param {string} toolRoot
 */
export function resolveGosakiContactHubspotConfigPath(toolRoot) {
  return path.join(toolRoot, GOSAKI_CONTACT_HUBSPOT_CONFIG_REL);
}

/**
 * @param {Record<string, unknown>} config
 */
export function validateGosakiContactHubspotConfig(config) {
  const errors = [];
  const allow = GOSAKI_CONTACT_HUBSPOT_ALLOWLIST;

  if (config.enabled !== true) {
    errors.push("enabled must be true");
  }
  if (String(config.provider ?? "") !== allow.provider) {
    errors.push(`provider must be ${allow.provider}`);
  }
  if (String(config.scriptSrc ?? "") !== allow.scriptSrc) {
    errors.push(`scriptSrc must be ${allow.scriptSrc}`);
  }
  if (String(config.portalId ?? "") !== allow.portalId) {
    errors.push(`portalId must be ${allow.portalId}`);
  }
  if (String(config.formId ?? "") !== allow.formId) {
    errors.push(`formId must be ${allow.formId}`);
  }
  if (String(config.region ?? "") !== allow.region) {
    errors.push(`region must be ${allow.region}`);
  }
  if (String(config.siteSlug ?? "") !== "gosaki-piano") {
    errors.push("siteSlug must be gosaki-piano");
  }
  if (String(config.page ?? "") !== "contact") {
    errors.push("page must be contact");
  }

  return { ok: errors.length === 0, errors };
}

/**
 * @param {string} toolRoot
 */
export function loadGosakiContactHubspotConfig(toolRoot) {
  const configPath = resolveGosakiContactHubspotConfigPath(toolRoot);
  if (!fs.existsSync(configPath)) {
    return { ok: false, configPath, config: null, error: "config not found" };
  }
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const validation = validateGosakiContactHubspotConfig(config);
    if (!validation.ok) {
      return {
        ok: false,
        configPath,
        config: null,
        error: validation.errors.join("; "),
      };
    }
    return { ok: true, configPath, config, error: null };
  } catch (err) {
    return { ok: false, configPath, config: null, error: `parse error: ${err.message}` };
  }
}

/**
 * @param {Record<string, unknown>} config
 */
export function buildGosakiContactHubspotEmbedHtml(config) {
  const validation = validateGosakiContactHubspotConfig(config);
  if (!validation.ok) {
    throw new Error(validation.errors.join("; "));
  }

  const allow = GOSAKI_CONTACT_HUBSPOT_ALLOWLIST;
  return [
    `<script is:inline src="${allow.scriptSrc}" defer></script>`,
    `<div class="hs-form-frame" data-region="${allow.region}" data-form-id="${allow.formId}" data-portal-id="${allow.portalId}"></div>`,
  ].join("\n");
}

/**
 * @param {string} innerHtml
 * @param {string} embedHtml
 */
export function replaceContactFormWithHubspotEmbed(innerHtml, embedHtml) {
  const $ = cheerio.load(`<div id="gosaki-contact-root">${innerHtml}</div>`, { xml: false });

  $("script[src*='js.hsforms.net/forms/embed/']").remove();
  $(".hs-form-frame").remove();
  $(GOSAKI_CONTACT_HUBSPOT_SLOT).remove();

  const formWrapper = $(CONTACT_FORM_WRAPPER_SELECTOR);
  if (!formWrapper.length) {
    throw new Error(`Contact form wrapper not found: ${CONTACT_FORM_WRAPPER_SELECTOR}`);
  }

  formWrapper.replaceWith(
    `<div id="gosaki-contact-hubspot-embed" class="gosaki-contact-hubspot-embed">${embedHtml}</div>`,
  );

  return $("#gosaki-contact-root").html() ?? innerHtml;
}

/**
 * @param {string} pageContent
 * @param {string} embedHtml
 */
export function injectHubspotEmbedIntoContactPage(pageContent, embedHtml) {
  if (!pageContent.includes("</BaseLayout>")) {
    throw new Error("Contact page content missing </BaseLayout>");
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
    throw new Error("Contact page body missing <BaseLayout>");
  }

  const inner = replaceContactFormWithHubspotEmbed(layout.inner, embedHtml);
  return `${frontmatter}${layout.open}${inner}${afterClose}`;
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{ contactPagePath?: string }} [options]
 */
export function applyGosakiContactHubspotEmbed(outDir, toolRoot, options = {}) {
  const loaded = loadGosakiContactHubspotConfig(toolRoot);
  if (!loaded.ok) {
    return { applied: false, reason: loaded.error };
  }

  const contactRel = options.contactPagePath ?? "src/pages/contact/index.astro";
  const contactPath = path.join(outDir, contactRel);
  if (!fs.existsSync(contactPath)) {
    return { applied: false, reason: `Contact page not found: ${contactRel}` };
  }

  const dataDest = path.join(outDir, GOSAKI_CONTACT_HUBSPOT_DATA_REL);
  fs.mkdirSync(path.dirname(dataDest), { recursive: true });
  fs.writeFileSync(dataDest, `${JSON.stringify(loaded.config, null, 2)}\n`, "utf8");

  const embedHtml = buildGosakiContactHubspotEmbedHtml(loaded.config);
  const contactContent = fs.readFileSync(contactPath, "utf8");
  fs.writeFileSync(
    contactPath,
    injectHubspotEmbedIntoContactPage(contactContent, embedHtml),
    "utf8",
  );

  return {
    applied: true,
    reason: null,
    contactPagePath: contactRel,
    dataPath: GOSAKI_CONTACT_HUBSPOT_DATA_REL,
    configPath: GOSAKI_CONTACT_HUBSPOT_CONFIG_REL,
    provider: loaded.config.provider,
    portalId: loaded.config.portalId,
    formId: loaded.config.formId,
  };
}
