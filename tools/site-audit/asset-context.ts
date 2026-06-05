import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import type { ImageHtmlContext } from "./asset-map-types.ts";

const MAX_HEADINGS = 5;
const MAX_TEXT_SNIPPETS = 8;
const MAX_SNIPPET_LENGTH = 160;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").replace(/\u200b/g, "").trim();
}

function truncateText(value: string, max = MAX_SNIPPET_LENGTH): string {
  const cleaned = cleanText(value);
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

function dedupeLimited(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
    if (result.length >= limit) break;
  }
  return result;
}

function parseOptionalInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveImgSrc(
  img: cheerio.Cheerio<Element>,
  baseUrl: string,
): { src: string; originalSrc: string } {
  const candidates = [
    img.attr("src"),
    img.attr("data-src"),
    img.attr("data-image"),
  ].filter((value): value is string => Boolean(value?.trim()));

  const srcset = img.attr("srcset");
  if (srcset) {
    const first = srcset.split(",")[0]?.trim().split(/\s+/)[0];
    if (first) candidates.push(first);
  }

  const raw = candidates[0] ?? "";
  try {
    return { src: new URL(raw, baseUrl).href, originalSrc: raw };
  } catch {
    return { src: raw, originalSrc: raw };
  }
}

function collectHeadings($: cheerio.CheerioAPI, root: cheerio.Cheerio<Element>): string[] {
  const headings: string[] = [];
  let node: cheerio.Cheerio<Element> | null = root;

  for (let depth = 0; depth < 6 && node && node.length > 0; depth++) {
    node
      .find("h1, h2, h3")
      .each((_, element) => {
        const text = truncateText($(element).text());
        if (text) headings.push(text);
      });
    node = node.parent();
  }

  return dedupeLimited(headings, MAX_HEADINGS);
}

function collectNearbyText($: cheerio.CheerioAPI, root: cheerio.Cheerio<Element>): string[] {
  const snippets: string[] = [];

  const pushText = (value: string) => {
    const text = truncateText(value);
    if (text.length >= 4) snippets.push(text);
  };

  root.find("p, li, span, strong, em, label").each((_, element) => {
    if ($(element).find("img").length > 0) return;
    pushText($(element).text());
  });

  const prev = root.prev();
  const next = root.next();
  if (prev.length) pushText(prev.text());
  if (next.length) pushText(next.text());

  return dedupeLimited(snippets, MAX_TEXT_SNIPPETS);
}

function findContainer($: cheerio.CheerioAPI, img: cheerio.Cheerio<Element>): cheerio.Cheerio<Element> {
  let container = img.parent();
  for (let depth = 0; depth < 10 && container.length > 0; depth++) {
    const textLen = cleanText(container.text()).length;
    if (textLen >= 40 && textLen <= 2500) return container;
    container = container.parent();
  }
  return img.parent();
}

export function extractImageContextsFromHtml(html: string, baseUrl: string): ImageHtmlContext[] {
  const $ = cheerio.load(html);
  const contexts: ImageHtmlContext[] = [];

  $("img").each((index, element) => {
    const img = $(element);
    const { src, originalSrc } = resolveImgSrc(img, baseUrl);
    if (!src || src.startsWith("data:")) return;

    const container = findContainer($, img);
    const anchor = img.closest("a");
    const linkedHref = anchor.length
      ? (() => {
          try {
            const href = anchor.attr("href") ?? "";
            return href ? new URL(href, baseUrl).href : null;
          } catch {
            return anchor.attr("href") ?? null;
          }
        })()
      : null;

    contexts.push({
      imageUrl: src,
      originalSrc,
      alt: cleanText(img.attr("alt") ?? ""),
      width: parseOptionalInt(img.attr("width") ?? undefined),
      height: parseOptionalInt(img.attr("height") ?? undefined),
      nearbyHeadings: collectHeadings($, container),
      nearbyText: collectNearbyText($, container),
      linkedHref,
      domIndex: index,
      classNames: cleanText(img.attr("class") ?? ""),
      sources: [],
    });
  });

  return contexts;
}

export type ScheduleEventCandidate = {
  eventDate?: string;
  eventDateLabel: string;
  eventTitle?: string;
  venue?: string;
  snippet: string;
  hasLiveSignals: boolean;
};

export function parseYearMonthFromRoute(route: string): { year: number; month: number } | null {
  const normalized = route.endsWith("/") ? route : `${route}/`;
  const match = normalized.match(/\/(\d{4})-(\d{2})\//);
  if (!match) return null;
  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

export function normalizeEventDate(
  dateLabel: string,
  context?: { year?: number; month?: number },
): string | null {
  const label = dateLabel.trim();
  const dotted = label.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (dotted) {
    return `${dotted[1]}-${dotted[2]}-${dotted[3]}`;
  }

  const slashIso = label.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
  if (slashIso) {
    const month = slashIso[2].padStart(2, "0");
    const day = slashIso[3].padStart(2, "0");
    return `${slashIso[1]}-${month}-${day}`;
  }

  const japanese = label.match(/^(\d{1,2})月(\d{1,2})日/);
  if (japanese) {
    const year = context?.year ?? 2026;
    const month = Number.parseInt(japanese[1], 10);
    const day = japanese[2].padStart(2, "0");
    const monthPadded = String(month).padStart(2, "0");
    return `${year}-${monthPadded}-${day}`;
  }

  const shortSlash = label.match(/^(\d{1,2})\/(\d{1,2})/);
  if (shortSlash && context?.year) {
    const month = (context.month ?? Number.parseInt(shortSlash[1], 10))
      .toString()
      .padStart(2, "0");
    const day = shortSlash[2].padStart(2, "0");
    return `${context.year}-${month}-${day}`;
  }

  return null;
}

function extractVenueFromLines(lines: string[]): string | undefined {
  for (const line of lines) {
    if (/^会場[：:]/.test(line)) {
      return cleanText(line.replace(/^会場[：:]/, ""));
    }
    if (/会場/.test(line) && !/website/i.test(line)) {
      return cleanText(line.replace(/会場[：:]?/, ""));
    }
    if (/OPEN|START|CHARGE|☎|電話/.test(line)) break;
    if (line.length >= 2 && line.length <= 80 && !/^[『「]/.test(line)) {
      return cleanText(line);
    }
  }
  return undefined;
}

function lineHasLiveSignals(line: string, blockLines: string[]): boolean {
  const blob = [line, ...blockLines].join(" ");
  return /\b(?:live|ライブ)\b/i.test(blob) || /open|start|charge|会場|出演|料金/i.test(blob);
}

export function parseScheduleEventsFromText(
  text: string,
  pageRoute?: string,
): ScheduleEventCandidate[] {
  const lines = text.split(/\n/).map((line) => line.replace(/\u200b/g, "").trim());
  const routeContext = pageRoute ? parseYearMonthFromRoute(pageRoute) : null;
  const defaultYear = routeContext?.year ?? 2026;
  const events: ScheduleEventCandidate[] = [];
  let current: {
    dateLabel: string;
    title: string;
    lines: string[];
  } | null = null;

  const flush = () => {
    if (!current) return;
    const snippet = truncateText(
      [current.dateLabel, current.title, ...current.lines].join(" "),
      200,
    );
    const hasLiveSignals = lineHasLiveSignals(current.dateLabel, current.lines);
    const venue = extractVenueFromLines(current.lines);
    const eventDate = normalizeEventDate(current.dateLabel, {
      year: defaultYear,
      month: routeContext?.month,
    });

    events.push({
      eventDate: eventDate ?? undefined,
      eventDateLabel: current.dateLabel,
      eventTitle: current.title || undefined,
      venue,
      snippet,
      hasLiveSignals,
    });
    current = null;
  };

  for (const line of lines) {
    if (line.startsWith("©")) break;
    const isDateLine =
      /^2026\.\d{2}\.\d{2}/.test(line) ||
      /^[0-9]{4}\.\d{2}\.\d{2}/.test(line) ||
      /^[0-9]{1,2}月[0-9]{1,2}日/.test(line) ||
      /\bLIVE\b/i.test(line) && /月/.test(line);

    if (isDateLine) {
      flush();
      const titleMatch = line.match(/<([^>]+)>/);
      const datePart = line.split("<")[0].trim();
      current = {
        dateLabel: datePart,
        title: titleMatch?.[1]?.trim() ?? "",
        lines: [],
      };
      continue;
    }
    if (current && line) current.lines.push(line);
  }
  flush();

  return events;
}

export function parseAlbumTitlesFromText(text: string, headings: string[]): string[] {
  const fromHeadings = headings
    .map((h) => cleanText(h.replace(/^​+/, "")))
    .filter((h) => /album|continuous|skylark|trio|release|「/.test(h) || h.length > 4);

  if (fromHeadings.length > 0) return fromHeadings;

  const titles: string[] = [];
  for (const line of text.split(/\n/)) {
    const trimmed = cleanText(line.replace(/\u200b/g, ""));
    if (/^「.+」\//.test(trimmed) || /^「.+」/.test(trimmed)) {
      titles.push(trimmed);
    }
  }
  return titles;
}

export function dateHintFromAltOrUrl(alt: string, url: string): string | null {
  const blob = `${alt} ${url}`;
  const iso = blob.match(/(20\d{2})[^\d]?(\d{2})[^\d]?(\d{2})/i);
  if (iso) {
    return `${iso[1]}.${iso[2]}.${iso[3]}`;
  }
  const compact = blob.match(/(?:^|[^\d])(20\d{2})(\d{2})(\d{2})(?:[^\d]|$)/);
  if (compact) {
    return `${compact[1]}.${compact[2]}.${compact[3]}`;
  }
  const monthDay = blob.match(/(\d{1,2})月(\d{1,2})日/);
  if (monthDay) {
    return `2026.${monthDay[1].padStart(2, "0")}.${monthDay[2].padStart(2, "0")}`;
  }
  const slash = blob.match(/(?:^|[^\d])(\d{1,2})[/-](\d{1,2})(?:[^\d]|$)/);
  if (slash) {
    return `2026.${slash[1].padStart(2, "0")}.${slash[2].padStart(2, "0")}`;
  }
  return null;
}
