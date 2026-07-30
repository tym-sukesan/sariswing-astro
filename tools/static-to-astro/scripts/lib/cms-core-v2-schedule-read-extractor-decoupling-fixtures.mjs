/**
 * Deep-equality fixtures for schedule-read ↔ Gosaki extractor decoupling.
 * Synthetic seed rows only — no network / no fixture crawl required.
 */

/** Extractor-shaped seed row (pre-normalize). */
export const SEED_ROW_RAW = Object.freeze({
  id: null,
  legacy_id: "schedule-2026-08-fixture-001",
  site_slug: "gosaki-piano",
  date: "2026-08-15",
  year: 2026,
  month: "2026-08",
  title: "[CMS Kit] schedule-read decoupling fixture",
  venue: "Fixture Hall",
  open_time: "18:00",
  start_time: "19:00",
  price: "¥3,000",
  description: "fixture description",
  image_url: null,
  source_file: "2026-08.html",
  source_route: "/schedule/2026-08/",
  show_on_home: false,
  home_order: null,
  published: true,
  sort_order: 1,
  updated_at: null,
});

/**
 * Expected normalizeScheduleRecord(SEED_ROW_RAW) — lock public row shape.
 * date_display / label derived by Core helpers (must stay stable).
 */
export const SEED_ROW_NORMALIZED = Object.freeze({
  id: null,
  legacy_id: "schedule-2026-08-fixture-001",
  site_slug: "gosaki-piano",
  date: "2026-08-15",
  date_display: "2026.08.15 (Sat)",
  year: 2026,
  month: "2026-08",
  title: "[CMS Kit] schedule-read decoupling fixture",
  venue: "Fixture Hall",
  open_time: "18:00",
  start_time: "19:00",
  price: "¥3,000",
  description: "fixture description",
  image_url: null,
  source_file: "2026-08.html",
  source_route: "/schedule/2026-08/",
  show_on_home: false,
  home_order: null,
  published: true,
  sort_order: 1,
  updated_at: null,
  label: "2026.08",
});

/** Expected empty-env static-fallback envelope keys (values asserted in verifier). */
export const STATIC_FALLBACK_ENVELOPE_KEYS = Object.freeze([
  "scheduleDataSource",
  "fallbackReason",
  "schedules",
  "months",
  "siteSlug",
  "rowCount",
]);
