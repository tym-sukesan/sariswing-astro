import { supabase } from "./supabase";

export const NEWS_COLUMNS = [
  "id",
  "date",
  "title",
  "slug",
  "url",
  "excerpt",
  "content",
  "image_url",
  "category",
  "is_published",
] as const;

export const NEWS_SELECT = NEWS_COLUMNS.join(", ");

export type NewsRecord = {
  id: string | number;
  date: string;
  title: string;
  slug?: string | null;
  url?: string | null;
  excerpt?: string | null;
  content?: string | null;
  image_url?: string | null;
  category?: string | null;
  is_published: boolean;
  deleted_at?: string | null;
};

export async function fetchPublishedNews() {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_SELECT)
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  return {
    data: (data ?? []) as NewsRecord[],
    error,
  };
}

export async function fetchPublishedNewsDetailPages() {
  const { data, error } = await fetchPublishedNews();

  return {
    data: data.filter(isNewsDetailPageCandidate),
    error,
  };
}

export async function fetchAllNews() {
  const { data, error } = await supabase
    .from("news")
    .select(NEWS_SELECT)
    .is("deleted_at", null)
    .order("date", { ascending: false });

  return {
    data: (data ?? []) as NewsRecord[],
    error,
  };
}

export function detectMissingNewsColumns(error: { message?: string } | null) {
  if (!error?.message) return [];

  const message = error.message.toLowerCase();
  if (!message.includes("column") && !message.includes("schema cache")) {
    return [];
  }

  return NEWS_COLUMNS.filter((column) => column !== "id" && message.includes(column));
}

export function getNewsUrlValue(item: NewsRecord) {
  const url = item.url?.trim();
  return url || null;
}

export function hasNewsUrl(item: NewsRecord) {
  return Boolean(getNewsUrlValue(item));
}

export function hasNewsContent(item: NewsRecord) {
  const content = item.content?.trim();
  if (!content) return false;

  return stripHtml(content).length > 0;
}

export function isExternalNewsUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

export function isNewsDetailPageCandidate(item: NewsRecord) {
  const slug = item.slug?.trim();
  return Boolean(item.is_published && slug && !hasNewsUrl(item) && hasNewsContent(item));
}

export type NewsListLink = {
  href: string;
  external: boolean;
};

export function getNewsListLink(item: NewsRecord): NewsListLink | null {
  const directUrl = getNewsUrlValue(item);
  if (directUrl) {
    return {
      href: directUrl,
      external: isExternalNewsUrl(directUrl),
    };
  }

  const slug = item.slug?.trim();
  if (slug && hasNewsContent(item)) {
    return {
      href: getNewsDetailUrl({ slug }),
      external: false,
    };
  }

  return null;
}

export function formatNewsDate(date: string) {
  const normalized = date.includes(".") ? date.replace(/\./g, "-") : date;
  const parts = normalized.split("-").map((part) => part.trim());

  if (parts.length < 3) return date;

  const [year, month, day] = parts;
  return `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}`;
}

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getNewsExcerpt(item: NewsRecord, maxLength = 100) {
  if (item.excerpt) return item.excerpt;

  if (!item.content) return "";

  const plain = stripHtml(item.content);
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength)}…`;
}

export function getNewsDescription(item: NewsRecord) {
  return getNewsExcerpt(item, 140);
}

export function getNewsDetailUrl(item: Pick<NewsRecord, "slug">) {
  return `/news/${item.slug}/`;
}

/** @deprecated Use getNewsDetailUrl or getNewsListLink */
export function getNewsUrl(item: Pick<NewsRecord, "slug">) {
  return getNewsDetailUrl(item);
}

export function getAdjacentNews(entries: NewsRecord[], currentSlug: string) {
  const detailEntries = entries.filter(isNewsDetailPageCandidate);
  const index = detailEntries.findIndex((entry) => entry.slug === currentSlug);
  if (index === -1) return { prev: null, next: null };

  return {
    prev: index < detailEntries.length - 1 ? detailEntries[index + 1] : null,
    next: index > 0 ? detailEntries[index - 1] : null,
  };
}

export function resolveAbsoluteUrl(pathOrUrl: string, site: URL | string) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return new URL(pathOrUrl, site).href;
}

export function slugifyTitle(title: string) {
  const ascii = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return ascii || null;
}
