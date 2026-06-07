/**
 * Storage asset uploader stub (Phase 3-U).
 * Upload NOT implemented — dry-run only until copyright review + staging apply phase.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * @param {{ manifestPath: string, apply?: boolean, stagingOnly?: boolean }} opts
 */
export function runStorageAssetUpload(opts) {
  const manifestAbs = path.resolve(opts.manifestPath);
  if (!fs.existsSync(manifestAbs)) {
    throw new Error(`Manifest not found: ${manifestAbs}`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestAbs, "utf8"));

  if (opts.apply) {
    return {
      mode: "blocked",
      applied: false,
      uploadsPerformed: false,
      message:
        "--apply is not implemented in Phase 3-U. Use plan-storage-assets.mjs dry-run only. " +
        "Staging upload will be Phase 3-U+ after copyright review.",
      manifestSummary: manifest.summary ?? null,
    };
  }

  const uploadCandidates = (manifest.assets ?? []).filter(
    (a) => a.action === "download-and-upload" || a.action === "keep",
  );
  const blockedReview = (manifest.assets ?? []).filter((a) => a.action === "review-required");

  return {
    mode: "dry-run",
    applied: false,
    uploadsPerformed: false,
    manifestPath: manifestAbs,
    siteSlug: manifest.siteSlug,
    bucket: manifest.bucket,
    wouldUpload: uploadCandidates.filter((a) => a.action === "download-and-upload").length,
    wouldKeep: uploadCandidates.filter((a) => a.action === "keep").length,
    blockedReviewRequired: blockedReview.length,
    message: "No uploads performed (default dry-run). Wix/external assets require manual review.",
  };
}

/**
 * @param {ReturnType<typeof runStorageAssetUpload>} result
 */
export function formatStorageUploadStubReport(result) {
  return [
    "# Storage Upload Stub Report (Phase 3-U)",
    "",
    `- **Mode:** ${result.mode}`,
    `- **Applied:** ${result.applied ? "yes" : "no"}`,
    `- **Uploads performed:** ${result.uploadsPerformed ? "yes" : "no"}`,
    `- **Message:** ${result.message}`,
    "",
    result.wouldUpload != null
      ? `- **Would upload (local candidates):** ${result.wouldUpload}`
      : "",
    result.blockedReviewRequired != null
      ? `- **Blocked (review-required):** ${result.blockedReviewRequired}`
      : "",
    "",
    "## Status",
    "",
    "- Phase 3-U: upload stub only — **NOT executed**",
    "- Production / staging Storage: **NOT connected**",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}
