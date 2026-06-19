/**
 * G-9g4a2a — open_time-only operational edit UI (staging shell only).
 * Delegates to G-9g4a2 generic single-text-field operational edit UI.
 */

import {
  canEnableSingleTextFieldOperationalSave,
  initSingleTextFieldOperationalEditUi,
  invalidateSingleTextFieldOperationalPreview,
  isSingleTextFieldOperationalArmed,
  markSingleTextFieldOperationalPreviewStale,
  refreshSingleTextFieldOperationalSaveButtonState,
  refreshSingleTextFieldOperationalSaveGatePanel,
  refreshSingleTextFieldOperationalUiState,
} from "./staging-schedule-single-text-field-operational-edit-ui";

export function isG9g4a2aOpenTimeOnlyArmed(): boolean {
  return isSingleTextFieldOperationalArmed("open_time");
}

export function invalidateG9g4a2aOpenTimeOnlyPreview(): void {
  invalidateSingleTextFieldOperationalPreview("open_time");
}

export function markG9g4a2aOpenTimeOnlyPreviewStale(reason?: string): void {
  markSingleTextFieldOperationalPreviewStale("open_time", reason);
}

export function canEnableG9g4a2aOpenTimeOnlySave(): { ok: boolean; reason: string } {
  return canEnableSingleTextFieldOperationalSave("open_time");
}

export function refreshG9g4a2aOpenTimeOnlySaveButtonState(): void {
  refreshSingleTextFieldOperationalSaveButtonState("open_time");
}

export function refreshG9g4a2aOpenTimeOnlySaveGatePanel(): void {
  refreshSingleTextFieldOperationalSaveGatePanel("open_time");
}

export function initG9g4a2aOpenTimeOnlyOperationalEditUi(): void {
  initSingleTextFieldOperationalEditUi("open_time");
}

export function refreshG9g4a2aOpenTimeOnlyUiState(): void {
  refreshSingleTextFieldOperationalUiState("open_time");
}
