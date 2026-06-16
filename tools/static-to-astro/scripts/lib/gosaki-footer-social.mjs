/**
 * G-8g6 — Inject gosaki footer SNS text links block; hide fragile Wix #LnkBr2 markup.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isGosakiPianoFixture } from "./gosaki-about-band-profiles.mjs";
import { transformHtmlFragment } from "./path-transform.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");
const require = createRequire(path.join(TOOL_ROOT, "package.json"));
const cheerio = require("cheerio");

/** @typedef {{ label: string, href: string }} GosakiFooterSocialLink */

const SOCIAL_ORDER = ["Facebook", "X", "Instagram"];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} ariaLabel
 * @param {string} href
 * @returns {string | null}
 */
function classifySocialLink(ariaLabel, href) {
  const label = ariaLabel.trim();
  const url = href.trim();
  if (/facebook/i.test(label) || /facebook\.com/i.test(url)) return "Facebook";
  if (/^X\b/i.test(label) || /twitter\.com|x\.com/i.test(url)) return "X";
  if (/instagram/i.test(label) || /instagram\.com/i.test(url)) return "Instagram";
  return null;
}

/**
 * @param {string} footerHtml
 * @returns {GosakiFooterSocialLink[]}
 */
export function extractGosakiFooterSocialLinks(footerHtml) {
  if (!footerHtml?.trim()) return [];

  const $ = cheerio.load(`<div id="__footer_extract">${footerHtml}</div>`, { decodeEntities: false });
  const byLabel = new Map();

  $("#__footer_extract #LnkBr2 a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const aria = $(el).attr("aria-label") ?? "";
    const label = classifySocialLink(aria, href);
    if (!label || !href) return;
    if (!byLabel.has(label)) byLabel.set(label, { label, href });
  });

  return SOCIAL_ORDER.filter((name) => byLabel.has(name)).map((name) => byLabel.get(name));
}

/**
 * @param {GosakiFooterSocialLink[]} links
 */
function buildSocialNavMarkup(links) {
  const items = links
    .map(
      (link) =>
        `  <a href="${escapeHtml(link.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`,
    )
    .join("\n");
  return `<nav class="gosaki-footer-social-links" aria-label="Social links">\n${items}\n</nav>`;
}

/**
 * @param {string} footerHtml
 * @returns {string}
 */
export function injectGosakiFooterSocialBlock(footerHtml) {
  if (!footerHtml?.trim()) return footerHtml;

  const links = extractGosakiFooterSocialLinks(footerHtml);
  if (!links.length) return footerHtml;

  const $ = cheerio.load(`<div id="__footer_wrap">${footerHtml}</div>`, { decodeEntities: false });
  const root = $("#__footer_wrap");

  if (!root.find("#LnkBr2").length) return footerHtml;

  if (!root.find(".gosaki-footer-social-links").length) {
    const nav = buildSocialNavMarkup(links);
    const copyright = root.find("#WRchTxtx").first();
    if (copyright.length) copyright.before(nav);
    else root.find("#LnkBr2").first().after(nav);
  }

  return root.html() ?? footerHtml;
}

/**
 * @param {string | null | undefined} footerHtml
 * @param {{ productionOrigin?: string | null }} [linkTransformContext]
 * @returns {string}
 */
export function generateGosakiFooterAstro(footerHtml, linkTransformContext = {}) {
  if (!footerHtml?.trim()) {
    return "<!-- Footer — not detected; replace manually -->\n";
  }

  const injected = injectGosakiFooterSocialBlock(footerHtml);
  const stripped = injected
    .replace(/\s+aria-current="[^"]*"/gi, "")
    .replace(/\bis-current\b/g, "")
    .replace(/\s+class="\s*"/gi, "");

  return `${transformHtmlFragment(stripped, "index.html", linkTransformContext)}\n`;
}

export { isGosakiPianoFixture };
