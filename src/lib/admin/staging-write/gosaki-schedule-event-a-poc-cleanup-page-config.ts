/**
 * G-13d1e — Server-injected G-13c1 Event A cleanup Save gate page config bridge.
 */

import { G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G13D1E_PHASE =
  "G-13d1e-gosaki-schedule-event-a-poc-cleanup-save-gate-page-config-bridge";

export const G13C1_EVENT_A_POC_CLEANUP_PAGE_CONFIG_ELEMENT_ID =
  "g13c1-event-a-poc-cleanup-page-config";

const G13C1_SAVE_COMPILE_GATE_ENV = "PUBLIC_ADMIN_G13C1_EVENT_A_POC_CLEANUP_SAVE_ENABLED";

const G13C1_EVENT_A_POC_CLEANUP_ARM_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G13C1_EVENT_A_POC_CLEANUP_NON_DRY_RUN_ARMED";

export interface G13c1EventAPocCleanupPageConfig {
  saveCompileGateEnabled: boolean;
  stagingShellEnabled: boolean;
  stagingWriteEnabled: boolean;
  envArmArmed: boolean;
  writeDryRunDisabled: boolean;
  writeProvider: string;
  writeModule: string;
  writeApprovalId: string;
}

export function resolveG13c1EventAPocCleanupPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G13c1EventAPocCleanupPageConfig {
  return {
    saveCompileGateEnabled:
      String(env[G13C1_SAVE_COMPILE_GATE_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingWriteEnabled: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    envArmArmed:
      String(env[G13C1_EVENT_A_POC_CLEANUP_ARM_ENV] ?? "").trim() === "true",
    writeDryRunDisabled:
      String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() === "false",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG13c1EventAPocCleanupPageConfigFromDom(): G13c1EventAPocCleanupPageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G13C1_EVENT_A_POC_CLEANUP_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveCompileGateEnabled:
      el.getAttribute("data-g13c1-save-compile-gate-enabled") === "true",
    stagingShellEnabled:
      el.getAttribute("data-g13c1-staging-shell-enabled") === "true",
    stagingWriteEnabled:
      el.getAttribute("data-g13c1-staging-write-enabled") === "true",
    envArmArmed: el.getAttribute("data-g13c1-env-arm-armed") === "true",
    writeDryRunDisabled:
      el.getAttribute("data-g13c1-write-dry-run-disabled") === "true",
    writeProvider: el.getAttribute("data-g13c1-write-provider") ?? "",
    writeModule: el.getAttribute("data-g13c1-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g13c1-write-approval-id") ?? "",
  };
}

export function applyG13c1EventAPocCleanupPageConfigToEnv(
  env: ImportMetaEnv,
  pageConfig: G13c1EventAPocCleanupPageConfig,
): ImportMetaEnv {
  return {
    ...env,
    [G13C1_SAVE_COMPILE_GATE_ENV]: pageConfig.saveCompileGateEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_SHELL: pageConfig.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: pageConfig.stagingWriteEnabled ? "true" : "false",
    [G13C1_EVENT_A_POC_CLEANUP_ARM_ENV]: pageConfig.envArmArmed ? "true" : "false",
    PUBLIC_ADMIN_WRITE_DRY_RUN: pageConfig.writeDryRunDisabled ? "false" : "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: pageConfig.writeProvider,
    PUBLIC_ADMIN_WRITE_MODULE: pageConfig.writeModule,
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: pageConfig.writeApprovalId,
  };
}

export function isG13c1EventAPocCleanupPageConfigValid(
  pageConfig: G13c1EventAPocCleanupPageConfig,
): boolean {
  return (
    pageConfig.writeApprovalId === G13C1_SCHEDULE_EVENT_A_POC_CLEANUP_NON_DRY_RUN_APPROVAL_ID
  );
}
