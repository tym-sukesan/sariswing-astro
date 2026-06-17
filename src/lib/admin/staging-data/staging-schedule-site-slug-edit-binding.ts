/**
 * G-9g1 / G-9g2 / G-9g3a — Staging shell Gosaki site_slug schedule edit binding (SSR).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import { getG9G2TitlePocConfig } from "./staging-schedule-site-slug-title-poc-config";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
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
  G9G2_PHASE,
  G9G2_TITLE_NON_DRY_RUN_APPROVAL_ID,
  G9G2_TITLE_POC_DEFAULT_TITLE,
  G9G3A_PHASE,
  SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";

export type SiteSlugScheduleEditBindingSource = "supabase" | "unavailable";

export interface SiteSlugScheduleEditBinding {
  phase: string;
  g9g3aPhase: string;
  approvalId: string;
  g9g2Phase: string;
  g9g2ApprovalId: string;
  g9g2DefaultTitle: string;
  g9g2Armed: boolean;
  g9g2SaveEnabled: boolean;
  g9g2ArmFailureReason?: string;
  g9g2ArmEnv: string;
  g9g3aSaveUiHidden: boolean;
  siteSlug: string;
  targetId: string;
  legacyId: string;
  safeFields: readonly string[];
  initialUiSlice: "safe-fields";
  source: SiteSlugScheduleEditBindingSource;
  targetRow: ScheduleRecord | null;
  message?: string;
  dryRunPreviewOnly: boolean;
  dataReadEnabled: boolean;
  supabaseHost?: string;
  activeHost: string;
  expectedHost: string;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  isKnownProductionHost: boolean;
  expectedProject: string;
}

export async function resolveGosakiScheduleSiteSlugEditBinding(): Promise<SiteSlugScheduleEditBinding> {
  const dataConfig = getReadOnlyDataConfig();
  const g9g2Config = getG9G2TitlePocConfig();
  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  const hostGate = evaluateSupabaseHostGate(dataConfig.supabaseUrl);

  const base = {
    phase: G9G3A_PHASE,
    g9g3aPhase: G9G3A_PHASE,
    approvalId: G9G1_DRY_RUN_APPROVAL_ID,
    g9g2Phase: G9G2_PHASE,
    g9g2ApprovalId: G9G2_TITLE_NON_DRY_RUN_APPROVAL_ID,
    g9g2DefaultTitle: G9G2_TITLE_POC_DEFAULT_TITLE,
    g9g2Armed: g9g2Config.armed,
    g9g2SaveEnabled: false,
    g9g2ArmFailureReason: g9g2Config.armFailureReason,
    g9g2ArmEnv: SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV,
    g9g3aSaveUiHidden: true,
    siteSlug,
    targetId: G9G1_TARGET_ROW_ID,
    legacyId: G9G1_TARGET_LEGACY_ID,
    safeFields: SITE_SLUG_EDIT_SAFE_FIELDS,
    initialUiSlice: "safe-fields" as const,
    dryRunPreviewOnly: true,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    activeHost: hostGate.activeHost,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    isKnownProductionHost: hostGate.isKnownProductionHost,
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
      message: "Staging shell disabled — edit section unavailable.",
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
      message: "Supabase URL/anon key missing — edit section unavailable.",
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

  const hostNote = hostGate.hostGatePassed
    ? "host gate passed"
    : "host gate failed — Save blocked";

  return {
    ...base,
    source: "supabase",
    targetRow: result.row,
    message: `Target row loaded — G-9g3a multi-field dry-run only (${hostNote}).`,
  };
}
