/**
 * G-9g1 / G-9g2 / G-9g3a / G-9g3b / G-9g3c / G-9g3d — Staging shell Gosaki site_slug schedule edit binding (SSR).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import { getG9G3bVenueDescriptionPocConfig } from "./staging-schedule-site-slug-venue-description-poc-config";
import { getG9G3cTimePricePocConfig } from "./staging-schedule-site-slug-time-price-poc-config";
import { getG9G3dGeneralEditPocConfig } from "./staging-schedule-site-slug-general-edit-poc-config";
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
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  G9G3A_PHASE,
  G9G3B_DESCRIPTION_POC_DEFAULT,
  G9G3B_PHASE,
  G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_APPROVAL_ID,
  G9G3B_VENUE_POC_DEFAULT,
  G9G3C_OPEN_TIME_POC_DEFAULT,
  G9G3C_PHASE,
  G9G3C_PRICE_POC_DEFAULT,
  G9G3C_START_TIME_POC_DEFAULT,
  G9G3C_TIME_PRICE_NON_DRY_RUN_APPROVAL_ID,
  G9G3D_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
  G9G3D_GENERAL_EDIT_POC_EXECUTED,
  G9G3D_PHASE,
  G9G3E1_PHASE,
  SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";

export type SiteSlugScheduleEditBindingSource = "supabase" | "unavailable";

export interface SiteSlugScheduleEditBinding {
  phase: string;
  g9g3aPhase: string;
  g9g3bPhase: string;
  g9g3cPhase: string;
  g9g3dPhase: string;
  approvalId: string;
  g9g3bApprovalId: string;
  g9g3cApprovalId: string;
  g9g3dApprovalId: string;
  g9g3bDefaultVenue: string;
  g9g3bDefaultDescription: string;
  g9g3cDefaultOpenTime: string;
  g9g3cDefaultStartTime: string;
  g9g3cDefaultPrice: string;
  g9g3bArmed: boolean;
  g9g3bSaveEnabled: boolean;
  g9g3bArmFailureReason?: string;
  g9g3bArmEnv: string;
  g9g3cArmed: boolean;
  g9g3cSaveEnabled: boolean;
  g9g3cArmFailureReason?: string;
  g9g3cArmEnv: string;
  g9g3dArmed: boolean;
  g9g3dSaveEnabled: boolean;
  g9g3dArmFailureReason?: string;
  g9g3dArmEnv: string;
  g9g3dPocExecuted: boolean;
  legacyPoCUiVisible: boolean;
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
  const g9g3bConfig = getG9G3bVenueDescriptionPocConfig();
  const g9g3cConfig = getG9G3cTimePricePocConfig();
  const g9g3dConfig = getG9G3dGeneralEditPocConfig();
  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  const hostGate = evaluateSupabaseHostGate(dataConfig.supabaseUrl);

  const base = {
    phase: G9G3E1_PHASE,
    g9g3aPhase: G9G3A_PHASE,
    g9g3bPhase: G9G3B_PHASE,
    g9g3cPhase: G9G3C_PHASE,
    g9g3dPhase: G9G3D_PHASE,
    approvalId: G9G1_DRY_RUN_APPROVAL_ID,
    g9g3bApprovalId: G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_APPROVAL_ID,
    g9g3cApprovalId: G9G3C_TIME_PRICE_NON_DRY_RUN_APPROVAL_ID,
    g9g3dApprovalId: G9G3D_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
    g9g3bDefaultVenue: G9G3B_VENUE_POC_DEFAULT,
    g9g3bDefaultDescription: G9G3B_DESCRIPTION_POC_DEFAULT,
    g9g3cDefaultOpenTime: G9G3C_OPEN_TIME_POC_DEFAULT,
    g9g3cDefaultStartTime: G9G3C_START_TIME_POC_DEFAULT,
    g9g3cDefaultPrice: G9G3C_PRICE_POC_DEFAULT,
    g9g3bArmed: g9g3bConfig.armed,
    g9g3bSaveEnabled: g9g3bConfig.saveEnabled && hostGate.hostGatePassed,
    g9g3bArmFailureReason: g9g3bConfig.armFailureReason,
    g9g3bArmEnv: SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
    g9g3cArmed: g9g3cConfig.armed,
    g9g3cSaveEnabled: g9g3cConfig.saveEnabled && hostGate.hostGatePassed,
    g9g3cArmFailureReason: g9g3cConfig.armFailureReason,
    g9g3cArmEnv: SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
    g9g3dArmed: g9g3dConfig.armed,
    g9g3dSaveEnabled: g9g3dConfig.saveEnabled && hostGate.hostGatePassed,
    g9g3dArmFailureReason: g9g3dConfig.armFailureReason,
    g9g3dArmEnv: SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
    g9g3dPocExecuted: G9G3D_GENERAL_EDIT_POC_EXECUTED,
    legacyPoCUiVisible: g9g3dConfig.legacyPoCUiVisible,
    g9g3aSaveUiHidden: false,
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

  const armNote = g9g3dConfig.pocExecuted
    ? "G-9g3d PoC executed — Save frozen"
    : g9g3dConfig.armed
      ? "G-9g3d general edit armed — Save gated"
      : g9g3cConfig.armed
        ? "G-9g3c armed — Save gated"
        : g9g3bConfig.armed
          ? "G-9g3b armed — Save gated"
          : "G-9g3d not armed — dry-run preview only";

  return {
    ...base,
    source: "supabase",
    targetRow: result.row,
    message: `Target row loaded — ${armNote} (${hostNote}).`,
  };
}
