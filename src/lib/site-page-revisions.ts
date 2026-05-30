import { supabase } from "./supabase";

export const SITE_PAGE_REVISION_KEEP_COUNT = 50;

export const SITE_PAGE_REVISION_SELECT = "id, page_slug, html_content, created_at";

export type SitePageRevisionRecord = {
  id: number;
  page_slug: string;
  html_content: string;
  created_at: string;
};

export async function fetchSitePageRevisions(pageSlug: string, limit = SITE_PAGE_REVISION_KEEP_COUNT) {
  const { data, error } = await supabase
    .from("site_page_revisions")
    .select(SITE_PAGE_REVISION_SELECT)
    .eq("page_slug", pageSlug)
    .order("created_at", { ascending: false })
    .limit(limit);

  return {
    data: (data ?? []) as SitePageRevisionRecord[],
    error,
  };
}

export async function fetchSitePageRevisionById(id: number) {
  const { data, error } = await supabase
    .from("site_page_revisions")
    .select(SITE_PAGE_REVISION_SELECT)
    .eq("id", id)
    .maybeSingle();

  return {
    data: data as SitePageRevisionRecord | null,
    error,
  };
}

export async function createSitePageRevision(pageSlug: string, htmlContent: string) {
  return supabase.from("site_page_revisions").insert({
    page_slug: pageSlug,
    html_content: htmlContent,
  });
}

export async function pruneSitePageRevisions(
  pageSlug: string,
  keepCount = SITE_PAGE_REVISION_KEEP_COUNT
) {
  const { data, error } = await supabase
    .from("site_page_revisions")
    .select("id")
    .eq("page_slug", pageSlug)
    .order("created_at", { ascending: false });

  if (error) return { error };
  if (!data || data.length <= keepCount) return { error: null };

  const staleIds = data.slice(keepCount).map((row) => row.id);
  const { error: deleteError } = await supabase
    .from("site_page_revisions")
    .delete()
    .in("id", staleIds);

  return { error: deleteError };
}
