/**
 * G-15d — Server-injected G-15d Discography artist Save gate config bridge.
 */

import { G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID } from "./discography-write-types";
import {
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV,
  G15D_DISCOGRAPHY_SAVE_ENABLED_ENV,
} from "./gosaki-discography-artist-save-config";
import { getDiscographyOptimisticLockConfig } from "./gosaki-discography-optimistic-lock-config";

export const G15D_DISCOGRAPHY_SAVE_PAGE_CONFIG_ELEMENT_ID =
  "g15d-discography-save-page-config";

export interface G15dDiscographySavePageConfig {
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

export function resolveG15dDiscographySavePageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G15dDiscographySavePageConfig {
  return {
    saveEnabled: String(env[G15D_DISCOGRAPHY_SAVE_ENABLED_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingDataReadEnabled: env.ENABLE_ADMIN_STAGING_DATA_READ === "true",
    stagingWriteEnabled: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    envArmArmed:
      String(env[G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV] ?? "").trim() === "true",
    optimisticLockEnabled: getDiscographyOptimisticLockConfig(env).enabled,
    writeDryRunDisabled:
      String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() === "false",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG15dDiscographySavePageConfigFromDom(): G15dDiscographySavePageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G15D_DISCOGRAPHY_SAVE_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveEnabled: el.getAttribute("data-g15d-save-enabled") === "true",
    stagingShellEnabled: el.getAttribute("data-g15d-staging-shell-enabled") === "true",
    stagingDataReadEnabled: el.getAttribute("data-g15d-staging-data-read-enabled") === "true",
    stagingWriteEnabled: el.getAttribute("data-g15d-staging-write-enabled") === "true",
    envArmArmed: el.getAttribute("data-g15d-env-arm-armed") === "true",
    optimisticLockEnabled: el.getAttribute("data-g15d-optimistic-lock-enabled") === "true",
    writeDryRunDisabled: el.getAttribute("data-g15d-write-dry-run-disabled") === "true",
    writeProvider: el.getAttribute("data-g15d-write-provider") ?? "",
    writeModule: el.getAttribute("data-g15d-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g15d-write-approval-id") ?? "",
  };
}

export function applyG15dDiscographySavePageConfigToEnv(
  env: ImportMetaEnv,
  pageConfig: G15dDiscographySavePageConfig,
): ImportMetaEnv {
  return {
    ...env,
    [G15D_DISCOGRAPHY_SAVE_ENABLED_ENV]: pageConfig.saveEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_SHELL: pageConfig.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_DATA_READ: pageConfig.stagingDataReadEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: pageConfig.stagingWriteEnabled ? "true" : "false",
    [G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_ARMED_ENV]: pageConfig.envArmArmed
      ? "true"
      : "false",
    PUBLIC_ADMIN_DISCOGRAPHY_OPTIMISTIC_LOCK: pageConfig.optimisticLockEnabled
      ? "true"
      : "false",
    PUBLIC_ADMIN_WRITE_DRY_RUN: pageConfig.writeDryRunDisabled ? "false" : "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: pageConfig.writeProvider,
    PUBLIC_ADMIN_WRITE_MODULE: pageConfig.writeModule,
    PUBLIC_ADMIN_WRITE_APPROVAL_ID:
      pageConfig.writeApprovalId || G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  };
}
