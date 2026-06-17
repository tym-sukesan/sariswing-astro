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
