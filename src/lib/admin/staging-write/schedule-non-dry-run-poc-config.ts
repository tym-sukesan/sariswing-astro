/**
 * G-6-e5 — Hidden schedule non-dry-run PoC trigger env gates (staging shell only).
 * Default hidden unless every gate matches exactly.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import { SCHEDULE_WRITE_APPROVAL_ID } from "./schedule-write-types";

export const G6E5_SCHEDULE_NON_DRY_RUN_POC_PHASE =
  "G-6-e5-schedule-non-dry-run-poc-execution-path-implementation";

export const SCHEDULE_NON_DRY_RUN_POC_TARGET_ID =
  "aa440e29-5be8-402e-9190-0d81c48434c0";

export interface ScheduleNonDryRunPocConfig {
  phase: typeof G6E5_SCHEDULE_NON_DRY_RUN_POC_PHASE;
  approvalId: typeof SCHEDULE_WRITE_APPROVAL_ID;
  targetId: typeof SCHEDULE_NON_DRY_RUN_POC_TARGET_ID;
  visible: boolean;
  enabled: boolean;
  dryRun: boolean;
  serviceRoleAllowed: false;
  usesAuthenticatedUserSession: true;
  defaultVisible: false;
  manualConfirmRequired: true;
  payloadFixed: true;
  disabledReason?: string;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingWriteFlag: boolean;
  providerMatch: boolean;
  moduleMatch: boolean;
  approvalIdMatch: boolean;
  dryRunFlagMatch: boolean;
  triggerFlagMatch: boolean;
  targetIdMatch: boolean;
  supabaseConfigured: boolean;
  productionBlocked: boolean;
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

export function getScheduleNonDryRunPocConfig(
  env: ImportMetaEnv = import.meta.env,
): ScheduleNonDryRunPocConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const triggerFlagMatch =
    String(mergedEnv.PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER ?? "").trim() ===
    "true";
  const targetIdEnv = String(
    mergedEnv.PUBLIC_ADMIN_NON_DRY_RUN_POC_TARGET_ID ?? "",
  ).trim();
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);

  const providerMatch = providerRaw === "supabase";
  const moduleMatch = module === "schedule";
  const approvalIdMatch = approvalIdEnv === SCHEDULE_WRITE_APPROVAL_ID;
  const dryRunFlagMatch = dryRun === false;
  const targetIdMatch = targetIdEnv === SCHEDULE_NON_DRY_RUN_POC_TARGET_ID;

  const base = {
    phase: G6E5_SCHEDULE_NON_DRY_RUN_POC_PHASE,
    approvalId: SCHEDULE_WRITE_APPROVAL_ID,
    targetId: SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
    dryRun,
    serviceRoleAllowed: false as const,
    usesAuthenticatedUserSession: true as const,
    defaultVisible: false as const,
    manualConfirmRequired: true as const,
    payloadFixed: true as const,
    dev,
    stagingShellEnabled,
    stagingWriteFlag,
    providerMatch,
    moduleMatch,
    approvalIdMatch,
    dryRunFlagMatch,
    triggerFlagMatch,
    targetIdMatch,
    supabaseConfigured,
    productionBlocked,
  };

  const gateFailures: string[] = [];
  if (!dev) gateFailures.push("DEV only");
  if (!stagingShellEnabled) gateFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) gateFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) gateFailures.push("production blocked");
  if (!providerMatch) gateFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  if (!moduleMatch) gateFailures.push("PUBLIC_ADMIN_WRITE_MODULE=schedule");
  if (!approvalIdMatch) {
    gateFailures.push(`PUBLIC_ADMIN_WRITE_APPROVAL_ID=${SCHEDULE_WRITE_APPROVAL_ID}`);
  }
  if (!dryRunFlagMatch) gateFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!triggerFlagMatch) {
    gateFailures.push("PUBLIC_ADMIN_NON_DRY_RUN_POC_TRIGGER=true");
  }
  if (!targetIdMatch) {
    gateFailures.push(
      `PUBLIC_ADMIN_NON_DRY_RUN_POC_TARGET_ID=${SCHEDULE_NON_DRY_RUN_POC_TARGET_ID}`,
    );
  }
  if (!supabaseConfigured) gateFailures.push("Supabase URL/anon key");

  const visible = gateFailures.length === 0;

  return {
    ...base,
    visible,
    enabled: visible,
    disabledReason: visible ? undefined : gateFailures.join("; "),
  };
}
