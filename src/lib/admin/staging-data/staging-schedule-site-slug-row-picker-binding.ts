/**
 * G-9g3f1 — Staging shell Gosaki site_slug schedule row picker binding (SSR, read-only).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import {
  deriveMonthOptions,
  splitSelectableAndAuditRows,
} from "./staging-schedule-site-slug-row-picker-utils";
import {
  extractSupabaseHost,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "../staging-write/schedule-non-dry-run-poc-config";
import { loadSchedulesForSiteSlugRead } from "../staging-write/staging-schedule-read";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G1_TARGET_ROW_ID,
  G9G3F1_PHASE,
  GOSAKI_STAGING_CANONICAL_ROUTE_PREFIX,
  GOSAKI_STAGING_EXPECTED_MONTHS,
  POC_AUDIT_STAGING_MARKER,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";

export type SiteSlugRowPickerSource = "supabase" | "unavailable";

export interface SiteSlugScheduleRowPickerBinding {
  phase: typeof G9G3F1_PHASE;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  source: SiteSlugRowPickerSource;
  readOnly: true;
  selectOnly: true;
  rowPickerReadOnly: true;
  generalEditBindingDeferred: true;
  selectableRows: ScheduleRecord[];
  auditRows: ScheduleRecord[];
  rowCount: number;
  selectableCount: number;
  auditCount: number;
  monthOptions: string[];
  message?: string;
  dataReadEnabled: boolean;
  supabaseHost?: string;
  expectedProject: string;
  expectedHost: string;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  pilotRowId: typeof G9G1_TARGET_ROW_ID;
  pocAuditMarker: typeof POC_AUDIT_STAGING_MARKER;
}

export async function resolveGosakiScheduleSiteSlugRowPickerBinding(): Promise<SiteSlugScheduleRowPickerBinding> {
  const dataConfig = getReadOnlyDataConfig();
  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  const hostGate = evaluateSupabaseHostGate(dataConfig.supabaseUrl);

  const base = {
    phase: G9G3F1_PHASE,
    siteSlug,
    readOnly: true as const,
    selectOnly: true as const,
    rowPickerReadOnly: true as const,
    generalEditBindingDeferred: true as const,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    supabaseHost: dataConfig.supabaseUrl
      ? extractSupabaseHost(dataConfig.supabaseUrl)
      : undefined,
    dataReadEnabled: dataConfig.supabaseDataEnabled,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    pilotRowId: G9G1_TARGET_ROW_ID,
    pocAuditMarker: POC_AUDIT_STAGING_MARKER,
    selectableRows: [] as ScheduleRecord[],
    auditRows: [] as ScheduleRecord[],
    rowCount: 0,
    selectableCount: 0,
    auditCount: 0,
    monthOptions: [] as string[],
  };

  if (!dataConfig.stagingShellEnabled) {
    return {
      ...base,
      source: "unavailable",
      message: "Staging shell disabled — row picker unavailable.",
    };
  }

  if (!dataConfig.dataReadFlag || dataConfig.provider !== "supabase") {
    return {
      ...base,
      source: "unavailable",
      message:
        "ENABLE_ADMIN_STAGING_DATA_READ + PUBLIC_ADMIN_DATA_PROVIDER=supabase required.",
    };
  }

  if (!dataConfig.supabaseConfigured) {
    return {
      ...base,
      source: "unavailable",
      message: "Supabase URL/anon key missing — row picker unavailable.",
    };
  }

  const result = await loadSchedulesForSiteSlugRead({
    url: dataConfig.supabaseUrl,
    anonKey: dataConfig.supabaseAnonKey,
    siteSlug,
    useSupabase: true,
    canonicalRoutePrefix: GOSAKI_STAGING_CANONICAL_ROUTE_PREFIX,
    months: GOSAKI_STAGING_EXPECTED_MONTHS,
    publishedFilter: "all",
  });

  const rows = result.records;
  const { selectableRows, auditRows } = splitSelectableAndAuditRows(rows);
  const monthOptions = deriveMonthOptions([...selectableRows, ...auditRows]);

  return {
    ...base,
    source: result.source === "supabase" && rows.length > 0 ? "supabase" : "unavailable",
    selectableRows,
    auditRows,
    rowCount: rows.length,
    selectableCount: selectableRows.length,
    auditCount: auditRows.length,
    monthOptions,
    message:
      result.error ??
      (rows.length > 0
        ? "Read-only row picker — SELECT site_slug scope only."
        : "No schedule rows for row picker."),
  };
}
