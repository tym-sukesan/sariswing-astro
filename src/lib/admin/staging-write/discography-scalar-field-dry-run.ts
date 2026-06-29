/**
 * G-17b/G-17c — Generic Discography scalar field slice dry-run Preview (no DB write).
 */

import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import { getDiscographyScalarSliceSaveConfig } from "./discography-scalar-field-save-config";
import { getG17cDiscographyLabelSaveConfig } from "./gosaki-discography-g17c-label-save-config";
import {
  assertDiscographyScalarSliceChangedFieldsOnly,
  assertDiscographyScalarSliceOptimisticLockBaseline,
  assertDiscographyScalarSlicePayloadOnly,
  assertDiscographyScalarSliceWritableRow,
} from "./discography-scalar-field-guards";
import type { DiscographyScalarFieldSliceEntry } from "./discography-scalar-field-slice-registry";
import type {
  DiscographyDryRunFormValues,
  DiscographyDryRunSource,
  DiscographyUpdatePayload,
} from "./gosaki-discography-dry-run-types";
import { GOSAKI_DISCOGRAPHY_SITE_SLUG } from "../staging-data/gosaki-discography-read-types";

export type DiscographyScalarSliceDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  discographyTracksTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
  wouldWrite: boolean;
};

export type DiscographyScalarSliceDryRunSaveReadiness =
  | "no_changes"
  | "guard_error"
  | "ready_but_save_disabled"
  | "ready_to_save";

export type DiscographyScalarSliceDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: string;
  approvalId: string;
  sliceId: string;
  target: {
    id: string;
    legacy_id: string;
    title: string;
    site_slug: typeof GOSAKI_DISCOGRAPHY_SITE_SLUG;
  };
  changedFields: string[];
  payloadKeys: string[];
  before: Partial<Record<string, string | null>>;
  after: Partial<Record<string, string | null>>;
  payload: DiscographyUpdatePayload;
  expectedBeforeUpdatedAt: string | null;
  optimisticLockStale: boolean;
  guardErrors: string[];
  saveReadiness: DiscographyScalarSliceDryRunSaveReadiness;
  saveAllowed: boolean;
  rowsAffectedRequired: 1;
  safety: DiscographyScalarSliceDryRunSafety;
};

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function snapshotField(
  row: DiscographyDryRunSource,
  field: string,
): string | null {
  const value = row[field as keyof DiscographyDryRunSource];
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeDiscographyScalarSliceChangedFields(
  entry: DiscographyScalarFieldSliceEntry,
  beforeSnapshot: DiscographyDryRunSource,
  formValues: DiscographyDryRunFormValues,
): string[] {
  const field = entry.field;
  const beforeValue = normalizeCompare(snapshotField(beforeSnapshot, field));
  const afterValue = normalizeCompare(formValues[field as keyof DiscographyDryRunFormValues]);
  if (beforeValue !== afterValue) {
    return [field];
  }
  return [];
}

function buildScalarSlicePayload(
  entry: DiscographyScalarFieldSliceEntry,
  formValues: DiscographyDryRunFormValues,
): DiscographyUpdatePayload {
  const raw = formValues[entry.field as keyof DiscographyDryRunFormValues] ?? "";
  const trimmed = String(raw).trim();
  return { [entry.field]: trimmed === "" ? null : trimmed };
}

export function executeDiscographyScalarSliceDryRun(input: {
  entry: DiscographyScalarFieldSliceEntry;
  beforeSnapshot: DiscographyDryRunSource;
  formValues: DiscographyDryRunFormValues;
  optimisticLockStale: boolean;
  supabaseUrl: string;
}): DiscographyScalarSliceDryRunResult {
  const { entry, beforeSnapshot, formValues, optimisticLockStale, supabaseUrl } = input;
  const guardErrors: string[] = [];

  try {
    assertStaticToAstroCmsStagingSupabaseProject(supabaseUrl);
  } catch (err) {
    guardErrors.push(err instanceof Error ? err.message : String(err));
  }

  const changedFields = computeDiscographyScalarSliceChangedFields(
    entry,
    beforeSnapshot,
    formValues,
  );
  const payload = buildScalarSlicePayload(entry, formValues);
  const expectedBeforeUpdatedAt = beforeSnapshot.updated_at;

  try {
    assertDiscographyScalarSliceWritableRow(entry, beforeSnapshot);
    if (changedFields.length > 0) {
      assertDiscographyScalarSlicePayloadOnly(entry, payload);
      assertDiscographyScalarSliceChangedFieldsOnly(entry, changedFields);
      assertDiscographyScalarSliceOptimisticLockBaseline(entry, expectedBeforeUpdatedAt);
    }
  } catch (err) {
    guardErrors.push(err instanceof Error ? err.message : String(err));
  }

  const field = entry.field;
  const before = { [field]: snapshotField(beforeSnapshot, field) };
  const after = {
    [field]: normalizeCompare(formValues[field as keyof DiscographyDryRunFormValues]) || null,
  };

  const saveConfig =
    entry.sliceId === "g17c-label"
      ? getG17cDiscographyLabelSaveConfig()
      : getDiscographyScalarSliceSaveConfig(entry);
  let saveReadiness: DiscographyScalarSliceDryRunSaveReadiness = "guard_error";
  if (guardErrors.length > 0) {
    saveReadiness = "guard_error";
  } else if (changedFields.length === 0) {
    saveReadiness = "no_changes";
  } else if (!saveConfig.saveEnabled) {
    saveReadiness = "ready_but_save_disabled";
  } else {
    saveReadiness = "ready_to_save";
  }

  const ok = guardErrors.length === 0 && changedFields.length > 0;

  return {
    ok,
    dryRun: true,
    phase: entry.phase,
    approvalId: entry.dryRunApprovalId,
    sliceId: entry.sliceId,
    target: {
      id: beforeSnapshot.id,
      legacy_id: beforeSnapshot.legacy_id,
      title: beforeSnapshot.title,
      site_slug: GOSAKI_DISCOGRAPHY_SITE_SLUG,
    },
    changedFields,
    payloadKeys: Object.keys(payload),
    before,
    after,
    payload,
    expectedBeforeUpdatedAt,
    optimisticLockStale,
    guardErrors,
    saveReadiness,
    saveAllowed: saveReadiness === "ready_to_save",
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
}
