/**
 * Gosaki About Supabase dry-run + gated Save + read (CMS Core v2).
 * Endpoint name: gosaki-about-supabase-save-dry-run
 * Staging only: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
 * Auth: user JWT + anon key · can_write_site · no service_role
 * Slice: page_key=about. Legacy single-field path remains profile.lede.
 * Multi-field Save calls public.gosaki_about_page_fields_save (one transaction).
 * Allowlist: profile.heading, profile.body, profile.image_alt, profile.lede,
 * bands.<stable-id>.name|body|image_alt (stable id = gosaki-piano-band-profiles.json id).
 * operation=read: SELECT-only hydrate (no nextValueText · no Save approval)
 * Contents API path (G-12a) is NOT used here — parallel until cutover.
 *
 * LOCAL IMPLEMENTATION — Edge deploy is a later operator-approved phase.
 */

import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export const ENDPOINT_NAME = "gosaki-about-supabase-save-dry-run";
export const SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const PAGE_KEY = "about";
export const FIELD_KEY = "profile.lede";
export const PROFILE_FIELD_KEYS = [
  "profile.heading",
  "profile.body",
  "profile.image_alt",
  "profile.lede",
] as const;
/** Article id `band-<json id>` → json id in config/sites/gosaki-piano-band-profiles.json. */
export const BAND_ARTICLE_ID_RE = /^band-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
export const BAND_FIELD_KEY_RE = /^bands\.([a-z0-9]+(?:-[a-z0-9]+)*)\.(name|body|image_alt)$/;

/** Stable ids from config/sites/gosaki-piano-band-profiles.json — not a guessed pattern. */
export const ABOUT_BAND_STABLE_IDS = [
  "gosakirika-trio",
  "onomatope",
  "careless-hornets",
  "kikioto",
  "caribbean-function",
] as const;

export function isAboutSupabaseAllowlistedFieldKey(fieldKey: string): boolean {
  const key = String(fieldKey ?? "").trim();
  if ((PROFILE_FIELD_KEYS as readonly string[]).includes(key)) return true;
  const match = BAND_FIELD_KEY_RE.exec(key);
  if (!match) return false;
  return (ABOUT_BAND_STABLE_IDS as readonly string[]).includes(match[1]);
}

export function aboutFieldAllowsEmpty(fieldKey: string): boolean {
  return fieldKey === "profile.image_alt" || fieldKey.endsWith(".image_alt");
}
export const READ_OPERATION = "read";
export const DRY_RUN_OPERATION = "dryRun";
export const SAVE_OPERATION = "save";
export const DRY_RUN_APPROVAL_ID = "G-cms-v2-about-supabase-profile-lede-dry-run";
export const SAVE_APPROVAL_ID =
  "G-cms-v2-about-supabase-profile-lede-web-save-non-dry-run-slice";
export const SAVE_ARMED_ENV = "GOSAKI_ABOUT_SUPABASE_SAVE_ARMED";
export const SUPABASE_SERVICE_ROLE_CONNECTED = false;

const SELECT_COLS =
  "id,site_id,site_slug,page_key,field_key,value_text,published,sort_order,created_at,updated_at,created_by,updated_by";

const WRITE_FALSE = {
  didWrite: false as const,
  dbWrite: false as const,
  networkWrite: false as const,
  writeBackend: "supabase" as const,
};

export type HandlerResult = Record<string, unknown> & { status: number };

export function isAboutSupabaseSaveArmed(
  getEnv: (key: string) => string | undefined = (key) => Deno.env.get(key),
): boolean {
  return getEnv(SAVE_ARMED_ENV) === "true";
}

function fingerprint(draft: {
  valueText: string;
  published?: boolean;
  sortOrder?: number;
  updatedAt?: string | null;
}) {
  return JSON.stringify({
    pageKey: PAGE_KEY,
    fieldKey: FIELD_KEY,
    valueText: String(draft.valueText ?? "").trim(),
    published: draft.published === true,
    sortOrder: Number(draft.sortOrder) || 0,
    updatedAt: draft.updatedAt ?? null,
  });
}

async function requireUser(
  supabaseUrl: string,
  anonKey: string,
  authorizationHeader: string | null | undefined,
): Promise<{ ok: true; user: User; client: SupabaseClient } | { ok: false; result: HandlerResult }> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      result: { status: 401, ok: false, error: "Unauthorized", detail: "Missing Authorization", ...WRITE_FALSE },
    };
  }
  if (!supabaseUrl || !anonKey) {
    return {
      ok: false,
      result: { status: 500, ok: false, error: "Server configuration error", ...WRITE_FALSE },
    };
  }
  if (supabaseUrl.includes(PRODUCTION_REF_STOP)) {
    return {
      ok: false,
      result: { status: 403, ok: false, error: "production_ref_stop", ...WRITE_FALSE },
    };
  }
  if (!supabaseUrl.includes(STAGING_PROJECT_REF)) {
    return {
      ok: false,
      result: {
        status: 403,
        ok: false,
        error: "staging_ref_required",
        detail: `supabaseUrl must include staging project ref ${STAGING_PROJECT_REF}`,
        ...WRITE_FALSE,
      },
    };
  }
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorizationHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    return {
      ok: false,
      result: {
        status: 401,
        ok: false,
        error: "Unauthorized",
        detail: error?.message ?? "Invalid session",
        ...WRITE_FALSE,
      },
    };
  }
  return { ok: true, user: data.user, client };
}

async function loadTargetRow(client: SupabaseClient) {
  const { data, error } = await client
    .from("site_page_fields")
    .select(SELECT_COLS)
    .eq("site_slug", SITE_SLUG)
    .eq("page_key", PAGE_KEY)
    .eq("field_key", FIELD_KEY)
    .maybeSingle();
  return { data, error };
}

/**
 * @param {Request} req
 * @param {{ getEnv?: (key: string) => string | undefined }} [deps]
 */
export async function handleAboutSupabaseSaveDryRun(
  req: Request,
  deps: { getEnv?: (key: string) => string | undefined } = {},
): Promise<HandlerResult> {
  const getEnv = deps.getEnv ?? ((key: string) => Deno.env.get(key));
  if (req.method === "OPTIONS") {
    return { status: 204, ok: true, ...WRITE_FALSE };
  }
  if (req.method !== "POST") {
    return { status: 405, ok: false, error: "Method not allowed", ...WRITE_FALSE };
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return { status: 400, ok: false, error: "Invalid JSON", ...WRITE_FALSE };
  }

  const operation = String(body.operation ?? (body.dryRun === false ? SAVE_OPERATION : DRY_RUN_OPERATION));
  const approvalId = String(body.approvalId ?? "").trim();
  const siteSlug = String(body.siteSlug ?? SITE_SLUG).trim();
  const pageKey = String(body.pageKey ?? PAGE_KEY).trim();
  const fieldKey = String(body.fieldKey ?? FIELD_KEY).trim();
  const nextValueText = String(body.nextValueText ?? body.valueText ?? "").trim();
  const expectedBeforeUpdatedAt = String(body.expectedBeforeUpdatedAt ?? "").trim() || null;

  if (siteSlug !== SITE_SLUG) {
    return { status: 400, ok: false, error: "siteSlug must be gosaki-piano", ...WRITE_FALSE };
  }
  const multi = Array.isArray(body.fields);
  if (pageKey !== PAGE_KEY || (!multi && fieldKey !== FIELD_KEY)) {
    return {
      status: 400,
      ok: false,
      error: "only about/profile.lede is supported in this slice",
      ...WRITE_FALSE,
    };
  }

  const supabaseUrl = getEnv("SUPABASE_URL") ?? getEnv("PUBLIC_SUPABASE_URL") ?? "";
  const anonKey = getEnv("SUPABASE_ANON_KEY") ?? getEnv("PUBLIC_SUPABASE_ANON_KEY") ?? "";
  const auth = await requireUser(supabaseUrl, anonKey, req.headers.get("Authorization"));
  if (!auth.ok) return auth.result;

  const { data: siteRow, error: siteErr } = await auth.client
    .from("sites")
    .select("id")
    .eq("site_slug", SITE_SLUG)
    .maybeSingle();
  if (siteErr || !siteRow?.id) {
    return {
      status: 403,
      ok: false,
      error: "site_not_found",
      detail: siteErr?.message ?? "gosaki-piano missing",
      ...WRITE_FALSE,
    };
  }
  const { data: writeOk, error: writeErr } = await auth.client.rpc("can_write_site", {
    p_site_id: siteRow.id,
  });
  if (writeErr || writeOk !== true) {
    return {
      status: 403,
      ok: false,
      error: "Forbidden",
      detail: writeErr?.message ?? "can_write_site denied",
      ...WRITE_FALSE,
    };
  }

  if (multi) {
    return handleAboutSupabaseFieldSet({
      client: auth.client,
      siteId: String(siteRow.id),
      fields: body.fields,
      operation,
      approvalId,
      getEnv,
    });
  }

  const { data: row, error: loadErr } = await loadTargetRow(auth.client);
  if (loadErr) {
    return {
      status: 500,
      ok: false,
      error: "load_failed",
      detail: loadErr.message,
      ...WRITE_FALSE,
    };
  }
  if (!row) {
    return {
      status: 404,
      ok: false,
      error: "row_not_found",
      detail: "about/profile.lede missing — seed required",
      ...WRITE_FALSE,
    };
  }

  const before = {
    valueText: String(row.value_text ?? "").trim(),
    published: row.published === true,
    sortOrder: Number(row.sort_order ?? 0) || 0,
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
    rowId: String(row.id),
  };

  // Read-only hydrate: SELECT already done · no nextValueText · no Save approval · no write.
  if (operation === READ_OPERATION) {
    return {
      status: 200,
      ok: true,
      operation: READ_OPERATION,
      pageKey: PAGE_KEY,
      fieldKey: FIELD_KEY,
      valueText: before.valueText,
      updatedAt: before.updatedAt,
      fields: await listAllowlistedFieldDrafts(auth.client),
      ...WRITE_FALSE,
    };
  }

  if (!nextValueText) {
    return {
      status: 400,
      ok: false,
      error: "value_text_required",
      before,
      ...WRITE_FALSE,
    };
  }

  const after = {
    valueText: nextValueText,
    published: true,
    sortOrder: Number(row.sort_order ?? 10) || 10,
  };
  const changed = before.valueText !== after.valueText;
  const plan = {
    ok: true,
    dryRun: operation !== SAVE_OPERATION,
    pageKey: PAGE_KEY,
    fieldKey: FIELD_KEY,
    before,
    after,
    changedFields: changed ? ["value_text"] : [],
    noChange: !changed,
    expectedBeforeUpdatedAt: before.updatedAt,
    fingerprint: fingerprint({ ...after, updatedAt: before.updatedAt }),
    errors: [] as string[],
    warnings: [] as string[],
  };

  if (operation === DRY_RUN_OPERATION || body.dryRun === true) {
    if (approvalId && approvalId !== DRY_RUN_APPROVAL_ID) {
      return {
        status: 400,
        ok: false,
        error: "approval_id_mismatch",
        detail: `expected ${DRY_RUN_APPROVAL_ID}`,
        ...WRITE_FALSE,
      };
    }
    return {
      status: 200,
      ok: true,
      operation: DRY_RUN_OPERATION,
      approvalId: DRY_RUN_APPROVAL_ID,
      ...plan,
      ...WRITE_FALSE,
    };
  }

  if (operation !== SAVE_OPERATION) {
    return { status: 400, ok: false, error: "unknown_operation", ...WRITE_FALSE };
  }

  if (approvalId !== SAVE_APPROVAL_ID) {
    return {
      status: 400,
      ok: false,
      error: "approval_id_mismatch",
      detail: `expected ${SAVE_APPROVAL_ID}`,
      ...WRITE_FALSE,
    };
  }

  if (!isAboutSupabaseSaveArmed(getEnv)) {
    // Spread plan first; ok/error/write flags must win over plan.ok === true.
    return {
      status: 403,
      ...plan,
      ok: false,
      error: "save_not_armed",
      detail: `${SAVE_ARMED_ENV} must be true`,
      saveArmed: false,
      ...WRITE_FALSE,
    };
  }

  if (!expectedBeforeUpdatedAt || expectedBeforeUpdatedAt !== before.updatedAt) {
    return {
      status: 409,
      ok: false,
      error: "stale_optimistic_lock",
      detail: "expectedBeforeUpdatedAt mismatch",
      before,
      ...WRITE_FALSE,
    };
  }

  if (!changed) {
    return {
      status: 200,
      ok: true,
      operation: SAVE_OPERATION,
      approvalId: SAVE_APPROVAL_ID,
      ...plan,
      ...WRITE_FALSE,
      noChange: true,
    };
  }

  const { data: updated, error: updateErr } = await auth.client
    .from("site_page_fields")
    .update({ value_text: after.valueText })
    .eq("id", row.id)
    .eq("updated_at", before.updatedAt)
    .select(SELECT_COLS)
    .maybeSingle();

  if (updateErr) {
    return {
      status: 500,
      ok: false,
      error: "update_failed",
      detail: updateErr.message,
      ...WRITE_FALSE,
    };
  }
  if (!updated) {
    return {
      status: 409,
      ok: false,
      error: "stale_optimistic_lock",
      detail: "row changed before update",
      ...WRITE_FALSE,
    };
  }

  return {
    status: 200,
    ok: true,
    operation: SAVE_OPERATION,
    approvalId: SAVE_APPROVAL_ID,
    didWrite: true,
    dbWrite: true,
    networkWrite: false,
    writeBackend: "supabase",
    before,
    after: {
      valueText: String(updated.value_text ?? ""),
      published: updated.published === true,
      sortOrder: Number(updated.sort_order ?? 0) || 0,
      updatedAt: updated.updated_at != null ? String(updated.updated_at) : null,
    },
    changedFields: ["value_text"],
    fingerprint: fingerprint({
      valueText: String(updated.value_text ?? ""),
      published: updated.published === true,
      sortOrder: Number(updated.sort_order ?? 0) || 0,
      updatedAt: updated.updated_at != null ? String(updated.updated_at) : null,
    }),
  };
}

type FieldDraft = {
  fieldKey: string;
  valueText: string;
  updatedAt: string | null;
  rowId: string | null;
};

async function listAllowlistedFieldDrafts(client: SupabaseClient): Promise<FieldDraft[]> {
  const { data, error } = await client
    .from("site_page_fields")
    .select(SELECT_COLS)
    .eq("site_slug", SITE_SLUG)
    .eq("page_key", PAGE_KEY);
  if (error || !Array.isArray(data)) return [];
  return data
    .filter((row) => isAboutSupabaseAllowlistedFieldKey(String(row.field_key ?? "")))
    .map((row) => ({
      fieldKey: String(row.field_key ?? "").trim(),
      valueText: String(row.value_text ?? ""),
      updatedAt: row.updated_at != null ? String(row.updated_at) : null,
      rowId: row.id != null ? String(row.id) : null,
    }));
}

async function handleAboutSupabaseFieldSet(input: {
  client: SupabaseClient;
  siteId: string;
  fields: unknown;
  operation: string;
  approvalId: string;
  getEnv: (key: string) => string | undefined;
}): Promise<HandlerResult> {
  const raw = Array.isArray(input.fields) ? input.fields : [];
  if (raw.length === 0) {
    return { status: 400, ok: false, error: "fields_required", ...WRITE_FALSE };
  }
  const seen = new Set<string>();
  const requested: Array<{ fieldKey: string; nextValueText: string; expectedBeforeUpdatedAt: string | null }> = [];
  for (const item of raw) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { status: 400, ok: false, error: "field_not_allowed", ...WRITE_FALSE };
    }
    const record = item as Record<string, unknown>;
    const fieldKey = String(record.fieldKey ?? "").trim();
    if (!isAboutSupabaseAllowlistedFieldKey(fieldKey) || seen.has(fieldKey)) {
      return {
        status: 400,
        ok: false,
        error: "field_not_allowed",
        detail: fieldKey || "duplicate_or_unknown",
        ...WRITE_FALSE,
      };
    }
    seen.add(fieldKey);
    const nextValueText = String(record.nextValueText ?? record.valueText ?? "");
    const trimmed = nextValueText.trim();
    if (!aboutFieldAllowsEmpty(fieldKey) && !trimmed) {
      return { status: 400, ok: false, error: "value_text_required", detail: fieldKey, ...WRITE_FALSE };
    }
    const lock = String(record.expectedBeforeUpdatedAt ?? "").trim();
    requested.push({
      fieldKey,
      nextValueText: trimmed,
      expectedBeforeUpdatedAt: lock || null,
    });
  }

  const existing = await listAllowlistedFieldDrafts(input.client);
  const byKey = new Map(existing.map((row) => [row.fieldKey, row]));
  const planFields = requested.map((field) => {
    const before = byKey.get(field.fieldKey) ?? null;
    return {
      fieldKey: field.fieldKey,
      nextValueText: field.nextValueText,
      expectedBeforeUpdatedAt: field.expectedBeforeUpdatedAt,
      beforeUpdatedAt: before?.updatedAt ?? null,
      changed: (before?.valueText ?? "") !== field.nextValueText || !before,
      rowId: before?.rowId ?? null,
    };
  });
  for (const field of planFields) {
    const before = byKey.get(field.fieldKey) ?? null;
    if (before && field.expectedBeforeUpdatedAt !== before.updatedAt) {
      return {
        status: 409,
        ok: false,
        error: "stale_optimistic_lock",
        detail: field.fieldKey,
        ...WRITE_FALSE,
      };
    }
    if (!before && field.expectedBeforeUpdatedAt) {
      return {
        status: 409,
        ok: false,
        error: "stale_optimistic_lock",
        detail: `${field.fieldKey} missing`,
        ...WRITE_FALSE,
      };
    }
  }

  const changedFields = planFields.filter((field) => field.changed).map((field) => field.fieldKey);
  const lockToken =
    planFields.find((field) => field.beforeUpdatedAt)?.beforeUpdatedAt ??
    planFields.find((field) => field.expectedBeforeUpdatedAt)?.expectedBeforeUpdatedAt ??
    "insert";
  const fingerprintValue = JSON.stringify(
    planFields.map((field) => ({
      fieldKey: field.fieldKey,
      valueText: field.nextValueText,
      updatedAt: field.beforeUpdatedAt,
    })),
  );
  const plan = {
    ok: true,
    dryRun: input.operation !== SAVE_OPERATION,
    pageKey: PAGE_KEY,
    fieldKey: "multi",
    changedFields,
    noChange: changedFields.length === 0,
    expectedBeforeUpdatedAt: lockToken,
    fieldLocks: Object.fromEntries(planFields.map((field) => [field.fieldKey, field.beforeUpdatedAt])),
    fingerprint: fingerprintValue,
    errors: [] as string[],
  };

  if (input.operation === DRY_RUN_OPERATION) {
    if (input.approvalId && input.approvalId !== DRY_RUN_APPROVAL_ID) {
      return {
        status: 400,
        ok: false,
        error: "approval_id_mismatch",
        detail: `expected ${DRY_RUN_APPROVAL_ID}`,
        ...WRITE_FALSE,
      };
    }
    return {
      status: 200,
      ok: true,
      operation: DRY_RUN_OPERATION,
      approvalId: DRY_RUN_APPROVAL_ID,
      ...plan,
      ...WRITE_FALSE,
    };
  }

  if (input.operation !== SAVE_OPERATION) {
    return { status: 400, ok: false, error: "unknown_operation", ...WRITE_FALSE };
  }
  if (input.approvalId !== SAVE_APPROVAL_ID) {
    return {
      status: 400,
      ok: false,
      error: "approval_id_mismatch",
      detail: `expected ${SAVE_APPROVAL_ID}`,
      ...WRITE_FALSE,
    };
  }
  if (!isAboutSupabaseSaveArmed(input.getEnv)) {
    return {
      status: 403,
      ...plan,
      ok: false,
      error: "save_not_armed",
      detail: `${SAVE_ARMED_ENV} must be true`,
      saveArmed: false,
      ...WRITE_FALSE,
    };
  }
  if (changedFields.length === 0) {
    return {
      status: 200,
      ok: true,
      operation: SAVE_OPERATION,
      noChange: true,
      ...plan,
      ...WRITE_FALSE,
    };
  }

  const { data, error: rpcErr } = await input.client.rpc("gosaki_about_page_fields_save", {
    p_site_slug: SITE_SLUG,
    p_page_key: PAGE_KEY,
    p_fields: planFields.map((field) => ({
      fieldKey: field.fieldKey,
      nextValueText: field.nextValueText,
      expectedBeforeUpdatedAt: field.expectedBeforeUpdatedAt,
    })),
  });
  if (rpcErr) {
    const message = String(rpcErr.message ?? "");
    const stale = /stale_optimistic_lock|about_fields_save:/.test(message);
    return {
      status: stale ? 409 : 500,
      ok: false,
      error: stale ? "stale_optimistic_lock" : "save_failed",
      detail: message,
      ...WRITE_FALSE,
    };
  }
  const result = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  if (result.ok !== true) {
    const status = Number(result.http_status);
    return {
      status: Number.isFinite(status) && status >= 400 ? status : 400,
      ok: false,
      error: String(result.error ?? "save_failed"),
      detail: result.detail != null ? String(result.detail) : undefined,
      ...WRITE_FALSE,
    };
  }
  if (result.noChange === true) {
    return {
      status: 200,
      ok: true,
      operation: SAVE_OPERATION,
      noChange: true,
      ...plan,
      ...WRITE_FALSE,
    };
  }
  const afterFields = Array.isArray(result.fields) ? result.fields : [];
  const fieldLocks =
    result.fieldLocks && typeof result.fieldLocks === "object" && !Array.isArray(result.fieldLocks)
      ? result.fieldLocks
      : {};
  return {
    status: 200,
    ok: true,
    operation: SAVE_OPERATION,
    approvalId: SAVE_APPROVAL_ID,
    didWrite: true,
    dbWrite: true,
    networkWrite: false,
    writeBackend: "supabase",
    changedFields: Array.isArray(result.changedFields) ? result.changedFields : changedFields,
    fields: afterFields,
    fieldLocks,
    fingerprint: JSON.stringify(afterFields),
  };
}
