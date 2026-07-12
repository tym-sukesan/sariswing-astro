/**
 * G-20u36d — Gosaki Discography Edge dry-run readBack (tools draft · SELECT-only).
 * Pure Node module for verifier mock tests · no live network · no service_role · no DB write.
 */

import { SKYLARK_TRACKS_CURRENT } from "./discography-g19a-generic-dry-run-lib.mjs";

export const G20U36D_READBACK_PHASE = "G-20u36d-readback-implementation-in-tools-draft";
export const READBACK_SOURCE = "supabase-select";
export const READBACK_SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";

const RELEASE_SELECT_FIELDS = [
  "legacy_id",
  "site_slug",
  "title",
  "artist",
  "release_date",
  "year",
  "label",
  "catalog_number",
  "description",
  "cover_image_url",
  "purchase_url",
  "streaming_url",
  "sort_order",
  "published",
].join(",");

const TRACK_SELECT_FIELDS = ["track_number", "title", "duration", "sort_order", "site_slug"].join(",");

/** Staging discography-002 fixture — internal adapter use only; UUID never exposed in readBack summary. */
export const DISCOGRAPHY_002_READBACK_FIXTURE = {
  release: {
    id: "00000000-0000-4000-8000-000000000002",
    legacy_id: "discography-002",
    site_slug: READBACK_SITE_SLUG,
    title: "SKYLARK",
    artist: "後藤沙紀",
    release_date: "2023-04-26",
    year: 2023,
    label: null,
    catalog_number: "GSRT-0001",
    description: "personnel notes",
    cover_image_url: "https://example.test/skylark-cover.png",
    purchase_url: "https://gosakirikako.base.shop/",
    streaming_url: null,
    sort_order: 2,
    published: true,
  },
  tracks: SKYLARK_TRACKS_CURRENT.map((title, index) => ({
    track_number: index + 1,
    title,
    duration: null,
    sort_order: index + 1,
    site_slug: READBACK_SITE_SLUG,
  })),
};

/**
 * Build PostgREST anon SELECT path for release row (documentation / adapter URL builder).
 *
 * @param {string} siteSlug
 * @param {string} legacyId
 * @returns {string}
 */
export function buildAnonSelectDiscographyReleasePath(siteSlug, legacyId) {
  const slug = encodeURIComponent(String(siteSlug ?? "").trim());
  const legacy = encodeURIComponent(String(legacyId ?? "").trim());
  return `/rest/v1/discography?site_slug=eq.${slug}&legacy_id=eq.${legacy}&select=${RELEASE_SELECT_FIELDS}&limit=1`;
}

/**
 * Build PostgREST anon SELECT path for tracks by release_id (internal id — not returned in readBack).
 *
 * @param {string} siteSlug
 * @param {string} releaseId
 * @returns {string}
 */
export function buildAnonSelectDiscographyTracksPath(siteSlug, releaseId) {
  const slug = encodeURIComponent(String(siteSlug ?? "").trim());
  const id = encodeURIComponent(String(releaseId ?? "").trim());
  return `/rest/v1/discography_tracks?site_slug=eq.${slug}&release_id=eq.${id}&select=${TRACK_SELECT_FIELDS}&order=track_number.asc.nullslast,sort_order.asc.nullslast`;
}

/**
 * @param {string} supabaseUrl
 * @returns {void}
 */
export function assertStagingSupabaseUrl(supabaseUrl) {
  const url = String(supabaseUrl ?? "");
  if (!url) {
    throw new Error("SUPABASE_URL is required for anon SELECT readBack");
  }
  if (url.includes(PRODUCTION_REF_STOP)) {
    throw new Error("production Supabase ref is blocked for readBack");
  }
  if (!url.includes(STAGING_PROJECT_REF)) {
    throw new Error("readBack anon SELECT is staging-only");
  }
}

/**
 * Sort track rows by track_number then sort_order.
 *
 * @param {Array<Record<string, unknown>>} rows
 * @returns {Array<Record<string, unknown>>}
 */
export function sortTrackRows(rows) {
  return [...(rows ?? [])].sort((a, b) => {
    const trackA = Number(a?.track_number ?? 0);
    const trackB = Number(b?.track_number ?? 0);
    if (trackA !== trackB) return trackA - trackB;
    const sortA = Number(a?.sort_order ?? 0);
    const sortB = Number(b?.sort_order ?? 0);
    return sortA - sortB;
  });
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @returns {string}
 */
export function mapTrackRowsToTracksText(rows) {
  return sortTrackRows(rows)
    .map((row) => String(row?.title ?? "").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Map DB release row to handler release snapshot shape (no internal id).
 *
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
export function mapReleaseRowToCurrentSnapshotRelease(row) {
  return {
    title: row?.title ?? null,
    artist: row?.artist ?? null,
    release_date: row?.release_date ?? null,
    label: row?.label ?? null,
    catalog_number: row?.catalog_number ?? null,
    published: row?.published ?? null,
    cover_image_url: row?.cover_image_url ?? null,
    purchase_url: row?.purchase_url ?? null,
    streaming_url: row?.streaming_url ?? null,
    description: row?.description ?? null,
  };
}

/**
 * Sanitized readBack summary — no raw rows · no UUID · no secrets.
 *
 * @param {object} input
 * @returns {object}
 */
export function buildSanitizedReadBackSummary(input) {
  return {
    enabled: input.enabled !== false,
    source: READBACK_SOURCE,
    releaseFound: Boolean(input.releaseFound),
    trackCount: Number(input.trackCount ?? 0),
    legacyId: String(input.legacyId ?? ""),
    siteSlug: String(input.siteSlug ?? READBACK_SITE_SLUG),
  };
}

/**
 * Build current snapshot + sanitized summary from SELECT rows.
 *
 * @param {Record<string, unknown> | null | undefined} releaseRow
 * @param {Array<Record<string, unknown>>} trackRows
 * @param {{ legacyId: string, siteSlug: string }} meta
 * @returns {{ snapshot: object, summary: object }}
 */
export function snapshotFromReadBackRows(releaseRow, trackRows, meta) {
  const legacyId = String(meta?.legacyId ?? "");
  const siteSlug = String(meta?.siteSlug ?? READBACK_SITE_SLUG);
  const sortedTracks = sortTrackRows(trackRows ?? []);

  if (!releaseRow) {
    return {
      snapshot: {},
      summary: buildSanitizedReadBackSummary({
        legacyId,
        siteSlug,
        releaseFound: false,
        trackCount: 0,
        enabled: true,
      }),
    };
  }

  return {
    snapshot: {
      tracksText: mapTrackRowsToTracksText(sortedTracks),
      release: mapReleaseRowToCurrentSnapshotRelease(releaseRow),
    },
    summary: buildSanitizedReadBackSummary({
      legacyId,
      siteSlug,
      releaseFound: true,
      trackCount: sortedTracks.length,
      enabled: true,
    }),
  };
}

/**
 * @typedef {object} ReadBackQueryAdapter
 * @property {(input: { siteSlug: string, legacyId: string }) => Promise<Record<string, unknown> | null>} fetchRelease
 * @property {(input: { siteSlug: string, releaseId: string }) => Promise<Array<Record<string, unknown>>>} fetchTracks
 */

/**
 * Resolve readBack snapshot via injectable adapter (SELECT-only).
 *
 * @param {ReadBackQueryAdapter} adapter
 * @param {{ siteSlug: string, legacyId: string }} input
 * @returns {Promise<{ snapshot: object, summary: object }>}
 */
export async function resolveReadBackSnapshot(adapter, input) {
  const siteSlug = String(input?.siteSlug ?? READBACK_SITE_SLUG);
  const legacyId = String(input?.legacyId ?? "").trim();
  const releaseRow = await adapter.fetchRelease({ siteSlug, legacyId });
  if (!releaseRow) {
    return snapshotFromReadBackRows(null, [], { legacyId, siteSlug });
  }
  const releaseId = String(releaseRow.id ?? "");
  const trackRows = releaseId
    ? await adapter.fetchTracks({ siteSlug, releaseId })
    : [];
  return snapshotFromReadBackRows(releaseRow, trackRows, { legacyId, siteSlug });
}

/**
 * Mock adapter for verifier — no network.
 *
 * @param {Record<string, { release?: Record<string, unknown> | null, tracks?: Array<Record<string, unknown>> }>} fixturesByLegacyId
 * @returns {ReadBackQueryAdapter}
 */
export function createMockReadBackAdapter(fixturesByLegacyId = {}) {
  return {
    async fetchRelease({ siteSlug, legacyId }) {
      const fixture = fixturesByLegacyId[String(legacyId ?? "")];
      if (!fixture || siteSlug !== READBACK_SITE_SLUG) return null;
      return fixture.release ?? null;
    },
    async fetchTracks({ siteSlug, releaseId }) {
      for (const fixture of Object.values(fixturesByLegacyId)) {
        const release = fixture?.release;
        if (release && String(release.id) === String(releaseId) && siteSlug === READBACK_SITE_SLUG) {
          return fixture.tracks ?? [];
        }
      }
      return [];
    },
  };
}

/**
 * Anon SELECT adapter — fetch injection only · GET-only · no service_role.
 *
 * @param {{ fetchFn: typeof fetch, supabaseUrl: string, anonKey: string }} deps
 * @returns {ReadBackQueryAdapter}
 */
export function createAnonSelectReadBackAdapter(deps) {
  const fetchFn = deps.fetchFn;
  const supabaseUrl = String(deps.supabaseUrl ?? "").replace(/\/+$/, "");
  const anonKey = String(deps.anonKey ?? "");
  assertStagingSupabaseUrl(supabaseUrl);
  if (!anonKey) {
    throw new Error("SUPABASE_ANON_KEY is required for anon SELECT readBack");
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: "application/json",
  };

  return {
    async fetchRelease({ siteSlug, legacyId }) {
      const path = buildAnonSelectDiscographyReleasePath(siteSlug, legacyId);
      const response = await fetchFn(`${supabaseUrl}${path}`, { method: "GET", headers });
      if (!response.ok) {
        throw new Error(`anon SELECT release failed (${response.status})`);
      }
      const rows = await response.json();
      return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    },
    async fetchTracks({ siteSlug, releaseId }) {
      const path = buildAnonSelectDiscographyTracksPath(siteSlug, releaseId);
      const response = await fetchFn(`${supabaseUrl}${path}`, { method: "GET", headers });
      if (!response.ok) {
        throw new Error(`anon SELECT tracks failed (${response.status})`);
      }
      const rows = await response.json();
      return Array.isArray(rows) ? rows : [];
    },
  };
}

/**
 * Assert readBack summary contains only allowed sanitized fields.
 *
 * @param {Record<string, unknown>} summary
 * @returns {boolean}
 */
export function isReadBackSummarySanitized(summary) {
  if (!summary || typeof summary !== "object") return false;
  const allowed = new Set(["enabled", "source", "releaseFound", "trackCount", "legacyId", "siteSlug"]);
  const keys = Object.keys(summary);
  if (!keys.every((key) => allowed.has(key))) return false;
  if (summary.source !== READBACK_SOURCE) return false;
  if (typeof summary.enabled !== "boolean") return false;
  if (typeof summary.releaseFound !== "boolean") return false;
  if (typeof summary.trackCount !== "number") return false;
  const serialized = JSON.stringify(summary);
  if (/service_role|SUPABASE_SERVICE_ROLE|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/i.test(serialized)) {
    return false;
  }
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(serialized)) {
    return false;
  }
  return true;
}

/**
 * Build dry-run request matching discography-002 DB fixture (no change).
 *
 * @returns {object}
 */
export function buildDiscography002MatchingDryRunRequest() {
  const release = mapReleaseRowToCurrentSnapshotRelease(DISCOGRAPHY_002_READBACK_FIXTURE.release);
  return {
    operation: "dryRun",
    siteSlug: READBACK_SITE_SLUG,
    legacyId: "discography-002",
    approvalId: "G-20u31-gosaki-discography-save-dry-run-endpoint",
    release,
    tracksText: mapTrackRowsToTracksText(DISCOGRAPHY_002_READBACK_FIXTURE.tracks),
    trackPolicy: {
      oneLineOneTrack: true,
      blankLinesIgnored: true,
      allowDuplicateTitles: true,
      allowEmptyTrackList: false,
    },
    clientDryRun: {
      wouldWrite: false,
      totalBefore: 8,
      totalAfter: 8,
      added: [],
      removed: [],
      reordered: false,
    },
  };
}

/**
 * Build dry-run request with one extra track vs DB fixture.
 *
 * @returns {object}
 */
export function buildDiscography002TrackAddedDryRunRequest() {
  const base = buildDiscography002MatchingDryRunRequest();
  return {
    ...base,
    tracksText: `${base.tracksText}\nBonus Track`,
    clientDryRun: {
      ...base.clientDryRun,
      totalAfter: 9,
      added: ["Bonus Track"],
      wouldWrite: false,
    },
  };
}
