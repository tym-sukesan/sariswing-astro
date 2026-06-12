/**
 * G-6-e2 — Schedule dry-run UI types (staging shell only; no writes).
 */

export type ScheduleRecord = {
  id: string;
  legacy_id?: string | null;
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

export type ScheduleValidationResult = {
  valid: boolean;
  errors: string[];
};

export type ScheduleDryRunOperation = "update" | "duplicate";

export type ScheduleDryRunResult = {
  operation: ScheduleDryRunOperation;
  targetTable: "schedules";
  targetId?: string;
  sourceId?: string;
  dryRun: true;
  wouldWrite: true;
  actualWrite: false;
  approvalId: string;
  validation: ScheduleValidationResult;
  payload: Record<string, unknown>;
  recalculatedYear?: number | null;
  recalculatedMonth?: string | null;
  rollbackHint: string;
  message: string;
};
