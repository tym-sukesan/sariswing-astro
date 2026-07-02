/**
 * G-22b — Gosaki Schedule duplicate dry-run (no DB write; no INSERT).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import type { G9kExistingEventSaveButtonFormValues } from "./gosaki-schedule-existing-event-save-button-dry-run";
import { buildScheduleDuplicateDryRunResult } from "./schedule-dry-run-adapter";
import type {
  ScheduleDryRunFormInput,
  ScheduleDryRunResult,
  ScheduleRecord,
} from "./schedule-dry-run-types";

export const G22B_PHASE = "G-22b-gosaki-schedule-duplicate-dry-run-ui-implementation";

export const G22B_SCHEDULE_DUPLICATE_DRY_RUN_APPROVAL_ID =
  "G-22b-gosaki-schedule-duplicate-dry-run";

export const GOSAKI_SCHEDULE_DUPLICATE_DRAFT_UNSAVED_ID = "__gosaki-duplicate-draft-unsaved__";

export const GOSAKI_SCHEDULE_DUPLICATE_DRAFT_LEGACY_LABEL = "（未保存・採番予定）";

export type GosakiScheduleEditDraftMode = "existing" | "duplicate";

export type GosakiScheduleDuplicateDraftState = {
  mode: "duplicate";
  sourceId: string;
  sourceLegacyId: string | null;
  draft: ScheduleRecord;
};

export type G22bScheduleDuplicateDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
};

export type G22bScheduleDuplicateDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G22B_PHASE;
  approvalId: typeof G22B_SCHEDULE_DUPLICATE_DRY_RUN_APPROVAL_ID;
  operation: "duplicate";
  wouldInsert: boolean;
  wouldWrite: boolean;
  actualWrite: false;
  saveAllowed: false;
  source: {
    id: string;
    legacy_id: string | null;
    title: string;
    date: string;
    site_slug: string;
  };
  payloadKeys: string[];
  payload: Record<string, unknown>;
  validation: { ok: boolean; errors: string[]; warnings: string[] };
  derivedPreview?: ScheduleDryRunResult["derivedPreview"];
  guardErrors: string[];
  message: string;
  rollbackHint: string;
  safety: G22bScheduleDuplicateDryRunSafety;
  adapterResult: ScheduleDryRunResult;
};

function duplicateTitleSuffix(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "（コピー）";
  if (trimmed.endsWith("（コピー）") || trimmed.endsWith("のコピー")) return trimmed;
  return `${trimmed}（コピー）`;
}

export function buildGosakiScheduleDuplicateDraft(
  source: ScheduleRecord,
): GosakiScheduleDuplicateDraftState {
  const draft: ScheduleRecord = {
    ...source,
    id: GOSAKI_SCHEDULE_DUPLICATE_DRAFT_UNSAVED_ID,
    legacy_id: null,
    title: duplicateTitleSuffix(String(source.title ?? "")),
    published: source.published === true,
    updated_at: null,
    created_at: null,
  };

  return {
    mode: "duplicate",
    sourceId: source.id,
    sourceLegacyId: source.legacy_id ?? null,
    draft,
  };
}

function formValuesToDryRunInput(
  formValues: G9kExistingEventSaveButtonFormValues,
  date: string,
  published: boolean,
  sortOrder: number | null | undefined,
): ScheduleDryRunFormInput {
  return {
    date: date.trim(),
    title: formValues.title,
    venue: formValues.venue,
    open_time: formValues.open_time,
    start_time: formValues.start_time,
    price: formValues.price,
    description: formValues.description,
    published,
    show_on_home: false,
    home_order: null,
    sort_order: sortOrder ?? 0,
  };
}

/**
 * Pure duplicate dry-run preview for Gosaki operator UI (G-22b).
 * Does not call Supabase insert or any write adapter.
 */
export function executeG22bScheduleDuplicateDryRun(input: {
  source: ScheduleRecord;
  formValues: G9kExistingEventSaveButtonFormValues;
  date: string;
  published: boolean;
  signedIn?: boolean;
  supabaseUrl?: string;
}): G22bScheduleDuplicateDryRunResult {
  const guardErrors: string[] = [];

  if (input.signedIn === false) {
    guardErrors.push("G-22b authenticated admin session required for duplicate preview.");
  }

  if (input.supabaseUrl !== undefined) {
    try {
      assertStaticToAstroCmsStagingSupabaseProject(input.supabaseUrl);
    } catch (error) {
      guardErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const overrides = formValuesToDryRunInput(
    input.formValues,
    input.date,
    input.published,
    input.source.sort_order,
  );

  const adapterResult = buildScheduleDuplicateDryRunResult({
    source: input.source,
    overrides,
    approvalId: G22B_SCHEDULE_DUPLICATE_DRY_RUN_APPROVAL_ID,
  });

  const payloadWithSiteSlug = {
    ...adapterResult.payload,
    site_slug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
  };

  const validationErrors = adapterResult.validation.ok ? [] : adapterResult.validation.errors;
  const ok = guardErrors.length === 0 && adapterResult.validation.ok;
  const wouldInsert = adapterResult.wouldWrite;

  return {
    ok,
    dryRun: true,
    phase: G22B_PHASE,
    approvalId: G22B_SCHEDULE_DUPLICATE_DRY_RUN_APPROVAL_ID,
    operation: "duplicate",
    wouldInsert,
    wouldWrite: wouldInsert,
    actualWrite: false,
    saveAllowed: false,
    source: {
      id: input.source.id,
      legacy_id: input.source.legacy_id ?? null,
      title: String(input.source.title ?? ""),
      date: String(input.source.date ?? ""),
      site_slug: String(input.source.site_slug ?? STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG),
    },
    payloadKeys: Object.keys(payloadWithSiteSlug),
    payload: payloadWithSiteSlug,
    validation: adapterResult.validation,
    derivedPreview: adapterResult.derivedPreview,
    guardErrors: [...guardErrors, ...validationErrors],
    message: ok
      ? "この内容で新規追加される予定です。データベースは変更されません。"
      : adapterResult.message,
    rollbackHint: adapterResult.rollbackHint,
    safety: {
      supabaseWriteCalled: false,
      writeAdapterUsed: false,
      scheduleMonthsTouched: false,
      serviceRoleUsed: false,
      actualWrite: false,
    },
    adapterResult,
  };
}
