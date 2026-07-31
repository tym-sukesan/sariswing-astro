/**
 * CMS Core v2 — External form provider renderer (site-neutral).
 *
 * Renders markup from a successful validator result for:
 * - `external-link` (anchor)
 * - `google-forms` (Kit-fixed iframe)
 *
 * No arbitrary HTML input · no operator iframe attributes · no I/O · no site selectors.
 *
 * Phase: cms-core-v2-external-form-provider-google-forms
 */

import {
  getExternalFormProviderResult,
} from "./external-form-provider-contract.mjs";

/** Kit-fixed iframe height (px). No operator style / free height field. */
export const GOOGLE_FORMS_IFRAME_HEIGHT_PX = 720;

/**
 * Minimal sandbox for Google Forms embed (scripts + form POST + same-origin).
 * No allow-top-navigation. Live Forms may still fail in sandbox — offline pilot
 * accepts empty/error iframe chrome; product fallback remains external-link.
 */
export const GOOGLE_FORMS_IFRAME_SANDBOX =
  "allow-scripts allow-forms allow-same-origin allow-popups";

export const GOOGLE_FORMS_IFRAME_REFERRER_POLICY = "strict-origin-when-cross-origin";

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
 * Render Google Forms iframe from a **normalized** validator config.
 * Kit owns all iframe attributes — no operator allow/sandbox/style/srcdoc.
 *
 * @param {Record<string, unknown>} config
 * @returns {{ ok: true, html: string } | { ok: false, reasonCode: string, html: string }}
 */
export function renderGoogleFormsConfigHtml(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {
      ok: false,
      reasonCode: "CONFIG_NOT_OBJECT",
      html: renderExternalFormFailClosedNoticeHtml({ reasonCode: "CONFIG_NOT_OBJECT" }),
    };
  }
  if (config.provider !== "google-forms") {
    return {
      ok: false,
      reasonCode: "PROVIDER_NOT_GOOGLE_FORMS",
      html: renderExternalFormFailClosedNoticeHtml({
        reasonCode: "PROVIDER_NOT_GOOGLE_FORMS",
      }),
    };
  }

  const formUrl = typeof config.formUrl === "string" ? config.formUrl : "";
  const title = typeof config.title === "string" ? config.title : "";
  if (!formUrl || !title) {
    return {
      ok: false,
      reasonCode: "GOOGLE_FORMS_FIELDS_MISSING",
      html: renderExternalFormFailClosedNoticeHtml({
        reasonCode: "GOOGLE_FORMS_FIELDS_MISSING",
      }),
    };
  }

  const recheck = getExternalFormProviderResult(
    {
      provider: "google-forms",
      siteSlug: config.siteSlug,
      environment: config.environment,
      formUrl,
      title,
    },
    {
      expectedSiteSlug: typeof config.siteSlug === "string" ? config.siteSlug : undefined,
      expectedEnvironment:
        config.environment === "staging" || config.environment === "production"
          ? config.environment
          : undefined,
    },
  );
  if (!recheck.ok || recheck.provider !== "google-forms" || !recheck.config) {
    const reasonCode = recheck.reasonCode ?? "REVALIDATE_FAILED";
    return {
      ok: false,
      reasonCode,
      html: renderExternalFormFailClosedNoticeHtml({ reasonCode }),
    };
  }

  const safeSrc = escapeExternalFormHtml(String(recheck.config.formUrl));
  const safeTitle = escapeExternalFormHtml(String(recheck.config.title));
  const height = GOOGLE_FORMS_IFRAME_HEIGHT_PX;

  const html = [
    `<div class="external-form-google-forms" data-external-form="google-forms">`,
    `<iframe`,
    ` class="external-form-google-forms__iframe"`,
    ` data-external-form-iframe="1"`,
    ` src="${safeSrc}"`,
    ` title="${safeTitle}"`,
    ` loading="lazy"`,
    ` referrerpolicy="${GOOGLE_FORMS_IFRAME_REFERRER_POLICY}"`,
    ` sandbox="${GOOGLE_FORMS_IFRAME_SANDBOX}"`,
    ` width="100%"`,
    ` height="${height}"`,
    `></iframe>`,
    `</div>`,
  ].join("");

  return { ok: true, html };
}

/**
 * Render from a full validator result.
 * - external-link → anchor
 * - google-forms → Kit iframe
 * - disabled / failures / other providers → notice (never free HTML)
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

  if (result.provider === "external-link") {
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

  if (result.provider === "google-forms") {
    const frame = renderGoogleFormsConfigHtml(
      /** @type {Record<string, unknown>} */ (result.config),
    );
    if (!frame.ok) {
      return {
        ok: false,
        rendered: "notice",
        provider: "disabled",
        reasonCode: frame.reasonCode,
        html: frame.html,
      };
    }
    return {
      ok: true,
      rendered: "google-forms",
      provider: "google-forms",
      reasonCode: null,
      html: frame.html,
    };
  }

  return {
    ok: false,
    rendered: "notice",
    provider: result.provider,
    reasonCode: "PROVIDER_NOT_RENDERABLE",
    html: renderExternalFormFailClosedNoticeHtml({
      reasonCode: "PROVIDER_NOT_RENDERABLE",
    }),
  };
}
