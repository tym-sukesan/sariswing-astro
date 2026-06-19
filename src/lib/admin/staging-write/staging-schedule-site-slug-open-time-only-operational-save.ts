/**
 * G-9g4a2a — Gosaki site_slug open_time-only operational non-dry-run save (staging shell only).
 *
 * Delegates to G-9g4a2 generic single-text-field Save executor.
 * Safety: serviceRoleUsed false — anon staging client only (no elevated DB role).
 * Safety: productionBlocked true — refused when operational config reports production.
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import {
  executeSingleTextFieldOperationalNonDryRunSave,
  type SingleTextFieldOperationalPreviewBinding,
  type SingleTextFieldOperationalSaveOutcome,
} from "./staging-schedule-single-text-field-operational-save";
import type { ScheduleUpdateWritePayload } from "./schedule-write-types";

export type G9G4a2aOpenTimeOnlyPreviewBinding = SingleTextFieldOperationalPreviewBinding;

export type G9G4a2aOpenTimeOnlySaveOutcome = SingleTextFieldOperationalSaveOutcome;

export async function executeG9G4a2aOpenTimeOnlyNonDryRunSave(options: {
  url: string;
  anonKey: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  changedFields: string[];
  previewBinding: G9G4a2aOpenTimeOnlyPreviewBinding;
  candidateValues: Record<string, string>;
}): Promise<G9G4a2aOpenTimeOnlySaveOutcome> {
  return executeSingleTextFieldOperationalNonDryRunSave("open_time", options);
}
