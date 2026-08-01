/**
 * CMS Core v2 — Schedule Admin date-state view-model / validator (site-neutral, pure).
 * Phase: cms-core-v2-schedule-tbd-admin-state-save-payload-helpers
 *
 * Uses schedule-date-contract for confirmed/tbd rules. No Admin UI / Save / Edge wiring.
 */

import {
  SCHEDULE_DATE_STATUS_CONFIRMED,
  SCHEDULE_DATE_STATUS_TBD,
  normalizeScheduleDateContract,
} from "./schedule-date-contract.mjs";

export const SCHEDULE_ADMIN_DATE_OPERATION_CREATE = "create";
export const SCHEDULE_ADMIN_DATE_OPERATION_UPDATE = "update";

export const SCHEDULE_TBD_MONTH_MODE_KNOWN = "month-known";
export const SCHEDULE_TBD_MONTH_MODE_UNKNOWN = "month-unknown";

const ALLOWED_INPUT_KEYS = new Set([
  "dateStatus",
  "date_status",
  "date",
  "month",
  "tbdMonthMode",
  "tbd_month_mode",
  "schemaSupportsTbd",
  "tbdWriteEnabled",
  "operation",
  "existingDate",
  "existing_date",
  "existingMonth",
  "existing_month",
  "sortOrder",
  "sort_order",
  "legacyId",
  "legacy_id",
  "sourceRoute",
  "source_route",
]);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isExactTrue(value) {
  return value === true;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * @param {string[]} errors
 * @param {string[]} codes
 * @param {string} error
 * @param {string} code
 */
function pushError(errors, codes, error, code) {
  errors.push(error);
  codes.push(code);
}

/**
 * Resolve Admin date-state view-model (fail-closed result).
 * Does not mutate input. Does not throw for validation.
 *
 * @param {unknown} input
 * @returns {{
 *   ok: true,
 *   value: {
 *     dateStatus: "confirmed" | "tbd",
 *     date: string | null,
 *     month: string | null,
 *     year: number | null,
 *     display: string,
 *     monthMembership: { kind: "month-page", month: string } | { kind: "hub-only" },
 *     tbdMonthMode: "month-known" | "month-unknown" | null,
 *     dateInputEnabled: boolean,
 *     dateInputRequired: boolean,
 *     monthInputEnabled: boolean,
 *     monthInputRequired: boolean,
 *     writeAllowed: boolean,
 *     blockedReason: string | null,
 *     operation: "create" | "update",
 *     schemaSupportsTbd: boolean,
 *     tbdWriteEnabled: boolean,
 *     contract: import("./schedule-date-contract.mjs").ScheduleDateContract,
 *   },
 *   errors: string[],
 *   codes: string[],
 * } | {
 *   ok: false,
 *   errors: string[],
 *   codes: string[],
 * }}
 */
export function resolveScheduleAdminDateState(input) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const codes = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: ["input must be a plain object"], codes: ["input_type"] };
  }
  const obj = /** @type {Record<string, unknown>} */ (input);
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_INPUT_KEYS.has(key)) {
      pushError(errors, codes, `unknown field: ${key}`, "unknown_field");
    }
  }
  if (errors.length) return { ok: false, errors, codes };

  const operationRaw = obj.operation;
  if (
    operationRaw !== SCHEDULE_ADMIN_DATE_OPERATION_CREATE &&
    operationRaw !== SCHEDULE_ADMIN_DATE_OPERATION_UPDATE
  ) {
    return {
      ok: false,
      errors: ["operation must be create or update"],
      codes: ["operation_invalid"],
    };
  }
  const operation = /** @type {"create" | "update"} */ (operationRaw);

  const schemaSupportsTbd = isExactTrue(obj.schemaSupportsTbd);
  const tbdWriteEnabled = isExactTrue(obj.tbdWriteEnabled);
  const tbdReady = schemaSupportsTbd && tbdWriteEnabled;

  let dateStatus = obj.dateStatus ?? obj.date_status;
  if (dateStatus == null || dateStatus === "") {
    dateStatus = SCHEDULE_DATE_STATUS_CONFIRMED;
  }
  if (dateStatus !== SCHEDULE_DATE_STATUS_CONFIRMED && dateStatus !== SCHEDULE_DATE_STATUS_TBD) {
    return {
      ok: false,
      errors: [`unknown dateStatus: ${String(dateStatus)}`],
      codes: ["date_status_unknown"],
    };
  }

  const tbdMonthModeRaw = obj.tbdMonthMode ?? obj.tbd_month_mode ?? null;
  /** @type {"month-known" | "month-unknown" | null} */
  let tbdMonthMode = null;
  if (dateStatus === SCHEDULE_DATE_STATUS_TBD) {
    if (
      tbdMonthModeRaw != null &&
      tbdMonthModeRaw !== "" &&
      tbdMonthModeRaw !== SCHEDULE_TBD_MONTH_MODE_KNOWN &&
      tbdMonthModeRaw !== SCHEDULE_TBD_MONTH_MODE_UNKNOWN
    ) {
      return {
        ok: false,
        errors: ["tbdMonthMode must be month-known or month-unknown"],
        codes: ["tbd_month_mode_invalid"],
      };
    }
    if (tbdMonthModeRaw === SCHEDULE_TBD_MONTH_MODE_UNKNOWN) {
      tbdMonthMode = SCHEDULE_TBD_MONTH_MODE_UNKNOWN;
    } else if (tbdMonthModeRaw === SCHEDULE_TBD_MONTH_MODE_KNOWN) {
      tbdMonthMode = SCHEDULE_TBD_MONTH_MODE_KNOWN;
    } else if (obj.month != null && obj.month !== "") {
      tbdMonthMode = SCHEDULE_TBD_MONTH_MODE_KNOWN;
    } else {
      return {
        ok: false,
        errors: ["tbd month-unknown requires explicit tbdMonthMode=month-unknown"],
        codes: ["tbd_month_unknown_not_explicit"],
      };
    }
  }

  const existingDate = obj.existingDate ?? obj.existing_date ?? null;
  const existingMonth = obj.existingMonth ?? obj.existing_month ?? null;

  /** @type {string | null} */
  let date =
    obj.date == null || obj.date === ""
      ? null
      : typeof obj.date === "string"
        ? obj.date
        : null;
  if (obj.date != null && obj.date !== "" && typeof obj.date !== "string") {
    return {
      ok: false,
      errors: ["date must be string YYYY-MM-DD or null"],
      codes: ["date_type"],
    };
  }

  // Edit: date change forbidden (legacy operational / Edge rule).
  if (operation === SCHEDULE_ADMIN_DATE_OPERATION_UPDATE) {
    if (existingDate != null && existingDate !== "") {
      if (dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED) {
        if (date != null && date !== existingDate) {
          return {
            ok: false,
            errors: ["update must not change date (date change not supported)"],
            codes: ["edit_date_forbidden"],
          };
        }
        date = typeof existingDate === "string" ? existingDate : date;
      }
    }
  }

  /** @type {string | null} */
  let month =
    obj.month == null || obj.month === ""
      ? null
      : typeof obj.month === "string"
        ? obj.month
        : null;
  if (obj.month != null && obj.month !== "" && typeof obj.month !== "string") {
    return {
      ok: false,
      errors: ["month must be string YYYY-MM or null"],
      codes: ["month_type"],
    };
  }

  if (dateStatus === SCHEDULE_DATE_STATUS_TBD) {
    // Sentinel / accidental calendar day — fail-closed (do not silently clear).
    if (obj.date != null && obj.date !== "") {
      return {
        ok: false,
        errors: ["tbd forbids date (sentinel / fictional day rejected)"],
        codes: ["tbd_date_forbidden", "sentinel_rejected"],
      };
    }
    date = null;
    if (tbdMonthMode === SCHEDULE_TBD_MONTH_MODE_UNKNOWN) {
      month = null;
    }
  }

  const contractInput = {
    dateStatus,
    date,
    month,
    sortOrder: obj.sortOrder ?? obj.sort_order ?? 0,
    legacyId: obj.legacyId ?? obj.legacy_id ?? null,
    sourceRoute: obj.sourceRoute ?? obj.source_route ?? null,
  };
  const contract = normalizeScheduleDateContract(contractInput);
  if (!contract.ok) {
    return { ok: false, errors: contract.errors, codes: contract.codes };
  }

  const c = contract.value;
  const isConfirmed = c.dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED;
  const isTbd = c.dateStatus === SCHEDULE_DATE_STATUS_TBD;

  let blockedReason = /** @type {string | null} */ (null);
  let writeAllowed = true;
  if (isTbd && !tbdReady) {
    writeAllowed = false;
    if (!schemaSupportsTbd && !tbdWriteEnabled) {
      blockedReason = "schemaSupportsTbd and tbdWriteEnabled must both be exact true";
    } else if (!schemaSupportsTbd) {
      blockedReason = "schemaSupportsTbd must be exact true";
    } else {
      blockedReason = "tbdWriteEnabled must be exact true";
    }
  }

  const dateInputEnabled =
    isConfirmed && operation === SCHEDULE_ADMIN_DATE_OPERATION_CREATE;
  const dateInputRequired = isConfirmed;
  const monthInputEnabled = isTbd && tbdMonthMode === SCHEDULE_TBD_MONTH_MODE_KNOWN;
  const monthInputRequired = isTbd && tbdMonthMode === SCHEDULE_TBD_MONTH_MODE_KNOWN;

  return {
    ok: true,
    value: {
      dateStatus: c.dateStatus,
      date: c.date,
      month: c.month,
      year: c.year,
      display: c.display,
      monthMembership: c.monthMembership,
      tbdMonthMode: isTbd ? tbdMonthMode : null,
      dateInputEnabled,
      dateInputRequired,
      monthInputEnabled,
      monthInputRequired,
      writeAllowed,
      blockedReason,
      operation,
      schemaSupportsTbd,
      tbdWriteEnabled,
      contract: c,
      // preserve existing month hint for update UI (not used in contract when confirmed)
      existingDate: existingDate == null || existingDate === "" ? null : String(existingDate),
      existingMonth: existingMonth == null || existingMonth === "" ? null : String(existingMonth),
    },
    errors: [],
    codes: [],
  };
}

/**
 * Alias emphasizing validation semantics.
 * @param {unknown} input
 */
export function validateScheduleAdminDateState(input) {
  return resolveScheduleAdminDateState(input);
}
