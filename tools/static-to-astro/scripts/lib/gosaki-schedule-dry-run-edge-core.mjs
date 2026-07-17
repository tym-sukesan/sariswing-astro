/**
 * G-20u45 — Schedule Edge dry-run pure validation (shared contract).
 * Reuses G-9k edit safe fields · G-22e create date/published=false.
 * No DB write · no service_role · no approval alias minting.
 */

export const SCHEDULE_DRY_RUN_ENDPOINT_NAME = "gosaki-schedule-save-dry-run";
export const SCHEDULE_DRY_RUN_SITE_SLUG = "gosaki-piano";
export const SCHEDULE_DRY_RUN_STAGING_REF = "kmjqppxjdnwwrtaeqjta";
export const SCHEDULE_DRY_RUN_PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const SCHEDULE_DRY_RUN_OPERATION = "dryRun";
export const SCHEDULE_SAVE_OPERATION = "save";

/** G-9k / G-9j existing-event UPDATE safe fields (date/published forbidden on edit). */
export const SCHEDULE_EDIT_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
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

export function computeScheduleEditChangedFields(beforeRow, afterFields) {
  const changed = [];
  for (const field of SCHEDULE_EDIT_SAFE_FIELDS) {
    const before = normalizeScheduleFieldValue(beforeRow?.[field]);
    const after = normalizeScheduleFieldValue(afterFields?.[field]);
    if (before !== after) changed.push(field);
  }
  return changed;
}

/**
 * Validate top-level request + mode payload allowlist (no DB).
 * @returns {{ ok: boolean, status: number, errors: string[], warnings: string[], mode?: string, payload?: Record<string, unknown> }}
 */
export function validateScheduleDryRunRequestBody(body) {
  const errors = [];
  const warnings = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, errors: ["Request body must be a JSON object"], warnings };
  }

  const operation = String(body.operation ?? "").trim();
  if (operation === SCHEDULE_SAVE_OPERATION) {
    return {
      ok: false,
      status: 403,
      errors: ["operation=save is rejected (dryRun only in this phase)"],
      warnings,
    };
  }
  if (operation !== SCHEDULE_DRY_RUN_OPERATION) {
    return {
      ok: false,
      status: 422,
      errors: [`operation must be ${SCHEDULE_DRY_RUN_OPERATION}`],
      warnings,
    };
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
      if (!allowed.has(key)) {
        errors.push(`edit payload unexpected field: ${key}`);
      }
    }
    if (keys.includes("date") || keys.includes("published")) {
      errors.push("edit payload must not include date or published (G-9k safe fields only)");
    }
    const id = normalizeScheduleFieldValue(payload.id);
    const legacyId = normalizeScheduleFieldValue(payload.legacyId ?? payload.legacy_id);
    if (!id && !legacyId) {
      errors.push("edit requires id or legacyId");
    }
    const lock = normalizeScheduleFieldValue(payload.expectedBeforeUpdatedAt);
    if (!lock) {
      errors.push("expectedBeforeUpdatedAt is required for edit");
    }
    if (errors.length) {
      return { ok: false, status: 422, errors, warnings, mode, payload };
    }
    return { ok: true, status: 200, errors: [], warnings, mode, payload };
  }

  // create
  const allowedCreate = new Set(SCHEDULE_CREATE_PAYLOAD_FIELDS);
  for (const key of keys) {
    if (!allowedCreate.has(key)) {
      errors.push(`create payload unexpected field: ${key}`);
    }
  }
  if (keys.includes("id") || keys.includes("legacyId") || keys.includes("legacy_id")) {
    errors.push("create must not reuse id / legacyId");
  }
  if (keys.includes("expectedBeforeUpdatedAt")) {
    errors.push("create must not include expectedBeforeUpdatedAt");
  }
  const date = normalizeScheduleFieldValue(payload.date);
  if (!date) {
    errors.push("date is required for create");
  } else if (!CREATE_DATE_RE.test(date)) {
    errors.push("date must be YYYY-MM-DD");
  }
  if (payload.published !== false) {
    errors.push("create published must be false");
  }
  if (!normalizeScheduleFieldValue(payload.title)) {
    warnings.push("title is empty");
  }
  if (errors.length) {
    return { ok: false, status: 422, errors, warnings, mode, payload };
  }
  return { ok: true, status: 200, errors: [], warnings, mode, payload };
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
    operation: SCHEDULE_DRY_RUN_OPERATION,
    mode: input.mode ?? null,
    dryRun: true,
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
