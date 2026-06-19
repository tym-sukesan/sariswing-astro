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

export const G9G3G2_PHASE =
  "G-9g3g2-operational-save-ui-gate-smoke-test";

/** G-9g3g2 gate smoke — description-only candidate (no Save). */
export const G9G3G2_GATE_SMOKE_DESCRIPTION_CANDIDATE =
  "[CMS Kit staging] G-9g3g2 gate smoke candidate — no save";

/** G-9g3g2 gate smoke — second description edit to trigger stale invalidation. */
export const G9G3G2_GATE_SMOKE_DESCRIPTION_STALE_CHANGE =
  "[CMS Kit staging] G-9g3g2 gate smoke stale change — no save";

export const G9G3G3_PHASE =
  "G-9g3g3-operational-non-dry-run-preflight";

export const G9G3G4_PHASE =
  "G-9g3g4-operational-non-dry-run-execution";

/** G-9g3g4 operational non-dry-run execution target row (non-PoC). */
export const G9G3G4_OPERATIONAL_TARGET_ROW_ID =
  "888c58f2-f152-4563-a3cf-a20d7c2456c1";

export const G9G3G4_OPERATIONAL_TARGET_LEGACY_ID = "schedule-2026-03-001";

/** Baseline updated_at from G-9g3g2 smoke — operator must reconfirm live before G-9g3g4. */
export const G9G3G4_OPERATIONAL_LOCK_BASELINE_UPDATED_AT =
  "2026-06-16T16:03:41.551792+00:00";

/** G-9g3g4 planned description append marker (changedFields=description only). */
export const G9G3G4_OPERATIONAL_DESCRIPTION_MARKER =
  "[CMS Kit staging] G-9g3g4 operational Save test — temporary marker";

/** Post-G-9g3g4 lock baseline for restore preflight (G-9g3g5b). */
export const G9G3G4_OPERATIONAL_AFTER_UPDATED_AT =
  "2026-06-18T16:35:45.060011+00:00";

/** Original Gosaki description before G-9g3g4 marker (restore candidate). */
export const G9G3G4_OPERATIONAL_DESCRIPTION_ORIGINAL =
  "出演：『ごちまきトリオ』俵千瑛子cl 田村麻紀子cl,vo\n会場website: https://subsaku.com/ginza/";

export const G9G3G5_PHASE =
  "G-9g3g5-post-execution-hardening-and-restore-decision";

export const G9G3G5B_PHASE = "G-9g3g5b-operational-restore-preflight";

export const G9G3G5B1_PHASE =
  "G-9g3g5b1-operational-restore-approval-arm-implementation";

export const G9G3G5C_PHASE = "G-9g3g5c-operational-restore-execution";

/** Lock baseline for restore (post-G-9g3g4) — operator must reconfirm live before G-9g3g5c. */
export const G9G3G5_RESTORE_LOCK_BASELINE_UPDATED_AT =
  "2026-06-18T16:35:45.060011+00:00";

/** Recommended restore path — implementation in G-9g3g5b1/c. */
export const G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_APPROVAL_ID =
  "G-9g3g5-schedule-site-slug-operational-restore-non-dry-run";

export const SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G3G5_OPERATIONAL_RESTORE_NON_DRY_RUN_ARMED";

export const G9G3G5B2_PHASE =
  "G-9g3g5b2-operational-restore-approval-arm-ui-gate-smoke-test";

/** Restore target — same row as G-9g3g4 operational Save. */
export const G9G3G5_RESTORE_TARGET_ROW_ID = G9G3G4_OPERATIONAL_TARGET_ROW_ID;

export const G9G3G5_RESTORE_TARGET_LEGACY_ID = G9G3G4_OPERATIONAL_TARGET_LEGACY_ID;

export const G9G3G5_RESTORE_CHANGED_FIELDS = ["description"] as const;

/** Current description in staging DB (includes G-9g3g4 marker). */
export const G9G3G5_RESTORE_CURRENT_MARKER_DESCRIPTION = G9G3G4_OPERATIONAL_DESCRIPTION_MARKER;

/** Routine dev default — restore Save stays disabled until explicit G-9g3g5 arm. */
export const G9G3G5_OPERATIONAL_RESTORE_DISABLED_DEFAULT_REASON =
  "Operational restore Save disabled — G-9g3g5 restore arm not configured (routine dev safety)";

export const G9G3G5_OPERATIONAL_RESTORE_MODE_LABEL = "G-9g3g5 restore mode";

export const G9G3G5_OPERATIONAL_RESTORE_SAVE_WARNING =
  "Restore uses the same operational Save button but requires the restore approval ID and restore arm. Do not re-click G-9g3g4 Save.";

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

export const G9G3H1_PHASE = "G-9g3h1-save-success-reclick-prevention";

export const G9G3H1A_PHASE =
  "G-9g3h1a-save-success-reclick-prevention-smoke-test";

export const G9G3H1B1_PHASE =
  "G-9g3h1b1-smoke-marker-restore-row-picker-exception";

/** G-9g3h1a smoke marker appended by operator Save — restore target baseline. */
export const G9G3H1A_SMOKE_MARKER =
  "[CMS Kit staging] G-9g3h1a re-click prevention smoke — temporary marker";

export const G9G3H1A_RESTORE_TARGET_ROW_ID = G9G3G4_OPERATIONAL_TARGET_ROW_ID;

export const G9G3H1A_RESTORE_TARGET_LEGACY_ID = G9G3G4_OPERATIONAL_TARGET_LEGACY_ID;

/** Lock baseline after G-9g3h1a smoke Save — operator must reconfirm via Preview in G-9g3h1c. */
export const G9G3H1A_RESTORE_LOCK_BASELINE_UPDATED_AT =
  "2026-06-19T01:18:46.3938+00:00";

export const G9G3H1A_RESTORE_TARGET_UI_LABEL = "G-9g3h1a restore target";

export const G9G3H1A_RESTORE_SELECTABLE_HINT =
  "temporary selectable for smoke marker restore — restore only — operator manual only";

export const G9G3H1_SAVE_SUCCESS_BLOCKED_MSG =
  "Save completed. Re-click is blocked. Run a fresh Preview after changing the candidate or reloading the row.";

export const G9G3H1_OPERATOR_MANUAL_SAVE_COMPLETED_MSG =
  "Operator manual Save completed once. Do not re-click.";

export const G9G3H1_PREVIEW_CONSUMED_MSG =
  "This Preview has been consumed by a successful Save. Run a new Preview before any further write.";

export const G9G3H1_FRESH_PREVIEW_REQUIRED_MSG = "fresh Preview required";

export const G9G3H1_ROUTINE_DEV_SAFETY_HINT =
  "Routine dev should use dry-run with all non-dry-run arms off.";

export const G9G4A1_PHASE = "G-9g4a1-venue-only-operational-expansion-implementation";

export const G9G4A1_VENUE_ONLY_NON_DRY_RUN_APPROVAL_ID =
  "G-9g4a1-schedule-site-slug-venue-only-non-dry-run";

export const SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G4A1_VENUE_ONLY_NON_DRY_RUN_ARMED";

export const G9G4A1_VENUE_ONLY_CHANGED_FIELDS = ["venue"] as const;

export const G9G4A1_VENUE_ONLY_PREVIEW_BTN_ID =
  "site-slug-edit-g9g4a1-venue-only-dry-run-preview-btn";

export const G9G4A1_VENUE_ONLY_PREVIEW_RESULT_ID =
  "site-slug-edit-g9g4a1-venue-only-dry-run-result";

export const G9G4A1_VENUE_ONLY_SAVE_GATE_PANEL_ID =
  "site-slug-edit-g9g4a1-venue-only-save-gate-panel";

export const G9G4A1_VENUE_ONLY_SAVE_BTN_ID =
  "site-slug-edit-g9g4a1-venue-only-save-btn";

export const G9G4A1_VENUE_ONLY_SAVE_RESULT_ID =
  "site-slug-edit-g9g4a1-venue-only-save-result";

/** Routine dev default — venue-only Save stays disabled until explicit G-9g4a1 arm. */
export const G9G4A1_VENUE_ONLY_SAVE_DISABLED_DEFAULT_REASON =
  "G-9g4a1 venue-only Save disabled — arm not configured (routine dev safety)";

/** Documented smoke example — not written in implementation phase. */
export const G9G4A1_VENUE_SMOKE_BEFORE_EXAMPLE = "銀座 N";

export const G9G4A1_VENUE_SMOKE_AFTER_EXAMPLE =
  "銀座 N [G-9g4a1 venue smoke]";

export const G9G4A1_VENUE_SMOKE_RESTORE_EXAMPLE = "銀座 N";

export const G9G4A2A_PHASE = "G-9g4a2a-open-time-only-operational-expansion-implementation";

export const G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID =
  "G-9g4a2a-schedule-site-slug-open-time-only-non-dry-run";

export const SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2A_OPEN_TIME_ONLY_NON_DRY_RUN_ARMED";

export const G9G4A2A_OPEN_TIME_ONLY_CHANGED_FIELDS = ["open_time"] as const;

export const G9G4A2A_OPEN_TIME_ONLY_PREVIEW_BTN_ID =
  "site-slug-edit-g9g4a2a-open-time-only-dry-run-preview-btn";

export const G9G4A2A_OPEN_TIME_ONLY_PREVIEW_RESULT_ID =
  "site-slug-edit-g9g4a2a-open-time-only-dry-run-result";

export const G9G4A2A_OPEN_TIME_ONLY_SAVE_GATE_PANEL_ID =
  "site-slug-edit-g9g4a2a-open-time-only-save-gate-panel";

export const G9G4A2A_OPEN_TIME_ONLY_SAVE_BTN_ID =
  "site-slug-edit-g9g4a2a-open-time-only-save-btn";

export const G9G4A2A_OPEN_TIME_ONLY_SAVE_RESULT_ID =
  "site-slug-edit-g9g4a2a-open-time-only-save-result";

/** Routine dev default — open_time-only Save stays disabled until explicit G-9g4a2a arm. */
export const G9G4A2A_OPEN_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON =
  "G-9g4a2a open_time-only Save disabled — arm not configured (routine dev safety)";

export const G9G4A2B_PHASE = "G-9g4a2b-start-time-only-operational-expansion-implementation";

export const G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_APPROVAL_ID =
  "G-9g4a2b-schedule-site-slug-start-time-only-non-dry-run";

export const SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2B_START_TIME_ONLY_NON_DRY_RUN_ARMED";

export const G9G4A2B_START_TIME_ONLY_CHANGED_FIELDS = ["start_time"] as const;

export const G9G4A2B_START_TIME_ONLY_PREVIEW_BTN_ID =
  "site-slug-edit-g9g4a2b-start-time-only-dry-run-preview-btn";

export const G9G4A2B_START_TIME_ONLY_PREVIEW_RESULT_ID =
  "site-slug-edit-g9g4a2b-start-time-only-dry-run-result";

export const G9G4A2B_START_TIME_ONLY_SAVE_GATE_PANEL_ID =
  "site-slug-edit-g9g4a2b-start-time-only-save-gate-panel";

export const G9G4A2B_START_TIME_ONLY_SAVE_BTN_ID =
  "site-slug-edit-g9g4a2b-start-time-only-save-btn";

export const G9G4A2B_START_TIME_ONLY_SAVE_RESULT_ID =
  "site-slug-edit-g9g4a2b-start-time-only-save-result";

/** Routine dev default — start_time-only Save stays disabled until explicit G-9g4a2b arm. */
export const G9G4A2B_START_TIME_ONLY_SAVE_DISABLED_DEFAULT_REASON =
  "G-9g4a2b start_time-only Save disabled — arm not configured (routine dev safety)";

export const G9G4A2C_PHASE = "G-9g4a2c-price-only-operational-expansion-implementation";

export const G9G4A2C_PRICE_ONLY_NON_DRY_RUN_APPROVAL_ID =
  "G-9g4a2c-schedule-site-slug-price-only-non-dry-run";

export const SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED_ENV =
  "PUBLIC_ADMIN_SCHEDULE_G9G4A2C_PRICE_ONLY_NON_DRY_RUN_ARMED";

export const G9G4A2C_PRICE_ONLY_CHANGED_FIELDS = ["price"] as const;

export const G9G4A2C_PRICE_ONLY_PREVIEW_BTN_ID =
  "site-slug-edit-g9g4a2c-price-only-dry-run-preview-btn";

export const G9G4A2C_PRICE_ONLY_PREVIEW_RESULT_ID =
  "site-slug-edit-g9g4a2c-price-only-dry-run-result";

export const G9G4A2C_PRICE_ONLY_SAVE_GATE_PANEL_ID =
  "site-slug-edit-g9g4a2c-price-only-save-gate-panel";

export const G9G4A2C_PRICE_ONLY_SAVE_BTN_ID =
  "site-slug-edit-g9g4a2c-price-only-save-btn";

export const G9G4A2C_PRICE_ONLY_SAVE_RESULT_ID =
  "site-slug-edit-g9g4a2c-price-only-save-result";

/** Routine dev default — price-only Save stays disabled until explicit G-9g4a2c arm. */
export const G9G4A2C_PRICE_ONLY_SAVE_DISABLED_DEFAULT_REASON =
  "G-9g4a2c price-only Save disabled — arm not configured (routine dev safety)";

export const G9G3H1_SAVE_RECLICK_GUARD_MSG =
  "Operational Save re-click blocked — preview consumed by prior successful Save.";

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
