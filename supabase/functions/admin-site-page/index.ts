import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { requireAdminUser, corsHeaders, jsonResponse } from "../_shared/admin-auth.ts";
import {
  backupCurrentSitePage,
  fetchSitePageBySlug,
  pruneSitePageRevisions,
  SITE_PAGE_REVISION_SELECT,
  type SitePageRecord,
  type SitePageRevisionRecord,
  upsertSitePage,
} from "../_shared/site-pages-logic.ts";
import { createServiceClient } from "../_shared/supabase-service.ts";

const MAX_HTML_LENGTH = 1_000_000;

type ActionBody = {
  action?: string;
  slug?: string;
  page_slug?: string;
  title?: string;
  html_content?: string;
  id?: string | number;
};

function parseBody(raw: unknown): ActionBody {
  if (!raw || typeof raw !== "object") return {};
  return raw as ActionBody;
}

function validateSlug(slug: unknown): string | Response {
  if (typeof slug !== "string" || !slug.trim()) {
    return jsonResponse({ error: "slug is required" }, 400);
  }
  return slug.trim();
}

function validateHtmlContent(html_content: unknown): string | Response {
  if (typeof html_content !== "string") {
    return jsonResponse({ error: "html_content is required" }, 400);
  }
  const trimmed = html_content.trim();
  if (!trimmed) {
    return jsonResponse({ error: "html_content is required" }, 400);
  }
  if (trimmed.length > MAX_HTML_LENGTH) {
    return jsonResponse({ error: "html_content is too long" }, 400);
  }
  return html_content;
}

function validateTitle(title: unknown): string | Response {
  if (typeof title !== "string" || !title.trim()) {
    return jsonResponse({ error: "title is required" }, 400);
  }
  return title.trim();
}

function parseRevisionId(id: unknown): number | Response {
  if (id == null || id === "") {
    return jsonResponse({ error: "id is required" }, 400);
  }
  const numeric = typeof id === "number" ? id : Number.parseInt(String(id), 10);
  if (!Number.isFinite(numeric)) {
    return jsonResponse({ error: "Invalid id" }, 400);
  }
  return numeric;
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

  if (action === "get_page") {
    const slug = validateSlug(body.slug);
    if (slug instanceof Response) return slug;

    const { data, error } = await fetchSitePageBySlug(service, slug);
    if (error) return jsonResponse({ error }, 500);

    return jsonResponse({ ok: true, data }, 200);
  }

  if (action === "save_page") {
    const slug = validateSlug(body.slug);
    if (slug instanceof Response) return slug;
    const title = validateTitle(body.title);
    if (title instanceof Response) return title;
    const htmlResult = validateHtmlContent(body.html_content);
    if (htmlResult instanceof Response) return htmlResult;

    const backupError = await backupCurrentSitePage(service, slug);
    if (backupError.error) return jsonResponse({ error: backupError.error }, 500);

    const { data, error } = await upsertSitePage(service, slug, title, htmlResult);
    if (error) return jsonResponse({ error }, 500);

    return jsonResponse({ ok: true, data }, 200);
  }

  if (action === "list_revisions") {
    const pageSlug = validateSlug(body.page_slug ?? body.slug);
    if (pageSlug instanceof Response) return pageSlug;

    const { data, error } = await service
      .from("site_page_revisions")
      .select(SITE_PAGE_REVISION_SELECT)
      .eq("page_slug", pageSlug)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ ok: true, data: (data ?? []) as SitePageRevisionRecord[] }, 200);
  }

  if (action === "get_revision") {
    const id = parseRevisionId(body.id);
    if (id instanceof Response) return id;

    const { data, error } = await service
      .from("site_page_revisions")
      .select(SITE_PAGE_REVISION_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) return jsonResponse({ error: error.message }, 500);
    if (!data) return jsonResponse({ error: "Revision not found" }, 404);

    return jsonResponse({ ok: true, data: data as SitePageRevisionRecord }, 200);
  }

  if (action === "restore_revision") {
    const id = parseRevisionId(body.id);
    if (id instanceof Response) return id;
    const title = validateTitle(body.title);
    if (title instanceof Response) return title;

    const { data: revision, error: revisionError } = await service
      .from("site_page_revisions")
      .select(SITE_PAGE_REVISION_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (revisionError) return jsonResponse({ error: revisionError.message }, 500);
    if (!revision) return jsonResponse({ error: "Revision not found" }, 404);

    const record = revision as SitePageRevisionRecord;
    const pageSlug = record.page_slug;

    const backupError = await backupCurrentSitePage(service, pageSlug);
    if (backupError.error) return jsonResponse({ error: backupError.error }, 500);

    const { data, error } = await upsertSitePage(
      service,
      pageSlug,
      title,
      record.html_content
    );
    if (error) return jsonResponse({ error }, 500);

    return jsonResponse({ ok: true, data: data as SitePageRecord }, 200);
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
