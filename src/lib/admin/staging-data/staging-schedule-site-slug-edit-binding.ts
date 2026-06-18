/**
 * G-9g1 / G-9g2 / G-9g3a / G-9g3b / G-9g3c / G-9g3d — Staging shell Gosaki site_slug schedule edit binding (SSR).
 */

import { getReadOnlyDataConfig } from "./read-only-data-config";
import { getG9G3bVenueDescriptionPocConfig } from "./staging-schedule-site-slug-venue-description-poc-config";
import { getG9G3cTimePricePocConfig } from "./staging-schedule-site-slug-time-price-poc-config";
import { getG9G3dGeneralEditPocConfig } from "./staging-schedule-site-slug-general-edit-poc-config";
import { getG9G3gOperationalGeneralEditConfig } from "./staging-schedule-site-slug-operational-general-edit-config";
import { getG9G3g5OperationalRestoreConfig } from "./staging-schedule-site-slug-operational-restore-config";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";
import {
  extractSupabaseHost,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "../staging-write/schedule-non-dry-run-poc-config";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G1_DRY_RUN_APPROVAL_ID,
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
  G9G3F3A_PHASE,
  G9G3F3B_PHASE,
  G9G3F3C_PHASE,
  G9G3G1_PHASE,
  G9G3G5B1_PHASE,
  G9G3G5_OPERATIONAL_RESTORE_DISABLED_DEFAULT_REASON,
  G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID,
  G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
  G9G3G_OPERATIONAL_SAVE_DISABLED_DEFAULT_REASON,
  SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
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
  g9g3gPhase: string;
  g9g3g5Phase: string;
  approvalId: string;
  g9g3bApprovalId: string;
  g9g3cApprovalId: string;
  g9g3dApprovalId: string;
  g9g3gApprovalId: string;
  g9g3g5ApprovalId: string;
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
  g9g3gArmed: boolean;
  g9g3gSaveEnabled: boolean;
  g9g3gArmFailureReason?: string;
  g9g3gArmEnv: string;
  g9g3gDefaultDisabledReason: string;
  g9g3g5Armed: boolean;
  g9g3g5SaveEnabled: boolean;
  g9g3g5ArmFailureReason?: string;
  g9g3g5ArmEnv: string;
  g9g3g5DefaultDisabledReason: string;
  legacyPoCUiVisible: boolean;
  g9g3aSaveUiHidden: boolean;
  pickerDrivenBinding: boolean;
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
  const g9g3gConfig = getG9G3gOperationalGeneralEditConfig();
  const g9g3g5Config = getG9G3g5OperationalRestoreConfig();
  const siteSlug = STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  const hostGate = evaluateSupabaseHostGate(dataConfig.supabaseUrl);

  const base = {
    phase: G9G3G1_PHASE,
    g9g3aPhase: G9G3A_PHASE,
    g9g3bPhase: G9G3B_PHASE,
    g9g3cPhase: G9G3C_PHASE,
    g9g3dPhase: G9G3D_PHASE,
    g9g3gPhase: G9G3G1_PHASE,
    g9g3g5Phase: G9G3G5B1_PHASE,
    approvalId: G9G1_DRY_RUN_APPROVAL_ID,
    g9g3bApprovalId: G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_APPROVAL_ID,
    g9g3cApprovalId: G9G3C_TIME_PRICE_NON_DRY_RUN_APPROVAL_ID,
    g9g3dApprovalId: G9G3D_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
    g9g3gApprovalId: G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
    g9g3g5ApprovalId: G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID,
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
    g9g3gArmed: g9g3gConfig.armed,
    g9g3gSaveEnabled: g9g3gConfig.saveEnabled && hostGate.hostGatePassed,
    g9g3gArmFailureReason: g9g3gConfig.armFailureReason,
    g9g3gArmEnv: SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
    g9g3gDefaultDisabledReason: G9G3G_OPERATIONAL_SAVE_DISABLED_DEFAULT_REASON,
    g9g3g5Armed: g9g3g5Config.armed,
    g9g3g5SaveEnabled: g9g3g5Config.saveEnabled && hostGate.hostGatePassed,
    g9g3g5ArmFailureReason: g9g3g5Config.armFailureReason,
    g9g3g5ArmEnv: SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV,
    g9g3g5DefaultDisabledReason: G9G3G5_OPERATIONAL_RESTORE_DISABLED_DEFAULT_REASON,
    legacyPoCUiVisible: g9g3dConfig.legacyPoCUiVisible,
    g9g3aSaveUiHidden: false,
    pickerDrivenBinding: true,
    siteSlug,
    targetId: "",
    legacyId: "",
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

  const hostNote = hostGate.hostGatePassed
    ? "host gate passed"
    : "host gate failed — Save blocked";

  const armNote = g9g3dConfig.pocExecuted
    ? "G-9g3d PoC executed — operational Save path added (G-9g3g1); disabled by default until G-9g3g arm"
    : "Picker-driven binding — select a non-PoC row; G-9 Preview; operational Save gated (G-9g3g1)";

  return {
    ...base,
    source: "supabase",
    targetRow: null,
    message: `${armNote} (${hostNote}).`,
  };
}
