/**
 * Schedule image human review generator (G-4d).
 * Read-only: consolidates needsHumanReview schedule candidates for human decision.
 * No Storage upload, no DB update.
 */

import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APPROVAL_SCOPE } from "./storage-upload-allowlist-generator.mjs";
import { loadReviewManifest } from "./storage-upload-allowlist-generator.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../../../..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const cheerio = require("cheerio");

export const ALLOWED_DECISIONS = [
  "approve_home_only",
  "approve_flyer_only",
  "approve_both",
  "reject",
  "defer",
];

const SCHEDULE_ASSET_TYPES = new Set(["schedule_home", "schedule_flyer"]);
const EXCLUDED_SOURCE_KINDS = new Set(["empty", "placeholder_example", "logo_or_icon"]);

/**
 * @param {string} allowlistPath
 */
export function loadUploadAllowlist(allowlistPath) {
  const abs = path.resolve(allowlistPath);
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

/**
 * @param {string | null | undefined} dataDir
 */
export function loadSchedulesData(dataDir) {
  if (!dataDir) return [];
  const filePath = path.join(path.resolve(dataDir), "schedules.json");
  if (!fs.existsSync(filePath)) return [];
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(data) ? data : [];
}

/**
 * @param {string} sourceUrl
 */
export function extractFileNameHint(sourceUrl) {
  if (!sourceUrl) return null;
  try {
    const pathname = new URL(sourceUrl).pathname;
    const base = pathname.split("/").pop() ?? "";
    return decodeURIComponent(base) || null;
  } catch {
    const m = String(sourceUrl).match(/\/([^/?]+)(?:\?|$)/);
    return m ? decodeURIComponent(m[1]) : null;
  }
}

/**
 * @param {string | null | undefined} fileNameHint
 * @param {string | null | undefined} scheduleDate ISO YYYY-MM-DD
 */
export function detectFilenameDateConflict(fileNameHint, scheduleDate) {
  if (!fileNameHint || !scheduleDate) return false;
  const compact = fileNameHint.replace(/[^\d]/g, "");
  const m8 = compact.match(/(20\d{2})(\d{2})(\d{2})/);
  if (!m8) return false;
  const fromFile = `${m8[1]}-${m8[2]}-${m8[3]}`;
  return fromFile !== scheduleDate;
}

/**
 * @param {object} entry
 * @param {object | null} scheduleRow
 */
export function classifyReviewIssue(entry, scheduleRow) {
  const notes = String(entry.notes ?? "").toLowerCase();
  const fileNameHint = extractFileNameHint(entry.sourceUrl);
  const scheduleDate = scheduleRow?.date ?? null;

  if (/no photo|flyer-placeholder|no wix url/.test(notes) || entry.sourceKind === "empty") {
    return "no-photo";
  }
  if (
    /alt-date-conflict|date-conflict/.test(notes) ||
    detectFilenameDateConflict(fileNameHint, scheduleDate)
  ) {
    return "alt-date-conflict";
  }
  if (
    entry.assetType === "schedule_flyer" ||
    /cross-page|inferred|placeholder/.test(notes)
  ) {
    return "cross-page-inferred";
  }
  if (entry.assetType === "schedule_home" && entry.sourceFile === "index.html") {
    return "home-only";
  }
  return "unknown";
}

/**
 * @param {object} entry
 * @param {string} reviewIssue
 */
export function suggestRecommendedAction(entry, reviewIssue) {
  if (reviewIssue === "no-photo") return "reject";
  if (reviewIssue === "alt-date-conflict") return "defer";
  if (entry.assetType === "schedule_flyer") return "defer";
  if (entry.assetType === "schedule_home" && entry.confidence === "high" && reviewIssue === "home-only") {
    return "approve_home_only";
  }
  if (entry.assetType === "schedule_home") return "defer";
  return "defer";
}

/**
 * @param {string} fixtureDir
 */
function loadFixtureImageContext(fixtureDir) {
  /** @type {Map<string, { alt: string, surroundingText: string }>} */
  const bySrc = new Map();
  const indexPath = path.join(path.resolve(fixtureDir), "index.html");
  if (!fs.existsSync(indexPath)) return bySrc;

  const $ = cheerio.load(fs.readFileSync(indexPath, "utf8"));
  $(".home-schedule .schedule-card").each((_, card) => {
    const surroundingParts = [];
    $(card)
      .find(".schedule-card__body p")
      .each((__, p) => {
        const t = $(p).text().replace(/\s+/g, " ").trim();
        if (t) surroundingParts.push(t);
      });
    const surroundingText = surroundingParts.join(" | ");
    $(card)
      .find("img[src]")
      .each((__, img) => {
        const src = $(img).attr("src")?.trim();
        if (!src) return;
        bySrc.set(src, {
          alt: $(img).attr("alt")?.trim() ?? "",
          surroundingText,
        });
      });
  });

  return bySrc;
}

/**
 * @param {object} raw
 * @param {object | null} scheduleRow
 * @param {{ alt?: string, surroundingText?: string }} [fixtureCtx]
 */
export function buildReviewCandidate(raw, scheduleRow, fixtureCtx = {}) {
  const reviewIssue = classifyReviewIssue(raw, scheduleRow);
  const fileNameHint = extractFileNameHint(raw.sourceUrl);
  const recommendedAction = suggestRecommendedAction(raw, reviewIssue);

  return {
    legacyId: raw.legacyId ?? scheduleRow?.legacy_id ?? null,
    date: scheduleRow?.date ?? null,
    dateDisplay: scheduleRow?.date_display ?? null,
    title: scheduleRow?.title ?? null,
    venue: scheduleRow?.venue ?? null,
    showOnHome: scheduleRow?.show_on_home ?? null,
    homeOrder: scheduleRow?.home_order ?? null,
    sourceFile: raw.sourceFile ?? scheduleRow?.source_file ?? null,
    sourceRoute: raw.sourceRoute ?? scheduleRow?.source_route ?? null,
    assetType: raw.assetType,
    targetTable: raw.targetTable ?? "schedules",
    targetColumn: raw.targetColumn,
    targetStoragePath: raw.targetStoragePath ?? null,
    sourceUrl: raw.sourceUrl ?? null,
    sourceKind: raw.sourceKind ?? null,
    fileNameHint,
    altText: fixtureCtx.alt ?? raw.alt ?? null,
    surroundingText: fixtureCtx.surroundingText ?? raw.surroundingText ?? null,
    confidence: raw.confidence ?? null,
    reviewIssue,
    recommendedAction,
    humanDecision: "pending",
    approvalScope: APPROVAL_SCOPE,
    reviewRequired: true,
    notes: raw.notes ?? "",
    allowlistDecision: raw.allowlistDecision ?? null,
    filenameDateFromHint: fileNameHint ? parseDateFromFilename(fileNameHint) : null,
    dbDate: scheduleRow?.date ?? null,
    dateConflict:
      reviewIssue === "alt-date-conflict"
        ? {
            dbDate: scheduleRow?.date ?? null,
            filenameHint: fileNameHint,
            filenameDate: parseDateFromFilename(fileNameHint),
            altTextSuggests: inferDateFromAlt(fixtureCtx.alt),
            renderedEventDate: scheduleRow?.date ?? null,
            requiresHumanConfirmation: true,
          }
        : null,
  };
}

function parseDateFromFilename(fileName) {
  const compact = String(fileName).replace(/[^\d]/g, "");
  const m = compact.match(/(20\d{2})(\d{2})(\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function inferDateFromAlt(alt) {
  if (!alt) return null;
  const jp = alt.match(/(\d{1,2})月(\d{1,2})日/);
  if (jp) return `2026-${jp[1].padStart(2, "0")}-${jp[2].padStart(2, "0")}`;
  const iso = alt.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return null;
}

function isScheduleReviewCandidate(entry) {
  if (!SCHEDULE_ASSET_TYPES.has(entry.assetType)) return false;
  if (entry.targetTable && entry.targetTable !== "schedules") return false;
  if (!["home_image_url", "image_url"].includes(entry.targetColumn)) return false;
  if (EXCLUDED_SOURCE_KINDS.has(entry.sourceKind)) return false;
  if (!entry.sourceUrl || !String(entry.sourceUrl).trim()) return false;
  if (/example\.supabase\.co/i.test(entry.sourceUrl)) return false;
  const notes = String(entry.notes ?? "").toLowerCase();
  if (/no photo|flyer-placeholder|no wix url/.test(notes)) return false;
  return true;
}

function dedupeKey(entry) {
  return [
    entry.legacyId ?? "",
    entry.assetType ?? "",
    entry.targetColumn ?? "",
    entry.sourceUrl ?? "",
  ].join("|");
}

/**
 * @param {{
 *   allowlistPath: string,
 *   reviewManifestPath: string,
 *   dataDir?: string | null,
 *   siteSlug: string,
 *   fixtureDir?: string | null,
 * }} opts
 */
export function buildScheduleHumanReview(opts) {
  const allowlist = loadUploadAllowlist(opts.allowlistPath);
  const reviewManifest = loadReviewManifest(opts.reviewManifestPath);
  const schedules = loadSchedulesData(opts.dataDir);
  const scheduleByLegacy = new Map(schedules.map((r) => [r.legacy_id, r]));

  const fixtureDir =
    opts.fixtureDir ??
    path.join(REPO_ROOT, "tools/static-to-astro/fixtures/gosaki-static-site");
  const fixtureContext = loadFixtureImageContext(fixtureDir);

  /** @type {Map<string, object>} */
  const merged = new Map();

  const sources = [
    ...(allowlist.needsHumanReview ?? []),
    ...(reviewManifest.entries ?? []).filter(
      (e) =>
        SCHEDULE_ASSET_TYPES.has(e.assetType) &&
        (e.allowlistDecision === "needs_human_review" || !e.allowlistDecision),
    ),
  ];

  for (const raw of sources) {
    if (!isScheduleReviewCandidate(raw)) continue;
    const key = dedupeKey(raw);
    if (merged.has(key)) continue;

    const scheduleRow = raw.legacyId ? scheduleByLegacy.get(raw.legacyId) ?? null : null;
    const fixtureCtx = raw.sourceUrl ? fixtureContext.get(raw.sourceUrl) ?? {} : {};
    merged.set(key, buildReviewCandidate({ ...raw, allowlistDecision: "needs_human_review" }, scheduleRow, fixtureCtx));
  }

  const candidates = [...merged.values()].sort((a, b) => {
    const id = String(a.legacyId ?? "").localeCompare(String(b.legacyId ?? ""));
    if (id !== 0) return id;
    return String(a.targetColumn ?? "").localeCompare(String(b.targetColumn ?? ""));
  });

  const excluded = buildExcludedSummary(allowlist, reviewManifest, schedules);

  const summary = {
    totalCandidates: candidates.length,
    byAssetType: countBy(candidates, "assetType"),
    byConfidence: countBy(candidates, "confidence"),
    byReviewIssue: countBy(candidates, "reviewIssue"),
    byRecommendedAction: countBy(candidates, "recommendedAction"),
    humanDecisionPending: candidates.filter((c) => c.humanDecision === "pending").length,
    altDateConflictCount: candidates.filter((c) => c.reviewIssue === "alt-date-conflict").length,
    excludedNoPhoto: excluded.noPhoto.length,
  };

  const conflict20260327 = candidates.filter(
    (c) => c.fileNameHint?.includes("20260327.png") || c.fileNameHint === "20260327.png",
  );

  return {
    siteSlug: opts.siteSlug,
    mode: "human-review-read-only",
    uploadAllowed: false,
    dbUpdateAllowed: false,
    generatedAt: new Date().toISOString(),
    approvalScopeNote:
      "Schedule images are not auto-approved. Production use permission is NOT confirmed.",
    sources: {
      allowlistPath: path.resolve(opts.allowlistPath),
      reviewManifestPath: path.resolve(opts.reviewManifestPath),
      dataDir: opts.dataDir ? path.resolve(opts.dataDir) : null,
      fixtureDir: path.resolve(fixtureDir),
    },
    summary,
    candidates,
    excluded,
    conflict20260327,
  };
}

function buildExcludedSummary(allowlist, reviewManifest, schedules) {
  const noPhoto = [];

  for (const entry of reviewManifest.entries ?? []) {
    if (entry.assetType === "schedule_home" && entry.sourceKind === "empty") {
      noPhoto.push({
        legacyId: entry.legacyId,
        reason: "NO PHOTO on source — flyer-placeholder only",
        notes: entry.notes,
        sourceFile: entry.sourceFile,
      });
    }
  }

  const showOnHomeNoImage = schedules
    .filter((s) => s.show_on_home && s.legacy_id === "schedule-2026-03-013")
    .map((s) => ({
      legacyId: s.legacy_id,
      date: s.date,
      title: s.title,
      reason: "NO PHOTO — excluded from upload/review candidates",
    }));

  const mergedNoPhoto = [...noPhoto, ...showOnHomeNoImage];
  const seenLegacy = new Set();
  const dedupedNoPhoto = mergedNoPhoto.filter((e) => {
    if (!e.legacyId || seenLegacy.has(e.legacyId)) return false;
    seenLegacy.add(e.legacyId);
    return true;
  });

  return {
    noPhoto: dedupedNoPhoto,
    htmlComments: (reviewManifest.entries ?? []).filter(
      (e) => !e.sourceUrl && e.sourceFile?.startsWith("schedule-"),
    ).length,
    discography: "not in scope",
    heroAboutContact: (allowlist.rejectedOrDeferred ?? []).filter((e) =>
      /hero|about|contact/.test(String(e.notes ?? "")),
    ).length,
  };
}

function countBy(items, key) {
  /** @type {Record<string, number>} */
  const out = {};
  for (const item of items) {
    const k = String(item[key] ?? "null");
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/**
 * @param {ReturnType<typeof buildScheduleHumanReview>} review
 */
export function buildScheduleHumanReviewManifest(review) {
  return {
    siteSlug: review.siteSlug,
    mode: review.mode,
    uploadAllowed: review.uploadAllowed,
    dbUpdateAllowed: review.dbUpdateAllowed,
    generatedAt: review.generatedAt,
    approvalScopeNote: review.approvalScopeNote,
    sources: review.sources,
    summary: review.summary,
    candidates: review.candidates,
    excluded: review.excluded,
    conflict20260327: review.conflict20260327,
  };
}

/**
 * @param {ReturnType<typeof buildScheduleHumanReview>} review
 */
export function buildScheduleHumanDecisionTemplate(review) {
  return {
    siteSlug: review.siteSlug,
    mode: "human-review-template",
    uploadAllowed: false,
    dbUpdateAllowed: false,
    approvalScope: APPROVAL_SCOPE,
    copyrightNote: "Production use permission NOT confirmed — staging-only candidates.",
    generatedAt: review.generatedAt,
    instructions:
      "Set humanDecision for each row after review. reasonRequired is true when changing from recommendedAction. Re-run allowlist prep in G-4e after decisions are finalized.",
    allowedValues: ALLOWED_DECISIONS,
    decisions: review.candidates.map((c) => ({
      legacyId: c.legacyId,
      date: c.date,
      title: c.title,
      venue: c.venue,
      assetType: c.assetType,
      targetColumn: c.targetColumn,
      targetStoragePath: c.targetStoragePath,
      sourceUrl: c.sourceUrl,
      fileNameHint: c.fileNameHint,
      reviewIssue: c.reviewIssue,
      recommendedAction: c.recommendedAction,
      humanDecision: "pending",
      allowedValues: ALLOWED_DECISIONS,
      reasonRequired: true,
      decisionReason: "",
      notes: c.notes,
      altDateConflict: c.dateConflict,
    })),
  };
}

/**
 * @param {ReturnType<typeof buildScheduleHumanReview>} review
 * @param {{ reportPath?: string, manifestPath?: string, decisionTemplatePath?: string }} [opts]
 */
export function formatScheduleHumanReviewReport(review, opts = {}) {
  const s = review.summary;
  const lines = [
    "# Schedule Image Human Review Report (G-4d)",
    "",
    "**Mode:** read-only human review — **no Supabase upload, no DB update, no FTP deploy**",
    "",
    `**Generated:** ${review.generatedAt}`,
    `**Site slug:** ${review.siteSlug}`,
    `**Allowlist:** \`${opts.allowlistPath ?? "storage-upload-allowlist.json"}\``,
    `**Review manifest:** \`${opts.reviewManifestPath ?? "storage-asset-review-manifest.json"}\``,
    "",
    "> Schedule images are **not auto-approved**. `approvalScope: staging-only`. Production permission unconfirmed.",
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Total schedule candidates | ${s.totalCandidates} |`,
    `| humanDecision pending | ${s.humanDecisionPending} |`,
    `| alt-date-conflict | ${s.altDateConflictCount} |`,
    `| excluded NO PHOTO | ${s.excludedNoPhoto} |`,
    "",
    "## By assetType",
    "",
    "| assetType | Count |",
    "| --- | ---: |",
    ...Object.entries(s.byAssetType).map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## By confidence",
    "",
    "| confidence | Count |",
    "| --- | ---: |",
    ...Object.entries(s.byConfidence).map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## By review issue",
    "",
    "| reviewIssue | Count |",
    "| --- | ---: |",
    ...Object.entries(s.byReviewIssue).map(([k, v]) => `| ${k} | ${v} |`),
    "",
    "## Candidate table",
    "",
    "| legacyId | date | title | venue | assetType | targetColumn | fileNameHint | confidence | reviewIssue | recommendedAction | humanDecision |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...review.candidates.map((c) =>
      `| ${c.legacyId} | ${c.date ?? "—"} | ${String(c.title ?? "").replace(/\|/g, "/")} | ${c.venue ?? "—"} | ${c.assetType} | ${c.targetColumn} | ${c.fileNameHint ?? "—"} | ${c.confidence} | ${c.reviewIssue} | ${c.recommendedAction} | ${c.humanDecision} |`,
    ),
    "",
    "## `20260327.png` alt-date-conflict (detail)",
    "",
  ];

  if (review.conflict20260327.length) {
    for (const c of review.conflict20260327) {
      lines.push(
        `### ${c.legacyId} — ${c.assetType} (${c.targetColumn})`,
        "",
        "| Field | Value |",
        "| --- | --- |",
        `| DB schedule date | **${c.dbDate}** |`,
        `| Filename hint | **${c.fileNameHint}** |`,
        `| Date parsed from filename | ${c.filenameDateFromHint ?? "—"} |`,
        `| Alt text | ${c.altText ?? "—"} |`,
        `| Alt suggests date | ${c.dateConflict?.altTextSuggests ?? inferDateFromAlt(c.altText) ?? "—"} |`,
        `| Surrounding text | ${c.surroundingText ?? "—"} |`,
        `| Mapped legacy_id | ${c.legacyId} (${c.title}) |`,
        `| Human question | Is this image for **2026-03-25** (DB) or **2026-03-27** (filename)? |`,
        `| Recommended action | **${c.recommendedAction}** |`,
        "",
      );
    }
  } else {
    lines.push("_No 20260327.png candidates in review set._", "");
  }

  lines.push(
    "## Excluded: NO PHOTO",
    "",
    "The following are **intentionally excluded** — no real image URL exists on the source site:",
    "",
    ...review.excluded.noPhoto.map(
      (e) => `- **${e.legacyId}** (${e.date ?? "—"}): ${e.reason ?? e.notes}`,
    ),
    "",
    "HTML comment-only cross-page notes and hero/about/contact images are also out of scope.",
    "",
    "## Decisions required before G-4e",
    "",
    "1. For each candidate, set `humanDecision` in `schedule-image-human-decision-template.json`",
    "2. Resolve **20260327.png**: confirm event date before any upload to `schedule-2026-03-011`",
    "3. Decide per event:",
    "   - `home_image_url` only?",
    "   - `image_url` (month page flyer) too?",
    "   - Both columns with same Wix URL?",
    "   - Defer or reject?",
    "4. Copyright / re-host permission still required (staging-only until owner confirms)",
    "",
    "## G-4e gate",
    "",
    "- [ ] All schedule candidates have `humanDecision` ≠ `pending`",
    "- [ ] alt-date-conflict resolved with written reason",
    "- [ ] Approved rows promoted to allowlist `approvedForStagingUpload`",
    "- [ ] Then: Storage upload (G-4e) → DB update → export → build → FTP",
    "",
    "## Safety",
    "",
    "- Storage upload: **not performed**",
    "- DB update: **not performed**",
    "- FTP deploy: **not performed**",
    "- Secrets: **not included**",
    "",
    `**Decision template:** \`${opts.decisionTemplatePath ?? "schedule-image-human-decision-template.json"}\``,
    "",
  );

  return `${lines.join("\n")}\n`;
}
