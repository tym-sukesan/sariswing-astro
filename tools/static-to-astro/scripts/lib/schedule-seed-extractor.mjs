import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlFileToAstroRoute, walkHtmlFiles } from "./static-site-analyzer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

const SCHEDULE_FILE_RE = /^schedule-(\d{4})-(\d{2})\.html$/i;

/**
 * @param {string} dateText e.g. "2026.07.03 (Fri)"
 */
export function parseScheduleDateText(dateText) {
  const m = (dateText ?? "").trim().match(/(\d{4})\.(\d{2})\.(\d{2})/);
  if (!m) return { iso: null, display: dateText?.trim() || null };
  return { iso: `${m[1]}-${m[2]}-${m[3]}`, display: dateText.trim() };
}

/**
 * @param {string} timeLine e.g. "開場 18:00 / 開演 19:30"
 */
export function parseScheduleTimeLine(timeLine) {
  const raw = (timeLine ?? "").replace(/^時間：/, "").trim();
  if (!raw) return { open_time: null, start_time: null, time_note: null };

  const open = raw.match(/開場\s*([0-9]{1,2}:[0-9]{2})/);
  const start = raw.match(/開演\s*([0-9]{1,2}:[0-9]{2})/);
  if (open || start) {
    return {
      open_time: open?.[1] ?? null,
      start_time: start?.[1] ?? null,
      time_note: null,
    };
  }
  return { open_time: null, start_time: null, time_note: raw };
}

function decodeHtmlEntities(text) {
  return (text ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripPrefix(line, prefix) {
  if (line.startsWith(prefix)) return line.slice(prefix.length).trim();
  return null;
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Element} cardEl
 */
function parseScheduleCard($, cardEl, ctx) {
  const body = $(cardEl).find(".schedule-card__body").first();
  const dateText = body.find(".schedule-card__date").first().text().trim();
  const { iso, display } = parseScheduleDateText(dateText);
  const explicitTitle = body.find(".schedule-card__title").first().text().trim();

  let venue = null;
  let open_time = null;
  let start_time = null;
  let time_note = null;
  let price = null;
  const descriptionParts = [];
  let subtitle = null;
  let venueUrl = null;

  body.find(".schedule-card__meta").each((_, meta) => {
    const raw = decodeHtmlEntities($(meta).text().replace(/\s+/g, " "));
    if (!raw) return;

    const venueVal = stripPrefix(raw, "会場：");
    if (venueVal != null) {
      venue = venueVal;
      return;
    }

    if (raw.startsWith("時間：")) {
      const parsed = parseScheduleTimeLine(raw);
      open_time = parsed.open_time;
      start_time = parsed.start_time;
      time_note = parsed.time_note;
      return;
    }

    const priceVal = stripPrefix(raw, "料金：");
    if (priceVal != null) {
      price = priceVal || null;
      return;
    }

    const performers = stripPrefix(raw, "出演：");
    if (performers != null) {
      descriptionParts.push(`出演：${performers}`);
      return;
    }

    if (raw.startsWith("Special Guest")) {
      descriptionParts.push(raw);
      return;
    }

    if (raw.startsWith("会場website")) {
      const link = $(meta).find("a[href]").attr("href");
      if (link) venueUrl = link;
      else if (!raw.endsWith("：") && !raw.endsWith(":")) descriptionParts.push(raw);
      return;
    }

    if (!subtitle && (raw.startsWith("<") || raw.startsWith("＜"))) {
      subtitle = raw;
      return;
    }

    descriptionParts.push(raw);
  });

  const title = explicitTitle || subtitle || null;
  let description = descriptionParts.filter(Boolean).join("\n");
  if (time_note) {
    description = description ? `時間：${time_note}\n${description}` : `時間：${time_note}`;
  }
  if (venueUrl) {
    description = description
      ? `${description}\n会場website: ${venueUrl}`
      : `会場website: ${venueUrl}`;
  }
  if (!description) description = null;

  const img = $(cardEl).find(".schedule-card__flyer img").first().attr("src");
  const image = img?.trim() || null;

  ctx.index += 1;
  const id = `schedule-${ctx.month}-${String(ctx.index).padStart(3, "0")}`;

  return {
    id,
    date: iso,
    date_display: display,
    year: ctx.year,
    month: ctx.month,
    title,
    venue,
    open_time,
    start_time,
    price,
    description,
    image,
    source_file: ctx.sourceFile,
    source_route: ctx.sourceRoute,
    published: true,
  };
}

/**
 * @param {string} filePath absolute path to schedule-YYYY-MM.html
 */
export function extractSchedulesFromHtmlFile(filePath) {
  const fileName = path.basename(filePath);
  const match = fileName.match(SCHEDULE_FILE_RE);
  if (!match) return null;

  const year = Number(match[1]);
  const monthNum = match[2];
  const month = `${match[1]}-${monthNum}`;
  const sourceRoute = htmlFileToAstroRoute(fileName);
  const html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);

  const heading = $("main h1.page-heading").first().text().trim() || null;
  const ctx = {
    month,
    year,
    sourceFile: fileName,
    sourceRoute,
    index: 0,
  };

  const events = [];
  $("main .schedule-list > li.schedule-card").each((_, el) => {
    events.push(parseScheduleCard($, el, ctx));
  });

  return {
    month,
    year,
    label: `${match[1]}.${monthNum}`,
    route: sourceRoute,
    heading,
    source_file: fileName,
    count: events.length,
    events,
  };
}

export function extractAllScheduleSeeds(inputDir) {
  const inputAbs = path.resolve(inputDir);
  const htmlFiles = walkHtmlFiles(inputAbs).filter((f) => SCHEDULE_FILE_RE.test(f));

  const months = [];
  const schedules = [];
  const filesProcessed = [];
  const extractionStats = {
    totalEvents: 0,
    withDate: 0,
    withTitle: 0,
    withVenue: 0,
    withOpenTime: 0,
    withStartTime: 0,
    withPrice: 0,
    withDescription: 0,
    withImage: 0,
    missingDate: 0,
  };

  for (const rel of htmlFiles.sort()) {
    const full = path.join(inputAbs, rel);
    const result = extractSchedulesFromHtmlFile(full);
    if (!result) continue;

    filesProcessed.push(rel);
    months.push({
      month: result.month,
      label: result.label,
      route: result.route,
      heading: result.heading,
      count: result.count,
      source_file: result.source_file,
    });
    for (const ev of result.events) {
      schedules.push(ev);
      extractionStats.totalEvents += 1;
      if (ev.date) extractionStats.withDate += 1;
      else extractionStats.missingDate += 1;
      if (ev.title) extractionStats.withTitle += 1;
      if (ev.venue) extractionStats.withVenue += 1;
      if (ev.open_time) extractionStats.withOpenTime += 1;
      if (ev.start_time) extractionStats.withStartTime += 1;
      if (ev.price) extractionStats.withPrice += 1;
      if (ev.description) extractionStats.withDescription += 1;
      if (ev.image) extractionStats.withImage += 1;
    }
  }

  months.sort((a, b) => b.month.localeCompare(a.month));
  schedules.sort((a, b) => {
    if (a.month !== b.month) return b.month.localeCompare(a.month);
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return a.id.localeCompare(b.id);
  });

  return {
    inputDir: inputAbs,
    filesProcessed,
    months,
    schedules,
    extractionStats,
  };
}

export function writeScheduleSeedJson({ months, schedules }, outDir) {
  const outAbs = path.resolve(outDir);
  fs.mkdirSync(outAbs, { recursive: true });

  const schedulesPath = path.join(outAbs, "schedules.json");
  const monthsPath = path.join(outAbs, "schedule-months.json");

  fs.writeFileSync(schedulesPath, `${JSON.stringify(schedules, null, 2)}\n`, "utf8");
  fs.writeFileSync(monthsPath, `${JSON.stringify(months, null, 2)}\n`, "utf8");

  return { schedulesPath, monthsPath };
}

export function formatScheduleSeedReport({
  inputDir,
  filesProcessed,
  months,
  schedules,
  extractionStats,
  schedulesPath,
  monthsPath,
  dataDrivenPages,
  htmlBasedPages,
}) {
  const total = extractionStats.totalEvents;
  const pct = (n) => (total ? ((n / total) * 100).toFixed(1) : "0");

  return [
    "# Schedule Seed Report",
    "",
    "Generated by static-to-astro (Phase 3-B).",
    "",
    "## Metadata",
    "",
    `- **Input directory:** \`${inputDir}\``,
    `- **Extracted at:** ${new Date().toISOString()}`,
    `- **Source files:** ${filesProcessed.length}`,
    `- **Output:** \`${schedulesPath}\`, \`${monthsPath}\``,
    "",
    "## Extraction summary",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| Total events | ${total} |`,
    `| Months | ${months.length} |`,
    `| Events with \`date\` (ISO) | ${extractionStats.withDate} (${pct(extractionStats.withDate)}%) |`,
    `| Events missing \`date\` | ${extractionStats.missingDate} |`,
    `| With \`title\` | ${extractionStats.withTitle} (${pct(extractionStats.withTitle)}%) |`,
    `| With \`venue\` | ${extractionStats.withVenue} (${pct(extractionStats.withVenue)}%) |`,
    `| With \`open_time\` | ${extractionStats.withOpenTime} (${pct(extractionStats.withOpenTime)}%) |`,
    `| With \`start_time\` | ${extractionStats.withStartTime} (${pct(extractionStats.withStartTime)}%) |`,
    `| With \`price\` | ${extractionStats.withPrice} (${pct(extractionStats.withPrice)}%) |`,
    `| With \`description\` | ${extractionStats.withDescription} (${pct(extractionStats.withDescription)}%) |`,
    `| With \`image\` | ${extractionStats.withImage} (${pct(extractionStats.withImage)}%) |`,
    "",
    "### Per-month counts",
    "",
    "| Month | Route | Events | Source |",
    "| --- | --- | ---: | --- |",
    ...months.map(
      (m) => `| ${m.month} | \`${m.route}\` | ${m.count} | \`${m.source_file}\` |`,
    ),
    "",
    "## Extraction targets",
    "",
    filesProcessed.map((f) => `- \`${f}\``).join("\n"),
    "",
    "## Successfully extracted fields",
    "",
    "- `id`, `month`, `year`, `source_file`, `source_route`, `published` — always set",
    "- `date` — from `.schedule-card__date` when format is `YYYY.MM.DD`",
    "- `date_display` — original date line preserved for rendering",
    "- `title` — `.schedule-card__title` or first act-name meta (`<...>`)",
    "- `venue`, `open_time`, `start_time`, `price` — from prefixed meta lines (`会場：`, `時間：`, `料金：`)",
    "- `description` — `出演：`, Special Guest, and other non-structured meta",
    "- `image` — flyer `<img src>` only when present (most gosaki cards use placeholder)",
    "",
    "## Fields often empty (not guessed)",
    "",
    "- `image` — placeholder divs without `<img>` → `null`",
    "- `open_time` / `start_time` — when `時間：` is empty or non-standard (e.g. `17:00〜19:00` → stored in `description`)",
    "- `title` — when only venue/act meta exists without title line",
    "",
    "## Data-driven pages (Phase 3-B)",
    "",
    ...dataDrivenPages.map((p) => `- \`${p}\``),
    "",
    "## Still HTML-based (if any)",
    "",
    htmlBasedPages.length
      ? htmlBasedPages.map((p) => `- \`${p}\``).join("\n")
      : "_None — month pages use JSON via ScheduleList.astro._",
    "",
    "## Supabase schema proposal",
    "",
    "### `schedules`",
    "",
    "```sql",
    "create table schedules (",
    "  id uuid primary key default gen_random_uuid(),",
    "  legacy_id text unique,",
    "  event_date date,",
    "  month_slug text not null,",
    "  title text,",
    "  venue text,",
    "  open_time text,",
    "  start_time text,",
    "  price text,",
    "  description text,",
    "  flyer_image_url text,",
    "  sort_order int default 0,",
    "  published boolean default true,",
    "  created_at timestamptz default now(),",
    "  updated_at timestamptz default now()",
    ");",
    "```",
    "",
    "### `schedule_months`",
    "",
    "```sql",
    "create table schedule_months (",
    "  month_slug text primary key,",
    "  label text not null,",
    "  heading text,",
    "  route_path text,",
    "  sort_order int default 0,",
    "  published boolean default true",
    ");",
    "```",
    "",
    "## Supabase migration notes",
    "",
    "- Map JSON `id` → `legacy_id` for traceability; use UUID as PK in Supabase",
    "- `event_date` from ISO `date`; keep `date_display` only in UI layer if needed",
    "- Images: migrate Wix/static URLs to Supabase Storage before swapping `flyer_image_url`",
    "- Home weekly schedule (`HOME_LIVE_SCHEDULE`) is **not** in this seed — separate table or featured flag",
    "- RLS: public read for `published = true`; writes via service role / admin only",
    "",
    "## Manual review checklist",
    "",
    "- [ ] Events with empty `時間：` / `料金：` — confirm intentional",
    "- [ ] Non-standard time lines merged into `description`",
    "- [ ] Flyer images mostly null — asset migration pending",
    "- [ ] Month headings (`July , 2026`) — verify display on month pages",
    "- [ ] Home page schedule block still static HTML until Phase 3-C",
    "",
    "## Next phase (3-C) suggestions",
    "",
    "- Home `HOME_LIVE_SCHEDULE` from JSON (featured / date range query)",
    "- Discography seed extraction (same pattern)",
    "- Supabase seed script from `schedules.json`",
    "- Admin UI for schedule CRUD in tooling sandbox",
    "",
  ].join("\n");
}

const SCHEDULE_LIST_ASTRO = `---
/**
 * Renders schedule cards from JSON seed (Phase 3-B).
 * @see src/data/schedules.json
 */
interface ScheduleEvent {
  id: string;
  date: string | null;
  date_display?: string | null;
  title?: string | null;
  venue?: string | null;
  open_time?: string | null;
  start_time?: string | null;
  price?: string | null;
  description?: string | null;
  image?: string | null;
}

interface Props {
  events: ScheduleEvent[];
}

const { events } = Astro.props;

function formatTimeLine(ev: ScheduleEvent) {
  if (ev.open_time && ev.start_time) {
    return \`開場 \${ev.open_time} / 開演 \${ev.start_time}\`;
  }
  if (ev.open_time) return \`開場 \${ev.open_time}\`;
  if (ev.start_time) return \`開演 \${ev.start_time}\`;
  return "";
}

function descriptionLines(text: string | null | undefined) {
  if (!text) return [];
  return text.split(/\\n/).filter(Boolean);
}
---

<div class="surface-block">
  <ul class="schedule-list">
    {
      events.map((ev) => {
        const timeLine = formatTimeLine(ev);
        const extraLines = descriptionLines(ev.description);
        return (
          <li class="schedule-card">
            <div class="schedule-card__body">
              {ev.date_display && <p class="schedule-card__date">{ev.date_display}</p>}
              {ev.title && <p class="schedule-card__title">{ev.title}</p>}
              {ev.venue && <p class="schedule-card__meta">会場：{ev.venue}</p>}
              {(timeLine || ev.description?.startsWith("時間：")) && (
                <p class="schedule-card__meta">
                  時間：{timeLine || ev.description?.replace(/^時間：/, "")}
                </p>
              )}
              {ev.price && <p class="schedule-card__meta">料金：{ev.price}</p>}
              {extraLines.map((line) => {
                if (line.startsWith("時間：") && !timeLine) return null;
                return <p class="schedule-card__meta">{line}</p>;
              })}
            </div>
            <div class="schedule-card__flyer">
              {ev.image ? (
                <img src={ev.image} alt="" width="200" height="200" loading="lazy" />
              ) : (
                <div class="flyer-placeholder" role="img" aria-label="Flyer pending">
                  Flyer / Image pending
                </div>
              )}
            </div>
          </li>
        );
      })
    }
  </ul>
</div>
`;

function monthPageAstro(monthMeta, siteBase = "https://www.gosaki-piano.com") {
  const slug = monthMeta.month;
  const route = monthMeta.route;
  const titlePart = monthMeta.label.replace(".", "");
  return `---
import BaseLayout from "../../layouts/BaseLayout.astro";
import ScheduleList from "../../components/ScheduleList.astro";
import schedules from "../../data/schedules.json";

const MONTH = "${slug}";
const events = schedules.filter((s) => s.month === MONTH);
---

<BaseLayout
  title="Schedule ${titlePart} | saki-goto"
  canonical="${siteBase}${route}"
  ogTitle="Schedule ${titlePart} | saki-goto"
  ogType="website"
  ogUrl="${siteBase}${route}"
  twitterCard="summary_large_image"
  lang="ja"
>
  <h1 class="page-heading">${monthMeta.heading ?? `Schedule ${monthMeta.label}`}</h1>
  <section class="section-block">
    <!-- CMS_TARGET: SCHEDULE_MONTH_LIST (data-driven Phase 3-B) -->
    <ScheduleList events={events} />
  </section>
</BaseLayout>
`;
}

const SCHEDULE_INDEX_ASTRO = `---
import BaseLayout from "../../layouts/BaseLayout.astro";
import scheduleMonths from "../../data/schedule-months.json";
---

<BaseLayout
  title="Schedule | saki-goto"
  canonical="https://www.gosaki-piano.com/schedule/"
  ogTitle="Schedule | saki-goto"
  ogType="website"
  ogUrl="https://www.gosaki-piano.com/schedule/"
  twitterCard="summary_large_image"
  lang="ja"
>
  <h1 class="page-heading">Schedule</h1>
  <section class="section-block">
    <!-- CMS_TARGET: SCHEDULE_INDEX (data-driven Phase 3-B) -->
    <ul class="link-list">
      {scheduleMonths.map((m) => (
        <li>
          <h3>
            <a href={m.route}>{m.label}</a>
          </h3>
          <p class="prototype-note">{m.count} event(s)</p>
        </li>
      ))}
    </ul>
  </section>
</BaseLayout>
`;

export function applyScheduleDataViews(astroProjectDir, months) {
  const astroAbs = path.resolve(astroProjectDir);
  const componentsDir = path.join(astroAbs, "src", "components");
  const pagesDir = path.join(astroAbs, "src", "pages");

  fs.mkdirSync(componentsDir, { recursive: true });
  fs.writeFileSync(path.join(componentsDir, "ScheduleList.astro"), SCHEDULE_LIST_ASTRO, "utf8");
  fs.writeFileSync(path.join(pagesDir, "schedule", "index.astro"), SCHEDULE_INDEX_ASTRO, "utf8");

  const dataDriven = ["/schedule/"];
  const htmlBased = [];

  for (const m of months) {
    const routeSlug = m.month;
    const pageDir = path.join(pagesDir, `schedule-${routeSlug}`);
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, "index.astro"), monthPageAstro(m), "utf8");
    dataDriven.push(m.route);
  }

  return { dataDrivenPages: dataDriven, htmlBasedPages: htmlBased };
}

export function appendScheduleSeedToConversionReport(astroDir, summary) {
  const conversionPath = path.join(path.resolve(astroDir), "CONVERSION_REPORT.md");
  if (!fs.existsSync(conversionPath)) return;

  const block = [
    "",
    "## Schedule seed (Phase 3-B)",
    "",
    `- **Seed report:** \`${summary.reportRel}\``,
    `- **schedules.json:** ${summary.schedulesWritten ? "yes" : "no"} (\`${summary.schedulesRel}\`)`,
    `- **schedule-months.json:** ${summary.monthsWritten ? "yes" : "no"} (\`${summary.monthsRel}\`)`,
    `- **Events extracted:** ${summary.eventCount}`,
    `- **Months:** ${summary.monthCount}`,
    `- **Data-driven pages:** ${summary.dataDrivenPages.map((p) => `\`${p}\``).join(", ")}`,
    `- **Still HTML-based:** ${summary.htmlBasedPages.length ? summary.htmlBasedPages.map((p) => `\`${p}\``).join(", ") : "month pages migrated; Home weekly schedule still static"}`,
    "",
    "### Phase 3-C (planned)",
    "",
    "- Home `HOME_LIVE_SCHEDULE` from JSON / featured events",
    "- Discography JSON seed",
    "- Supabase import script + Storage for flyers",
    "",
  ].join("\n");

  let content = fs.readFileSync(conversionPath, "utf8");
  const marker = "## Schedule seed (Phase 3-B)";
  if (content.includes(marker)) {
    content = `${content.split(marker)[0].trimEnd()}${block}`;
  } else {
    content = `${content.trimEnd()}${block}`;
  }
  fs.writeFileSync(conversionPath, content, "utf8");
}

export function runScheduleSeedPipeline({ inputDir, outDir, reportPath, astroDir }) {
  const extracted = extractAllScheduleSeeds(inputDir);
  const { schedulesPath, monthsPath } = writeScheduleSeedJson(extracted, outDir);

  const astroProjectDir = astroDir ?? path.resolve(outDir, "../..");
  const { dataDrivenPages, htmlBasedPages } = applyScheduleDataViews(
    astroProjectDir,
    extracted.months,
  );

  const reportContent = formatScheduleSeedReport({
    ...extracted,
    schedulesPath,
    monthsPath,
    dataDrivenPages,
    htmlBasedPages,
  });

  const reportAbs = path.resolve(reportPath);
  fs.mkdirSync(path.dirname(reportAbs), { recursive: true });
  fs.writeFileSync(reportAbs, reportContent, "utf8");

  const astroAbs = path.resolve(astroProjectDir);
  appendScheduleSeedToConversionReport(astroAbs, {
    reportRel: path.relative(astroAbs, reportAbs),
    schedulesRel: path.relative(astroAbs, schedulesPath),
    monthsRel: path.relative(astroAbs, monthsPath),
    schedulesWritten: true,
    monthsWritten: true,
    eventCount: extracted.extractionStats.totalEvents,
    monthCount: extracted.months.length,
    dataDrivenPages,
    htmlBasedPages,
  });

  return {
    ...extracted,
    schedulesPath,
    monthsPath,
    reportPath: reportAbs,
    dataDrivenPages,
    htmlBasedPages,
  };
}
