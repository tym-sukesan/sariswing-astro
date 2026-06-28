/**
 * G-15a2 — Gosaki Discography dry-run config (Save always disabled in this phase).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import { G15A2_DRY_RUN_SLICE_APPROVAL_ID, G15A2_PHASE } from "./gosaki-discography-dry-run-types";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";

export const G15A2_SAVE_DISABLED_DEFAULT_REASON =
  "G-15a2 Discography Save disabled — dry-run Preview only.";

export const G15A2_DISCOGRAPHY_DRY_RUN_PREVIEW_ENABLED = true as const;

/** G-15a2: non-dry-run Save must stay off. */
export const G15A2_DISCOGRAPHY_SAVE_ENABLED = false as const;

export interface GosakiDiscographyDryRunConfig {
  phase: typeof G15A2_PHASE;
  approvalId: typeof G15A2_DRY_RUN_SLICE_APPROVAL_ID;
  siteSlug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  dryRunPreviewEnabled: true;
  saveEnabled: false;
  dbWriteEnabled: false;
  defaultDisabledReason: typeof G15A2_SAVE_DISABLED_DEFAULT_REASON;
  dev: boolean;
  stagingShellEnabled: boolean;
  dataReadEnabled: boolean;
  dryRun: boolean;
  productionBlocked: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  projectAllowlistPassed: boolean;
}

export function getGosakiDiscographyDryRunConfig(
  env: ImportMetaEnv = import.meta.env,
): GosakiDiscographyDryRunConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const dataReadFlag = mergedEnv.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const provider = String(mergedEnv.PUBLIC_ADMIN_DATA_PROVIDER ?? "mock").trim();
  const dataReadEnabled =
    dev && stagingShellEnabled && dataReadFlag && provider === "supabase";
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const productionBlocked = mergedEnv.PROD === true;
  const hostGate = evaluateSupabaseHostGate(String(mergedEnv.PUBLIC_SUPABASE_URL ?? ""));
  const projectGate = evaluateStagingProjectAllowlist(
    String(mergedEnv.PUBLIC_SUPABASE_URL ?? ""),
  );

  return {
    phase: G15A2_PHASE,
    approvalId: G15A2_DRY_RUN_SLICE_APPROVAL_ID,
    siteSlug: GOSAKI_DISCOGRAPHY_SITE_SLUG,
    dryRunPreviewEnabled: G15A2_DISCOGRAPHY_DRY_RUN_PREVIEW_ENABLED,
    saveEnabled: G15A2_DISCOGRAPHY_SAVE_ENABLED,
    dbWriteEnabled: false,
    defaultDisabledReason: G15A2_SAVE_DISABLED_DEFAULT_REASON,
    dev,
    stagingShellEnabled,
    dataReadEnabled,
    dryRun,
    productionBlocked,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    projectAllowlistPassed: projectGate.allowlistPassed,
  };
}
