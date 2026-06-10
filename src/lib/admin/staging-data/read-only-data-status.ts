/**
 * G-5z-b — Read-only data provider status for staging shell display.
 */

import type { ReadOnlyDataConfig } from "./read-only-data-config";

export const READ_ONLY_TARGET_MODULES = [
  "profile",
  "schedule",
  "discography",
  "links",
  "news",
] as const;

export type ReadOnlyUiState =
  | "mock-data"
  | "empty"
  | "error"
  | "loading"
  | "provider-disabled"
  | "rls-denied";

export interface ReadOnlyDataStatus {
  phase: string;
  dataProvider: "mock";
  readOnlyMode: true;
  connectedToRuntime: false;
  productionReady: false;
  canWrite: false;
  dbQueryPerformed: false;
  rlsConfigured: false;
  storageConnected: false;
  publishConnected: false;
  adminRouteConnected: false;
  supabaseDbQueryImplemented: false;
  targetModules: readonly string[];
  uiState: ReadOnlyUiState;
  uiStateNote: string;
}

export function getReadOnlyDataStatus(
  config: ReadOnlyDataConfig,
): ReadOnlyDataStatus {
  let uiState: ReadOnlyUiState = "mock-data";
  let uiStateNote =
    "Mock fixtures loaded. No Supabase DB query in G-5z-b.";

  if (!config.dev || !config.stagingShellEnabled) {
    uiState = "provider-disabled";
    uiStateNote =
      "Data provider disabled outside staging shell dev gate.";
  } else if (config.dataReadFlag && config.provider === "supabase") {
    uiState = "mock-data";
    uiStateNote =
      "Supabase read-only requested but not implemented (G-5z-b). Mock fallback active.";
  }

  return {
    phase: config.phase,
    dataProvider: "mock",
    readOnlyMode: true,
    connectedToRuntime: false,
    productionReady: false,
    canWrite: false,
    dbQueryPerformed: false,
    rlsConfigured: false,
    storageConnected: false,
    publishConnected: false,
    adminRouteConnected: false,
    supabaseDbQueryImplemented: false,
    targetModules: READ_ONLY_TARGET_MODULES,
    uiState,
    uiStateNote,
  };
}
