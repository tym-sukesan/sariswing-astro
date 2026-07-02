/**
 * G-22d1 — Gosaki Schedule duplicate INSERT guards (single slice).
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import type { G9kExistingEventSaveButtonFormValues } from "./gosaki-schedule-existing-event-save-button-dry-run";
import {
  G22D_DUPLICATE_INSERT_EXPECTED_TITLE,
  G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID,
  G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER,
  G22D_DUPLICATE_INSERT_SOURCE_ID,
  G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID,
  getG22dDuplicateInsertConfig,
} from "./gosaki-schedule-duplicate-insert-config";
import { deriveYearMonthFromDate } from "./schedule-dry-run-validation";
import type { ScheduleDryRunSource } from "./schedule-dry-run-types";
import type { ScheduleInsertWritePayload } from "./schedule-write-types";
import { G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID } from "./schedule-write-types";

export const G22D_DUPLICATE_INSERT_PAYLOAD_KEYS = [
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

export type G22dDuplicateInsertPayloadKey = (typeof G22D_DUPLICATE_INSERT_PAYLOAD_KEYS)[number];

function duplicateTitleSuffix(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) return "（コピー）";
  if (trimmed.endsWith("（コピー）") || trimmed.endsWith("のコピー")) return trimmed;
  return `${trimmed}（コピー）`;
}

export function buildG22dDuplicateInsertPayload(input: {
  source: ScheduleDryRunSource;
  formValues: G9kExistingEventSaveButtonFormValues;
  date: string;
}): ScheduleInsertWritePayload {
  const date = input.date.trim();
  const { year, month } = deriveYearMonthFromDate(date);
  const title = duplicateTitleSuffix(input.formValues.title);

  return {
    legacy_id: G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID,
    site_slug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    date,
    year,
    month,
    title,
    venue: input.formValues.venue.trim() || null,
    open_time: input.formValues.open_time.trim() || null,
    start_time: input.formValues.start_time.trim() || null,
    price: input.formValues.price.trim() || null,
    description: input.formValues.description.trim() || null,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER,
    source_file: input.source.source_file ?? null,
    source_route: input.source.source_route ?? null,
    image_url: input.source.image_url ?? null,
  };
}

export function assertG22dDuplicateInsertPayloadOnly(payload: ScheduleInsertWritePayload): void {
  const keys = Object.keys(payload).sort();
  const allowed = [...G22D_DUPLICATE_INSERT_PAYLOAD_KEYS].sort();
  if (keys.length !== allowed.length || !keys.every((key, index) => key === allowed[index])) {
    throw new Error(
      `G-22d INSERT payload keys mismatch (expected ${allowed.join(", ")}, got ${keys.join(", ")}).`,
    );
  }
  if (payload.legacy_id !== G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID) {
    throw new Error(
      `G-22d legacy_id must be ${G22D_DUPLICATE_INSERT_PLANNED_LEGACY_ID}, got ${payload.legacy_id}.`,
    );
  }
  if (payload.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error(`G-22d site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}.`);
  }
  if (payload.published !== false) {
    throw new Error("G-22d duplicate INSERT must set published=false.");
  }
  if (payload.show_on_home !== false) {
    throw new Error("G-22d duplicate INSERT must set show_on_home=false.");
  }
  if (payload.home_order !== null) {
    throw new Error("G-22d duplicate INSERT must set home_order=null.");
  }
  if (payload.sort_order !== G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER) {
    throw new Error(
      `G-22d sort_order must be ${G22D_DUPLICATE_INSERT_PLANNED_SORT_ORDER}, got ${String(payload.sort_order)}.`,
    );
  }
  if (payload.title !== G22D_DUPLICATE_INSERT_EXPECTED_TITLE) {
    throw new Error(
      `G-22d title must be ${G22D_DUPLICATE_INSERT_EXPECTED_TITLE}, got ${String(payload.title)}.`,
    );
  }
}

export function collectG22dDuplicateInsertGuardFailures(input: {
  duplicateMode: boolean;
  source: ScheduleDryRunSource | null;
  duplicateDryRunOk: boolean;
  approvalId?: string;
  env?: ImportMetaEnv;
}): string[] {
  const failures: string[] = [];
  const config = getG22dDuplicateInsertConfig(input.env ?? import.meta.env);

  if (!input.duplicateMode) failures.push("duplicate draft mode required");
  if (!config.saveEnabled) {
    failures.push(config.armFailureReason ?? config.defaultDisabledReason);
    return failures;
  }
  if (input.approvalId && input.approvalId !== G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID) {
    failures.push(`approvalId must be ${G22D_SCHEDULE_DUPLICATE_INSERT_NON_DRY_RUN_APPROVAL_ID}`);
  }
  if (!input.source) {
    failures.push("duplicate source snapshot required");
    return failures;
  }
  if (input.source.id !== G22D_DUPLICATE_INSERT_SOURCE_ID) {
    failures.push(`sourceId must be ${G22D_DUPLICATE_INSERT_SOURCE_ID}`);
  }
  if (input.source.legacy_id !== G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID) {
    failures.push(`source legacy_id must be ${G22D_DUPLICATE_INSERT_SOURCE_LEGACY_ID}`);
  }
  if (input.source.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    failures.push(`site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}`);
  }
  if (!input.duplicateDryRunOk) {
    failures.push("duplicate dry-run preview must be ok");
  }
  return failures;
}

export function assertG22dDuplicateInsertSourceRow(source: ScheduleDryRunSource): void {
  const failures = collectG22dDuplicateInsertGuardFailures({
    duplicateMode: true,
    source,
    duplicateDryRunOk: true,
  });
  if (failures.length > 0) {
    throw new Error(failures.join("; "));
  }
}
