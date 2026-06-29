/**
 * G-15b / G-15d / G-16a — Discography write guards (staging shell slices).
 * G-17b: slice-specific asserts delegate to discography-scalar-field-guards.
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import {
  DISCOGRAPHY_WRITE_APPROVAL_IDS,
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
  G15D_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  G16A_DISCOGRAPHY_ARTIST_NON_DRY_RUN_APPROVAL_ID,
  type DiscographyUpdateWritePayload,
  type DiscographyWriteApprovalIdUnion,
} from "./discography-write-types";
import {
  assertDiscographyScalarSliceChangedFieldsOnly,
  assertDiscographyScalarSliceOptimisticLockBaseline,
  assertDiscographyScalarSlicePayloadOnly,
  assertDiscographyScalarSliceRowsAffectedExactlyOne,
  assertDiscographyScalarSliceWritableRow,
  assertDiscographyScalarSliceWriteApproval,
} from "./discography-scalar-field-guards";
import { getDiscographyScalarSliceRegistryEntry } from "./discography-scalar-field-slice-registry";

const G15B_ENTRY = getDiscographyScalarSliceRegistryEntry("g15b-purchase-url");
const G15D_ENTRY = getDiscographyScalarSliceRegistryEntry("g15d-artist");
const G16A_ENTRY = getDiscographyScalarSliceRegistryEntry("g16a-artist");

const WRITE_LABEL = "Discography write";

export const G15B_DISCOGRAPHY_WRITE_SLICE_FIELDS = ["purchase_url"] as const;
export const G15D_DISCOGRAPHY_WRITE_SLICE_FIELDS = ["artist"] as const;
export const G16A_DISCOGRAPHY_WRITE_SLICE_FIELDS = ["artist"] as const;

export function assertDiscographyWriteApprovalId(
  approvalId: string,
): asserts approvalId is DiscographyWriteApprovalIdUnion {
  if (!(DISCOGRAPHY_WRITE_APPROVAL_IDS as readonly string[]).includes(approvalId)) {
    throw new Error(`${WRITE_LABEL} approval ID not registered: ${approvalId}`);
  }
}

export function assertDiscographyWriteTargetId(targetId: string, row: GosakiDiscographyRecord): void {
  if (!targetId || targetId !== row.id) {
    throw new Error(`${WRITE_LABEL} target id mismatch.`);
  }
}

export function assertG15bDiscographyWriteApproval(approvalId: string): void {
  assertDiscographyScalarSliceWriteApproval(G15B_ENTRY, approvalId);
}

export function assertG15bDiscographyWritableRow(row: GosakiDiscographyRecord): void {
  assertDiscographyScalarSliceWritableRow(G15B_ENTRY, row);
}

export function assertG15bDiscographyChangedFieldsOnly(changedFields: string[]): void {
  assertDiscographyScalarSliceChangedFieldsOnly(G15B_ENTRY, changedFields);
}

export function assertG15bDiscographyUpdatePayloadAllowed(
  payload: DiscographyUpdateWritePayload,
): void {
  assertDiscographyScalarSlicePayloadOnly(G15B_ENTRY, payload);
}

export function assertG15bRowsAffectedExactlyOne(rowsAffected: number): void {
  assertDiscographyScalarSliceRowsAffectedExactlyOne(G15B_ENTRY, rowsAffected);
}

export function assertG15bOptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  assertDiscographyScalarSliceOptimisticLockBaseline(G15B_ENTRY, expectedBeforeUpdatedAt);
}

export function assertG15dDiscographyWriteApproval(approvalId: string): void {
  assertDiscographyScalarSliceWriteApproval(G15D_ENTRY, approvalId);
}

export function assertG15dDiscographyWritableRow(row: GosakiDiscographyRecord): void {
  assertDiscographyScalarSliceWritableRow(G15D_ENTRY, row);
}

export function assertG15dDiscographyChangedFieldsOnly(changedFields: string[]): void {
  assertDiscographyScalarSliceChangedFieldsOnly(G15D_ENTRY, changedFields);
}

export function assertG15dDiscographyUpdatePayloadAllowed(
  payload: DiscographyUpdateWritePayload,
): void {
  assertDiscographyScalarSlicePayloadOnly(G15D_ENTRY, payload);
}

export function assertG15dRowsAffectedExactlyOne(rowsAffected: number): void {
  assertDiscographyScalarSliceRowsAffectedExactlyOne(G15D_ENTRY, rowsAffected);
}

export function assertG15dOptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  assertDiscographyScalarSliceOptimisticLockBaseline(G15D_ENTRY, expectedBeforeUpdatedAt);
}

export function assertG16aDiscographyWriteApproval(approvalId: string): void {
  assertDiscographyScalarSliceWriteApproval(G16A_ENTRY, approvalId);
}

export function assertG16aDiscographyWritableRow(row: GosakiDiscographyRecord): void {
  assertDiscographyScalarSliceWritableRow(G16A_ENTRY, row);
}

export function assertG16aDiscographyChangedFieldsOnly(changedFields: string[]): void {
  assertDiscographyScalarSliceChangedFieldsOnly(G16A_ENTRY, changedFields);
}

export function assertG16aDiscographyUpdatePayloadAllowed(
  payload: DiscographyUpdateWritePayload,
): void {
  assertDiscographyScalarSlicePayloadOnly(G16A_ENTRY, payload);
}

export function assertG16aRowsAffectedExactlyOne(rowsAffected: number): void {
  assertDiscographyScalarSliceRowsAffectedExactlyOne(G16A_ENTRY, rowsAffected);
}

export function assertG16aOptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  assertDiscographyScalarSliceOptimisticLockBaseline(G16A_ENTRY, expectedBeforeUpdatedAt);
}

// Re-export for adapter / G-17c+ direct registry guard use.
export {
  assertDiscographyScalarSliceGuards,
  assertDiscographyScalarSliceWriteGuards,
} from "./discography-scalar-field-guards";
export {
  getDiscographyScalarSliceEntryByApprovalId,
  getDiscographyScalarSliceRegistryEntry,
} from "./discography-scalar-field-slice-registry";
