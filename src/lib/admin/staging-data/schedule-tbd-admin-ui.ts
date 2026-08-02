/**
 * CMS Core v2 — Schedule TBD Admin UI capability + date-state wiring helpers.
 * Phase: cms-core-v2-schedule-tbd-admin-ui-connect
 *
 * UI-only. Does not call TBD Save payload helper / Edge / DB write.
 */

import {
  SCHEDULE_ADMIN_DATE_OPERATION_CREATE,
  SCHEDULE_ADMIN_DATE_OPERATION_UPDATE,
  SCHEDULE_TBD_MONTH_MODE_KNOWN,
  SCHEDULE_TBD_MONTH_MODE_UNKNOWN,
  isExactTrue,
  resolveScheduleAdminDateState,
} from "../../../../tools/static-to-astro/scripts/lib/schedule-admin-date-state.mjs";
import {
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN,
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
  SCHEDULE_DATE_STATUS_CONFIRMED,
  SCHEDULE_DATE_STATUS_TBD,
} from "../../../../tools/static-to-astro/scripts/lib/schedule-date-contract.mjs";
import {
  SARISWING_PRODUCTION_PROJECT_REF,
  STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF,
} from "./staging-schedule-site-slug-host-gate";

export const SCHEDULE_TBD_ADMIN_UI_CONFIG_ELEMENT_ID = "gosaki-schedule-tbd-admin-ui-config";

export {
  SCHEDULE_ADMIN_DATE_OPERATION_CREATE,
  SCHEDULE_ADMIN_DATE_OPERATION_UPDATE,
  SCHEDULE_DATE_STATUS_CONFIRMED,
  SCHEDULE_DATE_STATUS_TBD,
  SCHEDULE_TBD_MONTH_MODE_KNOWN,
  SCHEDULE_TBD_MONTH_MODE_UNKNOWN,
  isExactTrue,
  resolveScheduleAdminDateState,
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN,
  SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
};

export type ScheduleTbdAdminUiCapabilityInput = {
  schemaSupportsTbd?: unknown;
  tbdAdminUiEnabled?: unknown;
  supabaseUrl?: string | null;
};

export type ScheduleTbdAdminUiCapability = {
  schemaSupportsTbd: boolean;
  tbdAdminUiEnabled: boolean;
  tbdAdminUiVisible: boolean;
  productionBlocked: boolean;
};

/**
 * Exact boolean true only for both flags. Production URL never shows TBD UI.
 */
export function resolveScheduleTbdAdminUiCapability(
  input: ScheduleTbdAdminUiCapabilityInput = {},
): ScheduleTbdAdminUiCapability {
  const supabaseUrl = String(input.supabaseUrl ?? "");
  const productionBlocked = supabaseUrl.includes(SARISWING_PRODUCTION_PROJECT_REF);
  if (productionBlocked) {
    return {
      schemaSupportsTbd: false,
      tbdAdminUiEnabled: false,
      tbdAdminUiVisible: false,
      productionBlocked: true,
    };
  }
  const schemaSupportsTbd = isExactTrue(input.schemaSupportsTbd);
  const tbdAdminUiEnabled = isExactTrue(input.tbdAdminUiEnabled);
  return {
    schemaSupportsTbd,
    tbdAdminUiEnabled,
    tbdAdminUiVisible: schemaSupportsTbd && tbdAdminUiEnabled,
    productionBlocked: false,
  };
}

/**
 * SSR/build helper: staging Kit ref → exact-true booleans; else both false.
 */
export function resolveScheduleTbdAdminUiServerConfig(env: {
  PUBLIC_SUPABASE_URL?: string;
}): {
  schemaSupportsTbd: boolean;
  tbdAdminUiEnabled: boolean;
  tbdAdminUiVisible: boolean;
  productionBlocked: boolean;
  supabaseUrl: string;
} {
  const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const productionBlocked = supabaseUrl.includes(SARISWING_PRODUCTION_PROJECT_REF);
  const stagingKit = supabaseUrl.includes(STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF);
  const schemaSupportsTbd = !productionBlocked && stagingKit;
  const tbdAdminUiEnabled = !productionBlocked && stagingKit;
  return {
    schemaSupportsTbd,
    tbdAdminUiEnabled,
    tbdAdminUiVisible: schemaSupportsTbd && tbdAdminUiEnabled,
    productionBlocked,
    supabaseUrl,
  };
}

export function readScheduleTbdAdminUiConfigFromDom(
  root: ParentNode | Document = document,
): ScheduleTbdAdminUiCapability {
  const jsonEl = root.getElementById
    ? (root as Document).getElementById(SCHEDULE_TBD_ADMIN_UI_CONFIG_ELEMENT_ID)
    : root.querySelector(`#${SCHEDULE_TBD_ADMIN_UI_CONFIG_ELEMENT_ID}`);
  if (jsonEl?.textContent) {
    try {
      const parsed = JSON.parse(jsonEl.textContent) as Record<string, unknown>;
      return resolveScheduleTbdAdminUiCapability({
        schemaSupportsTbd: parsed.schemaSupportsTbd,
        tbdAdminUiEnabled: parsed.tbdAdminUiEnabled,
        supabaseUrl: String(parsed.supabaseUrl ?? ""),
      });
    } catch {
      /* fall through */
    }
  }
  return resolveScheduleTbdAdminUiCapability({});
}

export function formatScheduleAdminListDateLabel(row: {
  date?: string | null;
  date_status?: string | null;
  month?: string | null;
}): string {
  const status = row.date_status ?? null;
  const date = row.date == null || row.date === "" ? null : String(row.date);
  if (status === SCHEDULE_DATE_STATUS_TBD) {
    return row.month
      ? SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN
      : SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN;
  }
  if (date) return date;
  return "—";
}

export type ScheduleAdminDateFormPrefix = "add" | "edit";

export function readScheduleAdminDateFormInput(
  prefix: ScheduleAdminDateFormPrefix,
  capability: ScheduleTbdAdminUiCapability,
  options: {
    operation: "create" | "update";
    existingDate?: string | null;
    existingMonth?: string | null;
  },
): Record<string, unknown> {
  const statusEl = document.querySelector(
    `input[name="gosaki-${prefix}-date-status"]:checked`,
  ) as HTMLInputElement | null;
  const dateStatus = capability.tbdAdminUiVisible
    ? statusEl?.value || SCHEDULE_DATE_STATUS_CONFIRMED
    : SCHEDULE_DATE_STATUS_CONFIRMED;

  const dateEl = document.getElementById(`gosaki-${prefix}-date`) as HTMLInputElement | null;
  const monthEl = document.getElementById(
    `gosaki-${prefix}-tbd-month`,
  ) as HTMLInputElement | null;
  const modeEl = document.querySelector(
    `input[name="gosaki-${prefix}-tbd-month-mode"]:checked`,
  ) as HTMLInputElement | null;

  return {
    dateStatus,
    date: dateEl?.value ?? "",
    month: monthEl?.value ?? "",
    tbdMonthMode: modeEl?.value ?? null,
    schemaSupportsTbd: capability.schemaSupportsTbd,
    tbdAdminUiEnabled: capability.tbdAdminUiEnabled,
    tbdWriteEnabled: false,
    operation: options.operation,
    existingDate: options.existingDate ?? null,
    existingMonth: options.existingMonth ?? null,
  };
}

/**
 * Apply resolved admin date-state to DOM controls (enabled/required/hidden).
 */
export function applyScheduleAdminDateStateToDom(
  prefix: ScheduleAdminDateFormPrefix,
  capability: ScheduleTbdAdminUiCapability,
  stateResult: ReturnType<typeof resolveScheduleAdminDateState>,
): void {
  const panel = document.getElementById(`gosaki-${prefix}-date-status-panel`);
  const monthField = document.getElementById(`gosaki-${prefix}-tbd-month-field`);
  const modeField = document.getElementById(`gosaki-${prefix}-tbd-month-mode-field`);
  const dateInput = document.getElementById(`gosaki-${prefix}-date`) as HTMLInputElement | null;
  const monthInput = document.getElementById(
    `gosaki-${prefix}-tbd-month`,
  ) as HTMLInputElement | null;
  const displayEl = document.getElementById(`gosaki-${prefix}-date-display`);
  const blockedEl = document.getElementById(`gosaki-${prefix}-tbd-save-blocked`);
  const invalidEl = document.getElementById(`gosaki-${prefix}-date-state-invalid`);

  if (panel instanceof HTMLElement) {
    panel.hidden = !capability.tbdAdminUiVisible;
  }

  if (!stateResult.ok) {
    if (invalidEl instanceof HTMLElement) {
      invalidEl.hidden = false;
      invalidEl.textContent = stateResult.errors.join(" / ") || "日付の状態が不正です。編集できません。";
    }
    if (dateInput) {
      dateInput.disabled = true;
      dateInput.required = false;
    }
    if (monthField instanceof HTMLElement) monthField.hidden = true;
    if (modeField instanceof HTMLElement) modeField.hidden = true;
    if (blockedEl instanceof HTMLElement) blockedEl.hidden = true;
    return;
  }

  if (invalidEl instanceof HTMLElement) {
    invalidEl.hidden = true;
    invalidEl.textContent = "";
  }

  const value = stateResult.value;
  if (dateInput) {
    dateInput.disabled = !value.dateInputEnabled;
    dateInput.required = value.dateInputRequired;
    if (value.dateStatus === SCHEDULE_DATE_STATUS_TBD) {
      dateInput.value = "";
    } else if (value.date && dateInput.value !== value.date) {
      // keep user/create value when confirmed; for update existingDate may lock
      if (!dateInput.value && value.date) dateInput.value = value.date;
    }
  }

  const showTbdExtras =
    capability.tbdAdminUiVisible && value.dateStatus === SCHEDULE_DATE_STATUS_TBD;
  if (modeField instanceof HTMLElement) {
    modeField.hidden = !showTbdExtras;
  }
  if (monthField instanceof HTMLElement) {
    monthField.hidden = !(showTbdExtras && value.tbdMonthMode === SCHEDULE_TBD_MONTH_MODE_KNOWN);
  }
  if (monthInput) {
    monthInput.disabled = !value.monthInputEnabled;
    monthInput.required = value.monthInputRequired;
    if (value.monthInputEnabled && value.month) {
      monthInput.value = value.month;
    }
    if (value.tbdMonthMode === SCHEDULE_TBD_MONTH_MODE_UNKNOWN) {
      monthInput.value = "";
    }
  }

  if (displayEl instanceof HTMLElement) {
    displayEl.textContent = value.display || "";
    displayEl.hidden = !value.display;
  }

  const blockSave = value.dateStatus === SCHEDULE_DATE_STATUS_TBD;
  if (blockedEl instanceof HTMLElement) {
    blockedEl.hidden = !blockSave;
    if (blockSave) {
      blockedEl.textContent =
        "TBD保存はまだ有効化されていません。日付確定（confirmed）のみ保存できます。";
    }
  }
}

export function isScheduleTbdSaveBlockedFromDom(
  prefix: ScheduleAdminDateFormPrefix,
  capability: ScheduleTbdAdminUiCapability,
): boolean {
  if (!capability.tbdAdminUiVisible) return false;
  const statusEl = document.querySelector(
    `input[name="gosaki-${prefix}-date-status"]:checked`,
  ) as HTMLInputElement | null;
  return statusEl?.value === SCHEDULE_DATE_STATUS_TBD;
}
