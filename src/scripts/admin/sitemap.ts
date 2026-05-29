import {
  buildSitemapEntries,
  buildSitemapXml,
  type SitemapEntry,
} from "../../lib/sitemap-build";
import { type NewsRecord } from "../../lib/news";
import { supabase } from "../../lib/supabase";

export async function fetchPublishedNewsForSitemap(): Promise<NewsRecord[]> {
  const { data, error } = await supabase.from("news").select("*").eq("is_published", true);

  if (error) throw error;
  return (data ?? []) as NewsRecord[];
}

export async function fetchPublishedSchedulesForSitemap() {
  const { data, error } = await supabase.from("schedules").select("*").eq("is_published", true);

  if (error) throw error;
  return data ?? [];
}

export async function generateSitemapDocument(): Promise<{
  xml: string;
  entries: SitemapEntry[];
}> {
  const [newsItems, scheduleItems] = await Promise.all([
    fetchPublishedNewsForSitemap(),
    fetchPublishedSchedulesForSitemap(),
  ]);

  const entries = buildSitemapEntries({ newsItems, scheduleItems });
  const xml = buildSitemapXml(entries);

  return { xml, entries };
}
