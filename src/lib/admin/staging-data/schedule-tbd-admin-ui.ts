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
import { resolveTbdCreateOneshotPageServerConfig } from "../staging-write/gosaki-schedule-tbd-create-oneshot-config";

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
  tbdDryRunEnabled?: unknown;
  tbdWriteEnabled?: unknown;
  supabaseUrl?: string | null;
};

export type ScheduleTbdAdminUiCapability = {
  schemaSupportsTbd: boolean;
  tbdAdminUiEnabled: boolean;
  tbdAdminUiVisible: boolean;
  /** Exact-true dry-run flag (Save write remains gated separately). */
  tbdDryRunEnabled: boolean;
  /** Exact-true write flag (SSR dual-arm only; default false). */
  tbdWriteEnabled: boolean;
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
      tbdDryRunEnabled: false,
      tbdWriteEnabled: false,
      productionBlocked: true,
    };
  }
  const schemaSupportsTbd = isExactTrue(input.schemaSupportsTbd);
  const tbdAdminUiEnabled = isExactTrue(input.tbdAdminUiEnabled);
  const tbdDryRunEnabled = isExactTrue(input.tbdDryRunEnabled);
  const tbdWriteEnabled = isExactTrue(input.tbdWriteEnabled);
  return {
    schemaSupportsTbd,
    tbdAdminUiEnabled,
    tbdAdminUiVisible: schemaSupportsTbd && tbdAdminUiEnabled,
    tbdDryRunEnabled,
    tbdWriteEnabled,
    productionBlocked: false,
  };
}

/**
 * SSR/build helper: staging Kit ref → admin/dry-run booleans.
 * tbdWriteEnabled true only when dual TBD create arms + dry-run false (SSR).
 */
export function resolveScheduleTbdAdminUiServerConfig(env: {
  PUBLIC_SUPABASE_URL?: string;
  [key: string]: unknown;
}): {
  schemaSupportsTbd: boolean;
  tbdAdminUiEnabled: boolean;
  tbdAdminUiVisible: boolean;
  tbdDryRunEnabled: boolean;
  tbdWriteEnabled: boolean;
  productionBlocked: boolean;
  supabaseUrl: string;
} {
  const supabaseUrl = String(env.PUBLIC_SUPABASE_URL ?? "").trim();
  const productionBlocked = supabaseUrl.includes(SARISWING_PRODUCTION_PROJECT_REF);
  const stagingKit = supabaseUrl.includes(STATIC_TO_ASTRO_CMS_STAGING_PROJECT_REF);
  const schemaSupportsTbd = !productionBlocked && stagingKit;
  const tbdAdminUiEnabled = !productionBlocked && stagingKit;
  const tbdDryRunEnabled = !productionBlocked && stagingKit;
  const oneshot = resolveTbdCreateOneshotPageServerConfig(env as ImportMetaEnv);
  const tbdWriteEnabled =
    !productionBlocked && stagingKit && oneshot.tbdWriteEnabled === true;
  return {
    schemaSupportsTbd,
    tbdAdminUiEnabled,
    tbdAdminUiVisible: schemaSupportsTbd && tbdAdminUiEnabled,
    tbdDryRunEnabled,
    tbdWriteEnabled,
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
        tbdDryRunEnabled: parsed.tbdDryRunEnabled,
        tbdWriteEnabled: parsed.tbdWriteEnabled,
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
    const dryRunWrapInvalid = document.getElementById(`gosaki-${prefix}-tbd-dry-run-wrap`);
    if (dryRunWrapInvalid instanceof HTMLElement) dryRunWrapInvalid.hidden = true;
    return;
  }

  if (invalidEl instanceof HTMLElement) {
    invalidEl.hidden = true;
    invalidEl.textContent = "";
  }

  const value = stateResult.value;
  const dateField = document.getElementById(`gosaki-${prefix}-date-field`);
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
  if (dateField instanceof HTMLElement) {
    dateField.hidden = value.dateStatus === SCHEDULE_DATE_STATUS_TBD;
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

  const dryRunWrap = document.getElementById(`gosaki-${prefix}-tbd-dry-run-wrap`);
  const dryRunBtn = document.getElementById(
    `gosaki-${prefix}-tbd-dry-run-btn`,
  ) as HTMLButtonElement | null;
  const dryRunReasonEl = document.getElementById(`gosaki-${prefix}-tbd-dry-run-reason`);
  const dryRunVisible =
    capability.tbdAdminUiVisible &&
    isExactTrue(capability.tbdDryRunEnabled) &&
    value.dateStatus === SCHEDULE_DATE_STATUS_TBD;
  if (dryRunWrap instanceof HTMLElement) {
    dryRunWrap.hidden = !dryRunVisible;
  }
  if (dryRunBtn) {
    const monthOk =
      value.tbdMonthMode !== SCHEDULE_TBD_MONTH_MODE_KNOWN || Boolean(value.month);
    const complete = dryRunVisible && monthOk && value.tbdMonthMode != null;
    const disableReason = describeTbdDryRunDisableReason({
      dryRunVisible,
      tbdDryRunEnabled: isExactTrue(capability.tbdDryRunEnabled),
      dateStatus: value.dateStatus,
      tbdMonthMode: value.tbdMonthMode,
      month: value.month,
    });
    dryRunBtn.disabled = !complete;
    dryRunBtn.title = complete
      ? "ローカル dry-run（保存しません）"
      : disableReason ?? "TBD入力が完了すると Dry-run 確認できます";
    if (dryRunReasonEl instanceof HTMLElement) {
      if (!complete && disableReason) {
        dryRunReasonEl.hidden = false;
        dryRunReasonEl.textContent = disableReason;
      } else {
        dryRunReasonEl.hidden = true;
        dryRunReasonEl.textContent = "";
      }
    }
  }
}

/** Japanese reason when TBD Dry-run button is disabled (UI display only). */
export function describeTbdDryRunDisableReason(input: {
  dryRunVisible: boolean;
  tbdDryRunEnabled: boolean;
  dateStatus: string;
  tbdMonthMode: string | null;
  month: string | null;
}): string | null {
  if (!input.tbdDryRunEnabled) {
    return "TBD Dry-run は現在無効です。";
  }
  if (input.dateStatus !== SCHEDULE_DATE_STATUS_TBD) {
    return "日付未定（TBD）を選択してください。";
  }
  if (!input.dryRunVisible) {
    return "TBD Dry-run を表示できません。";
  }
  if (input.tbdMonthMode == null) {
    return "未定の種類を選択してください。";
  }
  if (
    input.tbdMonthMode === SCHEDULE_TBD_MONTH_MODE_KNOWN &&
    !String(input.month ?? "").trim()
  ) {
    return "表示月を選択してください。";
  }
  return null;
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
