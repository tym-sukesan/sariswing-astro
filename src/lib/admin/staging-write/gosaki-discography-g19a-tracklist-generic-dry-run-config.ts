/**
 * G-19a — Generic tracklist textarea dry-run config (all albums; Save always disabled).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  G19A_PHASE,
  G19A_TRACKLIST_DRY_RUN_APPROVAL_ID,
  G18G2_TRACKLIST_SAVE_CHAIN_CLOSED,
} from "./gosaki-discography-g19a-tracklist-generic-types";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";

export const G19A_TRACKLIST_SAVE_DISABLED_REASON =
  "G-19a generic tracklist diff — Save disabled; dry-run Preview only.";

export const G19A_TRACKLIST_DRY_RUN_PREVIEW_ENABLED = true as const;

export const G19A_TRACKLIST_SAVE_ENABLED = false as const;

export interface GosakiDiscographyG19aTracklistDryRunConfig {
  phase: typeof G19A_PHASE;
  approvalId: typeof G19A_TRACKLIST_DRY_RUN_APPROVAL_ID;
  siteSlug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  tracklistPreviewEnabled: true;
  saveEnabled: false;
  dbWriteEnabled: false;
  g18g2SaveChainClosed: typeof G18G2_TRACKLIST_SAVE_CHAIN_CLOSED;
  defaultDisabledReason: typeof G19A_TRACKLIST_SAVE_DISABLED_REASON;
  dryRun: boolean;
  hostGatePassed: boolean;
  hostGateWarning?: string;
  projectAllowlistPassed: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
}

export function getGosakiDiscographyG19aTracklistDryRunConfig(
  env: ImportMetaEnv = import.meta.env,
): GosakiDiscographyG19aTracklistDryRunConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const hostGate = evaluateSupabaseHostGate(String(mergedEnv.PUBLIC_SUPABASE_URL ?? ""));
  const projectGate = evaluateStagingProjectAllowlist(
    String(mergedEnv.PUBLIC_SUPABASE_URL ?? ""),
  );

  return {
    phase: G19A_PHASE,
    approvalId: G19A_TRACKLIST_DRY_RUN_APPROVAL_ID,
    siteSlug: GOSAKI_DISCOGRAPHY_SITE_SLUG,
    tracklistPreviewEnabled: G19A_TRACKLIST_DRY_RUN_PREVIEW_ENABLED,
    saveEnabled: G19A_TRACKLIST_SAVE_ENABLED,
    dbWriteEnabled: false,
    g18g2SaveChainClosed: G18G2_TRACKLIST_SAVE_CHAIN_CLOSED,
    defaultDisabledReason: G19A_TRACKLIST_SAVE_DISABLED_REASON,
    dryRun,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    projectAllowlistPassed: projectGate.allowlistPassed,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  };
}
