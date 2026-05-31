import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdminUser, corsHeaders, jsonResponse } from "../_shared/admin-auth.ts";
import {
  generateSlug,
  NEWS_SELECT,
  parseRowId,
  type NewsRecord,
  type NewsWritePayload,
} from "../_shared/news.ts";
import { createServiceClient } from "../_shared/supabase-service.ts";

const MAX_TITLE_LENGTH = 500;
const MAX_SLUG_LENGTH = 200;
const MAX_URL_LENGTH = 2000;
const MAX_EXCERPT_LENGTH = 2000;
const MAX_CONTENT_LENGTH = 500_000;
const MAX_IMAGE_URL_LENGTH = 2000;
const MAX_CATEGORY_LENGTH = 200;

type ActionBody = {
  action?: string;
  id?: string | number;
  record?: NewsWritePayload;
};

function parseBody(raw: unknown): ActionBody {
  if (!raw || typeof raw !== "object") return {};
  return raw as ActionBody;
}

function validateId(id: unknown): string | Response {
  if (id == null || id === "") {
    return jsonResponse({ error: "id is required" }, 400);
  }
  return String(id);
}

function normalizeOptionalString(value: unknown, maxLen: number): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLen) return null;
  return trimmed;
}

function validateNewsRecord(record: unknown): NewsWritePayload | Response {
  if (!record || typeof record !== "object") {
    return jsonResponse({ error: "record is required" }, 400);
  }

  const r = record as NewsWritePayload;
  const date = typeof r.date === "string" ? r.date.trim() : "";
  const title = typeof r.title === "string" ? r.title.trim() : "";

  if (!date) return jsonResponse({ error: "date is required" }, 400);
  if (!title) return jsonResponse({ error: "title is required" }, 400);
  if (title.length > MAX_TITLE_LENGTH) {
    return jsonResponse({ error: "title is too long" }, 400);
  }

  const url = normalizeOptionalString(r.url, MAX_URL_LENGTH);
  const slugInput = normalizeOptionalString(r.slug, MAX_SLUG_LENGTH);
  const slug = url ? slugInput : generateSlug(title, date, slugInput);
  const excerpt = normalizeOptionalString(r.excerpt, MAX_EXCERPT_LENGTH);
  const content = normalizeOptionalString(r.content, MAX_CONTENT_LENGTH);
  const image_url = normalizeOptionalString(r.image_url, MAX_IMAGE_URL_LENGTH);
  const category = normalizeOptionalString(r.category, MAX_CATEGORY_LENGTH);
  const is_published = Boolean(r.is_published);

  return { date, title, url, slug, excerpt, content, image_url, category, is_published };
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
    const { data, error } = await service
      .from("news")
      .select(NEWS_SELECT)
      .order("date", { ascending: false });

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, data: (data ?? []) as NewsRecord[] }, 200);
  }

  if (action === "create") {
    const payload = validateNewsRecord(body.record);
    if (payload instanceof Response) return payload;

    const { data, error } = await service.from("news").insert([payload]).select(NEWS_SELECT).single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, data: data as NewsRecord }, 200);
  }

  if (action === "update") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;
    const payload = validateNewsRecord(body.record);
    if (payload instanceof Response) return payload;

    const { data, error } = await service
      .from("news")
      .update(payload)
      .eq("id", parseRowId(id))
      .select(NEWS_SELECT);

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!data?.length) {
      return jsonResponse({ error: `No row updated for id: ${id}` }, 404);
    }
    return jsonResponse({ ok: true, data: data[0] as NewsRecord }, 200);
  }

  if (action === "duplicate") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;

    const { data: row, error: fetchError } = await service
      .from("news")
      .select(NEWS_SELECT)
      .eq("id", parseRowId(id))
      .maybeSingle();

    if (fetchError) return jsonResponse({ error: fetchError.message }, 500);
    if (!row) return jsonResponse({ error: "News not found" }, 404);

    const source = row as NewsRecord;
    const duplicatePayload: NewsWritePayload = {
      date: source.date,
      title: `${source.title}（複製）`,
      url: source.url ?? null,
      slug: source.slug
        ? `${source.slug}-copy-${Date.now()}`
        : generateSlug(source.title, source.date, null),
      excerpt: source.excerpt ?? null,
      content: source.content ?? null,
      image_url: source.image_url ?? null,
      category: source.category ?? null,
      is_published: false,
    };

    const { data, error } = await service
      .from("news")
      .insert([duplicatePayload])
      .select(NEWS_SELECT)
      .single();

    if (error) return jsonResponse({ error: error.message }, 500);
    return jsonResponse({ ok: true, data: data as NewsRecord }, 200);
  }

  if (action === "delete") {
    const id = validateId(body.id);
    if (id instanceof Response) return id;

    const { data, error } = await service
      .from("news")
      .delete()
      .eq("id", parseRowId(id))
      .select("id");

    if (error) return jsonResponse({ error: error.message }, 500);

    const count = data?.length ?? 0;
    return jsonResponse({ ok: true, count }, 200);
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
