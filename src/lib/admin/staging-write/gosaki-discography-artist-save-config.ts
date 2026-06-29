/**
 * G-15d — Gosaki Discography artist non-dry-run Save enablement (staging shell).
 * G-17b: config delegates to scalar slice registry / generic builder.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import {
  getDiscographyScalarSliceSaveConfig,
  evaluateDiscographyScalarSliceOperatorSaveUiGate,
} from "./discography-scalar-field-save-config";
import {
  getDiscographyScalarSliceRegistryEntry,
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV,
  G15D_DISCOGRAPHY_SAVE_ENABLED_ENV,
} from "./discography-scalar-field-slice-registry";
import {
  applyG15dDiscographySavePageConfigToEnv,
  readG15dDiscographySavePageConfigFromDom,
} from "./gosaki-discography-artist-save-page-config";
import { G15D_PHASE } from "./gosaki-discography-next-field-types";

export { G15D_PHASE };
export { G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV, G15D_DISCOGRAPHY_SAVE_ENABLED_ENV };

export const G15D_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON =
  "Save disabled by default. Arm G-15d env stack for operator non-dry-run Save.";

export const G15D_DISCOGRAPHY_EXPECTED_SUPABASE_HOST =
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST;

export const G15D_DISCOGRAPHY_EXPECTED_PROJECT = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT;

const G15D_REGISTRY_ENTRY = getDiscographyScalarSliceRegistryEntry("g15d-artist");

export type G15dDiscographyArtistSaveConfig = {
  phase: typeof G15D_PHASE;
  approvalId: typeof G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV;
  saveEnabled: boolean;
  armFailureReason: string | null;
  defaultDisabledReason: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingDataReadEnabled: boolean;
  stagingWriteFlag: boolean;
  envArmArmed: boolean;
  dryRun: boolean;
  supabaseConfigured: boolean;
  productionBlocked: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
  activeSupabaseHost: string;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  projectAllowlistPassed: boolean;
  authSessionRequired: true;
  optimisticLockRequired: true;
  optimisticLockEnabled: boolean;
  rowsAffectedMustBeOne: true;
  writeProvider: string;
  writeModule: string;
  writeApprovalIdEnv: string;
};

export function getG15dDiscographyArtistSaveConfig(
  env: ImportMetaEnv = import.meta.env,
): G15dDiscographyArtistSaveConfig {
  let mergedEnv = mergeStagingShellEnv(env);
  const pageConfig = readG15dDiscographySavePageConfigFromDom();
  if (pageConfig) {
    mergedEnv = applyG15dDiscographySavePageConfigToEnv(mergedEnv, pageConfig);
  }
  return getDiscographyScalarSliceSaveConfig(
    G15D_REGISTRY_ENTRY,
    mergedEnv,
  ) as G15dDiscographyArtistSaveConfig;
}

export function resolveG15dDiscographyArtistSaveEnabled(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  return getG15dDiscographyArtistSaveConfig(env).saveEnabled;
}

export type G15dDiscographyOperatorSaveUiGate = {
  enabled: boolean;
  reason: string;
};

export function evaluateG15dDiscographyOperatorSaveUiGate(input: {
  signedIn: boolean;
  dryRunOk: boolean;
  stale: boolean;
  saveReadiness: string;
}): G15dDiscographyOperatorSaveUiGate {
  return evaluateDiscographyScalarSliceOperatorSaveUiGate(G15D_REGISTRY_ENTRY, input);
}
