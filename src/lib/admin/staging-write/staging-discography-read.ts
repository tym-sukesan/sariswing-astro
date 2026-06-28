/**
 * G-15a — Read-only discography loader for Gosaki staging admin (SELECT only).
 */

import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import type {
  GosakiDiscographyRecord,
  GosakiDiscographyReadSource,
  GosakiDiscographyTrackRecord,
} from "../staging-data/gosaki-discography-read-types";

export const DISCOGRAPHY_ADMIN_SELECT =
  "id,legacy_id,title,artist,release_date,year,catalog_number,label,description,cover_image_url,purchase_url,streaming_url,sort_order,published,updated_at" as const;

const DISCOGRAPHY_TRACKS_SELECT =
  "discography_legacy_id,track_number,title,sort_order" as const;

const READ_LIMIT = 50;

export type DiscographyReadResult = {
  records: GosakiDiscographyRecord[];
  source: GosakiDiscographyReadSource;
  error?: string;
};

function mapDiscographyRow(row: Record<string, unknown>): Omit<GosakiDiscographyRecord, "tracks"> {
  return {
    id: String(row.id ?? ""),
    legacy_id: String(row.legacy_id ?? ""),
    title: String(row.title ?? ""),
    artist: row.artist != null ? String(row.artist) : null,
    release_date: row.release_date != null ? String(row.release_date) : null,
    year: typeof row.year === "number" ? row.year : null,
    catalog_number: row.catalog_number != null ? String(row.catalog_number) : null,
    label: row.label != null ? String(row.label) : null,
    description: row.description != null ? String(row.description) : null,
    cover_image_url: row.cover_image_url != null ? String(row.cover_image_url) : null,
    purchase_url: row.purchase_url != null ? String(row.purchase_url) : null,
    streaming_url: row.streaming_url != null ? String(row.streaming_url) : null,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
    published: row.published != null ? Boolean(row.published) : null,
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
  };
}

function mapTrackRow(row: Record<string, unknown>): GosakiDiscographyTrackRecord & {
  discography_legacy_id: string;
} {
  return {
    discography_legacy_id: String(row.discography_legacy_id ?? ""),
    track_number: typeof row.track_number === "number" ? row.track_number : 0,
    title: String(row.title ?? ""),
    sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
  };
}

function compareDiscographyRecords(a: GosakiDiscographyRecord, b: GosakiDiscographyRecord): number {
  const sortDelta = (a.sort_order ?? 0) - (b.sort_order ?? 0);
  if (sortDelta !== 0) return sortDelta;
  return a.legacy_id.localeCompare(b.legacy_id);
}

/**
 * Admin read — all published states, ordered by sort_order (no site_slug filter; column absent).
 */
export async function loadDiscographyForAdminRead(options: {
  url: string;
  anonKey: string;
  useSupabase: boolean;
}): Promise<DiscographyReadResult> {
  if (!options.useSupabase) {
    return { records: [], source: "unavailable", error: "Supabase read disabled." };
  }

  if (!options.url || !options.anonKey) {
    return {
      records: [],
      source: "unavailable",
      error: "Supabase URL/anon key missing.",
    };
  }

  try {
    const client = getStagingSupabaseClient(options.url, options.anonKey);

    const [discResult, tracksResult] = await Promise.all([
      client
        .from("discography")
        .select(DISCOGRAPHY_ADMIN_SELECT)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .limit(READ_LIMIT),
      client
        .from("discography_tracks")
        .select(DISCOGRAPHY_TRACKS_SELECT)
        .order("sort_order", { ascending: true, nullsFirst: false })
        .limit(200),
    ]);

    if (discResult.error) {
      return {
        records: [],
        source: "unavailable",
        error: discResult.error.message,
      };
    }

    if (tracksResult.error) {
      return {
        records: [],
        source: "unavailable",
        error: tracksResult.error.message,
      };
    }

    const tracksByLegacy = new Map<string, GosakiDiscographyTrackRecord[]>();
    for (const raw of tracksResult.data ?? []) {
      const track = mapTrackRow(raw as Record<string, unknown>);
      const list = tracksByLegacy.get(track.discography_legacy_id) ?? [];
      list.push({
        track_number: track.track_number,
        title: track.title,
        sort_order: track.sort_order,
      });
      tracksByLegacy.set(track.discography_legacy_id, list);
    }

    const records = ((discResult.data ?? []) as Record<string, unknown>[])
      .map((row) => {
        const base = mapDiscographyRow(row);
        const tracks = [...(tracksByLegacy.get(base.legacy_id) ?? [])].sort(
          (a, b) => a.track_number - b.track_number,
        );
        return { ...base, tracks };
      })
      .sort(compareDiscographyRecords);

    return { records, source: "supabase" };
  } catch (err) {
    return {
      records: [],
      source: "unavailable",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
