/**
 * G-6-f2 — ScheduleAdminUi read-only data binding (staging shell SSR).
 * SELECT only via loadSchedulesForDryRunUi. No writes.
 */

import { getReadOnlyDataConfig } from "../staging-data/read-only-data-config";
import {
  extractSupabaseHost,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import type { ScheduleRecord } from "./schedule-dry-run-types";
import { loadSchedulesForDryRunUi } from "./staging-schedule-read";

export type ScheduleAdminReadSource = "static" | "supabase" | "mock";

export interface ScheduleAdminItemBinding {
  id: string;
  date: string;
  title: string;
  venue?: string;
  published: boolean;
  image_url?: string;
  home_image_url?: string;
  sort_order?: number;
  deleted?: boolean;
  dateConflict?: boolean;
  legacy_id?: string | null;
  descriptionPreview?: string | null;
}

export interface ScheduleAdminUiBindingResult {
  items: ScheduleAdminItemBinding[];
  source: ScheduleAdminReadSource;
  message?: string;
  recordCount: number;
  dataReadEnabled: boolean;
  supabaseHost?: string;
  expectedProject: string;
  expectedHost: string;
  selectOnly: true;
}

function truncate(value: string | null | undefined, max = 48): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function mapScheduleRecordToAdminItem(row: ScheduleRecord): ScheduleAdminItemBinding {
  return {
    id: row.id,
    legacy_id: row.legacy_id ?? null,
    date: row.date,
    title: row.title != null && row.title !== "" ? String(row.title) : "—",
    venue: row.venue != null ? String(row.venue) : "",
    published: row.published === true,
    sort_order: typeof row.sort_order === "number" ? row.sort_order : undefined,
    descriptionPreview: truncate(row.description),
  };
}

export async function resolveScheduleAdminUiBinding(
  staticFallback: ScheduleAdminItemBinding[],
): Promise<ScheduleAdminUiBindingResult> {
  const dataConfig = getReadOnlyDataConfig();
  const expectedProject = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT;
  const expectedHost = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST;
  const supabaseHost = dataConfig.supabaseUrl
    ? extractSupabaseHost(dataConfig.supabaseUrl)
    : undefined;

  const base = {
    expectedProject,
    expectedHost,
    supabaseHost,
    selectOnly: true as const,
    dataReadEnabled: dataConfig.supabaseDataEnabled,
  };

  if (!dataConfig.stagingShellEnabled) {
    return {
      ...base,
      items: staticFallback,
      source: "static",
      recordCount: staticFallback.length,
      message: "Staging shell disabled — static prototype fixtures.",
    };
  }

  if (!dataConfig.dataReadFlag || dataConfig.provider !== "supabase") {
    return {
      ...base,
      items: staticFallback,
      source: "static",
      recordCount: staticFallback.length,
      message:
        "ENABLE_ADMIN_STAGING_DATA_READ + PUBLIC_ADMIN_DATA_PROVIDER=supabase not set — static fixtures.",
    };
  }

  if (!dataConfig.supabaseConfigured) {
    return {
      ...base,
      items: staticFallback,
      source: "static",
      recordCount: staticFallback.length,
      message: "Supabase URL/anon key missing — static fixtures.",
    };
  }

  const result = await loadSchedulesForDryRunUi({
    url: dataConfig.supabaseUrl,
    anonKey: dataConfig.supabaseAnonKey,
    useSupabase: true,
  });

  if (result.source === "supabase" && result.records.length > 0) {
    const items = result.records.map(mapScheduleRecordToAdminItem);
    return {
      ...base,
      items,
      source: "supabase",
      recordCount: items.length,
      message: result.error,
    };
  }

  const fallbackItems =
    result.records.length > 0
      ? result.records.map(mapScheduleRecordToAdminItem)
      : staticFallback;

  return {
    ...base,
    items: fallbackItems,
    source: result.source === "supabase" ? "supabase" : "mock",
    recordCount: fallbackItems.length,
    message:
      result.error ??
      (result.source === "mock"
        ? "Supabase read fell back to mock schedules."
        : "No schedule rows — using fallback fixtures."),
  };
}
