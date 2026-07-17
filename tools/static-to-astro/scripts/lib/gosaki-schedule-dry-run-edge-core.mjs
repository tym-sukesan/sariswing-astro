/**
 * Schedule Edge dry-run + Save pure validation (shared contract).
 * Reuses G-9k edit safe fields · G-22e create date/published=false + legacy_id allocation.
 * No service_role · single capability Save approval ID (not phase aliases).
 */

export const SCHEDULE_DRY_RUN_ENDPOINT_NAME = "gosaki-schedule-save-dry-run";
export const SCHEDULE_DRY_RUN_SITE_SLUG = "gosaki-piano";
export const SCHEDULE_DRY_RUN_STAGING_REF = "kmjqppxjdnwwrtaeqjta";
export const SCHEDULE_DRY_RUN_PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const SCHEDULE_DRY_RUN_OPERATION = "dryRun";
export const SCHEDULE_SAVE_OPERATION = "save";

/** Capability-stable Save approval (edit+create). Not a phase alias of G-9k / G-22e. */
export const SCHEDULE_OPERATIONAL_SAVE_APPROVAL_ID = "gosaki-schedule-operational-save";

/**
 * Existing-event UPDATE safe fields.
 * published allowed (create→later publish path). date forbidden (legacy_id month alignment TBD).
 */
export const SCHEDULE_EDIT_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
];

/** G-22e create form fields (+ published forced false). */
export const SCHEDULE_CREATE_PAYLOAD_FIELDS = [
  "date",
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
];

export const SCHEDULE_LEGACY_ID_RE = /^schedule-\d{4}-\d{2}-\d{3}$/;

const CREATE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WRITE_FALSE = {
  didWrite: false,
  dbWrite: false,
  networkWrite: false,
  saveEnabled: false,
};

export function assertScheduleDryRunStagingUrl(supabaseUrl) {
  const url = String(supabaseUrl ?? "");
  if (!url) throw new Error("SUPABASE_URL is required");
  if (url.includes(SCHEDULE_DRY_RUN_PRODUCTION_REF_STOP)) {
    throw new Error("production Supabase ref is blocked");
  }
  if (!url.includes(SCHEDULE_DRY_RUN_STAGING_REF)) {
    throw new Error("Schedule dry-run Edge is staging-only");
  }
}

export function normalizeScheduleFieldValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function coerceSchedulePublishedBoolean(value) {
  if (typeof value === "boolean") return value;
  return null;
}

export function computeScheduleEditChangedFields(beforeRow, afterFields) {
  const changed = [];
  for (const field of SCHEDULE_EDIT_SAFE_FIELDS) {
    if (field === "published") {
      const before = beforeRow?.published === true;
      const after = afterFields?.published === true;
      if (before !== after) changed.push(field);
      continue;
    }
    const before = normalizeScheduleFieldValue(beforeRow?.[field]);
    const after = normalizeScheduleFieldValue(afterFields?.[field]);
    if (before !== after) changed.push(field);
  }
  return changed;
}

export function parseLegacyIdSuffix(legacyId) {
  const match = String(legacyId ?? "").match(/^schedule-\d{4}-\d{2}-(\d{3})$/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function formatLegacyId(month, suffix) {
  return `schedule-${month}-${String(suffix).padStart(3, "0")}`;
}

export function deriveYearMonthFromDate(date) {
  const d = normalizeScheduleFieldValue(date);
  if (!CREATE_DATE_RE.test(d)) return { year: null, month: null };
  return { year: Number.parseInt(d.slice(0, 4), 10), month: d.slice(0, 7) };
}

export function computeNextLegacyIdFromRows(month, rows) {
  let maxSuffix = 0;
  const prefix = `schedule-${month}-`;
  for (const row of rows ?? []) {
    const legacyId = row?.legacy_id ?? "";
    if (!String(legacyId).startsWith(prefix)) continue;
    const suffix = parseLegacyIdSuffix(legacyId);
    if (suffix !== null && suffix > maxSuffix) maxSuffix = suffix;
  }
  return formatLegacyId(month, maxSuffix + 1);
}

export function computeSortOrderFromRows(rows) {
  let maxSort = 0;
  let hasSortOrder = false;
  for (const row of rows ?? []) {
    if (typeof row?.sort_order === "number") {
      hasSortOrder = true;
      if (row.sort_order > maxSort) maxSort = row.sort_order;
    }
  }
  if (!hasSortOrder && (!rows || rows.length === 0)) return 10;
  return maxSort + 10;
}

/** G-22e INSERT row built server-side (id left to DB default). */
export function buildScheduleCreateInsertRow(input) {
  const date = normalizeScheduleFieldValue(input.date);
  const { year, month } = deriveYearMonthFromDate(date);
  if (year == null || !month) {
    throw new Error("create date must be YYYY-MM-DD");
  }
  const monthRows = (input.monthRows ?? []).filter(
    (row) => row.month == null || row.month === month,
  );
  const legacy_id = computeNextLegacyIdFromRows(month, monthRows);
  if (!SCHEDULE_LEGACY_ID_RE.test(legacy_id)) {
    throw new Error("create legacy_id allocation failed");
  }
  return {
    legacy_id,
    site_slug: SCHEDULE_DRY_RUN_SITE_SLUG,
    date,
    year,
    month,
    title: normalizeScheduleFieldValue(input.title),
    venue: normalizeScheduleFieldValue(input.venue) || null,
    open_time: normalizeScheduleFieldValue(input.open_time) || null,
    start_time: normalizeScheduleFieldValue(input.start_time) || null,
    price: normalizeScheduleFieldValue(input.price) || null,
    description: normalizeScheduleFieldValue(input.description) || null,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: computeSortOrderFromRows(monthRows),
    source_file: `schedule-${month}.html`,
    source_route: `/schedule/${month}/`,
    image_url: null,
  };
}

function validateModePayload(mode, payload) {
  const errors = [];
  const warnings = [];
  const keys = Object.keys(payload);

  if (mode === "edit") {
    const allowed = new Set([
      "id",
      "legacyId",
      "legacy_id",
      "expectedBeforeUpdatedAt",
      ...SCHEDULE_EDIT_SAFE_FIELDS,
    ]);
    for (const key of keys) {
      if (!allowed.has(key)) errors.push(`edit payload unexpected field: ${key}`);
    }
    if (keys.includes("date")) {
      errors.push("edit payload must not include date (date change not supported)");
    }
    if (!Object.prototype.hasOwnProperty.call(payload, "published")) {
      errors.push("edit published is required");
    } else if (typeof payload.published !== "boolean") {
      errors.push("edit published must be boolean");
    }
    const id = normalizeScheduleFieldValue(payload.id);
    const legacyId = normalizeScheduleFieldValue(payload.legacyId ?? payload.legacy_id);
    if (!id && !legacyId) errors.push("edit requires id or legacyId");
    if (!normalizeScheduleFieldValue(payload.expectedBeforeUpdatedAt)) {
      errors.push("expectedBeforeUpdatedAt is required for edit");
    }
    return { errors, warnings };
  }

  const allowedCreate = new Set(SCHEDULE_CREATE_PAYLOAD_FIELDS);
  for (const key of keys) {
    if (!allowedCreate.has(key)) errors.push(`create payload unexpected field: ${key}`);
  }
  if (keys.includes("id") || keys.includes("legacyId") || keys.includes("legacy_id")) {
    errors.push("create must not reuse id / legacyId");
  }
  if (keys.includes("expectedBeforeUpdatedAt")) {
    errors.push("create must not include expectedBeforeUpdatedAt");
  }
  const date = normalizeScheduleFieldValue(payload.date);
  if (!date) errors.push("date is required for create");
  else if (!CREATE_DATE_RE.test(date)) errors.push("date must be YYYY-MM-DD");
  if (payload.published !== false) errors.push("create published must be false");
  if (!normalizeScheduleFieldValue(payload.title)) warnings.push("title is empty");
  return { errors, warnings };
}

/**
 * Validate top-level request + mode payload allowlist (no DB).
 * dryRun: no approvalId required.
 * save: exact SCHEDULE_OPERATIONAL_SAVE_APPROVAL_ID required.
 */
export function validateScheduleDryRunRequestBody(body) {
  const errors = [];
  const warnings = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, errors: ["Request body must be a JSON object"], warnings };
  }

  const operation = String(body.operation ?? "").trim();
  if (operation !== SCHEDULE_DRY_RUN_OPERATION && operation !== SCHEDULE_SAVE_OPERATION) {
    return {
      ok: false,
      status: 422,
      errors: [`operation must be ${SCHEDULE_DRY_RUN_OPERATION} or ${SCHEDULE_SAVE_OPERATION}`],
      warnings,
    };
  }

  if (operation === SCHEDULE_SAVE_OPERATION) {
    const approvalId = String(body.approvalId ?? "").trim();
    if (!approvalId) {
      return { ok: false, status: 403, errors: ["approvalId is required for operation=save"], warnings };
    }
    if (approvalId !== SCHEDULE_OPERATIONAL_SAVE_APPROVAL_ID) {
      return {
        ok: false,
        status: 403,
        errors: [`approvalId must be ${SCHEDULE_OPERATIONAL_SAVE_APPROVAL_ID}`],
        warnings,
      };
    }
  }

  const siteSlug = String(body.siteSlug ?? "").trim();
  if (siteSlug !== SCHEDULE_DRY_RUN_SITE_SLUG) {
    return {
      ok: false,
      status: 422,
      errors: [`siteSlug must be ${SCHEDULE_DRY_RUN_SITE_SLUG}`],
      warnings,
    };
  }

  const mode = String(body.mode ?? "").trim();
  if (mode !== "edit" && mode !== "create") {
    return { ok: false, status: 422, errors: ["mode must be edit or create"], warnings };
  }

  const payload = body.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, status: 422, errors: ["payload must be an object"], warnings };
  }

  const payloadCheck = validateModePayload(mode, payload);
  errors.push(...payloadCheck.errors);
  warnings.push(...payloadCheck.warnings);

  if (errors.length) {
    return {
      ok: false,
      status: 422,
      errors,
      warnings,
      mode,
      payload,
      operation,
      approvalId: String(body.approvalId ?? "").trim() || null,
    };
  }
  return {
    ok: true,
    status: 200,
    errors: [],
    warnings,
    mode,
    payload,
    operation,
    approvalId: String(body.approvalId ?? "").trim() || null,
  };
}

export function buildScheduleDryRunSuccessResponse(input) {
  return {
    ok: true,
    operation: SCHEDULE_DRY_RUN_OPERATION,
    mode: input.mode,
    dryRun: true,
    wouldWrite: Boolean(input.wouldWrite),
    ...WRITE_FALSE,
    changedFields: input.changedFields ?? [],
    diffSummary: input.diffSummary ?? null,
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt ?? null,
    target: input.target ?? null,
    errors: [],
    warnings: input.warnings ?? [],
    status: 200,
  };
}

export function buildScheduleDryRunErrorResponse(input) {
  return {
    ok: false,
    operation: input.operation ?? SCHEDULE_DRY_RUN_OPERATION,
    mode: input.mode ?? null,
    dryRun: input.operation === SCHEDULE_SAVE_OPERATION ? false : true,
    wouldWrite: false,
    ...WRITE_FALSE,
    changedFields: [],
    diffSummary: null,
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt ?? null,
    errors: input.errors ?? ["request failed"],
    warnings: input.warnings ?? [],
    status: input.status ?? 400,
  };
}

export function buildScheduleSaveSuccessResponse(input) {
  return {
    ok: true,
    operation: SCHEDULE_SAVE_OPERATION,
    mode: input.mode,
    dryRun: false,
    wouldWrite: true,
    didWrite: true,
    dbWrite: true,
    networkWrite: true,
    saveEnabled: true,
    approvalId: SCHEDULE_OPERATIONAL_SAVE_APPROVAL_ID,
    changedFields: input.changedFields ?? [],
    diffSummary: input.diffSummary ?? null,
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt ?? null,
    target: input.target ?? null,
    errors: [],
    warnings: input.warnings ?? [],
    status: 200,
  };
}
