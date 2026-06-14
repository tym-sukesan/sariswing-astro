/**
 * G-6-f6 — Safe-fields non-dry-run PoC config (staging shell only).
 * Separate from G-6-e5 hidden trigger. Does not use EXPLICIT_RERUN.
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
  extractSupabaseHost,
} from "./schedule-non-dry-run-poc-config";
import { G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID } from "./schedule-write-types";

export const G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_PHASE =
  "G-6-f6-schedule-safe-fields-non-dry-run-poc-implementation";

/** Explicit arm gate — separate from G-6-e5 PUBLIC_ADMIN_NON_DRY_RUN_POC_EXPLICIT_RERUN */
export const SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED_ENV =
  "PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED";

export const SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_TARGET_ID_ENV =
  "PUBLIC_ADMIN_SAFE_FIELDS_NON_DRY_RUN_POC_TARGET_ID";

export interface ScheduleSafeFieldsNonDryRunPocConfig {
  phase: typeof G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_PHASE;
  approvalId: typeof G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID;
  targetId: typeof SCHEDULE_NON_DRY_RUN_POC_TARGET_ID;
  sectionVisible: boolean;
  armed: boolean;
  enabled: boolean;
  dryRun: boolean;
  serviceRoleAllowed: false;
  usesAuthenticatedUserSession: true;
  manualConfirmRequired: true;
  payloadFixed: true;
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

export function getScheduleSafeFieldsNonDryRunPocConfig(
  env: ImportMetaEnv = import.meta.env,
): ScheduleSafeFieldsNonDryRunPocConfig {
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
    String(mergedEnv[SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED_ENV] ?? "").trim() ===
    "true";
  const targetIdEnv = String(
    mergedEnv[SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_TARGET_ID_ENV] ?? "",
  ).trim();
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);

  const providerMatch = providerRaw === "supabase";
  const moduleMatch = module === "schedule";
  const approvalIdMatch = approvalIdEnv === G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID;
  const dryRunFlagMatch = dryRun === false;
  const targetIdMatch =
    targetIdEnv === SCHEDULE_NON_DRY_RUN_POC_TARGET_ID || targetIdEnv === "";

  const base = {
    phase: G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_PHASE,
    approvalId: G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
    targetId: SCHEDULE_NON_DRY_RUN_POC_TARGET_ID,
    dryRun,
    serviceRoleAllowed: false as const,
    usesAuthenticatedUserSession: true as const,
    manualConfirmRequired: true as const,
    payloadFixed: true as const,
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
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
  };

  const sectionVisible = dev && stagingShellEnabled;

  const armFailures: string[] = [];
  if (!dev) armFailures.push("DEV only");
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (!providerMatch) armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  if (!moduleMatch) armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=schedule");
  if (!approvalIdMatch) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID}`,
    );
  }
  if (!dryRunFlagMatch) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!armedFlagMatch) {
    armFailures.push(`${SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_ARMED_ENV}=true`);
  }
  if (targetIdEnv && !targetIdMatch) {
    armFailures.push(
      `${SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_TARGET_ID_ENV}=${SCHEDULE_NON_DRY_RUN_POC_TARGET_ID}`,
    );
  }
  if (!supabaseConfigured) armFailures.push("Supabase URL/anon key");

  const armed = armFailures.length === 0;

  return {
    ...base,
    sectionVisible,
    armed,
    enabled: armed,
    disabledReason: armed ? undefined : armFailures.join("; "),
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}

export function getActiveSupabaseHostFromEnv(
  env: ImportMetaEnv = import.meta.env,
): string {
  const url = String(mergeStagingShellEnv(env).PUBLIC_SUPABASE_URL ?? "").trim();
  return extractSupabaseHost(url);
}
