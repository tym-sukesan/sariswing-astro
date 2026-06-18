/**
 * G-9g3d — Gosaki site_slug general safe-fields edit non-dry-run PoC config (staging shell only).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV,
} from "../staging-write/schedule-general-edit-config";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "../staging-write/schedule-non-dry-run-poc-config";
import { G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID } from "../staging-write/schedule-write-types";
import {
  G9G1_TARGET_LEGACY_ID,
  G9G1_TARGET_ROW_ID,
  G9G3D_PHASE,
  SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_LEGACY_POC_UI_VISIBLE_ENV,
  STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
} from "./staging-schedule-site-slug-config";
import { evaluateSupabaseHostGate } from "./staging-schedule-site-slug-host-gate";

export interface G9G3dGeneralEditPocConfig {
  phase: typeof G9G3D_PHASE;
  approvalId: typeof G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  targetId: typeof G9G1_TARGET_ROW_ID;
  legacyId: typeof G9G1_TARGET_LEGACY_ID;
  armed: boolean;
  saveEnabled: boolean;
  armFailureReason?: string;
  legacyPoCUiVisible: boolean;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingWriteFlag: boolean;
  supabaseConfigured: boolean;
  productionBlocked: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
  activeSupabaseHost: string;
  hostGatePassed: boolean;
  hostGateWarning?: string;
}

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

export function isLegacyPoCUiVisible(env: ImportMetaEnv = import.meta.env): boolean {
  const mergedEnv = mergeStagingShellEnv(env);
  return String(mergedEnv[SCHEDULE_LEGACY_POC_UI_VISIBLE_ENV] ?? "").trim() === "true";
}

export function getG9G3dGeneralEditPocConfig(
  env: ImportMetaEnv = import.meta.env,
): G9G3dGeneralEditPocConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const armedFlagMatch =
    String(mergedEnv[SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV] ?? "").trim() ===
    "true";
  const g6g1Armed =
    String(mergedEnv[SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV] ?? "").trim() === "true";
  const g6g2Armed =
    String(mergedEnv[SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV] ?? "").trim() === "true";
  const g9g2Armed =
    String(mergedEnv[SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV] ?? "").trim() === "true";
  const g9g3bArmed =
    String(mergedEnv[SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV] ?? "").trim() ===
    "true";
  const g9g3cArmed =
    String(mergedEnv[SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV] ?? "").trim() === "true";
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const hostGate = evaluateSupabaseHostGate(supabaseUrl);
  const legacyPoCUiVisible = isLegacyPoCUiVisible(mergedEnv);

  const base = {
    phase: G9G3D_PHASE,
    approvalId: G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    targetId: G9G1_TARGET_ROW_ID,
    legacyId: G9G1_TARGET_LEGACY_ID,
    legacyPoCUiVisible,
    dev,
    stagingShellEnabled,
    stagingWriteFlag,
    supabaseConfigured,
    productionBlocked,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    activeSupabaseHost: hostGate.activeHost,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
  };

  const armFailures: string[] = [];
  if (!hostGate.hostGatePassed) {
    armFailures.push(hostGate.warningMessage ?? "Supabase host gate failed");
  }
  if (!dev) armFailures.push("DEV only");
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (providerRaw !== "supabase") {
    armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  }
  if (module !== "schedule") armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=schedule");
  if (approvalIdEnv !== G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID}`,
    );
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!armedFlagMatch) {
    armFailures.push(`${SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV}=true`);
  }
  if (g6g1Armed) armFailures.push(`${SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV} must be off`);
  if (g6g2Armed) armFailures.push(`${SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV} must be off`);
  if (g9g2Armed) armFailures.push(`${SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV} must be off`);
  if (g9g3bArmed) {
    armFailures.push(`${SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (g9g3cArmed) {
    armFailures.push(`${SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (!supabaseConfigured) armFailures.push("Supabase URL/anon key");

  const armed = armFailures.length === 0;

  return {
    ...base,
    armed,
    saveEnabled: armed,
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}
