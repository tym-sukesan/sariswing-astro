/**
 * CMS Core v2 — Schedule TBD CREATE oneshot config (staging Path B).
 * Phase: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-implementation
 *
 * Dual arms: client PUBLIC_ + server ADMIN_ (exact "true", no trim).
 * Server arm raw value never baked into browser — SSR passes boolean only.
 */

import { isSaveArmExactTrue } from "../../../../tools/static-to-astro/scripts/lib/save-arm-utils.mjs";
import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import {
  evaluateStagingProjectAllowlist,
  evaluateSupabaseHostGate,
  SARISWING_PRODUCTION_PROJECT_REF,
  STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF,
} from "../staging-data/staging-schedule-site-slug-host-gate";
import { collectOtherRegistryEnvArmFailures } from "../staging-data/staging-schedule-single-text-field-operational-registry";
import {
  SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV,
} from "./schedule-general-edit-config";
import { collectG13c1EventAPocCleanupArmOffFailures } from "./gosaki-schedule-event-a-poc-cleanup-config";
import { collectG13c2EventBPocCleanupArmOffFailures } from "./gosaki-schedule-event-b-poc-cleanup-config";
import {
  GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV,
} from "./gosaki-schedule-existing-event-save-button-config";
import { collectG14b1aPracticalEditArmOffFailures } from "./gosaki-schedule-routine-edit-practical-save-enablement-config";
import {
  SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV,
} from "../staging-data/staging-schedule-site-slug-config";
import {
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
  SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
} from "./schedule-non-dry-run-poc-config";
import { CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID } from "./schedule-write-types";
import { TBD_CREATE_ONESHOT_PHASE } from "./gosaki-schedule-tbd-create-oneshot-guards";

/** Inline peer env name — avoid circular import with G-22e config. */
const G22E_NEW_EVENT_INSERT_ARM_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22E_NEW_EVENT_INSERT_NON_DRY_RUN_ARMED";

export const PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED";

export const ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED_ENV =
  "ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED";

export const TBD_CREATE_ONESHOT_PAGE_CONFIG_ELEMENT_ID =
  "gosaki-schedule-tbd-create-oneshot-config";

export const TBD_CREATE_ONESHOT_SAVE_DISABLED_DEFAULT_REASON =
  "TBD CREATE oneshot Save disabled — dual arms / staging / dry-run gates not satisfied.";

export type TbdCreateOneshotConfig = {
  phase: typeof TBD_CREATE_ONESHOT_PHASE;
  approvalId: typeof CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID;
  clientArmEnv: typeof PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED_ENV;
  serverArmEnv: typeof ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED_ENV;
  siteSlug: typeof STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG;
  clientArmOk: boolean;
  serverArmOk: boolean;
  dualArmOk: boolean;
  schemaSupportsTbd: boolean;
  tbdAdminUiEnabled: boolean;
  tbdWriteEnabled: boolean;
  writeDryRunExactFalse: boolean;
  armed: boolean;
  saveEnabled: boolean;
  saveAllowed: boolean;
  armFailureReason?: string;
  defaultDisabledReason: typeof TBD_CREATE_ONESHOT_SAVE_DISABLED_DEFAULT_REASON;
  stagingShellEnabled: boolean;
  stagingWriteFlag: boolean;
  supabaseConfigured: boolean;
  productionBlocked: boolean;
  expectedProject: string;
  expectedSupabaseHost: string;
  activeSupabaseHost: string;
  hostGatePassed: boolean;
  projectAllowlistPassed: boolean;
  stagingRefExact: boolean;
};

function isEnvArmExactTrue(env: ImportMetaEnv | Record<string, unknown>, key: string): boolean {
  return isSaveArmExactTrue((env as Record<string, unknown>)[key]);
}

function looksLikeProductionBlocked(env: ImportMetaEnv | Record<string, unknown>): boolean {
  const e = env as Record<string, unknown>;
  if (String(e.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return e.PROD === true;
}

/** Client arm: exact raw === "true" (no trim / case-fold). */
export function isTbdCreateClientArmExactTrue(
  env: ImportMetaEnv | Record<string, unknown>,
): boolean {
  return isEnvArmExactTrue(env, PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED_ENV);
}

/** Server arm: exact raw === "true". Never expose raw value to browser. */
export function isTbdCreateServerArmExactTrue(
  env: ImportMetaEnv | Record<string, unknown>,
): boolean {
  return isEnvArmExactTrue(env, ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED_ENV);
}

/** Mutual exclusion — call from other schedule write configs. */
export function collectTbdCreateOneshotArmOffFailures(
  env: ImportMetaEnv | Record<string, unknown>,
): string[] {
  if (isTbdCreateClientArmExactTrue(env)) {
    return [`${PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED_ENV} must be off`];
  }
  return [];
}

function collectPeerArmOffFailures(env: ImportMetaEnv | Record<string, unknown>): string[] {
  const failures: string[] = [];
  const check = (key: string) => {
    if (isEnvArmExactTrue(env, key) || String((env as Record<string, unknown>)[key] ?? "").trim() === "true") {
      failures.push(`${key} must be off`);
    }
  };
  // Peer schedule arms use Family A trim in their own configs; treat either exact or trim-true as ON for mutex.
  const peerKeys = [
    G22E_NEW_EVENT_INSERT_ARM_ENV,
    GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV,
    "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_ARMED",
    SCHEDULE_G6G1_TITLE_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G6G2_TIME_FIELDS_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV,
    SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV,
    "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22D_DUPLICATE_INSERT_NON_DRY_RUN_ARMED",
    "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22F_UNPUBLISH_UPDATE_NON_DRY_RUN_ARMED",
    "PUBLIC_ADMIN_GOSAKI_SCHEDULE_G22H_REPUBLISH_UPDATE_NON_DRY_RUN_ARMED",
    "PUBLIC_GOSAKI_SCHEDULE_SAVE_UI_ARMED",
    "GOSAKI_SCHEDULE_SAVE_ARMED",
  ];
  for (const key of peerKeys) check(key);
  failures.push(...collectOtherRegistryEnvArmFailures(env as ImportMetaEnv));
  failures.push(...collectG14b1aPracticalEditArmOffFailures(env as ImportMetaEnv));
  failures.push(...collectG13c1EventAPocCleanupArmOffFailures(env as ImportMetaEnv));
  failures.push(...collectG13c2EventBPocCleanupArmOffFailures(env as ImportMetaEnv));
  return failures;
}

export type TbdCreateOneshotConfigOptions = {
  /** SSR-baked boolean only — never pass raw server arm string from DOM. */
  serverArmOkFromSsr?: boolean;
};

export function getTbdCreateOneshotConfig(
  env: ImportMetaEnv | Record<string, unknown> = import.meta.env,
  options: TbdCreateOneshotConfigOptions = {},
): TbdCreateOneshotConfig {
  const mergedEnv = mergeStagingShellEnv(env as ImportMetaEnv) as unknown as Record<string, unknown>;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const writeDryRunExactFalse = mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN === "false";
  const supabaseUrl = String(mergedEnv.PUBLIC_SUPABASE_URL ?? "").trim();
  const supabaseAnonKey = String(mergedEnv.PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const productionBlocked =
    looksLikeProductionBlocked(mergedEnv) ||
    supabaseUrl.includes(SARISWING_PRODUCTION_PROJECT_REF);
  const stagingRefExact =
    !productionBlocked &&
    supabaseUrl.includes(STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF) &&
    evaluateStagingProjectAllowlist(supabaseUrl).allowlistPassed;
  const hostGate = evaluateSupabaseHostGate(supabaseUrl);
  const projectAllowlist = evaluateStagingProjectAllowlist(supabaseUrl);
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "");
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "");
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "");

  const clientArmOk = isTbdCreateClientArmExactTrue(mergedEnv);
  const serverArmFromEnv = isTbdCreateServerArmExactTrue(mergedEnv);
  const serverArmOk =
    typeof options.serverArmOkFromSsr === "boolean"
      ? options.serverArmOkFromSsr
      : serverArmFromEnv;
  const dualArmOk = clientArmOk && serverArmOk;

  const schemaSupportsTbd = stagingRefExact;
  const tbdAdminUiEnabled = stagingRefExact;
  const tbdWriteEnabled = dualArmOk && schemaSupportsTbd && tbdAdminUiEnabled && writeDryRunExactFalse;

  const base = {
    phase: TBD_CREATE_ONESHOT_PHASE,
    approvalId: CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID,
    clientArmEnv: PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED_ENV,
    serverArmEnv: ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED_ENV,
    siteSlug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    clientArmOk,
    serverArmOk,
    dualArmOk,
    schemaSupportsTbd,
    tbdAdminUiEnabled,
    tbdWriteEnabled,
    writeDryRunExactFalse,
    defaultDisabledReason: TBD_CREATE_ONESHOT_SAVE_DISABLED_DEFAULT_REASON,
    stagingShellEnabled,
    stagingWriteFlag,
    supabaseConfigured,
    productionBlocked,
    expectedProject: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_PROJECT,
    expectedSupabaseHost: SCHEDULE_NON_DRY_RUN_POC_EXPECTED_SUPABASE_HOST,
    activeSupabaseHost: hostGate.activeHost,
    hostGatePassed: hostGate.hostGatePassed,
    projectAllowlistPassed: projectAllowlist.allowlistPassed,
    stagingRefExact,
  };

  const armFailures: string[] = [];
  if (productionBlocked) armFailures.push("production blocked");
  if (!stagingRefExact) armFailures.push("staging project ref must be exact kmjqppxjdnwwrtaeqjta");
  if (!hostGate.hostGatePassed) {
    armFailures.push(hostGate.warningMessage ?? "Supabase host gate failed");
  }
  if (!projectAllowlist.allowlistPassed) {
    armFailures.push(projectAllowlist.errorMessage ?? "Staging project allowlist failed");
  }
  if (!clientArmOk) {
    armFailures.push(`${PUBLIC_ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ARMED_ENV}===true`);
  }
  if (!serverArmOk) {
    armFailures.push(`${ADMIN_SCHEDULE_TBD_CREATE_NON_DRY_RUN_SERVER_ARMED_ENV}===true (SSR boolean)`);
  }
  if (!schemaSupportsTbd) armFailures.push("schemaSupportsTbd");
  if (!tbdAdminUiEnabled) armFailures.push("tbdAdminUiEnabled");
  if (!tbdWriteEnabled) armFailures.push("tbdWriteEnabled");
  if (!writeDryRunExactFalse) {
    armFailures.push('PUBLIC_ADMIN_WRITE_DRY_RUN==="false"');
  }
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (providerRaw !== "supabase") {
    armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=supabase");
  }
  if (module !== "schedule") armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=schedule");
  if (approvalIdEnv !== CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID}`,
    );
  }
  if (!supabaseConfigured) armFailures.push("Supabase URL/anon key");
  armFailures.push(...collectPeerArmOffFailures(mergedEnv));

  const armed = armFailures.length === 0;
  return {
    ...base,
    armed,
    saveEnabled: armed,
    saveAllowed: armed,
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}

/**
 * SSR helper — booleans only (no server arm string).
 */
export function resolveTbdCreateOneshotPageServerConfig(
  env: ImportMetaEnv | Record<string, unknown> = import.meta.env,
): {
  clientArmOk: boolean;
  serverArmOk: boolean;
  tbdWriteEnabled: boolean;
  writeDryRunExactFalse: boolean;
  saveEnabled: boolean;
  approvalId: typeof CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID;
  stagingRefExact: boolean;
  productionBlocked: boolean;
} {
  const serverArmOk = isTbdCreateServerArmExactTrue(env);
  const config = getTbdCreateOneshotConfig(env, { serverArmOkFromSsr: serverArmOk });
  return {
    clientArmOk: config.clientArmOk,
    serverArmOk: config.serverArmOk,
    tbdWriteEnabled: config.tbdWriteEnabled,
    writeDryRunExactFalse: config.writeDryRunExactFalse,
    saveEnabled: config.saveEnabled,
    approvalId: config.approvalId,
    stagingRefExact: config.stagingRefExact,
    productionBlocked: config.productionBlocked,
  };
}

export function readTbdCreateOneshotPageConfigFromDom(
  root: ParentNode | Document = document,
): {
  clientArmOk: boolean;
  serverArmOk: boolean;
  tbdWriteEnabled: boolean;
  writeDryRunExactFalse: boolean;
  saveEnabled: boolean;
} {
  const el = root.querySelector
    ? root.querySelector(`#${TBD_CREATE_ONESHOT_PAGE_CONFIG_ELEMENT_ID}`)
    : null;
  if (!(el instanceof HTMLElement)) {
    return {
      clientArmOk: false,
      serverArmOk: false,
      tbdWriteEnabled: false,
      writeDryRunExactFalse: false,
      saveEnabled: false,
    };
  }
  const flag = (name: string) => el.getAttribute(name) === "true";
  return {
    clientArmOk: flag("data-client-arm-ok"),
    serverArmOk: flag("data-server-arm-ok"),
    tbdWriteEnabled: flag("data-tbd-write-enabled"),
    writeDryRunExactFalse: flag("data-write-dry-run-false"),
    saveEnabled: flag("data-save-enabled"),
  };
}

export function evaluateTbdCreateOneshotUiGate(input: {
  signedIn: boolean;
  dryRunPreviewOk: boolean;
  previewFingerprint: string | null;
  currentFingerprint: string | null;
  oneshotTerminal: "idle" | "in_flight" | "succeeded" | "failed" | "ambiguous";
  schemaSupportsTbd: boolean;
  tbdAdminUiEnabled: boolean;
  env?: ImportMetaEnv | Record<string, unknown>;
  serverArmOkFromSsr?: boolean;
}): { enabled: boolean; reason: string; saveAllowed: boolean } {
  const page = typeof document !== "undefined" ? readTbdCreateOneshotPageConfigFromDom() : null;
  const serverArmOkFromSsr =
    input.serverArmOkFromSsr ?? page?.serverArmOk ?? false;
  const config = getTbdCreateOneshotConfig(input.env ?? import.meta.env, {
    serverArmOkFromSsr,
  });

  if (input.oneshotTerminal !== "idle") {
    return {
      enabled: false,
      saveAllowed: false,
      reason:
        input.oneshotTerminal === "ambiguous"
          ? "結果が不明です。再クリック禁止 — exact SELECT で確認してください。"
          : "one-shot は既に実行済み / 進行中です。再実行できません。",
    };
  }
  if (!config.saveEnabled) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: config.armFailureReason ?? TBD_CREATE_ONESHOT_SAVE_DISABLED_DEFAULT_REASON,
    };
  }
  if (!input.schemaSupportsTbd || !input.tbdAdminUiEnabled) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "schemaSupportsTbd / tbdAdminUiEnabled required.",
    };
  }
  if (!config.tbdWriteEnabled) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "tbdWriteEnabled must be true.",
    };
  }
  if (!input.signedIn) {
    return { enabled: false, saveAllowed: false, reason: "Staging admin session required." };
  }
  if (!input.dryRunPreviewOk) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Dry-run preview must succeed before oneshot CREATE.",
    };
  }
  if (!input.previewFingerprint || !input.currentFingerprint) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "Preview fingerprint required.",
    };
  }
  if (input.previewFingerprint !== input.currentFingerprint) {
    return {
      enabled: false,
      saveAllowed: false,
      reason: "入力が preview 後に変更されています。再度 Dry-run してください。",
    };
  }
  return {
    enabled: true,
    saveAllowed: true,
    reason:
      "Staging one-shot CREATE: unpublished 1行を作成します（既存Scheduleは変更しません・自動cleanupなし）。",
  };
}
