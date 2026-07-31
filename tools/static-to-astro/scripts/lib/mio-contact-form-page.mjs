/**
 * Mio Kisaragi Jazz — Contact page form inject from formConfigBundle.
 *
 * Supports external-link + google-forms via Core validator + site-neutral renderer.
 * No implicit fixture/config file read. No form POST / operator script.
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
 * Offline-only synthetic Google Forms URL (docs.google.com shape).
 * Not a live customer form · network not required for convert/verify.
 */
export const MIO_CONTACT_GOOGLE_FORMS_FIXTURE_CONFIG = Object.freeze({
  provider: "google-forms",
  siteSlug: MIO_CONTACT_EXPECTED_SITE_SLUG,
  environment: MIO_CONTACT_EXPECTED_ENVIRONMENT,
  formUrl:
    "https://docs.google.com/forms/d/e/1FAIpQLSdMioOfflinePilotFakeFormOnly/viewform?embedded=true",
  title: "お問い合わせ（架空フォーム）",
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
 * @param {{ mode: "external-link" | "google-forms" | "notice", reasonCode?: string | null }} meta
 */
export function wrapMioContactExternalMarkup(innerHtml, meta) {
  const mode =
    meta.mode === "external-link" || meta.mode === "google-forms" ? meta.mode : "notice";
  const reasonAttr =
    meta.reasonCode != null && String(meta.reasonCode)
      ? ` data-mio-contact-reason="${String(meta.reasonCode).replace(/"/g, "")}"`
      : "";
  let note;
  if (mode === "external-link") {
    note =
      `<p class="contact-note" role="status">外部の予約・お問い合わせフォームへ移動します（架空 HTTPS · 実送信なし）。</p>`;
  } else if (mode === "google-forms") {
    note =
      `<p class="contact-note" role="status">Google Forms 埋め込み（offline pilot · 実在フォームなし · ブラウザでは読み込みエラーになり得ます）。</p>`;
  } else {
    note =
      `<p class="contact-note" role="status">お問い合わせフォームは現在ご利用いただけません。</p>`;
  }
  return [
    `<div class="mio-contact-external" data-mio-contact="${mode}"${reasonAttr}>`,
    note,
    innerHtml,
    `</div>`,
  ].join("\n");
}

/**
 * Replace disabled form + iframe placeholder with provider block (or notice).
 * @param {string} pageHtml
 * @param {string} replacementBlock
 */
export function patchMioContactPageHtml(pageHtml, replacementBlock) {
  let next = pageHtml;

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
  /** @type {"external-link" | "google-forms" | "notice"} */
  const mode =
    rendered.rendered === "external-link" || rendered.rendered === "google-forms"
      ? rendered.rendered
      : "notice";
  const block = wrapMioContactExternalMarkup(rendered.html, {
    mode,
    reasonCode: rendered.reasonCode,
  });

  const original = fs.readFileSync(pagePath, "utf8");
  const patched = patchMioContactPageHtml(original, block);
  if (!patched.ok) {
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

  const success =
    rendered.ok &&
    (rendered.rendered === "external-link" || rendered.rendered === "google-forms");

  return {
    applied: true,
    paths: [pagePath],
    provider: rendered.provider,
    rendered: rendered.rendered,
    reasonCode: rendered.reasonCode,
    ok: success,
    url:
      validated.ok && validated.provider === "external-link"
        ? String(validated.config?.url ?? "")
        : null,
    formUrl:
      validated.ok && validated.provider === "google-forms"
        ? String(validated.config?.formUrl ?? "")
        : null,
    label:
      validated.ok && validated.provider === "external-link"
        ? String(validated.config?.label ?? "")
        : null,
    title:
      validated.ok && validated.provider === "google-forms"
        ? String(validated.config?.title ?? "")
        : null,
  };
}
