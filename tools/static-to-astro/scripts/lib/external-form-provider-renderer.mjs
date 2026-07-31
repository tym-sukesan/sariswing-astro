/**
 * CMS Core v2 — External form provider renderer (site-neutral).
 *
 * Renders markup only from a successful validator result for `external-link`.
 * No arbitrary HTML input · no iframe/script · no I/O · no site-specific selectors.
 *
 * Phase: cms-core-v2-external-form-provider-external-link
 */

import {
  getExternalFormProviderResult,
} from "./external-form-provider-contract.mjs";

/**
 * @param {string} text
 */
export function escapeExternalFormHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Safe fail-closed notice (plain text only). No links / scripts / iframes.
 *
 * @param {{ reasonCode?: string | null, message?: string }} [opts]
 */
export function renderExternalFormFailClosedNoticeHtml(opts = {}) {
  const message =
    typeof opts.message === "string" && opts.message.trim()
      ? opts.message.trim()
      : "お問い合わせフォームは現在ご利用いただけません。";
  const reason =
    typeof opts.reasonCode === "string" && opts.reasonCode
      ? ` data-external-form-reason="${escapeExternalFormHtml(opts.reasonCode)}"`
      : "";
  return [
    `<div class="external-form-notice" data-external-form="notice" role="status"${reason}>`,
    `<p class="external-form-notice__text">${escapeExternalFormHtml(message)}</p>`,
    `</div>`,
  ].join("");
}

/**
 * Render external-link anchor from a **normalized** validator config.
 * Caller must ensure config came from getExternalFormProviderResult ok path.
 *
 * @param {Record<string, unknown>} config
 * @returns {{ ok: true, html: string } | { ok: false, reasonCode: string, html: string }}
 */
export function renderExternalLinkConfigHtml(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      ok: false,
      reasonCode: "CONFIG_NOT_OBJECT",
      html: renderExternalFormFailClosedNoticeHtml({ reasonCode: "CONFIG_NOT_OBJECT" }),
    };
  }
  if (config.provider !== "external-link") {
    return {
      ok: false,
      reasonCode: "PROVIDER_NOT_EXTERNAL_LINK",
      html: renderExternalFormFailClosedNoticeHtml({
        reasonCode: "PROVIDER_NOT_EXTERNAL_LINK",
      }),
    };
  }

  const url = typeof config.url === "string" ? config.url : "";
  const label = typeof config.label === "string" ? config.label : "";
  if (!url || !label) {
    return {
      ok: false,
      reasonCode: "EXTERNAL_LINK_FIELDS_MISSING",
      html: renderExternalFormFailClosedNoticeHtml({
        reasonCode: "EXTERNAL_LINK_FIELDS_MISSING",
      }),
    };
  }

  // Defense in depth: re-validate normalized config before emit.
  const recheck = getExternalFormProviderResult(
    {
      provider: "external-link",
      siteSlug: config.siteSlug,
      environment: config.environment,
      url,
      label,
      ...(Array.isArray(config.allowedHosts) ? { allowedHosts: config.allowedHosts } : {}),
      ...(typeof config.openInNewTab === "boolean"
        ? { openInNewTab: config.openInNewTab }
        : {}),
    },
    {
      expectedSiteSlug: typeof config.siteSlug === "string" ? config.siteSlug : undefined,
      expectedEnvironment:
        config.environment === "staging" || config.environment === "production"
          ? config.environment
          : undefined,
    },
  );
  if (!recheck.ok || recheck.provider !== "external-link" || !recheck.config) {
    const reasonCode = recheck.reasonCode ?? "REVALIDATE_FAILED";
    return {
      ok: false,
      reasonCode,
      html: renderExternalFormFailClosedNoticeHtml({ reasonCode }),
    };
  }

  const safeUrl = escapeExternalFormHtml(String(recheck.config.url));
  const safeLabel = escapeExternalFormHtml(String(recheck.config.label));
  const openInNewTab = recheck.config.openInNewTab !== false;
  const targetRel = openInNewTab
    ? ` target="_blank" rel="noopener noreferrer"`
    : ` rel="noopener noreferrer"`;

  const html = [
    `<div class="external-form-link" data-external-form="external-link">`,
    `<a class="external-form-link__anchor" href="${safeUrl}"${targetRel} data-external-form-link="1">${safeLabel}</a>`,
    `</div>`,
  ].join("");

  return { ok: true, html };
}

/**
 * Render from a full validator result. Only `external-link` success emits a link.
 * Other providers / failures → fail-closed notice (never iframe / script / form).
 *
 * @param {import('./external-form-provider-contract.mjs').ExternalFormProviderResult} result
 */
export function renderExternalFormProviderHtml(result) {
  if (!result || typeof result !== "object") {
    return {
      ok: false,
      rendered: "notice",
      provider: "disabled",
      reasonCode: "CONFIG_NOT_OBJECT",
      html: renderExternalFormFailClosedNoticeHtml({ reasonCode: "CONFIG_NOT_OBJECT" }),
    };
  }

  if (!result.ok) {
    const reasonCode = result.reasonCode ?? "VALIDATION_FAILED";
    return {
      ok: false,
      rendered: "notice",
      provider: "disabled",
      reasonCode,
      html: renderExternalFormFailClosedNoticeHtml({ reasonCode }),
    };
  }

  if (result.provider === "disabled") {
    const message =
      typeof result.config?.message === "string" ? result.config.message : undefined;
    return {
      ok: true,
      rendered: "notice",
      provider: "disabled",
      reasonCode: null,
      html: renderExternalFormFailClosedNoticeHtml({
        message: message || "お問い合わせフォームは現在ご利用いただけません。",
        reasonCode: "disabled",
      }),
    };
  }

  if (result.provider !== "external-link") {
    return {
      ok: false,
      rendered: "notice",
      provider: result.provider,
      reasonCode: "PROVIDER_NOT_EXTERNAL_LINK",
      html: renderExternalFormFailClosedNoticeHtml({
        reasonCode: "PROVIDER_NOT_EXTERNAL_LINK",
      }),
    };
  }

  const link = renderExternalLinkConfigHtml(
    /** @type {Record<string, unknown>} */ (result.config),
  );
  if (!link.ok) {
    return {
      ok: false,
      rendered: "notice",
      provider: "disabled",
      reasonCode: link.reasonCode,
      html: link.html,
    };
  }

  return {
    ok: true,
    rendered: "external-link",
    provider: "external-link",
    reasonCode: null,
    html: link.html,
  };
}
