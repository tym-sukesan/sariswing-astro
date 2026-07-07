/**
 * G-22h3 — Gosaki Schedule republish UPDATE config (dry-run UI only; Save disabled until G-22h6).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import type { G22hScheduleRepublishDryRunResult } from "./gosaki-schedule-republish-dry-run";
import { G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22H3_REPUBLISH_CONFIG_PHASE =
  "G-22h3-gosaki-schedule-republish-dry-run-ui-implementation";

export const GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED";

export const G22H_REPUBLISH_UPDATE_SAVE_DISABLED_G22H3_REASON =
  "再公開の保存は現在無効です。G-22h6以降で、戸山が確認してから有効化します。";

export interface G22hRepublishUpdateConfig {
  phase: typeof G22H3_REPUBLISH_CONFIG_PHASE;
  approvalId: typeof G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID;
  envArm: typeof GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  armed: boolean;
  saveEnabled: false;
  saveAllowed: false;
  defaultDisabledReason: typeof G22H_REPUBLISH_UPDATE_SAVE_DISABLED_G22H3_REASON;
}

function isEnvArmTrue(env: ImportMetaEnv, key: string): boolean {
  return String(env[key] ?? "").trim() === "true";
}

/** Mutual exclusion — call from other schedule write configs. */
export function collectG22hRepublishUpdateArmOffFailures(env: ImportMetaEnv): string[] {
  if (isEnvArmTrue(env, GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV)) {
    return [`${GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV} must be off`];
  }
  return [];
}

export function isG22hRepublishUpdateEnvArmTrue(env: ImportMetaEnv): boolean {
  return isEnvArmTrue(env, GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV);
}

export function getG22hRepublishUpdateConfig(
  env: ImportMetaEnv = import.meta.env,
): G22hRepublishUpdateConfig {
  const mergedEnv = mergeStagingShellEnv(env);
  const armed = isEnvArmTrue(mergedEnv, GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV);

  return {
    phase: G22H3_REPUBLISH_CONFIG_PHASE,
    approvalId: G22H_SCHEDULE_REPUBLISH_UPDATE_NON_DRY_RUN_APPROVAL_ID,
    envArm: GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED_ENV,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    armed,
    saveEnabled: false,
    saveAllowed: false,
    defaultDisabledReason: G22H_REPUBLISH_UPDATE_SAVE_DISABLED_G22H3_REASON,
  };
}

export function evaluateG22hRepublishUpdateUiGate(input: {
  signedIn: boolean;
  republishMode: boolean;
  target: { id: string; legacy_id?: string | null; published?: boolean | null } | null;
  republishDryRunResult: G22hScheduleRepublishDryRunResult | null;
  env?: ImportMetaEnv;
}): { enabled: false; reason: string; saveAllowed: false } {
  const config = getG22hRepublishUpdateConfig(input.env ?? import.meta.env);

  if (!input.republishMode) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Republish draft mode required.",
    };
  }

  if (!input.signedIn) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Staging admin session required.",
    };
  }

  if (!input.target) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Republish target row required.",
    };
  }

  if (input.target.published !== false) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Republish target must have published=false.",
    };
  }

  if (!input.republishDryRunResult?.ok) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "再公開の保存はG-22h6以降で有効化します。現在は保存できません。",
    };
  }

  if (config.armed) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: `${config.defaultDisabledReason} (env arm is on but Save remains disabled in G-22h3.)`,
    };
  }

  return {
    enabled: false,
    saveAllowed: false,
    reason: config.defaultDisabledReason,
  };
}
