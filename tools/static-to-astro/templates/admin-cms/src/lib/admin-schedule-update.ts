/**
 * Admin schedule update helpers (Phase 3-P-B / 3-P-D / 3-P-E).
 * Server-side only — single-row update by legacy_id.
 */

import { getServiceRoleClient } from "./admin-auth.ts";
import {
  HOME_FEATURED_LIMIT,
  SCHEDULES_HOME_FEATURED_MODULE,
  homeFeaturedLimitExceededResponse,
} from "./home-featured-limit.ts";

export const SCHEDULE_UPDATE_ALLOWED_FIELDS = [
  "title",
  "venue",
  "published",
  "open_time",
  "start_time",
  "price",
  "description",
  "show_on_home",
  "home_order",
] as const;

export const SCHEDULE_UPDATE_FORBIDDEN_FIELDS = [
  "id",
  "legacy_id",
  "date",
  "year",
  "month",
  "created_at",
  "updated_at",
  "source_file",
  "source_route",
  "image_url",
  "home_image_url",
] as const;

export type ScheduleUpdateAllowedField = (typeof SCHEDULE_UPDATE_ALLOWED_FIELDS)[number];

export interface ScheduleUpdateRequest {
  legacy_id: string;
  updates: Partial<Record<ScheduleUpdateAllowedField, unknown>>;
}

export interface ScheduleUpdateRecord {
  legacy_id: string;
  title: string | null;
  venue: string | null;
  open_time: string | null;
  start_time: string | null;
  price: string | null;
  description: string | null;
  show_on_home: boolean;
  home_order: number | null;
  published: boolean;
}

export const SCHEDULE_UPDATE_RECORD_SELECT =
  "legacy_id,title,venue,open_time,start_time,price,description,show_on_home,home_order,published";

export { HOME_FEATURED_LIMIT, SCHEDULES_HOME_FEATURED_MODULE };

export type ScheduleUpdateResult =
  | { ok: true; updated: true; record: ScheduleUpdateRecord }
  | { ok: false; error: "not_found" | "update_failed"; message?: string }
  | { ok: false; error: "validation_error"; message: string }
  | ReturnType<typeof homeFeaturedLimitExceededResponse>;

async function countSchedulesHomeFeatured(client: {
  from: (table: string) => {
    select: (
      columns: string,
      opts: { count: "exact"; head: true },
    ) => { eq: (col: string, val: boolean) => Promise<{ count: number | null; error: { message: string } | null }> };
  };
}): Promise<number> {
  const { count, error } = await client
    .from(SCHEDULES_HOME_FEATURED_MODULE.table)
    .select("*", { count: "exact", head: true })
    .eq(SCHEDULES_HOME_FEATURED_MODULE.featuredField, true);

  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

function effectiveBoolean(
  updates: Partial<Record<ScheduleUpdateAllowedField, unknown>>,
  field: "show_on_home" | "published",
  current: ScheduleUpdateRecord,
): boolean {
  if (field in updates) {
    return Boolean(updates[field]);
  }
  return Boolean(current[field]);
}

/**
 * Pre-update validation for home featured limit and published/show_on_home consistency.
 */
export async function validateScheduleHomeFeaturedUpdate(
  legacyId: string,
  updates: Partial<Record<ScheduleUpdateAllowedField, unknown>>,
  current: ScheduleUpdateRecord,
): Promise<
  | { ok: true }
  | { ok: false; error: "validation_error"; message: string }
  | ReturnType<typeof homeFeaturedLimitExceededResponse>
> {
  const nextShowOnHome = effectiveBoolean(updates, "show_on_home", current);
  const nextPublished = effectiveBoolean(updates, "published", current);

  if (nextShowOnHome && !nextPublished) {
    return {
      ok: false,
      error: "validation_error",
      message: "show_on_home requires published to be true",
    };
  }

  const enablingHomeFeatured = nextShowOnHome && !current.show_on_home;
  if (!enablingHomeFeatured) {
    return { ok: true };
  }

  const service = getServiceRoleClient();
  if (!service.ok) {
    return { ok: false, error: "validation_error", message: service.error };
  }

  const currentCount = await countSchedulesHomeFeatured(service.client);
  if (currentCount >= SCHEDULES_HOME_FEATURED_MODULE.limit) {
    return homeFeaturedLimitExceededResponse(currentCount);
  }

  return { ok: true };
}

function normalizeHomeOrder(value: unknown):
  | { ok: true; value: number | null }
  | { ok: false; message: string } {
  if (value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? { ok: true, value } : { ok: false, message: "home_order must be number or null" };
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return { ok: true, value: null };
    const num = Number(trimmed);
    if (!Number.isFinite(num)) {
      return { ok: false, message: "home_order must be number or null" };
    }
    return { ok: true, value: num };
  }
  return { ok: false, message: "home_order must be number or null" };
}

function mapScheduleRecord(data: Record<string, unknown>): ScheduleUpdateRecord {
  return {
    legacy_id: String(data.legacy_id),
    title: (data.title as string | null) ?? null,
    venue: (data.venue as string | null) ?? null,
    open_time: (data.open_time as string | null) ?? null,
    start_time: (data.start_time as string | null) ?? null,
    price: (data.price as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    show_on_home: Boolean(data.show_on_home),
    home_order: typeof data.home_order === "number" ? data.home_order : null,
    published: Boolean(data.published),
  };
}

/**
 * @param {unknown} body
 */
export function parseScheduleUpdateRequest(body: unknown):
  | { ok: true; request: ScheduleUpdateRequest }
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
    if ((SCHEDULE_UPDATE_FORBIDDEN_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, error: "validation_error", message: `Field not allowed: ${key}` };
    }
    if (!(SCHEDULE_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, error: "validation_error", message: `Unknown field: ${key}` };
    }
  }

  const updates: Partial<Record<ScheduleUpdateAllowedField, unknown>> = {};
  for (const key of keys) {
    const field = key as ScheduleUpdateAllowedField;
    const value = updatesRaw[field];
    if (field === "published" || field === "show_on_home") {
      if (typeof value !== "boolean") {
        return { ok: false, error: "validation_error", message: `${field} must be boolean` };
      }
      updates[field] = value;
      continue;
    }
    if (field === "home_order") {
      const normalized = normalizeHomeOrder(value);
      if (!normalized.ok) {
        return { ok: false, error: "validation_error", message: normalized.message };
      }
      updates[field] = normalized.value;
      continue;
    }
    if (value !== null && typeof value !== "string") {
      return { ok: false, error: "validation_error", message: `${field} must be string or null` };
    }
    updates[field] = value;
  }

  return { ok: true, request: { legacy_id: legacyId, updates } };
}

/**
 * Update one schedule row by legacy_id (server-side service role after admin gate).
 */
export async function updateScheduleByLegacyId(
  legacyId: string,
  updates: Partial<Record<ScheduleUpdateAllowedField, unknown>>,
): Promise<ScheduleUpdateResult> {
  const service = getServiceRoleClient();
  if (!service.ok) {
    return { ok: false, error: "update_failed", message: service.error };
  }

  const { data: existing, error: fetchError } = await service.client
    .from("schedules")
    .select(SCHEDULE_UPDATE_RECORD_SELECT)
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: "update_failed", message: fetchError.message };
  }
  if (!existing) {
    return { ok: false, error: "not_found" };
  }

  const current = mapScheduleRecord(existing as Record<string, unknown>);
  const validation = await validateScheduleHomeFeaturedUpdate(legacyId, updates, current);
  if (!validation.ok) {
    return validation;
  }

  const { data, error } = await service.client
    .from("schedules")
    .update(updates)
    .eq("legacy_id", legacyId)
    .select(SCHEDULE_UPDATE_RECORD_SELECT)
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
    record: mapScheduleRecord(data as Record<string, unknown>),
  };
}

/**
 * Read schedule row for verification / cleanup helpers.
 */
export async function fetchScheduleByLegacyId(
  legacyId: string,
): Promise<ScheduleUpdateRecord | null> {
  const service = getServiceRoleClient();
  if (!service.ok) return null;

  const { data, error } = await service.client
    .from("schedules")
    .select(SCHEDULE_UPDATE_RECORD_SELECT)
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) return null;
  return mapScheduleRecord(data as Record<string, unknown>);
}
