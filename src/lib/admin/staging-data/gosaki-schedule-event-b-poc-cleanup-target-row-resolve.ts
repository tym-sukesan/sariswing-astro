/**
 * G-13c2d1 — G-13c2 Event B fixed target row resolve (read-only SELECT; fixed id).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "./staging-schedule-site-slug-config";
import {
  G13C2_EVENT_B_POC_CLEANUP_TARGET_LEGACY_ID,
  G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID,
} from "../staging-write/gosaki-schedule-event-b-poc-cleanup-config";
import { assertG13c2EventBPocCleanupWritableRow } from "../staging-write/gosaki-schedule-event-b-poc-cleanup-guards";
import { loadScheduleRowForSiteSlugRead } from "../staging-write/staging-schedule-read";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";

export const G13C2D1_TARGET_ROW_RESOLVE_PHASE =
  "G-13c2d1-gosaki-schedule-event-b-poc-cleanup-target-row-resolve";

export type G13c2EventBPocCleanupTargetRowResolveResult =
  | { ok: true; row: ScheduleRecord; source: "supabase" }
  | { ok: false; errorMessage: string };

/**
 * Load Event B by fixed id + legacy_id + site_slug (SELECT only).
 * Does not use operator row picker binding rows.
 */
export async function resolveG13c2EventBPocCleanupTargetRow(): Promise<G13c2EventBPocCleanupTargetRowResolveResult> {
  const dataConfig = getReadOnlyDataConfig();

  if (!dataConfig.supabaseDataEnabled) {
    return {
      ok: false,
      errorMessage:
        "ENABLE_ADMIN_STAGING_DATA_READ + PUBLIC_ADMIN_DATA_PROVIDER=supabase required for Event B row read.",
    };
  }

  if (!dataConfig.supabaseConfigured) {
    return {
      ok: false,
      errorMessage: "Supabase URL/anon key missing — Event B row read unavailable.",
    };
  }

  const result = await loadScheduleRowForSiteSlugRead({
    url: dataConfig.supabaseUrl,
    anonKey: dataConfig.supabaseAnonKey,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    targetId: G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID,
    legacyId: G13C2_EVENT_B_POC_CLEANUP_TARGET_LEGACY_ID,
    useSupabase: true,
  });

  if (!result.row || result.source !== "supabase") {
    return {
      ok: false,
      errorMessage:
        result.error ??
        `Event B row (${G13C2_EVENT_B_POC_CLEANUP_TARGET_ROW_ID}) not found for site_slug read.`,
    };
  }

  try {
    assertG13c2EventBPocCleanupWritableRow(result.row);
  } catch (error) {
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  return { ok: true, row: result.row, source: "supabase" };
}
