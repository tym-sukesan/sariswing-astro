/**
 * G-18g2 — Gosaki Discography tracklist single-title Save config (staging shell).
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
import { G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID } from "./discography-tracks-write-types";
import {
  G18G2_PHASE,
  G18G2_TARGET_LEGACY_ID,
} from "./gosaki-discography-g18g2-tracklist-title-types";

export const G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_DISCOGRAPHY_G18G2_TRACKLIST_TITLE_NON_DRY_RUN_ARMED" as const;

export const G18G2_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON =
  "Save disabled by default. Arm G-18g2 env stack for operator non-dry-run Save.";

export const G18G2_DISCOGRAPHY_DRY_RUN_BLOCKS_WRITE_REASON =
  "PUBLIC_ADMIN_WRITE_DRY_RUN=true — actual write blocked.";

export type GosakiDiscographyG18g2TracklistTitleSaveConfig = {
  phase: typeof G18G2_PHASE;
  approvalId: typeof G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV;
  targetLegacyId: typeof G18G2_TARGET_LEGACY_ID;
  saveEnabled: boolean;
  envArmArmed: boolean;
  dryRun: boolean;
  armFailureReason: string | null;
  defaultDisabledReason: typeof G18G2_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON;
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
};

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

function isEnvArmTrue(env: ImportMetaEnv): boolean {
  return (
    String(env[G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV] ?? "")
      .trim()
      .toLowerCase() === "true"
  );
}

export function getGosakiDiscographyG18g2TracklistTitleSaveConfig(
  env: ImportMetaEnv = import.meta.env,
): GosakiDiscographyG18g2TracklistTitleSaveConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingDataReadEnabled = mergedEnv.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const envArmArmed = isEnvArmTrue(mergedEnv);
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
    armFailureReason = G18G2_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON;
  } else if (dryRun) {
    armFailureReason = G18G2_DISCOGRAPHY_DRY_RUN_BLOCKS_WRITE_REASON;
  } else if (!baseGatesOk) {
    armFailureReason = "G-18g2 Save gates not satisfied (staging shell / host / project).";
  }

  const saveEnabled = envArmArmed && !dryRun && baseGatesOk;

  return {
    phase: G18G2_PHASE,
    approvalId: G18G2_DISCOGRAPHY_TRACKLIST_SINGLE_TITLE_NON_DRY_RUN_APPROVAL_ID,
    envArm: G18G2_DISCOGRAPHY_TRACKLIST_TITLE_NON_DRY_RUN_ARMED_ENV,
    targetLegacyId: G18G2_TARGET_LEGACY_ID,
    saveEnabled,
    envArmArmed,
    dryRun,
    armFailureReason,
    defaultDisabledReason: G18G2_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON,
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
  };
}

export type G18g2DiscographyOperatorSaveUiGate = {
  enabled: boolean;
  reason: string;
};

export function evaluateG18g2DiscographyOperatorSaveUiGate(input: {
  signedIn: boolean;
  dryRunOk: boolean;
  saveReadiness: string;
}): G18g2DiscographyOperatorSaveUiGate {
  const config = getGosakiDiscographyG18g2TracklistTitleSaveConfig();
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
  if (
    input.saveReadiness !== "ready_to_save" &&
    input.saveReadiness !== "ready_but_not_armed"
  ) {
    return {
      enabled: false,
      reason: `Save readiness is ${input.saveReadiness}.`,
    };
  }
  return { enabled: true, reason: "G-18g2 tracklist title Save armed." };
}
