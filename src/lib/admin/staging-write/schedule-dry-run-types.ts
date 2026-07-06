/**
 * G-6-e3 — Schedule dry-run types (staging shell only; no writes).
 */

export type ScheduleDryRunOperation = "update" | "duplicate" | "new" | "unpublish";

/** Gosaki operator edit panel draft modes (G-22b / G-22e / G-22f). */
export type GosakiScheduleEditDraftMode =
  | "existing"
  | "duplicate"
  | "new"
  | "unpublish";

export type ScheduleDryRunSource = {
  id: string;
  legacy_id?: string | null;
  site_slug?: string | null;
  date: string;
  year?: number | null;
  month?: string | null;
  title?: string | null;
  venue?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  description?: string | null;
  show_on_home?: boolean | null;
  home_order?: number | null;
  published?: boolean | null;
  sort_order?: number | null;
  source_file?: string | null;
  source_route?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

/** Alias used by read loader and UI list state. */
export type ScheduleRecord = ScheduleDryRunSource;

/** UI form boundary (string fields for numeric inputs). */
export type ScheduleFormState = {
  date: string;
  title: string;
  venue: string;
  open_time: string;
  start_time: string;
  price: string;
  description: string;
  published: boolean;
  show_on_home: boolean;
  home_order: string;
  sort_order: string;
};

export type ScheduleDryRunFormInput = {
  date: string;
  title: string;
  venue: string;
  open_time: string;
  start_time: string;
  price: string;
  description: string;
  published: boolean;
  show_on_home: boolean;
  home_order: number | null;
  sort_order: number | null;
};

export type ScheduleDryRunValidation = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

/** @deprecated Use ScheduleDryRunValidation */
export type ScheduleValidationResult = {
  valid: boolean;
  errors: string[];
};

export type ScheduleDryRunDerivedPreview = {
  recalculatedYear?: number | null;
  recalculatedMonth?: string | null;
  scheduleGroup?: "future" | "past";
};

export type ScheduleDryRunSafety = {
  dbClientReceived: false;
  supabaseWriteCalled: false;
  scheduleMonthsTouched: false;
  deleteEnabled: false;
  nonDryRunEnabled: false;
};

export type ScheduleDryRunResult = {
  module: "schedule";
  operation: ScheduleDryRunOperation;
  targetTable: "schedules";
  targetId?: string;
  sourceId?: string;
  dryRun: true;
  wouldWrite: boolean;
  actualWrite: false;
  approvalId: string;
  validation: ScheduleDryRunValidation;
  beforeSnapshot?: ScheduleDryRunSource;
  payload: Record<string, unknown>;
  derivedPreview?: ScheduleDryRunDerivedPreview;
  rollbackHint: string;
  message: string;
  safety: ScheduleDryRunSafety;
};
