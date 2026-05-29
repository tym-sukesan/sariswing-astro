import { createClient } from "@supabase/supabase-js";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadEnv } from "vite";

const SITE_TIMEZONE = "Asia/Tokyo";
const JST_OFFSET = "+09:00";

/** @typedef {{ updated_at?: string | null; created_at?: string | null; date?: string | null; published_at?: string | null }} TimestampedRecord */

/** @typedef {{ type: 'date'; value: string } | { type: 'datetime'; value: string }} SitemapLastmodEntry */

export const SITEMAP_STATIC_PATHS = [
  "/",
  "/about/",
  "/live-schedule/",
  "/news/",
  "/discography/",
  "/contact/",
];

export function getSitemapGeneratedDate(reference = new Date()) {
  return formatDateOnlyTokyo(reference);
}

export function normalizeSitemapDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : formatDateOnlyTokyo(value);
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDateOnlyTokyo(parsed);
}

export function formatDateOnlyTokyo(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: SITE_TIMEZONE }).format(date);
}

export function formatDateTimeTokyo(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SITE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}${JST_OFFSET}`;
}

export function parseTimestamp(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value).trim());
  return Number.isNaN(date.getTime()) ? null : date;
}

export function hasTimeComponent(value) {
  const text = String(value).trim();
  return /T\d{2}:\d{2}/.test(text) || /\s\d{1,2}:\d{2}/.test(text);
}

function clampTimestamp(date, buildEnd) {
  return date.getTime() > buildEnd.getTime() ? buildEnd : date;
}

function clampDateOnly(candidate, generatedAt) {
  if (!candidate) return generatedAt;
  return candidate > generatedAt ? generatedAt : candidate;
}

/** @returns {SitemapLastmodEntry} */
export function createDateLastmod(value) {
  return { type: "date", value: value };
}

/** @returns {SitemapLastmodEntry} */
export function createDateTimeLastmod(date) {
  const value = formatDateTimeTokyo(date);
  if (!value) throw new Error("Invalid datetime for sitemap lastmod");
  return { type: "datetime", value };
}

/** @returns {SitemapLastmodEntry} */
export function resolveTimestampLastmod(raw, buildEnd, fallbackDate) {
  if (!raw) return createDateLastmod(fallbackDate);

  const parsed = parseTimestamp(raw);
  if (!parsed) return createDateLastmod(fallbackDate);

  const clamped = clampTimestamp(parsed, buildEnd);

  if (hasTimeComponent(raw)) {
    return createDateTimeLastmod(clamped);
  }

  return createDateLastmod(clampDateOnly(formatDateOnlyTokyo(clamped), fallbackDate));
}

/** @returns {{ entry: SitemapLastmodEntry; sortTime: number }} */
function resolveScheduleItemLastmod(record, buildEnd, fallbackDate) {
  const timestamp = record.updated_at ?? record.created_at ?? null;

  if (timestamp) {
    const entry = resolveTimestampLastmod(timestamp, buildEnd, fallbackDate);
    const sortTime = parseTimestamp(timestamp)?.getTime() ?? 0;
    return { entry, sortTime };
  }

  const dateOnly = clampDateOnly(normalizeSitemapDate(record.date) ?? fallbackDate, fallbackDate);
  return {
    entry: createDateLastmod(dateOnly),
    sortTime: new Date(`${dateOnly}T00:00:00${JST_OFFSET}`).getTime(),
  };
}

/** @returns {SitemapLastmodEntry} */
export function resolveNewsLastmod(record, buildEnd, fallbackDate) {
  const timestamp = record.published_at ?? record.updated_at ?? record.created_at ?? null;

  if (timestamp) {
    return resolveTimestampLastmod(timestamp, buildEnd, fallbackDate);
  }

  const dateOnly = clampDateOnly(normalizeSitemapDate(record.date) ?? fallbackDate, fallbackDate);
  return createDateLastmod(dateOnly);
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

/** @returns {Map<string, SitemapLastmodEntry>} */
function getDiscographyLastmods(generatedAt) {
  /** @type {Map<string, SitemapLastmodEntry>} */
  const map = new Map();
  const baseDir = join(process.cwd(), "src/pages/discography");

  for (const entry of readdirSync(baseDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const pageFile = join(baseDir, entry.name, "index.astro");
    let lastmod = createDateLastmod(generatedAt);

    try {
      const mtime = statSync(pageFile).mtime;
      const dateOnly = formatDateOnlyTokyo(mtime);
      if (dateOnly) {
        lastmod = createDateLastmod(clampDateOnly(dateOnly, generatedAt));
      }
    } catch {
      // ファイルが無い場合はビルド日
    }

    map.set(`/discography/${entry.name}/`, lastmod);
  }

  try {
    const indexMtime = statSync(join(baseDir, "index.astro")).mtime;
    const dateOnly = formatDateOnlyTokyo(indexMtime);
    map.set(
      "/discography/",
      dateOnly ? createDateLastmod(clampDateOnly(dateOnly, generatedAt)) : createDateLastmod(generatedAt)
    );
  } catch {
    map.set("/discography/", createDateLastmod(generatedAt));
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
 * pathname（末尾スラッシュ付き）→ lastmod エントリ
 * @param {{ generatedAt?: string; buildEnd?: Date }} options
 * @returns {Promise<Map<string, SitemapLastmodEntry>>}
 */
export async function getSitemapLastmodLookup(options = {}) {
  const buildEnd = options.buildEnd ?? new Date();
  const generatedAt = options.generatedAt ?? getSitemapGeneratedDate(buildEnd);
  /** @type {Map<string, SitemapLastmodEntry>} */
  const lookup = new Map();

  for (const path of SITEMAP_STATIC_PATHS) {
    lookup.set(path, createDateLastmod(generatedAt));
  }

  for (const [path, lastmod] of getDiscographyLastmods(generatedAt)) {
    lookup.set(path, lastmod);
  }

  const { newsItems, scheduleItems } = await fetchSupabaseRows();

  /** @type {Map<string, { entry: SitemapLastmodEntry; sortTime: number }>} */
  const monthLastmodMap = new Map();

  for (const item of scheduleItems) {
    const month = formatMonthFromDate(item.date);
    if (!month) continue;

    const resolved = resolveScheduleItemLastmod(item, buildEnd, generatedAt);
    const prev = monthLastmodMap.get(month);

    if (!prev || resolved.sortTime > prev.sortTime) {
      monthLastmodMap.set(month, resolved);
    }
  }

  for (const [month, { entry }] of monthLastmodMap) {
    lookup.set(`/live-schedule/${month}/`, entry);
  }

  for (const item of newsItems) {
    if (!isNewsDetailPageCandidate(item)) continue;
    const slug = item.slug?.trim();
    if (!slug) continue;
    lookup.set(`/news/${slug}/`, resolveNewsLastmod(item, buildEnd, generatedAt));
  }

  return lookup;
}

/** @param {string} href */
export function pathnameFromSitemapUrl(href) {
  const pathname = new URL(href).pathname;
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

/**
 * @astrojs/sitemap の serialize から呼ぶ（XML 出力は patchSitemapFiles で整形）
 * @param {{ url: string; lastmod?: Date }} item
 * @param {Map<string, SitemapLastmodEntry>} lookup
 * @param {string} fallbackDate
 */
export function serializeSitemapItem(item, lookup, fallbackDate) {
  const path = pathnameFromSitemapUrl(item.url);
  const entry = lookup.get(path) ?? createDateLastmod(fallbackDate);

  return {
    ...item,
    lastmod:
      entry.type === "datetime"
        ? new Date(entry.value)
        : new Date(`${entry.value}T12:00:00${JST_OFFSET}`),
  };
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * sitemap パッケージが UTC 固定に変換するため、生成後に lastmod 文字列を差し替える
 * @param {string} xml
 * @param {Map<string, SitemapLastmodEntry>} lookup
 */
export function patchSitemapUrlsetXml(xml, lookup) {
  return xml.replace(/<url>([\s\S]*?)<\/url>/g, (block, inner) => {
    const loc = inner.match(/<loc>([^<]+)/)?.[1];
    if (!loc) return block;

    const path = pathnameFromSitemapUrl(loc);
    const entry = lookup.get(path);
    if (!entry) return block;

    const tag = `<lastmod>${escapeXml(entry.value)}</lastmod>`;
    const innerWithout = inner.replace(/<lastmod>[\s\S]*?<\/lastmod>\s*/g, "");
    return `<url>${innerWithout}${tag}</url>`;
  });
}

/**
 * @param {string} distDir
 * @param {Map<string, SitemapLastmodEntry>} lookup
 */
export async function patchSitemapFiles(distDir, lookup) {
  const names = await readdir(distDir);

  for (const name of names) {
    if (!name.startsWith("sitemap") || !name.endsWith(".xml") || name.includes("-index")) {
      continue;
    }

    const filePath = join(distDir, name);
    const xml = await readFile(filePath, "utf8");
    const patched = patchSitemapUrlsetXml(xml, lookup);
    await writeFile(filePath, patched);
  }
}
