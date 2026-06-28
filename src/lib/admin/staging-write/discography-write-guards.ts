/**
 * G-15b — Discography write guards (purchase_url slice on discography-002).
 */

import type { GosakiDiscographyRecord } from "../staging-data/gosaki-discography-read-types";
import {
  DISCOGRAPHY_WRITE_APPROVAL_IDS,
  G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID,
  type DiscographyUpdateWritePayload,
  type DiscographyWriteApprovalIdUnion,
} from "./discography-write-types";
import { G15A2_TARGET_LEGACY_ID } from "./gosaki-discography-dry-run-types";

const G15B_LABEL = "G-15b";

export const G15B_DISCOGRAPHY_WRITE_SLICE_FIELDS = ["purchase_url"] as const;

export function assertDiscographyWriteApprovalId(
  approvalId: string,
): asserts approvalId is DiscographyWriteApprovalIdUnion {
  if (!(DISCOGRAPHY_WRITE_APPROVAL_IDS as readonly string[]).includes(approvalId)) {
    throw new Error(`${G15B_LABEL} approval ID not registered: ${approvalId}`);
  }
}

export function assertG15bDiscographyWriteApproval(approvalId: string): void {
  if (approvalId !== G15B_DISCOGRAPHY_PURCHASE_URL_NON_DRY_RUN_APPROVAL_ID) {
    throw new Error(`${G15B_LABEL} approval ID mismatch.`);
  }
}

export function assertDiscographyWriteTargetId(targetId: string, row: GosakiDiscographyRecord): void {
  if (!targetId || targetId !== row.id) {
    throw new Error(`${G15B_LABEL} target id mismatch.`);
  }
}

export function assertG15bDiscographyWritableRow(row: GosakiDiscographyRecord): void {
  if (!row.id || !row.legacy_id) {
    throw new Error(`${G15B_LABEL} target row id / legacy_id required.`);
  }
  if (row.legacy_id !== G15A2_TARGET_LEGACY_ID) {
    throw new Error(
      `${G15B_LABEL} target legacy_id must be ${G15A2_TARGET_LEGACY_ID} (got ${row.legacy_id}).`,
    );
  }
}

export function assertG15bDiscographyChangedFieldsOnly(changedFields: string[]): void {
  if (changedFields.length !== 1 || changedFields[0] !== "purchase_url") {
    throw new Error(
      `${G15B_LABEL} changedFields must be exactly purchase_url (got ${changedFields.join(", ") || "none"}).`,
    );
  }
}

export function assertG15bDiscographyUpdatePayloadAllowed(
  payload: DiscographyUpdateWritePayload,
): void {
  const keys = Object.keys(payload);
  if (keys.length !== 1 || keys[0] !== "purchase_url") {
    throw new Error(`${G15B_LABEL} payload must contain purchase_url only.`);
  }
  const value = payload.purchase_url;
  if (value != null && typeof value !== "string") {
    throw new Error(`${G15B_LABEL} purchase_url must be string or null.`);
  }
  const raw = String(value ?? "");
  for (const marker of ["[CMS Kit staging]", "PoC", "test", "G-15", "dry-run"]) {
    if (raw.includes(marker)) {
      throw new Error(`${G15B_LABEL} forbidden marker in purchase_url: ${marker}`);
    }
  }
}

export function assertG15bRowsAffectedExactlyOne(rowsAffected: number): void {
  if (rowsAffected !== 1) {
    throw new Error(
      `${G15B_LABEL} rowsAffected must be exactly 1 (got ${String(rowsAffected)}).`,
    );
  }
}

export function assertG15bOptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${G15B_LABEL} expectedBeforeUpdatedAt is required.`);
  }
}
