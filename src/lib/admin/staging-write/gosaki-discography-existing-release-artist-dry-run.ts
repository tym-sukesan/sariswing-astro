/**
 * G-15d — Gosaki Discography existing-release artist dry-run Preview (no DB write).
 */

import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { resolveG15dDiscographyArtistSaveEnabled } from "./gosaki-discography-artist-save-config";
import {
  assertG15dDiscographyChangedFieldsOnly,
  assertG15dDiscographyPayloadOnly,
  assertG15dDiscographyWritableRow,
  assertG15dOptimisticLockBaseline,
  buildG15dDiscographyPayload,
  type G15dDiscographyDryRunSliceField,
} from "./gosaki-discography-artist-dry-run-guards";
import {
  G15D_DRY_RUN_SLICE_APPROVAL_ID,
  G15D_PHASE,
  G15D_TARGET_LEGACY_ID,
} from "./gosaki-discography-next-field-types";
import {
  type DiscographyDryRunFormValues,
  type DiscographyDryRunSource,
  type DiscographyUpdatePayload,
} from "./gosaki-discography-dry-run-types";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";

export type G15dDiscographyDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type G15dDiscographyDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G15dDiscographyDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G15D_PHASE;
  approvalId: typeof G15D_DRY_RUN_SLICE_APPROVAL_ID;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    site_slug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<G15dDiscographyDryRunSliceField, string | null>>;
  after: Partial<Record<G15dDiscographyDryRunSliceField, string | null>>;
  payload: DiscographyUpdatePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveReadiness: G15dDiscographyDryRunSaveReadiness;
  saveAllowed: boolean;
  rowsAffectedRequired: 1;
  safety: G15dDiscographyDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotField(
  row: DiscographyDryRunSource,
  field: G15dDiscographyDryRunSliceField,
): string | null {
  const value = row[field as keyof DiscographyDryRunSource];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeG15dDiscographyChangedFields(
  beforeSnapshot: DiscographyDryRunSource,
  formValues: DiscographyDryRunFormValues,
): string[] {
  const changedFields: string[] = [];
  for (const field of ["artist"] as const) {
    const beforeValue = normalizeCompare(snapshotField(beforeSnapshot, field));
    const afterValue = normalizeCompare(formValues[field]);
    if (beforeValue !== afterValue) {
      changedFields.push(field);
    }
  }
  return changedFields;
}

function buildChangedFieldSnapshots(
  beforeSnapshot: DiscographyDryRunSource,
  formValues: DiscographyDryRunFormValues,
  changedFields: string[],
): {
  before: Partial<Record<G15dDiscographyDryRunSliceField, string | null>>;
  after: Partial<Record<G15dDiscographyDryRunSliceField, string | null>>;
} {
  const before: Partial<Record<G15dDiscographyDryRunSliceField, string | null>> = {};
  const after: Partial<Record<G15dDiscographyDryRunSliceField, string | null>> = {};
  for (const field of changedFields) {
    const sliceField = field as G15dDiscographyDryRunSliceField;
    before[sliceField] = snapshotField(beforeSnapshot, sliceField);
    const raw = formValues[sliceField] ?? "";
    after[sliceField] = raw.trim() === "" ? null : raw.trim();
  }
  return { before, after };
}

function emptyDryRunResult(
  beforeSnapshot: DiscographyDryRunSource | null,
  guardErrors: string[],
  saveReadiness: G15dDiscographyDryRunSaveReadiness,
  optimisticLockStale = false,
): G15dDiscographyDryRunResult {
  return {
    ok: false,
    dryRun: true,
    phase: G15D_PHASE,
    approvalId: G15D_DRY_RUN_SLICE_APPROVAL_ID,
    target: {
      id: beforeSnapshot?.id ?? "",
      legacy_id: beforeSnapshot?.legacy_id ?? G15D_TARGET_LEGACY_ID,
      title: String(beforeSnapshot?.title ?? ""),
      site_slug: GOSAKI_DISCOGRAPHY_SITE_SLUG,
    },
    changedFields: [],
    payloadKeys: [],
    before: {},
    after: {},
    payload: {},
    expectedBeforeUpdatedAt: beforeSnapshot?.updated_at ?? null,
    optimisticLockStale,
    guardErrors,
    saveReadiness,
    saveAllowed: false,
    rowsAffectedRequired: 1,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      discographyTracksTouched: false,
      serviceRoleUsed: false,
      actualWrite: false,
      wouldWrite: false,
    },
  };
}

/**
 * Pure dry-run preview for Gosaki Discography G-15d artist slice (discography-003).
 * Does not call Supabase UPDATE or any mutation.
 */
export function executeG15dDiscographyArtistDryRun(input: {
  beforeSnapshot: DiscographyDryRunSource;
  formValues: DiscographyDryRunFormValues;
  optimisticLockStale?: boolean;
  supabaseUrl?: string;
}): G15dDiscographyDryRunResult {
  const guardErrors: string[] = [];
  const optimisticLockStale = input.optimisticLockStale === true;

  if (input.supabaseUrl !== undefined) {
    try {
      assertStaticToAstroCmsStagingSupabaseProject(input.supabaseUrl);
    } catch (error) {
      guardErrors.push(error instanceof Error ? error.message : String(error));
      return emptyDryRunResult(
        input.beforeSnapshot,
        guardErrors,
        "guard_error",
        optimisticLockStale,
      );
    }
  }

  try {
    assertG15dDiscographyWritableRow(input.beforeSnapshot);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  try {
    assertG15dOptimisticLockBaseline(input.beforeSnapshot.updated_at);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  const changedFields = computeG15dDiscographyChangedFields(
    input.beforeSnapshot,
    input.formValues,
  );

  if (changedFields.length === 0) {
    guardErrors.push("G-15d dry-run: no artist change detected.");
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "no_changes",
      optimisticLockStale,
    );
  }

  try {
    assertG15dDiscographyChangedFieldsOnly(changedFields);
    const payload = buildG15dDiscographyPayload(changedFields, input.formValues);
    assertG15dDiscographyPayloadOnly(payload, changedFields);
    const { before, after } = buildChangedFieldSnapshots(
      input.beforeSnapshot,
      input.formValues,
      changedFields,
    );

    if (optimisticLockStale) {
      guardErrors.push(
        "G-15d dry-run: optimistic lock stale — expectedBeforeUpdatedAt no longer matches row.",
      );
    }

    const ok = guardErrors.length === 0;
    const saveEnabled = resolveG15dDiscographyArtistSaveEnabled();
    const saveReadiness: G15dDiscographyDryRunSaveReadiness = !ok
      ? "guard_error"
      : saveEnabled
        ? "ready_to_save"
        : "ready_but_save_disabled";

    return {
      ok,
      dryRun: true,
      phase: G15D_PHASE,
      approvalId: G15D_DRY_RUN_SLICE_APPROVAL_ID,
      target: {
        id: input.beforeSnapshot.id,
        legacy_id: input.beforeSnapshot.legacy_id,
        title: String(input.beforeSnapshot.title ?? ""),
        site_slug: GOSAKI_DISCOGRAPHY_SITE_SLUG,
      },
      changedFields: [...changedFields],
      payloadKeys: Object.keys(payload),
      before,
      after,
      payload,
      expectedBeforeUpdatedAt: input.beforeSnapshot.updated_at ?? null,
      optimisticLockStale,
      guardErrors,
      saveReadiness,
      saveAllowed: ok && saveEnabled,
      rowsAffectedRequired: 1,
      safety: {
        supabaseWriteCalled: false,
        writeAdapterUsed: false,
        discographyTracksTouched: false,
        serviceRoleUsed: false,
        actualWrite: false,
        wouldWrite: ok,
      },
    };
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }
}
