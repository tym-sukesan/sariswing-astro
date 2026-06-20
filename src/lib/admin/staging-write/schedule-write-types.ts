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

/** G-6-g1 title non-dry-run slice — product path; title only. */
export type ScheduleG6G1TitleNonDryRunSliceApprovalId =
  "G-6-g1-schedule-title-non-dry-run-slice";

export const G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID:
  ScheduleG6G1TitleNonDryRunSliceApprovalId =
  "G-6-g1-schedule-title-non-dry-run-slice";

/** G-6-g2 time fields non-dry-run slice — product path; open_time + start_time only. */
export type ScheduleG6G2TimeFieldsNonDryRunSliceApprovalId =
  "G-6-g2-schedule-time-fields-non-dry-run-slice";

export const G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID:
  ScheduleG6G2TimeFieldsNonDryRunSliceApprovalId =
  "G-6-g2-schedule-time-fields-non-dry-run-slice";

/** G-9g2 Gosaki site_slug title non-dry-run PoC — title only; separate from G-6-g1. */
export type ScheduleG9G2TitleNonDryRunPocApprovalId =
  "G-9g2-schedule-site-slug-title-non-dry-run-poc";

export const G9G2_SCHEDULE_TITLE_NON_DRY_RUN_POC_APPROVAL_ID:
  ScheduleG9G2TitleNonDryRunPocApprovalId =
  "G-9g2-schedule-site-slug-title-non-dry-run-poc";

/** G-9g3b Gosaki site_slug venue + description non-dry-run PoC. */
export type ScheduleG9G3bVenueDescriptionNonDryRunPocApprovalId =
  "G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc";

export const G9G3B_SCHEDULE_VENUE_DESCRIPTION_NON_DRY_RUN_POC_APPROVAL_ID:
  ScheduleG9G3bVenueDescriptionNonDryRunPocApprovalId =
  "G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc";

/** G-9g3c Gosaki site_slug open_time + start_time + price non-dry-run PoC. */
export type ScheduleG9G3cTimePriceNonDryRunPocApprovalId =
  "G-9g3c-schedule-site-slug-time-price-non-dry-run-poc";

export const G9G3C_SCHEDULE_TIME_PRICE_NON_DRY_RUN_POC_APPROVAL_ID:
  ScheduleG9G3cTimePriceNonDryRunPocApprovalId =
  "G-9g3c-schedule-site-slug-time-price-non-dry-run-poc";

/** G-9g3d Gosaki site_slug general safe-fields non-dry-run PoC. */
export type ScheduleG9G3dGeneralEditNonDryRunPocApprovalId =
  "G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc";

export const G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID:
  ScheduleG9G3dGeneralEditNonDryRunPocApprovalId =
  "G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc";

/** G-9g3g Gosaki site_slug operational general edit non-dry-run — picker-selected non-PoC rows. */
export type ScheduleG9G3gOperationalGeneralEditNonDryRunApprovalId =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";

export const G9G3G_SCHEDULE_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID:
  ScheduleG9G3gOperationalGeneralEditNonDryRunApprovalId =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";

/** G-9g3g5 Gosaki site_slug operational restore non-dry-run — description revert only. */
export type ScheduleG9G3g5OperationalRestoreNonDryRunApprovalId =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";

export const G9G3G5_SCHEDULE_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID:
  ScheduleG9G3g5OperationalRestoreNonDryRunApprovalId =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";

/** G-9g4a1 Gosaki site_slug venue-only operational non-dry-run — venue field slice. */
export type ScheduleG9G4a1VenueOnlyNonDryRunApprovalId =
  "G-9g4a1-schedule-site-slug-venue-only-non-dry-run";

export const G9G4A1_SCHEDULE_VENUE_ONLY_NON_DRY_RUN_APPROVAL_ID:
  ScheduleG9G4a1VenueOnlyNonDryRunApprovalId =
  "G-9g4a1-schedule-site-slug-venue-only-non-dry-run";

/** G-9g4a2a Gosaki site_slug open_time-only operational non-dry-run — open_time field slice. */
export type ScheduleG9G4a2aOpenTimeOnlyNonDryRunApprovalId =
  "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";

export const G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID:
  ScheduleG9G4a2aOpenTimeOnlyNonDryRunApprovalId =
  "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";

/** G-9g4a2b Gosaki site_slug start_time-only operational non-dry-run — start_time field slice. */
export type ScheduleG9G4a2bStartTimeOnlyNonDryRunApprovalId =
  "G-9g4a2b-schedule-site-slug-start-time-only-non-dry-run";

export const G9G4A2B_SCHEDULE_START_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID:
  ScheduleG9G4a2bStartTimeOnlyNonDryRunApprovalId =
  "G-9g4a2b-schedule-site-slug-start-time-only-non-dry-run";

/** G-9g4a2c Gosaki site_slug price-only operational non-dry-run — price field slice. */
export type ScheduleG9G4a2cPriceOnlyNonDryRunApprovalId =
  "G-9g4a2c-schedule-site-slug-price-only-non-dry-run";

export const G9G4A2C_SCHEDULE_PRICE_ONLY_NON_DRY_RUN_APPROVAL_ID:
  ScheduleG9G4a2cPriceOnlyNonDryRunApprovalId =
  "G-9g4a2c-schedule-site-slug-price-only-non-dry-run";

/** G-9j Gosaki operator existing event update non-dry-run — staging shell only. */
export type ScheduleG9jExistingEventUpdateNonDryRunApprovalId =
  "G-9j-gosaki-schedule-existing-event-update-non-dry-run";

export const G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID:
  ScheduleG9jExistingEventUpdateNonDryRunApprovalId =
  "G-9j-gosaki-schedule-existing-event-update-non-dry-run";

export type ScheduleWriteApprovalIdUnion =
  | ScheduleWriteApprovalId
  | ScheduleSafeFieldsNonDryRunPocApprovalId
  | ScheduleG6G1TitleNonDryRunSliceApprovalId
  | ScheduleG6G2TimeFieldsNonDryRunSliceApprovalId
  | ScheduleG9G2TitleNonDryRunPocApprovalId
  | ScheduleG9G3bVenueDescriptionNonDryRunPocApprovalId
  | ScheduleG9G3cTimePriceNonDryRunPocApprovalId
  | ScheduleG9G3dGeneralEditNonDryRunPocApprovalId
  | ScheduleG9G3gOperationalGeneralEditNonDryRunApprovalId
  | ScheduleG9G3g5OperationalRestoreNonDryRunApprovalId
  | ScheduleG9G4a1VenueOnlyNonDryRunApprovalId
  | ScheduleG9G4a2aOpenTimeOnlyNonDryRunApprovalId
  | ScheduleG9G4a2bStartTimeOnlyNonDryRunApprovalId
  | ScheduleG9G4a2cPriceOnlyNonDryRunApprovalId
  | ScheduleG9jExistingEventUpdateNonDryRunApprovalId;

export const SCHEDULE_WRITE_APPROVAL_IDS: readonly ScheduleWriteApprovalIdUnion[] = [
  SCHEDULE_WRITE_APPROVAL_ID,
  G6F6_SCHEDULE_SAFE_FIELDS_NON_DRY_RUN_POC_APPROVAL_ID,
  G6G1_SCHEDULE_TITLE_NON_DRY_RUN_SLICE_APPROVAL_ID,
  G6G2_SCHEDULE_TIME_FIELDS_NON_DRY_RUN_SLICE_APPROVAL_ID,
  G9G2_SCHEDULE_TITLE_NON_DRY_RUN_POC_APPROVAL_ID,
  G9G3B_SCHEDULE_VENUE_DESCRIPTION_NON_DRY_RUN_POC_APPROVAL_ID,
  G9G3C_SCHEDULE_TIME_PRICE_NON_DRY_RUN_POC_APPROVAL_ID,
  G9G3D_SCHEDULE_GENERAL_EDIT_NON_DRY_RUN_POC_APPROVAL_ID,
  G9G3G_SCHEDULE_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID,
  G9G3G5_SCHEDULE_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID,
  G9G4A1_SCHEDULE_VENUE_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2A_SCHEDULE_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2B_SCHEDULE_START_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9G4A2C_SCHEDULE_PRICE_ONLY_NON_DRY_RUN_APPROVAL_ID,
  G9J_SCHEDULE_EXISTING_EVENT_UPDATE_NON_DRY_RUN_APPROVAL_ID,
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
