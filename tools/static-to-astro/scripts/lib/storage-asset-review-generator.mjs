/**
 * Storage asset review manifest generator (G-4a).
 * Extract image candidates from fixture HTML/CSS and map to legacy_id.
 * Read-only: no Supabase upload, no DB update.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDiscographyHeading } from "./discography-seed-extractor.mjs";
import { buildTargetPath, DEFAULT_BUCKET } from "./storage-asset-planner.mjs";
import { htmlFileToAstroRoute, walkHtmlFiles } from "./static-site-analyzer.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

const SOURCE_KINDS = [
  "wix_image",
  "external_image",
  "local_image",
  "placeholder_example",
  "empty",
  "logo_or_icon",
  "unknown",
];

const ASSET_TYPES = [
  "schedule_flyer",
  "schedule_home",
  "discography_cover",
  "unknown",
];

/**
 * @param {string | null | undefined} url
 * @param {{ alt?: string, className?: string, context?: string }} [ctx]
 */
export function classifySourceKind(url, ctx = {}) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return "empty";
  if (/^https?:\/\/[^/]*example\.supabase\.co/i.test(trimmed)) return "placeholder_example";
  if (/^https?:\/\/(static\.)?wixstatic\.com/i.test(trimmed)) return "wix_image";
  if (/^https?:\/\/static\.parastorage\.com/i.test(trimmed)) return "wix_image";
  if (/^https?:\/\//i.test(trimmed)) return "external_image";
  if (trimmed.startsWith("/") || !trimmed.includes("://")) return "local_image";

  const alt = (ctx.alt ?? "").toLowerCase();
  const className = (ctx.className ?? "").toLowerCase();
  const context = (ctx.context ?? "").toLowerCase();
  const urlLower = trimmed.toLowerCase();
  if (
    /favicon|icon\.|spacer|pixel|1x1|tracking/.test(urlLower) ||
    /logo|icon|favicon|spacer|pixel/.test(alt) ||
    /logo|icon|favicon/.test(className) ||
    /logo|icon|favicon/.test(context)
  ) {
    return "logo_or_icon";
  }

  return "unknown";
}

/**
 * @param {string} url
 */
export function normalizeSourceUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed) return "";
  try {
    const parsed = new URL(trimmed, "https://fixture.local/");
    return parsed.href.replace(/\/$/, "");
  } catch {
    return trimmed;
  }
}

/**
 * @param {{ siteSlug: string, targetTable: string | null, assetType: string, legacyId: string | null }} params
 */
export function buildReviewTargetStoragePath({ siteSlug, targetTable, assetType, legacyId }) {
  if (!targetTable || !legacyId) return null;
  if (targetTable === "discography") {
    return `${DEFAULT_BUCKET}/${buildTargetPath({ siteSlug, sourceTable: "discography", assetKind: "cover", legacyId })}`;
  }
  const assetKind = assetType === "schedule_home" ? "home" : "flyer";
  return `${DEFAULT_BUCKET}/${buildTargetPath({ siteSlug, sourceTable: "schedules", assetKind, legacyId })}`;
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(data) ? data : null;
}

/**
 * @param {string | null | undefined} dataDir
 */
export function loadReviewSeedData(dataDir) {
  if (!dataDir) {
    return { schedules: [], discography: [], dataDir: null, usedSchedules: false, usedDiscography: false };
  }
  const abs = path.resolve(dataDir);
  const schedules = readJsonArray(path.join(abs, "schedules.json")) ?? [];
  const discography = readJsonArray(path.join(abs, "discography.json")) ?? [];
  return {
    schedules,
    discography,
    dataDir: abs,
    usedSchedules: fs.existsSync(path.join(abs, "schedules.json")),
    usedDiscography: fs.existsSync(path.join(abs, "discography.json")),
  };
}

function walkCssFiles(dir, base = dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkCssFiles(full, base, files);
    } else if (entry.isFile() && /\.css$/i.test(entry.name)) {
      files.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return files.sort();
}

function parseSrcsetUrls(srcset) {
  if (!srcset) return [];
  return srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function extractCssBackgroundUrls(cssText) {
  const urls = [];
  const re = /background(?:-image)?\s*:\s*[^;]*url\s*\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
  let match;
  while ((match = re.exec(cssText)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

function extractHtmlCommentCandidates(html) {
  const candidates = [];
  const re = /<!--\s*CROSS_PAGE_ASSET_CANDIDATE:\s*([^>]+?)-->/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    candidates.push({
      note: match[1].trim(),
      sourceUrl: null,
      extractionMethod: "html_comment",
    });
  }
  return candidates;
}

/**
 * @param {string} fixtureDir
 */
export function extractRawImageCandidates(fixtureDir) {
  const absFixture = path.resolve(fixtureDir);
  const htmlFiles = walkHtmlFiles(absFixture);
  const cssFiles = walkCssFiles(absFixture);
  /** @type {Array<object>} */
  const raw = [];

  for (const rel of htmlFiles) {
    const filePath = path.join(absFixture, rel);
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);
    const sourceRoute = htmlFileToAstroRoute(rel);

    $("img[src]").each((_, el) => {
      const src = $(el).attr("src")?.trim();
      if (!src) return;
      raw.push({
        sourceUrl: src,
        sourceFile: rel,
        sourceRoute,
        extractionMethod: "img_src",
        alt: $(el).attr("alt")?.trim() ?? "",
        title: $(el).attr("title")?.trim() ?? "",
        className: $(el).attr("class")?.trim() ?? "",
        context: describeImgContext($, el),
      });
    });

    $("img[srcset]").each((_, el) => {
      for (const url of parseSrcsetUrls($(el).attr("srcset"))) {
        raw.push({
          sourceUrl: url,
          sourceFile: rel,
          sourceRoute,
          extractionMethod: "srcset",
          alt: $(el).attr("alt")?.trim() ?? "",
          title: $(el).attr("title")?.trim() ?? "",
          className: $(el).attr("class")?.trim() ?? "",
          context: describeImgContext($, el),
        });
      }
    });

    $('meta[property="og:image"], meta[name="twitter:image"], meta[name="og:image"]').each((_, el) => {
      const content = $(el).attr("content")?.trim();
      if (!content) return;
      raw.push({
        sourceUrl: content,
        sourceFile: rel,
        sourceRoute,
        extractionMethod: "og_image",
        alt: "",
        title: "",
        className: "",
        context: "meta og:image",
      });
    });

    for (const comment of extractHtmlCommentCandidates(html)) {
      raw.push({
        sourceUrl: comment.sourceUrl,
        sourceFile: rel,
        sourceRoute,
        extractionMethod: comment.extractionMethod,
        alt: "",
        title: "",
        className: "",
        context: comment.note,
        commentOnly: true,
      });
    }
  }

  for (const rel of cssFiles) {
    const filePath = path.join(absFixture, rel);
    const cssText = fs.readFileSync(filePath, "utf8");
    const sourceRoute = null;
    for (const url of extractCssBackgroundUrls(cssText)) {
      raw.push({
        sourceUrl: url,
        sourceFile: rel,
        sourceRoute,
        extractionMethod: "css_background",
        alt: "",
        title: "",
        className: "",
        context: "css background-image",
      });
    }
  }

  return raw;
}

/**
 * @param {import('cheerio').CheerioAPI} $
 * @param {import('cheerio').Element} el
 */
function describeImgContext($, el) {
  const parts = [];
  const parentClass = $(el).parent().attr("class");
  if (parentClass) parts.push(`parent:${parentClass}`);
  const article = $(el).closest(".discography-item, .schedule-card, .main-visual, .profile-photo, .contact-layout");
  if (article.length) {
    const cls = article.attr("class");
    if (cls) parts.push(`section:${cls.split(/\s+/)[0]}`);
  }
  return parts.join(" ");
}

function normalizeTitleKey(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/**
 * @param {string} dateText e.g. "2026.03.25 (Wed)" or "3月25日(水)"
 * @param {number} [defaultYear]
 */
function parseScheduleDateText(dateText, defaultYear = 2026) {
  const isoMatch = String(dateText).match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  const jpMatch = String(dateText).match(/(\d{1,2})月(\d{1,2})日/);
  if (jpMatch) {
    return `${defaultYear}-${jpMatch[1].padStart(2, "0")}-${jpMatch[2].padStart(2, "0")}`;
  }
  return null;
}

/**
 * @param {object} raw
 * @param {object[]} schedules
 * @param {object[]} discography
 */
function inferMapping(raw, schedules, discography) {
  const base = {
    assetType: "unknown",
    legacyId: null,
    targetTable: null,
    targetColumn: null,
    confidence: "low",
    notes: "",
  };

  if (raw.commentOnly) {
    return {
      ...base,
      sourceKind: "unknown",
      notes: raw.context,
      confidence: "low",
    };
  }

  const sourceKind = classifySourceKind(raw.sourceUrl, raw);
  if (sourceKind === "empty") {
    return { ...base, sourceKind, notes: "Empty or missing URL" };
  }
  if (sourceKind === "placeholder_example") {
    return {
      ...base,
      sourceKind,
      notes: "example.supabase.co placeholder — not a real image candidate",
    };
  }
  if (sourceKind === "logo_or_icon") {
    return { ...base, sourceKind, notes: "Likely logo/icon/spacer — excluded from CMS asset targets" };
  }

  if (raw.sourceFile === "discography.html" && raw.context.includes("discography-item")) {
    const titleFromAlt = raw.alt.match(/[「『](.+?)[」』]/)?.[1];
    const match =
      discography.find((row) => normalizeTitleKey(row.title) === normalizeTitleKey(titleFromAlt)) ??
      discography.find((row) => raw.alt && row.cover_alt === raw.alt);
    if (match) {
      return {
        assetType: "discography_cover",
        legacyId: match.legacy_id,
        targetTable: "discography",
        targetColumn: "cover_image_url",
        sourceKind,
        confidence: "high",
        notes: `Matched discography title "${match.title}" from alt/heading`,
      };
    }
    return {
      ...base,
      sourceKind,
      notes: "Discography cover image — legacy_id match failed",
      confidence: "medium",
    };
  }

  if (raw.sourceFile === "index.html" && raw.context.includes("schedule-card")) {
    const filePath = raw.sourceFile;
    void filePath;
    const homeCard = raw.context.includes("schedule-card");
    if (homeCard) {
      const dateIso = inferHomeScheduleDateFromAlt(raw.alt, raw.sourceUrl);
      const schedule = findHomeScheduleMatch(schedules, dateIso, raw.alt);
      if (schedule) {
        const confidence =
          raw.sourceUrl?.includes("20260327.png") && !raw.sourceUrl.includes("%E3%81%8A%E5%BA%97")
            ? "medium"
            : "high";
        const notes =
          confidence === "medium"
            ? `Home schedule image for ${schedule.legacy_id}; alt-date-conflict (filename 20260327 vs rendered 2026-03-25)`
            : `Home schedule image for ${schedule.legacy_id} (${schedule.date})`;
        return {
          assetType: "schedule_home",
          legacyId: schedule.legacy_id,
          targetTable: "schedules",
          targetColumn: "home_image_url",
          sourceKind,
          confidence,
          notes,
        };
      }
    }
  }

  if (raw.sourceFile?.startsWith("schedule-") && raw.context.includes("schedule-card")) {
    const schedule = findScheduleFromMonthCardContext(raw);
    if (schedule) {
      return {
        assetType: "schedule_flyer",
        legacyId: schedule.legacy_id,
        targetTable: "schedules",
        targetColumn: "image_url",
        sourceKind,
        confidence: "medium",
        notes: `Schedule month page flyer candidate for ${schedule.legacy_id}`,
      };
    }
  }

  if (raw.sourceFile === "index.html" && raw.context.includes("main-visual")) {
    return {
      ...base,
      sourceKind,
      notes: "Home hero / main visual — not mapped to schedules or discography CMS fields",
      confidence: "low",
    };
  }
  if (raw.sourceFile === "about.html") {
    return {
      ...base,
      sourceKind,
      notes: "About profile photo — out of scope for G-4 schedule/discography storage fields",
      confidence: "low",
    };
  }
  if (raw.sourceFile === "contact.html") {
    return {
      ...base,
      sourceKind,
      notes: "Contact decorative photo — out of scope for G-4 schedule/discography storage fields",
      confidence: "low",
    };
  }

  return { ...base, sourceKind, notes: "No legacy_id mapping inferred" };
}

function inferHomeScheduleDateFromAlt(alt, sourceUrl) {
  const altDate = parseScheduleDateText(alt);
  if (altDate) return altDate;
  if (sourceUrl?.includes("20260327(%E3%81%8A%E5%BA%97)") || sourceUrl?.includes("20260327(お店)")) {
    return "2026-03-27";
  }
  if (sourceUrl?.includes("20260327.png")) {
    return "2026-03-25";
  }
  return null;
}

/**
 * @param {object[]} schedules
 * @param {string | null} dateIso
 * @param {string} alt
 */
function findHomeScheduleMatch(schedules, dateIso, alt) {
  const homeRows = schedules.filter((row) => row.show_on_home);
  if (dateIso) {
    const byDate = homeRows.find((row) => row.date === dateIso);
    if (byDate) return byDate;
  }
  const titleMatch = alt.match(/Good Swing|Golden PODs|宮益屋本店/);
  if (titleMatch) {
    const needle = titleMatch[0];
    return homeRows.find((row) => String(row.title ?? "").includes(needle));
  }
  return null;
}

function findScheduleFromMonthCardContext(raw) {
  void raw;
  return null;
}

/**
 * @param {object} raw
 * @param {object} mapping
 * @param {string} siteSlug
 */
function buildManifestEntry(raw, mapping, siteSlug) {
  const sourceKind = mapping.sourceKind ?? classifySourceKind(raw.sourceUrl, raw);
  const assetType = mapping.assetType ?? "unknown";
  return {
    siteSlug,
    assetType,
    sourceKind,
    sourceUrl: raw.sourceUrl ?? null,
    sourceFile: raw.sourceFile ?? null,
    sourceRoute: raw.sourceRoute ?? null,
    legacyId: mapping.legacyId ?? null,
    targetTable: mapping.targetTable ?? null,
    targetColumn: mapping.targetColumn ?? null,
    targetStoragePath: buildReviewTargetStoragePath({
      siteSlug,
      targetTable: mapping.targetTable ?? null,
      assetType,
      legacyId: mapping.legacyId ?? null,
    }),
    confidence: mapping.confidence ?? "low",
    reviewRequired: true,
    notes: mapping.notes ?? "",
    extractionMethod: raw.extractionMethod ?? null,
    alt: raw.alt || null,
    context: raw.context || null,
  };
}

function buildSyntheticEmptyHomeEntries(schedules, siteSlug) {
  const entries = [];
  for (const row of schedules.filter((s) => s.show_on_home)) {
    entries.push({
      siteSlug,
      assetType: "schedule_home",
      sourceKind: "empty",
      sourceUrl: null,
      sourceFile: "index.html",
      sourceRoute: "/",
      legacyId: row.legacy_id,
      targetTable: "schedules",
      targetColumn: "home_image_url",
      targetStoragePath: buildReviewTargetStoragePath({
        siteSlug,
        targetTable: "schedules",
        assetType: "schedule_home",
        legacyId: row.legacy_id,
      }),
      confidence: "high",
      reviewRequired: true,
      notes:
        row.legacy_id === "schedule-2026-03-013"
          ? "Home schedule card uses flyer-placeholder (NO PHOTO on source) — no Wix URL in fixture"
          : "Synthetic empty check row for show_on_home schedule — verify against fixture extraction",
      extractionMethod: "synthetic_show_on_home",
      alt: null,
      context: `show_on_home home_order=${row.home_order ?? "?"}`,
    });
  }
  return entries;
}

function dedupeEntries(entries) {
  const seen = new Set();
  const out = [];
  for (const entry of entries) {
    if (
      entry.sourceKind === "empty" &&
      entry.extractionMethod === "synthetic_show_on_home"
    ) {
      out.push(entry);
      continue;
    }
    if (entry.extractionMethod === "html_comment") {
      out.push(entry);
      continue;
    }
    const key = [
      entry.sourceUrl ?? "",
      entry.sourceFile ?? "",
      entry.assetType,
      entry.legacyId ?? "",
      entry.targetColumn ?? "",
    ].join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }
  return out;
}

/**
 * @param {{ siteSlug: string, fixtureDir: string, dataDir?: string | null }} opts
 */
export function buildStorageAssetReview(opts) {
  const { siteSlug, fixtureDir, dataDir = null } = opts;
  const seed = loadReviewSeedData(dataDir);
  const rawCandidates = extractRawImageCandidates(fixtureDir);

  /** @type {object[]} */
  const entries = [];
  /** @type {object[]} */
  const excluded = [];

  for (const raw of rawCandidates) {
    if (raw.commentOnly) {
      const mapping = inferMapping(raw, seed.schedules, seed.discography);
      entries.push(buildManifestEntry(raw, mapping, siteSlug));
      continue;
    }

    const mapping = inferMapping(raw, seed.schedules, seed.discography);
    const entry = buildManifestEntry(raw, mapping, siteSlug);

    if (mapping.sourceKind === "logo_or_icon") {
      excluded.push({ reason: "logo_or_icon", entry });
    }
    if (mapping.sourceKind === "placeholder_example") {
      excluded.push({ reason: "placeholder_example", entry });
    }

    entries.push(entry);

    if (
      entry.sourceKind === "wix_image" &&
      entry.assetType === "schedule_home" &&
      entry.legacyId &&
      entry.confidence !== "low"
    ) {
      entries.push(
        buildManifestEntry(
          raw,
          {
            ...mapping,
            assetType: "schedule_flyer",
            targetColumn: "image_url",
            confidence: mapping.confidence === "high" ? "medium" : "low",
            notes: `${mapping.notes}; cross-page flyer candidate (schedule month pages use placeholders)`,
          },
          siteSlug,
        ),
      );
    }
  }

  for (const synthetic of buildSyntheticEmptyHomeEntries(seed.schedules, siteSlug)) {
    const existing = entries.find(
      (e) =>
        e.legacyId === synthetic.legacyId &&
        e.assetType === "schedule_home" &&
        e.sourceKind !== "empty",
    );
    if (!existing) {
      entries.push(synthetic);
    }
  }

  const manifestEntries = dedupeEntries(entries);
  const summary = summarizeReview(manifestEntries, excluded, rawCandidates.length);

  return {
    siteSlug,
    fixtureDir: path.resolve(fixtureDir),
    dataDir: seed.dataDir,
    mode: "review-read-only",
    generatedAt: new Date().toISOString(),
    inputMeta: {
      htmlFilesScanned: walkHtmlFiles(path.resolve(fixtureDir)).length,
      cssFilesScanned: walkCssFiles(path.resolve(fixtureDir)).length,
      rawCandidatesExtracted: rawCandidates.length,
      schedulesCount: seed.schedules.length,
      discographyCount: seed.discography.length,
      usedSchedulesJson: seed.usedSchedules,
      usedDiscographyJson: seed.usedDiscography,
    },
    summary,
    excluded,
    entries: manifestEntries,
  };
}

function summarizeReview(entries, excluded, rawCount) {
  const bySourceKind = countBy(entries, "sourceKind");
  const byAssetType = countBy(entries, "assetType");
  const byTarget = countBy(
    entries.filter((e) => e.targetTable && e.targetColumn),
    (e) => `${e.targetTable}.${e.targetColumn}`,
  );
  const byConfidence = countBy(entries, "confidence");

  const discographyCovers = entries.filter(
    (e) => e.assetType === "discography_cover" && e.sourceKind === "wix_image",
  );
  const homeScheduleImages = entries.filter(
    (e) => e.assetType === "schedule_home" && e.sourceKind === "wix_image",
  );
  const scheduleFlyers = entries.filter(
    (e) => e.assetType === "schedule_flyer" && e.sourceKind === "wix_image",
  );
  const homeEmpty = entries.filter(
    (e) => e.assetType === "schedule_home" && e.sourceKind === "empty",
  );

  return {
    totalCandidates: entries.length,
    rawExtracted: rawCount,
    bySourceKind,
    byAssetType,
    byTarget,
    byConfidence,
    reviewRequired: entries.filter((e) => e.reviewRequired).length,
    discographyCoverCandidates: discographyCovers.length,
    discographyCoverExpected: 4,
    discographyCoverComplete: discographyCovers.length >= 4,
    homeScheduleImageCandidates: homeScheduleImages.length,
    homeScheduleEmpty: homeEmpty.length,
    scheduleFlyerCandidates: scheduleFlyers.length,
    excludedCount: excluded.length,
    excludedByReason: countBy(excluded, "reason"),
  };
}

function countBy(items, keyOrFn) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const item of items) {
    const key = typeof keyOrFn === "function" ? keyOrFn(item) : item[keyOrFn];
    const k = String(key ?? "null");
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/**
 * @param {ReturnType<typeof buildStorageAssetReview>} review
 */
export function buildReviewManifestJson(review) {
  return {
    siteSlug: review.siteSlug,
    mode: review.mode,
    generatedAt: review.generatedAt,
    fixtureDir: review.fixtureDir,
    dataDir: review.dataDir,
    inputMeta: review.inputMeta,
    summary: review.summary,
    entries: review.entries.map(({ extractionMethod, alt, context, ...rest }) => rest),
  };
}

/**
 * @param {ReturnType<typeof buildStorageAssetReview>} review
 * @param {{ reportPath?: string, manifestPath?: string }} [opts]
 */
export function formatStorageAssetReviewReport(review, opts = {}) {
  const s = review.summary;
  const lines = [
    "# Storage Asset Review Report (G-4a)",
    "",
    "**Mode:** read-only review manifest — no Supabase upload, no DB update",
    "",
    `**Generated:** ${review.generatedAt}`,
    `**Site slug:** ${review.siteSlug}`,
    `**Fixture dir:** ${review.fixtureDir}`,
    `**Data dir:** ${review.dataDir ?? "(not provided)"}`,
    "",
    "## Outputs",
    "",
    "| Artifact | Path |",
    "| --- | --- |",
    `| Review report | \`${opts.reportPath ?? "STORAGE_ASSET_REVIEW_REPORT.md"}\` |`,
    `| Review manifest | \`${opts.manifestPath ?? "storage-asset-review-manifest.json"}\` |`,
    "",
    "## Input scan",
    "",
    "| Metric | Value |",
    "| --- | ---: |",
    `| HTML files scanned | ${review.inputMeta.htmlFilesScanned} |`,
    `| CSS files scanned | ${review.inputMeta.cssFilesScanned} |`,
    `| Raw image extractions | ${review.inputMeta.rawCandidatesExtracted} |`,
    `| schedules.json rows | ${review.inputMeta.schedulesCount} |`,
    `| discography.json rows | ${review.inputMeta.discographyCount} |`,
    "",
    "## Totals",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Total manifest entries | ${s.totalCandidates} |`,
    `| reviewRequired | ${s.reviewRequired} |`,
    "",
    "## Category counts (sourceKind)",
    "",
    "| sourceKind | Count |",
    "| --- | ---: |",
    ...Object.entries(s.bySourceKind)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Asset type counts",
    "",
    "| assetType | Count |",
    "| --- | ---: |",
    ...Object.entries(s.byAssetType)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Target table / column",
    "",
    "| target | Count |",
    "| --- | ---: |",
    ...Object.entries(s.byTarget)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Confidence",
    "",
    "| confidence | Count |",
    "| --- | ---: |",
    ...Object.entries(s.byConfidence)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Key checks",
    "",
    "| Check | Result |",
    "| --- | --- |",
    `| Discography cover candidates (Wix) | **${s.discographyCoverCandidates}** / expected ${s.discographyCoverExpected} — ${s.discographyCoverComplete ? "OK" : "NEEDS REVIEW"} |`,
    `| Home schedule image candidates (Wix) | **${s.homeScheduleImageCandidates}** |`,
    `| Home schedule empty (show_on_home) | **${s.homeScheduleEmpty}** |`,
    `| Schedule flyer candidates (Wix) | **${s.scheduleFlyerCandidates}** (cross-page / inferred) |`,
    "",
    "## Excluded / placeholder overview",
    "",
    excludedSection(review),
    "",
    "## Discography cover entries",
    "",
    ...detailSection(
      review.entries.filter((e) => e.assetType === "discography_cover"),
      "No discography cover entries found.",
    ),
    "",
    "## Home schedule entries",
    "",
    ...detailSection(
      review.entries.filter((e) => e.assetType === "schedule_home"),
      "No home schedule entries found.",
    ),
    "",
    "## Schedule flyer entries",
    "",
    ...detailSection(
      review.entries.filter((e) => e.assetType === "schedule_flyer"),
      "No schedule flyer entries found.",
    ),
    "",
    "## Human review TODO",
    "",
    "- [ ] Confirm all 4 discography covers map to the correct `legacy_id` and album title",
    "- [ ] Resolve alt-date-conflict for `20260327.png` (rendered 2026-03-25 vs filename 2026-03-27)",
    "- [ ] Decide whether home Wix images should also populate `schedules.image_url` (month pages are placeholders)",
    "- [ ] Confirm `schedule-2026-03-013` has no home image (NO PHOTO on source)",
    "- [ ] Ignore hero / about / contact images for G-4 unless scope expands",
    "",
    "## Pre-upload checklist (not performed in G-4a)",
    "",
    "- [ ] Copyright / re-host permission for Wix CDN assets",
    "- [ ] Image quality and crop acceptable after WebP conversion",
    "- [ ] Which image is Home vs flyer per event (if both columns populated)",
    "- [ ] Staging Supabase bucket `site-assets` exists with public read policy",
    "- [ ] Staging DB update scope: `image_url`, `home_image_url`, `cover_image_url` only",
    "- [ ] No `example.supabase.co` URLs in final staging data",
    "",
    "## Safety",
    "",
    "- Supabase Storage upload: **not performed**",
    "- DB update: **not performed**",
    "- FTP deploy: **not performed**",
    "- Secrets: not included in this report",
    "",
    "---",
    "",
    "G-4a complete. Proceed to copyright review before G-4b upload apply.",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function excludedSection(review) {
  if (!review.excluded.length) {
    return "_No logo/icon/example.supabase.co exclusions recorded._\n";
  }
  const lines = ["| Reason | sourceFile | sourceUrl | notes |", "| --- | --- | --- | --- |"];
  for (const { reason, entry } of review.excluded) {
    const url = entry.sourceUrl ? entry.sourceUrl.slice(0, 80) + (entry.sourceUrl.length > 80 ? "…" : "") : "(null)";
    lines.push(`| ${reason} | ${entry.sourceFile ?? ""} | ${url} | ${entry.notes ?? ""} |`);
  }
  return lines.join("\n");
}

function detailSection(entries, emptyMsg) {
  if (!entries.length) return [emptyMsg];
  const lines = ["| legacyId | confidence | sourceKind | sourceFile | notes |", "| --- | --- | --- | --- | --- |"];
  for (const e of entries) {
    lines.push(
      `| ${e.legacyId ?? "—"} | ${e.confidence} | ${e.sourceKind} | ${e.sourceFile ?? "—"} | ${e.notes ?? ""} |`,
    );
  }
  return lines;
}

export { SOURCE_KINDS, ASSET_TYPES };
