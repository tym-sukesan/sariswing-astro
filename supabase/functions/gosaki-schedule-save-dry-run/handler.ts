/**
 * G-20u45 — Gosaki Schedule Edge dry-run (dryRun only · no Save / UPDATE / INSERT).
 * Endpoint: gosaki-schedule-save-dry-run
 * Staging only: kmjqppxjdnwwrtaeqjta · production STOP: vsbvndwuajjhnzpohghh
 * Auth: user JWT + anon key · rpc('is_admin') · no service_role
 * Contracts: G-9k edit safe fields · G-22e create date/published=false
 *
 * Mirror of tools/static-to-astro/scripts/lib/gosaki-schedule-dry-run-edge-core.mjs
 * + SELECT read for edit lock. Keep field allowlists in sync.
 */

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

export const ENDPOINT_NAME = "gosaki-schedule-save-dry-run";
export const SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const DRY_RUN_OPERATION = "dryRun";
export const SAVE_OPERATION = "save";
export const SUPABASE_SERVICE_ROLE_CONNECTED = false;

/** G-9k existing-event UPDATE safe fields (date/published forbidden). */
export const EDIT_SAFE_FIELDS = [
  "title",
  "venue",
  "open_time",
  "start_time",
  "price",
  "description",
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

const CREATE_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const SCHEDULE_SELECT =
  "id,legacy_id,site_slug,date,title,venue,open_time,start_time,price,description,published,updated_at";

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
    if (norm(beforeRow[field]) !== norm(afterFields[field])) changed.push(field);
  }
  return changed;
}

export function validateScheduleDryRunRequestBody(body: unknown): {
  ok: boolean;
  status: number;
  errors: string[];
  warnings: string[];
  mode?: "edit" | "create";
  payload?: Record<string, unknown>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, errors: ["Request body must be a JSON object"], warnings };
  }

  const record = body as Record<string, unknown>;
  const operation = norm(record.operation);

  if (operation === SAVE_OPERATION) {
    return {
      ok: false,
      status: 403,
      errors: ["operation=save is rejected (dryRun only in this phase)"],
      warnings,
    };
  }
  if (operation !== DRY_RUN_OPERATION) {
    return {
      ok: false,
      status: 422,
      errors: [`operation must be ${DRY_RUN_OPERATION}`],
      warnings,
    };
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
    if ("date" in p || "published" in p) {
      errors.push("edit payload must not include date or published (G-9k safe fields only)");
    }
    if (!norm(p.id) && !norm(p.legacyId ?? p.legacy_id)) {
      errors.push("edit requires id or legacyId");
    }
    if (!norm(p.expectedBeforeUpdatedAt)) {
      errors.push("expectedBeforeUpdatedAt is required for edit");
    }
    if (errors.length) {
      return { ok: false, status: 422, errors, warnings, mode, payload: p };
    }
    return { ok: true, status: 200, errors: [], warnings, mode, payload: p };
  }

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

  if (errors.length) {
    return { ok: false, status: 422, errors, warnings, mode, payload: p };
  }
  return { ok: true, status: 200, errors: [], warnings, mode, payload: p };
}

function errorResult(input: {
  status: number;
  errors: string[];
  warnings?: string[];
  mode?: string | null;
  expectedBeforeUpdatedAt?: string | null;
}): ScheduleDryRunHandlerResult {
  return {
    ok: false,
    operation: DRY_RUN_OPERATION,
    mode: input.mode ?? null,
    dryRun: true,
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

/**
 * HTTP dry-run handler — injectable select adapter for local/mock tests.
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
  if (!validated.ok || !validated.mode || !validated.payload) {
    return errorResult({
      status: validated.status,
      errors: validated.errors,
      warnings: validated.warnings,
      mode: validated.mode ?? null,
    });
  }

  const payload = validated.payload;

  if (validated.mode === "create") {
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
      expectedBeforeUpdatedAt,
    });
  }

  const row = selected.row;
  if (norm(row.site_slug) !== SITE_SLUG) {
    return errorResult({
      status: 403,
      errors: ["site_slug mismatch"],
      mode: "edit",
      expectedBeforeUpdatedAt,
    });
  }

  const currentUpdatedAt = norm(row.updated_at);
  if (!currentUpdatedAt || currentUpdatedAt !== expectedBeforeUpdatedAt) {
    return errorResult({
      status: 409,
      errors: ["optimistic lock conflict: expectedBeforeUpdatedAt mismatch"],
      mode: "edit",
      expectedBeforeUpdatedAt,
    });
  }

  const afterFields: Record<string, unknown> = {};
  for (const field of EDIT_SAFE_FIELDS) {
    afterFields[field] = payload[field] ?? row[field] ?? "";
  }
  const changedFields = computeEditChangedFields(row, afterFields);
  const before: Record<string, string> = {};
  const after: Record<string, string> = {};
  for (const field of changedFields) {
    before[field] = norm(row[field]);
    after[field] = norm(afterFields[field]);
  }

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
