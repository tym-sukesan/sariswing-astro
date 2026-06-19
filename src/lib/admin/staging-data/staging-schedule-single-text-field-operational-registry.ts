/**
 * G-9g4a2 — Gosaki site_slug single-text-field operational registry (staging shell only).
 */

import type { OperationalSaveMode } from "./staging-schedule-site-slug-operational-save-reclick";
import {
  G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2A_OPEN_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON,
  G9G4A2A_PHASE,
  G9G4A2B_PHASE,
  G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2B_START_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON,
  G9G4A2C_PHASE,
  G9G4A2C_PRICE_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2C_PRICE_ONLY_SAVE_DISABLED_DEFAULT_REASON,
  SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED_ENV,
  SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED_ENV,
} from "./staging-schedule-site-slug-config";

export type SingleTextFieldOperationalFieldName = "open_time" | "start_time" | "price";

export type SingleTextFieldOperationalField = {
  fieldName: SingleTextFieldOperationalFieldName;
  phasePrefix: string;
  phase: string;
  label: string;
  approvalId: string;
  envArm: string;
  uiIdPrefix: string;
  reclickMode: Extract<
    OperationalSaveMode,
    "open-time-only" | "start-time-only" | "price-only"
  >;
  defaultDisabledReason: string;
  validate: (value: string) => boolean;
};

/** Conservative non-empty trimmed string — framework v1 default. */
export function nonEmptyTrimmedSingleTextFieldValue(value: string): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export const SINGLE_TEXT_FIELD_OPERATIONAL_ROUTINE_DEV_SAFETY_HINT =
  "Routine dev: ENABLE_ADMIN_STAGING_WRITE=false; PUBLIC_ADMIN_WRITE_DRY_RUN=true; all single-text-field non-dry-run arms off.";

export const SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY: readonly SingleTextFieldOperationalField[] =
  [
    {
      fieldName: "open_time",
      phasePrefix: "G-9g4a2a",
      phase: G9G4A2A_PHASE,
      label: "open_time",
      approvalId: G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
      envArm: SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV,
      uiIdPrefix: "site-slug-edit-g9g4a2a-open-time-only",
      reclickMode: "open-time-only",
      defaultDisabledReason: G9G4A2A_OPEN_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON,
      validate: nonEmptyTrimmedSingleTextFieldValue,
    },
    {
      fieldName: "start_time",
      phasePrefix: "G-9g4a2b",
      phase: G9G4A2B_PHASE,
      label: "start_time",
      approvalId: G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
      envArm: SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED_ENV,
      uiIdPrefix: "site-slug-edit-g9g4a2b-start-time-only",
      reclickMode: "start-time-only",
      defaultDisabledReason: G9G4A2B_START_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON,
      validate: nonEmptyTrimmedSingleTextFieldValue,
    },
    {
      fieldName: "price",
      phasePrefix: "G-9g4a2c",
      phase: G9G4A2C_PHASE,
      label: "price",
      approvalId: G9G4A2C_PRICE_ONLY_NON_DRY_RUN_APPROVAL_ID,
      envArm: SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED_ENV,
      uiIdPrefix: "site-slug-edit-g9g4a2c-price-only",
      reclickMode: "price-only",
      defaultDisabledReason: G9G4A2C_PRICE_ONLY_SAVE_DISABLED_DEFAULT_REASON,
      validate: nonEmptyTrimmedSingleTextFieldValue,
    },
  ];

export function getSingleTextFieldOperationalRegistryEntry(
  fieldName: SingleTextFieldOperationalFieldName,
): SingleTextFieldOperationalField {
  const entry = SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY.find(
    (item) => item.fieldName === fieldName,
  );
  if (!entry) {
    throw new Error(`Unknown single-text-field registry entry: ${fieldName}`);
  }
  return entry;
}

export function isSingleTextFieldEnvArmTrue(
  env: ImportMetaEnv,
  envArm: string,
): boolean {
  return String(env[envArm] ?? "").trim() === "true";
}

/** Registry field names with env arm currently ON. */
export function getArmedSingleTextFieldRegistryFieldNames(
  env: ImportMetaEnv = import.meta.env,
): SingleTextFieldOperationalFieldName[] {
  return SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY.filter((entry) =>
    isSingleTextFieldEnvArmTrue(env, entry.envArm),
  ).map((entry) => entry.fieldName);
}

/**
 * Returns arm failure messages when other registry env arms are ON.
 * Pass `exceptFieldName` to allow the active slice's own arm.
 */
export function collectOtherRegistryEnvArmFailures(
  env: ImportMetaEnv,
  exceptFieldName?: SingleTextFieldOperationalFieldName,
): string[] {
  const failures: string[] = [];
  for (const entry of SINGLE_TEXT_FIELD_OPERATIONAL_REGISTRY) {
    if (exceptFieldName && entry.fieldName === exceptFieldName) continue;
    if (isSingleTextFieldEnvArmTrue(env, entry.envArm)) {
      failures.push(`${entry.envArm} must be off`);
    }
  }
  return failures;
}

/** Detect multiple registry env arms ON simultaneously. */
export function detectMultipleRegistryEnvArms(
  env: ImportMetaEnv = import.meta.env,
): string | null {
  const armed = getArmedSingleTextFieldRegistryFieldNames(env);
  if (armed.length > 1) {
    return `Multiple single-text-field registry arms on: ${armed.join(", ")}`;
  }
  return null;
}

export function buildSingleTextFieldUiElementIds(uiIdPrefix: string): {
  previewBtnId: string;
  previewResultId: string;
  saveGatePanelId: string;
  saveBtnId: string;
  saveResultId: string;
} {
  return {
    previewBtnId: `${uiIdPrefix}-dry-run-preview-btn`,
    previewResultId: `${uiIdPrefix}-dry-run-result`,
    saveGatePanelId: `${uiIdPrefix}-save-gate-panel`,
    saveBtnId: `${uiIdPrefix}-save-btn`,
    saveResultId: `${uiIdPrefix}-save-result`,
  };
}
