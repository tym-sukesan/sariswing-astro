/**
 * G-5z-c — Read-only data provider status for staging shell display.
 */

import type { ReadOnlyDataConfig } from "./read-only-data-config";
import { G5Z_C_APPROVAL_ID } from "./read-only-data-config";

export const READ_ONLY_TARGET_MODULES = [
  "profile",
  "schedule",
  "discography",
  "links",
  "news",
] as const;

export type ReadOnlyUiState =
  | "mock-data"
  | "supabase-read-only"
  | "empty"
  | "error"
  | "loading"
  | "provider-disabled"
  | "config-missing"
  | "rls-denied";

export type ReadOnlyDataProviderStatus = "mock" | "supabase" | "disabled";

export interface ReadOnlyDataStatus {
  phase: string;
  approvalId: string;
  dataProvider: ReadOnlyDataProviderStatus;
  stagingDataReadEnabled: boolean;
  readOnlyMode: true;
  envGated: true;
  mockFallbackAvailable: true;
  connectedToRuntime: boolean;
  productionReady: false;
  canWrite: false;
  dbQueryPerformed: boolean;
  supabaseDbQueryImplemented: boolean;
  fromSelectAdded: boolean;
  dbUpdatePerformed: false;
  rlsPolicyChanged: false;
  rlsConfigured: false;
  storageConnected: false;
  storageReadImplemented: false;
  storageUploadPerformed: false;
  publishConnected: false;
  githubDispatchPerformed: false;
  ftpDeployPerformed: false;
  adminRouteConnected: false;
  productionDataTouched: false;
  targetModules: readonly string[];
  uiState: ReadOnlyUiState;
  uiStateNote: string;
}

export function getReadOnlyDataStatus(
  config: ReadOnlyDataConfig,
): ReadOnlyDataStatus {
  const supabaseActive = config.supabaseDataEnabled && config.supabaseConfigured;

  let dataProvider: ReadOnlyDataProviderStatus = "mock";
  let uiState: ReadOnlyUiState = "mock-data";
  let uiStateNote =
    "Mock fixtures loaded. Enable G-5z-c env gate for Supabase read-only.";
  let connectedToRuntime = false;
  let dbQueryPerformed = false;

  if (!config.dev || !config.stagingShellEnabled) {
    dataProvider = "disabled";
    uiState = "provider-disabled";
    uiStateNote =
      "Data provider disabled outside staging shell dev gate.";
  } else if (config.configMissing) {
    dataProvider = "mock";
    uiState = "config-missing";
    uiStateNote =
      "Supabase data config missing. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY locally. Mock fallback active.";
  } else if (supabaseActive) {
    dataProvider = "supabase";
    uiState = "supabase-read-only";
    uiStateNote = `Supabase read-only mode (${G5Z_C_APPROVAL_ID}). Approved fields only. canWrite: false.`;
    connectedToRuntime = true;
    dbQueryPerformed = true;
  } else if (config.dataReadFlag && config.provider === "supabase") {
    dataProvider = "mock";
    uiState = "mock-data";
    uiStateNote = "Supabase read requested but config incomplete. Mock fallback.";
  }

  return {
    phase: config.phase,
    approvalId: G5Z_C_APPROVAL_ID,
    dataProvider,
    stagingDataReadEnabled: supabaseActive,
    readOnlyMode: true,
    envGated: true,
    mockFallbackAvailable: true,
    connectedToRuntime,
    productionReady: false,
    canWrite: false,
    dbQueryPerformed,
    supabaseDbQueryImplemented: supabaseActive,
    fromSelectAdded: supabaseActive,
    dbUpdatePerformed: false,
    rlsPolicyChanged: false,
    rlsConfigured: false,
    storageConnected: false,
    storageReadImplemented: false,
    storageUploadPerformed: false,
    publishConnected: false,
    githubDispatchPerformed: false,
    ftpDeployPerformed: false,
    adminRouteConnected: false,
    productionDataTouched: false,
    targetModules: READ_ONLY_TARGET_MODULES,
    uiState,
    uiStateNote,
  };
}
