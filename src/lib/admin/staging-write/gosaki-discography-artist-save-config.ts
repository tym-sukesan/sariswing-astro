/**
 * G-15d — Gosaki Discography artist non-dry-run Save enablement (staging shell).
 */

import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import {
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
} from "./discography-write-types";
import { getDiscographyOptimisticLockConfig } from "./gosaki-discography-optimistic-lock-config";
import {
  applyG15dDiscographySavePageConfigToEnv,
  readG15dDiscographySavePageConfigFromDom,
} from "./gosaki-discography-artist-save-page-config";
import { G15D_PHASE } from "./gosaki-discography-next-field-types";
import { G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV } from "./gosaki-discography-purchase-url-save-config";

export { G15D_PHASE };

export const G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED";

export const G15D_DISCOGRAPHY_SAVE_ENABLED_ENV = "G15D_DISCOGRAPHY_SAVE_ENABLED";

export const G15D_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON =
  "Save disabled by default. Arm G-15d env stack for operator non-dry-run Save.";

export const G15D_DISCOGRAPHY_EXPECTED_SUPABASE_HOST =
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST;

export const G15D_DISCOGRAPHY_EXPECTED_PROJECT = SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT;

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

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

function isEnvArmTrue(env: ImportMetaEnv, key: string): boolean {
  return String(env[key] ?? "").trim() === "true";
}

export function getG15dDiscographyArtistSaveConfig(
  env: ImportMetaEnv = import.meta.env,
): G15dDiscographyArtistSaveConfig {
  let mergedEnv = mergeStagingShellEnv(env);
  const pageConfig = readG15dDiscographySavePageConfigFromDom();
  if (pageConfig) {
    mergedEnv = applyG15dDiscographySavePageConfigToEnv(mergedEnv, pageConfig);
  }

  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingDataReadEnabled = mergedEnv.ENABLE_ADMIN_STAGING_DATA_READ === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const envArmArmed = isEnvArmTrue(mergedEnv, G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV);
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const hostGate = evaluateSupabaseHostGate(supabaseUrl);
  const projectAllowlist = evaluateStagingProjectAllowlist(supabaseUrl);
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();
  const optimisticLockEnabled = getDiscographyOptimisticLockConfig(mergedEnv).enabled;

  const base = {
    phase: G15D_PHASE,
    approvalId: G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
    envArm: G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV,
    defaultDisabledReason: G15D_DISCOGRAPHY_SAVE_DISABLED_DEFAULT_REASON,
    dev,
    stagingShellEnabled,
    stagingDataReadEnabled,
    stagingWriteFlag,
    envArmArmed,
    dryRun,
    supabaseConfigured,
    productionBlocked,
    expectedProject: G15D_DISCOGRAPHY_EXPECTED_PROJECT,
    expectedSupabaseHost: G15D_DISCOGRAPHY_EXPECTED_SUPABASE_HOST,
    activeSupabaseHost: hostGate.activeHost,
    hostGatePassed: hostGate.hostGatePassed,
    hostGateWarning: hostGate.warningMessage ?? undefined,
    projectAllowlistPassed: projectAllowlist.allowlistPassed,
    authSessionRequired: true as const,
    optimisticLockRequired: true as const,
    optimisticLockEnabled,
    rowsAffectedMustBeOne: true as const,
    writeProvider: providerRaw,
    writeModule: module,
    writeApprovalIdEnv: approvalIdEnv,
  };

  const armFailures: string[] = [];
  if (!hostGate.hostGatePassed) {
    armFailures.push(hostGate.warningMessage ?? "Supabase host gate failed");
  }
  if (!projectAllowlist.allowlistPassed) {
    armFailures.push(projectAllowlist.errorMessage ?? "Staging project allowlist failed");
  }
  if (!dev) armFailures.push("DEV only");
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingDataReadEnabled) armFailures.push("ENABLE_ADMIN_STAGING_DATA_READ");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (providerRaw !== "supabase") {
    armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  }
  if (module !== "discography") {
    armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=discography");
  }
  if (approvalIdEnv !== G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID}`,
    );
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!envArmArmed) {
    armFailures.push(`${G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV}=true`);
  }
  if (isEnvArmTrue(mergedEnv, G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV)) {
    armFailures.push(`${G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_ARMED_ENV} must be off`);
  }
  if (!optimisticLockEnabled) {
    armFailures.push(`${"PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK"}=true`);
  }
  if (!supabaseConfigured) armFailures.push("PUBLIC_SUPABASE_URL + PUBLIC_SUPABASE_ANON_KEY");

  const compileSaveEnabled =
    String(mergedEnv[G15D_DISCOGRAPHY_SAVE_ENABLED_ENV] ?? "").trim() === "true";

  const saveEnabled = compileSaveEnabled && armFailures.length === 0;

  return {
    ...base,
    saveEnabled,
    armFailureReason: armFailures.length > 0 ? armFailures.join("; ") : null,
  };
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
  const config = getG15dDiscographyArtistSaveConfig();
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
    return { enabled: false, reason: "Dry-run preview must succeed first." };
  }
  if (input.stale) {
    return { enabled: false, reason: "Stale row — refresh and re-run preview." };
  }
  if (input.saveReadiness !== "ready_to_save") {
    return { enabled: false, reason: `Save readiness: ${input.saveReadiness}` };
  }
  return { enabled: true, reason: "Ready to save (operator only)." };
}
