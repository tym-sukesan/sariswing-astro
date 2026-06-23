/**
 * G-10c — Server-injected Save gate config bridge (client reads data attrs).
 */

import { G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID } from "./gosaki-youtube-embed-static-json-write-types";

export const G10C_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID =
  "g10c-youtube-embed-save-button-page-config";

export const G10C_YOUTUBE_EMBED_SAVE_ENABLED_ENV = "G10C_YOUTUBE_EMBED_SAVE_ENABLED";

const GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED";

export interface G10cSaveButtonPageConfig {
  saveButtonSaveEnabled: boolean;
  stagingShellEnabled: boolean;
  stagingWriteEnabled: boolean;
  envArmArmed: boolean;
  writeDryRunDisabled: boolean;
  writeProvider: string;
  writeModule: string;
  writeApprovalId: string;
}

export function resolveG10cSaveButtonPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G10cSaveButtonPageConfig {
  return {
    saveButtonSaveEnabled:
      String(env[G10C_YOUTUBE_EMBED_SAVE_ENABLED_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingWriteEnabled: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    envArmArmed:
      String(env[GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV] ?? "").trim() ===
      "true",
    writeDryRunDisabled:
      String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() === "false",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG10cSaveButtonPageConfigFromDom(): G10cSaveButtonPageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G10C_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveButtonSaveEnabled:
      el.getAttribute("data-g10c-save-button-save-enabled") === "true",
    stagingShellEnabled:
      el.getAttribute("data-g10c-staging-shell-enabled") === "true",
    stagingWriteEnabled:
      el.getAttribute("data-g10c-staging-write-enabled") === "true",
    envArmArmed: el.getAttribute("data-g10c-env-arm-armed") === "true",
    writeDryRunDisabled:
      el.getAttribute("data-g10c-write-dry-run-disabled") === "true",
    writeProvider: el.getAttribute("data-g10c-write-provider") ?? "",
    writeModule: el.getAttribute("data-g10c-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g10c-write-approval-id") ?? "",
  };
}

export function applyG10cSaveButtonPageConfigToEnv(
  env: ImportMetaEnv,
  pageConfig: G10cSaveButtonPageConfig,
): ImportMetaEnv {
  return {
    ...env,
    [G10C_YOUTUBE_EMBED_SAVE_ENABLED_ENV]: pageConfig.saveButtonSaveEnabled
      ? "true"
      : "false",
    ENABLE_ADMIN_STAGING_SHELL: pageConfig.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: pageConfig.stagingWriteEnabled ? "true" : "false",
    [GOSAKI_YOUTUBE_EMBED_STATIC_JSON_WRITE_ARMED_ENV]: pageConfig.envArmArmed
      ? "true"
      : "false",
    PUBLIC_ADMIN_WRITE_DRY_RUN: pageConfig.writeDryRunDisabled ? "false" : "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: pageConfig.writeProvider,
    PUBLIC_ADMIN_WRITE_MODULE: pageConfig.writeModule,
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: pageConfig.writeApprovalId,
  };
}

export function isG10cSaveButtonPageConfigValid(
  pageConfig: G10cSaveButtonPageConfig,
): boolean {
  return (
    pageConfig.writeApprovalId === G10C_YOUTUBE_EMBED_STATIC_JSON_WRITE_APPROVAL_ID
  );
}
