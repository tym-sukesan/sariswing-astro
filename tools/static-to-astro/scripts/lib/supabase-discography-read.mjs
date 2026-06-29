/**
 * G-15c — read-only Gosaki discography fetch for Astro convert/build (anon key only).
 * No DB writes. Mirrors supabase-schedule-read.mjs shape for public reflection.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSupabaseAnonReadEnv } from "./supabase-schedule-read.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TOOL_ROOT = path.resolve(__dirname, "../..");

export const DISCOGRAPHY_SELECT =
  "legacy_id,title,artist,purchase_url,streaming_url,sort_order,published";

const REPEATER_ITEM_START_RE =
  /<div id="comp-llexymga__item-[^"]+" class="[^"]*wixui-repeater__item"/g;

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
    purchase_url: row.purchase_url ? normalizeDiscographyUrl(row.purchase_url) : null,
    streaming_url: row.streaming_url ? String(row.streaming_url).trim() : null,
    sort_order: Number(row.sort_order ?? 0),
    published: row.published !== false,
  };
}

/**
 * @param {{
 *   env: { supabaseUrl: string, anonKey: string },
 * }} opts
 */
export async function loadDiscographyRowsFromSupabase({ env }) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(env.supabaseUrl, env.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("discography")
    .select(DISCOGRAPHY_SELECT)
    .eq("published", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeDiscographyRecord(row));
}

/**
 * Find Wix repeater item bounds containing titleNeedle.
 * @param {string} html
 * @param {string} titleNeedle
 */
export function findDiscographyRepeaterItemBounds(html, titleNeedle) {
  const titleIdx = html.indexOf(titleNeedle);
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

  const re = new RegExp(`(「${escapeRegExp(title)}」/)([^<]+)`, "g");
  const replaced = segment.replace(re, `$1${normalizedArtist}`);
  return { segment: replaced, patched: replaced !== segment };
}

/**
 * Apply Supabase purchase_url + artist values to Wix discography hub HTML.
 * @param {string} html
 * @param {ReturnType<typeof normalizeDiscographyRecord>[]} releases
 */
export function patchGosakiDiscographySupabaseFields(html, releases) {
  let out = html;
  /** @type {Array<{ legacy_id: string, title: string, purchase_url: string }>} */
  const purchasePatches = [];
  /** @type {Array<{ legacy_id: string, title: string, artist: string }>} */
  const artistPatches = [];

  for (const row of releases) {
    if (!row.title) continue;
    const bounds = findDiscographyRepeaterItemBounds(out, row.title);
    if (!bounds) continue;

    const before = out.slice(0, bounds.start);
    let segment = out.slice(bounds.start, bounds.end);
    let segmentChanged = false;

    if (row.purchase_url) {
      const purchaseResult = patchDiscographyItemPurchaseUrl(segment, row.purchase_url);
      if (purchaseResult.patched) {
        purchasePatches.push({
          legacy_id: row.legacy_id,
          title: row.title,
          purchase_url: row.purchase_url,
        });
        segment = purchaseResult.segment;
        segmentChanged = true;
      }
    }

    if (row.artist) {
      const artistResult = patchDiscographyItemArtist(segment, row.title, row.artist);
      if (artistResult.patched) {
        artistPatches.push({
          legacy_id: row.legacy_id,
          title: row.title,
          artist: row.artist,
        });
        segment = artistResult.segment;
        segmentChanged = true;
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
    patches: [...purchasePatches, ...artistPatches],
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
 * @param {{ env?: NodeJS.ProcessEnv, toolRoot?: string, logPrefix?: string }} [opts]
 */
export async function loadGosakiDiscographyDataForBuild(opts = {}) {
  const {
    env = process.env,
    toolRoot = DEFAULT_TOOL_ROOT,
    logPrefix = "gosaki-discography",
  } = opts;
  const readEnv = resolveSupabaseAnonReadEnv(env, toolRoot);

  if (readEnv) {
    try {
      const releases = await loadDiscographyRowsFromSupabase({ env: readEnv });
      if (releases.length > 0) {
        return {
          discographyDataSource: "supabase",
          fallbackReason: null,
          releases,
          rowCount: releases.length,
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
    rowCount: 0,
  };
}
