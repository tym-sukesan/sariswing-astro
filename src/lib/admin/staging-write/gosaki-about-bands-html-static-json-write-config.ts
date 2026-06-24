/**
 * G-10h4c — Gosaki About bands HTML static JSON write config (staging shell only).
 */

import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_PHASE,
  G10H4C_SITE_SLUG,
  G10H4C_WRITE_MODULE,
  G10H4C_WRITE_PROVIDER,
} from "./gosaki-about-bands-html-static-json-write-types";
import {
  G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED_ENV,
  readG10h4cSaveButtonPageConfigFromDom,
} from "./gosaki-about-bands-html-static-json-write-page-config";

export const G10H4C_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON =
  "G-10h4c About bands HTML Save disabled — dry-run only until explicit approval phase.";

/** G-10h4c: compile-time default — runtime gate uses server bridge + env. */
export const G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED = false as const;

export function isG10h4cSaveCompileGateEnabled(env: ImportMetaEnv): boolean {
  return String(env[G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED_ENV] ?? "").trim() === "true";
}

export interface G10h4cAboutBandsHtmlStaticJsonWriteConfig {
  phase: typeof G10H4C_PHASE;
  approvalId: typeof G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID;
  siteSlug: typeof G10H4C_SITE_SLUG;
  saveEnabled: boolean;
  defaultDisabledReason: typeof G10H4C_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON;
  dev: boolean;
  stagingShellEnabled: boolean;
  writeProvider: string;
  writeModule: string;
  blocksAffectedMustBeOne: true;
}

export function getG10h4cAboutBandsHtmlStaticJsonWriteConfig(
  env: ImportMetaEnv = import.meta.env,
): G10h4cAboutBandsHtmlStaticJsonWriteConfig {
  const pageConfig = readG10h4cSaveButtonPageConfigFromDom();
  const mergedEnv = pageConfig
    ? {
        ...env,
        [G10H4C_ABOUT_BANDS_HTML_SAVE_ENABLED_ENV]: pageConfig.saveButtonSaveEnabled
          ? "true"
          : "false",
      }
    : env;

  const saveEnabled = isG10h4cSaveCompileGateEnabled(mergedEnv);

  return {
    phase: G10H4C_PHASE,
    approvalId: G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    siteSlug: G10H4C_SITE_SLUG,
    saveEnabled,
    defaultDisabledReason: G10H4C_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON,
    dev: mergedEnv.DEV === true,
    stagingShellEnabled: mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true",
    writeProvider: String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? G10H4C_WRITE_PROVIDER).trim(),
    writeModule: String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? G10H4C_WRITE_MODULE).trim(),
    blocksAffectedMustBeOne: true,
  };
}
