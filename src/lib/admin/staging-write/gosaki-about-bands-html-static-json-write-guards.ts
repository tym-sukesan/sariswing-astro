/**
 * G-10h4c — Gosaki About bands HTML static JSON write guards.
 */

import {
  G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID,
  G10H4C_ABOUT_CONTENT_CONFIG_REL,
  G10H4C_ALLOWED_FIELDS,
  G10H4C_BANDS_HTML_MAX_LENGTH,
  G10H4C_SITE_SLUG,
  G10H4C_TARGET_BLOCK_ID,
  G10H4C_TOTAL_HTML_MAX_LENGTH,
  type G10h4cAboutContentBlockSnapshot,
  type G10h4cAboutContentConfigSnapshot,
  type G10h4cAllowedField,
  type G10h4cBandsHtmlFormValues,
  type G10h4cHtmlSafetyResult,
} from "./gosaki-about-bands-html-static-json-write-types";

export function assertG10h4cApproval(
  approvalId: string,
): asserts approvalId is typeof G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID {
  if (approvalId !== G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID) {
    throw new Error(
      `approvalId must be ${G10H4C_ABOUT_BANDS_HTML_STATIC_JSON_WRITE_APPROVAL_ID}`,
    );
  }
}

export function assertG10h4cSiteSlug(siteSlug: string): void {
  if (siteSlug !== G10H4C_SITE_SLUG) {
    throw new Error(`siteSlug must be ${G10H4C_SITE_SLUG}`);
  }
}

export function assertG10h4cTargetBlockId(blockId: string): void {
  if (blockId !== G10H4C_TARGET_BLOCK_ID) {
    throw new Error(`blockId must be ${G10H4C_TARGET_BLOCK_ID}`);
  }
}

export function assertG10h4cConfigPathAllowlisted(configPath: string): void {
  const normalized = configPath.replace(/\\/g, "/");
  if (!normalized.endsWith(G10H4C_ABOUT_CONTENT_CONFIG_REL)) {
    throw new Error(`config path must be ${G10H4C_ABOUT_CONTENT_CONFIG_REL}`);
  }
}

export function assertG10h4cChangedFieldsOnly(changedFields: string[]): void {
  for (const field of changedFields) {
    if (!(G10H4C_ALLOWED_FIELDS as readonly string[]).includes(field)) {
      throw new Error(`changed field not allowed: ${field}`);
    }
  }
}

export function assertG10h4cBlocksAffectedExactlyOne(blocksAffected: number): void {
  if (blocksAffected !== 1) {
    throw new Error(`blocksAffected must be 1 (got ${blocksAffected})`);
  }
}

export function findG10h4cTargetBlock(
  config: G10h4cAboutContentConfigSnapshot,
): G10h4cAboutContentBlockSnapshot | null {
  const blocks = Array.isArray(config.blocks) ? config.blocks : [];
  return blocks.find((block) => block?.id === G10H4C_TARGET_BLOCK_ID) ?? null;
}

export function buildG10h4cBandsHtmlPayload(
  formValues: G10h4cBandsHtmlFormValues,
): { html: string } {
  return { html: String(formValues.html ?? "") };
}

export function computeG10h4cBandsHtmlChangedFields(
  beforeBlock: G10h4cAboutContentBlockSnapshot,
  formValues: G10h4cBandsHtmlFormValues,
): G10h4cAllowedField[] {
  const beforeHtml = String(beforeBlock.html ?? "");
  const afterHtml = buildG10h4cBandsHtmlPayload(formValues).html;
  if (beforeHtml === afterHtml) return [];
  return ["html"];
}

export function validateG10h4cBandsHtmlSafety(html: string): G10h4cHtmlSafetyResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (/<script\b/i.test(html)) errors.push("<script> is not allowed in about-bands-html.");
  if (/<iframe\b/i.test(html)) errors.push("<iframe> is not allowed in about-bands-html.");
  if (/\son[a-z]+\s*=/i.test(html)) {
    errors.push("on* event handler attributes are not allowed.");
  }
  if (/javascript:/i.test(html)) errors.push("javascript: URLs are not allowed.");

  if (/<style\b/i.test(html)) {
    warnings.push("<style> block present — allowed for bands block.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function assertG10h4cBandsHtmlLength(html: string): void {
  if (html.length > G10H4C_BANDS_HTML_MAX_LENGTH) {
    throw new Error(
      `html exceeds max length ${G10H4C_BANDS_HTML_MAX_LENGTH} (got ${html.length}).`,
    );
  }
}

export function assertG10h4cTotalHtmlLength(
  config: G10h4cAboutContentConfigSnapshot,
  nextBandsHtml: string,
): void {
  const blocks = Array.isArray(config.blocks) ? config.blocks : [];
  let total = 0;
  for (const block of blocks) {
    if (block?.id === G10H4C_TARGET_BLOCK_ID) {
      total += nextBandsHtml.length;
    } else {
      total += String(block?.html ?? "").length;
    }
  }
  if (total > G10H4C_TOTAL_HTML_MAX_LENGTH) {
    throw new Error(
      `total html exceeds max length ${G10H4C_TOTAL_HTML_MAX_LENGTH} (got ${total}).`,
    );
  }
}

export function assertG10h4cConfigSiteSlug(config: G10h4cAboutContentConfigSnapshot): void {
  assertG10h4cSiteSlug(String(config.siteSlug ?? "").trim());
}
