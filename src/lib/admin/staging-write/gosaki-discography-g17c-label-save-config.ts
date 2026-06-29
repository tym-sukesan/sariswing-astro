/**
 * G-17c — Gosaki Discography label non-dry-run Save enablement (staging shell).
 * G-17b: config delegates to scalar slice registry / generic builder.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import {
  getDiscographyScalarSliceSaveConfig,
  evaluateDiscographyScalarSliceOperatorSaveUiGate,
  type DiscographyScalarSliceSaveConfig,
} from "./discography-scalar-field-save-config";
import {
  getDiscographyScalarSliceRegistryEntry,
  G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_ARMED_ENV,
  G17C_DISCOGRAPHY_SAVE_ENABLED_ENV,
} from "./discography-scalar-field-slice-registry";
import { G17C_PHASE } from "./gosaki-discography-g17c-next-field-types";

export { G17C_PHASE };
export { G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_ARMED_ENV, G17C_DISCOGRAPHY_SAVE_ENABLED_ENV };

export const G17C_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON =
  "Save disabled by default. Arm G-17c env stack for operator non-dry-run Save.";

export const G17C_DISCOGRAPHY_EXPECTED_SUPABASE_HOST =
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST;

export const G17C_DISCOGRAPHY_EXPECTED_PROJECT = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT;

const G17C_REGISTRY_ENTRY = getDiscographyScalarSliceRegistryEntry("g17c-label");

export type G17cDiscographyLabelSaveConfig = DiscographyScalarSliceSaveConfig & {
  phase: typeof G17C_PHASE;
  approvalId: typeof G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_ARMED_ENV;
};

export function getG17cDiscographyLabelSaveConfig(
  env: ImportMetaEnv = import.meta.env,
): G17cDiscographyLabelSaveConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  return getDiscographyScalarSliceSaveConfig(
    G17C_REGISTRY_ENTRY,
    mergedEnv,
  ) as G17cDiscographyLabelSaveConfig;
}

export function resolveG17cDiscographyLabelSaveEnabled(
  env: ImportMetaEnv = import.meta.env,
): boolean {
  return getG17cDiscographyLabelSaveConfig(env).saveEnabled;
}

export type G17cDiscographyOperatorSaveUiGate = {
  enabled: boolean;
  reason: string;
};

export function evaluateG17cDiscographyOperatorSaveUiGate(input: {
  signedIn: boolean;
  dryRunOk: boolean;
  stale: boolean;
  saveReadiness: string;
}): G17cDiscographyOperatorSaveUiGate {
  return evaluateDiscographyScalarSliceOperatorSaveUiGate(G17C_REGISTRY_ENTRY, input);
}
