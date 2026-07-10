/**
 * G-15c — read-only Gosaki discography fetch for Astro convert/build (anon key only).
 * No DB writes. Mirrors supabase-schedule-read.mjs shape for public reflection.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOSAKI_SITE_KEY } from "./site-registry.mjs";
import { resolveSupabaseAnonReadEnv } from "./supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

/** Gosaki pilot — single-tenant discography read until site_slug column exists (G-20u22). */
export const GOSAKI_DISCOGRAPHY_SITE_CONFIG = {
  siteSlug: GOSAKI_SITE_KEY,
};

/**
 * When true, discography / discography_tracks queries may filter by site_slug.
 * Migration is a separate high-risk phase — do not enable without explicit approval.
 */
export const DISCOGRAPHY_SITE_SLUG_COLUMN_READY = false;

export const DISCOGRAPHY_SELECT =
  "legacy_id,title,artist,label,catalog_number,purchase_url,streaming_url,sort_order,published";

export const DISCOGRAPHY_TRACKS_SELECT =
  "id,discography_legacy_id,track_number,title,sort_order";

const REPEATER_ITEM_START_RE =
  /<div id="comp-llexymga__item[^"]+" class="[^"]*wixui-repeater__item"/g;

/**
 * @param {string | null | undefined} url
 */
export function normalizeDiscographyUrl(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/**
 * @param {Record<string, unknown>} row
 */
export function normalizeDiscographyRecord(row) {
  return {
    legacy_id: String(row.legacy_id ?? ""),
    title: String(row.title ?? ""),
    artist: row.artist != null ? String(row.artist).trim() : null,
    label: row.label != null ? String(row.label).trim() : null,
    catalog_number: row.catalog_number != null ? String(row.catalog_number).trim() : null,
    purchase_url: row.purchase_url ? normalizeDiscographyUrl(row.purchase_url) : null,
    streaming_url: row.streaming_url ? String(row.streaming_url).trim() : null,
    sort_order: Number(row.sort_order ?? 0),
    published: row.published !== false,
  };
}

/**
 * @param {Record<string, unknown>} row
 */
export function normalizeDiscographyTrackRecord(row) {
  return {
    id: String(row.id ?? ""),
    discography_legacy_id: String(row.discography_legacy_id ?? ""),
    track_number: Number(row.track_number ?? 0),
    title: String(row.title ?? "").trim(),
    sort_order: Number(row.sort_order ?? 0),
  };
}

/**
 * @param {ReturnType<typeof normalizeDiscographyTrackRecord>[]} rows
 */
export function groupDiscographyTracksByLegacyId(rows) {
  /** @type {Record<string, ReturnType<typeof normalizeDiscographyTrackRecord>[]>} */
  const map = {};
  for (const row of rows) {
    if (!row.discography_legacy_id) continue;
    (map[row.discography_legacy_id] ??= []).push(row);
  }
  for (const legacyId of Object.keys(map)) {
    map[legacyId].sort(
      (a, b) => a.sort_order - b.sort_order || a.track_number - b.track_number,
    );
  }
  return map;
}

/**
 * @param {{
 *   env: { supabaseUrl: string, anonKey: string },
 *   siteSlug?: string | null,
 *   requireSiteSlugFilter?: boolean,
 * }} opts
 */
export async function loadDiscographyTracksFromSupabase({ env, siteSlug = null, requireSiteSlugFilter = false }) {
  if (requireSiteSlugFilter && !DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
    throw new Error("discography_tracks site_slug filter requested but column migration pending (G-20u22)");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase
    .from("discography_tracks")
    .select(DISCOGRAPHY_TRACKS_SELECT)
    .order("discography_legacy_id", { ascending: true })
    .order("sort_order", { ascending: true });

  if (requireSiteSlugFilter && siteSlug) {
    query = query.eq("site_slug", siteSlug);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeDiscographyTrackRecord(row));
}

/**
 * @param {{
 *   env: { supabaseUrl: string, anonKey: string },
 *   siteSlug?: string | null,
 *   requireSiteSlugFilter?: boolean,
 * }} opts
 */
export async function loadDiscographyRowsFromSupabase({ env, siteSlug = null, requireSiteSlugFilter = false }) {
  if (requireSiteSlugFilter && !DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
    throw new Error("discography site_slug filter requested but column migration pending (G-20u22)");
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let query = supabase
    .from("discography")
    .select(DISCOGRAPHY_SELECT)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (requireSiteSlugFilter && siteSlug) {
    query = query.eq("site_slug", siteSlug);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeDiscographyRecord(row));
}

/**
 * Find Wix repeater item bounds containing titleNeedle.
 * Prefer album h2 `「title」` over bare title (avoids track-name collision on "Continuous").
 * @param {string} html
 * @param {string} titleNeedle
 */
export function findDiscographyRepeaterItemBounds(html, titleNeedle) {
  const needles = [`\u200b「${titleNeedle}」`, `「${titleNeedle}」`, titleNeedle];
  let titleIdx = -1;
  for (const needle of needles) {
    const idx = html.indexOf(needle);
    if (idx >= 0) {
      titleIdx = idx;
      break;
    }
  }
  if (titleIdx < 0) return null;

  /** @type {number[]} */
  const starts = [];
  REPEATER_ITEM_START_RE.lastIndex = 0;
  let match;
  while ((match = REPEATER_ITEM_START_RE.exec(html)) !== null) {
    starts.push(match.index);
  }
  if (!starts.length) return null;

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = starts[i + 1] ?? html.length;
    if (titleIdx >= start && titleIdx < end) {
      return { start, end };
    }
  }
  return null;
}

const BASE_SHOP_LINK_RE =
  /<a href="(https:\/\/[^"]*\.base\.shop\/?)"([^>]*)>\s*https:\/\/[^<]*\.base\.shop\/?\s*<\/a>/gi;

/**
 * Patch purchase_url links inside a single repeater item segment.
 * @param {string} segment
 * @param {string} purchaseUrl
 */
export function patchDiscographyItemPurchaseUrl(segment, purchaseUrl) {
  const normalized = normalizeDiscographyUrl(purchaseUrl);
  if (!normalized) return { segment, patched: false };
  const replaced = segment.replace(
    BASE_SHOP_LINK_RE,
    `<a href="${normalized}"$2>${normalized}</a>`,
  );
  return { segment: replaced, patched: replaced !== segment };
}

/**
 * @param {string} value
 */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Patch artist in Wix h2 subtitle pattern `「title」/artist` inside one repeater item.
 * @param {string} segment
 * @param {string} title
 * @param {string} artist
 */
export function patchDiscographyItemArtist(segment, title, artist) {
  const normalizedArtist = String(artist ?? "").trim();
  if (!normalizedArtist || !title) return { segment, patched: false };

  const re = new RegExp(`(\\u200b?「${escapeRegExp(title)}」/)([^<]+)`, "g");
  const replaced = segment.replace(re, `$1${normalizedArtist}`);
  return { segment: replaced, patched: replaced !== segment };
}

const RELEASE_BLOCK_RE = /<p[^>]*>[\s\S]*?Release[\s\S]*?<\/p>/i;
const LABEL_PARAGRAPH_TEMPLATE =
  '<p class="font_8 wixui-rich-text__text" style="font-size:13px; line-height:1.5em;"><span style="font-family: &quot;Helvetica Neue&quot;, Arial, &quot;Hiragino Kaku Gothic ProN&quot;, &quot;Hiragino Sans&quot;, Meiryo, sans-serif;" class="wixui-rich-text__text"><span class="color_17 wixui-rich-text__text"><span style="letter-spacing:normal;" class="wixui-rich-text__text"><span style="font-size:13px;" class="wixui-rich-text__text">';

/**
 * Patch label in Wix Release block — paragraph between Release line and catalog line.
 * @param {string} segment
 * @param {string} label
 * @param {string | null | undefined} catalogNumber
 */
export function patchDiscographyItemLabel(segment, label, catalogNumber) {
  const normalizedLabel = String(label ?? "").trim();
  if (!normalizedLabel) return { segment, patched: false };

  const releaseMatch = segment.match(RELEASE_BLOCK_RE);
  if (!releaseMatch || releaseMatch.index == null) return { segment, patched: false };

  const afterReleaseIdx = releaseMatch.index + releaseMatch[0].length;
  const afterRelease = segment.slice(afterReleaseIdx);
  if (!catalogNumber) return { segment, patched: false };

  const catEsc = escapeRegExp(String(catalogNumber).trim());
  const catParaRe = new RegExp(`<p\\b[^>]*>[\\s\\S]*?${catEsc}[\\s\\S]*?<\\/p>`, "i");
  const catMatch = afterRelease.match(catParaRe);
  if (!catMatch || catMatch.index == null) return { segment, patched: false };

  const between = afterRelease.slice(0, catMatch.index);
  const labelParaRe = /<p\b[^>]*>[\s\S]*?<\/p>/i;
  const labelMatch = between.match(labelParaRe);

  if (labelMatch) {
    const oldLabelP = labelMatch[0];
    const plain = oldLabelP
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (/^[A-Z]{2,10}-\d{3,6}/.test(plain)) {
      const insert = `${LABEL_PARAGRAPH_TEMPLATE}${normalizedLabel}</span></span></span></span></p> `;
      const replaced =
        segment.slice(0, afterReleaseIdx) + insert + afterRelease;
      return { segment: replaced, patched: true };
    }
    if (plain === normalizedLabel) return { segment, patched: false };

    let newLabelP = oldLabelP.replace(
      /(<span style="font-size:13px;" class="wixui-rich-text__text">)([^<]*)(<\/span>)/,
      `$1${normalizedLabel}$3`,
    );
    if (newLabelP === oldLabelP) {
      newLabelP = oldLabelP.replace(/>([^<]+)</, `>${normalizedLabel}<`);
    }
    if (newLabelP === oldLabelP) return { segment, patched: false };

    const replaced =
      segment.slice(0, afterReleaseIdx) +
      between.replace(oldLabelP, newLabelP) +
      afterRelease.slice(catMatch.index);
    return { segment: replaced, patched: true };
  }

  const insert = `${LABEL_PARAGRAPH_TEMPLATE}${normalizedLabel}</span></span></span></span></p> `;
  const replaced = segment.slice(0, afterReleaseIdx) + insert + afterRelease;
  return { segment: replaced, patched: true };
}

const TRACK_LIST_HEADING_RE = /Track List/i;
const TRACK_BLOCK_END_RE = /Personnel|Release/;
const TRACK_PARAGRAPH_RE = /<p class="font_8[^"]*"[^>]*>[\s\S]*?<\/p>/g;

/**
 * @param {string} text
 */
function decodeHtmlEntities(text) {
  return String(text)
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\u200b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} text
 */
function encodeHtmlText(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} pHtml
 */
function extractTrackParagraphPlainText(pHtml) {
  return decodeHtmlEntities(pHtml.replace(/<[^>]+>/g, ""));
}

/**
 * @param {string} pHtml
 * @param {string} oldPlain
 * @param {string} newPlain
 */
function replaceTrackParagraphTitle(pHtml, oldPlain, newPlain) {
  if (!oldPlain || oldPlain === newPlain) return pHtml;

  const oldVariants = [oldPlain, oldPlain.replace(/'/g, "&#39;")];
  const encodedNew = encodeHtmlText(newPlain).replace(/'/g, "&#39;");

  for (const oldVariant of oldVariants) {
    const re = new RegExp(`>${escapeRegExp(oldVariant)}<`);
    if (re.test(pHtml)) {
      return pHtml.replace(re, `>${encodedNew}<`);
    }
  }

  return pHtml.replace(/>([^<]+)</g, (match, inner) => {
    if (decodeHtmlEntities(inner) === oldPlain) {
      return `>${encodedNew}<`;
    }
    return match;
  });
}

/**
 * Patch Track List titles inside one Wix repeater item from Supabase tracks.
 * @param {string} segment
 * @param {ReturnType<typeof normalizeDiscographyTrackRecord>[]} tracks
 */
export function patchDiscographyItemTracks(segment, tracks) {
  if (!tracks?.length) return { segment, patched: false, changedTitles: [] };

  const tlIdx = segment.search(TRACK_LIST_HEADING_RE);
  if (tlIdx < 0) return { segment, patched: false, changedTitles: [] };

  const afterTl = segment.slice(tlIdx);
  const headingOffset = afterTl.search(TRACK_LIST_HEADING_RE);
  const afterHeading = afterTl.slice(headingOffset);
  const endRel = afterHeading.search(TRACK_BLOCK_END_RE);
  if (endRel < 0) return { segment, patched: false, changedTitles: [] };

  const blockEnd = tlIdx + headingOffset + endRel;
  const trackBlock = segment.slice(tlIdx, blockEnd);

  /** @type {Array<{ full: string, plain: string }>} */
  const paragraphs = [];
  TRACK_PARAGRAPH_RE.lastIndex = 0;
  let match;
  while ((match = TRACK_PARAGRAPH_RE.exec(trackBlock)) !== null) {
    const plain = extractTrackParagraphPlainText(match[0]);
    if (!plain || TRACK_LIST_HEADING_RE.test(plain)) continue;
    paragraphs.push({ full: match[0], plain });
  }

  if (paragraphs.length !== tracks.length) {
    return { segment, patched: false, changedTitles: [] };
  }

  let newTrackBlock = trackBlock;
  /** @type {string[]} */
  const changedTitles = [];
  let patched = false;

  for (let i = 0; i < paragraphs.length; i++) {
    const { full, plain } = paragraphs[i];
    const nextTitle = String(tracks[i]?.title ?? "").trim();
    if (!nextTitle || plain === nextTitle) continue;

    const newParagraph = replaceTrackParagraphTitle(full, plain, nextTitle);
    if (newParagraph === full) continue;

    newTrackBlock = newTrackBlock.replace(full, newParagraph);
    changedTitles.push(nextTitle);
    patched = true;
  }

  if (!patched) return { segment, patched: false, changedTitles: [] };

  return {
    segment: segment.slice(0, tlIdx) + newTrackBlock + segment.slice(blockEnd),
    patched: true,
    changedTitles,
  };
}

/**
 * Registry of public HTML patch handlers per Supabase scalar field.
 * G-17b: purchase_url + artist; G-17e: label.
 */
export const DISCOGRAPHY_PUBLIC_PATCH_FIELD_ORDER = ["purchase_url", "artist", "label"];

/** @type {Record<string, { field: string, patchSegment: (segment: string, row: ReturnType<typeof normalizeDiscographyRecord>) => { segment: string, patched: boolean } }>} */
export const DISCOGRAPHY_PUBLIC_PATCH_REGISTRY = {
  purchase_url: {
    field: "purchase_url",
    patchSegment(segment, row) {
      if (!row.purchase_url) return { segment, patched: false };
      return patchDiscographyItemPurchaseUrl(segment, row.purchase_url);
    },
  },
  artist: {
    field: "artist",
    patchSegment(segment, row) {
      if (!row.artist) return { segment, patched: false };
      return patchDiscographyItemArtist(segment, row.title, row.artist);
    },
  },
  label: {
    field: "label",
    patchSegment(segment, row) {
      if (!row.label) return { segment, patched: false };
      return patchDiscographyItemLabel(segment, row.label, row.catalog_number);
    },
  },
};

/**
 * Apply Supabase scalar field values and track lists to Wix discography hub HTML.
 * @param {string} html
 * @param {ReturnType<typeof normalizeDiscographyRecord>[]} releases
 * @param {Record<string, ReturnType<typeof normalizeDiscographyTrackRecord>[]> | null | undefined} [tracksByLegacyId]
 */
export function patchGosakiDiscographySupabaseFields(html, releases, tracksByLegacyId = null) {
  let out = html;
  /** @type {Array<{ legacy_id: string, title: string, purchase_url: string }>} */
  const purchasePatches = [];
  /** @type {Array<{ legacy_id: string, title: string, artist: string }>} */
  const artistPatches = [];
  /** @type {Array<{ legacy_id: string, title: string, label: string }>} */
  const labelPatches = [];
  /** @type {Array<{ legacy_id: string, title: string, trackCount: number, changedTitles: string[] }>} */
  const trackPatches = [];

  for (const row of releases) {
    if (!row.title) continue;
    const bounds = findDiscographyRepeaterItemBounds(out, row.title);
    if (!bounds) continue;

    const before = out.slice(0, bounds.start);
    let segment = out.slice(bounds.start, bounds.end);
    let segmentChanged = false;

    for (const fieldKey of DISCOGRAPHY_PUBLIC_PATCH_FIELD_ORDER) {
      const handler = DISCOGRAPHY_PUBLIC_PATCH_REGISTRY[fieldKey];
      if (!handler) continue;
      const result = handler.patchSegment(segment, row);
      if (!result.patched) continue;

      if (fieldKey === "purchase_url" && row.purchase_url) {
        purchasePatches.push({
          legacy_id: row.legacy_id,
          title: row.title,
          purchase_url: row.purchase_url,
        });
      }
      if (fieldKey === "artist" && row.artist) {
        artistPatches.push({
          legacy_id: row.legacy_id,
          title: row.title,
          artist: row.artist,
        });
      }
      if (fieldKey === "label" && row.label) {
        labelPatches.push({
          legacy_id: row.legacy_id,
          title: row.title,
          label: row.label,
        });
      }

      segment = result.segment;
      segmentChanged = true;
    }

    const albumTracks = tracksByLegacyId?.[row.legacy_id];
    if (albumTracks?.length) {
      const trackResult = patchDiscographyItemTracks(segment, albumTracks);
      if (trackResult.patched) {
        segment = trackResult.segment;
        segmentChanged = true;
        trackPatches.push({
          legacy_id: row.legacy_id,
          title: row.title,
          trackCount: albumTracks.length,
          changedTitles: trackResult.changedTitles ?? [],
        });
      }
    }

    if (segmentChanged) {
      out = before + segment + out.slice(bounds.end);
    }
  }

  return {
    html: out,
    purchasePatches,
    artistPatches,
    labelPatches,
    trackPatches,
    patches: [...purchasePatches, ...artistPatches, ...labelPatches, ...trackPatches],
  };
}

/**
 * @deprecated Use patchGosakiDiscographySupabaseFields — purchase_url only wrapper.
 */
export function patchGosakiDiscographyPurchaseUrls(html, releases) {
  const result = patchGosakiDiscographySupabaseFields(html, releases);
  return { html: result.html, patches: result.purchasePatches };
}

/**
 * @param {string} html
 * @param {'supabase' | 'wix-html'} source
 */
export function injectDiscographyDataSourceMarker(html, source) {
  const marker = `<!-- CMS_TARGET: DISCOGRAPHY_INDEX discographyDataSource=${source} -->`;
  if (html.includes("discographyDataSource=")) return html;
  const anchor = '<div id="comp-llexymel"';
  const idx = html.indexOf(anchor);
  if (idx >= 0) return `${html.slice(0, idx)}${marker}${html.slice(idx)}`;
  const mainIdx = html.indexOf("<main");
  if (mainIdx < 0) return `${marker}${html}`;
  const mainClose = html.indexOf(">", mainIdx);
  if (mainClose < 0) return `${marker}${html}`;
  return `${html.slice(0, mainClose + 1)} ${marker}${html.slice(mainClose + 1)}`;
}

/**
 * Generic discography read for convert/build (anon key only).
 *
 * @param {{
 *   siteSlug?: string,
 *   env?: NodeJS.ProcessEnv,
 *   toolRoot?: string,
 *   logPrefix?: string,
 *   legacyUnfilteredRead?: boolean,
 *   requireSiteSlugFilter?: boolean,
 * }} [opts]
 */
export async function loadDiscographyDataForBuild(opts = {}) {
  const {
    siteSlug = GOSAKI_DISCOGRAPHY_SITE_CONFIG.siteSlug,
    env = process.env,
    toolRoot = DEFAULT_TOOL_ROOT,
    logPrefix = "discography",
    legacyUnfilteredRead = false,
    requireSiteSlugFilter = false,
  } = opts;

  if (requireSiteSlugFilter && !legacyUnfilteredRead && !DISCOGRAPHY_SITE_SLUG_COLUMN_READY) {
    return {
      discographyDataSource: "wix-html",
      fallbackReason: "discography_site_slug_column_pending",
      releases: [],
      tracks: [],
      tracksByLegacyId: {},
      rowCount: 0,
      trackRowCount: 0,
      siteSlug,
    };
  }

  const readEnv = resolveSupabaseAnonReadEnv(env, toolRoot);
  const useSiteSlugFilter = requireSiteSlugFilter && DISCOGRAPHY_SITE_SLUG_COLUMN_READY;

  if (readEnv) {
    try {
      const releases = await loadDiscographyRowsFromSupabase({
        env: readEnv,
        siteSlug,
        requireSiteSlugFilter: useSiteSlugFilter,
      });
      if (releases.length > 0) {
        const tracks = await loadDiscographyTracksFromSupabase({
          env: readEnv,
          siteSlug,
          requireSiteSlugFilter: useSiteSlugFilter,
        });
        const tracksByLegacyId = groupDiscographyTracksByLegacyId(tracks);
        return {
          discographyDataSource: "supabase",
          fallbackReason: null,
          releases,
          tracks,
          tracksByLegacyId,
          rowCount: releases.length,
          trackRowCount: tracks.length,
          siteSlug,
        };
      }
      console.warn(`[${logPrefix}] Supabase returned 0 discography rows; using wix-html`);
    } catch (err) {
      console.warn(`[${logPrefix}] Supabase read failed (${err.message}); using wix-html`);
    }
  } else {
    console.log(`[${logPrefix}] discographyDataSource=wix-html (Supabase env not configured)`);
  }

  return {
    discographyDataSource: "wix-html",
    fallbackReason: readEnv ? "supabase_empty_or_error" : "supabase_env_missing",
    releases: [],
    tracks: [],
    tracksByLegacyId: {},
    rowCount: 0,
    trackRowCount: 0,
    siteSlug,
  };
}

/**
 * @param {{ env?: NodeJS.ProcessEnv, toolRoot?: string, logPrefix?: string }} [opts]
 */
export async function loadGosakiDiscographyDataForBuild(opts = {}) {
  const {
    env = process.env,
    toolRoot = DEFAULT_TOOL_ROOT,
    logPrefix = "gosaki-discography",
  } = opts;

  return loadDiscographyDataForBuild({
    siteSlug: GOSAKI_DISCOGRAPHY_SITE_CONFIG.siteSlug,
    env,
    toolRoot,
    logPrefix,
    legacyUnfilteredRead: true,
    requireSiteSlugFilter: false,
  });
}
