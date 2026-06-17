/**
 * G-9g1 — Staging shell Gosaki site_slug schedule edit dry-run binding (SSR).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import {
  extractSupabaseHost,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "../staging-write/schedule-non-dry-run-poc-config";
import { loadScheduleRowForSiteSlugRead } from "../staging-write/staging-schedule-read";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G1_DRY_RUN_APPROVAL_ID,
  G9G1_PHASE,
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";

export type SiteSlugScheduleEditBindingSource = "supabase" | "unavailable";

export interface SiteSlugScheduleEditBinding {
  phase: string;
  approvalId: string;
  siteSlug: string;
  targetId: string;
  legacyId: string;
  safeFields: readonly string[];
  /** G-9g1 initial UI slice — title input only; helper supports all safe fields. */
  initialUiSlice: "title";
  source: SiteSlugScheduleEditBindingSource;
  targetRow: ScheduleRecord | null;
  message?: string;
  dryRunOnly: true;
  saveEnabled: false;
  dataReadEnabled: boolean;
  supabaseHost?: string;
  expectedProject: string;
  expectedHost: string;
}

export async function resolveGosakiScheduleSiteSlugEditBinding(): Promise<SiteSlugScheduleEditBinding> {
  const dataConfig = getReadOnlyDataConfig();
  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;

  const base = {
    phase: G9G1_PHASE,
    approvalId: G9G1_DRY_RUN_APPROVAL_ID,
    siteSlug,
    targetId: G9G1_TARGET_ROW_ID,
    legacyId: G9G1_TARGET_LEGACY_ID,
    safeFields: SITE_SLUG_EDIT_SAFE_FIELDS,
    initialUiSlice: "title" as const,
    dryRunOnly: true as const,
    saveEnabled: false as const,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    supabaseHost: dataConfig.supabaseUrl
      ? extractSupabaseHost(dataConfig.supabaseUrl)
      : undefined,
    dataReadEnabled: dataConfig.supabaseDataEnabled,
  };

  if (!dataConfig.stagingShellEnabled) {
    return {
      ...base,
      source: "unavailable",
      targetRow: null,
      message: "Staging shell disabled — edit dry-run unavailable.",
    };
  }

  if (!dataConfig.dataReadFlag || dataConfig.provider !== "supabase") {
    return {
      ...base,
      source: "unavailable",
      targetRow: null,
      message:
        "ENABLE_ADMIN_STAGING_DATA_READ + PUBLIC_ADMIN_DATA_PROVIDER=supabase required.",
    };
  }

  if (!dataConfig.supabaseConfigured) {
    return {
      ...base,
      source: "unavailable",
      targetRow: null,
      message: "Supabase URL/anon key missing — edit dry-run unavailable.",
    };
  }

  const result = await loadScheduleRowForSiteSlugRead({
    url: dataConfig.supabaseUrl,
    anonKey: dataConfig.supabaseAnonKey,
    siteSlug,
    targetId: G9G1_TARGET_ROW_ID,
    legacyId: G9G1_TARGET_LEGACY_ID,
    useSupabase: true,
  });

  if (!result.row) {
    return {
      ...base,
      source: "unavailable",
      targetRow: null,
      message: result.error ?? "Target row not loaded for site_slug scope.",
    };
  }

  return {
    ...base,
    source: "supabase",
    targetRow: result.row,
    message: "Target row loaded — dry-run Preview only (G-9g1).",
  };
}
