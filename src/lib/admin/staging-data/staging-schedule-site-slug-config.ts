/**
 * G-9f / G-9g — Gosaki staging shell schedule site_slug config.
 */

export const G9F_PHASE = "G-9f-staging-shell-schedule-site-slug-read-binding";

export const G9G1_PHASE = "G-9g1-staging-shell-schedule-site-slug-edit-dry-run-preview";

export const G9G1_DRY_RUN_APPROVAL_ID =
  "G-9g1-schedule-site-slug-edit-dry-run-preview";

export const G9G2_PHASE =
  "G-9g2-staging-shell-schedule-site-slug-title-non-dry-run-poc-implementation";

export const G9G2_TITLE_NON_DRY_RUN_APPROVAL_ID =
  "G-9g2-schedule-site-slug-title-non-dry-run-poc";

export const SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G2_TITLE_NON_DRY_RUN_ARMED";

export const G9G2_TITLE_POC_DEFAULT_TITLE =
  "[CMS Kit staging] G-9g2 title PoC";

export const G9G3A_PHASE =
  "G-9g3a-staging-shell-schedule-site-slug-safe-fields-dry-run-preview";

export const G9G3B_PHASE =
  "G-9g3b-staging-shell-schedule-site-slug-venue-description-non-dry-run-poc-implementation";

export const G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_APPROVAL_ID =
  "G-9g3b-schedule-site-slug-venue-description-non-dry-run-poc";

export const SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G3B_VENUE_DESCRIPTION_NON_DRY_RUN_ARMED";

export const G9G3B_VENUE_POC_DEFAULT =
  "[CMS Kit staging] G-9g3b venue PoC";

export const G9G3B_DESCRIPTION_POC_DEFAULT =
  "出演： [G-9g3b venue+description PoC]";

export const G9G3C_PHASE =
  "G-9g3c-staging-shell-schedule-site-slug-time-price-non-dry-run-poc-implementation";

export const G9G3C_TIME_PRICE_NON_DRY_RUN_APPROVAL_ID =
  "G-9g3c-schedule-site-slug-time-price-non-dry-run-poc";

export const SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G3C_TIME_PRICE_NON_DRY_RUN_ARMED";

export const G9G3C_OPEN_TIME_POC_DEFAULT =
  "[CMS Kit staging] G-9g3c open PoC";

export const G9G3C_START_TIME_POC_DEFAULT =
  "[CMS Kit staging] G-9g3c start PoC";

export const G9G3C_PRICE_POC_DEFAULT =
  "[CMS Kit staging] G-9g3c price PoC";

export const G9G3D_PHASE =
  "G-9g3d-staging-shell-schedule-site-slug-general-edit-consolidation-implementation";

export const G9G3E1_PHASE =
  "G-9g3e1-staging-shell-schedule-site-slug-general-edit-post-execution-hardening-implementation";

export const G9G3F1_PHASE =
  "G-9g3f1-staging-shell-schedule-site-slug-row-picker-implementation";

export const G9G3F3A_PHASE =
  "G-9g3f3a-staging-shell-schedule-site-slug-row-picker-general-edit-binding-implementation";

export const G9G3F3B_PHASE =
  "G-9g3f3b-staging-shell-schedule-site-slug-row-picker-general-edit-binding-smoke-test";

export const G9G3F3C_PHASE =
  "G-9g3f3c-staging-shell-schedule-site-slug-row-picker-general-edit-binding-hardening";

/** Row switch confirm when general edit has unsaved candidate values (G-9g3f3c). */
export const G9G3F3C_ROW_SWITCH_UNSAVED_CONFIRM_MSG =
  "You have unsaved candidate edits. Switching rows will discard the current candidate values. Continue?";

/** Preview result invalidated — operator must re-run G-9 preview (G-9g3f3c). */
export const G9G3F3C_PREVIEW_STALE_MSG =
  "Preview is stale — run G-9 preview again";

export const G9G3F3D_PHASE =
  "G-9g3f3d-row-picker-general-edit-binding-hardening-smoke-test";

export const G9G3G1_PHASE =
  "G-9g3g1-operational-save-path-implementation";

export const G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID =
  "G-9g3g-schedule-site-slug-operational-general-edit-non-dry-run";

export const SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G3G_OPERATIONAL_GENERAL_EDIT_NON_DRY_RUN_ARMED";

export const G9G3G_OPERATIONAL_SAVE_BTN_ID = "site-slug-edit-g9g3g-operational-save-btn";

export const G9G3G_OPERATIONAL_SAVE_RESULT_PANEL_ID =
  "site-slug-edit-g9g3g-operational-save-result";

/** Routine dev default — operational Save stays disabled until explicit G-9g3g arm. */
export const G9G3G_OPERATIONAL_SAVE_DISABLED_DEFAULT_REASON =
  "Operational Save disabled — G-9g3g arm not configured (routine dev safety)";

export const G9G3G_OPERATIONAL_SAVE_GATE_HINT =
  "Operational Save is disabled unless G-9g3g arm, approval ID, latest G-9 preview, host gate, auth, and optimistic lock all pass.";

export const G9G3G_OPERATIONAL_SAVE_LEGACY_WARNING =
  "Do not use legacy G-6 dry-run or G-9g3d PoC Save for operational editing.";

/** G-9g3f3d hardening smoke — price-only preview candidate on picker-selected row. */
export const G9G3F3D_STALE_SMOKE_PRICE_CANDIDATE =
  "[CMS Kit staging] G-9g3f3d stale smoke price candidate";

/** G-9g3f3d hardening smoke — second price edit to trigger stale invalidation. */
export const G9G3F3D_STALE_SMOKE_PRICE_CANDIDATE_CHANGED =
  "[CMS Kit staging] G-9g3f3d stale smoke price candidate changed";

/** G-9g3f3b smoke — price-only dry-run candidate on picker-selected row. */
export const G9G3F3B_SMOKE_PRICE_CANDIDATE =
  "[CMS Kit staging] G-9g3f3b row-picker binding smoke price candidate";

/** PoC audit marker prefix in staging row text fields — exclude from default picker selection. */
export const POC_AUDIT_STAGING_MARKER = "[CMS Kit staging]";

/** G-9g3d4 non-dry-run PoC executed — re-arm and Save prohibited (G-9g3e1). */
export const G9G3D_GENERAL_EDIT_POC_EXECUTED = true;

export const G9G3D_POC_EXECUTED_ARM_FAILURE =
  "General edit PoC executed — do not re-run";

export const G9G3_SLICE_POC_EXECUTED_ARM_FAILURE =
  "Slice PoC executed — do not re-run; use G-9g3d general edit";

export const G9G3D_GENERAL_EDIT_NON_DRY_RUN_APPROVAL_ID =
  "G-9g3d-schedule-site-slug-general-edit-non-dry-run-poc";

export const SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G3D_GENERAL_EDIT_NON_DRY_RUN_ARMED";

export const SCHEDULE_LEGACY_POC_UI_VISIBLE_ENV =
  "PUBLIC_ADMIN_SCHEDULE_LEGACY_POC_UI_VISIBLE";

/** Pilot site for staging shell schedule read binding. */
export const STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG = "gosaki-piano";

/** G-9g1 fixed target row (G-9c2c restored Gosaki seed). */
export const G9G1_TARGET_ROW_ID = "aa440e29-5be8-402e-9190-0d81c48434c0";

export const G9G1_TARGET_LEGACY_ID = "schedule-2026-07-010";

/** Safe fields for site_slug edit path (G-9g planning). */
export const SITE_SLUG_EDIT_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
] as const;

export type SiteSlugEditSafeField = (typeof SITE_SLUG_EDIT_SAFE_FIELDS)[number];

export const GOSAKI_STAGING_CANONICAL_ROUTE_PREFIX = "/schedule/";

export const GOSAKI_STAGING_EXPECTED_MONTHS = [
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
] as const;
