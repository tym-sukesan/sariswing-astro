/**
 * Mio Kisaragi Jazz — Schedule hub + month page render from injected scheduleBundle.
 *
 * Does not import Gosaki schedule markup. Does not read fixture paths implicitly.
 * Dedicated month pages only for fixture-backed months (2026-08 / 2026-09).
 * 2026-07 (1 past public event) is listed on the hub only — no new month page.
 */

import fs from "node:fs";
import path from "node:path";
import { applyBaseUrlToSeo } from "./base-url.mjs";
import { mioAstroWithBaseSrcAttr } from "./mio-local-asset-url.mjs";
import { escapeAstroPropString } from "./path-transform.mjs";
import { seoToLayoutProps } from "./seo-extract.mjs";
import { layoutImportFromPagePath } from "./static-site-analyzer.mjs";
import {
  deriveScheduleMonthsFromSchedules,
  normalizeScheduleRecord,
  scheduleBelongsToMonthPage,
  sortScheduleRecords,
} from "./supabase-schedule-read.mjs";

const LAYOUT_PROP_KEYS = [
  "title",
  "description",
  "canonical",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "ogType",
  "ogUrl",
  "twitterCard",
  "favicon",
  "appleTouchIcon",
  "lang",
  "robots",
];

/** Months that already exist as Mio HTML fixture pages (no new month pages). */
export const MIO_FIXTURE_MONTH_PAGE_KEYS = Object.freeze(["2026-08", "2026-09"]);

/**
 * @param {string} text
 */
export function escapeMioHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatBaseLayoutOpen(props) {
  const lines = LAYOUT_PROP_KEYS.filter((key) => props[key] !== undefined && props[key] !== "")
    .map((key) => `  ${key}="${escapeAstroPropString(props[key])}"`);
  if (!lines.length) return "<BaseLayout>";
  return `<BaseLayout\n${lines.join("\n")}\n>`;
}

/**
 * Fixture-compatible month route for schedule-YYYY-MM.html sources.
 * @param {string} monthKey YYYY-MM
 */
export function mioFixtureMonthRoute(monthKey) {
  return `/schedule-${monthKey}/`;
}

/**
 * @param {string} monthKey
 */
export function mioFixtureMonthPagePath(monthKey) {
  return `schedule-${monthKey}/index.astro`;
}

/**
 * @param {unknown} bundle
 * @returns {Array<Record<string, unknown>>}
 */
export function readMioScheduleRowsFromBundle(bundle) {
  if (!bundle || typeof bundle !== "object") return [];
  const obj = /** @type {Record<string, unknown>} */ (bundle);
  if (Array.isArray(obj.schedules)) return /** @type {Array<Record<string, unknown>>} */ (obj.schedules);
  if (Array.isArray(obj.rows)) return /** @type {Array<Record<string, unknown>>} */ (obj.rows);
  return [];
}

/**
 * Build inject-ready scheduleBundle from schedules.json document (verifier / convert).
 * Keeps extensions for Mio display; filters published=true only.
 *
 * @param {{ rows?: unknown[], siteSlug?: string }} schedulesDoc
 */
export function buildMioInjectScheduleBundle(schedulesDoc) {
  const rawRows = Array.isArray(schedulesDoc?.rows) ? schedulesDoc.rows : [];
  const publicRaw = rawRows.filter((row) => row && /** @type {any} */ (row).published !== false);
  const schedules = sortScheduleRecords(
    publicRaw.map((row) => {
      const r = /** @type {Record<string, unknown>} */ (row);
      return {
        ...normalizeScheduleRecord(r),
        extensions: r.extensions && typeof r.extensions === "object" ? r.extensions : {},
      };
    }),
  );
  const months = deriveScheduleMonthsFromSchedules(schedules).map((m) => {
    const hasPage = MIO_FIXTURE_MONTH_PAGE_KEYS.includes(m.month);
    return {
      ...m,
      route: hasPage ? mioFixtureMonthRoute(m.month) : "/schedule/#mio-archive-2026-07",
      pageKind: hasPage ? "month-page" : "hub-archive",
      heading: `Schedule ${m.label}`,
    };
  });

  return {
    scheduleDataSource: "static-fallback",
    siteSlug: schedulesDoc?.siteSlug ?? "mio-kisaragi-jazz",
    schedules,
    months,
    renderMonthKeys: MIO_FIXTURE_MONTH_PAGE_KEYS.filter((key) =>
      months.some((m) => m.month === key),
    ),
  };
}

/**
 * @param {unknown} bundle
 */
export function resolveMioScheduleDataUsage(bundle) {
  const schedules = readMioScheduleRowsFromBundle(bundle).filter(
    (row) => /** @type {any} */ (row).published !== false,
  );
  if (!schedules.length) {
    return { useScheduleData: false, monthRoutes: null };
  }
  return {
    useScheduleData: true,
    monthRoutes: new Set(MIO_FIXTURE_MONTH_PAGE_KEYS.map((key) => mioFixtureMonthRoute(key))),
  };
}

/**
 * @param {Record<string, unknown>} event
 */
function priceKindLabel(kind) {
  if (kind === "free") return "無料";
  if (kind === "paid") return "有料";
  if (kind === "tbd") return "料金未定";
  return null;
}

/**
 * @param {Record<string, unknown>} event
 */
export function renderMioScheduleEventCardHtml(event) {
  const ext =
    event.extensions && typeof event.extensions === "object"
      ? /** @type {Record<string, unknown>} */ (event.extensions)
      : {};
  const resolvedStatus =
    event.dateStatus === "tbd" ||
    event.date_status === "tbd" ||
    ext.dateStatus === "tbd" ||
    event.date == null
      ? "tbd"
      : "dated";
  const priceKind = String(ext.priceKind ?? "paid");
  const hasImage = Boolean(ext.hasImage) || Boolean(event.image_url);
  const performers = Array.isArray(ext.performers)
    ? ext.performers.map((p) => String(p))
    : [];
  const bookingUrl = ext.bookingUrl ? String(ext.bookingUrl) : null;
  const address = ext.address ? String(ext.address) : null;
  const dualShow = ext.dualShowPair ? String(ext.dualShowPair) : null;
  const longTitle = Boolean(ext.longTitle);

  // Prefer normalized contract display (日付未定 / 日程未定); never Date-format null.
  const dateDisplay =
    resolvedStatus === "tbd"
      ? String(event.date_display || event.dateDisplay || "日付未定")
      : String(event.date_display || event.dateDisplay || event.date || "");
  const dateStatus = resolvedStatus;

  const timeLine =
    event.open_time && event.start_time
      ? `開場 ${event.open_time} / 開演 ${event.start_time}`
      : event.open_time
        ? `開場 ${event.open_time}`
        : event.start_time
          ? `開演 ${event.start_time}`
          : null;

  const badge = priceKindLabel(priceKind);
  const imgSrcAttr =
    hasImage && event.image_url ? mioAstroWithBaseSrcAttr(String(event.image_url)) : null;
  const img = imgSrcAttr
    ? `\n      <img ${imgSrcAttr} width="112" height="112" alt="" />`
    : "";

  const performerHtml = performers.length
    ? `\n        <p class="meta">出演: ${escapeMioHtml(performers.join(" / "))}</p>`
    : "";
  const addressHtml = address
    ? `\n        <p class="meta">${escapeMioHtml(address)}</p>`
    : "";
  const bookingHtml = bookingUrl
    ? `\n        <p class="meta" data-mio-booking="true">予約: <a href="${escapeMioHtml(bookingUrl)}" rel="noopener noreferrer">${escapeMioHtml(bookingUrl)}</a></p>`
    : "";
  const priceHtml = event.price
    ? `\n        <p class="meta">${badge ? `<span class="badge" data-mio-price-kind="${escapeMioHtml(priceKind)}">${escapeMioHtml(badge)}</span>` : ""}${escapeMioHtml(String(event.price))}</p>`
    : badge
      ? `\n        <p class="meta"><span class="badge" data-mio-price-kind="${escapeMioHtml(priceKind)}">${escapeMioHtml(badge)}</span></p>`
      : "";

  // Fixture CSS contract: `.event-list` > `.event-card` (+ `.has-media`) with `.event-date` / `.meta` / `.badge`.
  // Keep data-mio-* for offline verifiers; do not invent parallel mio-schedule visual classes.
  return `<li class="event-card${hasImage && imgSrcAttr ? " has-media" : ""}${longTitle ? " event-card--long-title" : ""}" data-mio-schedule-id="${escapeMioHtml(String(event.legacy_id ?? event.id ?? ""))}" data-mio-month="${escapeMioHtml(String(event.month ?? ""))}" data-mio-date-status="${dateStatus}" data-mio-price-kind="${escapeMioHtml(priceKind)}" data-mio-has-image="${hasImage && imgSrcAttr ? "true" : "false"}"${longTitle ? ` data-mio-long-title="true"` : ""}${dualShow ? ` data-mio-dual-show="${escapeMioHtml(dualShow)}"` : ""}>
      ${img}
      <div>
        <p class="event-date">${escapeMioHtml(dateDisplay)}</p>
        <h3>${escapeMioHtml(String(event.title ?? ""))}</h3>
        ${event.venue ? `<p class="meta">${escapeMioHtml(String(event.venue))}</p>` : ""}${addressHtml}${timeLine ? `\n        <p class="meta">${escapeMioHtml(timeLine)}</p>` : ""}${priceHtml}${performerHtml}${bookingHtml}
      </div>
    </li>`;
}

/**
 * @param {Array<Record<string, unknown>>} events
 */
export function renderMioScheduleEventListHtml(events) {
  const cards = events.map((ev) => renderMioScheduleEventCardHtml(ev)).join("\n    ");
  return `<ul class="event-list" data-mio-schedule-list="public">\n    ${cards}\n  </ul>`;
}

/**
 * @param {unknown} bundle
 * @param {string} monthKey
 */
export function selectMioPublicEventsForMonth(bundle, monthKey) {
  return sortScheduleRecords(
    readMioScheduleRowsFromBundle(bundle).filter((row) =>
      scheduleBelongsToMonthPage(/** @type {Record<string, unknown>} */ (row), monthKey),
    ),
  );
}

/**
 * @param {unknown} bundle
 * @param {string | null} baseUrl
 * @param {string} deployBase
 * @param {string} scheduleDataSource
 */
function generateMioScheduleHubPage(bundle, baseUrl, deployBase, scheduleDataSource) {
  const months = Array.isArray(/** @type {any} */ (bundle)?.months)
    ? /** @type {any} */ (bundle).months
    : [];
  const pageMonths = months.filter((m) => m.pageKind === "month-page" || MIO_FIXTURE_MONTH_PAGE_KEYS.includes(m.month));
  const julyEvents = selectMioPublicEventsForMonth(bundle, "2026-07");
  const layoutImport = layoutImportFromPagePath("schedule/index.astro");
  const seo = applyBaseUrlToSeo(
    {
      title: "Mio Kisaragi Jazz Vocal — Schedule",
      description: "公演スケジュール一覧（架空 fixture）。",
      canonical: "",
      ogTitle: "Mio Kisaragi Jazz Vocal — Schedule",
      ogDescription: "公演スケジュール一覧（架空 fixture）。",
      ogImage: "",
      ogType: "website",
      ogUrl: "",
      twitterCard: "summary_large_image",
      favicon: "",
      appleTouchIcon: "",
      lang: "ja",
    },
    "/schedule/",
    baseUrl,
    deployBase,
  );
  const layoutOpen = formatBaseLayoutOpen(seoToLayoutProps(seo));

  const monthLinks = pageMonths
    .map(
      (m) =>
        `        <a href={withBase('${escapeMioHtml(mioFixtureMonthRoute(m.month))}')} data-mio-month-link="${escapeMioHtml(m.month)}">${escapeMioHtml(m.label)}（${Number(m.count)}）</a>`,
    )
    .join("\n");

  const julySection = julyEvents.length
    ? `
  <section class="section" id="mio-archive-2026-07" data-mio-archive-month="2026-07">
    <div class="section-head">
      <h2>2026.07（過去公演・hub掲載）</h2>
    </div>
    <p class="meta">専用月ページは fixture に無いため、hub のみに掲載します。</p>
    ${renderMioScheduleEventListHtml(julyEvents)}
  </section>`
    : "";

  return `---
import BaseLayout from "${layoutImport}";
import { withBase } from "../../lib/with-base.ts";
---

${layoutOpen}
  <p class="eyebrow">Schedule</p>
  <h1 class="page-title">Live schedule</h1>
  <p class="lede">公開公演のみ表示。draft / pending は非表示です。</p>

  <section class="section" data-mio-schedule-hub="true">
    <div class="section-head">
      <h2>Months</h2>
    </div>
    <div class="month-links">
      <!-- CMS_TARGET: MIO_SCHEDULE_INDEX scheduleDataSource=${escapeMioHtml(scheduleDataSource)} -->
${monthLinks}
    </div>
  </section>
${julySection}
</BaseLayout>
`;
}

/**
 * @param {{ month: string, label: string, heading?: string, count?: number }} monthMeta
 * @param {Array<Record<string, unknown>>} events
 * @param {string | null} baseUrl
 * @param {string} deployBase
 * @param {string} scheduleDataSource
 */
function generateMioScheduleMonthPage(monthMeta, events, baseUrl, deployBase, scheduleDataSource) {
  const pagePath = mioFixtureMonthPagePath(monthMeta.month);
  const layoutImport = layoutImportFromPagePath(pagePath);
  const route = mioFixtureMonthRoute(monthMeta.month);
  const heading = monthMeta.heading ?? `Schedule ${monthMeta.label}`;
  const seo = applyBaseUrlToSeo(
    {
      title: `Mio Kisaragi Jazz Vocal — Schedule ${monthMeta.label}`,
      description: `${monthMeta.label}の公演一覧（架空）。`,
      canonical: "",
      ogTitle: `Mio Kisaragi Jazz Vocal — Schedule ${monthMeta.label}`,
      ogDescription: `${monthMeta.label}の公演一覧（架空）。`,
      ogImage: "",
      ogType: "website",
      ogUrl: "",
      twitterCard: "summary_large_image",
      favicon: "",
      appleTouchIcon: "",
      lang: "ja",
    },
    route,
    baseUrl,
    deployBase,
  );
  const layoutOpen = formatBaseLayoutOpen(seoToLayoutProps(seo));
  const listHtml = renderMioScheduleEventListHtml(events);

  return `---
import BaseLayout from "${layoutImport}";
import { withBase } from "../../lib/with-base.ts";
---

${layoutOpen}
  <p class="eyebrow"><a href={withBase('/schedule/')}>Schedule</a> / ${escapeMioHtml(monthMeta.label)}</p>
  <h1 class="page-title">${escapeMioHtml(heading)}</h1>
  <p class="lede">公開 ${Number(monthMeta.count ?? events.length)} 件</p>
  <!-- CMS_TARGET: MIO_SCHEDULE_MONTH scheduleDataSource=${escapeMioHtml(scheduleDataSource)} month=${escapeMioHtml(monthMeta.month)} -->
  <section class="section" data-mio-schedule-month="${escapeMioHtml(monthMeta.month)}">
    ${listHtml}
  </section>
</BaseLayout>
`;
}

/**
 * @param {string} astroProjectDir
 * @param {unknown} bundle
 * @param {{ baseUrl?: string | null, deployBase?: string }} opts
 */
export function applyMioScheduleDataPages(astroProjectDir, bundle, opts = {}) {
  const schedules = readMioScheduleRowsFromBundle(bundle).filter(
    (row) => /** @type {any} */ (row).published !== false,
  );
  if (!schedules.length) {
    return {
      applied: false,
      reason: "mio_schedule_bundle_missing",
      hubPath: null,
      monthPaths: [],
      eventCount: 0,
      monthCounts: {},
    };
  }

  const baseUrl = opts.baseUrl ?? null;
  const deployBase = opts.deployBase ?? "/";
  const source =
    /** @type {any} */ (bundle)?.scheduleDataSource === "supabase"
      ? "supabase"
      : "static-fallback";

  const pagesDir = path.join(path.resolve(astroProjectDir), "src", "pages");
  const dataDir = path.join(path.resolve(astroProjectDir), "src", "data");
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(path.join(pagesDir, "schedule"), { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "mio-schedules.json"),
    `${JSON.stringify(schedules, null, 2)}\n`,
    "utf8",
  );

  const hubPath = path.join(pagesDir, "schedule", "index.astro");
  fs.writeFileSync(
    hubPath,
    generateMioScheduleHubPage(bundle, baseUrl, deployBase, source),
    "utf8",
  );

  /** @type {Record<string, number>} */
  const monthCounts = {};
  const monthPaths = [];
  for (const monthKey of MIO_FIXTURE_MONTH_PAGE_KEYS) {
    const events = selectMioPublicEventsForMonth(bundle, monthKey);
    monthCounts[monthKey] = events.length;
    const monthMeta =
      (Array.isArray(/** @type {any} */ (bundle)?.months)
        ? /** @type {any} */ (bundle).months.find((m) => m.month === monthKey)
        : null) ?? {
        month: monthKey,
        label: monthKey.replace("-", "."),
        count: events.length,
        heading: `Schedule ${monthKey.replace("-", ".")}`,
      };
    const monthDir = path.join(pagesDir, `schedule-${monthKey}`);
    fs.mkdirSync(monthDir, { recursive: true });
    const monthFile = path.join(monthDir, "index.astro");
    fs.writeFileSync(
      monthFile,
      generateMioScheduleMonthPage(
        { ...monthMeta, count: events.length },
        events,
        baseUrl,
        deployBase,
        source,
      ),
      "utf8",
    );
    monthPaths.push(monthFile);
  }

  monthCounts["2026-07"] = selectMioPublicEventsForMonth(bundle, "2026-07").length;

  return {
    applied: true,
    hubPath,
    monthPaths,
    scheduleDataSource: source,
    eventCount: schedules.length,
    monthCounts,
  };
}
