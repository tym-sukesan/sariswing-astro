/**
 * Admin discography update helpers (Phase 3-P-F).
 * Server-side only — single-row update by legacy_id. Tracks untouched.
 */

import { getServiceRoleClient } from "./admin-auth.ts";

export const DISCOGRAPHY_UPDATE_ALLOWED_FIELDS = [
  "title",
  "artist",
  "release_date",
  "year",
  "label",
  "catalog_number",
  "description",
  "purchase_url",
  "streaming_url",
  "published",
  "sort_order",
] as const;

export const DISCOGRAPHY_UPDATE_FORBIDDEN_FIELDS = [
  "id",
  "legacy_id",
  "created_at",
  "updated_at",
  "source_file",
  "source_route",
  "cover_image_url",
  "tracks",
] as const;

export type DiscographyUpdateAllowedField = (typeof DISCOGRAPHY_UPDATE_ALLOWED_FIELDS)[number];

export interface DiscographyUpdateRequest {
  legacy_id: string;
  updates: Partial<Record<DiscographyUpdateAllowedField, unknown>>;
}

export interface DiscographyUpdateRecord {
  legacy_id: string;
  title: string;
  artist: string | null;
  release_date: string | null;
  year: number | null;
  label: string | null;
  catalog_number: string | null;
  description: string | null;
  purchase_url: string | null;
  streaming_url: string | null;
  published: boolean;
  sort_order: number | null;
}

export const DISCOGRAPHY_UPDATE_RECORD_SELECT =
  "legacy_id,title,artist,release_date,year,label,catalog_number,description,purchase_url,streaming_url,sort_order,published";

export type DiscographyUpdateResult =
  | { ok: true; updated: true; record: DiscographyUpdateRecord }
  | { ok: false; error: "not_found" | "update_failed"; message?: string }
  | { ok: false; error: "validation_error"; message: string };

function normalizeNullableString(value: unknown): { ok: true; value: string | null } | { ok: false; message: string } {
  if (value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, message: "must be string or null" };
  }
  const trimmed = value.trim();
  return { ok: true, value: trimmed || null };
}

function normalizeTitle(value: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "title must be string" };
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, message: "title is required" };
  }
  return { ok: true, value: trimmed };
}

function normalizeReleaseDate(value: unknown): { ok: true; value: string | null } | { ok: false; message: string } {
  const normalized = normalizeNullableString(value);
  if (!normalized.ok) {
    return { ok: false, message: "release_date must be YYYY-MM-DD or null" };
  }
  if (normalized.value && !/^\d{4}-\d{2}-\d{2}$/.test(normalized.value)) {
    return { ok: false, message: "release_date must be YYYY-MM-DD or null" };
  }
  return normalized;
}

function normalizeNullableNumber(value: unknown, field: string):
  | { ok: true; value: number | null }
  | { ok: false; message: string } {
  if (value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? { ok: true, value } : { ok: false, message: `${field} must be number or null` };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return { ok: true, value: null };
    const num = Number(trimmed);
    if (!Number.isFinite(num)) {
      return { ok: false, message: `${field} must be number or null` };
    }
    return { ok: true, value: num };
  }
  return { ok: false, message: `${field} must be number or null` };
}

function mapDiscographyRecord(data: Record<string, unknown>): DiscographyUpdateRecord {
  return {
    legacy_id: String(data.legacy_id),
    title: String(data.title ?? ""),
    artist: (data.artist as string | null) ?? null,
    release_date: data.release_date ? String(data.release_date) : null,
    year: typeof data.year === "number" ? data.year : null,
    label: (data.label as string | null) ?? null,
    catalog_number: (data.catalog_number as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    purchase_url: (data.purchase_url as string | null) ?? null,
    streaming_url: (data.streaming_url as string | null) ?? null,
    published: Boolean(data.published),
    sort_order: typeof data.sort_order === "number" ? data.sort_order : null,
  };
}

/**
 * @param {unknown} body
 */
export function parseDiscographyUpdateRequest(body: unknown):
  | { ok: true; request: DiscographyUpdateRequest }
  | { ok: false; error: "validation_error"; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "validation_error", message: "Body must be a JSON object" };
  }

  const raw = body as Record<string, unknown>;
  const legacyId = typeof raw.legacy_id === "string" ? raw.legacy_id.trim() : "";
  if (!legacyId) {
    return { ok: false, error: "validation_error", message: "legacy_id is required" };
  }

  if (!raw.updates || typeof raw.updates !== "object" || Array.isArray(raw.updates)) {
    return { ok: false, error: "validation_error", message: "updates must be an object" };
  }

  const updatesRaw = raw.updates as Record<string, unknown>;
  const keys = Object.keys(updatesRaw);
  if (keys.length === 0) {
    return { ok: false, error: "validation_error", message: "updates must not be empty" };
  }

  for (const key of keys) {
    if ((DISCOGRAPHY_UPDATE_FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, error: "validation_error", message: `Field not allowed: ${key}` };
    }
    if (!(DISCOGRAPHY_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, error: "validation_error", message: `Unknown field: ${key}` };
    }
  }

  const updates: Partial<Record<DiscographyUpdateAllowedField, unknown>> = {};
  for (const key of keys) {
    const field = key as DiscographyUpdateAllowedField;
    const value = updatesRaw[field];

    if (field === "published") {
      if (typeof value !== "boolean") {
        return { ok: false, error: "validation_error", message: "published must be boolean" };
      }
      updates[field] = value;
      continue;
    }

    if (field === "title") {
      const normalized = normalizeTitle(value);
      if (!normalized.ok) {
        return { ok: false, error: "validation_error", message: normalized.message };
      }
      updates[field] = normalized.value;
      continue;
    }

    if (field === "release_date") {
      const normalized = normalizeReleaseDate(value);
      if (!normalized.ok) {
        return { ok: false, error: "validation_error", message: normalized.message };
      }
      updates[field] = normalized.value;
      continue;
    }

    if (field === "year" || field === "sort_order") {
      const normalized = normalizeNullableNumber(value, field);
      if (!normalized.ok) {
        return { ok: false, error: "validation_error", message: normalized.message };
      }
      updates[field] = normalized.value;
      continue;
    }

    const normalized = normalizeNullableString(value);
    if (!normalized.ok) {
      return { ok: false, error: "validation_error", message: `${field} ${normalized.message}` };
    }
    updates[field] = normalized.value;
  }

  return { ok: true, request: { legacy_id: legacyId, updates } };
}

/**
 * Update one discography row by legacy_id (server-side service role after admin gate).
 */
export async function updateDiscographyByLegacyId(
  legacyId: string,
  updates: Partial<Record<DiscographyUpdateAllowedField, unknown>>,
): Promise<DiscographyUpdateResult> {
  const service = getServiceRoleClient();
  if (!service.ok) {
    return { ok: false, error: "update_failed", message: service.error };
  }

  const { data, error } = await service.client
    .from("discography")
    .update(updates)
    .eq("legacy_id", legacyId)
    .select(DISCOGRAPHY_UPDATE_RECORD_SELECT)
    .maybeSingle();

  if (error) {
    return { ok: false, error: "update_failed", message: error.message };
  }

  if (!data) {
    return { ok: false, error: "not_found" };
  }

  return {
    ok: true,
    updated: true,
    record: mapDiscographyRecord(data as Record<string, unknown>),
  };
}

/**
 * Read discography row for verification / cleanup helpers.
 */
export async function fetchDiscographyByLegacyId(
  legacyId: string,
): Promise<DiscographyUpdateRecord | null> {
  const service = getServiceRoleClient();
  if (!service.ok) return null;

  const { data, error } = await service.client
    .from("discography")
    .select(DISCOGRAPHY_UPDATE_RECORD_SELECT)
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) return null;
  return mapDiscographyRecord(data as Record<string, unknown>);
}
