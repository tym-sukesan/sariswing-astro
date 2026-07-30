/**
 * Mio Kisaragi Jazz — footer SNS markup (Instagram + YouTube only).
 * Does not import or reuse Gosaki footer helpers.
 */

import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transformHtmlFragment } from "./path-transform.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../../package.json"));
const cheerio = require("cheerio");

/** @typedef {{ label: string, href: string }} MioFooterSocialLink */

const SOCIAL_ORDER = ["Instagram", "YouTube"];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} label
 * @param {string} href
 * @returns {string | null}
 */
function classifyMioSocialLink(label, href) {
  const text = String(label ?? "").trim();
  const url = String(href ?? "").trim();
  if (/instagram/i.test(text) || /instagram\.com/i.test(url)) return "Instagram";
  if (/youtube/i.test(text) || /youtube\.com|youtu\.be/i.test(url)) return "YouTube";
  // X / Twitter intentionally unsupported for Mio thin adapter.
  return null;
}

/**
 * Extract Instagram + YouTube only (never X).
 * @param {string} footerHtml
 * @returns {MioFooterSocialLink[]}
 */
export function extractMioFooterSocialLinks(footerHtml) {
  if (!footerHtml?.trim()) return [];

  const $ = cheerio.load(`<div id="__mio_footer_extract">${footerHtml}</div>`, {
    decodeEntities: false,
  });
  const byLabel = new Map();

  $("#__mio_footer_extract a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const label = ($(el).text() || $(el).attr("aria-label") || "").trim();
    const kind = classifyMioSocialLink(label, href);
    if (!kind || !href) return;
    if (!byLabel.has(kind)) byLabel.set(kind, { label: kind, href });
  });

  return SOCIAL_ORDER.filter((name) => byLabel.has(name)).map((name) => byLabel.get(name));
}

/**
 * @param {MioFooterSocialLink[]} links
 */
function buildMioSocialNavMarkup(links) {
  const items = links
    .map(
      (link) =>
        `        <li><a href="${escapeHtml(link.href)}" rel="noopener noreferrer">${escapeHtml(link.label)}</a></li>`,
    )
    .join("\n");
  return `<ul class="mio-footer-social-links sns-row" aria-label="Social" data-mio-footer-social="true">\n${items}\n      </ul>`;
}

/**
 * Rewrite footer SNS to Mio-only markup (Instagram / YouTube; no X).
 * @param {string} footerHtml
 * @returns {string}
 */
export function injectMioFooterSocialBlock(footerHtml) {
  if (!footerHtml?.trim()) return footerHtml;

  const links = extractMioFooterSocialLinks(footerHtml);
  const $ = cheerio.load(`<div id="__mio_footer_wrap">${footerHtml}</div>`, {
    decodeEntities: false,
  });
  const root = $("#__mio_footer_wrap");
  const existing = root.find("ul.sns-row, ul[aria-label='Social']").first();
  const nav = buildMioSocialNavMarkup(links);

  if (existing.length) {
    existing.replaceWith(nav);
  } else if (links.length) {
    const wrap = root.find(".wrap").first();
    if (wrap.length) wrap.prepend(nav);
    else root.prepend(nav);
  }

  // Ensure no X / Twitter anchors remain in footer social.
  root.find("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const label = ($(el).text() || "").trim();
    if (/twitter\.com|x\.com/i.test(href) || /^X\b/i.test(label) || /twitter/i.test(label)) {
      $(el).closest("li").remove();
      $(el).remove();
    }
  });

  return root.html() ?? footerHtml;
}

/**
 * @param {string | null | undefined} footerHtml
 * @param {{ productionOrigin?: string | null }} [linkTransformContext]
 * @returns {string}
 */
export function generateMioFooterAstro(footerHtml, linkTransformContext = {}) {
  if (!footerHtml?.trim()) {
    return "<!-- Footer — not detected; replace manually -->\n";
  }

  const injected = injectMioFooterSocialBlock(footerHtml);
  const stripped = injected
    .replace(/\s+aria-current="[^"]*"/gi, "")
    .replace(/\bis-current\b/g, "")
    .replace(/\s+class="\s*"/gi, "");

  return `${transformHtmlFragment(stripped, "index.html", linkTransformContext)}\n`;
}
