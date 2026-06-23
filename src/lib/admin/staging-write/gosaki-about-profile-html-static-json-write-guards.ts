/**
 * G-10h4a — Gosaki About profile HTML static JSON write guards.
 */

import {
  G10H4A_ABOUT_CONTENT_CONFIG_REL,
  G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4A_ALLOWED_FIELDS,
  G10H4A_PROFILE_HTML_MAX_LENGTH,
  G10H4A_SITE_SLUG,
  G10H4A_TARGET_BLOCK_ID,
  G10H4A_TOTAL_HTML_MAX_LENGTH,
  type G10h4aAboutContentBlockSnapshot,
  type G10h4aAboutContentConfigSnapshot,
  type G10h4aAllowedField,
  type G10h4aHtmlSafetyResult,
  type G10h4aProfileHtmlFormValues,
} from "./gosaki-about-profile-html-static-json-write-types";

export function assertG10h4aApproval(
  approvalId: string,
): asserts approvalId is typeof G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID {
  if (approvalId !== G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID) {
    throw new Error(
      `approvalId must be ${G10H4A_ABOUT_PROFILE_HTML_STATIC_JSON_WRITE_APPROVAL_ID}`,
    );
  }
}

export function assertG10h4aSiteSlug(siteSlug: string): void {
  if (siteSlug !== G10H4A_SITE_SLUG) {
    throw new Error(`siteSlug must be ${G10H4A_SITE_SLUG}`);
  }
}

export function assertG10h4aTargetBlockId(blockId: string): void {
  if (blockId !== G10H4A_TARGET_BLOCK_ID) {
    throw new Error(`blockId must be ${G10H4A_TARGET_BLOCK_ID}`);
  }
}

export function assertG10h4aConfigPathAllowlisted(configPath: string): void {
  const normalized = configPath.replace(/\\/g, "/");
  if (!normalized.endsWith(G10H4A_ABOUT_CONTENT_CONFIG_REL)) {
    throw new Error(`config path must be ${G10H4A_ABOUT_CONTENT_CONFIG_REL}`);
  }
}

export function assertG10h4aChangedFieldsOnly(changedFields: string[]): void {
  for (const field of changedFields) {
    if (!(G10H4A_ALLOWED_FIELDS as readonly string[]).includes(field)) {
      throw new Error(`changed field not allowed: ${field}`);
    }
  }
}

export function assertG10h4aBlocksAffectedExactlyOne(blocksAffected: number): void {
  if (blocksAffected !== 1) {
    throw new Error(`blocksAffected must be 1 (got ${blocksAffected})`);
  }
}

export function findG10h4aTargetBlock(
  config: G10h4aAboutContentConfigSnapshot,
): G10h4aAboutContentBlockSnapshot | null {
  const blocks = Array.isArray(config.blocks) ? config.blocks : [];
  return blocks.find((block) => block?.id === G10H4A_TARGET_BLOCK_ID) ?? null;
}

export function buildG10h4aProfileHtmlPayload(
  formValues: G10h4aProfileHtmlFormValues,
): { html: string } {
  return { html: String(formValues.html ?? "") };
}

export function computeG10h4aProfileHtmlChangedFields(
  beforeBlock: G10h4aAboutContentBlockSnapshot,
  formValues: G10h4aProfileHtmlFormValues,
): G10h4aAllowedField[] {
  const beforeHtml = String(beforeBlock.html ?? "");
  const afterHtml = buildG10h4aProfileHtmlPayload(formValues).html;
  if (beforeHtml === afterHtml) return [];
  return ["html"];
}

export function validateG10h4aProfileHtmlSafety(html: string): G10h4aHtmlSafetyResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (/<script\b/i.test(html)) errors.push("<script> is not allowed in about-profile-html.");
  if (/<iframe\b/i.test(html)) errors.push("<iframe> is not allowed in about-profile-html.");
  if (/\son[a-z]+\s*=/i.test(html)) {
    errors.push("on* event handler attributes are not allowed.");
  }
  if (/javascript:/i.test(html)) errors.push("javascript: URLs are not allowed.");

  if (/<style\b/i.test(html)) {
    warnings.push("<style> block present — review recommended for profile block.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertG10h4aProfileHtmlLength(html: string): void {
  if (html.length > G10H4A_PROFILE_HTML_MAX_LENGTH) {
    throw new Error(
      `html exceeds max length ${G10H4A_PROFILE_HTML_MAX_LENGTH} (got ${html.length}).`,
    );
  }
}

export function assertG10h4aTotalHtmlLength(
  config: G10h4aAboutContentConfigSnapshot,
  nextProfileHtml: string,
): void {
  const blocks = Array.isArray(config.blocks) ? config.blocks : [];
  let total = 0;
  for (const block of blocks) {
    if (block?.id === G10H4A_TARGET_BLOCK_ID) {
      total += nextProfileHtml.length;
    } else {
      total += String(block?.html ?? "").length;
    }
  }
  if (total > G10H4A_TOTAL_HTML_MAX_LENGTH) {
    throw new Error(
      `total html exceeds max length ${G10H4A_TOTAL_HTML_MAX_LENGTH} (got ${total}).`,
    );
  }
}

export function assertG10h4aConfigSiteSlug(config: G10h4aAboutContentConfigSnapshot): void {
  assertG10h4aSiteSlug(String(config.siteSlug ?? "").trim());
}
