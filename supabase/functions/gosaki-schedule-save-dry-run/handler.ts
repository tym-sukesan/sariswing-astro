/**
 * Gosaki Schedule Edge dry-run + Save (edit UPDATE · create INSERT).
 * Endpoint: gosaki-schedule-save-dry-run
 * Staging only: kmjqppxjdnwwrtaeqjta · production STOP: vsbvndwuajjhnzpohghh
 * Auth: user JWT + anon key · rpc('is_admin') · no service_role
 * Contracts: edit safe fields include published (not date) · create published=false + legacy_id allocation
 *
 * Keep allowlists in sync with tools/static-to-astro/scripts/lib/gosaki-schedule-dry-run-edge-core.mjs
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const ENDPOINT_NAME = "gosaki-schedule-save-dry-run";
export const SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const DRY_RUN_OPERATION = "dryRun";
export const SAVE_OPERATION = "save";
export const SAVE_APPROVAL_ID = "gosaki-schedule-operational-save";
export const SUPABASE_SERVICE_ROLE_CONNECTED = false;

/** Existing-event UPDATE safe fields (published allowed · date forbidden). */
export const EDIT_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
] as const;

export const CREATE_PAYLOAD_FIELDS = [
  "date",
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
  "published",
] as const;

export const LEGACY_ID_RE = /^schedule-\d{4}-\d{2}-\d{3}$/;

const CREATE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SCHEDULE_SELECT =
  "id,legacy_id,site_slug,date,title,venue,open_time,start_time,price,description,published,updated_at,month,sort_order";

const WRITE_FALSE = {
  didWrite: false as const,
  dbWrite: false as const,
  networkWrite: false as const,
  saveEnabled: false as const,
};

export type ScheduleDryRunHandlerResult = Record<string, unknown> & { status: number };

export type ScheduleRowSelectAdapter = {
  selectExactOne(input: {
    siteSlug: string;
    id?: string;
    legacyId?: string;
  }): Promise<
    | { ok: true; row: Record<string, unknown> }
    | { ok: false; status: number; errors: string[] }
  >;
};

export type ScheduleMonthRowsAdapter = {
  selectMonthRows(input: {
    siteSlug: string;
    month: string;
  }): Promise<
    | { ok: true; rows: Array<{ legacy_id: string | null; sort_order: number | null; month?: string | null }> }
    | { ok: false; status: number; errors: string[] }
  >;
};

export type ScheduleUpdateAdapter = {
  updateExactOne(input: {
    id: string;
    siteSlug: string;
    expectedBeforeUpdatedAt: string;
    patch: Record<string, unknown>;
  }): Promise<
    | { ok: true; row: Record<string, unknown> }
    | { ok: false; status: number; errors: string[] }
  >;
};

export type ScheduleInsertAdapter = {
  insertExactOne(input: {
    row: Record<string, unknown>;
  }): Promise<
    | { ok: true; row: Record<string, unknown> }
    | { ok: false; status: number; errors: string[] }
  >;
};

export function assertStagingSupabaseUrl(supabaseUrl: string) {
  const url = String(supabaseUrl ?? "");
  if (!url) throw new Error("SUPABASE_URL is required");
  if (url.includes(PRODUCTION_REF_STOP)) {
    throw new Error("production Supabase ref is blocked");
  }
  if (!url.includes(STAGING_PROJECT_REF)) {
    throw new Error("Schedule dry-run Edge is staging-only");
  }
}

export function extractBearerToken(authorizationHeader: string | null | undefined): string | null {
  const raw = String(authorizationHeader ?? "").trim();
  if (!raw) return null;
  const match = /^Bearer\s+(.+)$/i.exec(raw);
  const token = match?.[1]?.trim() ?? "";
  return token.length > 0 ? token : null;
}

export function createUserJwtSupabaseClient(input: {
  supabaseUrl: string;
  anonKey: string;
  authorizationHeader: string;
}): SupabaseClient {
  const supabaseUrl = String(input.supabaseUrl ?? "").replace(/\/+$/, "");
  const anonKey = String(input.anonKey ?? "");
  const authorizationHeader = String(input.authorizationHeader ?? "").trim();
  assertStagingSupabaseUrl(supabaseUrl);
  if (!anonKey) throw new Error("SUPABASE_ANON_KEY is required");
  if (!authorizationHeader.toLowerCase().startsWith("bearer ")) {
    throw new Error("Authorization Bearer token is required");
  }
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorizationHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function assertOperatorIsAdmin(
  client: SupabaseClient,
): Promise<{ ok: true } | { ok: false; status: number; errors: string[] }> {
  const { data, error } = await client.rpc("is_admin");
  if (error) {
    const msg = String(error.message ?? "");
    if (/jwt|token|auth/i.test(msg)) {
      return { ok: false, status: 401, errors: ["Invalid or expired Authorization"] };
    }
    return { ok: false, status: 403, errors: ["Admin probe failed"] };
  }
  if (data !== true) {
    return { ok: false, status: 403, errors: ["public.is_admin() must be true"] };
  }
  return { ok: true };
}

function norm(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function computeEditChangedFields(
  beforeRow: Record<string, unknown>,
  afterFields: Record<string, unknown>,
): string[] {
  const changed: string[] = [];
  for (const field of EDIT_SAFE_FIELDS) {
    if (field === "published") {
      const before = beforeRow.published === true;
      const after = afterFields.published === true;
      if (before !== after) changed.push(field);
      continue;
    }
    if (norm(beforeRow[field]) !== norm(afterFields[field])) changed.push(field);
  }
  return changed;
}

export function parseLegacyIdSuffix(legacyId: string): number | null {
  const match = String(legacyId ?? "").match(/^schedule-\d{4}-\d{2}-(\d{3})$/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export function formatLegacyId(month: string, suffix: number): string {
  return `schedule-${month}-${String(suffix).padStart(3, "0")}`;
}

export function deriveYearMonthFromDate(date: string): { year: number | null; month: string | null } {
  const d = norm(date);
  if (!CREATE_DATE_RE.test(d)) return { year: null, month: null };
  return { year: Number.parseInt(d.slice(0, 4), 10), month: d.slice(0, 7) };
}

export function computeNextLegacyIdFromRows(
  month: string,
  rows: ReadonlyArray<{ legacy_id?: string | null }>,
): string {
  let maxSuffix = 0;
  const prefix = `schedule-${month}-`;
  for (const row of rows) {
    const legacyId = row.legacy_id ?? "";
    if (!legacyId.startsWith(prefix)) continue;
    const suffix = parseLegacyIdSuffix(legacyId);
    if (suffix !== null && suffix > maxSuffix) maxSuffix = suffix;
  }
  return formatLegacyId(month, maxSuffix + 1);
}

export function computeSortOrderFromRows(
  rows: ReadonlyArray<{ sort_order?: number | null }>,
): number {
  let maxSort = 0;
  let hasSortOrder = false;
  for (const row of rows) {
    if (typeof row.sort_order === "number") {
      hasSortOrder = true;
      if (row.sort_order > maxSort) maxSort = row.sort_order;
    }
  }
  if (!hasSortOrder && rows.length === 0) return 10;
  return maxSort + 10;
}

/** G-22e INSERT row — id omitted (DB default). */
export function buildCreateInsertRow(input: {
  payload: Record<string, unknown>;
  monthRows: ReadonlyArray<{
    legacy_id: string | null;
    sort_order: number | null;
    month?: string | null;
  }>;
}): Record<string, unknown> {
  const date = norm(input.payload.date);
  const { year, month } = deriveYearMonthFromDate(date);
  if (year == null || !month) throw new Error("create date must be YYYY-MM-DD");
  const monthRows = input.monthRows.filter((row) => row.month == null || row.month === month);
  const legacy_id = computeNextLegacyIdFromRows(month, monthRows);
  if (!LEGACY_ID_RE.test(legacy_id)) throw new Error("create legacy_id allocation failed");
  return {
    legacy_id,
    site_slug: SITE_SLUG,
    date,
    year,
    month,
    title: norm(input.payload.title),
    venue: norm(input.payload.venue) || null,
    open_time: norm(input.payload.open_time) || null,
    start_time: norm(input.payload.start_time) || null,
    price: norm(input.payload.price) || null,
    description: norm(input.payload.description) || null,
    published: false,
    show_on_home: false,
    home_order: null,
    sort_order: computeSortOrderFromRows(monthRows),
    source_file: `schedule-${month}.html`,
    source_route: `/schedule/${month}/`,
    image_url: null,
  };
}

export function validateScheduleDryRunRequestBody(body: unknown): {
  ok: boolean;
  status: number;
  errors: string[];
  warnings: string[];
  mode?: "edit" | "create";
  payload?: Record<string, unknown>;
  operation?: string;
  approvalId?: string | null;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, errors: ["Request body must be a JSON object"], warnings };
  }

  const record = body as Record<string, unknown>;
  const operation = norm(record.operation);

  if (operation !== DRY_RUN_OPERATION && operation !== SAVE_OPERATION) {
    return {
      ok: false,
      status: 422,
      errors: [`operation must be ${DRY_RUN_OPERATION} or ${SAVE_OPERATION}`],
      warnings,
    };
  }

  if (operation === SAVE_OPERATION) {
    const approvalId = norm(record.approvalId);
    if (!approvalId) {
      return { ok: false, status: 403, errors: ["approvalId is required for operation=save"], warnings };
    }
    if (approvalId !== SAVE_APPROVAL_ID) {
      return {
        ok: false,
        status: 403,
        errors: [`approvalId must be ${SAVE_APPROVAL_ID}`],
        warnings,
      };
    }
  }

  if (norm(record.siteSlug) !== SITE_SLUG) {
    return {
      ok: false,
      status: 422,
      errors: [`siteSlug must be ${SITE_SLUG}`],
      warnings,
    };
  }

  const mode = norm(record.mode);
  if (mode !== "edit" && mode !== "create") {
    return { ok: false, status: 422, errors: ["mode must be edit or create"], warnings };
  }

  const payload = record.payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, status: 422, errors: ["payload must be an object"], warnings };
  }
  const p = payload as Record<string, unknown>;
  const keys = Object.keys(p);

  if (mode === "edit") {
    const allowed = new Set<string>([
      "id",
      "legacyId",
      "legacy_id",
      "expectedBeforeUpdatedAt",
      ...EDIT_SAFE_FIELDS,
    ]);
    for (const key of keys) {
      if (!allowed.has(key)) errors.push(`edit payload unexpected field: ${key}`);
    }
    if ("date" in p) {
      errors.push("edit payload must not include date (date change not supported)");
    }
    if (!Object.prototype.hasOwnProperty.call(p, "published")) {
      errors.push("edit published is required");
    } else if (typeof p.published !== "boolean") {
      errors.push("edit published must be boolean");
    }
    if (!norm(p.id) && !norm(p.legacyId ?? p.legacy_id)) {
      errors.push("edit requires id or legacyId");
    }
    if (!norm(p.expectedBeforeUpdatedAt)) {
      errors.push("expectedBeforeUpdatedAt is required for edit");
    }
  } else {
    const allowedCreate = new Set<string>(CREATE_PAYLOAD_FIELDS);
    for (const key of keys) {
      if (!allowedCreate.has(key)) errors.push(`create payload unexpected field: ${key}`);
    }
    if ("id" in p || "legacyId" in p || "legacy_id" in p) {
      errors.push("create must not reuse id / legacyId");
    }
    if ("expectedBeforeUpdatedAt" in p) {
      errors.push("create must not include expectedBeforeUpdatedAt");
    }
    const date = norm(p.date);
    if (!date) errors.push("date is required for create");
    else if (!CREATE_DATE_RE.test(date)) errors.push("date must be YYYY-MM-DD");
    if (p.published !== false) errors.push("create published must be false");
    if (!norm(p.title)) warnings.push("title is empty");
  }

  if (errors.length) {
    return {
      ok: false,
      status: 422,
      errors,
      warnings,
      mode: mode as "edit" | "create",
      payload: p,
      operation,
      approvalId: norm(record.approvalId) || null,
    };
  }
  return {
    ok: true,
    status: 200,
    errors: [],
    warnings,
    mode: mode as "edit" | "create",
    payload: p,
    operation,
    approvalId: norm(record.approvalId) || null,
  };
}

function errorResult(input: {
  status: number;
  errors: string[];
  warnings?: string[];
  mode?: string | null;
  operation?: string;
  expectedBeforeUpdatedAt?: string | null;
}): ScheduleDryRunHandlerResult {
  const operation = input.operation ?? DRY_RUN_OPERATION;
  return {
    ok: false,
    operation,
    mode: input.mode ?? null,
    dryRun: operation !== SAVE_OPERATION,
    wouldWrite: false,
    ...WRITE_FALSE,
    changedFields: [],
    diffSummary: null,
    expectedBeforeUpdatedAt: input.expectedBeforeUpdatedAt ?? null,
    errors: input.errors,
    warnings: input.warnings ?? [],
    status: input.status,
  };
}

export function createDefaultScheduleSelectAdapter(client: SupabaseClient): ScheduleRowSelectAdapter {
  return {
    async selectExactOne(input) {
      let query = client
        .from("schedules")
        .select(SCHEDULE_SELECT)
        .eq("site_slug", input.siteSlug);

      if (input.id) {
        query = query.eq("id", input.id);
      } else if (input.legacyId) {
        query = query.eq("legacy_id", input.legacyId);
      } else {
        return { ok: false, status: 422, errors: ["edit requires id or legacyId"] };
      }

      const { data, error } = await query.limit(2);
      if (error) {
        return { ok: false, status: 400, errors: [error.message || "schedule SELECT failed"] };
      }
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        return { ok: false, status: 404, errors: ["schedule row not found"] };
      }
      if (rows.length !== 1) {
        return { ok: false, status: 409, errors: ["schedule SELECT must return exactly 1 row"] };
      }
      return { ok: true, row: rows[0] as Record<string, unknown> };
    },
  };
}

export function createDefaultMonthRowsAdapter(client: SupabaseClient): ScheduleMonthRowsAdapter {
  return {
    async selectMonthRows(input) {
      const { data, error } = await client
        .from("schedules")
        .select("legacy_id,sort_order,month")
        .eq("site_slug", input.siteSlug)
        .eq("month", input.month);
      if (error) {
        return { ok: false, status: 400, errors: [error.message || "month allocation SELECT failed"] };
      }
      return { ok: true, rows: (Array.isArray(data) ? data : []) as Array<{
        legacy_id: string | null;
        sort_order: number | null;
        month?: string | null;
      }> };
    },
  };
}

export function createDefaultUpdateAdapter(client: SupabaseClient): ScheduleUpdateAdapter {
  return {
    async updateExactOne(input) {
      const { data, error } = await client
        .from("schedules")
        .update(input.patch)
        .eq("id", input.id)
        .eq("site_slug", input.siteSlug)
        .eq("updated_at", input.expectedBeforeUpdatedAt)
        .select(SCHEDULE_SELECT)
        .limit(2);
      if (error) {
        return { ok: false, status: 400, errors: [error.message || "schedule UPDATE failed"] };
      }
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        return {
          ok: false,
          status: 409,
          errors: ["optimistic lock conflict: UPDATE matched 0 rows"],
        };
      }
      if (rows.length !== 1) {
        return {
          ok: false,
          status: 409,
          errors: ["schedule UPDATE must affect exactly 1 row"],
        };
      }
      return { ok: true, row: rows[0] as Record<string, unknown> };
    },
  };
}

export function createDefaultInsertAdapter(client: SupabaseClient): ScheduleInsertAdapter {
  return {
    async insertExactOne(input) {
      const { data, error } = await client
        .from("schedules")
        .insert(input.row)
        .select(SCHEDULE_SELECT)
        .limit(2);
      if (error) {
        const msg = String(error.message || "schedule INSERT failed");
        if (/duplicate|unique|legacy_id/i.test(msg) || String(error.code ?? "") === "23505") {
          return {
            ok: false,
            status: 409,
            errors: ["legacy_id collision — create Save rejected (no retry)"],
          };
        }
        return { ok: false, status: 400, errors: [msg] };
      }
      const rows = Array.isArray(data) ? data : [];
      if (rows.length === 0) {
        return { ok: false, status: 500, errors: ["schedule INSERT returned 0 rows"] };
      }
      if (rows.length !== 1) {
        return { ok: false, status: 500, errors: ["schedule INSERT must return exactly 1 row"] };
      }
      return { ok: true, row: rows[0] as Record<string, unknown> };
    },
  };
}

/**
 * HTTP dry-run / Save handler — injectable adapters for local/mock tests.
 */
export async function handleScheduleEdgeDryRunHttpAsync(
  input: {
    method: string;
    contentType?: string;
    body?: unknown;
    authorizationHeader?: string | null;
  },
  deps: {
    supabaseUrl: string;
    anonKey: string;
    selectAdapter?: ScheduleRowSelectAdapter | null;
    monthRowsAdapter?: ScheduleMonthRowsAdapter | null;
    updateAdapter?: ScheduleUpdateAdapter | null;
    insertAdapter?: ScheduleInsertAdapter | null;
    skipAdminProbe?: boolean;
  },
): Promise<ScheduleDryRunHandlerResult> {
  if (String(input.method ?? "").toUpperCase() !== "POST") {
    return errorResult({ status: 405, errors: ["Method must be POST"] });
  }

  try {
    assertStagingSupabaseUrl(deps.supabaseUrl);
  } catch (err) {
    return errorResult({
      status: 403,
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }

  const token = extractBearerToken(input.authorizationHeader);
  if (!token) {
    return errorResult({ status: 401, errors: ["Authorization Bearer user JWT is required"] });
  }

  if (!String(deps.anonKey ?? "").trim()) {
    return errorResult({ status: 500, errors: ["SUPABASE_ANON_KEY is required"] });
  }

  const authHeader = String(input.authorizationHeader ?? "").trim();

  let client: SupabaseClient | null = null;
  try {
    client = createUserJwtSupabaseClient({
      supabaseUrl: deps.supabaseUrl,
      anonKey: deps.anonKey,
      authorizationHeader: authHeader,
    });
  } catch (err) {
    return errorResult({
      status: 403,
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }

  if (!deps.skipAdminProbe) {
    const admin = await assertOperatorIsAdmin(client);
    if (!admin.ok) {
      return errorResult({ status: admin.status, errors: admin.errors });
    }
  }

  const validated = validateScheduleDryRunRequestBody(input.body);
  if (!validated.ok || !validated.mode || !validated.payload || !validated.operation) {
    return errorResult({
      status: validated.status,
      errors: validated.errors,
      warnings: validated.warnings,
      mode: validated.mode ?? null,
      operation: validated.operation,
    });
  }

  const payload = validated.payload;
  const isSave = validated.operation === SAVE_OPERATION;

  if (validated.mode === "create") {
    if (!isSave) {
      const changedFields = CREATE_PAYLOAD_FIELDS.filter((field) => {
        if (field === "published") return true;
        return Boolean(norm(payload[field]));
      });
      return {
        ok: true,
        operation: DRY_RUN_OPERATION,
        mode: "create",
        dryRun: true,
        wouldWrite: Boolean(norm(payload.date) && norm(payload.title)),
        ...WRITE_FALSE,
        changedFields,
        diffSummary: {
          createPreview: {
            date: norm(payload.date),
            title: norm(payload.title),
            published: false,
          },
        },
        expectedBeforeUpdatedAt: null,
        target: null,
        errors: [],
        warnings: validated.warnings,
        status: 200,
      };
    }

    const { month } = deriveYearMonthFromDate(norm(payload.date));
    if (!month) {
      return errorResult({
        status: 422,
        errors: ["date must be YYYY-MM-DD"],
        mode: "create",
        operation: SAVE_OPERATION,
      });
    }

    const monthAdapter = deps.monthRowsAdapter ?? createDefaultMonthRowsAdapter(client);
    const monthResult = await monthAdapter.selectMonthRows({ siteSlug: SITE_SLUG, month });
    if (!monthResult.ok) {
      return errorResult({
        status: monthResult.status,
        errors: monthResult.errors,
        mode: "create",
        operation: SAVE_OPERATION,
      });
    }

    let insertRow: Record<string, unknown>;
    try {
      insertRow = buildCreateInsertRow({ payload, monthRows: monthResult.rows });
    } catch (err) {
      return errorResult({
        status: 422,
        errors: [err instanceof Error ? err.message : String(err)],
        mode: "create",
        operation: SAVE_OPERATION,
      });
    }

    const insertAdapter = deps.insertAdapter ?? createDefaultInsertAdapter(client);
    const inserted = await insertAdapter.insertExactOne({ row: insertRow });
    if (!inserted.ok) {
      return errorResult({
        status: inserted.status,
        errors: inserted.errors,
        mode: "create",
        operation: SAVE_OPERATION,
      });
    }

    const row = inserted.row;
    const changedFields = CREATE_PAYLOAD_FIELDS.filter((field) => {
      if (field === "published") return true;
      return Boolean(norm(payload[field]));
    });
    return {
      ok: true,
      operation: SAVE_OPERATION,
      mode: "create",
      dryRun: false,
      wouldWrite: true,
      didWrite: true,
      dbWrite: true,
      networkWrite: true,
      saveEnabled: true,
      approvalId: SAVE_APPROVAL_ID,
      changedFields,
      diffSummary: {
        created: {
          date: norm(row.date),
          title: norm(row.title),
          published: false,
          legacy_id: norm(row.legacy_id),
        },
      },
      expectedBeforeUpdatedAt: null,
      target: {
        id: norm(row.id),
        legacyId: norm(row.legacy_id),
        updatedAt: norm(row.updated_at),
        site_slug: SITE_SLUG,
      },
      errors: [],
      warnings: validated.warnings,
      status: 200,
    };
  }

  // edit
  const expectedBeforeUpdatedAt = norm(payload.expectedBeforeUpdatedAt);
  const id = norm(payload.id);
  const legacyId = norm(payload.legacyId ?? payload.legacy_id);
  const selectAdapter = deps.selectAdapter ?? createDefaultScheduleSelectAdapter(client);
  const selected = await selectAdapter.selectExactOne({
    siteSlug: SITE_SLUG,
    id: id || undefined,
    legacyId: legacyId || undefined,
  });
  if (!selected.ok) {
    return errorResult({
      status: selected.status,
      errors: selected.errors,
      mode: "edit",
      operation: validated.operation,
      expectedBeforeUpdatedAt,
    });
  }

  const row = selected.row;
  if (norm(row.site_slug) !== SITE_SLUG) {
    return errorResult({
      status: 403,
      errors: ["site_slug mismatch"],
      mode: "edit",
      operation: validated.operation,
      expectedBeforeUpdatedAt,
    });
  }

  const currentUpdatedAt = norm(row.updated_at);
  if (!currentUpdatedAt || currentUpdatedAt !== expectedBeforeUpdatedAt) {
    return errorResult({
      status: 409,
      errors: ["optimistic lock conflict: expectedBeforeUpdatedAt mismatch"],
      mode: "edit",
      operation: validated.operation,
      expectedBeforeUpdatedAt,
    });
  }

  const afterFields: Record<string, unknown> = {};
  for (const field of EDIT_SAFE_FIELDS) {
    if (field === "published") {
      afterFields.published = payload.published === true;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      afterFields[field] = payload[field] ?? "";
    } else {
      afterFields[field] = row[field] ?? "";
    }
  }
  const changedFields = computeEditChangedFields(row, afterFields);
  const before: Record<string, string> = {};
  const after: Record<string, string> = {};
  for (const field of changedFields) {
    if (field === "published") {
      before[field] = row.published === true ? "true" : "false";
      after[field] = afterFields.published === true ? "true" : "false";
    } else {
      before[field] = norm(row[field]);
      after[field] = norm(afterFields[field]);
    }
  }

  if (!isSave) {
    return {
      ok: true,
      operation: DRY_RUN_OPERATION,
      mode: "edit",
      dryRun: true,
      wouldWrite: changedFields.length > 0,
      ...WRITE_FALSE,
      changedFields,
      diffSummary: { before, after },
      expectedBeforeUpdatedAt,
      target: {
        id: norm(row.id),
        legacyId: norm(row.legacy_id),
        site_slug: SITE_SLUG,
      },
      errors: [],
      warnings: validated.warnings,
      status: 200,
    };
  }

  if (changedFields.length === 0) {
    return errorResult({
      status: 422,
      errors: ["no changed fields — Save rejected"],
      mode: "edit",
      operation: SAVE_OPERATION,
      expectedBeforeUpdatedAt,
    });
  }

  const patch: Record<string, unknown> = {};
  for (const field of changedFields) {
    if (field === "published") {
      patch.published = afterFields.published === true;
    } else {
      patch[field] = afterFields[field];
    }
  }

  const updateAdapter = deps.updateAdapter ?? createDefaultUpdateAdapter(client);
  const updated = await updateAdapter.updateExactOne({
    id: norm(row.id),
    siteSlug: SITE_SLUG,
    expectedBeforeUpdatedAt,
    patch,
  });
  if (!updated.ok) {
    return errorResult({
      status: updated.status,
      errors: updated.errors,
      mode: "edit",
      operation: SAVE_OPERATION,
      expectedBeforeUpdatedAt,
    });
  }

  const afterRow = updated.row;
  return {
    ok: true,
    operation: SAVE_OPERATION,
    mode: "edit",
    dryRun: false,
    wouldWrite: true,
    didWrite: true,
    dbWrite: true,
    networkWrite: true,
    saveEnabled: true,
    approvalId: SAVE_APPROVAL_ID,
    changedFields,
    diffSummary: { before, after },
    expectedBeforeUpdatedAt,
    target: {
      id: norm(afterRow.id),
      legacyId: norm(afterRow.legacy_id),
      updatedAt: norm(afterRow.updated_at),
      site_slug: SITE_SLUG,
    },
    errors: [],
    warnings: validated.warnings,
    status: 200,
  };
}
