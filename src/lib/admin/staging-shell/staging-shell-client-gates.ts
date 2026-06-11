/**
 * G-6-d-staging-env-gate-client-fix — Merge server-injected ENABLE_* gates into client env.
 */

import type { StagingShellServerGateSnapshot } from "./staging-shell-server-gates";
import { STAGING_SHELL_SERVER_GATES_ELEMENT_ID } from "./staging-shell-server-gates";

let cachedGates: StagingShellServerGateSnapshot | null = null;

export function setStagingShellClientGates(
  snapshot: StagingShellServerGateSnapshot,
): void {
  cachedGates = snapshot;
}

export function readStagingShellClientGatesFromDom(): StagingShellServerGateSnapshot | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(STAGING_SHELL_SERVER_GATES_ELEMENT_ID);
  if (!el?.textContent?.trim()) return null;
  try {
    return JSON.parse(el.textContent) as StagingShellServerGateSnapshot;
  } catch {
    return null;
  }
}

function resolveClientGates(): StagingShellServerGateSnapshot | null {
  if (cachedGates) return cachedGates;
  const fromDom = readStagingShellClientGatesFromDom();
  if (fromDom) cachedGates = fromDom;
  return cachedGates;
}

/** Merge server ENABLE_* booleans into import.meta.env for staging shell client code. */
export function mergeStagingShellEnv(
  env: ImportMetaEnv = import.meta.env,
): ImportMetaEnv {
  const gates = resolveClientGates();
  if (!gates) return env;

  return {
    ...env,
    ENABLE_ADMIN_STAGING_SHELL: gates.stagingShellEnabled ? "true" : "false",
    ENABLE_ADMIN_STAGING_AUTH: gates.stagingAuthFlag ? "true" : "false",
    ENABLE_ADMIN_STAGING_DATA_READ: gates.stagingDataReadFlag ? "true" : "false",
    ENABLE_ADMIN_STAGING_WRITE: gates.stagingWriteFlag ? "true" : "false",
  };
}

export function hasStagingShellServerGateInjection(): boolean {
  return resolveClientGates() !== null;
}
