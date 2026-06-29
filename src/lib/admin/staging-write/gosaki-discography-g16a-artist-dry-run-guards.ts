/**
 * G-16a — Gosaki Discography dry-run guards (artist slice on discography-001).
 */

import type {
  DiscographyDryRunFormValues,
  DiscographyDryRunSource,
  DiscographyUpdatePayload,
} from "./gosaki-discography-dry-run-types";
import { G16A_TARGET_LEGACY_ID } from "./gosaki-discography-g16a-next-field-types";
import { buildG15a2DiscographyPayload } from "./gosaki-discography-dry-run-guards";

const G16A_LABEL = "G-16a";

export const G16A_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS = ["artist"] as const;

export type G16aDiscographyDryRunSliceField =
  (typeof G16A_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS)[number];

export function assertG16aDiscographyWritableRow(row: DiscographyDryRunSource): void {
  if (!row.id || !row.legacy_id) {
    throw new Error(`${G16A_LABEL} target row id / legacy_id required.`);
  }
  if (row.legacy_id !== G16A_TARGET_LEGACY_ID) {
    throw new Error(
      `${G16A_LABEL} target legacy_id must be ${G16A_TARGET_LEGACY_ID} (got ${row.legacy_id}).`,
    );
  }
}

export function assertG16aOptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${G16A_LABEL} expectedBeforeUpdatedAt is required.`);
  }
}

export function assertG16aDiscographyChangedFieldsOnly(changedFields: string[]): void {
  if (changedFields.length !== 1) {
    throw new Error(
      `${G16A_LABEL} changedFields must be exactly 1 (got ${changedFields.join(", ") || "none"}).`,
    );
  }
  const field = changedFields[0];
  if (!(G16A_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS as readonly string[]).includes(field)) {
    throw new Error(`${G16A_LABEL} field ${field} is not allowed in G-16a slice.`);
  }
}

export function buildG16aDiscographyPayload(
  changedFields: string[],
  formValues: DiscographyDryRunFormValues,
): DiscographyUpdatePayload {
  return buildG15a2DiscographyPayload(changedFields, formValues);
}

export function assertG16aDiscographyPayloadOnly(
  payload: DiscographyUpdatePayload,
  expectedChangedFields: string[],
): void {
  const keys = Object.keys(payload).sort();
  const expected = [...expectedChangedFields].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error(
      `${G16A_LABEL} payload keys must match changedFields (${keys.join(", ")} vs ${expected.join(", ")}).`,
    );
  }
  for (const field of expectedChangedFields) {
    if (field === "artist") {
      const raw = payload.artist == null ? "" : String(payload.artist);
      for (const marker of ["[CMS Kit staging]", "PoC", "test-only", "dry-run marker"]) {
        if (raw.includes(marker)) {
          throw new Error(`${G16A_LABEL} audit marker forbidden: ${marker}`);
        }
      }
    }
  }
}
