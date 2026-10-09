/**
 * G-10h2 — Inject gosaki About page HTML blocks from static JSON config.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isGosakiPianoFixture } from "./gosaki-about-band-profiles.mjs";
import { splitBaseLayoutOpenAndInner } from "./gosaki-home-youtube-embed.mjs";
import { overlayProfileLedeInHtml, extractProfileLedeFromBody } from "./cms-core-v2-about-supabase-contract.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, "../../package.json"));
const cheerio = require("cheerio");

export const GOSAKI_ABOUT_CONTENT_CONFIG_REL = "config/sites/gosaki-piano-about-content.json";
export const GOSAKI_ABOUT_CONTENT_DATA_REL = "src/data/gosaki-about-content.json";
/** Convert/package evidence — not FTP public-dist payload (lives at package / astro root). */
export const ABOUT_PUBLIC_BUILD_READ_REPORT_NAME = "ABOUT_PUBLIC_BUILD_READ_REPORT.json";
export const PROFILE_GRID_SELECTOR = '[data-mesh-id="comp-lol1i5l0inlineContent-gridContainer"]';
export const BLOCK_PROFILE_ID = "about-profile-html";
export const BLOCK_BANDS_ID = "about-bands-html";

export { isGosakiPianoFixture };

/**
 * Build-read evidence for PACKAGE_RUN / verifier cross-check.
 *
 * Supabase success (not fallback):
 * - overlayOutcome "applied" — DB text differed · first <p> rewritten
 * - overlayOutcome "noop_equal" — DB text already equal to JSON first <p>
 * fallbackReason only for load/overlay failures (0-row, multi-row, empty, network, true overlay_noop, …).
 *
 * @param {{
 *   pageFieldsBundle?: {
 *     pageFieldDataSource?: string | null,
 *     fallbackReason?: string | null,
 *     fieldCount?: number,
 *     rowCount?: number,
 *     profileLede?: { valueText?: string } | null,
 *   } | null,
 *   ledeOverlaid?: boolean,
 *   overlayOutcome?: "applied" | "noop_equal" | "failed" | "skipped" | null,
 *   overlayReason?: string | null,
 * }} input
 */
export function buildAboutPublicBuildReadEvidence(input = {}) {
  const bundle = input.pageFieldsBundle ?? null;
  const source =
    bundle == null ? "json" : String(bundle.pageFieldDataSource ?? "json");
  const fieldCount = Number(bundle?.fieldCount ?? bundle?.rowCount ?? 0);
  /** @type {"applied" | "noop_equal" | "failed" | "skipped"} */
  let overlayOutcome = "skipped";
  if (input.overlayOutcome === "applied" || input.overlayOutcome === "noop_equal") {
    overlayOutcome = input.overlayOutcome;
  } else if (input.overlayOutcome === "failed") {
    overlayOutcome = "failed";
  } else if (input.ledeOverlaid === true) {
    overlayOutcome = "applied";
  } else if (source === "supabase") {
    overlayOutcome = "failed";
  }

  const supabaseSuccess =
    source === "supabase" &&
    Number(fieldCount) >= 1 &&
    (overlayOutcome === "applied" || overlayOutcome === "noop_equal");

  /** @type {string | null} */
  let fallbackReason = null;
  if (!supabaseSuccess) {
    if (bundle?.fallbackReason != null && String(bundle.fallbackReason).trim()) {
      fallbackReason = String(bundle.fallbackReason);
    } else if (input.overlayReason != null && String(input.overlayReason).trim()) {
      // Do not treat noop_equal reason as fallback (reason is null for that path).
      fallbackReason = String(input.overlayReason);
    } else if (bundle == null || source === "json") {
      // Intentional JSON SoT when build-read off — not a failure fallback field.
      fallbackReason = null;
    } else {
      fallbackReason = "about_lede_not_overlaid_from_supabase";
    }
  }

  /** @type {Record<string, unknown>} */
  const evidence = {
    pageFieldDataSource: source,
    profileLedeOverlayApplied: overlayOutcome === "applied",
    overlayOutcome,
    fieldCount: Number.isFinite(fieldCount) ? fieldCount : 0,
  };
  if (fallbackReason) evidence.fallbackReason = fallbackReason;
  if (supabaseSuccess) {
    const lede = String(bundle?.profileLede?.valueText ?? "").trim();
    if (lede) evidence.profileLedeValueText = lede;
  }
  return evidence;
}

/**
 * @param {string} outDir
 * @param {Record<string, unknown>} evidence
 */
export function writeAboutPublicBuildReadReport(outDir, evidence) {
  const target = path.join(outDir, ABOUT_PUBLIC_BUILD_READ_REPORT_NAME);
  fs.writeFileSync(target, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return target;
}

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

function decodeAboutText(value) {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeAboutText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAboutAttr(value) {
  return escapeAboutText(value).replace(/"/g, "&quot;");
}

function paragraphTexts(html) {
  return [...String(html ?? "").matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((match) =>
    decodeAboutText(match[1]),
  );
}

/**
 * Replace paragraph text inside one fragment. Equal text keeps the original markup.
 * @param {string} html
 * @param {string} bodyText
 */
function overlayParagraphTexts(html, bodyText) {
  const source = String(html ?? "");
  const parts = String(bodyText ?? "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
  const existing = [...source.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)];
  if (existing.length === 0 || parts.length === 0) {
    return { html: source, missing: existing.length === 0, applied: false };
  }
  if (paragraphTexts(source).join("\n\n") === parts.join("\n\n")) {
    return { html: source, missing: false, applied: false };
  }
  const open = existing[0][0].match(/^<p\b[^>]*>/i)?.[0] ?? "<p>";
  const rebuilt = parts.map((text) => `${open}${escapeAboutText(text)}</p>`).join("\n\n");
  const start = existing[0].index ?? 0;
  const last = existing[existing.length - 1];
  const end = (last.index ?? 0) + last[0].length;
  return {
    html: `${source.slice(0, start)}${rebuilt}${source.slice(end)}`,
    missing: false,
    applied: true,
  };
}

/**
 * @param {string} html
 * @param {string} text
 */
function overlayFirstHeadingText(html, text) {
  const source = String(html ?? "");
  const match = source.match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/i);
  if (!match || match.index == null) return { html: source, missing: true, applied: false };
  if (decodeAboutText(match[0]) === text) return { html: source, missing: false, applied: false };
  const open = match[0].match(/^<h[1-6]\b[^>]*>/i)?.[0] ?? "<h4>";
  const close = match[0].match(/<\/h[1-6]>$/i)?.[0] ?? "</h4>";
  const next = `${open}${escapeAboutText(text)}${close}`;
  return {
    html: `${source.slice(0, match.index)}${next}${source.slice(match.index + match[0].length)}`,
    missing: false,
    applied: true,
  };
}

/**
 * @param {string} html
 * @param {string} alt
 */
function overlayFirstImageAlt(html, alt) {
  const source = String(html ?? "");
  const match = source.match(/<img\b[^>]*>/i);
  if (!match || match.index == null) return { html: source, missing: true, applied: false };
  const tag = match[0];
  const current = decodeAboutText(tag.match(/\balt="([^"]*)"/i)?.[1] ?? "");
  if (/\balt="/i.test(tag) && current === alt) return { html: source, missing: false, applied: false };
  const next = /\balt="[^"]*"/i.test(tag)
    ? tag.replace(/\balt="[^"]*"/i, `alt="${escapeAboutAttr(alt)}"`)
    : tag.replace(/<img\b/i, `<img alt="${escapeAboutAttr(alt)}"`);
  if (next === tag) return { html: source, missing: false, applied: false };
  return {
    html: `${source.slice(0, match.index)}${next}${source.slice(match.index + tag.length)}`,
    missing: false,
    applied: true,
  };
}

/**
 * @param {string} articleHtml
 * @param {{ name?: string, body?: string, imageAlt?: string }} patch
 */
function overlayBandArticle(articleHtml, patch) {
  let html = articleHtml;
  let applied = false;
  if (patch.name != null) {
    const name = overlayElementText(html, "h3", "band-profile__name", patch.name);
    if (name.missing) return { html: articleHtml, missing: true, applied: false };
    html = name.html;
    applied = applied || name.applied;
  }
  if (patch.body != null) {
    const desc = overlayClassInner(html, "div", "band-profile__description", (inner) =>
      overlayParagraphTexts(inner, patch.body),
    );
    if (desc.missing) return { html: articleHtml, missing: true, applied: false };
    html = desc.html;
    applied = applied || desc.applied;
  }
  if (patch.imageAlt != null) {
    const alt = overlayFirstImageAlt(html, patch.imageAlt);
    if (alt.missing) return { html: articleHtml, missing: true, applied: false };
    html = alt.html;
    applied = applied || alt.applied;
  }
  return { html, missing: false, applied };
}

/**
 * @param {string} html
 * @param {string} tag
 * @param {string} className
 * @param {string} text
 */
function overlayElementText(html, tag, className, text) {
  const source = String(html ?? "");
  const re = new RegExp(
    `(<${tag}\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>)([\\s\\S]*?)(</${tag}>)`,
    "i",
  );
  const match = source.match(re);
  if (!match || match.index == null) return { html: source, missing: true, applied: false };
  if (decodeAboutText(match[2]) === text) return { html: source, missing: false, applied: false };
  const next = `${match[1]}${escapeAboutText(text)}${match[3]}`;
  return {
    html: `${source.slice(0, match.index)}${next}${source.slice(match.index + match[0].length)}`,
    missing: false,
    applied: true,
  };
}

/**
 * @param {string} html
 * @param {string} tag
 * @param {string} className
 * @param {(inner: string) => { html: string, missing: boolean, applied: boolean }} replacer
 */
function overlayClassInner(html, tag, className, replacer) {
  const source = String(html ?? "");
  const re = new RegExp(
    `(<${tag}\\b[^>]*\\bclass="[^"]*\\b${className}\\b[^"]*"[^>]*>)([\\s\\S]*?)(</${tag}>)`,
    "i",
  );
  const match = source.match(re);
  if (!match || match.index == null) return { html: source, missing: true, applied: false };
  const inner = replacer(match[2]);
  if (inner.missing) return { html: source, missing: true, applied: false };
  if (!inner.applied) return { html: source, missing: false, applied: false };
  const next = `${match[1]}${inner.html}${match[3]}`;
  return {
    html: `${source.slice(0, match.index)}${next}${source.slice(match.index + match[0].length)}`,
    missing: false,
    applied: true,
  };
}

/**
 * Prefer Supabase profile.lede over JSON first <p> when build-read returns a non-empty value.
 * Empty/error bundles leave config unchanged (Contents/JSON fallback).
 * When DB text already equals JSON first <p>, outcome is noop_equal (success, not fallback).
 *
 * @param {{ blocks?: Array<{ id?: string, enabled?: boolean, html?: string }> }} config
 * @param {{ pageFieldDataSource?: string, profileLede?: { valueText?: string } | null } | null | undefined} pageFieldsBundle
 */
export function applySitePageFieldsLedeToAboutConfig(config, pageFieldsBundle) {
  if (!pageFieldsBundle || pageFieldsBundle.pageFieldDataSource !== "supabase") {
    return {
      config,
      ledeOverlaid: false,
      reason: "page_fields_not_supabase",
      overlayOutcome: "failed",
    };
  }
  const lede = String(pageFieldsBundle.profileLede?.valueText ?? "").trim();
  if (!lede) {
    return {
      config,
      ledeOverlaid: false,
      reason: "empty_profile_lede",
      overlayOutcome: "failed",
    };
  }
  const blocks = Array.isArray(config.blocks) ? config.blocks.map((b) => ({ ...b })) : [];
  const idx = blocks.findIndex((b) => b?.id === BLOCK_PROFILE_ID);
  if (idx < 0) {
    return {
      config,
      ledeOverlaid: false,
      reason: "profile_block_missing",
      overlayOutcome: "failed",
    };
  }
  const prevHtml = String(blocks[idx].html ?? "");
  const existingLede = extractProfileLedeFromBody(prevHtml);
  const nextHtml = overlayProfileLedeInHtml(prevHtml, lede);
  if (nextHtml === prevHtml) {
    if (existingLede === lede) {
      return {
        config,
        ledeOverlaid: false,
        reason: null,
        overlayOutcome: "noop_equal",
      };
    }
    return {
      config,
      ledeOverlaid: false,
      reason: "overlay_noop",
      overlayOutcome: "failed",
    };
  }
  blocks[idx] = { ...blocks[idx], html: nextHtml };
  return {
    config: { ...config, blocks },
    ledeOverlaid: true,
    reason: null,
    overlayOutcome: "applied",
  };
}

/**
 * Overlay every allowlisted About field when build-read returned supabase rows.
 * A lede-only bundle keeps applySitePageFieldsLedeToAboutConfig.
 * Missing anchors or a non-supabase bundle leave the JSON config unchanged.
 * Image src is never rewritten. A missing field keeps the existing HTML value.
 *
 * @param {{ blocks?: Array<{ id?: string, enabled?: boolean, html?: string }> }} config
 * @param {{ pageFieldDataSource?: string, profileLede?: { valueText?: string } | null, aboutFields?: Record<string, string> | null } | null | undefined} pageFieldsBundle
 */
/**
 * Values already present in the public About HTML, keyed like site_page_fields.
 * Re-applying this map must leave the HTML unchanged.
 * @param {string} profileHtml
 * @param {string} bandsHtml
 */
export function readAboutPublicOverlayFields(profileHtml, bandsHtml) {
  /** @type {Record<string, string>} */
  const aboutFields = {};
  const heading = String(profileHtml ?? "").match(/<h[1-6]\b[^>]*>[\s\S]*?<\/h[1-6]>/i);
  if (heading) aboutFields["profile.heading"] = decodeAboutText(heading[0]);
  const body = paragraphTexts(profileHtml).join("\n\n");
  if (body) aboutFields["profile.body"] = body;
  const profileImg = String(profileHtml ?? "").match(/<img\b[^>]*>/i);
  if (profileImg) {
    aboutFields["profile.image_alt"] = decodeAboutText(
      profileImg[0].match(/\balt="([^"]*)"/i)?.[1] ?? "",
    );
  }
  const lede = extractProfileLedeFromBody(profileHtml);
  if (lede) aboutFields["profile.lede"] = lede;
  for (const article of String(bandsHtml ?? "").matchAll(
    /<article\b[^>]*\bid="(band-[^"]+)"[^>]*>([\s\S]*?)<\/article>/gi,
  )) {
    const stableId = article[1].replace(/^band-/, "");
    const inner = article[2];
    const name = inner.match(
      /<h3\b[^>]*\bclass="[^"]*\bband-profile__name\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/i,
    );
    if (name) aboutFields[`bands.${stableId}.name`] = decodeAboutText(name[1]);
    const desc = inner.match(
      /<div\b[^>]*\bclass="[^"]*\bband-profile__description\b[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
    if (desc) {
      const bandBody = paragraphTexts(desc[1]).join("\n\n");
      if (bandBody) aboutFields[`bands.${stableId}.body`] = bandBody;
    }
    const img = inner.match(/<img\b[^>]*>/i);
    if (img) {
      aboutFields[`bands.${stableId}.image_alt`] = decodeAboutText(
        img[0].match(/\balt="([^"]*)"/i)?.[1] ?? "",
      );
    }
  }
  return aboutFields;
}

export function applySitePageFieldsToAboutConfig(config, pageFieldsBundle) {
  const aboutFields =
    pageFieldsBundle &&
    pageFieldsBundle.aboutFields &&
    typeof pageFieldsBundle.aboutFields === "object"
      ? pageFieldsBundle.aboutFields
      : null;
  const keys = aboutFields ? Object.keys(aboutFields) : [];
  const onlyLede = keys.length === 0 || keys.every((key) => key === "profile.lede");
  if (onlyLede) return applySitePageFieldsLedeToAboutConfig(config, pageFieldsBundle);
  if (!pageFieldsBundle || pageFieldsBundle.pageFieldDataSource !== "supabase") {
    return {
      config,
      ledeOverlaid: false,
      reason: "page_fields_not_supabase",
      overlayOutcome: "failed",
    };
  }

  const blocks = Array.isArray(config.blocks) ? config.blocks.map((block) => ({ ...block })) : [];
  const profileIdx = blocks.findIndex((block) => block?.id === BLOCK_PROFILE_ID);
  const bandsIdx = blocks.findIndex((block) => block?.id === BLOCK_BANDS_ID);
  const profileKeys = keys.filter((key) => key.startsWith("profile."));
  const bandKeys = keys.filter((key) => key.startsWith("bands."));
  if ((profileKeys.length > 0 && profileIdx < 0) || (bandKeys.length > 0 && bandsIdx < 0)) {
    return { config, ledeOverlaid: false, reason: "about_block_missing", overlayOutcome: "failed" };
  }

  let profileHtml = String(blocks[profileIdx]?.html ?? "");
  let bandsHtml = String(blocks[bandsIdx]?.html ?? "");
  let applied = false;
  const beforeLede = extractProfileLedeFromBody(profileHtml);

  if (Object.prototype.hasOwnProperty.call(aboutFields, "profile.heading")) {
    const heading = overlayFirstHeadingText(profileHtml, String(aboutFields["profile.heading"] ?? ""));
    if (heading.missing) {
      return { config, ledeOverlaid: false, reason: "profile_heading_missing", overlayOutcome: "failed" };
    }
    profileHtml = heading.html;
    applied = applied || heading.applied;
  }
  if (Object.prototype.hasOwnProperty.call(aboutFields, "profile.body")) {
    const body = overlayParagraphTexts(profileHtml, String(aboutFields["profile.body"] ?? ""));
    if (body.missing) {
      return { config, ledeOverlaid: false, reason: "profile_body_missing", overlayOutcome: "failed" };
    }
    profileHtml = body.html;
    applied = applied || body.applied;
  }
  if (Object.prototype.hasOwnProperty.call(aboutFields, "profile.image_alt")) {
    const alt = overlayFirstImageAlt(profileHtml, String(aboutFields["profile.image_alt"] ?? ""));
    if (alt.missing) {
      return { config, ledeOverlaid: false, reason: "profile_image_missing", overlayOutcome: "failed" };
    }
    profileHtml = alt.html;
    applied = applied || alt.applied;
  }

  /** @type {Record<string, { name?: string, body?: string, imageAlt?: string }>} */
  const bands = {};
  for (const key of bandKeys) {
    const match = /^bands\.([a-z0-9]+(?:-[a-z0-9]+)*)\.(name|body|image_alt)$/.exec(key);
    if (!match) {
      return { config, ledeOverlaid: false, reason: "field_not_allowed", overlayOutcome: "failed" };
    }
    const stableId = match[1];
    bands[stableId] = bands[stableId] ?? {};
    if (match[2] === "name") bands[stableId].name = String(aboutFields[key] ?? "");
    if (match[2] === "body") bands[stableId].body = String(aboutFields[key] ?? "");
    if (match[2] === "image_alt") bands[stableId].imageAlt = String(aboutFields[key] ?? "");
  }
  for (const [stableId, patch] of Object.entries(bands)) {
    const re = new RegExp(
      `<article\\b[^>]*\\bid="band-${stableId}"[^>]*>[\\s\\S]*?</article>`,
      "i",
    );
    const article = bandsHtml.match(re);
    if (!article || article.index == null) {
      return { config, ledeOverlaid: false, reason: "band_article_missing", overlayOutcome: "failed" };
    }
    const next = overlayBandArticle(article[0], patch);
    if (next.missing) {
      return { config, ledeOverlaid: false, reason: "band_article_missing", overlayOutcome: "failed" };
    }
    if (next.applied) {
      bandsHtml = `${bandsHtml.slice(0, article.index)}${next.html}${bandsHtml.slice(article.index + article[0].length)}`;
      applied = true;
    }
  }

  const ledeText = String(
    aboutFields["profile.lede"] ?? pageFieldsBundle.profileLede?.valueText ?? "",
  ).trim();
  if (ledeText && extractProfileLedeFromBody(profileHtml) !== ledeText) {
    const nextProfile = overlayProfileLedeInHtml(profileHtml, ledeText);
    if (nextProfile === profileHtml) {
      return { config, ledeOverlaid: false, reason: "overlay_noop", overlayOutcome: "failed" };
    }
    profileHtml = nextProfile;
    applied = true;
  }

  if (profileIdx >= 0) blocks[profileIdx] = { ...blocks[profileIdx], html: profileHtml };
  if (bandsIdx >= 0) blocks[bandsIdx] = { ...blocks[bandsIdx], html: bandsHtml };
  const ledeOverlaid = extractProfileLedeFromBody(profileHtml) !== beforeLede;
  if (!applied) {
    return { config, ledeOverlaid: false, reason: null, overlayOutcome: "noop_equal" };
  }
  return {
    config: { ...config, blocks },
    ledeOverlaid,
    reason: null,
    overlayOutcome: "applied",
  };
}

/**
 * @param {string} outDir
 * @param {string} toolRoot
 * @param {{ aboutPagePath?: string, pageFieldsBundle?: object | null }} [options]
 */
export function applyGosakiAboutContent(outDir, toolRoot, options = {}) {
  const loaded = loadGosakiAboutContentConfig(toolRoot);
  if (!loaded.ok) {
    const evidence = buildAboutPublicBuildReadEvidence({
      pageFieldsBundle: options.pageFieldsBundle ?? null,
      ledeOverlaid: false,
      overlayReason: loaded.error,
    });
    writeAboutPublicBuildReadReport(outDir, evidence);
    return {
      applied: false,
      reason: loaded.error,
      profileApplied: false,
      bandsApplied: false,
      ledeOverlaid: false,
      profileLedeOverlayApplied: false,
      pageFieldDataSource: evidence.pageFieldDataSource,
      fieldCount: evidence.fieldCount,
      fallbackReason: evidence.fallbackReason ?? null,
      buildReadEvidence: evidence,
      buildReadReportPath: ABOUT_PUBLIC_BUILD_READ_REPORT_NAME,
    };
  }

  const aboutRel = options.aboutPagePath ?? "src/pages/about/index.astro";
  const aboutPath = path.join(outDir, aboutRel);
  if (!fs.existsSync(aboutPath)) {
    const evidence = buildAboutPublicBuildReadEvidence({
      pageFieldsBundle: options.pageFieldsBundle ?? null,
      ledeOverlaid: false,
      overlayReason: `About page not found: ${aboutRel}`,
    });
    writeAboutPublicBuildReadReport(outDir, evidence);
    return {
      applied: false,
      reason: `About page not found: ${aboutRel}`,
      profileApplied: false,
      bandsApplied: false,
      ledeOverlaid: false,
      profileLedeOverlayApplied: false,
      pageFieldDataSource: evidence.pageFieldDataSource,
      fieldCount: evidence.fieldCount,
      fallbackReason: evidence.fallbackReason ?? null,
      buildReadEvidence: evidence,
      buildReadReportPath: ABOUT_PUBLIC_BUILD_READ_REPORT_NAME,
    };
  }

  const overlay = applySitePageFieldsToAboutConfig(loaded.config, options.pageFieldsBundle);
  const effectiveConfig = overlay.config;
  const evidence = buildAboutPublicBuildReadEvidence({
    pageFieldsBundle: options.pageFieldsBundle ?? null,
    ledeOverlaid: overlay.ledeOverlaid === true,
    overlayOutcome: overlay.overlayOutcome,
    overlayReason: overlay.reason,
  });
  writeAboutPublicBuildReadReport(outDir, evidence);

  const dataDest = path.join(outDir, GOSAKI_ABOUT_CONTENT_DATA_REL);
  fs.mkdirSync(path.dirname(dataDest), { recursive: true });
  fs.writeFileSync(dataDest, `${JSON.stringify(effectiveConfig, null, 2)}\n`, "utf8");

  const aboutContent = fs.readFileSync(aboutPath, "utf8");
  const result = applyAboutContentToPage(aboutContent, effectiveConfig);
  fs.writeFileSync(aboutPath, result.content, "utf8");

  return {
    applied: result.profileApplied || result.bandsApplied,
    reason: null,
    profileApplied: result.profileApplied,
    bandsApplied: result.bandsApplied,
    bandsImportRemoved: result.bandsImportRemoved,
    ledeOverlaid: overlay.ledeOverlaid === true,
    profileLedeOverlayApplied: evidence.profileLedeOverlayApplied === true,
    overlayOutcome: evidence.overlayOutcome,
    ledeOverlayReason: overlay.reason,
    pageFieldDataSource: evidence.pageFieldDataSource,
    fieldCount: evidence.fieldCount,
    fallbackReason: evidence.fallbackReason ?? null,
    buildReadEvidence: evidence,
    buildReadReportPath: ABOUT_PUBLIC_BUILD_READ_REPORT_NAME,
    aboutPagePath: aboutRel,
    dataPath: GOSAKI_ABOUT_CONTENT_DATA_REL,
    configPath: GOSAKI_ABOUT_CONTENT_CONFIG_REL,
  };
}
