/**
 * G-15a2 — Gosaki Discography existing-release dry-run Preview (no DB write).
 */

import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { resolveG15bDiscographyPurchaseUrlSaveEnabled } from "./gosaki-discography-purchase-url-save-config";
import {
  assertG15a2DiscographyChangedFieldsOnly,
  assertG15a2DiscographyPayloadOnly,
  assertG15a2DiscographyWritableRow,
  assertG15a2OptimisticLockBaseline,
  buildG15a2DiscographyPayload,
  type G15A2DiscographyDryRunSliceField,
} from "./gosaki-discography-dry-run-guards";
import {
  G15A2_DRY_RUN_SLICE_APPROVAL_ID,
  G15A2_PHASE,
  G15A2_TARGET_LEGACY_ID,
  type DiscographyDryRunFormValues,
  type DiscographyDryRunSource,
  type DiscographyUpdatePayload,
} from "./gosaki-discography-dry-run-types";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";

export type G15a2DiscographyDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type G15a2DiscographyDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type G15a2DiscographyDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G15A2_PHASE;
  approvalId: typeof G15A2_DRY_RUN_SLICE_APPROVAL_ID;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    site_slug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<G15A2DiscographyDryRunSliceField, string | null>>;
  after: Partial<Record<G15A2DiscographyDryRunSliceField, string | null>>;
  payload: DiscographyUpdatePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveReadiness: G15a2DiscographyDryRunSaveReadiness;
  saveAllowed: boolean;
  rowsAffectedRequired: 1;
  safety: G15a2DiscographyDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotField(
  row: DiscographyDryRunSource,
  field: G15A2DiscographyDryRunSliceField,
): string | null {
  const value = row[field as keyof DiscographyDryRunSource];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function readDiscographyDryRunFormValues(form: HTMLFormElement): DiscographyDryRunFormValues {
  const read = (name: DiscographyDryRunFormValues[keyof DiscographyDryRunFormValues]) => {
    const el = form.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `[name="${name}"]`,
    );
    return el?.value ?? "";
  };
  const publishedEl = form.querySelector<HTMLInputElement>('input[name="published"]');
  return {
    title: read("title"),
    artist: read("artist"),
    release_date: read("release_date"),
    year: read("year"),
    catalog_number: read("catalog_number"),
    label: read("label"),
    description: read("description"),
    purchase_url: read("purchase_url"),
    streaming_url: read("streaming_url"),
    sort_order: read("sort_order"),
    published: publishedEl?.checked ? "true" : "false",
  };
}

export function computeG15a2DiscographyChangedFields(
  beforeSnapshot: DiscographyDryRunSource,
  formValues: DiscographyDryRunFormValues,
): string[] {
  const changedFields: string[] = [];
  for (const field of ["purchase_url"] as const) {
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
  before: Partial<Record<G15A2DiscographyDryRunSliceField, string | null>>;
  after: Partial<Record<G15A2DiscographyDryRunSliceField, string | null>>;
} {
  const before: Partial<Record<G15A2DiscographyDryRunSliceField, string | null>> = {};
  const after: Partial<Record<G15A2DiscographyDryRunSliceField, string | null>> = {};
  for (const field of changedFields) {
    const sliceField = field as G15A2DiscographyDryRunSliceField;
    before[sliceField] = snapshotField(beforeSnapshot, sliceField);
    const raw = formValues[sliceField] ?? "";
    after[sliceField] = raw.trim() === "" ? null : raw.trim();
  }
  return { before, after };
}

function emptyDryRunResult(
  beforeSnapshot: DiscographyDryRunSource | null,
  guardErrors: string[],
  saveReadiness: G15a2DiscographyDryRunSaveReadiness,
  optimisticLockStale = false,
): G15a2DiscographyDryRunResult {
  return {
    ok: false,
    dryRun: true,
    phase: G15A2_PHASE,
    approvalId: G15A2_DRY_RUN_SLICE_APPROVAL_ID,
    target: {
      id: beforeSnapshot?.id ?? "",
      legacy_id: beforeSnapshot?.legacy_id ?? G15A2_TARGET_LEGACY_ID,
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
 * Pure dry-run preview for Gosaki Discography operator path (G-15a2).
 * Does not call Supabase UPDATE or any mutation.
 */
export function executeG15a2DiscographyDryRun(input: {
  beforeSnapshot: DiscographyDryRunSource;
  formValues: DiscographyDryRunFormValues;
  optimisticLockStale?: boolean;
  supabaseUrl?: string;
}): G15a2DiscographyDryRunResult {
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
    assertG15a2DiscographyWritableRow(input.beforeSnapshot);
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
    assertG15a2OptimisticLockBaseline(input.beforeSnapshot.updated_at);
  } catch (error) {
    guardErrors.push(error instanceof Error ? error.message : String(error));
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "guard_error",
      optimisticLockStale,
    );
  }

  const changedFields = computeG15a2DiscographyChangedFields(
    input.beforeSnapshot,
    input.formValues,
  );

  if (changedFields.length === 0) {
    guardErrors.push("G-15a2 dry-run: no purchase_url change detected.");
    return emptyDryRunResult(
      input.beforeSnapshot,
      guardErrors,
      "no_changes",
      optimisticLockStale,
    );
  }

  try {
    assertG15a2DiscographyChangedFieldsOnly(changedFields);
    const payload = buildG15a2DiscographyPayload(changedFields, input.formValues);
    assertG15a2DiscographyPayloadOnly(payload, changedFields);
    const { before, after } = buildChangedFieldSnapshots(
      input.beforeSnapshot,
      input.formValues,
      changedFields,
    );

    if (optimisticLockStale) {
      guardErrors.push(
        "G-15a2 dry-run: optimistic lock stale — expectedBeforeUpdatedAt no longer matches row.",
      );
    }

    const ok = guardErrors.length === 0;
    const saveEnabled = resolveG15bDiscographyPurchaseUrlSaveEnabled();
    const saveReadiness: G15a2DiscographyDryRunSaveReadiness = !ok
      ? "guard_error"
      : saveEnabled
        ? "ready_to_save"
        : "ready_but_save_disabled";

    return {
      ok,
      dryRun: true,
      phase: G15A2_PHASE,
      approvalId: G15A2_DRY_RUN_SLICE_APPROVAL_ID,
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
