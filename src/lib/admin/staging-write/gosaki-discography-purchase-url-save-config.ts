/**
 * G-15b — Gosaki Discography purchase_url non-dry-run Save enablement (staging shell).
 * G-17b: constants + config delegate to scalar slice registry / generic builder.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import {
  getDiscographyScalarSliceSaveConfig,
  evaluateDiscographyScalarSliceOperatorSaveUiGate,
} from "./discography-scalar-field-save-config";
import {
  getDiscographyScalarSliceRegistryEntry,
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV,
  G15B_DISCOGRAPHY_SAVE_ENABLED_ENV,
  G15B_PHASE,
} from "./discography-scalar-field-slice-registry";
import {
  applyG15bDiscographySavePageConfigToEnv,
  readG15bDiscographySavePageConfigFromDom,
} from "./gosaki-discography-save-page-config";

export {
  G15B_PHASE,
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV,
  G15B_DISCOGRAPHY_SAVE_ENABLED_ENV,
};

export const G15B_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON =
  "Save disabled by default. Arm G-15b env stack for operator non-dry-run Save.";

export const G15B_DISCOGRAPHY_EXPECTED_SUPABASE_HOST =
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST;

export const G15B_DISCOGRAPHY_EXPECTED_PROJECT = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT;

const G15B_REGISTRY_ENTRY = getDiscographyScalarSliceRegistryEntry("g15b-purchase-url");

export type G15bDiscographyPurchaseUrlSaveConfig = {
  phase: typeof G15B_PHASE;
  approvalId: typeof G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV;
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

export function getG15bDiscographyPurchaseUrlSaveConfig(
  env: ImportMetaEnv = import.meta.env,
): G15bDiscographyPurchaseUrlSaveConfig {
  let mergedEnv = mergeStagingShellEnv(env);
  const pageConfig = readG15bDiscographySavePageConfigFromDom();
  if (pageConfig) {
    mergedEnv = applyG15bDiscographySavePageConfigToEnv(mergedEnv, pageConfig);
  }
  return getDiscographyScalarSliceSaveConfig(
    G15B_REGISTRY_ENTRY,
    mergedEnv,
  ) as G15bDiscographyPurchaseUrlSaveConfig;
}

export function resolveG15bDiscographyPurchaseUrlSaveEnabled(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  return getG15bDiscographyPurchaseUrlSaveConfig(env).saveEnabled;
}

export type G15bDiscographyOperatorSaveUiGate = {
  enabled: boolean;
  reason: string;
};

export function evaluateG15bDiscographyOperatorSaveUiGate(input: {
  signedIn: boolean;
  dryRunOk: boolean;
  stale: boolean;
  saveReadiness: string;
}): G15bDiscographyOperatorSaveUiGate {
  return evaluateDiscographyScalarSliceOperatorSaveUiGate(G15B_REGISTRY_ENTRY, input);
}
