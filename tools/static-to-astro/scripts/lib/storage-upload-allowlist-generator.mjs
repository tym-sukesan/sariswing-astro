/**
 * Storage upload allowlist generator (G-4b-prep).
 * Classifies G-4a review manifest entries for staging upload gating.
 * Read-only: no Supabase upload, no DB update.
 */

import fs from "node:fs";

export const ALLOWLIST_DECISIONS = [
  "approved_for_staging_upload",
  "needs_human_review",
  "rejected_or_deferred",
];

export const APPROVAL_SCOPE = "staging-only";
export const COPYRIGHT_STATUS = "needs-owner-confirmation-before-production";

const REJECTED_SOURCE_KINDS = new Set(["empty", "placeholder_example", "logo_or_icon", "unknown"]);
const APPROVED_SOURCE_KINDS = new Set(["wix_image", "external_image"]);

/**
 * @param {object} entry Review manifest entry
 */
export function hasAltDateConflict(entry) {
  const text = `${entry.notes ?? ""} ${entry.sourceUrl ?? ""}`.toLowerCase();
  return /alt-date-conflict|20260327\.png|date-conflict/.test(text);
}

/**
 * @param {object} entry
 */
export function isCrossPageOrInferred(entry) {
  const notes = String(entry.notes ?? "").toLowerCase();
  return (
    /cross-page|inferred|not auto-placed|html_comment|comment only|synthetic/.test(notes) ||
    entry.assetType === "schedule_flyer"
  );
}

/**
 * @param {object} entry
 */
export function isOutOfScopeDecorative(entry) {
  const notes = String(entry.notes ?? "").toLowerCase();
  return (
    entry.assetType === "unknown" &&
    (/out of scope|hero|about|contact|main visual|profile photo|decorative/.test(notes) ||
      ["about.html", "contact.html", "index.html"].includes(entry.sourceFile ?? ""))
  );
}

/**
 * @param {object} entry
 */
export function isNoPhotoEmpty(entry) {
  const notes = String(entry.notes ?? "").toLowerCase();
  return (
    entry.sourceKind === "empty" ||
    /no photo|flyer-placeholder|no wix url/.test(notes)
  );
}

/**
 * @param {object} entry
 */
export function qualifiesForApprovedStagingUpload(entry) {
  if (entry.assetType !== "discography_cover") return false;
  if (entry.confidence !== "high") return false;
  if (!entry.legacyId) return false;
  if (entry.targetTable !== "discography") return false;
  if (entry.targetColumn !== "cover_image_url") return false;
  if (!APPROVED_SOURCE_KINDS.has(entry.sourceKind)) return false;
  if (!String(entry.sourceUrl ?? "").trim()) return false;
  if (entry.sourceKind === "placeholder_example") return false;
  if (REJECTED_SOURCE_KINDS.has(entry.sourceKind)) return false;
  return true;
}

/**
 * @param {object} entry
 */
export function qualifiesForNeedsHumanReview(entry) {
  if (qualifiesForApprovedStagingUpload(entry)) return false;

  if (entry.assetType === "schedule_home" || entry.assetType === "schedule_flyer") {
    return true;
  }
  if (entry.confidence === "medium" || entry.confidence === "low") {
    if (entry.assetType === "discography_cover") return true;
    if (entry.targetTable === "schedules") return true;
  }
  if (hasAltDateConflict(entry)) return true;
  if (isCrossPageOrInferred(entry)) return true;
  if (
    entry.targetTable === "schedules" &&
    entry.legacyId &&
    entry.sourceKind !== "empty" &&
    !REJECTED_SOURCE_KINDS.has(entry.sourceKind)
  ) {
    return true;
  }

  return false;
}

/**
 * @param {object} entry
 */
export function classifyAllowlistDecision(entry) {
  if (qualifiesForApprovedStagingUpload(entry)) {
    return {
      decision: "approved_for_staging_upload",
      reason: "Discography cover with high confidence, legacy_id, and valid source URL",
    };
  }

  if (REJECTED_SOURCE_KINDS.has(entry.sourceKind)) {
    return {
      decision: "rejected_or_deferred",
      reason: rejectReasonForSourceKind(entry),
    };
  }

  if (isNoPhotoEmpty(entry)) {
    return {
      decision: "rejected_or_deferred",
      reason: "Empty / NO PHOTO — no upload source available",
    };
  }

  if (entry.assetType === "unknown" || isOutOfScopeDecorative(entry)) {
    return {
      decision: "rejected_or_deferred",
      reason: outOfScopeReason(entry),
    };
  }

  if (qualifiesForNeedsHumanReview(entry)) {
    return {
      decision: "needs_human_review",
      reason: humanReviewReason(entry),
    };
  }

  return {
    decision: "rejected_or_deferred",
    reason: "Does not meet staging upload allowlist criteria — deferred",
  };
}

function rejectReasonForSourceKind(entry) {
  switch (entry.sourceKind) {
    case "empty":
      return "Empty source URL — no image to upload";
    case "placeholder_example":
      return "example.supabase.co placeholder — not a real asset";
    case "logo_or_icon":
      return "Logo/icon/spacer — excluded from CMS storage targets";
    case "unknown":
      return entry.sourceUrl
        ? "Unknown classification — manual review required before any upload"
        : "Comment-only or unresolved candidate without source URL";
    default:
      return `Rejected sourceKind: ${entry.sourceKind}`;
  }
}

function outOfScopeReason(entry) {
  const notes = String(entry.notes ?? "");
  if (/hero|main visual/.test(notes)) {
    return "Home hero — out of G-4 schedule/discography scope";
  }
  if (/about|profile photo/.test(notes)) {
    return "About profile photo — out of G-4 scope";
  }
  if (/contact|decorative/.test(notes)) {
    return "Contact decorative photo — out of G-4 scope";
  }
  if (!entry.sourceUrl) {
    return "HTML comment cross-page note without upload URL — deferred";
  }
  return "Unknown / out-of-scope asset — deferred";
}

function humanReviewReason(entry) {
  const parts = [];
  if (entry.assetType === "schedule_home") parts.push("schedule_home requires human approval");
  if (entry.assetType === "schedule_flyer") parts.push("schedule_flyer cross-page candidate");
  if (hasAltDateConflict(entry)) parts.push("alt-date-conflict");
  if (entry.confidence === "medium" || entry.confidence === "low") {
    parts.push(`confidence:${entry.confidence}`);
  }
  if (isCrossPageOrInferred(entry)) parts.push("inferred/cross-page mapping");
  if (!parts.length) parts.push("Schedule mapping requires human confirmation");
  return parts.join("; ");
}

/**
 * @param {object} entry
 * @param {{ decision: string, reason: string }} classification
 */
export function buildAllowlistItem(entry, classification) {
  return {
    assetType: entry.assetType,
    sourceUrl: entry.sourceUrl ?? null,
    sourceFile: entry.sourceFile ?? null,
    sourceRoute: entry.sourceRoute ?? null,
    legacyId: entry.legacyId ?? null,
    targetTable: entry.targetTable ?? null,
    targetColumn: entry.targetColumn ?? null,
    targetStoragePath: entry.targetStoragePath ?? null,
    sourceKind: entry.sourceKind,
    confidence: entry.confidence ?? null,
    reviewRequired: true,
    approvalScope: APPROVAL_SCOPE,
    copyrightStatus: COPYRIGHT_STATUS,
    allowlistDecision: classification.decision,
    allowlistReason: classification.reason,
    notes: entry.notes ?? "",
  };
}

/**
 * @param {object} reviewManifest Parsed storage-asset-review-manifest.json
 * @param {{ siteSlug?: string }} [opts]
 */
export function buildStorageUploadAllowlist(reviewManifest, opts = {}) {
  const siteSlug = opts.siteSlug ?? reviewManifest.siteSlug;
  const entries = Array.isArray(reviewManifest.entries) ? reviewManifest.entries : [];

  /** @type {object[]} */
  const approvedForStagingUpload = [];
  /** @type {object[]} */
  const needsHumanReview = [];
  /** @type {object[]} */
  const rejectedOrDeferred = [];

  for (const entry of entries) {
    const classification = classifyAllowlistDecision(entry);
    const item = buildAllowlistItem(entry, classification);
    switch (classification.decision) {
      case "approved_for_staging_upload":
        approvedForStagingUpload.push(item);
        break;
      case "needs_human_review":
        needsHumanReview.push(item);
        break;
      default:
        rejectedOrDeferred.push(item);
        break;
    }
  }

  const summary = {
    approvedForStagingUpload: approvedForStagingUpload.length,
    needsHumanReview: needsHumanReview.length,
    rejectedOrDeferred: rejectedOrDeferred.length,
    totalReviewEntries: entries.length,
    discographyCoversApproved: approvedForStagingUpload.filter((e) => e.assetType === "discography_cover")
      .length,
    scheduleNeedsReview: needsHumanReview.filter((e) =>
      ["schedule_home", "schedule_flyer"].includes(e.assetType),
    ).length,
  };

  return {
    siteSlug,
    mode: "dry-run",
    uploadAllowed: false,
    dbUpdateAllowed: false,
    generatedAt: new Date().toISOString(),
    sourceReviewManifest: reviewManifest.generatedAt ?? null,
    approvalScopeNote:
      "Allowlist entries are staging upload candidates only. Production use permission is NOT confirmed.",
    copyrightNote:
      "All assets remain subject to owner/copyright confirmation before production deployment.",
    summary,
    approvedForStagingUpload,
    needsHumanReview,
    rejectedOrDeferred,
  };
}

/**
 * @param {string} manifestPath
 */
export function loadReviewManifest(manifestPath) {
  const raw = fs.readFileSync(manifestPath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.entries)) {
    throw new Error("Review manifest must contain an entries array");
  }
  return data;
}

/**
 * @param {ReturnType<typeof buildStorageUploadAllowlist>} allowlist
 * @param {{ reportPath?: string, allowlistPath?: string, reviewManifestPath?: string }} [opts]
 */
export function formatStorageUploadAllowlistReport(allowlist, opts = {}) {
  const s = allowlist.summary;
  const lines = [
    "# Storage Upload Allowlist Report (G-4b-prep)",
    "",
    "**Mode:** dry-run allowlist preparation — **no Supabase upload, no DB update**",
    "",
    `**Generated:** ${allowlist.generatedAt}`,
    `**Site slug:** ${allowlist.siteSlug}`,
    `**Source review manifest:** ${opts.reviewManifestPath ?? "(review manifest)"}`,
    `**Allowlist output:** ${opts.allowlistPath ?? "storage-upload-allowlist.json"}`,
    "",
    "> Allowlist entries are **staging upload candidates only**. This does **not** confirm production use permission or copyright clearance.",
    "",
    "## Safety flags",
    "",
    "| Flag | Value |",
    "| --- | --- |",
    `| uploadAllowed | **${allowlist.uploadAllowed}** |`,
    `| dbUpdateAllowed | **${allowlist.dbUpdateAllowed}** |`,
    `| approvalScope | **${APPROVAL_SCOPE}** (all entries) |`,
    "",
    "## Summary counts",
    "",
    "| Bucket | Count |",
    "| --- | ---: |",
    `| approvedForStagingUpload | ${s.approvedForStagingUpload} |`,
    `| needsHumanReview | ${s.needsHumanReview} |`,
    `| rejectedOrDeferred | ${s.rejectedOrDeferred} |`,
    `| Total review entries | ${s.totalReviewEntries} |`,
    "",
    "## Approved for staging upload",
    "",
    `Discography covers approved: **${s.discographyCoversApproved}** / expected 4`,
    "",
    ...tableSection(
      allowlist.approvedForStagingUpload,
      ["legacyId", "targetStoragePath", "sourceKind", "allowlistReason"],
      "_No entries approved._",
    ),
    "",
    "## Needs human review",
    "",
    `Schedule-related entries pending: **${s.scheduleNeedsReview}**`,
    "",
    ...tableSection(
      allowlist.needsHumanReview,
      ["assetType", "legacyId", "confidence", "allowlistReason", "notes"],
      "_No entries pending human review._",
    ),
    "",
    "## Rejected / deferred",
    "",
    ...rejectedSummarySection(allowlist.rejectedOrDeferred),
    "",
    ...tableSection(
      allowlist.rejectedOrDeferred,
      ["assetType", "sourceKind", "sourceFile", "allowlistReason"],
      "_No rejected/deferred entries._",
    ),
    "",
    "## G-4b gate — confirm before upload apply",
    "",
    "- [ ] Staging Supabase project only (`SUPABASE_URL` is staging — not production)",
    "- [ ] Bucket `site-assets` exists on **staging** with public read policy",
    "- [ ] Upload env: `SUPABASE_SERVICE_ROLE_KEY` available locally — never log or commit",
    "- [ ] Allowlist reviewed: only `approvedForStagingUpload` may proceed in first G-4b batch",
    "- [ ] Schedule images remain in `needsHumanReview` until owner confirms mapping",
    "- [ ] DB update scope documented; backup staging rows before URL updates",
    "- [ ] Owner/copyright confirmation still required before **production** use",
    "- [ ] `needsHumanReview` entries require explicit promotion before upload",
    "",
    "## Status",
    "",
    "- Supabase Storage upload: **not performed**",
    "- DB update: **not performed**",
    "- FTP deploy: **not performed**",
    "- Secrets: not included in this report",
    "",
    "---",
    "",
    "G-4b-prep complete. Promote schedule entries after human review, then proceed to G-4b upload apply (staging only).",
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function tableSection(items, columns, emptyMsg) {
  if (!items.length) return [emptyMsg];
  const header = `| ${columns.join(" | ")} |`;
  const sep = `| ${columns.map(() => "---").join(" | ")} |`;
  const rows = items.map((item) =>
    `| ${columns.map((col) => String(item[col] ?? "—").replace(/\|/g, "\\|").slice(0, 120)).join(" | ")} |`,
  );
  return [header, sep, ...rows];
}

function rejectedSummarySection(items) {
  /** @type {Record<string, number>} */
  const byReason = {};
  for (const item of items) {
    const key = item.allowlistReason ?? "unknown";
    byReason[key] = (byReason[key] ?? 0) + 1;
  }
  const lines = ["| Reason | Count |", "| --- | ---: |"];
  for (const [reason, count] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${reason.replace(/\|/g, "\\|")} | ${count} |`);
  }
  return lines;
}

/**
 * @param {ReturnType<typeof buildStorageUploadAllowlist>} allowlist
 */
export function validateStorageUploadAllowlist(allowlist) {
  /** @type {string[]} */
  const errors = [];
  /** @type {string[]} */
  const warnings = [];

  if (allowlist.uploadAllowed !== false) {
    errors.push("uploadAllowed must be false in G-4b-prep");
  }
  if (allowlist.dbUpdateAllowed !== false) {
    errors.push("dbUpdateAllowed must be false in G-4b-prep");
  }

  for (const item of [
    ...allowlist.approvedForStagingUpload,
    ...allowlist.needsHumanReview,
    ...allowlist.rejectedOrDeferred,
  ]) {
    if (item.approvalScope !== APPROVAL_SCOPE) {
      errors.push(`Entry ${item.legacyId ?? item.sourceFile} missing staging-only approvalScope`);
    }
    if (item.reviewRequired !== true) {
      warnings.push(`Entry ${item.legacyId ?? item.sourceFile} should keep reviewRequired: true`);
    }
  }

  for (const item of allowlist.approvedForStagingUpload) {
    if (item.assetType !== "discography_cover") {
      errors.push(`Approved entry ${item.legacyId} is not discography_cover`);
    }
    if (item.confidence !== "high") {
      errors.push(`Approved entry ${item.legacyId} confidence is not high`);
    }
  }

  for (const item of allowlist.needsHumanReview) {
    if (item.assetType !== "schedule_home" && item.assetType !== "schedule_flyer") {
      warnings.push(`needsHumanReview entry ${item.legacyId ?? item.sourceFile} assetType=${item.assetType}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
