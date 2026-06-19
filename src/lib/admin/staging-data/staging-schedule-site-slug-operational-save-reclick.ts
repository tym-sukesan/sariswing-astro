/**
 * G-9g3h1 — Operational / restore Save success re-click prevention helpers.
 */

import {
  G9G3H1_PREVIEW_CONSUMED_MSG,
  G9G3H1_SAVE_RECLICK_GUARD_MSG,
} from "./staging-schedule-site-slug-config";
import type { G9G3gOperationalPreviewBinding } from "../staging-write/staging-schedule-site-slug-operational-general-edit-save";

export type OperationalSaveMode = "general" | "restore" | "venue-only";

export type OperationalSaveSuccessRecord = {
  previewIdentity: string;
  mode: OperationalSaveMode;
  approvalId: string;
  targetId: string;
  legacyId: string | null;
  changedFields: string[];
  rowsAffected: number;
};

export function buildOperationalPreviewIdentity(input: {
  mode: OperationalSaveMode;
  approvalId: string;
  targetId: string;
  legacyId: string | null;
  expectedBeforeUpdatedAt: string | null;
  changedFields: string[];
  fieldValues: Record<string, string>;
}): string {
  const sortedFields = [...input.changedFields].sort();
  const fieldSnapshot: Record<string, string> = {};
  for (const field of sortedFields) {
    fieldSnapshot[field] = input.fieldValues[field] ?? "";
  }
  return [
    input.mode,
    input.approvalId,
    input.targetId,
    input.legacyId ?? "",
    input.expectedBeforeUpdatedAt ?? "",
    sortedFields.join(","),
    JSON.stringify(fieldSnapshot),
  ].join("|");
}

export function buildPreviewIdentityFromBinding(
  mode: OperationalSaveMode,
  approvalId: string,
  binding: Pick<
    G9G3gOperationalPreviewBinding,
    | "targetId"
    | "legacyId"
    | "expectedBeforeUpdatedAt"
    | "changedFields"
    | "fieldValues"
  >,
): string {
  return buildOperationalPreviewIdentity({
    mode,
    approvalId,
    targetId: binding.targetId,
    legacyId: binding.legacyId,
    expectedBeforeUpdatedAt: binding.expectedBeforeUpdatedAt,
    changedFields: [...binding.changedFields],
    fieldValues: binding.fieldValues,
  });
}

export function isOperationalSaveReclickBlocked(
  success: OperationalSaveSuccessRecord | null,
  previewIdentity: string | null,
): boolean {
  if (!success || !previewIdentity) return false;
  return success.previewIdentity === previewIdentity;
}

export function assertOperationalSaveNotReclick(options: {
  consumedPreviewIdentity: string | null | undefined;
  previewIdentity: string;
}): void {
  if (
    options.consumedPreviewIdentity &&
    options.consumedPreviewIdentity === options.previewIdentity
  ) {
    throw new Error(G9G3H1_SAVE_RECLICK_GUARD_MSG);
  }
}

export function operationalPreviewConsumedMessage(): string {
  return G9G3H1_PREVIEW_CONSUMED_MSG;
}
