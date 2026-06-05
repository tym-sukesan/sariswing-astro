import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AuditMetadata, AuditResult, AuditSuccess } from "./audit-site-types.ts";

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = path.join(TOOL_DIR, "output");

/** Pathname matches /YYYY-MM/ (monthly schedule archive pages on Wix sites). */
export const SCHEDULE_MONTH_PATH = /^\/\d{4}-\d{2}\/?$/;

export type PageType =
  | "Home"
  | "Profile/About"
  | "Schedule"
  | "Schedule Month"
  | "News"
  | "Contact"
  | "Discography/Works"
  | "Media"
  | "Links"
  | "Other";

export type Priority = "High" | "Medium" | "Low";

export const PAGE_TYPE_PRIORITY: Record<PageType, Priority> = {
  Home: "High",
  "Profile/About": "High",
  Schedule: "High",
  "Schedule Month": "High",
  News: "High",
  Contact: "Medium",
  "Discography/Works": "Medium",
  Media: "Medium",
  Links: "Low",
  Other: "Low",
};

export type EnrichedAuditPage = {
  slug: string;
  url: string;
  route: string;
  pageType: PageType;
  pageLabel: string;
  priority: Priority;
  routeNotes: string;
  metadata: AuditMetadata;
  textSample: string;
  prototypeFile: string;
  paths: {
    text: string;
    json: string;
    html: string;
    desktopScreenshot: string;
    mobileScreenshot: string;
  };
};

export function urlToAstroRoute(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    if (pathname === "/" || pathname === "") return "/";
    return pathname.endsWith("/") ? pathname : `${pathname}/`;
  } catch {
    return "/";
  }
}

export function getPathname(metadata: AuditMetadata): string {
  try {
    return new URL(metadata.finalUrl || metadata.url).pathname.toLowerCase();
  } catch {
    return "/";
  }
}

export function isScheduleMonthPath(pathname: string): boolean {
  return SCHEDULE_MONTH_PATH.test(pathname);
}

export function isLinksPath(pathname: string): boolean {
  return /\/link(?:\/|$)/.test(pathname);
}

export function scheduleMonthFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/(\d{4}-\d{2})\/?$/);
  return match?.[1] ?? null;
}

export function recommendedScheduleMonthRoute(pathname: string): string | null {
  const month = scheduleMonthFromPath(pathname);
  return month ? `/schedule/${month}/` : null;
}

export function routeToPrototypeFile(route: string): string {
  if (route === "/" || route === "") return "index.html";
  const segment = route.replace(/^\/|\/$/g, "").split("/")[0];
  return `${segment || "page"}.html`;
}

export function pageTypeLabel(pageType: PageType): string {
  if (pageType === "Schedule") return "Schedule Index";
  if (pageType === "Schedule Month") return "Schedule Month";
  if (pageType === "News") return "News Index";
  if (pageType === "Contact") return "Contact";
  if (pageType === "Home") return "Home";
  if (pageType === "Profile/About") return "Profile/About";
  if (pageType === "Discography/Works") return "Discography/Works";
  if (pageType === "Media") return "Media";
  if (pageType === "Links") return "Links / Link Page";
  return "Other";
}

export function pageShortName(pageType: PageType): string {
  if (pageType === "Profile/About") return "About";
  if (pageType === "Schedule" || pageType === "Schedule Month") return "Schedule";
  if (pageType === "News") return "News";
  if (pageType === "Contact") return "Contact";
  if (pageType === "Discography/Works") return "Discography";
  if (pageType === "Media") return "Media";
  if (pageType === "Links") return "Links";
  if (pageType === "Home") return "Home";
  return "Other";
}

export function buildRouteNotes(pageType: PageType, route: string, pathname: string): string {
  if (pageType === "Schedule Month") {
    const month = scheduleMonthFromPath(pathname);
    if (month) {
      return `Legacy-compatible: ${route}; recommended normalized: /schedule/${month}/`;
    }
  }
  return "—";
}

function buildSearchBlob(metadata: AuditMetadata, textSample: string): string {
  return [
    metadata.url,
    metadata.finalUrl,
    metadata.title,
    metadata.metaDescription ?? "",
    ...metadata.h1,
    ...metadata.h2,
    ...metadata.h3,
    textSample,
  ]
    .join(" ")
    .toLowerCase();
}

export function inferPageType(metadata: AuditMetadata, textSample: string): PageType {
  const pathname = getPathname(metadata);

  if (pathname === "/" || pathname === "") return "Home";
  if (isLinksPath(pathname)) return "Links";
  if (isScheduleMonthPath(pathname)) return "Schedule Month";
  if (/\/about(?:\/|$)/.test(pathname) || /\/profile(?:\/|$)/.test(pathname)) {
    return "Profile/About";
  }
  if (/\/schedule(?:\/|$)/.test(pathname) || /\/live(?:\/|$)/.test(pathname)) {
    return "Schedule";
  }
  if (/\/news(?:\/|$)/.test(pathname) || /\/blog(?:\/|$)/.test(pathname)) {
    return "News";
  }
  if (/\/contact(?:\/|$)/.test(pathname)) return "Contact";
  if (/\/discography(?:\/|$)/.test(pathname) || /\/works(?:\/|$)/.test(pathname)) {
    return "Discography/Works";
  }
  if (/\/media(?:\/|$)/.test(pathname) || /\/gallery(?:\/|$)/.test(pathname)) {
    return "Media";
  }

  const blob = buildSearchBlob(metadata, textSample);

  if (/profile|biograph|プロフィール|経歴/.test(blob)) return "Profile/About";
  if (/\bschedule\b|\blive\b|スケジュール|ライブ/.test(blob)) return "Schedule";
  if (/\bnews\b|ニュース/.test(blob)) return "News";
  if (/contact|hubspot|form|お問い合わせ|問い合わせ/.test(blob)) return "Contact";
  if (/discography|album|works|release|ディスコグラフィ/.test(blob)) {
    return "Discography/Works";
  }
  if (/\blinks?\b|external links|リンク集|関連リンク/.test(blob)) return "Links";
  if (/\bmedia\b|gallery|video|動画/.test(blob)) return "Media";

  return "Other";
}

async function readTextSample(slug: string): Promise<string> {
  try {
    const text = await fs.readFile(path.join(OUTPUT_DIR, "text", `${slug}.txt`), "utf8");
    return text.slice(0, 4000);
  } catch {
    return "";
  }
}

export async function enrichAuditPages(results: AuditResult[]): Promise<EnrichedAuditPage[]> {
  const successes = results.filter((result): result is AuditSuccess => result.ok);
  const enriched: EnrichedAuditPage[] = [];

  for (const result of successes) {
    const textSample = await readTextSample(result.slug);
    const pageType = inferPageType(result.metadata, textSample);
    const route = urlToAstroRoute(result.metadata.finalUrl || result.url);
    const pathname = getPathname(result.metadata);

    enriched.push({
      slug: result.slug,
      url: result.url,
      route,
      pageType,
      pageLabel: pageTypeLabel(pageType),
      priority: PAGE_TYPE_PRIORITY[pageType],
      routeNotes: buildRouteNotes(pageType, route, pathname),
      metadata: result.metadata,
      textSample,
      prototypeFile: routeToPrototypeFile(route),
      paths: {
        text: `tools/site-audit/output/text/${result.slug}.txt`,
        json: `tools/site-audit/output/json/${result.slug}.json`,
        html: `tools/site-audit/output/html/${result.slug}.html`,
        desktopScreenshot: `tools/site-audit/output/screenshots/desktop/${result.slug}.png`,
        mobileScreenshot: `tools/site-audit/output/screenshots/mobile/${result.slug}.png`,
      },
    });
  }

  return enriched;
}

export function isScheduleRelatedPageType(pageType: PageType): boolean {
  return pageType === "Schedule" || pageType === "Schedule Month";
}
