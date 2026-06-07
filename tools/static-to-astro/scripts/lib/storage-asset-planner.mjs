/**
 * Storage asset plan generator (Phase 3-U).
 * Dry-run: classify image URLs from seed/data JSON for Supabase Storage migration.
 * No uploads, no Supabase connection.
 */

import fs from "node:fs";
import path from "node:path";

export const DEFAULT_BUCKET = "site-assets";

export const TARGET_FIELDS = [
  { sourceTable: "schedules", sourceField: "image_url", assetKind: "flyer" },
  { sourceTable: "schedules", sourceField: "home_image_url", assetKind: "home" },
  { sourceTable: "discography", sourceField: "cover_image_url", assetKind: "cover" },
];

/**
 * @param {string | null | undefined} url
 */
export function classifySourceType(url) {
  if (url == null || String(url).trim() === "") return "empty";
  const trimmed = String(url).trim();
  if (/^https?:\/\/(static\.)?wixstatic\.com/i.test(trimmed)) return "wix";
  if (/^https?:\/\/static\.parastorage\.com/i.test(trimmed)) return "wix";
  if (/^https?:\/\/[^/]*\.supabase\.co\/storage\//i.test(trimmed)) return "supabase";
  if (/^https?:\/\//i.test(trimmed)) return "external";
  if (trimmed.startsWith("/") || !trimmed.includes("://")) return "local";
  return "external";
}

/**
 * @param {string} sourceType
 */
export function actionForSourceType(sourceType) {
  switch (sourceType) {
    case "supabase":
      return "keep";
    case "wix":
      return "review-required";
    case "external":
      return "review-required";
    case "local":
      return "download-and-upload";
    case "empty":
      return "skip";
    default:
      return "review-required";
  }
}

/**
 * @param {string} sourceType
 */
export function reasonForAction(sourceType, action) {
  switch (action) {
    case "keep":
      return "Already on Supabase Storage — no migration needed";
    case "review-required":
      return "Copyright / re-host permission must be confirmed before upload (Wix or external URL)";
    case "download-and-upload":
      return "Local asset candidate — dry-run only in Phase 3-U (no upload performed)";
    case "skip":
      return "Empty URL — no image to migrate";
    default:
      return "Manual review required";
  }
}

/**
 * @param {{ siteSlug: string, sourceTable: string, assetKind: string, legacyId: string }} params
 */
export function buildTargetPath({ siteSlug, sourceTable, assetKind, legacyId }) {
  if (sourceTable === "discography") {
    return `${siteSlug}/discography/${legacyId}/cover.webp`;
  }
  if (assetKind === "home") {
    return `${siteSlug}/schedule/${legacyId}/home.webp`;
  }
  return `${siteSlug}/schedule/${legacyId}/flyer.webp`;
}

function readJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Array.isArray(data) ? data : null;
}

/**
 * @param {{ seedDir: string, dataDir?: string | null }} opts
 */
export function loadImageSourceRows({ seedDir, dataDir = null }) {
  const seedAbs = path.resolve(seedDir);
  const schedules =
    readJsonArray(path.join(seedAbs, "seed-schedules.json")) ??
    (dataDir ? readJsonArray(path.join(path.resolve(dataDir), "schedules.json")) : null) ??
    [];
  const discography =
    readJsonArray(path.join(seedAbs, "seed-discography.json")) ??
    (dataDir ? readJsonArray(path.join(path.resolve(dataDir), "discography.json")) : null) ??
    [];

  return { schedules, discography, seedAbs };
}

/**
 * @param {{ siteSlug: string, bucket: string, seedDir: string, dataDir?: string | null }} opts
 */
export function buildStorageAssetPlan({ siteSlug, bucket, seedDir, dataDir = null }) {
  const { schedules, discography } = loadImageSourceRows({ seedDir, dataDir });
  /** @type {Array<object>} */
  const assets = [];

  for (const row of schedules) {
    const legacyId = row.legacy_id ?? row.id;
    if (!legacyId) continue;

    for (const { sourceTable, sourceField, assetKind } of TARGET_FIELDS.filter(
      (f) => f.sourceTable === "schedules",
    )) {
      const sourceUrl = row[sourceField] ?? null;
      const sourceType = classifySourceType(sourceUrl);
      const action = actionForSourceType(sourceType);
      assets.push({
        sourceTable,
        sourceField,
        legacy_id: legacyId,
        sourceUrl,
        sourceType,
        targetPath:
          sourceType === "empty" ? null : buildTargetPath({ siteSlug, sourceTable, assetKind, legacyId }),
        targetField: sourceField,
        bucket,
        action,
        reason: reasonForAction(sourceType, action),
      });
    }
  }

  for (const row of discography) {
    const legacyId = row.legacy_id ?? row.id;
    if (!legacyId) continue;

    const sourceUrl = row.cover_image_url ?? null;
    const sourceType = classifySourceType(sourceUrl);
    const action = actionForSourceType(sourceType);
    assets.push({
      sourceTable: "discography",
      sourceField: "cover_image_url",
      legacy_id: legacyId,
      sourceUrl,
      sourceType,
      targetPath:
        sourceType === "empty"
          ? null
          : buildTargetPath({ siteSlug, sourceTable: "discography", assetKind: "cover", legacyId }),
      targetField: "cover_image_url",
      bucket,
      action,
      reason: reasonForAction(sourceType, action),
    });
  }

  const summary = {
    total: assets.length,
    supabase: assets.filter((a) => a.sourceType === "supabase").length,
    wix: assets.filter((a) => a.sourceType === "wix").length,
    external: assets.filter((a) => a.sourceType === "external").length,
    local: assets.filter((a) => a.sourceType === "local").length,
    empty: assets.filter((a) => a.sourceType === "empty").length,
    reviewRequired: assets.filter((a) => a.action === "review-required").length,
    keep: assets.filter((a) => a.action === "keep").length,
    downloadAndUpload: assets.filter((a) => a.action === "download-and-upload").length,
    skip: assets.filter((a) => a.action === "skip").length,
  };

  return {
    mode: "dry-run",
    siteSlug,
    bucket,
    targetFields: TARGET_FIELDS.map((f) => `${f.sourceTable}.${f.sourceField}`),
    assets,
    summary,
    uploadsPerformed: false,
  };
}

/**
 * @param {ReturnType<typeof buildStorageAssetPlan>} plan
 */
export function formatStorageAssetPlanReport(plan, { reportPath, manifestPath, seedDir, dataDir }) {
  const lines = [
    "# Storage Asset Plan Report (Phase 3-U)",
    "",
    `- **Mode:** ${plan.mode}`,
    `- **Site slug:** \`${plan.siteSlug}\``,
    `- **Bucket:** \`${plan.bucket}\``,
    `- **Seed dir:** \`${seedDir}\``,
  ];

  if (dataDir) lines.push(`- **Data dir:** \`${dataDir}\``);
  lines.push(
    "",
    "> **Dry-run only — no files uploaded to Supabase Storage.**",
    "> **Wix / external images are NOT auto re-hosted.** Copyright review required.",
    "",
    "## Target fields",
    "",
    ...plan.targetFields.map((f) => `- \`${f}\``),
    "",
    "## Summary",
    "",
    "| Metric | Count |",
    "| --- | ---: |",
    `| Total asset rows | ${plan.summary.total} |`,
    `| supabase (keep) | ${plan.summary.supabase} |`,
    `| wix (review-required) | ${plan.summary.wix} |`,
    `| external (review-required) | ${plan.summary.external} |`,
    `| local (download-and-upload candidate) | ${plan.summary.local} |`,
    `| empty (skip) | ${plan.summary.empty} |`,
    `| **review-required** | ${plan.summary.reviewRequired} |`,
    `| **keep** | ${plan.summary.keep} |`,
    `| **download-and-upload** | ${plan.summary.downloadAndUpload} |`,
    `| **skip** | ${plan.summary.skip} |`,
    "",
    "## Recommended path layout",
    "",
    "```text",
    `${plan.bucket}/${plan.siteSlug}/schedule/{legacy_id}/flyer.webp`,
    `${plan.bucket}/${plan.siteSlug}/schedule/{legacy_id}/home.webp`,
    `${plan.bucket}/${plan.siteSlug}/discography/{legacy_id}/cover.webp`,
    "```",
    "",
  );

  const reviewRequired = plan.assets.filter((a) => a.action === "review-required");
  const keep = plan.assets.filter((a) => a.action === "keep");
  const uploadCandidates = plan.assets.filter((a) => a.action === "download-and-upload");

  lines.push("## review-required", "");
  if (!reviewRequired.length) {
    lines.push("_None_", "");
  } else {
    for (const a of reviewRequired) {
      lines.push(
        `- \`${a.sourceTable}.${a.sourceField}\` \`${a.legacy_id}\` (${a.sourceType}): ${truncateUrl(a.sourceUrl)}`,
      );
    }
    lines.push("");
  }

  lines.push("## keep (Supabase Storage URLs)", "");
  if (!keep.length) {
    lines.push("_None_", "");
  } else {
    for (const a of keep) {
      lines.push(`- \`${a.legacy_id}\` \`${a.sourceField}\`: ${truncateUrl(a.sourceUrl)}`);
    }
    lines.push("");
  }

  lines.push("## download-and-upload candidates (dry-run only)", "");
  if (!uploadCandidates.length) {
    lines.push("_None in current seed — local paths would appear here_", "");
  } else {
    for (const a of uploadCandidates) {
      lines.push(`- \`${a.legacy_id}\` → \`${a.targetPath}\``);
    }
    lines.push("");
  }

  lines.push(
    "## Production status",
    "",
    "- **Storage upload:** NOT performed (Phase 3-U)",
    "- **Storage bucket / RLS policy:** NOT applied",
    "- **Production Supabase / Storage / Sariswing:** NOT affected",
    "",
    "## Path vs public URL (design note)",
    "",
    "- **Long-term:** store Storage path in DB; compose public URL at export/build time",
    "- **Short-term compat:** keep `image_url` / `home_image_url` / `cover_image_url` as public URLs in seed/export",
    "",
    "## Next phases",
    "",
    "- Phase 3-U+ / 3-H: staging Storage upload (after copyright sign-off)",
    "- Image resize / WebP pipeline",
    "- Admin UI cover/flyer upload",
    "- Storage RLS policy apply (staging first)",
    "",
    "---",
    `Manifest: \`${manifestPath}\``,
    `Report: \`${reportPath}\``,
    "",
  );

  return lines.join("\n");
}

function truncateUrl(url) {
  if (!url) return "—";
  const s = String(url);
  if (s.length <= 72) return `\`${s}\``;
  return `\`${s.slice(0, 69)}…\``;
}

/**
 * @param {ReturnType<typeof buildStorageAssetPlan>} plan
 */
export function buildManifestJson(plan) {
  return {
    mode: plan.mode,
    siteSlug: plan.siteSlug,
    bucket: plan.bucket,
    assets: plan.assets,
    summary: plan.summary,
    uploadsPerformed: false,
  };
}
