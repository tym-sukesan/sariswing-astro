/**
 * G-22e — Gosaki Schedule new event dry-run (no DB write; no INSERT).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import { assertStaticToAstroCmsStagingSupabaseProject } from "../staging-data/staging-schedule-site-slug-host-gate";
import type { G9kExistingEventSaveButtonFormValues } from "./gosaki-schedule-existing-event-save-button-dry-run";
import { buildScheduleNewEventDryRunResult } from "./schedule-dry-run-adapter";
import {
  dryRunFormInputToWritePayload,
} from "./schedule-dry-run-validation";
import type {
  ScheduleDryRunFormInput,
  ScheduleDryRunResult,
  ScheduleDryRunValidation,
  ScheduleRecord,
} from "./schedule-dry-run-types";

export const G22E_PHASE = "G-22e-gosaki-schedule-new-event-dry-run-ui-implementation";

export const G22E_SCHEDULE_NEW_EVENT_DRY_RUN_APPROVAL_ID =
  "G-22e-gosaki-schedule-new-event-dry-run";

export const GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_UNSAVED_ID = "__gosaki-new-event-draft-unsaved__";

export const GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_LEGACY_LABEL = "（未保存・採番予定）";

export type GosakiScheduleNewEventDraftState = {
  mode: "new";
  draft: ScheduleRecord;
};

export type G22eScheduleNewEventDryRunSafety = {
  supabaseWriteCalled: false;
  writeAdapterUsed: false;
  scheduleMonthsTouched: false;
  serviceRoleUsed: false;
  actualWrite: false;
};

export type G22eScheduleNewEventDryRunResult = {
  ok: boolean;
  dryRun: true;
  phase: typeof G22E_PHASE;
  approvalId: typeof G22E_SCHEDULE_NEW_EVENT_DRY_RUN_APPROVAL_ID;
  operation: "new";
  wouldInsert: boolean;
  wouldWrite: boolean;
  actualWrite: false;
  saveAllowed: false;
  payloadKeys: string[];
  payload: Record<string, unknown>;
  validation: ScheduleDryRunValidation;
  derivedPreview?: ScheduleDryRunResult["derivedPreview"];
  guardErrors: string[];
  message: string;
  rollbackHint: string;
  safety: G22eScheduleNewEventDryRunSafety;
  adapterResult: ScheduleDryRunResult;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formValuesToDryRunInput(
  formValues: G9kExistingEventSaveButtonFormValues,
  date: string,
  published: boolean,
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
    sort_order: null,
  };
}

/**
 * Soft validation for new-event dry-run preview — warnings for missing fields;
 * preview always renderable when guardErrors is empty.
 */
export function validateG22eNewEventDryRunForm(
  form: ScheduleDryRunFormInput,
): ScheduleDryRunValidation {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (!form.date.trim()) {
    warnings.push("日付が未入力です");
  } else if (!DATE_RE.test(form.date.trim())) {
    errors.push("日付は YYYY-MM-DD 形式で入力してください");
  } else {
    const parsed = Date.parse(`${form.date.trim()}T00:00:00`);
    if (Number.isNaN(parsed)) {
      errors.push("日付が有効な暦日ではありません");
    }
  }

  if (!form.title.trim()) {
    warnings.push("タイトルが未入力です");
  }

  if (!form.venue.trim()) {
    warnings.push("会場が未入力です");
  }

  const ok =
    errors.length === 0 &&
    form.date.trim().length > 0 &&
    DATE_RE.test(form.date.trim()) &&
    form.title.trim().length > 0;

  return { ok, errors, warnings };
}

export function buildGosakiScheduleNewEventDraft(
  seed?: Partial<ScheduleRecord>,
): GosakiScheduleNewEventDraftState {
  const draft: ScheduleRecord = {
    id: GOSAKI_SCHEDULE_NEW_EVENT_DRAFT_UNSAVED_ID,
    legacy_id: null,
    site_slug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    date: "",
    title: "",
    venue: "",
    open_time: "",
    start_time: "",
    price: "",
    description: "",
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: null,
    updated_at: null,
    created_at: null,
    ...seed,
  };

  return {
    mode: "new",
    draft,
  };
}

function buildNewEventPayloadPreview(form: ScheduleDryRunFormInput): Record<string, unknown> {
  const normalized: ScheduleDryRunFormInput = {
    ...form,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: null,
  };

  return {
    legacy_id: null,
    ...dryRunFormInputToWritePayload(normalized),
    site_slug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: null,
  };
}

/**
 * Pure new-event dry-run preview for Gosaki operator UI (G-22e).
 * Does not call Supabase insert or any write adapter.
 */
export function executeG22eScheduleNewEventDryRun(input: {
  formValues: G9kExistingEventSaveButtonFormValues;
  date: string;
  published: boolean;
  signedIn?: boolean;
  supabaseUrl?: string;
}): G22eScheduleNewEventDryRunResult {
  const guardErrors: string[] = [];

  if (input.signedIn === false) {
    guardErrors.push("G-22e authenticated admin session required for new event preview.");
  }

  if (input.supabaseUrl !== undefined) {
    try {
      assertStaticToAstroCmsStagingSupabaseProject(input.supabaseUrl);
    } catch (error) {
      guardErrors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const formInput = formValuesToDryRunInput(input.formValues, input.date, false);
  const validation = validateG22eNewEventDryRunForm(formInput);
  const adapterResult = buildScheduleNewEventDryRunResult({
    form: formInput,
    approvalId: G22E_SCHEDULE_NEW_EVENT_DRY_RUN_APPROVAL_ID,
  });

  const payloadWithSiteSlug = buildNewEventPayloadPreview(formInput);
  const derivedPreview = adapterResult.derivedPreview;

  const wouldInsert = validation.ok;
  const previewOk = guardErrors.length === 0;

  return {
    ok: previewOk,
    dryRun: true,
    phase: G22E_PHASE,
    approvalId: G22E_SCHEDULE_NEW_EVENT_DRY_RUN_APPROVAL_ID,
    operation: "new",
    wouldInsert,
    wouldWrite: wouldInsert,
    actualWrite: false,
    saveAllowed: false,
    payloadKeys: Object.keys(payloadWithSiteSlug),
    payload: payloadWithSiteSlug,
    validation,
    derivedPreview,
    guardErrors: [...guardErrors, ...validation.errors],
    message: previewOk
      ? wouldInsert
        ? "この内容で新規追加される予定です。データベースは変更されません。"
        : "入力内容を確認しました。保存不可の理由を確認してください。データベースは変更されません。"
      : "新規追加案を確認できませんでした。",
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
