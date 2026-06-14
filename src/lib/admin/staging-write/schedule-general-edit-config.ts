/**
 * G-6-g1 — Schedule general edit section config (staging shell only).
 * Product path — separate from G-6-e5 / G-6-f6 PoC env gates.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
  extractSupabaseHost,
} from "./schedule-non-dry-run-poc-config";
import { G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID } from "./schedule-write-types";

export const G6G1_SCHEDULE_TITLE_SLICE_PHASE =
  "G-6-g1-schedule-title-non-dry-run-slice-implementation";

export const G6G1_SCHEDULE_TITLE_DRY_RUN_PREVIEW_APPROVAL_ID =
  "G-6-g1-schedule-title-dry-run-preview";

/** Slice-specific arm gate — separate from G-6-e5 / G-6-f6 PoC env */
export const SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED";

export const SCHEDULE_SLICE_TARGET_ID_ENV =
  "PUBLIC_ADMIN_SCHEDULE_SLICE_TARGET_ID";

export const G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID =
  SCHEDULE_NON_DRY_RUN_POC_TARGET_ID;

export const G6G1_SCHEDULE_TITLE_SLICE_LEGACY_ID = "schedule-2026-07-010";

export const G6G1_SCHEDULE_TITLE_SLICE_DEFAULT_TITLE =
  "[CMS Kit staging] G-6-g1 title PoC";

export const G6G1_SCHEDULE_TITLE_SLICE_EXPECTED_VENUE =
  "[CMS Kit staging] G-6-f6 venue PoC";

export const G6G1_SCHEDULE_TITLE_SLICE_EXPECTED_DESCRIPTION =
  "出演： [G-6-e5 non-dry-run PoC] [G-6-f6 safe-fields staging test]";

export interface ScheduleGeneralEditConfig {
  phase: typeof G6G1_SCHEDULE_TITLE_SLICE_PHASE;
  approvalId: typeof G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID;
  dryRunPreviewApprovalId: typeof G6G1_SCHEDULE_TITLE_DRY_RUN_PREVIEW_APPROVAL_ID;
  targetId: typeof G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID;
  sectionVisible: boolean;
  previewEnabled: boolean;
  armed: boolean;
  saveEnabled: boolean;
  dryRun: boolean;
  serviceRoleAllowed: false;
  usesAuthenticatedUserSession: true;
  manualConfirmRequired: true;
  titleOnlyPayload: true;
  disabledReason?: string;
  armFailureReason?: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingWriteFlag: boolean;
  providerMatch: boolean;
  moduleMatch: boolean;
  approvalIdMatch: boolean;
  dryRunFlagMatch: boolean;
  armedFlagMatch: boolean;
  targetIdMatch: boolean;
  supabaseConfigured: boolean;
  productionBlocked: boolean;
  dataReadEnabled: boolean;
  canUseSupabaseRead: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
}

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  if (env.PROD === true) {
    return true;
  }
  return false;
}

export function getScheduleGeneralEditConfig(
  env: ImportMetaEnv = import.meta.env,
): ScheduleGeneralEditConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const armedFlagMatch =
    String(mergedEnv[SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV] ?? "").trim() ===
    "true";
  const targetIdEnv = String(mergedEnv[SCHEDULE_SLICE_TARGET_ID_ENV] ?? "").trim();
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const dataReadFlag = mergedEnv.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const dataProvider = String(mergedEnv.PUBLIC_ADMIN_DATA_PROVIDER ?? "mock").trim();
  const canUseSupabaseRead = Boolean(supabaseUrl && supabaseAnonKey);
  const dataReadEnabled =
    dev &&
    stagingShellEnabled &&
    dataReadFlag &&
    dataProvider === "supabase" &&
    canUseSupabaseRead;

  const providerMatch = providerRaw === "supabase";
  const moduleMatch = module === "schedule";
  const approvalIdMatch =
    approvalIdEnv === G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID;
  const dryRunFlagMatch = dryRun === false;
  const targetIdMatch =
    targetIdEnv === G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID || targetIdEnv === "";

  const base = {
    phase: G6G1_SCHEDULE_TITLE_SLICE_PHASE,
    approvalId: G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID,
    dryRunPreviewApprovalId: G6G1_SCHEDULE_TITLE_DRY_RUN_PREVIEW_APPROVAL_ID,
    targetId: G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID,
    dryRun,
    serviceRoleAllowed: false as const,
    usesAuthenticatedUserSession: true as const,
    manualConfirmRequired: true as const,
    titleOnlyPayload: true as const,
    dev,
    stagingShellEnabled,
    stagingWriteFlag,
    providerMatch,
    moduleMatch,
    approvalIdMatch,
    dryRunFlagMatch,
    armedFlagMatch,
    targetIdMatch,
    supabaseConfigured,
    productionBlocked,
    dataReadEnabled,
    canUseSupabaseRead,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  };

  const sectionVisible = dev && stagingShellEnabled;
  const previewEnabled = sectionVisible;

  const armFailures: string[] = [];
  if (!dev) armFailures.push("DEV only");
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (!providerMatch) armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  if (!moduleMatch) armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=schedule");
  if (!approvalIdMatch) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID}`,
    );
  }
  if (!dryRunFlagMatch) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!armedFlagMatch) {
    armFailures.push(`${SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV}=true`);
  }
  if (targetIdEnv && !targetIdMatch) {
    armFailures.push(
      `${SCHEDULE_SLICE_TARGET_ID_ENV}=${G6G1_SCHEDULE_TITLE_SLICE_TARGET_ID}`,
    );
  }
  if (!supabaseConfigured) armFailures.push("Supabase URL/anon key");

  const armed = armFailures.length === 0;

  return {
    ...base,
    sectionVisible,
    previewEnabled,
    armed,
    saveEnabled: armed,
    disabledReason: previewEnabled ? undefined : "General edit section requires DEV + staging shell.",
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}

export function getActiveSupabaseHostFromGeneralEditEnv(
  env: ImportMetaEnv = import.meta.env,
): string {
  const url = String(mergeStagingShellEnv(env).PUBLIC_SUPABASE_URL ?? "").trim();
  return extractSupabaseHost(url);
}
