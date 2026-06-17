/**
 * G-9g1 — Pure site_slug schedule edit dry-run preview (no Supabase write).
 */

import type { ScheduleOptimisticLockDryRunState } from "../staging-write/schedule-optimistic-lock-types";
import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";
import {
  G9G1_DRY_RUN_APPROVAL_ID,
  SITE_SLUG_EDIT_SAFE_FIELDS,
  type SiteSlugEditSafeField,
} from "./staging-schedule-site-slug-config";

export type SiteSlugEditSafeFieldPatch = Partial<
  Record<SiteSlugEditSafeField, string | null>
>;

export type SiteSlugEditSafeFieldsSnapshot = Record<
  SiteSlugEditSafeField,
  string | null
>;

export type SiteSlugScheduleEditDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  nonDryRunEnabled: false;
  actualWrite: false;
};

export type SiteSlugScheduleEditOptimisticLockPreview = {
  expectedBeforeUpdatedAt: string | null;
  currentUpdatedAt: string | null;
  stale: boolean;
  staleCheckPerformed: boolean;
  optimisticLockEnabled: boolean;
  message?: string | null;
};

export type SiteSlugScheduleEditDryRunResult = {
  phase: string;
  module: "schedule";
  operation: "dry-run-update-preview";
  targetTable: "schedules";
  targetFields: SiteSlugEditSafeField[];
  actualWrite: false;
  dryRun: true;
  wouldWrite: boolean;
  approvalId: string;
  target: {
    id: string;
    legacy_id: string | null;
    site_slug: string;
  };
  before: SiteSlugEditSafeFieldsSnapshot & { updated_at: string | null };
  after: SiteSlugEditSafeFieldsSnapshot;
  changedFields: string[];
  optimisticLock: SiteSlugScheduleEditOptimisticLockPreview;
  message: string;
  safety: SiteSlugScheduleEditDryRunSafety;
};

function snapshotSafeFields(row: ScheduleRecord): SiteSlugEditSafeFieldsSnapshot {
  return {
    title: row.title ?? null,
    venue: row.venue ?? null,
    open_time: row.open_time ?? null,
    start_time: row.start_time ?? null,
    price: row.price ?? null,
    description: row.description ?? null,
  };
}

function normalizeCompare(value: string | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value;
}

export function buildSiteSlugScheduleEditDryRunResult(input: {
  phase: string;
  source: ScheduleRecord;
  siteSlug: string;
  patch: SiteSlugEditSafeFieldPatch;
  optimisticLock?: ScheduleOptimisticLockDryRunState;
}): SiteSlugScheduleEditDryRunResult {
  const before = snapshotSafeFields(input.source);
  const after: SiteSlugEditSafeFieldsSnapshot = { ...before };

  for (const field of SITE_SLUG_EDIT_SAFE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input.patch, field)) {
      const value = input.patch[field];
      after[field] = value === undefined ? before[field] : value;
    }
  }

  const changedFields = SITE_SLUG_EDIT_SAFE_FIELDS.filter(
    (field) =>
      normalizeCompare(before[field]) !== normalizeCompare(after[field]),
  );

  const lock = input.optimisticLock;
  const optimisticLock: SiteSlugScheduleEditOptimisticLockPreview = {
    expectedBeforeUpdatedAt: input.source.updated_at ?? null,
    currentUpdatedAt: lock?.currentUpdatedAt ?? null,
    stale: lock?.staleDetected ?? false,
    staleCheckPerformed: lock?.staleCheckPerformed ?? false,
    optimisticLockEnabled: lock?.optimisticLockEnabled ?? false,
    message: lock?.message ?? null,
  };

  const staleMessage = optimisticLock.stale
    ? "Stale row detected. Preview only. Save remains unavailable."
    : null;

  return {
    phase: input.phase,
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: [...SITE_SLUG_EDIT_SAFE_FIELDS],
    actualWrite: false,
    dryRun: true,
    wouldWrite: changedFields.length > 0,
    approvalId: G9G1_DRY_RUN_APPROVAL_ID,
    target: {
      id: input.source.id,
      legacy_id: input.source.legacy_id ?? null,
      site_slug: input.siteSlug,
    },
    before: {
      ...before,
      updated_at: input.source.updated_at ?? null,
    },
    after,
    changedFields: [...changedFields],
    optimisticLock,
    message: staleMessage
      ? staleMessage
      : changedFields.length
        ? `Dry-run preview: ${changedFields.join(", ")} would change.`
        : "Dry-run preview: no safe-field changes detected.",
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
      actualWrite: false,
    },
  };
}

export function buildSiteSlugScheduleEditDryRunError(input: {
  phase: string;
  siteSlug: string;
  message: string;
}): SiteSlugScheduleEditDryRunResult {
  const empty: SiteSlugEditSafeFieldsSnapshot = {
    title: null,
    venue: null,
    open_time: null,
    start_time: null,
    price: null,
    description: null,
  };

  return {
    phase: input.phase,
    module: "schedule",
    operation: "dry-run-update-preview",
    targetTable: "schedules",
    targetFields: [...SITE_SLUG_EDIT_SAFE_FIELDS],
    actualWrite: false,
    dryRun: true,
    wouldWrite: false,
    approvalId: G9G1_DRY_RUN_APPROVAL_ID,
    target: {
      id: "",
      legacy_id: null,
      site_slug: input.siteSlug,
    },
    before: { ...empty, updated_at: null },
    after: empty,
    changedFields: [],
    optimisticLock: {
      expectedBeforeUpdatedAt: null,
      currentUpdatedAt: null,
      stale: false,
      staleCheckPerformed: false,
      optimisticLockEnabled: false,
    },
    message: input.message,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      nonDryRunEnabled: false,
      actualWrite: false,
    },
  };
}
