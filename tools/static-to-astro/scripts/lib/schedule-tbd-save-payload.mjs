/**
 * CMS Core v2 — Schedule TBD Save payload builder (site-neutral, pure).
 * Phase: cms-core-v2-schedule-tbd-admin-state-save-payload-helpers
 *
 * Modes:
 * - legacy-confirmed-only: current confirmed payloads (no date_status, no null date)
 * - tbd-v1: post-migration offline contract (date_status explicit)
 *
 * No Admin / Edge / Save runtime wiring. Does not mutate inputs.
 */

import {
  SCHEDULE_DATE_STATUS_CONFIRMED,
  SCHEDULE_DATE_STATUS_TBD,
  normalizeScheduleDateContract,
} from "./schedule-date-contract.mjs";
import {
  SCHEDULE_ADMIN_DATE_OPERATION_CREATE,
  SCHEDULE_ADMIN_DATE_OPERATION_UPDATE,
  SCHEDULE_TBD_MONTH_MODE_KNOWN,
  SCHEDULE_TBD_MONTH_MODE_UNKNOWN,
  isExactTrue,
  resolveScheduleAdminDateState,
} from "./schedule-admin-date-state.mjs";

export const SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED = "legacy-confirmed-only";
export const SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1 = "tbd-v1";

/** Matches shell `dryRunFormInputToWritePayload` content keys. */
export const LEGACY_CONFIRMED_WRITE_CONTENT_KEYS = Object.freeze([
  "date",
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
]);

/** Matches Edge create allowlist (no month/source_* on wire). */
export const LEGACY_EDGE_CREATE_PAYLOAD_KEYS = Object.freeze([
  "date",
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
]);

/** Matches Edge edit safe fields (+ lock). */
export const LEGACY_EDGE_EDIT_SAFE_FIELDS = Object.freeze([
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
]);

const ALLOWED_BUILD_KEYS = new Set([
  "mode",
  "operation",
  "payloadShape",
  "dateStatus",
  "date_status",
  "date",
  "month",
  "tbdMonthMode",
  "tbd_month_mode",
  "schemaSupportsTbd",
  "tbdWriteEnabled",
  "existingDate",
  "existing_date",
  "existingMonth",
  "existing_month",
  "expectedBeforeUpdatedAt",
  "id",
  "legacyId",
  "legacy_id",
  "siteSlug",
  "site_slug",
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
  "sortOrder",
  "adminDateState",
]);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function trimOrNull(raw) {
  if (raw == null) return null;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t ? t : null;
}

/**
 * Kit schedule month route helpers (site-neutral path shape).
 * @param {string} month YYYY-MM
 */
export function deriveScheduleMonthRouteFields(month) {
  if (typeof month !== "string" || !/^\d{4}-\d{2}$/.test(month)) {
    return { source_route: null, source_file: null, year: null };
  }
  const year = Number(month.slice(0, 4));
  return {
    source_route: `/schedule/${month}/`,
    source_file: `schedule-${month}.html`,
    year,
  };
}

/**
 * Old payload compatibility: omit date_status + valid date → confirmed; omit + no date → fail.
 * @param {unknown} payload
 * @returns {{ ok: true, dateStatus: "confirmed" | "tbd", date: string | null, month: string | null } | { ok: false, errors: string[], codes: string[] }}
 */
export function coerceScheduleDateFieldsFromLegacyPayload(payload) {
  if (!isPlainObject(payload)) {
    return { ok: false, errors: ["payload must be a plain object"], codes: ["input_type"] };
  }
  const obj = /** @type {Record<string, unknown>} */ (payload);
  const hasStatus =
    Object.prototype.hasOwnProperty.call(obj, "date_status") ||
    Object.prototype.hasOwnProperty.call(obj, "dateStatus");
  if (hasStatus) {
    const status = obj.date_status ?? obj.dateStatus;
    if (status !== SCHEDULE_DATE_STATUS_CONFIRMED && status !== SCHEDULE_DATE_STATUS_TBD) {
      return {
        ok: false,
        errors: [`unknown date_status: ${String(status)}`],
        codes: ["date_status_unknown"],
      };
    }
    const date = obj.date == null || obj.date === "" ? null : String(obj.date);
    const month = obj.month == null || obj.month === "" ? null : String(obj.month);
    return { ok: true, dateStatus: status, date, month };
  }
  const dateRaw = obj.date;
  if (dateRaw == null || dateRaw === "") {
    return {
      ok: false,
      errors: ["legacy payload without date_status requires date"],
      codes: ["legacy_date_required"],
    };
  }
  if (typeof dateRaw !== "string") {
    return { ok: false, errors: ["date must be string"], codes: ["date_type"] };
  }
  const contract = normalizeScheduleDateContract({
    dateStatus: SCHEDULE_DATE_STATUS_CONFIRMED,
    date: dateRaw,
    month: obj.month == null || obj.month === "" ? null : obj.month,
  });
  if (!contract.ok) {
    return { ok: false, errors: contract.errors, codes: contract.codes };
  }
  return {
    ok: true,
    dateStatus: SCHEDULE_DATE_STATUS_CONFIRMED,
    date: contract.value.date,
    month: contract.value.month,
  };
}

/**
 * @param {Record<string, unknown>} obj
 */
function readContentFields(obj) {
  return {
    title: trimOrNull(obj.title),
    venue: trimOrNull(obj.venue),
    open_time: trimOrNull(obj.open_time),
    start_time: trimOrNull(obj.start_time),
    price: trimOrNull(obj.price),
    description: trimOrNull(obj.description),
    published: typeof obj.published === "boolean" ? obj.published : false,
    show_on_home: typeof obj.show_on_home === "boolean" ? obj.show_on_home : false,
    home_order: obj.home_order == null || obj.home_order === "" ? null : obj.home_order,
    sort_order:
      typeof obj.sort_order === "number"
        ? obj.sort_order
        : typeof obj.sortOrder === "number"
          ? obj.sortOrder
          : 0,
  };
}

/**
 * Build Save payload candidate (fail-closed result). Pure / offline.
 *
 * @param {unknown} input
 */
export function buildScheduleTbdSavePayload(input) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const codes = [];

  if (!isPlainObject(input)) {
    return { ok: false, errors: ["input must be a plain object"], codes: ["input_type"] };
  }
  const obj = /** @type {Record<string, unknown>} */ (input);
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_BUILD_KEYS.has(key)) {
      errors.push(`unknown field: ${key}`);
      codes.push("unknown_field");
    }
  }
  if (errors.length) return { ok: false, errors, codes };

  const mode = obj.mode;
  if (
    mode !== SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED &&
    mode !== SCHEDULE_SAVE_PAYLOAD_MODE_TBD_V1
  ) {
    return {
      ok: false,
      errors: ["mode must be legacy-confirmed-only or tbd-v1"],
      codes: ["mode_invalid"],
    };
  }

  const operation = obj.operation;
  if (
    operation !== SCHEDULE_ADMIN_DATE_OPERATION_CREATE &&
    operation !== SCHEDULE_ADMIN_DATE_OPERATION_UPDATE
  ) {
    return {
      ok: false,
      errors: ["operation must be create or update"],
      codes: ["operation_invalid"],
    };
  }

  const payloadShape = obj.payloadShape == null || obj.payloadShape === "" ? "shell-write" : obj.payloadShape;
  if (payloadShape !== "shell-write" && payloadShape !== "edge-create" && payloadShape !== "edge-edit") {
    return {
      ok: false,
      errors: ["payloadShape must be shell-write, edge-create, or edge-edit"],
      codes: ["payload_shape_invalid"],
    };
  }

  const content = readContentFields(obj);
  if (typeof obj.home_order !== "undefined" && obj.home_order !== null && obj.home_order !== "") {
    if (typeof obj.home_order !== "number") {
      return { ok: false, errors: ["home_order must be number or null"], codes: ["home_order_type"] };
    }
  }

  // Resolve date state (reuse admin helper; do not duplicate contract rules).
  const adminStateInput = obj.adminDateState && isPlainObject(obj.adminDateState)
    ? {
        .../** @type {Record<string, unknown>} */ (obj.adminDateState),
        operation,
        schemaSupportsTbd: obj.schemaSupportsTbd,
        tbdWriteEnabled: obj.tbdWriteEnabled,
      }
    : {
        dateStatus: obj.dateStatus ?? obj.date_status,
        date: obj.date,
        month: obj.month,
        tbdMonthMode: obj.tbdMonthMode ?? obj.tbd_month_mode,
        schemaSupportsTbd: obj.schemaSupportsTbd,
        tbdWriteEnabled: obj.tbdWriteEnabled,
        operation,
        existingDate: obj.existingDate ?? obj.existing_date,
        existingMonth: obj.existingMonth ?? obj.existing_month,
        sortOrder: obj.sort_order ?? obj.sortOrder ?? 0,
        legacyId: obj.legacyId ?? obj.legacy_id,
      };

  const state = resolveScheduleAdminDateState(adminStateInput);
  if (!state.ok) {
    return { ok: false, errors: state.errors, codes: state.codes };
  }
  const dateState = state.value;

  if (mode === SCHEDULE_SAVE_PAYLOAD_MODE_LEGACY_CONFIRMED) {
    if (dateState.dateStatus !== SCHEDULE_DATE_STATUS_CONFIRMED || dateState.date == null) {
      return {
        ok: false,
        errors: ["legacy-confirmed-only allows confirmed + non-null date only"],
        codes: ["legacy_confirmed_only"],
      };
    }
    if (Object.prototype.hasOwnProperty.call(obj, "date_status") || Object.prototype.hasOwnProperty.call(obj, "dateStatus")) {
      if ((obj.date_status ?? obj.dateStatus) === SCHEDULE_DATE_STATUS_TBD) {
        return {
          ok: false,
          errors: ["legacy-confirmed-only rejects tbd date_status"],
          codes: ["legacy_rejects_tbd"],
        };
      }
    }

    if (operation === SCHEDULE_ADMIN_DATE_OPERATION_CREATE) {
      if (payloadShape === "edge-edit") {
        return {
          ok: false,
          errors: ["edge-edit shape invalid for create"],
          codes: ["payload_shape_mismatch"],
        };
      }
      if (content.published !== false && payloadShape === "edge-create") {
        return {
          ok: false,
          errors: ["create published must be false"],
          codes: ["create_published_false"],
        };
      }

      if (payloadShape === "edge-create") {
        /** @type {Record<string, unknown>} */
        const payload = {
          date: dateState.date,
          title: content.title ?? "",
          venue: content.venue ?? "",
          open_time: content.open_time ?? "",
          start_time: content.start_time ?? "",
          price: content.price ?? "",
          description: content.description ?? "",
          published: false,
        };
        // Edge create strings are typically trimmed form strings (may be empty).
        // Align with builder that uses String(fields).trim() — allow empty string for optional text.
        if (typeof obj.title === "string") payload.title = obj.title.trim();
        if (typeof obj.venue === "string") payload.venue = obj.venue.trim();
        if (typeof obj.open_time === "string") payload.open_time = obj.open_time.trim();
        if (typeof obj.start_time === "string") payload.start_time = obj.start_time.trim();
        if (typeof obj.price === "string") payload.price = obj.price.trim();
        if (typeof obj.description === "string") payload.description = obj.description.trim();

        return {
          ok: true,
          value: {
            mode,
            operation,
            payloadShape,
            payload,
            monthFields: deriveScheduleMonthRouteFields(dateState.month || ""),
            dateState,
          },
          errors: [],
          codes: [],
        };
      }

      // shell-write — deep-equal target for dryRunFormInputToWritePayload
      /** @type {Record<string, unknown>} */
      const payload = {
        date: typeof obj.date === "string" ? obj.date.trim() : dateState.date,
        title: typeof obj.title === "string" ? obj.title.trim() || null : content.title,
        venue: typeof obj.venue === "string" ? obj.venue.trim() || null : content.venue,
        open_time: typeof obj.open_time === "string" ? obj.open_time.trim() || null : content.open_time,
        start_time:
          typeof obj.start_time === "string" ? obj.start_time.trim() || null : content.start_time,
        price: typeof obj.price === "string" ? obj.price.trim() || null : content.price,
        description:
          typeof obj.description === "string" ? obj.description.trim() || null : content.description,
        published: content.published,
        show_on_home: content.show_on_home,
        home_order: content.home_order,
        sort_order: content.sort_order,
      };
      if (Object.prototype.hasOwnProperty.call(payload, "date_status")) {
        return {
          ok: false,
          errors: ["legacy payload must not include date_status"],
          codes: ["legacy_date_status_forbidden"],
        };
      }
      return {
        ok: true,
        value: {
          mode,
          operation,
          payloadShape,
          payload,
          monthFields: deriveScheduleMonthRouteFields(dateState.month || ""),
          dateState,
        },
        errors: [],
        codes: [],
      };
    }

    // update
    const lock = obj.expectedBeforeUpdatedAt;
    if (lock == null || lock === "" || typeof lock !== "string") {
      return {
        ok: false,
        errors: ["expectedBeforeUpdatedAt is required for update"],
        codes: ["lock_required"],
      };
    }
    if (Object.prototype.hasOwnProperty.call(obj, "date") && obj.date != null && obj.date !== "") {
      const existing = obj.existingDate ?? obj.existing_date;
      if (existing != null && String(obj.date) !== String(existing)) {
        return {
          ok: false,
          errors: ["update must not change date"],
          codes: ["edit_date_forbidden"],
        };
      }
    }

    if (payloadShape === "edge-create") {
      return {
        ok: false,
        errors: ["edge-create shape invalid for update"],
        codes: ["payload_shape_mismatch"],
      };
    }

    if (payloadShape === "edge-edit") {
      /** @type {Record<string, unknown>} */
      const payload = {
        title: typeof obj.title === "string" ? obj.title.trim() : content.title ?? "",
        venue: typeof obj.venue === "string" ? obj.venue.trim() : content.venue ?? "",
        open_time: typeof obj.open_time === "string" ? obj.open_time.trim() : content.open_time ?? "",
        start_time:
          typeof obj.start_time === "string" ? obj.start_time.trim() : content.start_time ?? "",
        price: typeof obj.price === "string" ? obj.price.trim() : content.price ?? "",
        description:
          typeof obj.description === "string" ? obj.description.trim() : content.description ?? "",
        published: content.published,
        expectedBeforeUpdatedAt: lock,
      };
      const id = trimOrNull(obj.id);
      const legacyId = trimOrNull(obj.legacyId ?? obj.legacy_id);
      if (id) payload.id = id;
      if (legacyId) payload.legacyId = legacyId;
      if (!id && !legacyId) {
        return {
          ok: false,
          errors: ["edit requires id or legacyId"],
          codes: ["edit_id_required"],
        };
      }
      if (Object.prototype.hasOwnProperty.call(payload, "date")) {
        return {
          ok: false,
          errors: ["edit payload must not include date"],
          codes: ["edit_date_forbidden"],
        };
      }
      return {
        ok: true,
        value: { mode, operation, payloadShape, payload, monthFields: null, dateState },
        errors: [],
        codes: [],
      };
    }

    // shell-write update — content fields + lock, no date, no date_status
    /** @type {Record<string, unknown>} */
    const payload = {
      title: typeof obj.title === "string" ? obj.title.trim() || null : content.title,
      venue: typeof obj.venue === "string" ? obj.venue.trim() || null : content.venue,
      open_time: typeof obj.open_time === "string" ? obj.open_time.trim() || null : content.open_time,
      start_time:
        typeof obj.start_time === "string" ? obj.start_time.trim() || null : content.start_time,
      price: typeof obj.price === "string" ? obj.price.trim() || null : content.price,
      description:
        typeof obj.description === "string" ? obj.description.trim() || null : content.description,
      published: content.published,
      show_on_home: content.show_on_home,
      home_order: content.home_order,
      sort_order: content.sort_order,
      expectedBeforeUpdatedAt: lock,
    };
    return {
      ok: true,
      value: { mode, operation, payloadShape, payload, monthFields: null, dateState },
      errors: [],
      codes: [],
    };
  }

  // --- tbd-v1 ---
  if (!dateState.writeAllowed) {
    return {
      ok: false,
      errors: [dateState.blockedReason || "TBD write not allowed"],
      codes: ["tbd_write_blocked"],
    };
  }
  if (!isExactTrue(obj.schemaSupportsTbd) || !isExactTrue(obj.tbdWriteEnabled)) {
    return {
      ok: false,
      errors: ["tbd-v1 requires schemaSupportsTbd and tbdWriteEnabled exact true"],
      codes: ["tbd_flags_required"],
    };
  }

  const monthFields =
    dateState.month != null
      ? deriveScheduleMonthRouteFields(dateState.month)
      : { source_route: null, source_file: null, year: null };

  if (operation === SCHEDULE_ADMIN_DATE_OPERATION_CREATE) {
    if (content.published !== false && dateState.dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED) {
      // allow published true for confirmed create in shell; edge still forces false at runtime
    }
    /** @type {Record<string, unknown>} */
    const payload = {
      date_status: dateState.dateStatus,
      date: dateState.date,
      month: dateState.month,
      year: dateState.year,
      source_route: monthFields.source_route,
      source_file: monthFields.source_file,
      title: typeof obj.title === "string" ? obj.title.trim() || null : content.title,
      venue: typeof obj.venue === "string" ? obj.venue.trim() || null : content.venue,
      open_time: typeof obj.open_time === "string" ? obj.open_time.trim() || null : content.open_time,
      start_time:
        typeof obj.start_time === "string" ? obj.start_time.trim() || null : content.start_time,
      price: typeof obj.price === "string" ? obj.price.trim() || null : content.price,
      description:
        typeof obj.description === "string" ? obj.description.trim() || null : content.description,
      published: content.published,
      show_on_home: content.show_on_home,
      home_order: content.home_order,
      sort_order: content.sort_order,
    };
    if (dateState.dateStatus === SCHEDULE_DATE_STATUS_TBD && payload.date != null) {
      return {
        ok: false,
        errors: ["tbd payload must not include date"],
        codes: ["sentinel_rejected"],
      };
    }
    return {
      ok: true,
      value: { mode, operation, payloadShape: "tbd-v1", payload, monthFields, dateState },
      errors: [],
      codes: [],
    };
  }

  // tbd-v1 update — date immutable; lock required; may include date_status + month for TBD fields
  const lock = obj.expectedBeforeUpdatedAt;
  if (lock == null || lock === "" || typeof lock !== "string") {
    return {
      ok: false,
      errors: ["expectedBeforeUpdatedAt is required for update"],
      codes: ["lock_required"],
    };
  }
  if (Object.prototype.hasOwnProperty.call(obj, "date") && obj.date != null && obj.date !== "") {
    const existing = obj.existingDate ?? obj.existing_date ?? dateState.existingDate;
    if (existing != null && String(obj.date) !== String(existing)) {
      return {
        ok: false,
        errors: ["update must not change date"],
        codes: ["edit_date_forbidden"],
      };
    }
  }

  /** @type {Record<string, unknown>} */
  const payload = {
    date_status: dateState.dateStatus,
    title: typeof obj.title === "string" ? obj.title.trim() || null : content.title,
    venue: typeof obj.venue === "string" ? obj.venue.trim() || null : content.venue,
    open_time: typeof obj.open_time === "string" ? obj.open_time.trim() || null : content.open_time,
    start_time:
      typeof obj.start_time === "string" ? obj.start_time.trim() || null : content.start_time,
    price: typeof obj.price === "string" ? obj.price.trim() || null : content.price,
    description:
      typeof obj.description === "string" ? obj.description.trim() || null : content.description,
    published: content.published,
    show_on_home: content.show_on_home,
    home_order: content.home_order,
    sort_order: content.sort_order,
    expectedBeforeUpdatedAt: lock,
  };
  // Status/month for TBD transitions without sending date day field
  if (dateState.dateStatus === SCHEDULE_DATE_STATUS_TBD) {
    payload.date = null;
    payload.month = dateState.month;
    payload.year = dateState.year;
    payload.source_route = monthFields.source_route;
    payload.source_file = monthFields.source_file;
  }
  if (Object.prototype.hasOwnProperty.call(payload, "date") && payload.date != null) {
    // confirmed update must not include date field
    if (dateState.dateStatus === SCHEDULE_DATE_STATUS_CONFIRMED) {
      delete payload.date;
    }
  }

  return {
    ok: true,
    value: { mode, operation, payloadShape: "tbd-v1", payload, monthFields, dateState },
    errors: [],
    codes: [],
  };
}

export {
  SCHEDULE_ADMIN_DATE_OPERATION_CREATE,
  SCHEDULE_ADMIN_DATE_OPERATION_UPDATE,
  SCHEDULE_TBD_MONTH_MODE_KNOWN,
  SCHEDULE_TBD_MONTH_MODE_UNKNOWN,
};
