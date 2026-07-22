/**
 * CMS Core v2 — YouTube Supabase vertical slice contract (pure helpers).
 * No network / DB / secrets. Shared by verifier + build mapper + docs.
 */

export const CMS_CORE_V2_YOUTUBE_PHASE =
  "cms-core-v2-youtube-supabase-vertical-slice-local-implementation";

export const GOSAKI_YOUTUBE_SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";

export const YOUTUBE_SUPABASE_ENDPOINT_NAME = "gosaki-youtube-supabase-save-dry-run";
export const YOUTUBE_SUPABASE_PROVIDER = "youtube";

export const YOUTUBE_SUPABASE_DRY_RUN_OPERATION = "dryRun";
export const YOUTUBE_SUPABASE_SAVE_OPERATION = "save";

export const YOUTUBE_SUPABASE_DRY_RUN_APPROVAL_ID =
  "G-cms-v2-youtube-supabase-items-dry-run";
export const YOUTUBE_SUPABASE_SAVE_APPROVAL_ID =
  "G-cms-v2-youtube-supabase-items-web-save-non-dry-run-slice";

/** Client: opt into Supabase path (live-read + dry-run). Contents path remains default when unset. */
export const YOUTUBE_SUPABASE_PATH_ENABLED_ENV =
  "PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_PATH_ENABLED";
/** Client Save arm (exact "true"). Independent from Contents G-11c6/G-11c7 arm. */
export const YOUTUBE_SUPABASE_SAVE_UI_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED";
/** Server Save arm (Edge Deno env). */
export const YOUTUBE_SUPABASE_SAVE_ARMED_ENV = "GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED";
/** Build-time prefer DB read even when registry.siteEmbeds=false. */
export const YOUTUBE_SITE_EMBEDS_BUILD_READ_ENV = "CMS_KIT_SITE_EMBEDS_BUILD_READ";

export const SITE_EMBEDS_SELECT =
  "id,site_id,site_slug,provider,legacy_item_id,title,source_url,embed_url,published,sort_order,created_at,updated_at,created_by,updated_by";

/**
 * @param {string} input
 * @returns {string | null}
 */
export function parseYoutubeVideoId(input) {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const embedSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  if (embedSrc) {
    const fromEmbed = parseYoutubeVideoId(embedSrc);
    if (fromEmbed) return fromEmbed;
  }
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get("v");
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * @param {string} videoId
 */
export function buildYoutubeNocookieEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/**
 * @param {Record<string, unknown>} row
 */
export function mapSiteEmbedRowToDraftItem(row) {
  return {
    id: String(row.legacy_item_id ?? row.id ?? "").trim(),
    published: row.published === true,
    sortOrder: Number(row.sort_order ?? row.sortOrder ?? 0) || 0,
    embedCode: String(row.source_url ?? row.embed_url ?? "").trim(),
    title: row.title != null ? String(row.title) : undefined,
    rowId: row.id != null ? String(row.id) : null,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
  };
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {{ siteSlug?: string, sectionTitle?: string }} [meta]
 */
export function mapSiteEmbedRowsToYoutubeConfig(rows, meta = {}) {
  const items = (rows ?? [])
    .filter((r) => String(r.provider ?? YOUTUBE_SUPABASE_PROVIDER) === YOUTUBE_SUPABASE_PROVIDER)
    .map(mapSiteEmbedRowToDraftItem)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  return {
    siteSlug: meta.siteSlug ?? GOSAKI_YOUTUBE_SITE_SLUG,
    sectionTitle: meta.sectionTitle ?? "YouTube",
    items: items.map((item) => ({
      id: item.id,
      published: item.published,
      sortOrder: item.sortOrder,
      embedCode: item.embedCode,
      ...(item.title ? { title: item.title } : {}),
    })),
  };
}

/**
 * @param {Array<{ id: string, published: boolean, sortOrder: number, embedCode: string }>} items
 */
export function buildExpectedBeforeUpdatedAtById(itemsWithUpdatedAt) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const item of itemsWithUpdatedAt ?? []) {
    const id = String(item.id ?? "").trim();
    const updatedAt = String(item.updatedAt ?? item.updated_at ?? "").trim();
    if (id && updatedAt) out[id] = updatedAt;
  }
  return out;
}

/**
 * @param {Array<{ id: string, published: boolean, sortOrder: number, embedCode: string, updatedAt?: string|null }>} items
 */
export function buildYoutubeSupabaseFingerprint(items) {
  return JSON.stringify(
    (items ?? []).map((i) => ({
      id: i.id,
      published: i.published === true,
      sortOrder: Number(i.sortOrder) || 0,
      embedCode: String(i.embedCode ?? ""),
      updatedAt: i.updatedAt ?? null,
    })),
  );
}

/**
 * Pure dry-run plan (no write). Validates + diffs.
 * @param {{
 *   before: Array<{ id: string, published: boolean, sortOrder: number, embedCode: string, updatedAt?: string|null }>,
 *   after: Array<{ id: string, published: boolean, sortOrder: number, embedCode: string }>,
 * }} input
 */
export function planYoutubeSupabaseItemsDryRun(input) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  const after = input.after ?? [];
  const before = input.before ?? [];

  for (const item of after) {
    const id = String(item.id ?? "").trim();
    if (!id) {
      errors.push("each item requires id (legacy_item_id)");
      continue;
    }
    if (ids.has(id)) errors.push(`duplicate id: ${id}`);
    ids.add(id);
    const videoId = parseYoutubeVideoId(item.embedCode);
    if (!videoId) errors.push(`${id}: invalid YouTube URL / embed / videoId`);
  }

  const beforeMap = new Map(before.map((i) => [i.id, i]));
  const changedItemIds = [];
  for (const item of after) {
    const prev = beforeMap.get(item.id);
    if (
      !prev ||
      prev.embedCode !== item.embedCode ||
      prev.published !== item.published ||
      Number(prev.sortOrder) !== Number(item.sortOrder)
    ) {
      changedItemIds.push(item.id);
    }
  }
  for (const prev of before) {
    if (!after.some((i) => i.id === prev.id)) {
      changedItemIds.push(prev.id);
      warnings.push(`delete not supported — set published=false for ${prev.id}`);
    }
  }

  const normalizedAfter = after.map((item) => {
    const videoId = parseYoutubeVideoId(item.embedCode);
    return {
      id: String(item.id).trim(),
      published: item.published === true,
      sortOrder: Number(item.sortOrder) || 0,
      embedCode: String(item.embedCode ?? "").trim(),
      sourceUrl: String(item.embedCode ?? "").trim(),
      embedUrl: videoId ? buildYoutubeNocookieEmbedUrl(videoId) : "",
      videoId,
    };
  });

  const expectedBeforeUpdatedAtById = buildExpectedBeforeUpdatedAtById(before);
  const fingerprint = buildYoutubeSupabaseFingerprint(before);
  const noChange = changedItemIds.length === 0;

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    changedItemIds,
    noChange,
    beforeItems: before,
    afterItems: normalizedAfter,
    currentItems: before.map((b) => ({
      id: b.id,
      published: b.published === true,
      sortOrder: Number(b.sortOrder) || 0,
      embedCode: String(b.embedCode ?? ""),
    })),
    expectedBeforeUpdatedAtById,
    fingerprint,
    didWrite: false,
    dbWrite: false,
    networkWrite: false,
    writeBackend: "supabase",
  };
}

/**
 * @param {string | undefined | null} value
 */
export function isExactTrue(value) {
  return String(value ?? "").trim() === "true";
}
