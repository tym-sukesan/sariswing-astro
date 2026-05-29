import { createClient } from "@supabase/supabase-js";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "vite";

/** @typedef {{ updated_at?: string | null; created_at?: string | null; date?: string | null; published_at?: string | null }} TimestampedRecord */

export const SITEMAP_STATIC_PATHS = [
  "/",
  "/about/",
  "/live-schedule/",
  "/news/",
  "/discography/",
  "/contact/",
];

export function getSitemapGeneratedDate(reference = new Date()) {
  return reference.toISOString().slice(0, 10);
}

export function normalizeSitemapDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function clampLastmod(candidate, generatedAt) {
  if (!candidate) return generatedAt;
  return candidate > generatedAt ? generatedAt : candidate;
}

export function resolveLastmod(record, generatedAt, optionalFallback) {
  const candidate =
    normalizeSitemapDate(record.updated_at) ??
    normalizeSitemapDate(record.created_at) ??
    normalizeSitemapDate(optionalFallback) ??
    generatedAt;

  return clampLastmod(candidate, generatedAt);
}

export function resolveNewsLastmod(record, generatedAt) {
  const candidate =
    normalizeSitemapDate(record.published_at) ??
    normalizeSitemapDate(record.updated_at) ??
    normalizeSitemapDate(record.created_at) ??
    normalizeSitemapDate(record.date) ??
    generatedAt;

  return clampLastmod(candidate, generatedAt);
}

function stripHtml(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isNewsDetailPageCandidate(item) {
  const slug = item.slug?.trim();
  if (!item.is_published || !slug) return false;

  const url = item.url?.trim();
  if (url) return false;

  const content = item.content?.trim();
  if (!content) return false;

  return stripHtml(content).length > 0;
}

export function formatMonthFromDate(value) {
  const normalized = normalizeSitemapDate(value);
  return normalized ? normalized.slice(0, 7) : null;
}

function getDiscographyLastmods(generatedAt) {
  /** @type {Map<string, string>} */
  const map = new Map();
  const baseDir = join(process.cwd(), "src/pages/discography");

  for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const pageFile = join(baseDir, entry.name, "index.astro");
    let lastmod = generatedAt;

    try {
      const mtime = statSync(pageFile).mtime;
      lastmod = normalizeSitemapDate(mtime) ?? generatedAt;
    } catch {
      // ファイルが無い場合はビルド日
    }

    map.set(`/discography/${entry.name}/`, lastmod);
  }

  try {
    const indexMtime = statSync(join(baseDir, "index.astro")).mtime;
    map.set("/discography/", normalizeSitemapDate(indexMtime) ?? generatedAt);
  } catch {
    map.set("/discography/", generatedAt);
  }

  return map;
}

async function fetchSupabaseRows() {
  const env = loadEnv(process.env.MODE ?? "production", process.cwd(), "");
  const supabaseUrl = env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "[sitemap] PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY が未設定のため、NEWS / Schedule の lastmod をビルド日にします"
    );
    return { newsItems: [], scheduleItems: [] };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [newsResult, scheduleResult] = await Promise.all([
    supabase.from("news").select("*").eq("is_published", true),
    supabase.from("schedules").select("*").eq("is_published", true),
  ]);

  if (newsResult.error) {
    console.warn("[sitemap] news の取得に失敗:", newsResult.error.message);
  }
  if (scheduleResult.error) {
    console.warn("[sitemap] schedules の取得に失敗:", scheduleResult.error.message);
  }

  return {
    newsItems: newsResult.data ?? [],
    scheduleItems: scheduleResult.data ?? [],
  };
}

/**
 * pathname（末尾スラッシュ付き）→ lastmod (YYYY-MM-DD)
 * @param {{ generatedAt?: string }} options
 * @returns {Promise<Map<string, string>>}
 */
export async function getSitemapLastmodLookup(options = {}) {
  const generatedAt = options.generatedAt ?? getSitemapGeneratedDate();
  /** @type {Map<string, string>} */
  const lookup = new Map();

  for (const path of SITEMAP_STATIC_PATHS) {
    lookup.set(path, generatedAt);
  }

  for (const [path, lastmod] of getDiscographyLastmods(generatedAt)) {
    lookup.set(path, lastmod);
  }

  const { newsItems, scheduleItems } = await fetchSupabaseRows();

  const monthLastmodMap = new Map();
  for (const item of scheduleItems) {
    const month = formatMonthFromDate(item.date);
    if (!month) continue;

    const itemLastmod = resolveLastmod(item, generatedAt);
    const prev = monthLastmodMap.get(month);
    if (!prev || itemLastmod > prev) {
      monthLastmodMap.set(month, itemLastmod);
    }
  }

  for (const [month, lastmod] of monthLastmodMap) {
    lookup.set(`/live-schedule/${month}/`, lastmod);
  }

  for (const item of newsItems) {
    if (!isNewsDetailPageCandidate(item)) continue;
    const slug = item.slug?.trim();
    if (!slug) continue;
    lookup.set(`/news/${slug}/`, resolveNewsLastmod(item, generatedAt));
  }

  return lookup;
}

/** @param {string} href */
export function pathnameFromSitemapUrl(href) {
  const pathname = new URL(href).pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}
