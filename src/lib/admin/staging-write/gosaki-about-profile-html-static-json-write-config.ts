/**
 * G-10h4a — Gosaki About profile HTML static JSON write config (staging shell only).
 */

import {
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4A_PHASE,
  G10H4A_SITE_SLUG,
  G10H4A_WRITE_MODULE,
  G10H4A_WRITE_PROVIDER,
} from "./gosaki-about-profile-html-static-json-write-types";
import {
  G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED_ENV,
  readG10h4aSaveButtonPageConfigFromDom,
} from "./gosaki-about-profile-html-static-json-write-page-config";

export const G10H4A_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON =
  "G-10h4a About profile HTML Save disabled until explicit approval and env arm stack.";

/** G-10h4a: compile-time default — runtime gate uses server bridge + env. */
export const G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED = false as const;

export function isG10h4aSaveCompileGateEnabled(env: ImportMetaEnv): boolean {
  return String(env[G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED_ENV] ?? "").trim() === "true";
}

export interface G10h4aAboutProfileHtmlStaticJsonWriteConfig {
  phase: typeof G10H4A_PHASE;
  approvalId: typeof G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID;
  siteSlug: typeof G10H4A_SITE_SLUG;
  saveEnabled: boolean;
  defaultDisabledReason: typeof G10H4A_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON;
  dev: boolean;
  stagingShellEnabled: boolean;
  writeProvider: string;
  writeModule: string;
  blocksAffectedMustBeOne: true;
}

export function getG10h4aAboutProfileHtmlStaticJsonWriteConfig(
  env: ImportMetaEnv = import.meta.env,
): G10h4aAboutProfileHtmlStaticJsonWriteConfig {
  const pageConfig = readG10h4aSaveButtonPageConfigFromDom();
  const mergedEnv = pageConfig
    ? {
        ...env,
        [G10H4A_ABOUT_PROFILE_HTML_SAVE_ENABLED_ENV]: pageConfig.saveButtonSaveEnabled
          ? "true"
          : "false",
      }
    : env;

  const saveEnabled = isG10h4aSaveCompileGateEnabled(mergedEnv);

  return {
    phase: G10H4A_PHASE,
    approvalId: G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
    siteSlug: G10H4A_SITE_SLUG,
    saveEnabled,
    defaultDisabledReason: G10H4A_SAVE_BUTTON_SAVE_DISABLED_DEFAULT_REASON,
    dev: mergedEnv.DEV === true,
    stagingShellEnabled: mergedEnv.ENABLE_ADMIN_STAGING_SHELL === "true",
    writeProvider: String(mergedEnv.PUBLIC_ADMIN_WRITE_PROVIDER ?? G10H4A_WRITE_PROVIDER).trim(),
    writeModule: String(mergedEnv.PUBLIC_ADMIN_WRITE_MODULE ?? G10H4A_WRITE_MODULE).trim(),
    blocksAffectedMustBeOne: true,
  };
}
