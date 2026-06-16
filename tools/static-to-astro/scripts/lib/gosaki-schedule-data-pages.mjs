/**
 * G-9d — Gosaki data-driven schedule hub + month pages (Supabase or static JSON).
 */

import fs from "node:fs";
import path from "node:path";
import { applyBaseUrlToSeo } from "./base-url.mjs";
import { seoToLayoutProps } from "./seo-extract.mjs";
import { layoutImportFromPagePath } from "./static-site-analyzer.mjs";
import { escapeAstroPropString } from "./path-transform.mjs";
import { SCHEDULE_INDEX_ROUTE } from "./schedule-pages.mjs";

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

function escapeHtmlText(text) {
  return String(text)
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

export const GOSAKI_SCHEDULE_LIST_ASTRO = `---
const { events = [] } = Astro.props;
---

<div class="gosaki-schedule-month-repeater">
  {
    events.map((ev) => {
      const descLines = (ev.description || "")
        .split("\\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const timeLine =
        ev.open_time && ev.start_time
          ? \`開場 \${ev.open_time} / 開演 \${ev.start_time}\`
          : ev.open_time
            ? \`開場 \${ev.open_time}\`
            : ev.start_time
              ? \`開演 \${ev.start_time}\`
              : null;
      const skipDesc = new Set();
      if (timeLine) skipDesc.add(\`時間：\${timeLine}\`);
      return (
        <article class="gosaki-schedule-event-card">
          <h1 class="gosaki-schedule-event-date font_0">
            {ev.date_display || ev.date}
          </h1>
          <div class="gosaki-schedule-event-body wixui-rich-text">
            {ev.title && <p>{ev.title}</p>}
            {ev.venue && <p>会場：{ev.venue}</p>}
            {timeLine && <p>時間：{timeLine}</p>}
            {ev.price && <p>料金：{ev.price}</p>}
            {descLines.map((line) => {
              if (skipDesc.has(line)) return null;
              return <p>{line}</p>;
            })}
          </div>
        </article>
      );
    })
  }
</div>
`;

/**
 * @param {Array<{ label: string, route: string, count?: number }>} months
 * @param {string | null} baseUrl
 * @param {string} deployBase
 * @param {'supabase' | 'static-fallback'} scheduleDataSource
 */
export function generateGosakiScheduleIndexFromData(
  months,
  baseUrl,
  deployBase,
  scheduleDataSource,
) {
  const layoutImport = layoutImportFromPagePath("schedule/index.astro");
  const route = SCHEDULE_INDEX_ROUTE;
  const seo = applyBaseUrlToSeo(
    {
      title: "Schedule | saki-goto",
      description: "",
      canonical: "",
      ogTitle: "Schedule | saki-goto",
      ogDescription: "",
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

  const listItems = months
    .map(
      (m) =>
        `      <a href={withBase('${escapeHtmlText(m.route)}')} class="gosaki-schedule-month-link">${escapeHtmlText(m.label)}</a>`,
    )
    .join("\n");

  const content = `  <section class="gosaki-schedule-hub">
    <h1 class="gosaki-schedule-hub__title">Schedule</h1>
    <div class="gosaki-schedule-months">
      <!-- CMS_TARGET: SCHEDULE_INDEX scheduleDataSource=${scheduleDataSource} -->
${listItems}
    </div>
  </section>`;

  return `---
import BaseLayout from "${layoutImport}";
import { withBase } from "../../lib/with-base.ts";
---

${layoutOpen}
${content}
</BaseLayout>
`;
}

/**
 * @param {{ month: string, label: string, route: string, heading?: string }} monthMeta
 * @param {'supabase' | 'static-fallback'} scheduleDataSource
 * @param {string | null} baseUrl
 * @param {string} deployBase
 */
export function generateGosakiScheduleMonthPageFromData(
  monthMeta,
  scheduleDataSource,
  baseUrl,
  deployBase,
) {
  const pagePath = `schedule/${monthMeta.month}/index.astro`;
  const layoutImport = layoutImportFromPagePath(pagePath);
  const dirDepth = pagePath.split("/").length - 1;
  const relUp = `${"../".repeat(dirDepth + 1)}`;
  const dataImport = `${relUp}data/gosaki-schedules.json`;
  const componentImport = `${relUp}components/GosakiScheduleList.astro`;

  const seo = applyBaseUrlToSeo(
    {
      title: `Schedule ${monthMeta.label} | saki-goto`,
      description: "",
      canonical: "",
      ogTitle: `Schedule ${monthMeta.label} | saki-goto`,
      ogDescription: "",
      ogImage: "",
      ogType: "website",
      ogUrl: "",
      twitterCard: "summary_large_image",
      favicon: "",
      appleTouchIcon: "",
      lang: "ja",
    },
    monthMeta.route,
    baseUrl,
    deployBase,
  );
  const layoutOpen = formatBaseLayoutOpen(seoToLayoutProps(seo));
  const heading = monthMeta.heading ?? `Schedule ${monthMeta.label}`;

  return `---
import BaseLayout from "${layoutImport}";
import GosakiScheduleList from "${componentImport}";
import schedules from "${dataImport}";

const MONTH = "${monthMeta.month}";
const events = schedules
  .filter((s) => s.month === MONTH)
  .sort((a, b) => {
    const da = a.date || "";
    const db = b.date || "";
    if (da !== db) return da.localeCompare(db);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
---

${layoutOpen}
  <section class="gosaki-schedule-month">
    <h2 class="font_2">${escapeHtmlText(heading)}</h2>
    <!-- CMS_TARGET: SCHEDULE_MONTH_LIST scheduleDataSource=${scheduleDataSource} -->
    <GosakiScheduleList events={events} />
  </section>
</BaseLayout>
`;
}

/**
 * @param {string} astroProjectDir
 * @param {{ scheduleDataSource: string, schedules: unknown[], months: Array<{ month: string, label: string, route: string, heading?: string, count?: number }> }} bundle
 * @param {{ baseUrl: string | null, deployBase: string }} opts
 */
export function applyGosakiScheduleDataPages(astroProjectDir, bundle, opts) {
  const astroAbs = path.resolve(astroProjectDir);
  const dataDir = path.join(astroAbs, "src", "data");
  const componentsDir = path.join(astroAbs, "src", "components");
  const pagesDir = path.join(astroAbs, "src", "pages");

  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(componentsDir, { recursive: true });
  fs.mkdirSync(path.join(pagesDir, "schedule"), { recursive: true });

  fs.writeFileSync(
    path.join(dataDir, "gosaki-schedules.json"),
    `${JSON.stringify(bundle.schedules, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(dataDir, "gosaki-schedule-months.json"),
    `${JSON.stringify(bundle.months, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(componentsDir, "GosakiScheduleList.astro"),
    GOSAKI_SCHEDULE_LIST_ASTRO,
    "utf8",
  );

  const source =
    bundle.scheduleDataSource === "supabase" ? "supabase" : "static-fallback";

  const hubPath = path.join(pagesDir, "schedule", "index.astro");
  fs.writeFileSync(
    hubPath,
    generateGosakiScheduleIndexFromData(bundle.months, opts.baseUrl, opts.deployBase, source),
    "utf8",
  );

  const monthPaths = [];
  for (const monthMeta of bundle.months) {
    const monthDir = path.join(pagesDir, "schedule", monthMeta.month);
    fs.mkdirSync(monthDir, { recursive: true });
    const monthFile = path.join(monthDir, "index.astro");
    fs.writeFileSync(
      monthFile,
      generateGosakiScheduleMonthPageFromData(
        monthMeta,
        source,
        opts.baseUrl,
        opts.deployBase,
      ),
      "utf8",
    );
    monthPaths.push(monthFile);
  }

  return {
    hubPath,
    monthPaths,
    scheduleDataSource: source,
    eventCount: bundle.schedules.length,
  };
}
