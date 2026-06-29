/**
 * G-17b — Generic Discography scalar field slice guards (staging shell).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import type { DiscographyUpdateWritePayload } from "./discography-write-types";
import type { DiscographyScalarFieldSliceEntry } from "./discography-scalar-field-slice-registry";

export type DiscographyScalarSliceGuardContext = {
  approvalId: string;
  payload: DiscographyUpdateWritePayload;
  row: GosakiDiscographyRecord;
  changedFields?: string[];
  rowsAffected?: number;
  expectedBeforeUpdatedAt?: string | null;
};

export function assertDiscographyScalarSliceWriteApproval(
  entry: DiscographyScalarFieldSliceEntry,
  approvalId: string,
): void {
  if (approvalId !== entry.approvalId) {
    throw new Error(`${entry.phaseLabel} approval ID mismatch.`);
  }
}

export function assertDiscographyScalarSliceWritableRow(
  entry: DiscographyScalarFieldSliceEntry,
  row: GosakiDiscographyRecord,
): void {
  if (!row.id || !row.legacy_id) {
    throw new Error(`${entry.phaseLabel} target row id / legacy_id required.`);
  }
  if (row.legacy_id !== entry.legacyId) {
    throw new Error(
      `${entry.phaseLabel} target legacy_id must be ${entry.legacyId} (got ${row.legacy_id}).`,
    );
  }
}

export function assertDiscographyScalarSlicePayloadOnly(
  entry: DiscographyScalarFieldSliceEntry,
  payload: DiscographyUpdateWritePayload,
): void {
  const keys = Object.keys(payload);
  if (keys.length !== 1 || keys[0] !== entry.field) {
    throw new Error(`${entry.phaseLabel} payload must contain ${entry.field} only.`);
  }
  const value = payload[entry.field as keyof DiscographyUpdateWritePayload];
  if (value != null && typeof value !== "string") {
    throw new Error(`${entry.phaseLabel} ${entry.field} must be string or null.`);
  }
  const raw = String(value ?? "");
  for (const marker of entry.forbiddenMarkers) {
    if (raw.includes(marker)) {
      throw new Error(`${entry.phaseLabel} forbidden marker in ${entry.field}: ${marker}`);
    }
  }
}

export function assertDiscographyScalarSliceChangedFieldsOnly(
  entry: DiscographyScalarFieldSliceEntry,
  changedFields: string[],
): void {
  if (changedFields.length !== 1 || changedFields[0] !== entry.field) {
    throw new Error(
      `${entry.phaseLabel} changedFields must be exactly ${entry.field} (got ${changedFields.join(", ") || "none"}).`,
    );
  }
}

export function assertDiscographyScalarSliceRowsAffectedExactlyOne(
  entry: DiscographyScalarFieldSliceEntry,
  rowsAffected: number,
): void {
  if (rowsAffected !== 1) {
    throw new Error(
      `${entry.phaseLabel} rowsAffected must be exactly 1 (got ${String(rowsAffected)}).`,
    );
  }
}

export function assertDiscographyScalarSliceOptimisticLockBaseline(
  entry: DiscographyScalarFieldSliceEntry,
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${entry.phaseLabel} expectedBeforeUpdatedAt is required.`);
  }
}

/** Closed slices: metadata only — runtime Save still gated by env arms (unchanged from G-15/G-16). */
export function assertDiscographyScalarSliceNotClosedForReSave(
  entry: DiscographyScalarFieldSliceEntry,
): void {
  if (entry.closed) {
    throw new Error(
      `${entry.phaseLabel} slice ${entry.sliceId} is closed — re-Save forbidden without new approval.`,
    );
  }
}

export function assertDiscographyScalarSliceWriteGuards(
  entry: DiscographyScalarFieldSliceEntry,
  context: DiscographyScalarSliceGuardContext,
): void {
  assertDiscographyScalarSliceWriteApproval(entry, context.approvalId);
  assertDiscographyScalarSliceWritableRow(entry, context.row);
  assertDiscographyScalarSlicePayloadOnly(entry, context.payload);
}

export function assertDiscographyScalarSliceGuards(
  entry: DiscographyScalarFieldSliceEntry,
  context: DiscographyScalarSliceGuardContext,
): void {
  assertDiscographyScalarSliceWriteGuards(entry, context);
  if (context.changedFields) {
    assertDiscographyScalarSliceChangedFieldsOnly(entry, context.changedFields);
  }
  if (context.rowsAffected != null) {
    assertDiscographyScalarSliceRowsAffectedExactlyOne(entry, context.rowsAffected);
  }
  if (context.expectedBeforeUpdatedAt !== undefined) {
    assertDiscographyScalarSliceOptimisticLockBaseline(entry, context.expectedBeforeUpdatedAt);
  }
}
