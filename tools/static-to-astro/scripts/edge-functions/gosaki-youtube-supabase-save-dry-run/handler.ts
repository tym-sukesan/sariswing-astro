/**
 * Gosaki YouTube Supabase dry-run + gated Save (CMS Core v2 Phase 2).
 * Endpoint name: gosaki-youtube-supabase-save-dry-run
 * Staging only: kmjqppxjdnwwrtaeqjta · STOP: vsbvndwuajjhnzpohghh
 * Auth: user JWT + anon key · site_members / platform_admins · no service_role
 * Writes: column-level GRANTs; created_by/updated_by via DB trigger auth.uid() (not client payload)
 * Contents API path is NOT used here — parallel to gosaki-youtube-url-* until cutover.
 *
 * LOCAL IMPLEMENTATION — Edge deploy is a later operator-approved phase.
 */

import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export const ENDPOINT_NAME = "gosaki-youtube-supabase-save-dry-run";
export const SITE_SLUG = "gosaki-piano";
export const STAGING_PROJECT_REF = "kmjqppxjdnwwrtaeqjta";
export const PRODUCTION_REF_STOP = "vsbvndwuajjhnzpohghh";
export const PROVIDER = "youtube";
export const DRY_RUN_OPERATION = "dryRun";
export const SAVE_OPERATION = "save";
export const DRY_RUN_APPROVAL_ID = "G-cms-v2-youtube-supabase-items-dry-run";
export const SAVE_APPROVAL_ID = "G-cms-v2-youtube-supabase-items-web-save-non-dry-run-slice";
export const SAVE_ARMED_ENV = "GOSAKI_YOUTUBE_SUPABASE_SAVE_ARMED";
export const SUPABASE_SERVICE_ROLE_CONNECTED = false;

const SELECT_COLS =
  "id,site_id,site_slug,provider,legacy_item_id,title,source_url,embed_url,published,sort_order,created_at,updated_at,created_by,updated_by";

const WRITE_FALSE = {
  didWrite: false as const,
  dbWrite: false as const,
  networkWrite: false as const,
  writeBackend: "supabase" as const,
};

export type HandlerResult = Record<string, unknown> & { status: number };

export function isYoutubeSupabaseSaveArmed(
  getEnv: (key: string) => string | undefined = (key) => Deno.env.get(key),
): boolean {
  return getEnv(SAVE_ARMED_ENV) === "true";
}

export function parseYoutubeVideoId(input: string | null | undefined): string | null {
  const raw = String(input ?? "").trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  const embedSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  if (embedSrc) {
    const nested = parseYoutubeVideoId(embedSrc);
    if (nested) return nested;
  }
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\//, "").split("/")[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname.startsWith("/embed/")) {
        const id = url.pathname.split("/")[2];
        return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
      }
      const v = url.searchParams.get("v");
      return v && /^[a-zA-Z0-9_-]{11}$/.test(v) ? v : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildYoutubeNocookieEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

function rowToDraft(row: Record<string, unknown>) {
  return {
    id: String(row.legacy_item_id ?? ""),
    published: row.published === true,
    sortOrder: Number(row.sort_order ?? 0) || 0,
    embedCode: String(row.source_url ?? ""),
    updatedAt: row.updated_at != null ? String(row.updated_at) : null,
    rowId: row.id != null ? String(row.id) : null,
  };
}

function fingerprint(items: Array<{ id: string; published: boolean; sortOrder: number; embedCode: string; updatedAt?: string | null }>) {
  return JSON.stringify(
    items.map((i) => ({
      id: i.id,
      published: i.published === true,
      sortOrder: Number(i.sortOrder) || 0,
      embedCode: String(i.embedCode ?? ""),
      updatedAt: i.updatedAt ?? null,
    })),
  );
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
      result: { status: 401, ok: false, error: "Unauthorized", detail: error?.message ?? "Invalid session", ...WRITE_FALSE },
    };
  }
  return { ok: true, user: data.user, client };
}

async function assertCanWriteSite(
  client: SupabaseClient,
  siteId: string,
): Promise<{ ok: true } | { ok: false; result: HandlerResult }> {
  const { data, error } = await client.rpc("can_write_site", { p_site_id: siteId });
  if (error) {
    return {
      ok: false,
      result: {
        status: 403,
        ok: false,
        error: "Forbidden",
        detail: "can_write_site rpc failed — membership tables may be missing",
        rpcError: error.message,
        ...WRITE_FALSE,
      },
    };
  }
  if (data !== true) {
    return {
      ok: false,
      result: {
        status: 403,
        ok: false,
        error: "Forbidden",
        detail: "site membership or active platform_admin required",
        ...WRITE_FALSE,
      },
    };
  }
  return { ok: true };
}

export async function handleYoutubeSupabaseSaveDryRunHttp(input: {
  method: string;
  contentType: string;
  body?: unknown;
  authorizationHeader?: string | null;
  supabaseUrl: string;
  anonKey: string;
  getEnv?: (key: string) => string | undefined;
}): Promise<HandlerResult> {
  if (input.method === "OPTIONS") {
    return { status: 200, ok: true, ...WRITE_FALSE };
  }
  if (input.method !== "POST") {
    return { status: 405, ok: false, error: "Method not allowed", ...WRITE_FALSE };
  }

  const auth = await requireUser(input.supabaseUrl, input.anonKey, input.authorizationHeader);
  if (!auth.ok) return auth.result;

  const body = (input.body && typeof input.body === "object" ? input.body : {}) as Record<
    string,
    unknown
  >;
  const siteSlug = String(body.siteSlug ?? "").trim();
  if (siteSlug !== SITE_SLUG) {
    return { status: 400, ok: false, error: "siteSlug must be gosaki-piano", ...WRITE_FALSE };
  }

  const operation = String(body.operation ?? (body.dryRun === true ? DRY_RUN_OPERATION : "")).trim();
  const approvalId = String(body.approvalId ?? "").trim();
  const itemsRaw = Array.isArray(body.items) ? body.items : null;
  if (!itemsRaw) {
    return { status: 400, ok: false, error: "items[] required", ...WRITE_FALSE };
  }

  const { data: siteRow, error: siteErr } = await auth.client
    .from("sites")
    .select("id,site_slug,status")
    .eq("site_slug", SITE_SLUG)
    .maybeSingle();
  if (siteErr || !siteRow?.id) {
    return {
      status: 503,
      ok: false,
      error: "sites row missing — run Core v2 migration first",
      detail: siteErr?.message ?? null,
      ...WRITE_FALSE,
    };
  }
  if (String(siteRow.status) !== "active") {
    return { status: 403, ok: false, error: "site suspended", ...WRITE_FALSE };
  }
  if (String(siteRow.site_slug ?? "") !== SITE_SLUG) {
    return {
      status: 409,
      ok: false,
      error: "site_slug_mismatch",
      detail: "sites.site_slug does not match expected gosaki-piano",
      ...WRITE_FALSE,
    };
  }

  const canWrite = await assertCanWriteSite(auth.client, String(siteRow.id));
  if (!canWrite.ok) return canWrite.result;

  const { data: rows, error: readErr } = await auth.client
    .from("site_embeds")
    .select(SELECT_COLS)
    .eq("site_id", siteRow.id)
    .eq("provider", PROVIDER)
    .order("sort_order", { ascending: true });
  if (readErr) {
    return {
      status: 500,
      ok: false,
      error: "site_embeds read failed",
      detail: readErr.message,
      ...WRITE_FALSE,
    };
  }

  const embedSlugMismatch = (rows ?? []).some(
    (r) => String((r as Record<string, unknown>).site_slug ?? "") !== SITE_SLUG,
  );
  if (embedSlugMismatch) {
    return {
      status: 409,
      ok: false,
      error: "site_slug_mismatch",
      detail: "site_embeds.site_slug does not match sites.site_slug / expected slug",
      ...WRITE_FALSE,
    };
  }

  const before = (rows ?? []).map((r) => rowToDraft(r as Record<string, unknown>));
  const after = itemsRaw.map((raw) => {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      id: String(item.id ?? "").trim(),
      published: item.published === true,
      sortOrder: Number(item.sortOrder ?? item.sort_order ?? 0) || 0,
      embedCode: String(item.embedCode ?? item.source_url ?? "").trim(),
    };
  });

  const errors: string[] = [];
  const warnings: string[] = [];
  const ids = new Set<string>();
  for (const item of after) {
    if (!item.id) errors.push("each item requires id");
    else if (ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
    ids.add(item.id);
    if (!parseYoutubeVideoId(item.embedCode)) {
      errors.push(`${item.id}: invalid YouTube URL / embed / videoId`);
    }
  }
  const beforeMap = new Map(before.map((b) => [b.id, b]));
  const changedItemIds: string[] = [];
  for (const item of after) {
    const prev = beforeMap.get(item.id);
    if (
      !prev ||
      prev.embedCode !== item.embedCode ||
      prev.published !== item.published ||
      prev.sortOrder !== item.sortOrder
    ) {
      changedItemIds.push(item.id);
    }
  }
  for (const prev of before) {
    if (!after.some((a) => a.id === prev.id)) {
      changedItemIds.push(prev.id);
      warnings.push(`delete not supported — set published=false for ${prev.id}`);
    }
  }

  const expectedBeforeUpdatedAtById: Record<string, string> = {};
  for (const b of before) {
    if (b.id && b.updatedAt) expectedBeforeUpdatedAtById[b.id] = b.updatedAt;
  }
  const fp = fingerprint(before);
  const noChange = changedItemIds.length === 0;
  const currentItems = before.map((b) => ({
    id: b.id,
    published: b.published,
    sortOrder: b.sortOrder,
    embedCode: b.embedCode,
  }));

  if (errors.length) {
    return {
      status: 400,
      ok: false,
      error: errors[0],
      errors,
      warnings,
      currentItems,
      beforeItems: currentItems,
      fingerprint: fp,
      expectedBeforeUpdatedAtById,
      ...WRITE_FALSE,
    };
  }

  if (operation === DRY_RUN_OPERATION || body.dryRun === true) {
    if (!approvalId || approvalId !== DRY_RUN_APPROVAL_ID) {
      return {
        status: 403,
        ok: false,
        error: "wrong_approval_id",
        detail: "dry-run requires exact approvalId",
        expectedApprovalId: DRY_RUN_APPROVAL_ID,
        ...WRITE_FALSE,
      };
    }
    return {
      status: 200,
      ok: true,
      operation: DRY_RUN_OPERATION,
      approvalId: DRY_RUN_APPROVAL_ID,
      siteSlug: SITE_SLUG,
      noChange,
      changedItemIds,
      warnings,
      currentItems,
      beforeItems: currentItems,
      afterItems: after,
      fingerprint: fp,
      expectedBeforeUpdatedAtById,
      ...WRITE_FALSE,
      saveEnabled: false,
    };
  }

  if (operation !== SAVE_OPERATION) {
    return { status: 400, ok: false, error: "unknown_operation", ...WRITE_FALSE };
  }

  if (approvalId !== SAVE_APPROVAL_ID) {
    return {
      status: 403,
      ok: false,
      error: "wrong_approval_id",
      expectedApprovalId: SAVE_APPROVAL_ID,
      ...WRITE_FALSE,
    };
  }

  if (!isYoutubeSupabaseSaveArmed(input.getEnv)) {
    return {
      status: 403,
      ok: false,
      error: "save_not_armed",
      detail: `${SAVE_ARMED_ENV} must be exact true`,
      ...WRITE_FALSE,
      saveEnabled: false,
    };
  }

  const clientFp = String(body.fingerprint ?? "").trim();
  if (!clientFp || clientFp !== fp) {
    return {
      status: 409,
      ok: false,
      error: "optimistic_lock_failed",
      detail: "fingerprint mismatch — reload and dry-run again",
      ...WRITE_FALSE,
    };
  }

  const lockMap = (body.expectedBeforeUpdatedAtById &&
  typeof body.expectedBeforeUpdatedAtById === "object"
    ? body.expectedBeforeUpdatedAtById
    : {}) as Record<string, unknown>;

  for (const id of changedItemIds) {
    const prev = beforeMap.get(id);
    if (!prev?.rowId) continue; // insert path
    const expected = String(lockMap[id] ?? "").trim();
    if (!expected || expected !== String(prev.updatedAt ?? "")) {
      return {
        status: 409,
        ok: false,
        error: "optimistic_lock_failed",
        detail: `expectedBeforeUpdatedAt mismatch for ${id}`,
        ...WRITE_FALSE,
      };
    }
  }

  if (noChange) {
    return {
      status: 200,
      ok: true,
      operation: SAVE_OPERATION,
      noChange: true,
      rowsAffected: 0,
      currentItems,
      fingerprint: fp,
      expectedBeforeUpdatedAtById,
      ...WRITE_FALSE,
      didWrite: false,
    };
  }

  let rowsAffected = 0;
  for (const item of after) {
    if (!changedItemIds.includes(item.id)) continue;
    const videoId = parseYoutubeVideoId(item.embedCode);
    if (!videoId) {
      return { status: 400, ok: false, error: `invalid video for ${item.id}`, ...WRITE_FALSE };
    }
    const embedUrl = buildYoutubeNocookieEmbedUrl(videoId);
    const prev = beforeMap.get(item.id);
    if (prev?.rowId) {
      const { data: updated, error: updErr } = await auth.client
        .from("site_embeds")
        .update({
          source_url: item.embedCode,
          embed_url: embedUrl,
          published: item.published,
          sort_order: item.sortOrder,
          // site_slug / updated_by / updated_at: not client-updatable (column GRANTs + triggers)
        })
        .eq("id", prev.rowId)
        .eq("site_id", siteRow.id)
        .eq("updated_at", prev.updatedAt)
        .select("id");
      if (updErr) {
        return {
          status: 500,
          ok: false,
          error: "update_failed",
          detail: updErr.message,
          ...WRITE_FALSE,
        };
      }
      if (!updated || updated.length !== 1) {
        return {
          status: 409,
          ok: false,
          error: "optimistic_lock_failed",
          detail: `zero/multi row update for ${item.id}`,
          ...WRITE_FALSE,
        };
      }
      rowsAffected += 1;
    } else {
      const { data: inserted, error: insErr } = await auth.client
        .from("site_embeds")
        .insert({
          site_id: siteRow.id,
          site_slug: SITE_SLUG,
          provider: PROVIDER,
          legacy_item_id: item.id,
          source_url: item.embedCode,
          embed_url: embedUrl,
          published: item.published,
          sort_order: item.sortOrder,
          // created_by / updated_by: set by tg_site_embeds_set_audit_actors from auth.uid()
        })
        .select("id");
      if (insErr || !inserted?.length) {
        return {
          status: 500,
          ok: false,
          error: "insert_failed",
          detail: insErr?.message ?? "no row",
          ...WRITE_FALSE,
        };
      }
      rowsAffected += 1;
    }
  }

  const { data: afterRows } = await auth.client
    .from("site_embeds")
    .select(SELECT_COLS)
    .eq("site_id", siteRow.id)
    .eq("provider", PROVIDER)
    .order("sort_order", { ascending: true });
  const afterDraft = (afterRows ?? []).map((r) => rowToDraft(r as Record<string, unknown>));

  return {
    status: 200,
    ok: true,
    operation: SAVE_OPERATION,
    approvalId: SAVE_APPROVAL_ID,
    siteSlug: SITE_SLUG,
    rowsAffected,
    changedItemIds,
    currentItems: afterDraft.map((b) => ({
      id: b.id,
      published: b.published,
      sortOrder: b.sortOrder,
      embedCode: b.embedCode,
    })),
    fingerprint: fingerprint(afterDraft),
    expectedBeforeUpdatedAtById: Object.fromEntries(
      afterDraft.filter((b) => b.id && b.updatedAt).map((b) => [b.id, b.updatedAt as string]),
    ),
    didWrite: true,
    dbWrite: true,
    networkWrite: false,
    writeBackend: "supabase",
    saveEnabled: true,
  };
}
