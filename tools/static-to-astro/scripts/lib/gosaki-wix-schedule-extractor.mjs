import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { htmlFileToAstroRoute, walkHtmlFiles } from "./static-site-analyzer.mjs";
import { LIVE_CRAWL_MONTH_FILENAME } from "./schedule-pages.mjs";
import {
  parseScheduleDateText,
  parseScheduleTimeLine,
} from "./schedule-seed-extractor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOOL_ROOT = path.resolve(__dirname, "../..");
const require = createRequire(path.join(TOOL_ROOT, "package.json"));
const cheerio = require("cheerio");

export const GOSAKI_SITE_SLUG = "gosaki-piano";

const GOSAKI_SCHEDULE_FILE_RE = LIVE_CRAWL_MONTH_FILENAME;

function decodeHtmlEntities(text) {
  return (text ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\u200b/g, "")
    .trim();
}

function normalizeLine(text) {
  return decodeHtmlEntities((text ?? "").replace(/\s+/g, " "));
}

function stripPrefix(line, prefix) {
  if (line.startsWith(prefix)) return line.slice(prefix.length).trim();
  return null;
}

function stripAngleBrackets(text) {
  const t = (text ?? "").trim();
  const m = t.match(/^[＜<](.+)[＞>]$/);
  return m ? m[1].trim() : t;
}

function splitH1DateAndTitle(h1Text) {
  const raw = normalizeLine(h1Text);
  const { iso, display } = parseScheduleDateText(raw);
  if (!iso) return { dateText: raw, iso: null, display: raw, explicitTitle: null };

  const afterDate = raw
    .replace(/^\d{4}\.\d{2}\.\d{2}\s*\([^)]+\)/, "")
    .trim();
  const explicitTitle = afterDate ? stripAngleBrackets(afterDate) : null;
  const dateText = display ?? raw;
  return { dateText, iso, display: dateText, explicitTitle: explicitTitle || null };
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Element} itemEl
 */
function collectMetaLines($, itemEl) {
  const lines = [];
  const seen = new Set();
  $(itemEl)
    .find("p")
    .each((_, p) => {
      const raw = normalizeLine($(p).text());
      if (!raw || seen.has(raw)) return;
      seen.add(raw);
      lines.push(raw);
    });
  return lines;
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Element} itemEl
 * @param {{ month: string, year: number, sourceFile: string, sourceRoute: string, index: number }} ctx
 */
export function parseGosakiWixRepeaterItem($, itemEl, ctx) {
  const h1Text = $(itemEl).find("h1").first().text();
  const { iso, display, explicitTitle: h1Title } = splitH1DateAndTitle(h1Text);
  const h6Text = normalizeLine($(itemEl).find("h6").first().text());
  const subtitle =
    h6Text && (h6Text.startsWith("<") || h6Text.startsWith("＜")) ? h6Text : null;

  let venue = null;
  let open_time = null;
  let start_time = null;
  let time_note = null;
  let price = null;
  const descriptionParts = [];
  let venueUrl = null;

  for (const raw of collectMetaLines($, itemEl)) {
    const venueVal = stripPrefix(raw, "会場：");
    if (venueVal != null) {
      venue = venueVal;
      continue;
    }

    if (raw.startsWith("時間：")) {
      const parsed = parseScheduleTimeLine(raw);
      open_time = parsed.open_time;
      start_time = parsed.start_time;
      time_note = parsed.time_note;
      continue;
    }

    const priceVal = stripPrefix(raw, "料金：");
    if (priceVal != null) {
      price = priceVal || null;
      continue;
    }

    const performers = stripPrefix(raw, "出演：");
    if (performers != null) {
      descriptionParts.push(`出演：${performers}`);
      continue;
    }

    if (raw.startsWith("Special Guest")) {
      descriptionParts.push(raw);
      continue;
    }

    if (raw.startsWith("会場website")) {
      const link = $(itemEl).find('a[href^="http"]').first().attr("href");
      if (link) venueUrl = link.trim();
      else if (!raw.endsWith("：") && !raw.endsWith(":")) descriptionParts.push(raw);
      continue;
    }

    if (!subtitle && (raw.startsWith("<") || raw.startsWith("＜"))) {
      // manual fixture fallback — Wix crawl uses h6 instead
      descriptionParts.push(raw);
      continue;
    }

    descriptionParts.push(raw);
  }

  const title = h1Title || subtitle || null;
  if (subtitle && h1Title && subtitle !== h1Title) {
    descriptionParts.unshift(subtitle);
  }

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

  const img = $(itemEl).find("img[src]").first().attr("src");
  const image_url = img?.trim() || null;

  ctx.index += 1;
  const legacy_id = `schedule-${ctx.month}-${String(ctx.index).padStart(3, "0")}`;

  return {
    site_slug: GOSAKI_SITE_SLUG,
    legacy_id,
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
    image_url,
    source_file: ctx.sourceFile,
    source_route: ctx.sourceRoute,
    published: true,
    sort_order: ctx.index * 10,
  };
}

/**
 * @param {string} filePath absolute path to YYYY-MM.html (live crawl) or schedule-YYYY-MM.html
 */
export function extractGosakiWixSchedulesFromHtmlFile(filePath) {
  const fileName = path.basename(filePath);
  const match = fileName.match(GOSAKI_SCHEDULE_FILE_RE);
  if (!match) return null;

  const year = Number(match[1]);
  const monthNum = match[2];
  const month = `${match[1]}-${monthNum}`;
  const sourceRoute = htmlFileToAstroRoute(fileName);
  const html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);

  const heading =
    $("h2").first().text().replace(/\s+/g, " ").trim() ||
    $("main h1").first().text().replace(/\s+/g, " ").trim() ||
    null;

  const ctx = {
    month,
    year,
    sourceFile: fileName,
    sourceRoute,
    index: 0,
  };

  const events = [];
  const warnings = [];

  $(".wixui-repeater__item").each((_, el) => {
    const parsed = parseGosakiWixRepeaterItem($, el, ctx);
    if (!parsed.date) {
      warnings.push({
        legacy_id: parsed.legacy_id,
        issue: "missing_date",
        date_display: parsed.date_display,
      });
    }
    events.push(parsed);
  });

  if (events.length === 0) {
    const repeaterCount = $("fluid-columns-repeater").length;
    if (repeaterCount === 0) {
      warnings.push({ issue: "no_wix_repeater", source_file: fileName });
    } else {
      warnings.push({ issue: "empty_repeater_items", source_file: fileName });
    }
  }

  return {
    month,
    year,
    label: `${match[1]}.${monthNum}`,
    route: sourceRoute,
    heading,
    source_file: fileName,
    count: events.length,
    events,
    warnings,
  };
}

/**
 * @param {string} inputDir fixtures/gosaki-piano or similar
 */
export function extractAllGosakiScheduleSeeds(inputDir) {
  const inputAbs = path.resolve(inputDir);
  const htmlFiles = walkHtmlFiles(inputAbs).filter((f) =>
    GOSAKI_SCHEDULE_FILE_RE.test(path.posix.basename(f)),
  );

  const months = [];
  const schedules = [];
  const filesProcessed = [];
  const allWarnings = [];
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
    emptyTime: 0,
    nonStandardTime: 0,
  };

  for (const rel of htmlFiles.sort()) {
    const full = path.join(inputAbs, rel);
    const result = extractGosakiWixSchedulesFromHtmlFile(full);
    if (!result) continue;

    filesProcessed.push(rel);
    months.push({
      site_slug: GOSAKI_SITE_SLUG,
      month: result.month,
      label: result.label,
      route: result.route,
      heading: result.heading,
      count: result.count,
      source_file: result.source_file,
      published: true,
      sort_order: Number(result.month.replace("-", "")),
    });
    allWarnings.push(...(result.warnings ?? []));

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
      if (ev.image_url) extractionStats.withImage += 1;
      if (ev.description?.startsWith("時間：") && !ev.open_time && !ev.start_time) {
        extractionStats.nonStandardTime += 1;
      }
      if (!ev.open_time && !ev.start_time) extractionStats.emptyTime += 1;
    }
  }

  months.sort((a, b) => b.month.localeCompare(a.month));
  schedules.sort((a, b) => {
    if (a.month !== b.month) return b.month.localeCompare(a.month);
    if (a.date && b.date) return a.date.localeCompare(b.date);
    return a.legacy_id.localeCompare(b.legacy_id);
  });

  return {
    inputDir: inputAbs,
    site_slug: GOSAKI_SITE_SLUG,
    filesProcessed,
    months,
    schedules,
    extractionStats,
    warnings: allWarnings,
  };
}

export function writeGosakiScheduleSeedJson({ months, schedules }, outDir) {
  const outAbs = path.resolve(outDir);
  fs.mkdirSync(outAbs, { recursive: true });

  const schedulesPath = path.join(outAbs, "schedules.json");
  const monthsPath = path.join(outAbs, "schedule-months.json");

  fs.writeFileSync(schedulesPath, `${JSON.stringify(schedules, null, 2)}\n`, "utf8");
  fs.writeFileSync(monthsPath, `${JSON.stringify(months, null, 2)}\n`, "utf8");

  return { schedulesPath, monthsPath };
}
