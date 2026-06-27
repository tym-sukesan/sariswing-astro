/**
 * G-13c2d1 — Server-injected G-13c2 Event B cleanup Save gate page config bridge.
 */

import { G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G13C2D1_PAGE_CONFIG_PHASE =
  "G-13c2d1-gosaki-schedule-event-b-poc-cleanup-page-config-bridge";

export const G13C2_EVENT_B_POC_CLEANUP_PAGE_CONFIG_ELEMENT_ID =
  "g13c2-event-b-poc-cleanup-page-config";

const G13C2_SAVE_COMPILE_GATE_ENV = "PUBLIC_ADMIN_G13C2_EVENT_B_POC_CLEANUP_SAVE_ENABLED";

const G13C2_EVENT_B_POC_CLEANUP_ARM_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G13C2_EVENT_B_POC_CLEANUP_NON_DRY_RUN_ARMED";

export interface G13c2EventBPocCleanupPageConfig {
  saveCompileGateEnabled: boolean;
  stagingShellEnabled: boolean;
  stagingWriteEnabled: boolean;
  envArmArmed: boolean;
  writeDryRunDisabled: boolean;
  writeProvider: string;
  writeModule: string;
  writeApprovalId: string;
}

export function resolveG13c2EventBPocCleanupPageServerConfig(
  env: ImportMetaEnv = import.meta.env,
): G13c2EventBPocCleanupPageConfig {
  return {
    saveCompileGateEnabled:
      String(env[G13C2_SAVE_COMPILE_GATE_ENV] ?? "").trim() === "true",
    stagingShellEnabled: env.ENABLE_ADMIN_STAGING_SHELL === "true",
    stagingWriteEnabled: env.ENABLE_ADMIN_STAGING_WRITE === "true",
    envArmArmed:
      String(env[G13C2_EVENT_B_POC_CLEANUP_ARM_ENV] ?? "").trim() === "true",
    writeDryRunDisabled:
      String(env.PUBLIC_ADMIN_WRITE_DRY_RUN ?? "true").trim() === "false",
    writeProvider: String(env.PUBLIC_ADMIN_WRITE_PROVIDER ?? "").trim(),
    writeModule: String(env.PUBLIC_ADMIN_WRITE_MODULE ?? "").trim(),
    writeApprovalId: String(env.PUBLIC_ADMIN_WRITE_APPROVAL_ID ?? "").trim(),
  };
}

export function readG13c2EventBPocCleanupPageConfigFromDom(): G13c2EventBPocCleanupPageConfig | null {
  if (typeof document === "undefined") return null;

  const el = document.getElementById(G13C2_EVENT_B_POC_CLEANUP_PAGE_CONFIG_ELEMENT_ID);
  if (!el) return null;

  return {
    saveCompileGateEnabled:
      el.getAttribute("data-g13c2-save-compile-gate-enabled") === "true",
    stagingShellEnabled:
      el.getAttribute("data-g13c2-staging-shell-enabled") === "true",
    stagingWriteEnabled:
      el.getAttribute("data-g13c2-staging-write-enabled") === "true",
    envArmArmed: el.getAttribute("data-g13c2-env-arm-armed") === "true",
    writeDryRunDisabled:
      el.getAttribute("data-g13c2-write-dry-run-disabled") === "true",
    writeProvider: el.getAttribute("data-g13c2-write-provider") ?? "",
    writeModule: el.getAttribute("data-g13c2-write-module") ?? "",
    writeApprovalId: el.getAttribute("data-g13c2-write-approval-id") ?? "",
  };
}

export function applyG13c2EventBPocCleanupPageConfigToEnv(
  env: ImportMetaEnv,
  pageConfig: G13c2EventBPocCleanupPageConfig,
): ImportMetaEnv {
  return {
    ...env,
    [G13C2_SAVE_COMPILE_GATE_ENV]: pageConfig.saveCompileGateEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_SHELL: pageConfig.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: pageConfig.stagingWriteEnabled ? "true" : "false",
    [G13C2_EVENT_B_POC_CLEANUP_ARM_ENV]: pageConfig.envArmArmed ? "true" : "false",
    PUBLIC_ADMIN_WRITE_DRY_RUN: pageConfig.writeDryRunDisabled ? "false" : "true",
    PUBLIC_ADMIN_WRITE_PROVIDER: pageConfig.writeProvider,
    PUBLIC_ADMIN_WRITE_MODULE: pageConfig.writeModule,
    PUBLIC_ADMIN_WRITE_APPROVAL_ID: pageConfig.writeApprovalId,
  };
}

export function isG13c2EventBPocCleanupPageConfigValid(
  pageConfig: G13c2EventBPocCleanupPageConfig,
): boolean {
  return (
    pageConfig.writeApprovalId === G13C2_SCHEDULE_EVENT_B_POC_AUDIT_CLEANUP_NON_DRY_RUN_APPROVAL_ID
  );
}
