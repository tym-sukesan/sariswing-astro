/**
 * Mio Kisaragi Jazz — Contact page external-link inject from formConfigBundle.
 *
 * Validates via Core contract, renders via site-neutral external-link renderer,
 * then replaces Mio Contact scaffold (disabled form + iframe placeholder).
 * No implicit fixture/config file read. No form POST / script / iframe emit.
 */

import fs from "node:fs";
import path from "node:path";
import { getExternalFormProviderResult } from "./external-form-provider-contract.mjs";
import {
  renderExternalFormFailClosedNoticeHtml,
  renderExternalFormProviderHtml,
} from "./external-form-provider-renderer.mjs";

export const MIO_CONTACT_EXPECTED_SITE_SLUG = "mio-kisaragi-jazz";
export const MIO_CONTACT_EXPECTED_ENVIRONMENT = "staging";

/** Synthetic booking URL — reserved test host · no live customer service. */
export const MIO_CONTACT_EXTERNAL_LINK_FIXTURE_CONFIG = Object.freeze({
  provider: "external-link",
  siteSlug: MIO_CONTACT_EXPECTED_SITE_SLUG,
  environment: MIO_CONTACT_EXPECTED_ENVIRONMENT,
  url: "https://forms.example.invalid/mio-kisaragi-jazz-booking",
  label: "予約・お問い合わせフォームを開く",
  allowedHosts: Object.freeze(["forms.example.invalid"]),
  openInNewTab: true,
});

/**
 * Explicit inject bundle (copy of flat provider config).
 * @param {Record<string, unknown>} [raw]
 */
export function buildMioInjectFormConfigBundle(raw = MIO_CONTACT_EXTERNAL_LINK_FIXTURE_CONFIG) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  /** @type {Record<string, unknown>} */
  const out = { ...raw };
  if (Array.isArray(raw.allowedHosts)) {
    out.allowedHosts = [...raw.allowedHosts];
  }
  return out;
}

/**
 * @param {string} outDir
 */
export function resolveMioContactPagePath(outDir) {
  const candidates = [
    path.join(outDir, "src/pages/contact/index.astro"),
    path.join(outDir, "src/pages/contact.astro"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * @param {string} innerHtml markup from site-neutral renderer
 * @param {{ mode: "external-link" | "notice", reasonCode?: string | null }} meta
 */
export function wrapMioContactExternalMarkup(innerHtml, meta) {
  const mode = meta.mode === "external-link" ? "external-link" : "notice";
  const reasonAttr =
    meta.reasonCode != null && String(meta.reasonCode)
      ? ` data-mio-contact-reason="${String(meta.reasonCode).replace(/"/g, "")}"`
      : "";
  const note =
    mode === "external-link"
      ? `<p class="contact-note" role="status">外部の予約・お問い合わせフォームへ移動します（架空 HTTPS · 実送信なし）。</p>`
      : `<p class="contact-note" role="status">お問い合わせフォームは現在ご利用いただけません。</p>`;
  return [
    `<div class="mio-contact-external" data-mio-contact="${mode}"${reasonAttr}>`,
    note,
    innerHtml,
    `</div>`,
  ].join("\n");
}

/**
 * Replace disabled form + iframe placeholder with external-link (or notice) block.
 * @param {string} pageHtml
 * @param {string} replacementBlock
 */
export function patchMioContactPageHtml(pageHtml, replacementBlock) {
  let next = pageHtml;

  // Remove legacy contact-note that describes the disabled scaffold (best-effort).
  next = next.replace(
    /<p class="contact-note"[^>]*>[\s\S]*?<\/p>\s*/i,
    "",
  );

  if (/<form\b[^>]*\bid=["']mio-contact-form["'][^>]*>[\s\S]*?<\/form>/i.test(next)) {
    next = next.replace(
      /<form\b[^>]*\bid=["']mio-contact-form["'][^>]*>[\s\S]*?<\/form>/i,
      replacementBlock,
    );
  } else if (/data-mio-contact=["']iframe-placeholder["']/.test(next)) {
    next = next.replace(
      /<section class="section"[^>]*aria-labelledby=["']iframe-ph["'][^>]*>[\s\S]*?<\/section>/i,
      replacementBlock,
    );
  } else if (/<p class="lede">[\s\S]*?<\/p>/i.test(next)) {
    next = next.replace(/(<p class="lede">[\s\S]*?<\/p>)/i, `$1\n${replacementBlock}`);
  } else {
    return { ok: false, html: pageHtml, reason: "contact_anchor_not_found" };
  }

  // Drop leftover iframe placeholder section when form replacement already inserted block.
  next = next.replace(
    /<section class="section"[^>]*aria-labelledby=["']iframe-ph["'][^>]*>[\s\S]*?<\/section>\s*/i,
    "",
  );

  return { ok: true, html: next, reason: null };
}

/**
 * @param {string} outDir
 * @param {unknown} formConfigBundle
 */
export function applyMioContactFormPage(outDir, formConfigBundle) {
  if (formConfigBundle == null) {
    return {
      applied: false,
      reason: "mio_form_config_bundle_missing",
      paths: [],
      provider: null,
    };
  }

  const pagePath = resolveMioContactPagePath(outDir);
  if (!pagePath) {
    return {
      applied: false,
      reason: "contact_page_not_found",
      paths: [],
      provider: null,
    };
  }

  const validated = getExternalFormProviderResult(formConfigBundle, {
    expectedSiteSlug: MIO_CONTACT_EXPECTED_SITE_SLUG,
    expectedEnvironment: MIO_CONTACT_EXPECTED_ENVIRONMENT,
  });

  const rendered = renderExternalFormProviderHtml(validated);
  const mode = rendered.rendered === "external-link" ? "external-link" : "notice";
  const block = wrapMioContactExternalMarkup(rendered.html, {
    mode,
    reasonCode: rendered.reasonCode,
  });

  const original = fs.readFileSync(pagePath, "utf8");
  const patched = patchMioContactPageHtml(original, block);
  if (!patched.ok) {
    // Still write fail-closed notice after lede if possible — else abort.
    const noticeOnly = wrapMioContactExternalMarkup(
      renderExternalFormFailClosedNoticeHtml({ reasonCode: patched.reason }),
      { mode: "notice", reasonCode: patched.reason },
    );
    const retry = patchMioContactPageHtml(original, noticeOnly);
    if (!retry.ok) {
      return {
        applied: false,
        reason: patched.reason,
        paths: [],
        provider: validated.ok ? validated.provider : "disabled",
        reasonCode: validated.reasonCode ?? patched.reason,
      };
    }
    fs.writeFileSync(pagePath, retry.html, "utf8");
    return {
      applied: true,
      paths: [pagePath],
      provider: "disabled",
      rendered: "notice",
      reasonCode: patched.reason,
      ok: false,
    };
  }

  fs.writeFileSync(pagePath, patched.html, "utf8");

  return {
    applied: true,
    paths: [pagePath],
    provider: rendered.provider,
    rendered: rendered.rendered,
    reasonCode: rendered.reasonCode,
    ok: rendered.ok && rendered.rendered === "external-link",
    url:
      validated.ok && validated.provider === "external-link"
        ? String(validated.config?.url ?? "")
        : null,
    label:
      validated.ok && validated.provider === "external-link"
        ? String(validated.config?.label ?? "")
        : null,
  };
}
