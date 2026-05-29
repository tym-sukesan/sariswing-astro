import { isNewsDetailPageCandidate, type NewsRecord } from "./news";

export const SITEMAP_BASE_URL = "https://sariswing.com";

export const SITEMAP_STATIC_PATHS = [
  "/",
  "/about/",
  "/live-schedule/",
  "/news/",
  "/discography/",
  "/contact/",
] as const;

export type SitemapEntry = {
  loc: string;
  lastmod: string;
};

type TimestampedRecord = {
  updated_at?: string | null;
  created_at?: string | null;
  date?: string | null;
};

/** sitemap 生成日（YYYY-MM-DD） */
export function getSitemapGeneratedDate(reference = new Date()) {
  return reference.toISOString().slice(0, 10);
}

export function normalizeSitemapDate(value: unknown): string | null {
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

/** 未来日は生成日に丸める */
export function clampLastmod(candidate: string | null, generatedAt: string): string {
  if (!candidate) return generatedAt;
  return candidate > generatedAt ? generatedAt : candidate;
}

/**
 * lastmod 優先順位: updated_at → created_at → optionalFallback → 生成日
 * （Schedule のライブ開催日 date は fallback に使わない）
 */
export function resolveLastmod(
  record: TimestampedRecord,
  generatedAt: string,
  optionalFallback?: string | null
): string {
  const candidate =
    normalizeSitemapDate(record.updated_at) ??
    normalizeSitemapDate(record.created_at) ??
    normalizeSitemapDate(optionalFallback) ??
    generatedAt;

  return clampLastmod(candidate, generatedAt);
}

export function formatMonthFromDate(value: unknown): string | null {
  const normalized = normalizeSitemapDate(value);
  return normalized ? normalized.slice(0, 7) : null;
}

export function escapeXml(value: string) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildSitemapXml(entries: SitemapEntry[]) {
  const body = entries
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

export function buildSitemapEntries({
  newsItems,
  scheduleItems,
  generatedAt = getSitemapGeneratedDate(),
  baseUrl = SITEMAP_BASE_URL,
}: {
  newsItems: NewsRecord[];
  scheduleItems: TimestampedRecord[];
  generatedAt?: string;
  baseUrl?: string;
}) {
  const entries: SitemapEntry[] = [];
  const addedLocs = new Set<string>();

  function pushEntry(path: string, lastmod: string) {
    const loc = `${baseUrl}${path}`;
    if (addedLocs.has(loc)) return;
    entries.push({ loc, lastmod });
    addedLocs.add(loc);
  }

  for (const path of SITEMAP_STATIC_PATHS) {
    pushEntry(path, generatedAt);
  }

  const monthLastmodMap = new Map<string, string>();
  for (const item of scheduleItems) {
    const month = formatMonthFromDate(item.date);
    if (!month) continue;

    const itemLastmod = resolveLastmod(item, generatedAt);
    const prev = monthLastmodMap.get(month);
    if (!prev || itemLastmod > prev) {
      monthLastmodMap.set(month, itemLastmod);
    }
  }

  for (const [month, lastmod] of [...monthLastmodMap.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    pushEntry(`/live-schedule/${month}/`, lastmod);
  }

  for (const item of newsItems) {
    if (!isNewsDetailPageCandidate(item)) continue;
    const slug = item.slug?.trim();
    if (!slug) continue;
    pushEntry(`/news/${slug}/`, resolveLastmod(item, generatedAt, item.date));
  }

  return entries;
}
