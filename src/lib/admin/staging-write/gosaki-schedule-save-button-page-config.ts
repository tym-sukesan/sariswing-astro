/**
 * G-9k4a-fix — Server-injected G-9k Save gate config bridge (client reads data attrs).
 */

import { G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G9K_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID =
  "g9k-schedule-save-button-page-config";

export const G9K_SAVE_BUTTON_SAVE_ENABLED_ENV = "G9K_SAVE_BUTTON_SAVE_ENABLED";

const GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED";

export interface G9kSaveButtonPageConfig {
  saveButtonSaveEnabled: boolean;
  stagingShellEnabled: boolean;
  stagingWriteEnabled: boolean;
  envArmArmed: boolean;
  writeDryRunDisabled: boolean;
  writeProvider: string;
  writeModule: string;
  writeApprovalId: string;
}

export function resolveG9kSaveButtonPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G9kSaveButtonPageConfig {
  return {
    saveButtonSaveEnabled:
      String(env[G9K_SAVE_BUTTON_SAVE_ENABLED_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingWriteEnabled: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    envArmArmed:
      String(env[GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV] ?? "")
        .trim() === "true",
    writeDryRunDisabled:
      String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() === "false",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG9kSaveButtonPageConfigFromDom(): G9kSaveButtonPageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G9K_SAVE_BUTTON_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveButtonSaveEnabled:
      el.getAttribute("data-g9k-save-button-save-enabled") === "true",
    stagingShellEnabled:
      el.getAttribute("data-g9k-staging-shell-enabled") === "true",
    stagingWriteEnabled:
      el.getAttribute("data-g9k-staging-write-enabled") === "true",
    envArmArmed: el.getAttribute("data-g9k-env-arm-armed") === "true",
    writeDryRunDisabled:
      el.getAttribute("data-g9k-write-dry-run-disabled") === "true",
    writeProvider: el.getAttribute("data-g9k-write-provider") ?? "",
    writeModule: el.getAttribute("data-g9k-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g9k-write-approval-id") ?? "",
  };
}

export function applyG9kSaveButtonPageConfigToEnv(
  env: ImportMetaEnv,
  pageConfig: G9kSaveButtonPageConfig,
): ImportMetaEnv {
  return {
    ...env,
    [G9K_SAVE_BUTTON_SAVE_ENABLED_ENV]: pageConfig.saveButtonSaveEnabled
      ? "true"
      : "false",
    ENABLE_ADMIN_STAGING_SHELL: pageConfig.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: pageConfig.stagingWriteEnabled ? "true" : "false",
    [GOSAKI_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_ARMED_ENV]:
      pageConfig.envArmArmed ? "true" : "false",
    PUBLIC_ADMIN_WRITE_DRY_RUN: pageConfig.writeDryRunDisabled ? "false" : "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: pageConfig.writeProvider,
    PUBLIC_ADMIN_WRITE_MODULE: pageConfig.writeModule,
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: pageConfig.writeApprovalId,
  };
}

export function isG9kSaveButtonPageConfigValid(
  pageConfig: G9kSaveButtonPageConfig,
): boolean {
  return (
    pageConfig.writeApprovalId ===
    G9K_SCHEDULE_EXISTING_EVENT_SAVE_BUTTON_NON_DRY_RUN_APPROVAL_ID
  );
}
