/**
 * G-13d1b — G-13c1 Event A fixed target row resolve (read-only SELECT; not selectableRows).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "./staging-schedule-site-slug-config";
import {
  G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID,
  G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID,
} from "../staging-write/gosaki-schedule-event-a-poc-cleanup-config";
import { assertG13c1EventAPocCleanupWritableRow } from "../staging-write/gosaki-schedule-event-a-poc-cleanup-guards";
import { loadScheduleRowForSiteSlugRead } from "../staging-write/staging-schedule-read";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";

export const G13D1B_PHASE =
  "G-13d1b-gosaki-schedule-event-a-poc-cleanup-target-row-resolve-fix";

export type G13c1EventAPocCleanupTargetRowResolveResult =
  | { ok: true; row: ScheduleRecord; source: "supabase" }
  | { ok: false; errorMessage: string };

/**
 * Load Event A by fixed id + legacy_id + site_slug (SELECT only).
 * Does not use row picker `data-selectable-rows`.
 */
export async function resolveG13c1EventAPocCleanupTargetRow(): Promise<G13c1EventAPocCleanupTargetRowResolveResult> {
  const dataConfig = getReadOnlyDataConfig();

  if (!dataConfig.supabaseDataEnabled) {
    return {
      ok: false,
      errorMessage:
        "ENABLE_ADMIN_STAGING_DATA_READ + PUBLIC_ADMIN_DATA_PROVIDER=supabase required for Event A row read.",
    };
  }

  if (!dataConfig.supabaseConfigured) {
    return {
      ok: false,
      errorMessage: "Supabase URL/anon key missing — Event A row read unavailable.",
    };
  }

  const result = await loadScheduleRowForSiteSlugRead({
    url: dataConfig.supabaseUrl,
    anonKey: dataConfig.supabaseAnonKey,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    targetId: G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID,
    legacyId: G13C1_EVENT_A_POC_CLEANUP_TARGET_LEGACY_ID,
    useSupabase: true,
  });

  if (!result.row || result.source !== "supabase") {
    return {
      ok: false,
      errorMessage:
        result.error ??
        `Event A row (${G13C1_EVENT_A_POC_CLEANUP_TARGET_ROW_ID}) not found for site_slug read.`,
    };
  }

  try {
    assertG13c1EventAPocCleanupWritableRow(result.row);
  } catch (error) {
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  }

  return { ok: true, row: result.row, source: "supabase" };
}
