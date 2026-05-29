#!/usr/bin/env node
/**
 * WordPress LIVE SCHEDULE → schedules 形式 JSON
 *
 * Usage:
 *   node scripts/import-schedule-from-wp.mjs
 *   node scripts/import-schedule-from-wp.mjs path/to/article.html
 *   node scripts/import-schedule-from-wp.mjs scripts/fixtures/sari.WordPress.2026-05-26.xml
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_HTML_INPUT = path.join(__dirname, "fixtures/wp-8月-live-schedule-2026.html");
const DEFAULT_HTML_OUTPUT = path.join(__dirname, "test-import.json");
const DEFAULT_XML_INPUT = path.join(__dirname, "fixtures/sari.WordPress.2026-05-26.xml");
const XML_SCHEDULES_OUTPUT = path.join(__dirname, "wp-schedules-2025-2026.json");
const XML_REPORT_OUTPUT = path.join(__dirname, "wp-schedules-2025-2026-report.json");
const TARGET_YEARS = ["2025", "2026"];

const DAY_SYMBOLS = ["☀", "☀︎"];
const NIGHT_SYMBOLS = ["☽", "▶", "▶︎", "►"];
const SPECIAL_TITLE_PATTERN = /TOUR|ツアー|SPECIAL|スペシャル/i;

/**
 * @param {string} html
 */
export function extractEntryContent(html) {
  const match = html.match(/<div class="entry-content">([\s\S]*?)<\/div><!-- \.entry-content -->/i);
  if (match) return match[1];

  const fallback = html.match(/<div class="entry-content">([\s\S]*?)<\/div>/i);
  return fallback ? fallback[1] : html;
}

/**
 * @param {string} html
 */
export function extractArticleYear(html) {
  const titleMatch = html.match(/<h1 class="entry-title">([^<]+)<\/h1>/i);
  if (!titleMatch) return new Date().getFullYear();

  const yearMatch = titleMatch[1].match(/(\d{4})/);
  return yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
}

/**
 * @param {string} html
 */
function extractArticleTitle(html) {
  const titleMatch = html.match(/<h1 class="entry-title">([^<]+)<\/h1>/i);
  return titleMatch ? titleMatch[1].trim() : "";
}

/**
 * @param {string} title
 * @param {string} content
 */
export function wrapArticleHtml(title, content) {
  return `<h1 class="entry-title">${title}</h1><div class="entry-content">${content}</div>`;
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

/**
 * @param {string} html
 */
function htmlToText(html) {
  return decodeHtmlEntities(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#x260e;︎?/gi, "☎")
    .replace(/&#x1f3b9;/gi, "🎹")
    .replace(/&#x1f556;/gi, "")
    .replace(/&#x1f4b5;/gi, "")
    .replace(/&#x1f517;/gi, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * @param {string} text
 */
function normalizePrice(text) {
  if (!text) return null;

  let normalized = text.replace(/¥/g, "").replace(/(\d+)\s*-+/g, "$1円").replace(/\s+/g, " ").trim();

  normalized = normalized.replace(/予約\s*/i, "予約");
  normalized = normalized.replace(/当日\s*/i, " / 当日");

  return normalized.replace(/\s+\/\s+/g, " / ").trim();
}

/**
 * @param {string} htmlOrText
 */
function parseMembers(htmlOrText) {
  const text = htmlOrText.includes("<") ? htmlToText(htmlOrText) : htmlOrText;
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const memberLines = lines.filter(
    (line) =>
      /^(ピ|チェ|ヴォ)\s/.test(line) ||
      /^🎹/.test(line) ||
      (/\((vo|pf|gt|ts|bs|dr|cello|Vo|Pf)\)/i.test(line) && !/^OPEN|^START|^予約|^https?:\/\//i.test(line))
  );

  if (memberLines.length === 0) return null;

  return memberLines
    .map((line) =>
      line
        .replace(/^🎹\s*/, "")
        .replace(/^(ピ|チェ|ヴォ)\s+/, "")
        .replace(/\s+/g, " ")
        .replace(/（/g, "(")
        .replace(/）/g, ")")
        .trim()
    )
    .join(" / ");
}

/**
 * @param {string} locationText
 */
function parseVenueName(locationText) {
  const text = locationText.trim();
  if (!text) return null;

  const westernVenue = text.match(/\s([A-Za-z0-9][\w\s.'&-]+)$/);
  if (westernVenue) return westernVenue[1].trim();

  return text;
}

/**
 * @param {string} symbol
 */
function parseTimeType(symbol) {
  if (DAY_SYMBOLS.some((s) => symbol.includes(s))) return "day";
  if (NIGHT_SYMBOLS.some((s) => symbol.includes(s))) return "night";
  return null;
}

/**
 * @param {string | null | undefined} value
 */
export function normalizeTimeType(value) {
  if (value === "day") return "昼";
  if (value === "night") return "夜";
  return value ?? null;
}

/**
 * @param {string} articleTitle
 */
export function inferIsSpecialFromTitle(articleTitle) {
  return SPECIAL_TITLE_PATTERN.test(articleTitle);
}

/**
 * @param {Record<string, unknown>} record
 * @param {string} articleTitle
 */
export function normalizeScheduleRecord(record, articleTitle) {
  return {
    ...record,
    time_type: normalizeTimeType(record.time_type),
    is_published: true,
    is_special: inferIsSpecialFromTitle(articleTitle),
  };
}

/**
 * @param {string} headingHtml
 */
function parseGenreFromHeading(headingHtml) {
  const text = htmlToText(headingHtml).replace(/\s+/g, " ").trim();
  const genreMatch = text.match(/\b(SWING JAZZ|JAZZ|POPS|SWING)\b/i);
  return genreMatch ? genreMatch[1].toUpperCase() : null;
}

/**
 * @param {string} headingHtml
 * @param {number} year
 */
function parseScheduleHeading(headingHtml, year) {
  const text = htmlToText(headingHtml).replace(/\s+/g, " ").trim();

  if (/昼のLIVE|夜のLIVE/.test(text)) return null;
  if (/To be announced|情報公開まで/.test(text)) return null;
  if (/^＜.+＞$/.test(text)) return null;
  if (/^「.+」$/.test(text) && !/\d{1,2}\/\d{1,2}/.test(text)) return null;

  const symbolMatch = text.match(/^(☀︎|☀|☽|▶︎|▶|►)/);
  if (!symbolMatch) return null;

  const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\([^)]+\)/);
  if (!dateMatch) return null;

  const month = dateMatch[1].padStart(2, "0");
  const day = dateMatch[2].padStart(2, "0");
  const date = `${year}-${month}-${day}`;

  const titleMatch = text.match(/＜([^＞]+)＞/);
  const titleFromBracket = titleMatch ? titleMatch[1].trim() : null;
  const genreFromHeading = parseGenreFromHeading(headingHtml);

  let locationText = text
    .replace(/^(☀︎|☀|☽|▶︎|▶|►)\s*/, "")
    .replace(/\d{1,2}\/\d{1,2}\([^)]+\)/, "")
    .replace(/＜[^＞]+＞/g, "")
    .replace(/\b(SWING JAZZ|JAZZ|POPS|SWING)\b/gi, "")
    .trim();

  const venueName = locationText ? parseVenueName(locationText) : null;

  return {
    date,
    time_type: parseTimeType(symbolMatch[1]),
    venue_name: venueName,
    titleFromBracket,
    genreFromHeading,
    locationText,
    sourceLineText: text,
  };
}

/**
 * @param {{ locationText?: string }} heading
 * @param {ReturnType<typeof parseScheduleBody>} body
 */
function isIncompleteSchedule(heading, body) {
  const locationText = heading.locationText ?? "";
  const partialVenue =
    locationText === "" ||
    /^(東京・|横浜・|大阪・|京都・|名古屋・|四日市・|静岡・|埼玉・)\s*$/.test(locationText);

  const hasBodyDetails =
    Boolean(body.open_time) ||
    Boolean(body.start_time) ||
    Boolean(body.price) ||
    Boolean(body.reservation_url) ||
    Boolean(body.members) ||
    Boolean(body.image_url);

  return partialVenue && !hasBodyDetails;
}

/**
 * @param {string} bodyHtml
 */
function parseScheduleBody(bodyHtml) {
  const text = htmlToText(bodyHtml);
  const lines = text
    .split("\n")
    .map((line) => line.replace(/^　+/, "").trim())
    .filter(Boolean);

  const openMatch =
    text.match(/(\d{1,2}:\d{2})\s*open/i) || text.match(/open\s*(\d{1,2}:\d{2})/i);
  const startMatch =
    text.match(/(\d{1,2}:\d{2})\s*start/i) || text.match(/start\s*(\d{1,2}:\d{2})/i);

  const urlMatch = bodyHtml.match(/href="(https?:\/\/[^"]+)"/i);
  const imageMatch = bodyHtml.match(/<img[^>]+src="(https?:\/\/[^"]+)"/i);

  const priceLine = lines.find((line) => /予約|当日|¥|円|1st|2nd|通し|Male|Female|charge/i.test(line));
  const noteLines = lines.filter(
    (line) =>
      !/(\d{1,2}:\d{2})\s*(open|start)/i.test(line) &&
      !/^open\s*\d/i.test(line) &&
      !/^start\s*\d/i.test(line) &&
      !/^(予約|当日|1st|2nd|通し|Male|Female)/i.test(line) &&
      !/^https?:\/\//.test(line) &&
      !/^ご予約/.test(line) &&
      !/^☎/.test(line) &&
      !/^🎹/.test(line) &&
      !/\((vo|pf|gt|ts|bs|dr|Vo|Pf)\)/i.test(line)
  );

  const reservationLine = lines.find((line) => /^ご予約/.test(line) || /^☎/.test(line));
  const note = [...noteLines, reservationLine].filter(Boolean).join(" ") || null;
  const members = parseMembers(bodyHtml);

  return {
    open_time: openMatch ? openMatch[1] : null,
    start_time: startMatch ? startMatch[1] : null,
    price: priceLine ? normalizePrice(priceLine) : null,
    reservation_url: urlMatch ? urlMatch[1] : null,
    image_url: imageMatch ? imageMatch[1] : null,
    note,
    members,
  };
}

/**
 * @param {string} headingHtml
 */
function parseSectionHeading(headingHtml) {
  const text = htmlToText(headingHtml).replace(/\s+/g, " ").trim();

  const tourMatch = text.match(/^「(.+?)」$/);
  if (tourMatch) {
    const rawTitle = tourMatch[1];
    let title = rawTitle;
    let genre = null;

    if (/ピチェヴォ|PiCeVo/i.test(rawTitle)) {
      title = "PiCeVo";
      genre = "JAZZ";
    }

    return { title, genre, rawTitle };
  }

  const bracketMatch = text.match(/^＜(.+?)＞$/);
  if (bracketMatch) {
    return { title: bracketMatch[1], genre: null, rawTitle: bracketMatch[1] };
  }

  return null;
}

/**
 * @param {string} html
 */
export function parseWordPressScheduleHtml(html) {
  const contentHtml = extractEntryContent(html);
  const year = extractArticleYear(html);

  /** @type {Array<Record<string, unknown>>} */
  const schedules = [];

  let currentSection = {
    title: null,
    genre: null,
    members: null,
    note: null,
  };

  const headingRegex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/gi;
  const headings = [];
  let match;

  while ((match = headingRegex.exec(contentHtml)) !== null) {
    headings.push({
      html: match[1],
      start: match.index,
      end: headingRegex.lastIndex,
    });
  }

  for (let i = 0; i < headings.length; i += 1) {
    const { html, end } = headings[i];
    const bodyStart = end;
    const bodyEnd = i + 1 < headings.length ? headings[i + 1].start : contentHtml.length;
    const bodyHtml = contentHtml.slice(bodyStart, bodyEnd);

    const section = parseSectionHeading(html);
    if (section) {
      currentSection = {
        title: section.title,
        genre: section.genre,
        members: parseMembers(bodyHtml),
        note: null,
      };
      continue;
    }

    const heading = parseScheduleHeading(html, year);
    if (!heading) continue;

    const body = parseScheduleBody(bodyHtml);
    const incomplete = isIncompleteSchedule(heading, body);

    /** @type {Record<string, unknown>} */
    const record = {
      date: heading.date,
      time_type: heading.time_type,
      venue_name: heading.venue_name ?? heading.locationText ?? null,
      title: incomplete ? heading.titleFromBracket || null : heading.titleFromBracket || currentSection.title,
      genre: incomplete
        ? heading.genreFromHeading || null
        : heading.genreFromHeading || (heading.titleFromBracket ? null : currentSection.genre),
      open_time: incomplete ? null : body.open_time,
      start_time: incomplete ? null : body.start_time,
      price: incomplete ? null : body.price,
      members: incomplete ? null : body.members || (heading.titleFromBracket ? null : currentSection.members),
      reservation_url: incomplete ? null : body.reservation_url,
      note: incomplete ? heading.sourceLineText : body.note || currentSection.note,
      image_url: incomplete ? null : body.image_url,
      is_special: false,
      is_published: true,
    };

    schedules.push(record);
  }

  return schedules;
}

/**
 * @param {string} wpPostId
 * @param {Record<string, unknown>} record
 */
export function buildImportKey(wpPostId, record) {
  const title = record.title ?? "";
  return `${wpPostId}_${record.date}_${record.venue_name}_${title}`;
}

/**
 * @param {Record<string, unknown>} record
 * @param {{ wp_post_id: string, link: string }} article
 */
export function attachWordPressMetadata(record, article) {
  const enriched = {
    wp_post_id: article.wp_post_id,
    wp_source_url: article.link,
    import_key: buildImportKey(article.wp_post_id, record),
    ...record,
  };

  return enriched;
}

/**
 * 同一 import_key は再インポート重複とみなし、先勝ちで1件だけ残す。
 * @param {Array<Record<string, unknown>>} schedules
 */
export function dedupeByImportKey(schedules) {
  /** @type {Map<string, Record<string, unknown>>} */
  const keptByKey = new Map();
  /** @type {Array<Record<string, unknown>>} */
  const skippedDuplicateImportKeys = [];

  for (const record of schedules) {
    const importKey = String(record.import_key);

    if (!keptByKey.has(importKey)) {
      keptByKey.set(importKey, record);
      continue;
    }

    skippedDuplicateImportKeys.push({
      import_key: importKey,
      skipped: record,
      kept: keptByKey.get(importKey),
    });
  }

  const uniqueSchedules = [...keptByKey.values()].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );

  return {
    schedules: uniqueSchedules,
    skippedDuplicateImportKeys,
  };
}

/**
 * @param {string} xml
 * @param {string} tagName
 */
function extractXmlTag(xml, tagName) {
  const cdataPattern = new RegExp(`<${tagName}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, "i");
  const plainPattern = new RegExp(`<${tagName}>([^<]*)</${tagName}>`, "i");
  const match = xml.match(cdataPattern) || xml.match(plainPattern);
  return match ? match[1].trim() : "";
}

/**
 * @param {string} itemXml
 */
function isLiveScheduleItem(itemXml) {
  return (
    /nicename="live-schedule"/i.test(itemXml) ||
    /<category[^>]*>\s*Live Schedule\s*<\/category>/i.test(itemXml)
  );
}

/**
 * @param {string} title
 * @param {string} content
 */
function isTargetYearArticle(title, content) {
  return TARGET_YEARS.some((year) => title.includes(year) || content.includes(year));
}

/**
 * @param {string} date
 */
function scheduleYearFromDate(date) {
  const match = String(date).match(/^(\d{4})-/);
  return match ? match[1] : null;
}

/**
 * @param {Array<Record<string, unknown>>} schedules
 */
function countSchedulesByYear(schedules) {
  /** @type {Record<string, number>} */
  const counts = Object.fromEntries(TARGET_YEARS.map((year) => [year, 0]));

  for (const record of schedules) {
    const year = scheduleYearFromDate(String(record.date ?? ""));
    if (year && year in counts) {
      counts[year] += 1;
    }
  }

  return counts;
}

/**
 * @param {string} xml
 */
export function parseWordPressXmlItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    if (!isLiveScheduleItem(itemXml)) continue;

    const postType = extractXmlTag(itemXml, "wp:post_type");
    if (postType && postType !== "post") continue;

    const title = extractXmlTag(itemXml, "title");
    const content = extractXmlTag(itemXml, "content:encoded");

    if (!isTargetYearArticle(title, content)) continue;

    items.push({
      wp_post_id: extractXmlTag(itemXml, "wp:post_id"),
      title,
      link: extractXmlTag(itemXml, "link"),
      post_date: extractXmlTag(itemXml, "wp:post_date"),
      content,
    });
  }

  return items;
}

/**
 * @param {string} xml
 */
export function importSchedulesFromWordPressXml(xml) {
  const articles = parseWordPressXmlItems(xml);
  /** @type {Array<Record<string, unknown>>} */
  const schedules = [];
  /** @type {Array<Record<string, unknown>>} */
  const articleReports = [];
  /** @type {Array<Record<string, unknown>>} */
  const emptyArticles = [];

  for (const article of articles) {
    const html = wrapArticleHtml(article.title, article.content);
    const extracted = parseWordPressScheduleHtml(html)
      .map((record) => normalizeScheduleRecord(record, article.title))
      .map((record) => attachWordPressMetadata(record, article));

    articleReports.push({
      wp_post_id: article.wp_post_id,
      title: article.title,
      link: article.link,
      post_date: article.post_date,
      extractedCount: extracted.length,
    });

    if (extracted.length === 0) {
      emptyArticles.push({
        wp_post_id: article.wp_post_id,
        title: article.title,
        link: article.link,
        post_date: article.post_date,
      });
    }

    schedules.push(...extracted);
  }

  const { schedules: uniqueSchedules, skippedDuplicateImportKeys } = dedupeByImportKey(schedules);
  const scheduleCountsByYear = countSchedulesByYear(uniqueSchedules);

  return {
    schedules: uniqueSchedules,
    report: {
      targetYears: TARGET_YEARS.map(Number),
      targetArticleCount: articles.length,
      scheduleCount2025: scheduleCountsByYear["2025"],
      scheduleCount2026: scheduleCountsByYear["2026"],
      totalExtractedCount: uniqueSchedules.length,
      totalParsedCount: schedules.length,
      duplicateImportKeyCount: skippedDuplicateImportKeys.length,
      skippedDuplicateImportKeys,
      uniqueImportKeyCount: uniqueSchedules.length,
      articles: articleReports,
      emptyArticles,
    },
  };
}

function resolveHtmlPaths(argv) {
  const args = argv.slice(2);

  if (args.length === 0) {
    return { inputPath: DEFAULT_HTML_INPUT, outputPath: DEFAULT_HTML_OUTPUT };
  }

  if (args.length === 1) {
    const only = path.resolve(args[0]);
    if (only.endsWith(".json")) {
      return { inputPath: DEFAULT_HTML_INPUT, outputPath: only };
    }
    return { inputPath: only, outputPath: DEFAULT_HTML_OUTPUT };
  }

  return {
    outputPath: path.resolve(args[0]),
    inputPath: path.resolve(args[1]),
  };
}

function runHtmlImport(inputPath, outputPath) {
  const html = fs.readFileSync(inputPath, "utf8");
  const schedules = parseWordPressScheduleHtml(html).map((record) =>
    normalizeScheduleRecord(record, extractArticleTitle(html))
  );

  fs.writeFileSync(outputPath, `${JSON.stringify(schedules, null, 2)}\n`, "utf8");

  console.log(`Parsed ${schedules.length} schedule(s) from ${inputPath}`);
  console.log(`Wrote ${outputPath}`);

  const sample = schedules.find((item) => item.date === "2026-08-21");
  if (sample) {
    console.log("\nSample (2026-08-21):");
    console.log(JSON.stringify(sample, null, 2));
  }
}

function runXmlImport(inputPath) {
  const xml = fs.readFileSync(inputPath, "utf8");
  const { schedules, report } = importSchedulesFromWordPressXml(xml);

  fs.writeFileSync(XML_SCHEDULES_OUTPUT, `${JSON.stringify(schedules, null, 2)}\n`, "utf8");
  fs.writeFileSync(XML_REPORT_OUTPUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(
    `Parsed ${report.targetArticleCount} Live Schedule article(s) for ${TARGET_YEARS.join(" / ")}`
  );
  console.log(
    `Extracted ${report.totalExtractedCount} schedule(s): 2025=${report.scheduleCount2025}, 2026=${report.scheduleCount2026} (${report.uniqueImportKeyCount} unique import_key)`
  );
  if (report.duplicateImportKeyCount > 0) {
    console.log(`Skipped ${report.duplicateImportKeyCount} duplicate import_key(s) within import`);
  }
  console.log(`Wrote ${XML_SCHEDULES_OUTPUT}`);
  console.log(`Wrote ${XML_REPORT_OUTPUT}`);

  if (report.emptyArticles.length > 0) {
    console.log(`\nArticles with 0 extracted schedules: ${report.emptyArticles.length}`);
    for (const article of report.emptyArticles) {
      console.log(`- [${article.wp_post_id}] ${article.title}`);
    }
  }

  const samples = schedules.filter(
    (item) => item.date === "2026-08-21" && item.venue_name === "Mr. Kenny's"
  );
  if (samples.length > 0) {
    console.log(`\nSamples (2026-08-21 / Mr. Kenny's): ${samples.length} record(s)`);
    for (const sample of samples) {
      console.log(JSON.stringify(sample, null, 2));
    }
  }
}

function main() {
  const inputArg = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_HTML_INPUT;

  if (!fs.existsSync(inputArg)) {
    console.error(`Input file not found: ${inputArg}`);
    process.exit(1);
  }

  if (inputArg.endsWith(".xml")) {
    runXmlImport(inputArg);
    return;
  }

  const { inputPath, outputPath } = resolveHtmlPaths(process.argv);
  runHtmlImport(inputPath, outputPath);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main();
}
