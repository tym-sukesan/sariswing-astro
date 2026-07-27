/**
 * Gosaki About Supabase dry-run + gated Save (CMS Core v2).
 * Endpoint name: gosaki-about-supabase-save-dry-run
 * Staging only: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
 * Auth: user JWT + anon key · can_write_site · no service_role
 * Slice: page_key=about field_key=profile.lede only
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
  if (pageKey !== PAGE_KEY || fieldKey !== FIELD_KEY) {
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
