/**
 * G-6-e4 — Schedule write adapter types (staging only; separate from dry-run adapter).
 *
 * SCHEDULE_WRITE_APPROVAL_ID is the one-off G-6-e5 hidden PoC approval only.
 * G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID is for G-6-f6 safe-fields PoC.
 * General Schedule edit UI must use new approval IDs. Do not reuse G-6-e5.
 */

import type { ScheduleDryRunSource } from "./schedule-dry-run-types";

export type ScheduleWriteOperation = "update";

/** One-off G-6-e5 hidden PoC — not for general Schedule CMS UI. */
export type ScheduleWriteApprovalId = "G-6-e5-schedule-non-dry-run-poc";

export const SCHEDULE_WRITE_APPROVAL_ID: ScheduleWriteApprovalId =
  "G-6-e5-schedule-non-dry-run-poc";

/** G-6-f6 safe-fields non-dry-run PoC — venue + description only. */
export type ScheduleSafeFieldsNonDryRunPocApprovalId =
  "G-6-f6-schedule-safe-fields-non-dry-run-poc";

export const G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID:
  ScheduleSafeFieldsNonDryRunPocApprovalId =
  "G-6-f6-schedule-safe-fields-non-dry-run-poc";

export type ScheduleWriteApprovalIdUnion =
  | ScheduleWriteApprovalId
  | ScheduleSafeFieldsNonDryRunPocApprovalId;

export const SCHEDULE_WRITE_APPROVAL_IDS: readonly ScheduleWriteApprovalIdUnion[] = [
  SCHEDULE_WRITE_APPROVAL_ID,
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
];

export type ScheduleUpdateWritePayload = {
  date?: string;
  title?: string | null;
  venue?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  description?: string | null;
  published?: boolean;
  show_on_home?: boolean;
  home_order?: number | null;
  sort_order?: number | null;
  updated_at?: string;
};

export type ScheduleUpdateWriteInput = {
  approvalId: ScheduleWriteApprovalIdUnion;
  targetId: string;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  expectedBeforeUpdatedAt?: string | null;
};

export type ScheduleWriteSafety = {
  stagingOnly: true;
  productionBlocked: true;
  serviceRoleUsed: false;
  scheduleMonthsTouched: false;
  deleteEnabled: false;
  publishTriggered: false;
};

export type ScheduleWriteResult = {
  module: "schedule";
  operation: "update";
  targetTable: "schedules";
  targetId: string;
  dryRun: false;
  actualWrite: true;
  approvalId: ScheduleWriteApprovalIdUnion;
  rowsAffected?: number;
  beforeSnapshot: ScheduleDryRunSource;
  payload: ScheduleUpdateWritePayload;
  afterSnapshot?: ScheduleDryRunSource;
  changedFields: string[];
  rollbackHint: string;
  safety: ScheduleWriteSafety;
};

export type ScheduleWriteFailureResult = {
  module: "schedule";
  operation: "update";
  targetTable: "schedules";
  targetId?: string;
  dryRun: false;
  actualWrite: false;
  approvalId?: string;
  errorCode: string;
  errorMessage: string;
  beforeSnapshot?: ScheduleDryRunSource;
  payload?: ScheduleUpdateWritePayload;
  rollbackHint?: string;
  safety: ScheduleWriteSafety;
};

/** Update may have succeeded but after row could not be loaded — manual verification required. */
export type ScheduleWriteVerificationRequiredResult = Omit<
  ScheduleWriteFailureResult,
  "actualWrite" | "targetId" | "beforeSnapshot"
> & {
  actualWrite: true;
  targetId: string;
  beforeSnapshot: ScheduleDryRunSource;
};

export type ScheduleWriteAdapterResult =
  | ScheduleWriteResult
  | ScheduleWriteFailureResult
  | ScheduleWriteVerificationRequiredResult;

export type ScheduleWriteQueryResult = {
  data: ScheduleDryRunSource | null;
  error: { message: string; code?: string } | null;
};

export type ScheduleWriteFilterBuilder = {
  eq: (column: string, value: string) => ScheduleWriteFilterBuilder;
  select: (columns?: string) => ScheduleWriteFilterBuilder;
  single: () => Promise<ScheduleWriteQueryResult>;
};

export type ScheduleWriteTableBuilder = {
  select: (columns?: string) => ScheduleWriteFilterBuilder;
  update: (payload: ScheduleUpdateWritePayload) => ScheduleWriteFilterBuilder;
};

/** Narrow Supabase client boundary — authenticated staging client only. */
export type ScheduleWriteClient = {
  from: (table: "schedules") => ScheduleWriteTableBuilder;
};

/** Re-export optimistic lock wiring for general / next-slice path (G-6-f10). */
export type { ScheduleOptimisticLockDryRunState } from "./schedule-optimistic-lock-types";
