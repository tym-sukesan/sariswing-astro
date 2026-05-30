import { supabase } from "./supabase";

export const SITE_PAGE_SELECT = "id, slug, title, html_content, updated_at, created_at";

export type SitePageRecord = {
  id: number;
  slug: string;
  title: string;
  html_content: string;
  updated_at: string;
  created_at: string;
};

export async function fetchSitePageBySlug(slug: string) {
  const { data, error } = await supabase
    .from("site_pages")
    .select(SITE_PAGE_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  return {
    data: data as SitePageRecord | null,
    error,
  };
}

export function resolveSitePageHtml(
  record: SitePageRecord | null | undefined,
  fallbackHtml: string
) {
  const html = record?.html_content?.trim();
  return html || fallbackHtml;
}
