/**
 * CMS Core v2 — Schedule TBD CREATE oneshot guards (Path B; fixed row).
 * Phase: cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-boundary-hardening
 */

import { STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG } from "../staging-data/staging-schedule-site-slug-config";
import {
  buildScheduleTbdSavePayload,
  SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
} from "../../../../tools/static-to-astro/scripts/lib/schedule-tbd-save-payload.mjs";
import { SCHEDULE_TBD_MONTH_MODE_KNOWN } from "../../../../tools/static-to-astro/scripts/lib/schedule-admin-date-state.mjs";
import { SCHEDULE_DATE_STATUS_TBD } from "../../../../tools/static-to-astro/scripts/lib/schedule-date-contract.mjs";
import {
  CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID,
  type ScheduleTbdCreateOneshotInsertPayload,
} from "./schedule-write-types";

export const TBD_CREATE_ONESHOT_PHASE =
  "cms-core-v2-schedule-tbd-date-save-non-dry-run-staging-boundary-hardening";

export const TBD_CREATE_ONESHOT_LEGACY_ID = "schedule-2026-11-001";
export const TBD_CREATE_ONESHOT_MONTH = "2026-11";
export const TBD_CREATE_ONESHOT_YEAR = 2026;
export const TBD_CREATE_ONESHOT_SOURCE_ROUTE = "/schedule/2026-11/";
export const TBD_CREATE_ONESHOT_SOURCE_FILE = "schedule-2026-11.html";
export const TBD_CREATE_ONESHOT_TITLE = "【CMS Kit staging】TBD create oneshot PoC";
export const TBD_CREATE_ONESHOT_VENUE = "[CMS Kit staging] TBD create PoC venue";
export const TBD_CREATE_ONESHOT_DESCRIPTION =
  "[CMS Kit staging] TBD create oneshot — unpublished";
export const TBD_CREATE_ONESHOT_SORT_ORDER = 0;

/** Insert allowlist — fixed; unknown keys rejected. */
export const TBD_CREATE_ONESHOT_INSERT_PAYLOAD_KEYS = [
  "legacy_id",
  "site_slug",
  "date_status",
  "date",
  "month",
  "year",
  "source_route",
  "source_file",
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
] as const;

export type TbdCreateOneshotInsertPayloadKey =
  (typeof TBD_CREATE_ONESHOT_INSERT_PAYLOAD_KEYS)[number];

/** Preflight A baselines (planning). Exact drift → STOP. */
export const TBD_CREATE_ONESHOT_PREFLIGHT_BASELINE = {
  totalSchedules: 79,
  mioRows: 0,
  tbdRows: 0,
  targetLegacyIdRows: 0,
} as const;

export function fingerprintTbdCreateOneshotPayload(
  payload: Record<string, unknown>,
): string {
  const ordered: Record<string, unknown> = {};
  for (const key of [...TBD_CREATE_ONESHOT_INSERT_PAYLOAD_KEYS].sort()) {
    ordered[key] = Object.prototype.hasOwnProperty.call(payload, key)
      ? payload[key]
      : null;
  }
  return JSON.stringify(ordered);
}

export function buildTbdCreateOneshotFixedInsertPayload(): ScheduleTbdCreateOneshotInsertPayload {
  const built = buildScheduleTbdSavePayload({
    mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
    operation: "create",
    dateStatus: SCHEDULE_DATE_STATUS_TBD,
    date: null,
    month: TBD_CREATE_ONESHOT_MONTH,
    tbdMonthMode: SCHEDULE_TBD_MONTH_MODE_KNOWN,
    schemaSupportsTbd: true,
    tbdWriteEnabled: true,
    title: TBD_CREATE_ONESHOT_TITLE,
    venue: TBD_CREATE_ONESHOT_VENUE,
    open_time: null,
    start_time: null,
    price: null,
    description: TBD_CREATE_ONESHOT_DESCRIPTION,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: TBD_CREATE_ONESHOT_SORT_ORDER,
  });
  if (!built.ok) {
    throw new Error(
      `TBD create oneshot payload build failed: ${built.errors.join("; ")}`,
    );
  }
  const base = built.value.payload as Record<string, unknown>;
  const payload: ScheduleTbdCreateOneshotInsertPayload = {
    legacy_id: TBD_CREATE_ONESHOT_LEGACY_ID,
    site_slug: STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG,
    date_status: "tbd",
    date: null,
    month: TBD_CREATE_ONESHOT_MONTH,
    year: TBD_CREATE_ONESHOT_YEAR,
    source_route: TBD_CREATE_ONESHOT_SOURCE_ROUTE,
    source_file: TBD_CREATE_ONESHOT_SOURCE_FILE,
    title: TBD_CREATE_ONESHOT_TITLE,
    venue: TBD_CREATE_ONESHOT_VENUE,
    open_time: (base.open_time as string | null) ?? null,
    start_time: (base.start_time as string | null) ?? null,
    price: (base.price as string | null) ?? null,
    description: TBD_CREATE_ONESHOT_DESCRIPTION,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: TBD_CREATE_ONESHOT_SORT_ORDER,
  };
  assertTbdCreateOneshotPayloadOnly(payload);
  return payload;
}

export function assertTbdCreateOneshotPayloadOnly(
  payload: ScheduleTbdCreateOneshotInsertPayload,
): void {
  const keys = Object.keys(payload).sort();
  const allowed = [...TBD_CREATE_ONESHOT_INSERT_PAYLOAD_KEYS].sort();
  if (keys.length !== allowed.length || !keys.every((key, i) => key === allowed[i])) {
    throw new Error(
      `TBD create oneshot payload keys mismatch (expected ${allowed.join(", ")}, got ${keys.join(", ")}).`,
    );
  }
  if ("id" in (payload as Record<string, unknown>)) {
    throw new Error("TBD create oneshot must not specify id.");
  }
  if ("expectedBeforeUpdatedAt" in (payload as Record<string, unknown>)) {
    throw new Error("TBD create oneshot must not include optimistic-lock updated_at.");
  }
  if (payload.site_slug !== STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG) {
    throw new Error(`site_slug must be ${STAGING_SHELL_GOSAKI_SCHEDULE_SITE_SLUG}.`);
  }
  if (payload.legacy_id !== TBD_CREATE_ONESHOT_LEGACY_ID) {
    throw new Error(`legacy_id must be ${TBD_CREATE_ONESHOT_LEGACY_ID}.`);
  }
  if (payload.date_status !== "tbd") {
    throw new Error("date_status must be tbd.");
  }
  if (payload.date !== null) {
    throw new Error("date must be null for TBD create oneshot.");
  }
  if (payload.month !== TBD_CREATE_ONESHOT_MONTH) {
    throw new Error(`month must be ${TBD_CREATE_ONESHOT_MONTH}.`);
  }
  if (payload.year !== TBD_CREATE_ONESHOT_YEAR) {
    throw new Error(`year must be ${TBD_CREATE_ONESHOT_YEAR}.`);
  }
  if (payload.source_route !== TBD_CREATE_ONESHOT_SOURCE_ROUTE) {
    throw new Error("source_route mismatch.");
  }
  if (payload.source_file !== TBD_CREATE_ONESHOT_SOURCE_FILE) {
    throw new Error("source_file mismatch.");
  }
  if (payload.title !== TBD_CREATE_ONESHOT_TITLE) {
    throw new Error("title must match fixed oneshot marker.");
  }
  if (payload.venue !== TBD_CREATE_ONESHOT_VENUE) {
    throw new Error("venue must match fixed oneshot marker.");
  }
  if (payload.description !== TBD_CREATE_ONESHOT_DESCRIPTION) {
    throw new Error("description must match fixed oneshot marker.");
  }
  if (payload.published !== false) {
    throw new Error("published must be false.");
  }
  if (payload.show_on_home !== false) {
    throw new Error("show_on_home must be false.");
  }
  if (payload.home_order !== null) {
    throw new Error("home_order must be null.");
  }
  if (payload.sort_order !== TBD_CREATE_ONESHOT_SORT_ORDER) {
    throw new Error("sort_order must be 0.");
  }
}

export function assertTbdCreateOneshotApprovalId(approvalId: string): void {
  if (approvalId !== CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID) {
    throw new Error(
      `Approval ID must be ${CMS_CORE_V2_SCHEDULE_TBD_CREATE_NON_DRY_RUN_ONESHOT_APPROVAL_ID}.`,
    );
  }
}

export function assertReturnedTbdCreateOneshotRow(input: {
  payload: ScheduleTbdCreateOneshotInsertPayload;
  insertedId: string;
  afterSnapshot: Record<string, unknown>;
}): void {
  const row = input.afterSnapshot;
  const id = String(row.id ?? "").trim();
  if (!id || id !== input.insertedId) {
    throw new Error("Returned row id mismatch or missing.");
  }
  if (row.legacy_id !== input.payload.legacy_id) {
    throw new Error("Returned legacy_id mismatch.");
  }
  if (row.site_slug !== input.payload.site_slug) {
    throw new Error("Returned site_slug mismatch.");
  }
  if (row.date_status !== "tbd") {
    throw new Error("Returned date_status mismatch.");
  }
  if (row.date != null) {
    throw new Error("Returned date must be null.");
  }
  if (row.month !== input.payload.month) {
    throw new Error("Returned month mismatch.");
  }
  if (row.title !== input.payload.title) {
    throw new Error("Returned title mismatch.");
  }
  if (row.published !== false) {
    throw new Error("Returned published must be false.");
  }
  if (row.source_route !== input.payload.source_route) {
    throw new Error("Returned source_route mismatch.");
  }
}

export function evaluateTbdCreateOneshotPreflightCounts(input: {
  totalSchedules: number;
  mioRows: number;
  tbdRows: number;
  targetLegacyIdRows: number;
}): { ok: boolean; failures: string[] } {
  const failures: string[] = [];
  const b = TBD_CREATE_ONESHOT_PREFLIGHT_BASELINE;
  if (input.totalSchedules !== b.totalSchedules) {
    failures.push(
      `total schedules drift (expected ${b.totalSchedules}, got ${input.totalSchedules})`,
    );
  }
  if (input.mioRows !== b.mioRows) {
    failures.push(`mio rows must be ${b.mioRows}`);
  }
  if (input.tbdRows !== b.tbdRows) {
    failures.push(`tbd rows must be ${b.tbdRows}`);
  }
  if (input.targetLegacyIdRows !== b.targetLegacyIdRows) {
    failures.push(
      `target legacy_id ${TBD_CREATE_ONESHOT_LEGACY_ID} must have 0 rows (got ${input.targetLegacyIdRows})`,
    );
  }
  return { ok: failures.length === 0, failures };
}
