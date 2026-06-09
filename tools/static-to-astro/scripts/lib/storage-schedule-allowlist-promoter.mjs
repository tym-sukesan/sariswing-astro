/**
 * Schedule upload allowlist promoter (G-4e).
 * Promotes human-approved schedule_home entries to schedule-upload-allowlist.json.
 * Read-only: no Storage upload, no DB update.
 */

import fs from "node:fs";
import path from "node:path";
import {
  APPROVAL_SCOPE,
  COPYRIGHT_STATUS,
} from "./storage-upload-allowlist-generator.mjs";
import { extractFileNameHint } from "./storage-schedule-human-review-generator.mjs";

export const SUPPORTED_PROMOTE_DECISION = "approve_home_only";

/**
 * @param {string} templatePath
 */
export function loadDecisionTemplate(templatePath) {
  const abs = path.resolve(templatePath);
  const data = JSON.parse(fs.readFileSync(abs, "utf8"));
  if (!Array.isArray(data.decisions)) {
    throw new Error("Decision template must contain decisions array");
  }
  return { abs, data };
}

/**
 * @param {object} decision
 */
export function inferSourceKind(decision) {
  const url = String(decision.sourceUrl ?? "");
  if (/wixstatic\.com|parastorage\.com/i.test(url)) return "wix_image";
  if (/^https?:\/\//i.test(url)) return "external_image";
  if (url.startsWith("/") || (!url.includes("://") && url)) return "local_image";
  return "unknown";
}

/**
 * @param {object} decision
 */
export function hasAltDateConflictDecision(decision) {
  if (decision.reviewIssue === "alt-date-conflict") return true;
  if (decision.altDateConflict?.requiresHumanConfirmation) return true;
  const hint = decision.fileNameHint ?? extractFileNameHint(decision.sourceUrl);
  if (hint === "20260327.png" || /alt-date-conflict/i.test(decision.notes ?? "")) {
    return true;
  }
  return false;
}

/**
 * @param {object} decision
 */
export function validateDecisionForPromote(decision) {
  /** @type {string[]} */
  const errors = [];

  const decisionValue = decision.humanDecision ?? "pending";

  if (decisionValue === "approve_flyer_only" || decisionValue === "approve_both") {
    errors.push(
      `${decision.legacyId}/${decision.targetColumn}: ${decisionValue} is not supported in G-4e (home_image_url only)`,
    );
    return { promotable: false, errors, bucket: "deferred" };
  }

  if (decisionValue === "reject") {
    return { promotable: false, errors: [], bucket: "rejected" };
  }

  if (decisionValue === "pending" || decisionValue === "defer") {
    return { promotable: false, errors: [], bucket: "deferred" };
  }

  if (decisionValue !== SUPPORTED_PROMOTE_DECISION) {
    errors.push(`Unsupported humanDecision: ${decisionValue}`);
    return { promotable: false, errors, bucket: "deferred" };
  }

  if (decision.assetType !== "schedule_home") {
    errors.push(`${decision.legacyId}: approve_home_only requires assetType schedule_home`);
    return { promotable: false, errors, bucket: "deferred" };
  }

  if (decision.targetColumn !== "home_image_url") {
    errors.push(`${decision.legacyId}: approve_home_only requires targetColumn home_image_url`);
    return { promotable: false, errors, bucket: "deferred" };
  }

  if (decision.assetType === "schedule_flyer" || decision.targetColumn === "image_url") {
    errors.push(`${decision.legacyId}: schedule_flyer / image_url not promotable in G-4e`);
    return { promotable: false, errors, bucket: "deferred" };
  }

  if (hasAltDateConflictDecision(decision)) {
    if (!String(decision.decisionReason ?? "").trim()) {
      errors.push(
        `${decision.legacyId}: alt-date-conflict requires decisionReason before promote`,
      );
      return { promotable: false, errors, bucket: "deferred" };
    }
    errors.push(`${decision.legacyId}: alt-date-conflict entries cannot be promoted in G-4e`);
    return { promotable: false, errors, bucket: "deferred" };
  }

  if (!String(decision.decisionReason ?? "").trim()) {
    errors.push(`${decision.legacyId}: decisionReason is required for approve_home_only`);
    return { promotable: false, errors, bucket: "deferred" };
  }

  if (!decision.sourceUrl || /example\.supabase\.co/i.test(decision.sourceUrl)) {
    errors.push(`${decision.legacyId}: invalid or placeholder sourceUrl`);
    return { promotable: false, errors, bucket: "deferred" };
  }

  return { promotable: true, errors: [], bucket: "approved" };
}

/**
 * @param {object} decision
 */
export function buildApprovedScheduleEntry(decision) {
  const sourceKind = inferSourceKind(decision);
  let confidence = "medium";
  if (decision.reviewIssue === "home-only") confidence = "high";
  if (decision.recommendedAction === "approve_home_only") confidence = "high";

  return {
    assetType: "schedule_home",
    legacyId: decision.legacyId,
    targetTable: "schedules",
    targetColumn: "home_image_url",
    sourceUrl: decision.sourceUrl,
    sourceKind,
    confidence,
    targetStoragePath: decision.targetStoragePath ?? null,
    sourceFile: "index.html",
    humanDecision: decision.humanDecision,
    decisionReason: decision.decisionReason,
    approvalScope: decision.approvalScope ?? APPROVAL_SCOPE,
    copyrightStatus: decision.copyrightStatus ?? COPYRIGHT_STATUS,
    reviewIssue: decision.reviewIssue ?? null,
    fileNameHint: decision.fileNameHint ?? extractFileNameHint(decision.sourceUrl),
    title: decision.title ?? null,
    venue: decision.venue ?? null,
    date: decision.date ?? null,
    dbUpdatePending: false,
    notes: decision.notes ?? "",
  };
}

/**
 * @param {object} decision
 * @param {string} reason
 */
export function buildDeferredEntry(decision, reason) {
  return {
    legacyId: decision.legacyId,
    assetType: decision.assetType,
    targetColumn: decision.targetColumn,
    humanDecision: decision.humanDecision ?? "pending",
    reviewIssue: decision.reviewIssue ?? null,
    fileNameHint: decision.fileNameHint ?? null,
    reason,
    decisionReason: decision.decisionReason ?? null,
  };
}

/**
 * @param {object} decision
 */
export function buildRejectedEntry(decision) {
  return {
    legacyId: decision.legacyId,
    assetType: decision.assetType,
    targetColumn: decision.targetColumn,
    humanDecision: "reject",
    reason: decision.decisionReason || "rejected by human review",
  };
}

function deferReasonFor(decision) {
  const d = decision.humanDecision ?? "pending";
  if (d === "defer") return decision.decisionReason || decision.reviewIssue || "deferred by human review";
  if (d === "pending") return "humanDecision still pending";
  if (decision.reviewIssue === "alt-date-conflict") return "alt-date-conflict";
  if (decision.assetType === "schedule_flyer") return "schedule_flyer not approved in G-4e";
  if (decision.targetColumn === "image_url") return "image_url not approved in G-4e";
  if (decision.reviewIssue === "cross-page-inferred") return "cross-page-inferred";
  return decision.reviewIssue || "not promoted";
}

/**
 * @param {{ decisionTemplatePath: string, siteSlug: string }} opts
 */
export function buildScheduleUploadAllowlist(opts) {
  const { data: template } = loadDecisionTemplate(opts.decisionTemplatePath);

  if (template.siteSlug && template.siteSlug !== opts.siteSlug) {
    throw new Error(
      `Template siteSlug=${template.siteSlug} does not match --site-slug=${opts.siteSlug}`,
    );
  }

  /** @type {object[]} */
  const approvedForStagingUpload = [];
  /** @type {object[]} */
  const deferred = [];
  /** @type {object[]} */
  const rejected = [];
  /** @type {string[]} */
  const validationErrors = [];

  for (const decision of template.decisions) {
    const result = validateDecisionForPromote(decision);

    if (result.errors.length) {
      validationErrors.push(...result.errors);
    }

    if (result.promotable) {
      approvedForStagingUpload.push(buildApprovedScheduleEntry(decision));
      continue;
    }

    if (result.bucket === "rejected" || decision.humanDecision === "reject") {
      rejected.push(buildRejectedEntry(decision));
      continue;
    }

    deferred.push(buildDeferredEntry(decision, deferReasonFor(decision)));
  }

  const blockingErrors = validationErrors.filter((e) =>
    /not supported|requires decisionReason|invalid or placeholder/.test(e),
  );
  if (blockingErrors.length) {
    throw new Error(`Promote validation failed:\n${blockingErrors.map((e) => `  - ${e}`).join("\n")}`);
  }

  return {
    siteSlug: opts.siteSlug,
    mode: "dry-run",
    uploadAllowed: false,
    dbUpdateAllowed: false,
    generatedAt: new Date().toISOString(),
    sourceDecisionTemplate: path.resolve(opts.decisionTemplatePath),
    approvalScopeNote:
      "Approved schedule entries are staging upload candidates only. Production permission NOT confirmed.",
    summary: {
      approvedForStagingUpload: approvedForStagingUpload.length,
      deferred: deferred.length,
      rejected: rejected.length,
      totalDecisions: template.decisions.length,
    },
    approvedForStagingUpload,
    deferred,
    rejected,
  };
}

/**
 * @param {ReturnType<typeof buildScheduleUploadAllowlist>} allowlist
 * @param {{ reportPath?: string, allowlistPath?: string, decisionTemplatePath?: string }} [opts]
 */
export function formatScheduleUploadAllowlistReport(allowlist, opts = {}) {
  const s = allowlist.summary;
  const lines = [
    "# Schedule Upload Allowlist Report (G-4e)",
    "",
    "**Mode:** dry-run allowlist promotion — **no Supabase upload, no DB update, no FTP deploy**",
    "",
    `**Generated:** ${allowlist.generatedAt}`,
    `**Site slug:** ${allowlist.siteSlug}`,
    `**Decision template:** \`${opts.decisionTemplatePath ?? "schedule-image-human-decision-template.json"}\``,
    `**Allowlist output:** \`${opts.allowlistPath ?? "schedule-upload-allowlist.json"}\``,
    "",
    "> Only `approve_home_only` + `schedule_home` + `home_image_url` promoted in G-4e.",
    "> Golden PODs home image approved; `20260327.png` alt-date-conflict remains deferred.",
    "",
    "## Summary",
    "",
    "| Bucket | Count |",
    "| --- | ---: |",
    `| approvedForStagingUpload | ${s.approvedForStagingUpload} |`,
    `| deferred | ${s.deferred} |`,
    `| rejected | ${s.rejected} |`,
    `| uploadAllowed | **${allowlist.uploadAllowed}** |`,
    `| dbUpdateAllowed | **${allowlist.dbUpdateAllowed}** |`,
    "",
  ];

  if (allowlist.approvedForStagingUpload.length) {
    lines.push(
      "## Approved for staging upload",
      "",
      "| legacyId | title | targetColumn | fileNameHint | humanDecision |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const e of allowlist.approvedForStagingUpload) {
      lines.push(
        `| ${e.legacyId} | ${String(e.title ?? "").replace(/\|/g, "/")} | ${e.targetColumn} | ${e.fileNameHint ?? "—"} | ${e.humanDecision} |`,
      );
    }
    lines.push("");
    for (const e of allowlist.approvedForStagingUpload) {
      lines.push(
        `### ${e.legacyId} — ${e.title}`,
        "",
        "| Field | Value |",
        "| --- | --- |",
        `| targetColumn | **${e.targetColumn}** (not image_url) |`,
        `| sourceUrl | ${e.sourceUrl} |`,
        `| targetStoragePath | ${e.targetStoragePath ?? "—"} |`,
        `| decisionReason | ${e.decisionReason} |`,
        `| approvalScope | ${e.approvalScope} |`,
        `| copyrightStatus | ${e.copyrightStatus} |`,
        `| dbUpdatePending | ${e.dbUpdatePending} |`,
        "",
      );
    }
  } else {
    lines.push("_No entries approved._", "");
  }

  if (allowlist.deferred.length) {
    lines.push("## Deferred", "", "| legacyId | targetColumn | humanDecision | reason |", "| --- | --- | --- | --- |");
    for (const e of allowlist.deferred) {
      lines.push(`| ${e.legacyId} | ${e.targetColumn} | ${e.humanDecision} | ${e.reason} |`);
    }
    lines.push("");
  }

  lines.push(
    "## Not approved in G-4e",
    "",
    "- `schedule-2026-03-011` / `20260327.png`: **alt-date-conflict** — remains deferred",
    "- All `schedule_flyer` / `image_url` rows: **not promoted**",
    "- `approve_flyer_only` / `approve_both`: **not supported** in this phase",
    "",
    "## G-4f gate (next: Storage upload)",
    "",
    "- [ ] `schedule-upload-allowlist.json` reviewed",
    "- [ ] Only 1 approved row (`schedule-2026-03-012` home_image_url)",
    "- [ ] Staging bucket `site-assets` exists",
    "- [ ] Run `upload-storage-assets.mjs` with schedule allowlist (G-4f)",
    "",
    "## G-4g gate (after upload: DB update)",
    "",
    "- [ ] Update `schedules.home_image_url` for approved legacy_id only",
    "- [ ] Do not update `image_url` until flyer human review completes",
    "",
    "## Safety",
    "",
    "- Storage upload: **not performed**",
    "- DB update: **not performed**",
    "- FTP deploy: **not performed**",
    "- Secrets: **not included**",
    "",
  );

  return `${lines.join("\n")}\n`;
}

/**
 * Apply G-4e default human decisions for gosaki Golden PODs promote scenario.
 * @param {object} template
 */
export function applyGosakiG4eGoldenPodsDecisions(template) {
  const goldenReason =
    "Golden PODs home image approved for staging home_image_url only. Do not use as monthly flyer image_url yet.";

  for (const decision of template.decisions) {
    if (
      decision.legacyId === "schedule-2026-03-012" &&
      decision.assetType === "schedule_home" &&
      decision.targetColumn === "home_image_url"
    ) {
      decision.humanDecision = "approve_home_only";
      decision.decisionReason = goldenReason;
      decision.approvalScope = APPROVAL_SCOPE;
      decision.copyrightStatus = COPYRIGHT_STATUS;
      continue;
    }

    if (decision.humanDecision === "pending") {
      decision.humanDecision = "defer";
      if (!decision.decisionReason) {
        if (decision.reviewIssue === "alt-date-conflict") {
          decision.decisionReason =
            "alt-date-conflict (20260327.png vs DB 2026-03-25) — deferred pending human confirmation";
        } else if (decision.assetType === "schedule_flyer") {
          decision.decisionReason =
            "schedule_flyer / image_url not approved in G-4e — home_image_url only scope";
        } else {
          decision.decisionReason = "Deferred in G-4e — only Golden PODs home_image_url promoted";
        }
      }
    }
  }

  return template;
}
