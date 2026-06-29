/**
 * G-16a — Gosaki Discography artist non-dry-run Save enablement (staging shell).
 * G-17b: config delegates to scalar slice registry / generic builder.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import {
  getDiscographyScalarSliceSaveConfig,
  evaluateDiscographyScalarSliceOperatorSaveUiGate,
} from "./discography-scalar-field-save-config";
import {
  getDiscographyScalarSliceRegistryEntry,
  G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV,
  G16A_DISCOGRAPHY_SAVE_ENABLED_ENV,
} from "./discography-scalar-field-slice-registry";
import {
  applyG16aDiscographySavePageConfigToEnv,
  readG16aDiscographySavePageConfigFromDom,
} from "./gosaki-discography-g16a-artist-save-page-config";
import { G16A_PHASE } from "./gosaki-discography-g16a-next-field-types";

export { G16A_PHASE };
export { G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV, G16A_DISCOGRAPHY_SAVE_ENABLED_ENV };

export const G16A_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON =
  "Save disabled by default. Arm G-16a env stack for operator non-dry-run Save.";

export const G16A_DISCOGRAPHY_EXPECTED_SUPABASE_HOST =
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST;

export const G16A_DISCOGRAPHY_EXPECTED_PROJECT = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT;

const G16A_REGISTRY_ENTRY = getDiscographyScalarSliceRegistryEntry("g16a-artist");

export type G16aDiscographyArtistSaveConfig = {
  phase: typeof G16A_PHASE;
  approvalId: typeof G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV;
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

export function getG16aDiscographyArtistSaveConfig(
  env: ImportMetaEnv = import.meta.env,
): G16aDiscographyArtistSaveConfig {
  let mergedEnv = mergeStagingShellEnv(env);
  const pageConfig = readG16aDiscographySavePageConfigFromDom();
  if (pageConfig) {
    mergedEnv = applyG16aDiscographySavePageConfigToEnv(mergedEnv, pageConfig);
  }
  return getDiscographyScalarSliceSaveConfig(
    G16A_REGISTRY_ENTRY,
    mergedEnv,
  ) as G16aDiscographyArtistSaveConfig;
}

export function resolveG16aDiscographyArtistSaveEnabled(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  return getG16aDiscographyArtistSaveConfig(env).saveEnabled;
}

export type G16aDiscographyOperatorSaveUiGate = {
  enabled: boolean;
  reason: string;
};

export function evaluateG16aDiscographyOperatorSaveUiGate(input: {
  signedIn: boolean;
  dryRunOk: boolean;
  stale: boolean;
  saveReadiness: string;
}): G16aDiscographyOperatorSaveUiGate {
  return evaluateDiscographyScalarSliceOperatorSaveUiGate(G16A_REGISTRY_ENTRY, input);
}
