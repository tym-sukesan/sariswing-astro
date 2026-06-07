/**
 * Admin discography tracks update helpers (Phase 3-P-G).
 * Server-side only — update existing tracks by discography_legacy_id + track_number.
 * No insert / delete / upsert / track_number change.
 */

import { getServiceRoleClient } from "./admin-auth.ts";

export const TRACK_UPDATE_ALLOWED_KEYS = ["track_number", "title", "sort_order"] as const;

export const TRACK_UPDATE_FORBIDDEN_KEYS = [
  "id",
  "created_at",
  "discography_legacy_id",
  "legacy_id",
  "discography",
  "cover_image_url",
] as const;

export interface DiscographyTrackUpdateItem {
  track_number: number;
  title: string;
  sort_order: number | null;
}

export interface DiscographyTracksUpdateRequest {
  discography_legacy_id: string;
  tracks: DiscographyTrackUpdateItem[];
}

export interface DiscographyTrackRecord {
  discography_legacy_id: string;
  track_number: number;
  title: string;
  sort_order: number | null;
}

export const DISCOGRAPHY_TRACK_RECORD_SELECT =
  "discography_legacy_id,track_number,title,sort_order";

export type DiscographyTracksUpdateResult =
  | {
      ok: true;
      updated: true;
      discography_legacy_id: string;
      updated_count: number;
      tracks: DiscographyTrackRecord[];
    }
  | { ok: false; error: "not_found" | "update_failed"; message?: string }
  | { ok: false; error: "validation_error"; message: string };

function normalizeTrackTitle(value: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "track title must be string" };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, message: "track title is required" };
  }
  return { ok: true, value: trimmed };
}

function normalizeTrackNumber(value: unknown): { ok: true; value: number } | { ok: false; message: string } {
  if (typeof value === "number") {
    return Number.isFinite(value) && Number.isInteger(value)
      ? { ok: true, value }
      : { ok: false, message: "track_number must be integer" };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return { ok: false, message: "track_number is required" };
    const num = Number(trimmed);
    if (!Number.isFinite(num) || !Number.isInteger(num)) {
      return { ok: false, message: "track_number must be integer" };
    }
    return { ok: true, value: num };
  }
  return { ok: false, message: "track_number must be integer" };
}

function normalizeSortOrder(value: unknown): { ok: true; value: number | null } | { ok: false; message: string } {
  if (value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? { ok: true, value } : { ok: false, message: "sort_order must be number or null" };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return { ok: true, value: null };
    const num = Number(trimmed);
    if (!Number.isFinite(num)) {
      return { ok: false, message: "sort_order must be number or null" };
    }
    return { ok: true, value: num };
  }
  return { ok: false, message: "sort_order must be number or null" };
}

function mapTrackRecord(data: Record<string, unknown>): DiscographyTrackRecord {
  return {
    discography_legacy_id: String(data.discography_legacy_id),
    track_number: Number(data.track_number),
    title: String(data.title),
    sort_order: typeof data.sort_order === "number" ? data.sort_order : null,
  };
}

/**
 * @param {unknown} body
 */
export function parseDiscographyTracksUpdateRequest(body: unknown):
  | { ok: true; request: DiscographyTracksUpdateRequest }
  | { ok: false; error: "validation_error"; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "validation_error", message: "Body must be a JSON object" };
  }

  const raw = body as Record<string, unknown>;
  const discographyLegacyId =
    typeof raw.discography_legacy_id === "string" ? raw.discography_legacy_id.trim() : "";
  if (!discographyLegacyId) {
    return { ok: false, error: "validation_error", message: "discography_legacy_id is required" };
  }

  if (!Array.isArray(raw.tracks) || raw.tracks.length === 0) {
    return { ok: false, error: "validation_error", message: "tracks must be a non-empty array" };
  }

  const tracks: DiscographyTrackUpdateItem[] = [];
  const seenNumbers = new Set<number>();

  for (let i = 0; i < raw.tracks.length; i++) {
    const item = raw.tracks[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { ok: false, error: "validation_error", message: `tracks[${i}] must be an object` };
    }

    const itemRaw = item as Record<string, unknown>;
    for (const key of Object.keys(itemRaw)) {
      if ((TRACK_UPDATE_FORBIDDEN_KEYS as readonly string[]).includes(key)) {
        return { ok: false, error: "validation_error", message: `Field not allowed: ${key}` };
      }
      if (!(TRACK_UPDATE_ALLOWED_KEYS as readonly string[]).includes(key)) {
        return { ok: false, error: "validation_error", message: `Unknown field: ${key}` };
      }
    }

    if (!("track_number" in itemRaw)) {
      return { ok: false, error: "validation_error", message: `tracks[${i}].track_number is required` };
    }
    if (!("title" in itemRaw)) {
      return { ok: false, error: "validation_error", message: `tracks[${i}].title is required` };
    }

    const trackNumber = normalizeTrackNumber(itemRaw.track_number);
    if (!trackNumber.ok) {
      return { ok: false, error: "validation_error", message: trackNumber.message };
    }

    if (seenNumbers.has(trackNumber.value)) {
      return { ok: false, error: "validation_error", message: "duplicate track_number in tracks array" };
    }
    seenNumbers.add(trackNumber.value);

    const title = normalizeTrackTitle(itemRaw.title);
    if (!title.ok) {
      return { ok: false, error: "validation_error", message: title.message };
    }

    const sortOrder = normalizeSortOrder(itemRaw.sort_order ?? null);
    if (!sortOrder.ok) {
      return { ok: false, error: "validation_error", message: sortOrder.message };
    }

    tracks.push({
      track_number: trackNumber.value,
      title: title.value,
      sort_order: sortOrder.value,
    });
  }

  return {
    ok: true,
    request: { discography_legacy_id: discographyLegacyId, tracks },
  };
}

async function fetchExistingTrackNumbers(
  client: ReturnType<typeof getServiceRoleClient> extends { ok: true; client: infer C } ? C : never,
  discographyLegacyId: string,
): Promise<Set<number>> {
  const { data, error } = await client
    .from("discography_tracks")
    .select("track_number")
    .eq("discography_legacy_id", discographyLegacyId);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data ?? []).map((row) => Number(row.track_number)));
}

async function fetchTracksForDiscography(
  client: ReturnType<typeof getServiceRoleClient> extends { ok: true; client: infer C } ? C : never,
  discographyLegacyId: string,
): Promise<DiscographyTrackRecord[]> {
  const { data, error } = await client
    .from("discography_tracks")
    .select(DISCOGRAPHY_TRACK_RECORD_SELECT)
    .eq("discography_legacy_id", discographyLegacyId)
    .order("track_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapTrackRecord(row as Record<string, unknown>));
}

/**
 * Update existing discography tracks (title / sort_order only).
 */
export async function updateDiscographyTracksByLegacyId(
  discographyLegacyId: string,
  tracks: DiscographyTrackUpdateItem[],
): Promise<DiscographyTracksUpdateResult> {
  const service = getServiceRoleClient();
  if (!service.ok) {
    return { ok: false, error: "update_failed", message: service.error };
  }

  const { data: discography, error: discographyError } = await service.client
    .from("discography")
    .select("legacy_id")
    .eq("legacy_id", discographyLegacyId)
    .maybeSingle();

  if (discographyError) {
    return { ok: false, error: "update_failed", message: discographyError.message };
  }
  if (!discography) {
    return { ok: false, error: "not_found" };
  }

  let existingNumbers: Set<number>;
  try {
    existingNumbers = await fetchExistingTrackNumbers(service.client, discographyLegacyId);
  } catch (err) {
    return {
      ok: false,
      error: "update_failed",
      message: err instanceof Error ? err.message : "failed to load existing tracks",
    };
  }

  for (const track of tracks) {
    if (!existingNumbers.has(track.track_number)) {
      return {
        ok: false,
        error: "validation_error",
        message: `track_number ${track.track_number} does not exist for ${discographyLegacyId}`,
      };
    }
  }

  const beforeCount = existingNumbers.size;

  for (const track of tracks) {
    const { error } = await service.client
      .from("discography_tracks")
      .update({ title: track.title, sort_order: track.sort_order })
      .eq("discography_legacy_id", discographyLegacyId)
      .eq("track_number", track.track_number);

    if (error) {
      return { ok: false, error: "update_failed", message: error.message };
    }
  }

  let updatedTracks: DiscographyTrackRecord[];
  try {
    updatedTracks = await fetchTracksForDiscography(service.client, discographyLegacyId);
  } catch (err) {
    return {
      ok: false,
      error: "update_failed",
      message: err instanceof Error ? err.message : "failed to load updated tracks",
    };
  }

  if (updatedTracks.length !== beforeCount) {
    return {
      ok: false,
      error: "update_failed",
      message: "track count changed unexpectedly",
    };
  }

  return {
    ok: true,
    updated: true,
    discography_legacy_id: discographyLegacyId,
    updated_count: tracks.length,
    tracks: updatedTracks,
  };
}
