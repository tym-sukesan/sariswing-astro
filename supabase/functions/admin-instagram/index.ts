import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdminUser, corsHeaders, jsonResponse } from "../_shared/admin-auth.ts";
import {
  nextSortOrderForNewPost,
  sortInstagramPosts,
  type InstagramPostRecord,
} from "../_shared/instagram-posts.ts";
import { createServiceClient } from "../_shared/supabase-service.ts";

const MAX_EMBED_CODE_LENGTH = 32_000;
const MAX_SORT_UPDATES = 500;

type ActionBody = {
  action?: string;
  embed_code?: string;
  id?: string | number;
  updates?: { id: string | number; sort_order: number }[];
};

function parseBody(raw: unknown): ActionBody {
  if (!raw || typeof raw !== "object") return {};
  return raw as ActionBody;
}

function validateEmbedCode(embed_code: unknown): string | Response {
  if (typeof embed_code !== "string") {
    return jsonResponse({ error: "embed_code is required" }, 400);
  }
  const trimmed = embed_code.trim();
  if (!trimmed) {
    return jsonResponse({ error: "embed_code is required" }, 400);
  }
  if (trimmed.length > MAX_EMBED_CODE_LENGTH) {
    return jsonResponse({ error: "embed_code is too long" }, 400);
  }
  return trimmed;
}

function validateId(id: unknown): string | Response {
  if (id == null || id === "") {
    return jsonResponse({ error: "id is required" }, 400);
  }
  return String(id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const adminResult = await requireAdminUser(req);
  if (adminResult instanceof Response) return adminResult;

  const service = createServiceClient();
  if (!service) {
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  let body: ActionBody;
  try {
    body = parseBody(await req.json());
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const action = body.action;

  if (action === "list") {
    const { data, error } = await service.from("instagram_posts").select("*");
    if (error) return jsonResponse({ error: error.message }, 500);
    const sorted = sortInstagramPosts((data ?? []) as InstagramPostRecord[]);
    return jsonResponse({ ok: true, data: sorted }, 200);
  }

  if (action === "create") {
    const embedResult = validateEmbedCode(body.embed_code);
    if (embedResult instanceof Response) return embedResult;

    const { data: existing, error: fetchError } = await service
      .from("instagram_posts")
      .select("sort_order");
    if (fetchError) return jsonResponse({ error: fetchError.message }, 500);

    const sort_order = nextSortOrderForNewPost(existing ?? []);

    const { data, error } = await service
      .from("instagram_posts")
      .insert([{ embed_code: embedResult, sort_order }])
      .select("id, sort_order")
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, sort_order, data }, 200);
  }

  if (action === "update_embed") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;
    const embedResult = validateEmbedCode(body.embed_code);
    if (embedResult instanceof Response) return embedResult;

    const { error } = await service
      .from("instagram_posts")
      .update({ embed_code: embedResult })
      .eq("id", id);

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true }, 200);
  }

  if (action === "update_sort_orders") {
    const updates = body.updates;
    if (!Array.isArray(updates) || updates.length === 0) {
      return jsonResponse({ error: "updates is required" }, 400);
    }
    if (updates.length > MAX_SORT_UPDATES) {
      return jsonResponse({ error: "Too many updates" }, 400);
    }

    for (const item of updates) {
      const id = validateId(item?.id);
      if (id instanceof Response) return id;
      const sort_order = item?.sort_order;
      if (typeof sort_order !== "number" || !Number.isFinite(sort_order)) {
        return jsonResponse({ error: "Invalid sort_order" }, 400);
      }

      const { error } = await service
        .from("instagram_posts")
        .update({ sort_order })
        .eq("id", id);

      if (error) return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  }

  if (action === "delete") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;

    const { data, error } = await service
      .from("instagram_posts")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) return jsonResponse({ error: error.message }, 500);

    const count = data?.length ?? 0;
    return jsonResponse({ ok: true, count }, 200);
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
