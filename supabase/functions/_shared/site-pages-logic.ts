import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export const SITE_PAGE_REVISION_KEEP_COUNT = 50;
export const SITE_PAGE_SELECT = "id, slug, title, html_content, updated_at, created_at";
export const SITE_PAGE_REVISION_SELECT = "id, page_slug, html_content, created_at";

export type SitePageRecord = {
  id: number;
  slug: string;
  title: string;
  html_content: string;
  updated_at: string;
  created_at: string;
};

export type SitePageRevisionRecord = {
  id: number;
  page_slug: string;
  html_content: string;
  created_at: string;
};

export async function fetchSitePageBySlug(
  service: SupabaseClient,
  slug: string
): Promise<{ data: SitePageRecord | null; error: string | null }> {
  const { data, error } = await service
    .from("site_pages")
    .select(SITE_PAGE_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data: data as SitePageRecord | null, error: null };
}

export async function createSitePageRevision(
  service: SupabaseClient,
  pageSlug: string,
  htmlContent: string
): Promise<{ error: string | null }> {
  const { error } = await service.from("site_page_revisions").insert({
    page_slug: pageSlug,
    html_content: htmlContent,
  });

  return { error: error?.message ?? null };
}

export async function pruneSitePageRevisions(
  service: SupabaseClient,
  pageSlug: string,
  keepCount = SITE_PAGE_REVISION_KEEP_COUNT
): Promise<{ error: string | null }> {
  const { data, error } = await service
    .from("site_page_revisions")
    .select("id")
    .eq("page_slug", pageSlug)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message };
  if (!data || data.length <= keepCount) return { error: null };

  const staleIds = data.slice(keepCount).map((row) => row.id);
  const { error: deleteError } = await service
    .from("site_page_revisions")
    .delete()
    .in("id", staleIds);

  return { error: deleteError?.message ?? null };
}

/** 保存・復元前: 現在の html_content があれば revision に保存して prune */
export async function backupCurrentSitePage(
  service: SupabaseClient,
  pageSlug: string
): Promise<{ error: string | null }> {
  const { data: current, error: fetchError } = await fetchSitePageBySlug(service, pageSlug);

  if (fetchError) return { error: `現在の内容の取得に失敗しました: ${fetchError}` };

  const html = current?.html_content?.trim();
  if (!html) return { error: null };

  const { error: insertError } = await createSitePageRevision(service, pageSlug, current!.html_content);
  if (insertError) {
    return { error: `バックアップの保存に失敗しました: ${insertError}` };
  }

  const { error: pruneError } = await pruneSitePageRevisions(service, pageSlug);
  if (pruneError) {
    return { error: `古いバックアップの削除に失敗しました: ${pruneError}` };
  }

  return { error: null };
}

export async function upsertSitePage(
  service: SupabaseClient,
  slug: string,
  title: string,
  html_content: string
): Promise<{ data: SitePageRecord | null; error: string | null }> {
  const now = new Date().toISOString();
  const { data, error } = await service
    .from("site_pages")
    .upsert(
      {
        slug,
        title,
        html_content,
        updated_at: now,
      },
      { onConflict: "slug" }
    )
    .select(SITE_PAGE_SELECT)
    .single();

  if (error) return { data: null, error: error.message };
  return { data: data as SitePageRecord, error: null };
}
