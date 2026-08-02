/**
 * CMS Core v2 — Schedule TBD Save payload dry-run (local preview only).
 * Phase: cms-core-v2-schedule-tbd-date-save-dry-run
 *
 * Uses buildScheduleTbdSavePayload as SoT. No fetch / Edge / DB write.
 */

import {
  buildScheduleTbdSavePayload,
  SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
} from "../../../../tools/static-to-astro/scripts/lib/schedule-tbd-save-payload.mjs";
import {
  SCHEDULE_ADMIN_DATE_OPERATION_UPDATE,
  SCHEDULE_DATE_STATUS_TBD,
  SCHEDULE_TBD_MONTH_MODE_KNOWN,
  readScheduleAdminDateFormInput,
  resolveScheduleAdminDateState,
  resolveScheduleTbdAdminUiCapability,
  type ScheduleAdminDateFormPrefix,
  type ScheduleTbdAdminUiCapability,
} from "./schedule-tbd-admin-ui";
import {
  SARISWING_PRODUCTION_PROJECT_REF,
  STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF,
} from "./staging-schedule-site-slug-host-gate";

export {
  SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
  SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
  buildScheduleTbdSavePayload,
};

export const SCHEDULE_TBD_SAVE_DRY_RUN_NOTICE =
  "これは保存されません。ローカル dry-run プレビューのみです（DB / Edge へ送信しません）。";

export type ScheduleTbdDryRunCapability = ScheduleTbdAdminUiCapability & {
  tbdDryRunEnabled: boolean;
  /** schemaSupportsTbd && tbdAdminUiEnabled && tbdDryRunEnabled (exact true each). */
  tbdDryRunVisible: boolean;
  /** Always false in this phase. */
  tbdWriteEnabled: false;
};

export function resolveScheduleTbdDryRunCapability(
  input: {
    schemaSupportsTbd?: unknown;
    tbdAdminUiEnabled?: unknown;
    tbdDryRunEnabled?: unknown;
    supabaseUrl?: string | null;
  } = {},
): ScheduleTbdDryRunCapability {
  const base = resolveScheduleTbdAdminUiCapability(input);
  if (base.productionBlocked) {
    return {
      ...base,
      tbdDryRunEnabled: false,
      tbdDryRunVisible: false,
      tbdWriteEnabled: false,
    };
  }
  return {
    ...base,
    tbdDryRunVisible:
      base.schemaSupportsTbd && base.tbdAdminUiEnabled && base.tbdDryRunEnabled,
    tbdWriteEnabled: false,
  };
}

export function resolveScheduleTbdDryRunServerConfig(env: {
  PUBLIC_SUPABASE_URL?: string;
}): ScheduleTbdDryRunCapability & { supabaseUrl: string } {
  const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const productionBlocked = supabaseUrl.includes(SARISWING_PRODUCTION_PROJECT_REF);
  const stagingKit = supabaseUrl.includes(STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF);
  const armed = !productionBlocked && stagingKit;
  return {
    ...resolveScheduleTbdDryRunCapability({
      schemaSupportsTbd: armed,
      tbdAdminUiEnabled: armed,
      tbdDryRunEnabled: armed,
      supabaseUrl,
    }),
    supabaseUrl,
  };
}

export function isScheduleTbdDryRunDraftComplete(
  stateResult: ReturnType<typeof resolveScheduleAdminDateState>,
): boolean {
  if (!stateResult.ok) return false;
  const value = stateResult.value;
  if (value.dateStatus !== SCHEDULE_DATE_STATUS_TBD) return false;
  if (value.tbdMonthMode === SCHEDULE_TBD_MONTH_MODE_KNOWN) {
    return Boolean(value.month);
  }
  return value.tbdMonthMode != null;
}

export type ScheduleTbdDryRunFormContent = {
  title?: string | null;
  venue?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  description?: string | null;
  published?: boolean;
  show_on_home?: boolean;
  home_order?: number | null;
  sort_order?: number;
  expectedBeforeUpdatedAt?: string | null;
  id?: string | null;
};

/**
 * Local-only TBD Save payload dry-run. Never fetches / writes.
 */
export function runScheduleTbdSavePayloadDryRun(options: {
  capability: ScheduleTbdDryRunCapability;
  prefix: ScheduleAdminDateFormPrefix;
  operation: "create" | "update";
  content?: ScheduleTbdDryRunFormContent;
  existingDate?: string | null;
  existingMonth?: string | null;
}): {
  ok: boolean;
  errors: string[];
  codes: string[];
  payload: Record<string, unknown> | null;
  monthFields: Record<string, unknown> | null;
  mode: string | null;
  operation: string | null;
  notice: string;
} {
  const notice = SCHEDULE_TBD_SAVE_DRY_RUN_NOTICE;
  if (!options.capability.tbdDryRunVisible) {
    return {
      ok: false,
      errors: ["TBD dry-run is not enabled for this host"],
      codes: ["dry_run_capability_off"],
      payload: null,
      monthFields: null,
      mode: null,
      operation: null,
      notice,
    };
  }

  const dateInput = readScheduleAdminDateFormInput(options.prefix, options.capability, {
    operation: options.operation,
    existingDate: options.existingDate ?? null,
    existingMonth: options.existingMonth ?? null,
  });
  const state = resolveScheduleAdminDateState(dateInput);
  if (!isScheduleTbdDryRunDraftComplete(state)) {
    return {
      ok: false,
      errors: state.ok
        ? ["TBD dry-run requires a complete TBD draft (month-known needs month)"]
        : state.errors,
      codes: state.ok ? ["dry_run_incomplete_draft"] : state.codes,
      payload: null,
      monthFields: null,
      mode: null,
      operation: null,
      notice,
    };
  }

  const content = options.content ?? {};
  const buildInput: Record<string, unknown> = {
    mode: SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1,
    operation: options.operation,
    dateStatus: dateInput.dateStatus,
    date: dateInput.date,
    month: dateInput.month,
    tbdMonthMode: dateInput.tbdMonthMode,
    schemaSupportsTbd: true,
    tbdWriteEnabled: false,
    tbdDryRunEnabled: true,
    existingDate: options.existingDate ?? null,
    existingMonth: options.existingMonth ?? null,
    title: content.title ?? null,
    venue: content.venue ?? null,
    open_time: content.open_time ?? null,
    start_time: content.start_time ?? null,
    price: content.price ?? null,
    description: content.description ?? null,
    published: content.published === true,
    show_on_home: content.show_on_home === true,
    home_order: content.home_order ?? null,
    sort_order: typeof content.sort_order === "number" ? content.sort_order : 0,
  };

  if (options.operation === SCHEDULE_ADMIN_DATE_OPERATION_UPDATE) {
    const lock = content.expectedBeforeUpdatedAt;
    if (lock == null || lock === "") {
      return {
        ok: false,
        errors: ["expectedBeforeUpdatedAt is required for update dry-run"],
        codes: ["lock_required"],
        payload: null,
        monthFields: null,
        mode: null,
        operation: null,
        notice,
      };
    }
    buildInput.expectedBeforeUpdatedAt = lock;
    if (content.id) buildInput.id = content.id;
  }

  const result = buildScheduleTbdSavePayload(buildInput);
  if (!result.ok) {
    return {
      ok: false,
      errors: result.errors,
      codes: result.codes,
      payload: null,
      monthFields: null,
      mode: null,
      operation: null,
      notice,
    };
  }

  return {
    ok: true,
    errors: [],
    codes: [],
    payload: result.value.payload as Record<string, unknown>,
    monthFields: (result.value.monthFields ?? null) as Record<string, unknown> | null,
    mode: String(result.value.mode),
    operation: String(result.value.operation),
    notice,
  };
}

/** Confirmed legacy dry-run helper for offline verifier (not TBD button). */
export function runScheduleConfirmedLegacyPayloadDryRun(input: Record<string, unknown>) {
  return buildScheduleTbdSavePayload({
    mode: SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED,
    ...input,
  });
}
