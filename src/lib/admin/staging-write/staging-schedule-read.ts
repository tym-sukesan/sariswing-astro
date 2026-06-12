/**
 * G-6-e2 — Read-only schedule loader for dry-run UI (SELECT only).
 */

import { getStagingSupabaseClient } from "../staging-auth/supabase-staging-auth-client";
import { SCHEDULE_DRY_RUN_MOCK_RECORDS } from "./schedule-dry-run-mock-fixtures";
import type { ScheduleRecord } from "./schedule-dry-run-types";

const SCHEDULE_DRY_RUN_SELECT =
  "id,legacy_id,date,year,month,title,venue,open_time,start_time,price,description,show_on_home,home_order,published,sort_order,source_file,source_route,created_at,updated_at" as const;

const READ_LIMIT = 100;

function mapRow(row: Record<string, unknown>): ScheduleRecord {
  return {
    id: String(row.id ?? ""),
    legacy_id: row.legacy_id != null ? String(row.legacy_id) : null,
    date: String(row.date ?? ""),
    year: typeof row.year === "number" ? row.year : null,
    month: row.month != null ? String(row.month) : null,
    title: row.title != null ? String(row.title) : null,
    venue: row.venue != null ? String(row.venue) : null,
    open_time: row.open_time != null ? String(row.open_time) : null,
    start_time: row.start_time != null ? String(row.start_time) : null,
    price: row.price != null ? String(row.price) : null,
    description: row.description != null ? String(row.description) : null,
    show_on_home: row.show_on_home != null ? Boolean(row.show_on_home) : null,
    home_order: typeof row.home_order === "number" ? row.home_order : null,
    published: row.published != null ? Boolean(row.published) : null,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : null,
    source_file: row.source_file != null ? String(row.source_file) : null,
    source_route: row.source_route != null ? String(row.source_route) : null,
    created_at: row.created_at != null ? String(row.created_at) : null,
    updated_at: row.updated_at != null ? String(row.updated_at) : null,
  };
}

export type ScheduleReadSource = "supabase" | "mock";

export type ScheduleReadResult = {
  records: ScheduleRecord[];
  source: ScheduleReadSource;
  error?: string;
};

export async function loadSchedulesForDryRunUi(options: {
  url: string;
  anonKey: string;
  useSupabase: boolean;
}): Promise<ScheduleReadResult> {
  if (!options.useSupabase || !options.url || !options.anonKey) {
    return {
      records: [...SCHEDULE_DRY_RUN_MOCK_RECORDS],
      source: "mock",
      error: options.useSupabase
        ? "Supabase config missing — using mock schedules."
        : undefined,
    };
  }

  try {
    const client = getStagingSupabaseClient(options.url, options.anonKey);
    const { data, error } = await client
      .from("schedules")
      .select(SCHEDULE_DRY_RUN_SELECT)
      .order("date", { ascending: true })
      .limit(READ_LIMIT);

    if (error) {
      return {
        records: [...SCHEDULE_DRY_RUN_MOCK_RECORDS],
        source: "mock",
        error: `Supabase read failed (${error.message}) — using mock schedules.`,
      };
    }

    const records = ((data ?? []) as Record<string, unknown>[])
      .map(mapRow)
      .filter((r) => r.id && r.date);

    if (records.length === 0) {
      return {
        records: [...SCHEDULE_DRY_RUN_MOCK_RECORDS],
        source: "mock",
        error: "No schedule rows returned — using mock schedules.",
      };
    }

    return { records, source: "supabase" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      records: [...SCHEDULE_DRY_RUN_MOCK_RECORDS],
      source: "mock",
      error: `Schedule read error (${message}) — using mock schedules.`,
    };
  }
}

export function splitSchedulesByDate(
  records: ScheduleRecord[],
  todayIso?: string,
): { upcoming: ScheduleRecord[]; past: ScheduleRecord[] } {
  const today = todayIso ?? new Date().toISOString().slice(0, 10);
  const upcoming: ScheduleRecord[] = [];
  const past: ScheduleRecord[] = [];

  for (const row of records) {
    if (row.date >= today) {
      upcoming.push(row);
    } else {
      past.push(row);
    }
  }

  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  past.sort((a, b) => b.date.localeCompare(a.date));

  return { upcoming, past };
}
