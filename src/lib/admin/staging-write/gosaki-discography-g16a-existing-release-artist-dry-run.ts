/**
 * G-16a — Gosaki Discography existing-release artist dry-run Preview (no DB write).
 */

import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { resolveG16aDiscographyArtistSaveEnabled } from "./gosaki-discography-g16a-artist-save-config";
import {
  assertG16aDiscographyChangedFieldsOnly,
  assertG16aDiscographyPayloadOnly,
  assertG16aDiscographyWritableRow,
  assertG16aOptimisticLockBaseline,
  buildG16aDiscographyPayload,
  type G16aDiscographyDryRunSliceField,
} from "./gosaki-discography-g16a-artist-dry-run-guards";
import {
  G16A_DRY_RUN_SLICE_APPROVAL_ID,
  G16A_PHASE,
  G16A_TARGET_LEGACY_ID,
} from "./gosaki-discography-g16a-next-field-types";
import {
  type DiscographyDryRunFormValues,
  type DiscographyDryRunSource,
  type DiscographyUpdatePayload,
} from "./gosaki-discography-dry-run-types";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";

export type G16aDiscographyDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type G16aDiscographyDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G16aDiscographyDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G16A_PHASE;
  approvalId: typeof G16A_DRY_RUN_SLICE_APPROVAL_ID;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    site_slug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<G16aDiscographyDryRunSliceField, string | null>>;
  after: Partial<Record<G16aDiscographyDryRunSliceField, string | null>>;
  payload: DiscographyUpdatePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveReadiness: G16aDiscographyDryRunSaveReadiness;
  saveAllowed: boolean;
  rowsAffectedRequired: 1;
  safety: G16aDiscographyDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotField(
  row: DiscographyDryRunSource,
  field: G16aDiscographyDryRunSliceField,
): string | null {
  const value = row[field as keyof DiscographyDryRunSource];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeG16aDiscographyChangedFields(
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
  before: Partial<Record<G16aDiscographyDryRunSliceField, string | null>>;
  after: Partial<Record<G16aDiscographyDryRunSliceField, string | null>>;
} {
  const before: Partial<Record<G16aDiscographyDryRunSliceField, string | null>> = {};
  const after: Partial<Record<G16aDiscographyDryRunSliceField, string | null>> = {};
  for (const field of changedFields) {
    const sliceField = field as G16aDiscographyDryRunSliceField;
    before[sliceField] = snapshotField(beforeSnapshot, sliceField);
    const raw = formValues[sliceField] ?? "";
    after[sliceField] = raw.trim() === "" ? null : raw.trim();
  }
  return { before, after };
}

function emptyDryRunResult(
  beforeSnapshot: DiscographyDryRunSource | null,
  guardErrors: string[],
  saveReadiness: G16aDiscographyDryRunSaveReadiness,
  optimisticLockStale = false,
): G16aDiscographyDryRunResult {
  return {
    ok: false,
    dryRun: true,
    phase: G16A_PHASE,
    approvalId: G16A_DRY_RUN_SLICE_APPROVAL_ID,
    target: {
      id: beforeSnapshot?.id ?? "",
      legacy_id: beforeSnapshot?.legacy_id ?? G16A_TARGET_LEGACY_ID,
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
 * Pure dry-run preview for Gosaki Discography G-16a artist slice (discography-001).
 * Does not call Supabase UPDATE or any mutation.
 */
export function executeG16aDiscographyArtistDryRun(input: {
  beforeSnapshot: DiscographyDryRunSource;
  formValues: DiscographyDryRunFormValues;
  optimisticLockStale?: boolean;
  supabaseUrl?: string;
}): G16aDiscographyDryRunResult {
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
    assertG16aDiscographyWritableRow(input.beforeSnapshot);
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
    assertG16aOptimisticLockBaseline(input.beforeSnapshot.updated_at);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  const changedFields = computeG16aDiscographyChangedFields(
    input.beforeSnapshot,
    input.formValues,
  );

  if (changedFields.length === 0) {
    guardErrors.push("G-16a dry-run: no artist change detected.");
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "no_changes",
      optimisticLockStale,
    );
  }

  try {
    assertG16aDiscographyChangedFieldsOnly(changedFields);
    const payload = buildG16aDiscographyPayload(changedFields, input.formValues);
    assertG16aDiscographyPayloadOnly(payload, changedFields);
    const { before, after } = buildChangedFieldSnapshots(
      input.beforeSnapshot,
      input.formValues,
      changedFields,
    );

    if (optimisticLockStale) {
      guardErrors.push(
        "G-16a dry-run: optimistic lock stale — expectedBeforeUpdatedAt no longer matches row.",
      );
    }

    const ok = guardErrors.length === 0;
    const saveEnabled = resolveG16aDiscographyArtistSaveEnabled();
    const saveReadiness: G16aDiscographyDryRunSaveReadiness = !ok
      ? "guard_error"
      : saveEnabled
        ? "ready_to_save"
        : "ready_but_save_disabled";

    return {
      ok,
      dryRun: true,
      phase: G16A_PHASE,
      approvalId: G16A_DRY_RUN_SLICE_APPROVAL_ID,
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
