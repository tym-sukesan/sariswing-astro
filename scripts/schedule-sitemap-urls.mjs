import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

/**
 * 公開済み schedules から月別 LIVE SCHEDULE の sitemap 用 URL を生成する。
 * astro.config.mjs の @astrojs/sitemap customPages 向け。
 */
export async function getScheduleSitemapUrls(siteOrigin) {
  const env = loadEnv(process.env.MODE ?? "production", process.cwd(), "");
  const supabaseUrl = env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[sitemap] PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY が未設定のため、月別スケジュール URL をスキップします"
    );
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("schedules")
    .select("date")
    .eq("is_published", true);

  if (error) {
    console.warn("[sitemap] schedules の取得に失敗:", error.message);
    return [];
  }

  const months = new Set();
  for (const item of data ?? []) {
    const month = item.date?.slice(0, 7);
    if (month) months.add(month);
  }

  return [...months]
    .sort((a, b) => b.localeCompare(a))
    .map((month) => new URL(`/live-schedule/${month}/`, siteOrigin).href);
}
