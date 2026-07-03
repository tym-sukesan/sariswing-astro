/**
 * G-22e3 — Gosaki Schedule new event INSERT guards (single slice).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import type { G9kExistingEventSaveButtonFormValues } from "./gosaki-schedule-existing-event-save-button-dry-run";
import {
  G22E_PROTECTED_DUPLICATE_INSERT_LEGACY_ID,
  getG22eNewEventInsertConfig,
} from "./gosaki-schedule-new-event-insert-config";
import { deriveYearMonthFromDate } from "./schedule-dry-run-validation";
import type { ScheduleRecord } from "./schedule-dry-run-types";
import type { ScheduleInsertWritePayload } from "./schedule-write-types";
import { G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22E_NEW_EVENT_INSERT_PAYLOAD_KEYS = [
  "legacy_id",
  "site_slug",
  "date",
  "year",
  "month",
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
  "show_on_home",
  "home_order",
  "sort_order",
  "source_file",
  "source_route",
  "image_url",
] as const;

export const G22E_LEGACY_ID_RE = /^schedule-\d{4}-\d{2}-\d{3}$/;

export type G22eNewEventInsertPayloadKey = (typeof G22E_NEW_EVENT_INSERT_PAYLOAD_KEYS)[number];

export type G22eMonthAllocationRow = {
  legacy_id: string | null;
  sort_order: number | null;
  month?: string | null;
};

export function parseLegacyIdSuffix(legacyId: string): number | null {
  const match = legacyId.match(/^schedule-\d{4}-\d{2}-(\d{3})$/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function formatLegacyId(month: string, suffix: number): string {
  return `schedule-${month}-${String(suffix).padStart(3, "0")}`;
}

export function deriveG22eSourceRoute(month: string): string {
  return `/schedule/${month}/`;
}

export function deriveG22eSourceFile(month: string): string {
  return `schedule-${month}.html`;
}

export function computeNextLegacyIdFromRows(
  month: string,
  rows: readonly G22eMonthAllocationRow[],
): string {
  let maxSuffix = 0;
  const prefix = `schedule-${month}-`;
  for (const row of rows) {
    const legacyId = row.legacy_id ?? "";
    if (!legacyId.startsWith(prefix)) continue;
    const suffix = parseLegacyIdSuffix(legacyId);
    if (suffix !== null && suffix > maxSuffix) {
      maxSuffix = suffix;
    }
  }
  return formatLegacyId(month, maxSuffix + 1);
}

export function computeSortOrderFromRows(rows: readonly G22eMonthAllocationRow[]): number {
  let maxSort = 0;
  let hasSortOrder = false;
  for (const row of rows) {
    if (typeof row.sort_order === "number") {
      hasSortOrder = true;
      if (row.sort_order > maxSort) maxSort = row.sort_order;
    }
  }
  if (!hasSortOrder && rows.length === 0) return 10;
  return maxSort + 10;
}

export function filterRowsForTargetMonth(
  rows: readonly G22eMonthAllocationRow[],
  month: string,
): G22eMonthAllocationRow[] {
  return rows.filter((row) => row.month == null || row.month === month);
}

export function computeG22ePlannedAllocation(input: {
  date: string;
  monthRows: readonly G22eMonthAllocationRow[];
}): {
  month: string;
  legacy_id: string;
  sort_order: number;
  source_route: string;
  source_file: string;
} {
  const { month } = deriveYearMonthFromDate(input.date.trim());
  if (!month) {
    throw new Error("G-22e date must yield a valid YYYY-MM month.");
  }
  const monthRows = filterRowsForTargetMonth(input.monthRows, month);
  const legacy_id = computeNextLegacyIdFromRows(month, monthRows);
  const sort_order = computeSortOrderFromRows(monthRows);
  return {
    month,
    legacy_id,
    sort_order,
    source_route: deriveG22eSourceRoute(month),
    source_file: deriveG22eSourceFile(month),
  };
}

export function buildG22eNewEventInsertPayload(input: {
  formValues: G9kExistingEventSaveButtonFormValues;
  date: string;
  monthRows: readonly G22eMonthAllocationRow[];
}): ScheduleInsertWritePayload {
  const date = input.date.trim();
  const { year, month } = deriveYearMonthFromDate(date);
  if (year == null || month == null) {
    throw new Error("G-22e date/year/month must be consistent.");
  }
  const allocation = computeG22ePlannedAllocation({
    date,
    monthRows: input.monthRows,
  });

  return {
    legacy_id: allocation.legacy_id,
    site_slug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    date,
    year,
    month,
    title: input.formValues.title.trim(),
    venue: input.formValues.venue.trim() || null,
    open_time: input.formValues.open_time.trim() || null,
    start_time: input.formValues.start_time.trim() || null,
    price: input.formValues.price.trim() || null,
    description: input.formValues.description.trim() || null,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: allocation.sort_order,
    source_file: allocation.source_file,
    source_route: allocation.source_route,
    image_url: null,
  };
}

export function assertG22eNewEventInsertPayloadOnly(payload: ScheduleInsertWritePayload): void {
  const keys = Object.keys(payload).sort();
  const allowed = [...G22E_NEW_EVENT_INSERT_PAYLOAD_KEYS].sort();
  if (keys.length !== allowed.length || !keys.every((key, index) => key === allowed[index])) {
    throw new Error(
      `G-22e INSERT payload keys mismatch (expected ${allowed.join(", ")}, got ${keys.join(", ")}).`,
    );
  }
  if ("id" in (payload as Record<string, unknown>)) {
    throw new Error("G-22e INSERT must not specify id.");
  }
  if (payload.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error(`G-22e site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}.`);
  }
  if (!payload.legacy_id || !G22E_LEGACY_ID_RE.test(payload.legacy_id)) {
    throw new Error("G-22e legacy_id must match schedule-YYYY-MM-NNN.");
  }
  const legacyMonth = payload.legacy_id.slice("schedule-".length, "schedule-".length + 7);
  if (payload.month !== legacyMonth) {
    throw new Error("G-22e legacy_id month must match payload month.");
  }
  const { year, month } = deriveYearMonthFromDate(payload.date);
  if (year !== payload.year || month !== payload.month) {
    throw new Error("G-22e date/year/month must be consistent.");
  }
  if (payload.source_route !== deriveG22eSourceRoute(String(payload.month))) {
    throw new Error("G-22e source_route must be /schedule/YYYY-MM/.");
  }
  if (payload.source_file !== deriveG22eSourceFile(String(payload.month))) {
    throw new Error("G-22e source_file must be schedule-YYYY-MM.html.");
  }
  if (!payload.title?.trim()) {
    throw new Error("G-22e title must be non-empty.");
  }
  if (payload.published !== false) {
    throw new Error("G-22e new event INSERT must set published=false.");
  }
  if (payload.show_on_home !== false) {
    throw new Error("G-22e new event INSERT must set show_on_home=false.");
  }
  if (payload.home_order !== null) {
    throw new Error("G-22e new event INSERT must set home_order=null.");
  }
  if (typeof payload.sort_order !== "number" || Number.isNaN(payload.sort_order)) {
    throw new Error("G-22e sort_order must be a number.");
  }
  if (payload.legacy_id === G22E_PROTECTED_DUPLICATE_INSERT_LEGACY_ID) {
    throw new Error(
      `G-22e must not touch protected duplicate row legacy_id ${G22E_PROTECTED_DUPLICATE_INSERT_LEGACY_ID}.`,
    );
  }
}

export function collectG22eNewEventInsertGuardFailures(input: {
  newEventMode: boolean;
  newEventDryRunOk: boolean;
  newEventDryRunOperation?: string;
  hasExistingScheduleId: boolean;
  hasDuplicateSourceId: boolean;
  approvalId?: string;
  env?: ImportMetaEnv;
}): string[] {
  const failures: string[] = [];
  const config = getG22eNewEventInsertConfig(input.env ?? import.meta.env);

  if (!input.newEventMode) failures.push("new event draft mode required");
  if (!config.saveEnabled) {
    failures.push(config.armFailureReason ?? config.defaultDisabledReason);
    return failures;
  }
  if (
    input.approvalId &&
    input.approvalId !== G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID
  ) {
    failures.push(`approvalId must be ${G22E_SCHEDULE_NEW_EVENT_INSERT_NON_DRY_RUN_APPROVAL_ID}`);
  }
  if (input.hasExistingScheduleId) {
    failures.push("new event must not carry existing schedule id");
  }
  if (input.hasDuplicateSourceId) {
    failures.push("new event must not carry duplicate sourceId");
  }
  if (input.newEventDryRunOperation && input.newEventDryRunOperation !== "new") {
    failures.push("latest dry-run operation must be new");
  }
  if (!input.newEventDryRunOk) {
    failures.push("new event dry-run preview must be ok");
  }
  return failures;
}

export function scheduleRecordsToMonthAllocationRows(
  records: readonly ScheduleRecord[],
): G22eMonthAllocationRow[] {
  return records.map((row) => ({
    legacy_id: row.legacy_id ?? null,
    sort_order: row.sort_order ?? null,
    month: row.month ?? null,
  }));
}
