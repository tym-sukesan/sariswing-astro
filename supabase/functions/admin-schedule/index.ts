import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdminUser, corsHeaders, jsonResponse } from "../_shared/admin-auth.ts";
import {
  SCHEDULE_SELECT,
  SCHEDULE_TIME_TYPE_OPTIONS,
  parseRowId,
  type ScheduleRecord,
  type ScheduleWritePayload,
  type VenueRecord,
} from "../_shared/schedules.ts";
import { createServiceClient } from "../_shared/supabase-service.ts";

const MAX_DATE_LENGTH = 32;
const MAX_TIME_TYPE_LENGTH = 32;
const MAX_TITLE_LENGTH = 500;
const MAX_VENUE_NAME_LENGTH = 500;
const MAX_GENRE_LENGTH = 200;
const MAX_TIME_VALUE_LENGTH = 32;
const MAX_PRICE_LENGTH = 500;
const MAX_MEMBERS_LENGTH = 500;
const MAX_URL_LENGTH = 2000;
const MAX_NOTE_LENGTH = 10_000;
const MAX_IMAGE_URL_LENGTH = 2000;

type ActionBody = {
  action?: string;
  id?: string | number;
  record?: ScheduleWritePayload;
};

function parseBody(raw: unknown): ActionBody {
  if (!raw || typeof raw !== "object") return {};
  return raw as ActionBody;
}

function validateId(id: unknown): string | Response {
  if (id == null || id === "") {
    return jsonResponse({ error: "id is required" }, 400);
  }
  return String(id);
}

function normalizeOptionalString(value: unknown, maxLen: number): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen) return null;
  return trimmed;
}

function parseVenueId(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isInteger(parsed)) return parsed;
  }
  return null;
}

function validateTimeType(value: unknown): string | null | Response {
  const normalized = normalizeOptionalString(value, MAX_TIME_TYPE_LENGTH);
  if (!normalized) return null;
  if (!(SCHEDULE_TIME_TYPE_OPTIONS as readonly string[]).includes(normalized)) {
    return jsonResponse({ error: "Invalid time_type" }, 400);
  }
  return normalized;
}

function validateScheduleRecord(record: unknown): ScheduleWritePayload | Response {
  if (!record || typeof record !== "object") {
    return jsonResponse({ error: "record is required" }, 400);
  }

  const r = record as ScheduleWritePayload;
  const date = typeof r.date === "string" ? r.date.trim() : "";
  if (!date) return jsonResponse({ error: "date is required" }, 400);
  if (date.length > MAX_DATE_LENGTH) {
    return jsonResponse({ error: "date is invalid" }, 400);
  }

  const timeTypeResult = validateTimeType(r.time_type);
  if (timeTypeResult instanceof Response) return timeTypeResult;

  const openTime = normalizeOptionalString(r.open_time, MAX_TIME_VALUE_LENGTH);
  const startTime = normalizeOptionalString(r.start_time, MAX_TIME_VALUE_LENGTH);

  return {
    date,
    time_type: timeTypeResult,
    venue_id: parseVenueId(r.venue_id),
    venue_name: normalizeOptionalString(r.venue_name, MAX_VENUE_NAME_LENGTH),
    title: normalizeOptionalString(r.title, MAX_TITLE_LENGTH),
    genre: normalizeOptionalString(r.genre, MAX_GENRE_LENGTH),
    open_time: openTime,
    start_time: startTime,
    price: normalizeOptionalString(r.price, MAX_PRICE_LENGTH),
    members: normalizeOptionalString(r.members, MAX_MEMBERS_LENGTH),
    reservation_url: normalizeOptionalString(r.reservation_url, MAX_URL_LENGTH),
    note: normalizeOptionalString(r.note, MAX_NOTE_LENGTH),
    image_url: normalizeOptionalString(r.image_url, MAX_IMAGE_URL_LENGTH),
    is_published: Boolean(r.is_published),
    is_special: Boolean(r.is_special),
  };
}

function scheduleWritePayloadFromRow(row: ScheduleRecord): ScheduleWritePayload {
  return {
    date: row.date,
    time_type: row.time_type ?? null,
    venue_id: row.venue_id ?? null,
    venue_name: row.venue_name ?? null,
    title: row.title ?? null,
    genre: row.genre ?? null,
    open_time: row.open_time ?? null,
    start_time: row.start_time ?? null,
    price: row.price ?? null,
    members: row.members ?? null,
    reservation_url: row.reservation_url ?? null,
    note: row.note ?? null,
    image_url: row.image_url ?? null,
    is_published: Boolean(row.is_published),
    is_special: Boolean(row.is_special),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminResult = await requireAdminUser(req);
  if (adminResult instanceof Response) return adminResult;

  const service = createServiceClient();
  if (!service) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  let body: ActionBody;
  try {
    body = parseBody(await req.json());
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action;

  if (action === "list") {
    const [schedulesResult, venuesResult] = await Promise.all([
      service
        .from("schedules")
        .select(SCHEDULE_SELECT)
        .is("deleted_at", null)
        .order("date", { ascending: true }),
      service.from("venues").select("*").order("name", { ascending: true }),
    ]);

    if (schedulesResult.error) {
      return jsonResponse({ error: schedulesResult.error.message }, 500);
    }
    if (venuesResult.error) {
      return jsonResponse({ error: venuesResult.error.message }, 500);
    }

    const venues = (venuesResult.data ?? []) as VenueRecord[];

    return jsonResponse(
      {
        ok: true,
        data: {
          schedules: (schedulesResult.data ?? []) as ScheduleRecord[],
          venues: venues.map((v) => ({ name: v.name })),
        },
      },
      200
    );
  }

  if (action === "list_deleted") {
    const { data, error } = await service
      .from("schedules")
      .select(SCHEDULE_SELECT)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse(
      {
        ok: true,
        data: (data ?? []) as ScheduleRecord[],
      },
      200
    );
  }

  if (action === "create") {
    const payload = validateScheduleRecord(body.record);
    if (payload instanceof Response) return payload;

    const { data, error } = await service
      .from("schedules")
      .insert([payload])
      .select(SCHEDULE_SELECT)
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, data: data as ScheduleRecord }, 200);
  }

  if (action === "update") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;
    const payload = validateScheduleRecord(body.record);
    if (payload instanceof Response) return payload;

    const { data, error } = await service
      .from("schedules")
      .update(payload)
      .eq("id", parseRowId(id))
      .is("deleted_at", null)
      .select(SCHEDULE_SELECT);

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!data?.length) {
      return jsonResponse({ error: `No row updated for id: ${id}` }, 404);
    }
    return jsonResponse({ ok: true, data: data[0] as ScheduleRecord }, 200);
  }

  if (action === "duplicate") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;

    const { data: row, error: fetchError } = await service
      .from("schedules")
      .select(SCHEDULE_SELECT)
      .eq("id", parseRowId(id))
      .is("deleted_at", null)
      .maybeSingle();

    if (fetchError) return jsonResponse({ error: fetchError.message }, 500);
    if (!row) return jsonResponse({ error: "Schedule not found" }, 404);

    const source = row as ScheduleRecord;
    const base = scheduleWritePayloadFromRow(source);
    const duplicateTitle = base.title ? `${base.title} のコピー` : "無題のコピー";

    const { data, error } = await service
      .from("schedules")
      .insert([{ ...base, title: duplicateTitle }])
      .select(SCHEDULE_SELECT)
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, data: data as ScheduleRecord }, 200);
  }

  if (action === "delete") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;

    const { data, error } = await service
      .from("schedules")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", parseRowId(id))
      .is("deleted_at", null)
      .select("id");

    if (error) return jsonResponse({ error: error.message }, 500);

    const count = data?.length ?? 0;
    return jsonResponse({ ok: true, count }, 200);
  }

  if (action === "restore") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;

    const { data, error } = await service
      .from("schedules")
      .update({ deleted_at: null })
      .eq("id", parseRowId(id))
      .not("deleted_at", "is", null)
      .select("id");

    if (error) return jsonResponse({ error: error.message }, 500);

    const count = data?.length ?? 0;
    return jsonResponse({ ok: true, count }, 200);
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
