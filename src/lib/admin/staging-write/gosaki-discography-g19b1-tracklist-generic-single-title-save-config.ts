/**
 * G-19b1 — Gosaki Discography generic single-title Save config (staging shell).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";
import {
  G19B1_PHASE,
  G19B1_TARGET_LEGACY_ID,
} from "./gosaki-discography-g19b1-tracklist-generic-single-title-types";
import { G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV } from "./gosaki-discography-g18g2-tracklist-title-save-config";

export const G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_DISCOGRAPHY_G19B1_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED" as const;

export const G19B1_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON =
  "Save disabled by default. Arm G-19b1 env stack for operator non-dry-run Save.";

export const G19B1_DISCOGRAPHY_DRY_RUN_BLOCKS_WRITE_REASON =
  "PUBLIC_ADMIN_WRITE_DRY_RUN=true — actual write blocked.";

export const G19B1_G18G2_SINGLE_ARM_CONFLICT_REASON =
  "Cannot arm G-18g2 and G-19b1 tracklist Save simultaneously.";

export type GosakiDiscographyG19b1TracklistTitleSaveConfig = {
  phase: typeof G19B1_PHASE;
  approvalId: typeof G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED_ENV;
  targetLegacyId: typeof G19B1_TARGET_LEGACY_ID;
  saveEnabled: boolean;
  envArmArmed: boolean;
  dryRun: boolean;
  armFailureReason: string | null;
  defaultDisabledReason: typeof G19B1_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingDataReadEnabled: boolean;
  stagingWriteFlag: boolean;
  supabaseConfigured: boolean;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  projectAllowlistPassed: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
  g18g2ArmConflict: boolean;
};

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

function isEnvArmTrue(env: ImportMetaEnv, key: string): boolean {
  return String(env[key] ?? "").trim().toLowerCase() === "true";
}

export function getGosakiDiscographyG19b1TracklistTitleSaveConfig(
  env: ImportMetaEnv = import.meta.env,
): GosakiDiscographyG19b1TracklistTitleSaveConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingDataReadEnabled = mergedEnv.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const envArmArmed = isEnvArmTrue(
    mergedEnv,
    G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED_ENV,
  );
  const g18g2ArmConflict = isEnvArmTrue(mergedEnv, G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV);
  const dryRun = String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const hostGate = evaluateSupabaseHostGate(supabaseUrl);
  const projectGate = evaluateStagingProjectAllowlist(supabaseUrl);

  const baseGatesOk =
    dev &&
    stagingShellEnabled &&
    stagingDataReadEnabled &&
    stagingWriteFlag &&
    supabaseConfigured &&
    !productionBlocked &&
    hostGate.hostGatePassed &&
    projectGate.allowlistPassed;

  let armFailureReason: string | null = null;
  if (!envArmArmed) {
    armFailureReason = G19B1_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON;
  } else if (g18g2ArmConflict) {
    armFailureReason = G19B1_G18G2_SINGLE_ARM_CONFLICT_REASON;
  } else if (dryRun) {
    armFailureReason = G19B1_DISCOGRAPHY_DRY_RUN_BLOCKS_WRITE_REASON;
  } else if (!baseGatesOk) {
    armFailureReason = "G-19b1 Save gates not satisfied (staging shell / host / project).";
  }

  const saveEnabled = envArmArmed && !g18g2ArmConflict && !dryRun && baseGatesOk;

  return {
    phase: G19B1_PHASE,
    approvalId: G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
    envArm: G19B1_DISCOGRAPHY_TRACKLIST_GENERIC_SINGLE_TITLE_NON_DRY_RUN_ARMED_ENV,
    targetLegacyId: G19B1_TARGET_LEGACY_ID,
    saveEnabled,
    envArmArmed,
    dryRun,
    armFailureReason,
    defaultDisabledReason: G19B1_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON,
    dev,
    stagingShellEnabled,
    stagingDataReadEnabled,
    stagingWriteFlag,
    supabaseConfigured,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    projectAllowlistPassed: projectGate.allowlistPassed,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    g18g2ArmConflict,
  };
}

export type G19b1DiscographyOperatorSaveUiGate = {
  enabled: boolean;
  reason: string;
};

export function evaluateG19b1DiscographyOperatorSaveUiGate(input: {
  signedIn: boolean;
  dryRunOk: boolean;
  saveReadiness: string;
}): G19b1DiscographyOperatorSaveUiGate {
  const config = getGosakiDiscographyG19b1TracklistTitleSaveConfig();
  if (!config.saveEnabled) {
    return {
      enabled: false,
      reason: config.armFailureReason ?? config.defaultDisabledReason,
    };
  }
  if (!input.signedIn) {
    return { enabled: false, reason: "Staging auth session required." };
  }
  if (!input.dryRunOk) {
    return { enabled: false, reason: "Dry-run preview must succeed before Save." };
  }
  if (input.saveReadiness !== "ready_to_save") {
    return {
      enabled: false,
      reason: `Save readiness is ${input.saveReadiness}.`,
    };
  }
  return { enabled: true, reason: "G-19b1 generic tracklist title Save armed." };
}
