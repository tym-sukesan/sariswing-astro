/**
 * G-9g3f3a — CustomEvent bridge between row picker and general edit form.
 */

import type { ScheduleRecord } from "../staging-write/schedule-dry-run-types";

export const ROW_SELECTED_EVENT = "staging-schedule-site-slug-row-selected";
export const ROW_CLEARED_EVENT = "staging-schedule-site-slug-row-cleared";
export const ROW_RELOADED_EVENT = "staging-schedule-site-slug-row-reloaded";

export type RowPickerClearReason = "clear" | "invalid" | "poc-audit-blocked" | "site-slug-mismatch";

export interface RowPickerEventDetail {
  id: string;
  legacy_id: string | null;
  site_slug: string;
  updated_at: string | null;
  date: string;
  title: string | null;
  venue: string | null;
  open_time: string | null;
  start_time: string | null;
  price: string | null;
  description: string | null;
  source_route: string | null;
  published: boolean | null;
  show_on_home: boolean | null;
  home_order: number | null;
  sort_order: number | null;
}

export interface RowSelectedEventPayload {
  row: RowPickerEventDetail;
  loadedAt: string;
  source: "picker";
}

export interface RowClearedEventPayload {
  reason: RowPickerClearReason;
}

export interface RowReloadedEventPayload {
  row: RowPickerEventDetail;
  previousUpdatedAt: string | null;
  loadedAt: string;
}

export function scheduleRecordToEventDetail(row: ScheduleRecord): RowPickerEventDetail {
  return {
    id: row.id,
    legacy_id: row.legacy_id ?? null,
    site_slug: row.site_slug,
    updated_at: row.updated_at ?? null,
    date: row.date,
    title: row.title ?? null,
    venue: row.venue ?? null,
    open_time: row.open_time ?? null,
    start_time: row.start_time ?? null,
    price: row.price ?? null,
    description: row.description ?? null,
    source_route: row.source_route ?? null,
    published: row.published ?? null,
    show_on_home: row.show_on_home ?? null,
    home_order: row.home_order ?? null,
    sort_order: row.sort_order ?? null,
  };
}

export function eventDetailToScheduleRecord(detail: RowPickerEventDetail): ScheduleRecord {
  return {
    id: detail.id,
    legacy_id: detail.legacy_id ?? undefined,
    site_slug: detail.site_slug,
    updated_at: detail.updated_at ?? undefined,
    date: detail.date,
    title: detail.title ?? undefined,
    venue: detail.venue ?? undefined,
    open_time: detail.open_time ?? undefined,
    start_time: detail.start_time ?? undefined,
    price: detail.price ?? undefined,
    description: detail.description ?? undefined,
    source_route: detail.source_route ?? undefined,
    published: detail.published ?? undefined,
    show_on_home: detail.show_on_home ?? undefined,
    home_order: detail.home_order ?? undefined,
    sort_order: detail.sort_order ?? undefined,
  };
}

export function dispatchRowSelected(row: ScheduleRecord): void {
  document.dispatchEvent(
    new CustomEvent<RowSelectedEventPayload>(ROW_SELECTED_EVENT, {
      detail: {
        row: scheduleRecordToEventDetail(row),
        loadedAt: new Date().toISOString(),
        source: "picker",
      },
    }),
  );
}

export function dispatchRowCleared(reason: RowPickerClearReason): void {
  document.dispatchEvent(
    new CustomEvent<RowClearedEventPayload>(ROW_CLEARED_EVENT, {
      detail: { reason },
    }),
  );
}

export function dispatchRowReloaded(
  row: ScheduleRecord,
  previousUpdatedAt: string | null,
): void {
  document.dispatchEvent(
    new CustomEvent<RowReloadedEventPayload>(ROW_RELOADED_EVENT, {
      detail: {
        row: scheduleRecordToEventDetail(row),
        previousUpdatedAt,
        loadedAt: new Date().toISOString(),
      },
    }),
  );
}
