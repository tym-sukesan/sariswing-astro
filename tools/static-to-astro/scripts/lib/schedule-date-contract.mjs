/**
 * CMS Core v2 — Schedule TBD date contract (site-neutral pure helpers).
 * Phase: cms-core-v2-schedule-tbd-date-contract-helpers
 *
 * No network / DB / site selectors / Admin / Save wiring.
 * Does not mutate inputs. Fail-closed via result objects (no throw for validation).
 */

export const SCHEDULE_DATE_STATUS_CONFIRMED = "confirmed";
export const SCHEDULE_DATE_STATUS_TBD = "tbd";

export const SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN = "日付未定";
export const SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN = "日程未定";

/** @typedef {"confirmed" | "tbd"} ScheduleDateStatus */

/**
 * @typedef {{
 *   dateStatus: ScheduleDateStatus,
 *   date: string | null,
 *   month: string | null,
 *   year: number | null,
 *   sortOrder: number,
 *   legacyId: string | null,
 *   sourceRoute: string | null,
 *   display: string,
 *   monthMembership: ScheduleMonthMembership,
 * }} ScheduleDateContract
 */

/**
 * @typedef {{
 *   kind: "month-page",
 *   month: string,
 * } | {
 *   kind: "hub-only",
 * }} ScheduleMonthMembership
 */

/**
 * @typedef {{
 *   ok: true,
 *   value: ScheduleDateContract,
 * } | {
 *   ok: false,
 *   errors: string[],
 *   codes: string[],
 * }} ScheduleDateContractResult
 */

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(\d{2})$/;

const ALLOWED_INPUT_KEYS = new Set([
  "dateStatus",
  "date_status",
  "date",
  "month",
  "year",
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
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * @param {string} y
 * @param {string} m
 * @param {string} d
 * @returns {boolean}
 */
function isValidUtcYmd(y, m, d) {
  const yi = Number(y);
  const mi = Number(m);
  const di = Number(d);
  if (!Number.isInteger(yi) || !Number.isInteger(mi) || !Number.isInteger(di)) return false;
  if (mi < 1 || mi > 12 || di < 1 || di > 31) return false;
  const dt = new Date(Date.UTC(yi, mi - 1, di));
  return (
    dt.getUTCFullYear() === yi &&
    dt.getUTCMonth() === mi - 1 &&
    dt.getUTCDate() === di
  );
}

/**
 * Confirmed public display — matches existing Kit `formatScheduleDateDisplay` shape.
 * @param {string} iso YYYY-MM-DD
 * @returns {string}
 */
export function formatConfirmedScheduleDateDisplay(iso) {
  const m = String(iso ?? "").match(DATE_RE);
  if (!m || !isValidUtcYmd(m[1], m[2], m[3])) return "";
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getUTCDay()];
  return `${m[1]}.${m[2]}.${m[3]} (${dow})`;
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, month: string | null, year: number | null } | { ok: false, code: string, error: string }}
 */
function parseMonth(raw) {
  if (raw == null || raw === "") {
    return { ok: true, month: null, year: null };
  }
  if (typeof raw !== "string") {
    return { ok: false, code: "month_type", error: "month must be string YYYY-MM or null" };
  }
  const m = raw.match(MONTH_RE);
  if (!m) {
    return { ok: false, code: "month_malformed", error: "month must be YYYY-MM" };
  }
  const year = Number(m[1]);
  const monthNum = Number(m[2]);
  if (monthNum < 1 || monthNum > 12) {
    return { ok: false, code: "month_malformed", error: "month must be YYYY-MM with month 01-12" };
  }
  return { ok: true, month: `${m[1]}-${m[2]}`, year };
}

/**
 * @param {unknown} raw
 * @returns {{ ok: true, date: string, month: string, year: number } | { ok: false, code: string, error: string }}
 */
function parseConfirmedDate(raw) {
  if (raw == null || raw === "") {
    return { ok: false, code: "confirmed_date_null", error: "confirmed requires date YYYY-MM-DD" };
  }
  if (typeof raw !== "string") {
    return {
      ok: false,
      code: "date_type",
      error: "date must be string YYYY-MM-DD (Date objects / coercion rejected)",
    };
  }
  const m = raw.match(DATE_RE);
  if (!m || !isValidUtcYmd(m[1], m[2], m[3])) {
    return { ok: false, code: "date_invalid", error: "date must be valid YYYY-MM-DD" };
  }
  return {
    ok: true,
    date: `${m[1]}-${m[2]}-${m[3]}`,
    month: `${m[1]}-${m[2]}`,
    year: Number(m[1]),
  };
}

/**
 * @param {unknown} input
 * @returns {{ errors: string[], codes: string[], fields: Record<string, unknown> }}
 */
function readInput(input) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const codes = [];
  if (!isPlainObject(input)) {
    errors.push("input must be a plain object");
    codes.push("input_type");
    return { errors, codes, fields: {} };
  }
  const obj = /** @type {Record<string, unknown>} */ (input);
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_INPUT_KEYS.has(key)) {
      errors.push(`unknown field: ${key}`);
      codes.push("unknown_field");
    }
  }
  if (obj.date instanceof Date || Object.prototype.toString.call(obj.date) === "[object Date]") {
    errors.push("date must not be a Date object");
    codes.push("date_object_rejected");
  }
  const dateStatusRaw = obj.dateStatus ?? obj.date_status;
  const fields = {
    dateStatus: dateStatusRaw,
    date: obj.date,
    month: obj.month,
    year: obj.year,
    sortOrder: obj.sortOrder ?? obj.sort_order,
    legacyId: obj.legacyId ?? obj.legacy_id ?? null,
    sourceRoute: obj.sourceRoute ?? obj.source_route ?? null,
  };
  return { errors, codes, fields };
}

/**
 * @param {Record<string, unknown>} fields
 * @returns {ScheduleDateContractResult}
 */
function buildContract(fields) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const codes = [];

  const statusRaw = fields.dateStatus;
  if (statusRaw == null || statusRaw === "") {
    errors.push("dateStatus is required");
    codes.push("date_status_required");
  } else if (statusRaw !== SCHEDULE_DATE_STATUS_CONFIRMED && statusRaw !== SCHEDULE_DATE_STATUS_TBD) {
    errors.push(`unknown dateStatus: ${String(statusRaw)}`);
    codes.push("date_status_unknown");
  }

  let sortOrder = 0;
  if (fields.sortOrder != null && fields.sortOrder !== "") {
    if (typeof fields.sortOrder !== "number" || !Number.isFinite(fields.sortOrder)) {
      errors.push("sortOrder must be a finite number");
      codes.push("sort_order_type");
    } else {
      sortOrder = fields.sortOrder;
    }
  }

  const legacyId =
    fields.legacyId == null || fields.legacyId === ""
      ? null
      : typeof fields.legacyId === "string"
        ? fields.legacyId
        : null;
  if (fields.legacyId != null && fields.legacyId !== "" && typeof fields.legacyId !== "string") {
    errors.push("legacyId must be string or null");
    codes.push("legacy_id_type");
  }

  const sourceRoute =
    fields.sourceRoute == null || fields.sourceRoute === ""
      ? null
      : typeof fields.sourceRoute === "string"
        ? fields.sourceRoute
        : null;
  if (fields.sourceRoute != null && fields.sourceRoute !== "" && typeof fields.sourceRoute !== "string") {
    errors.push("sourceRoute must be string or null");
    codes.push("source_route_type");
  }

  if (errors.length > 0) {
    return { ok: false, errors, codes };
  }

  const dateStatus = /** @type {ScheduleDateStatus} */ (statusRaw);

  if (dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED) {
    if (fields.date != null && fields.date !== "" && typeof fields.date !== "string") {
      return {
        ok: false,
        errors: ["date must be string YYYY-MM-DD (Date objects / coercion rejected)"],
        codes: ["date_type"],
      };
    }
    const parsedDate = parseConfirmedDate(fields.date);
    if (!parsedDate.ok) {
      return { ok: false, errors: [parsedDate.error], codes: [parsedDate.code] };
    }
    const monthParse = parseMonth(fields.month);
    if (!monthParse.ok) {
      return { ok: false, errors: [monthParse.error], codes: [monthParse.code] };
    }
    /** @type {string} */
    let month = parsedDate.month;
    /** @type {number} */
    let year = parsedDate.year;
    if (monthParse.month != null) {
      if (monthParse.month !== parsedDate.month) {
        return {
          ok: false,
          errors: ["confirmed month must match date month"],
          codes: ["confirmed_month_mismatch"],
        };
      }
      month = monthParse.month;
      year = monthParse.year;
    }
    if (fields.year != null && fields.year !== "") {
      if (typeof fields.year !== "number" || fields.year !== year) {
        return {
          ok: false,
          errors: ["confirmed year must match date year"],
          codes: ["confirmed_year_mismatch"],
        };
      }
    }
    const display = formatConfirmedScheduleDateDisplay(parsedDate.date);
    /** @type {ScheduleDateContract} */
    const value = {
      dateStatus: SCHEDULE_DATE_STATUS_CONFIRMED,
      date: parsedDate.date,
      month,
      year,
      sortOrder,
      legacyId,
      sourceRoute,
      display,
      monthMembership: { kind: "month-page", month },
    };
    return { ok: true, value };
  }

  // tbd
  if (fields.date != null && fields.date !== "") {
    return {
      ok: false,
      errors: ["tbd forbids date (sentinel / fictional day rejected)"],
      codes: ["tbd_date_forbidden", "sentinel_rejected"],
    };
  }
  if (fields.date instanceof Date) {
    return {
      ok: false,
      errors: ["tbd forbids Date object date"],
      codes: ["date_object_rejected", "sentinel_rejected"],
    };
  }

  const monthParse = parseMonth(fields.month);
  if (!monthParse.ok) {
    return { ok: false, errors: [monthParse.error], codes: [monthParse.code] };
  }

  if (monthParse.month == null) {
    if (fields.year != null && fields.year !== "") {
      return {
        ok: false,
        errors: ["tbd month-unknown forbids year without month"],
        codes: ["tbd_year_without_month"],
      };
    }
    /** @type {ScheduleDateContract} */
    const value = {
      dateStatus: SCHEDULE_DATE_STATUS_TBD,
      date: null,
      month: null,
      year: null,
      sortOrder,
      legacyId,
      sourceRoute,
      display: SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN,
      monthMembership: { kind: "hub-only" },
    };
    return { ok: true, value };
  }

  if (fields.year != null && fields.year !== "") {
    if (typeof fields.year !== "number" || fields.year !== monthParse.year) {
      return {
        ok: false,
        errors: ["tbd year must match month year"],
        codes: ["tbd_year_mismatch"],
      };
    }
  }

  /** @type {ScheduleDateContract} */
  const value = {
    dateStatus: SCHEDULE_DATE_STATUS_TBD,
    date: null,
    month: monthParse.month,
    year: monthParse.year,
    sortOrder,
    legacyId,
    sourceRoute,
    display: SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN,
    monthMembership: { kind: "month-page", month: monthParse.month },
  };
  return { ok: true, value };
}

/**
 * Normalize + validate Schedule date contract (fail-closed result).
 * @param {unknown} input
 * @returns {ScheduleDateContractResult}
 */
export function normalizeScheduleDateContract(input) {
  const read = readInput(input);
  if (read.errors.length > 0) {
    return { ok: false, errors: read.errors, codes: read.codes };
  }
  return buildContract(read.fields);
}

/**
 * Alias emphasizing validation semantics (same implementation).
 * @param {unknown} input
 * @returns {ScheduleDateContractResult}
 */
export function validateScheduleDateContract(input) {
  return normalizeScheduleDateContract(input);
}

/**
 * @param {ScheduleDateContract} contract
 * @param {{ dateLabel?: string | null }} [options]
 * @returns {string}
 */
export function getScheduleDateDisplay(contract, options = {}) {
  if (!contract || typeof contract !== "object") return "";
  if (contract.dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED) {
    return contract.display || formatConfirmedScheduleDateDisplay(String(contract.date ?? ""));
  }
  if (contract.dateStatus === SCHEDULE_DATE_STATUS_TBD) {
    const override = options.dateLabel;
    if (typeof override === "string" && override.trim()) return override.trim();
    return contract.month
      ? SCHEDULE_DATE_DISPLAY_TBD_MONTH_KNOWN
      : SCHEDULE_DATE_DISPLAY_TBD_MONTH_UNKNOWN;
  }
  return "";
}

/**
 * @param {ScheduleDateContract} contract
 * @returns {ScheduleMonthMembership}
 */
export function getScheduleMonthMembership(contract) {
  return contract.monthMembership;
}

/**
 * Deterministic comparator for normalized contracts.
 * Rules:
 * 1) known month ASC · unknown month last
 * 2) within month: confirmed before tbd
 * 3) confirmed: date ASC · sortOrder ASC
 * 4) tbd (month known): sortOrder ASC
 * 5) legacyId tie-break
 * @param {ScheduleDateContract} a
 * @param {ScheduleDateContract} b
 * @returns {number}
 */
export function compareScheduleDateContract(a, b) {
  const monthA = a.month;
  const monthB = b.month;
  const aUnknown = monthA == null;
  const bUnknown = monthB == null;
  if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
  if (!aUnknown && !bUnknown && monthA !== monthB) {
    return String(monthA).localeCompare(String(monthB));
  }

  const statusRank = (s) => (s === SCHEDULE_DATE_STATUS_CONFIRMED ? 0 : 1);
  const sr = statusRank(a.dateStatus) - statusRank(b.dateStatus);
  if (sr !== 0) return sr;

  if (a.dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED) {
    const da = a.date ?? "";
    const db = b.date ?? "";
    if (da !== db) return da.localeCompare(db);
  }

  const sortDelta = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  if (sortDelta !== 0) return sortDelta;

  return String(a.legacyId ?? "").localeCompare(String(b.legacyId ?? ""));
}

/**
 * Map a Core/Mio schedule row-like object into contract input (read-only).
 * Accepts `extensions.dateStatus` for companion JSON; does not mutate `row`.
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
export function scheduleRowToDateContractInput(row) {
  const ext =
    row && typeof row.extensions === "object" && row.extensions && !Array.isArray(row.extensions)
      ? /** @type {Record<string, unknown>} */ (row.extensions)
      : {};
  const statusFromExt = ext.dateStatus ?? ext.date_status;
  const dateStatus =
    row.dateStatus ??
    row.date_status ??
    statusFromExt ??
    (row.date == null || row.date === "" ? SCHEDULE_DATE_STATUS_TBD : SCHEDULE_DATE_STATUS_CONFIRMED);
  return {
    dateStatus,
    date: row.date ?? null,
    month: row.month ?? null,
    year: row.year ?? null,
    sortOrder: row.sortOrder ?? row.sort_order ?? 0,
    legacyId: row.legacyId ?? row.legacy_id ?? null,
    sourceRoute: row.sourceRoute ?? row.source_route ?? null,
  };
}
