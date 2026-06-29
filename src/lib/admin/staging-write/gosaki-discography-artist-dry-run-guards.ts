/**
 * G-15d — Gosaki Discography dry-run guards (artist slice on discography-003).
 */

import type {
  DiscographyDryRunFormValues,
  DiscographyDryRunSource,
  DiscographyUpdatePayload,
} from "./gosaki-discography-dry-run-types";
import { G15D_TARGET_LEGACY_ID } from "./gosaki-discography-next-field-types";
import { buildG15a2DiscographyPayload } from "./gosaki-discography-dry-run-guards";

const G15D_LABEL = "G-15d";

export const G15D_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS = ["artist"] as const;

export type G15dDiscographyDryRunSliceField =
  (typeof G15D_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS)[number];

export function assertG15dDiscographyWritableRow(row: DiscographyDryRunSource): void {
  if (!row.id || !row.legacy_id) {
    throw new Error(`${G15D_LABEL} target row id / legacy_id required.`);
  }
  if (row.legacy_id !== G15D_TARGET_LEGACY_ID) {
    throw new Error(
      `${G15D_LABEL} target legacy_id must be ${G15D_TARGET_LEGACY_ID} (got ${row.legacy_id}).`,
    );
  }
}

export function assertG15dOptimisticLockBaseline(
  expectedBeforeUpdatedAt: string | undefined | null,
): void {
  if (!String(expectedBeforeUpdatedAt ?? "").trim()) {
    throw new Error(`${G15D_LABEL} expectedBeforeUpdatedAt is required.`);
  }
}

export function assertG15dDiscographyChangedFieldsOnly(changedFields: string[]): void {
  if (changedFields.length !== 1) {
    throw new Error(
      `${G15D_LABEL} changedFields must be exactly 1 (got ${changedFields.join(", ") || "none"}).`,
    );
  }
  const field = changedFields[0];
  if (!(G15D_DISCOGRAPHY_DRY_RUN_SLICE_FIELDS as readonly string[]).includes(field)) {
    throw new Error(`${G15D_LABEL} field ${field} is not allowed in G-15d slice.`);
  }
}

export function buildG15dDiscographyPayload(
  changedFields: string[],
  formValues: DiscographyDryRunFormValues,
): DiscographyUpdatePayload {
  return buildG15a2DiscographyPayload(changedFields, formValues);
}

export function assertG15dDiscographyPayloadOnly(
  payload: DiscographyUpdatePayload,
  expectedChangedFields: string[],
): void {
  const keys = Object.keys(payload).sort();
  const expected = [...expectedChangedFields].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error(
      `${G15D_LABEL} payload keys must match changedFields (${keys.join(", ")} vs ${expected.join(", ")}).`,
    );
  }
  for (const field of expectedChangedFields) {
    if (field === "artist") {
      const raw = payload.artist == null ? "" : String(payload.artist);
      for (const marker of ["[CMS Kit staging]", "PoC", "test-only", "dry-run marker"]) {
        if (raw.includes(marker)) {
          throw new Error(`${G15D_LABEL} audit marker forbidden: ${marker}`);
        }
      }
    }
  }
}
