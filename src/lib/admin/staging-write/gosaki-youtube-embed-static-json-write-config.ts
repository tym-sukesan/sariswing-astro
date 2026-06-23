/**
 * G-10c — Gosaki YouTube embed static JSON write config (staging shell only).
 */

import { mergeStagingShellEnv } from "../staging-shell/staging-shell-client-gates";
import {
  G10C_YOUTUBE_EMBED_SITE_SLUG,
  G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
  G10C_PHASE,
} from "./gosaki-youtube-embed-static-json-write-types";
import {
  applyG10cSaveButtonPageConfigToEnv,
  G10C_YOUTUBE_EMBED_SAVE_ENABLED_ENV,
  readG10cSaveButtonPageConfigFromDom,
} from "./gosaki-youtube-embed-static-json-write-page-config";

export const GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED";

export const G10C_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON =
  "G-10c YouTube embed Save disabled until explicit approval and env arm stack.";

/** G-10c: compile-time default — runtime gate uses server bridge + env. */
export const G10C_YOUTUBE_EMBED_SAVE_ENABLED = false as const;

export function isG10cSaveCompileGateEnabled(env: ImportMetaEnv): boolean {
  return String(env[G10C_YOUTUBE_EMBED_SAVE_ENABLED_ENV] ?? "").trim() === "true";
}

export interface G10cYoutubeEmbedStaticJsonWriteConfig {
  phase: typeof G10C_PHASE;
  approvalId: typeof G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID;
  siteSlug: typeof G10C_YOUTUBE_EMBED_SITE_SLUG;
  envArm: typeof GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV;
  armed: boolean;
  saveEnabled: boolean;
  armFailureReason?: string;
  defaultDisabledReason: typeof G10C_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON;
  dev: boolean;
  stagingShellEnabled: boolean;
  stagingWriteFlag: boolean;
  dryRun: boolean;
  writeProvider: string;
  writeModule: string;
  productionBlocked: boolean;
  authSessionRequired: true;
  itemsAffectedMustBeOne: true;
}

function looksLikeProductionBlocked(env: ImportMetaEnv): boolean {
  if (String(env.ADMIN_AUTH_ENV ?? "").trim().toLowerCase() === "production") {
    return true;
  }
  return env.PROD === true;
}

function isEnvArmTrue(env: ImportMetaEnv, key: string): boolean {
  return String(env[key] ?? "").trim() === "true";
}

export function getG10cYoutubeEmbedStaticJsonWriteConfig(
  env: ImportMetaEnv = import.meta.env,
): G10cYoutubeEmbedStaticJsonWriteConfig {
  let mergedEnv = mergeStagingShellEnv(env);
  const pageConfig = readG10cSaveButtonPageConfigFromDom();
  if (pageConfig) {
    mergedEnv = applyG10cSaveButtonPageConfigToEnv(mergedEnv, pageConfig);
  }

  const dev = mergedEnv.DEV === true;
  const stagingShellEnabled = mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true";
  const stagingWriteFlag = mergedEnv.ENABLE_ADMIN_STAGING_WRITE === "true";
  const armedFlagMatch = isEnvArmTrue(
    mergedEnv,
    GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV,
  );
  const dryRun =
    String(mergedEnv.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() !== "false";
  const productionBlocked = looksLikeProductionBlocked(mergedEnv);
  const providerRaw = String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim();
  const module = String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim();
  const approvalIdEnv = String(mergedEnv.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim();

  const base = {
    phase: G10C_PHASE,
    approvalId: G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID,
    siteSlug: G10C_YOUTUBE_EMBED_SITE_SLUG,
    envArm: GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV,
    defaultDisabledReason: G10C_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON,
    dev,
    stagingShellEnabled,
    stagingWriteFlag,
    dryRun,
    writeProvider: providerRaw,
    writeModule: module,
    productionBlocked,
    authSessionRequired: true as const,
    itemsAffectedMustBeOne: true as const,
  };

  const armFailures: string[] = [];
  if (!dev) armFailures.push("DEV only");
  if (!stagingShellEnabled) armFailures.push("ENABLE_ADMIN_STAGING_SHELL");
  if (!stagingWriteFlag) armFailures.push("ENABLE_ADMIN_STAGING_WRITE");
  if (productionBlocked) armFailures.push("production blocked");
  if (providerRaw !== "static-json") {
    armFailures.push("PUBLIC_ADMIN_WRITE_PROVIDER=static-json");
  }
  if (module !== "youtube-embed") {
    armFailures.push("PUBLIC_ADMIN_WRITE_MODULE=youtube-embed");
  }
  if (approvalIdEnv !== G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID) {
    armFailures.push(
      `PUBLIC_ADMIN_WRITE_APPROVAL_ID=${G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID}`,
    );
  }
  if (dryRun) armFailures.push("PUBLIC_ADMIN_WRITE_DRY_RUN=false");
  if (!armedFlagMatch) {
    armFailures.push(`${GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV}=true`);
  }
  if (!isG10cSaveCompileGateEnabled(mergedEnv)) {
    armFailures.push(`${G10C_YOUTUBE_EMBED_SAVE_ENABLED_ENV}=true`);
  }

  const armed = armFailures.length === 0;
  const saveEnabled = isG10cSaveCompileGateEnabled(mergedEnv) && armed;

  return {
    ...base,
    armed,
    saveEnabled,
    armFailureReason: armed ? undefined : armFailures.join("; "),
  };
}

export function evaluateG10cYoutubeEmbedSaveUiGate(input: {
  signedIn: boolean;
  dryRunResult: {
    ok: boolean;
    saveReadiness: string;
    changedFields: string[];
  } | null;
  env?: ImportMetaEnv;
}): { enabled: boolean; reason: string } {
  const config = getG10cYoutubeEmbedStaticJsonWriteConfig(input.env ?? import.meta.env);
  if (!config.saveEnabled) {
    return {
      enabled: false,
      reason: config.armFailureReason ?? G10C_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON,
    };
  }
  if (!input.signedIn) {
    return { enabled: false, reason: "Staging admin session required." };
  }
  if (!input.dryRunResult?.ok) {
    return { enabled: false, reason: "Dry-run must succeed before Save." };
  }
  if (input.dryRunResult.saveReadiness !== "ready_to_save") {
    return { enabled: false, reason: "Save readiness not satisfied." };
  }
  if (input.dryRunResult.changedFields.length === 0) {
    return { enabled: false, reason: "No changedFields — Save blocked." };
  }
  return { enabled: true, reason: "" };
}
