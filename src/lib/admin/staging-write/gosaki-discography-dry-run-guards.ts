/**
 * G-15a2 — Gosaki Discography dry-run guards (purchase_url slice on discography-002).
 */

import type {
  DiscographyDryRunFormValues,
  DiscographyDryRunSource,
  DiscographyUpdatePayload,
} from "./gosaki-discography-dry-run-types";
import { G15A2_TARGET_LEGACY_ID } from "./gosaki-discography-dry-run-types";

const G15A2_LABEL = "G-15a2";

/** G-15a2 first slice — single field only. */
export const G15A2_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS = ["purchase_url"] as const;

export type G15A2DiscographyDryRunSliceField =
  (typeof G15A2_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS)[number];

const AUDIT_MARKERS = [
  "[CMS Kit staging]",
  "PoC",
  "test-only",
  "dry-run marker",
] as const;

export function assertG15a2DiscographyWritableRow(row: DiscographyDryRunSource): void {
  if (!row.id || !row.legacy_id) {
    throw new Error(`${G15A2_LABEL} target row id / legacy_id required.`);
  }
  if (row.legacy_id !== G15A2_TARGET_LEGACY_ID) {
    throw new Error(
      `${G15A2_LABEL} target legacy_id must be ${G15A2_TARGET_LEGACY_ID} (got ${row.legacy_id}).`,
    );
  }
}

export function assertG15a2OptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${G15A2_LABEL} expectedBeforeUpdatedAt is required.`);
  }
}

export function assertG15a2DiscographyChangedFieldsOnly(changedFields: string[]): void {
  if (changedFields.length !== 1) {
    throw new Error(
      `${G15A2_LABEL} changedFields must be exactly 1 (got ${changedFields.join(", ") || "none"}).`,
    );
  }
  const field = changedFields[0];
  if (!(G15A2_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS as readonly string[]).includes(field)) {
    throw new Error(`${G15A2_LABEL} field ${field} is not allowed in G-15a2 slice.`);
  }
}

export function assertG15a2NoAuditMarkers(value: string | null | undefined): void {
  const raw = String(value ?? "");
  for (const marker of AUDIT_MARKERS) {
    if (raw.includes(marker)) {
      throw new Error(`${G15A2_LABEL} audit marker forbidden: ${marker}`);
    }
  }
}

export function buildG15a2DiscographyPayload(
  changedFields: string[],
  formValues: DiscographyDryRunFormValues,
): DiscographyUpdatePayload {
  const payload: DiscographyUpdatePayload = {};
  for (const field of changedFields) {
    if (field === "published") {
      payload.published = formValues.published === "true";
      continue;
    }
    if (field === "sort_order" || field === "year") {
      const raw = formValues[field].trim();
      payload[field] = raw === "" ? null : Number(raw);
      continue;
    }
    const raw = formValues[field].trim();
    payload[field] = raw === "" ? null : raw;
  }
  return payload;
}

export function assertG15a2DiscographyPayloadOnly(
  payload: DiscographyUpdatePayload,
  expectedChangedFields: string[],
): void {
  const keys = Object.keys(payload).sort();
  const expected = [...expectedChangedFields].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error(
      `${G15A2_LABEL} payload keys must match changedFields (${keys.join(", ")} vs ${expected.join(", ")}).`,
    );
  }
  for (const field of expectedChangedFields) {
    if (field === "purchase_url" || field === "streaming_url") {
      assertG15a2NoAuditMarkers(
        payload[field] == null ? null : String(payload[field]),
      );
    }
  }
}
