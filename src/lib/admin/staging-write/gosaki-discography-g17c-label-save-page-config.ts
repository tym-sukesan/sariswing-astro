/**
 * G-17d — Server-injected G-17c Discography label Save gate config bridge.
 */

import { G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import {
  G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_ARMED_ENV,
  G17C_DISCOGRAPHY_SAVE_ENABLED_ENV,
} from "./discography-scalar-field-slice-registry";
import { getDiscographyOptimisticLockConfig } from "./gosaki-discography-optimistic-lock-config";

export const G17C_DISCOGRAPHY_SAVE_PAGE_CONFIG_ELEMENT_ID =
  "g17c-discography-save-page-config";

export interface G17cDiscographySavePageConfig {
  saveEnabled: boolean;
  stagingShellEnabled: boolean;
  stagingDataReadEnabled: boolean;
  stagingWriteEnabled: boolean;
  envArmArmed: boolean;
  optimisticLockEnabled: boolean;
  writeDryRunDisabled: boolean;
  writeProvider: string;
  writeModule: string;
  writeApprovalId: string;
}

export function resolveG17cDiscographySavePageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G17cDiscographySavePageConfig {
  return {
    saveEnabled: String(env[G17C_DISCOGRAPHY_SAVE_ENABLED_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingDataReadEnabled: env.ENABLE_ADMIN_STAGING_DATA_READ === "true",
    stagingWriteEnabled: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    envArmArmed:
      String(env[G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_ARMED_ENV] ?? "").trim() === "true",
    optimisticLockEnabled: getDiscographyOptimisticLockConfig(env).enabled,
    writeDryRunDisabled:
      String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() === "false",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG17cDiscographySavePageConfigFromDom(): G17cDiscographySavePageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G17C_DISCOGRAPHY_SAVE_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveEnabled: el.getAttribute("data-g17c-save-enabled") === "true",
    stagingShellEnabled: el.getAttribute("data-g17c-staging-shell-enabled") === "true",
    stagingDataReadEnabled: el.getAttribute("data-g17c-staging-data-read-enabled") === "true",
    stagingWriteEnabled: el.getAttribute("data-g17c-staging-write-enabled") === "true",
    envArmArmed: el.getAttribute("data-g17c-env-arm-armed") === "true",
    optimisticLockEnabled: el.getAttribute("data-g17c-optimistic-lock-enabled") === "true",
    writeDryRunDisabled: el.getAttribute("data-g17c-write-dry-run-disabled") === "true",
    writeProvider: el.getAttribute("data-g17c-write-provider") ?? "",
    writeModule: el.getAttribute("data-g17c-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g17c-write-approval-id") ?? "",
  };
}

export function applyG17cDiscographySavePageConfigToEnv(
  env: ImportMetaEnv,
  pageConfig: G17cDiscographySavePageConfig,
): ImportMetaEnv {
  return {
    ...env,
    [G17C_DISCOGRAPHY_SAVE_ENABLED_ENV]: pageConfig.saveEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_SHELL: pageConfig.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_DATA_READ: pageConfig.stagingDataReadEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: pageConfig.stagingWriteEnabled ? "true" : "false",
    [G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_ARMED_ENV]: pageConfig.envArmArmed
      ? "true"
      : "false",
    PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK: pageConfig.optimisticLockEnabled
      ? "true"
      : "false",
    PUBLIC_ADMIN_WRITE_DRY_RUN: pageConfig.writeDryRunDisabled ? "false" : "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: pageConfig.writeProvider,
    PUBLIC_ADMIN_WRITE_MODULE: pageConfig.writeModule,
    PUBLIC_ADMIN_WRITE_APPROVAL_ID:
      pageConfig.writeApprovalId || G17C_DISCOGRAPHY_LABEL_NON_DRY_RUN_APPROVAL_ID,
  };
}
